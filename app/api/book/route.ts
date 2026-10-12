import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAvailability } from '@/lib/availability';
import { notifyBarberNewBooking } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  const b = await req.json();
  const { slug, serviceId, startsAt, firstName, lastName, whatsapp } = b;

  const phone = String(whatsapp ?? '').replace(/\D/g, '');
  if (!slug || !serviceId || !startsAt || !firstName?.trim() || !lastName?.trim() || phone.length < 10)
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

  const db = createAdminClient();
  const { data: barber } = await db.from('barbers').select('*').eq('slug', slug).single();
  if (!barber) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { data: service } = await db.from('services').select('*')
    .eq('id', serviceId).eq('barber_id', barber.id).eq('active', true).single();
  if (!service) return NextResponse.json({ error: 'Servicio inválido' }, { status: 400 });

  // Revalidar que ese horario realmente esté libre (no confiar en el cliente)
  const start = new Date(startsAt);
  const date = new Date(start.getTime() - 3 * 3600_000).toISOString().slice(0, 10); // fecha local AR
  const [{ data: ranges }, { data: overrides }, { data: busy }] = await Promise.all([
    db.from('working_hours').select('*').eq('barber_id', barber.id),
    db.from('date_overrides').select('*').eq('barber_id', barber.id).eq('date', date),
    db.from('appointments').select('starts_at, ends_at').eq('barber_id', barber.id)
      .eq('status', 'confirmed')
      .gte('starts_at', `${date}T00:00:00-03:00`).lte('starts_at', `${date}T23:59:59-03:00`),
  ]);
  const { slots } = getAvailability({
    date, durationMinutes: service.duration_minutes, stepMinutes: barber.slot_step_minutes,
    minNoticeMinutes: barber.min_notice_minutes,
    ranges: ranges ?? [], overrides: overrides ?? [], busy: busy ?? [],
  });
  if (!slots.includes(start.toISOString()))
    return NextResponse.json({ error: 'Ese horario ya no está disponible' }, { status: 409 });

  const end = new Date(start.getTime() + service.duration_minutes * 60_000);
  const { data: appt, error } = await db.from('appointments').insert({
    barber_id: barber.id, service_id: service.id,
    client_first_name: firstName.trim(), client_last_name: lastName.trim(),
    client_whatsapp: phone, starts_at: start.toISOString(), ends_at: end.toISOString(),
  }).select().single();

  // 23P01 = exclusion_violation → alguien reservó en el mismo instante
  if (error?.code === '23P01')
    return NextResponse.json({ error: 'Ese horario acaba de ser tomado' }, { status: 409 });
  if (error) return NextResponse.json({ error: 'Error al reservar' }, { status: 500 });

  // Notificar al peluquero sin bloquear la respuesta al cliente
  notifyBarberNewBooking({ barber, service, appt }).catch(console.error);

  return NextResponse.json({ ok: true, appointmentId: appt.id });
}