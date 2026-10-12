import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAvailability } from '@/lib/availability';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const slug = p.get('slug'), date = p.get('date'), serviceId = p.get('serviceId');
  if (!slug || !date || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });

  const db = createAdminClient();
  const { data: barber } = await db.from('barbers').select('*').eq('slug', slug).single();
  if (!barber) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const { data: service } = await db.from('services').select('duration_minutes')
    .eq('id', serviceId).eq('barber_id', barber.id).eq('active', true).single();
  if (!service) return NextResponse.json({ error: 'Servicio inválido' }, { status: 400 });

  const dayStart = `${date}T00:00:00-03:00`, dayEnd = `${date}T23:59:59-03:00`;
  const [{ data: ranges }, { data: overrides }, { data: busy }] = await Promise.all([
    db.from('working_hours').select('*').eq('barber_id', barber.id),
    db.from('date_overrides').select('*').eq('barber_id', barber.id).eq('date', date),
    db.from('appointments').select('starts_at, ends_at').eq('barber_id', barber.id)
      .eq('status', 'confirmed').gte('starts_at', dayStart).lte('starts_at', dayEnd),
  ]);

  const result = getAvailability({
    date,
    durationMinutes: service.duration_minutes,
    stepMinutes: barber.slot_step_minutes,
    minNoticeMinutes: barber.min_notice_minutes,
    ranges: ranges ?? [], overrides: overrides ?? [], busy: busy ?? [],
  });
  return NextResponse.json(result);
}