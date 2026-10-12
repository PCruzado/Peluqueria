import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTemplate } from '@/lib/whatsapp';

// Ventanas: el cron corre cada 10 min, así que cada recordatorio "cae" en una ventana.
const WINDOWS = [
  { type: 'reminder_24h', template: 'recordatorio_24h', fromMin: 23 * 60 + 30, toMin: 24 * 60 + 30 },
  { type: 'reminder_2h',  template: 'recordatorio_2h',  fromMin: 2 * 60 + 30,  toMin: 3 * 60 + 30 },
] as const;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const now = Date.now();
  let sent = 0;

  for (const w of WINDOWS) {
    const { data: appts } = await db.from('appointments')
      .select('id, client_first_name, client_whatsapp, starts_at, barbers(business_name, address)')
      .eq('status', 'confirmed')
      .gte('starts_at', new Date(now + w.fromMin * 60_000).toISOString())
      .lte('starts_at', new Date(now + w.toMin * 60_000).toISOString());

    for (const a of (appts ?? []) as any[]) {
      // Idempotencia: unique(appointment_id, type) hace fallar el 2º insert
      const { error: lock } = await db.from('notifications')
        .insert({ appointment_id: a.id, type: w.type, channel: 'whatsapp', status: 'sending' });
      if (lock) continue;

      const hora = new Date(a.starts_at).toLocaleTimeString('es-AR',
        { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Tucuman' });
      try {
        // Plantilla: {{1}} nombre, {{2}} peluquería, {{3}} dirección, {{4}} hora
        await sendTemplate(a.client_whatsapp, w.template,
          [a.client_first_name, a.barbers.business_name, a.barbers.address ?? '-', hora]);
        await db.from('notifications').update({ status: 'sent' })
          .eq('appointment_id', a.id).eq('type', w.type);
        sent++;
      } catch (e: any) {
        await db.from('notifications').update({ status: 'failed', error: String(e.message) })
          .eq('appointment_id', a.id).eq('type', w.type);
      }
    }
  }
  return NextResponse.json({ sent });
}