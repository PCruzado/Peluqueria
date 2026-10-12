'use client';
import { useEffect, useMemo, useState } from 'react';

type Service = { id: string; name: string; price_ars: number; duration_minutes: number };
type Step = 'service' | 'datetime' | 'details' | 'done';

const fmtDay = (d: Date) =>
  d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Argentina/Tucuman' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Tucuman' });
const toYmd = (d: Date) =>
  new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

export default function BookingFlow({ slug, services, maxDaysAhead }:
  { slug: string; services: Service[]; maxDaysAhead: number }) {
  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [mode, setMode] = useState<'online' | 'walk_in' | 'closed'>('online');
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', whatsapp: '' });
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: maxDaysAhead }, (_, i) => new Date(Date.now() + i * 86_400_000)),
    [maxDaysAhead]
  );

  useEffect(() => {
    if (!service || !date) return;
    setLoading(true); setSlot(null);
    fetch(`/api/slots?slug=${slug}&date=${date}&serviceId=${service.id}`)
      .then((r) => r.json())
      .then((d) => { setMode(d.mode); setSlots(d.slots ?? []); })
      .finally(() => setLoading(false));
  }, [service, date, slug]);

  async function confirm() {
    setError(null); setLoading(true);
    const res = await fetch('/api/book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, serviceId: service!.id, startsAt: slot, ...form }),
    });
    const data = await res.json(); setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'No se pudo reservar');
      if (res.status === 409) { setStep('datetime'); setSlot(null); setDate((d) => d && `${d}`); }
      return;
    }
    setStep('done');
  }

  const card = 'w-full rounded-xl border border-neutral-200 p-4 text-left active:scale-[0.98]';

  if (step === 'done')
    return (
      <section className="px-4 pt-10 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 text-xl font-semibold">¡Turno confirmado!</h2>
        <p className="mt-2 text-neutral-600">
          {service!.name} · {fmtDay(new Date(slot!))} {fmtTime(slot!)} hs.<br />
          Te vamos a enviar recordatorios por WhatsApp.
        </p>
      </section>
    );

  return (
    <section className="space-y-4 px-4 pt-6">
      {step === 'service' && (
        <>
          <h2 className="text-lg font-semibold">1. Elegí el servicio</h2>
          {services.map((s) => (
            <button key={s.id} className={card}
              onClick={() => { setService(s); setStep('datetime'); }}>
              <div className="flex justify-between font-medium">
                <span>{s.name}</span><span>${s.price_ars.toLocaleString('es-AR')}</span>
              </div>
              <div className="text-sm text-neutral-500">{s.duration_minutes} min</div>
            </button>
          ))}
        </>
      )}

      {step === 'datetime' && (
        <>
          <button className="text-sm text-neutral-500" onClick={() => setStep('service')}>← Cambiar servicio</button>
          <h2 className="text-lg font-semibold">2. Elegí día y horario</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => {
              const ymd = toYmd(d);
              return (
                <button key={ymd} onClick={() => setDate(ymd)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-sm capitalize ${
                    date === ymd ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                  {fmtDay(d)}
                </button>
              );
            })}
          </div>

          {date && loading && <p className="text-sm text-neutral-500">Buscando horarios…</p>}
          {date && !loading && mode === 'walk_in' && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Ese día se atiende por <b>orden de llegada</b>. No hace falta sacar turno: acercate al local.
            </div>
          )}
          {date && !loading && mode === 'closed' && (
            <div className="rounded-lg bg-neutral-100 p-3 text-sm">Ese día no se atiende.</div>
          )}
          {date && !loading && mode === 'online' && slots.length === 0 && (
            <div className="rounded-lg bg-neutral-100 p-3 text-sm">No quedan horarios ese día. Probá con otro.</div>
          )}
          {mode === 'online' && slots.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button key={s} onClick={() => setSlot(s)}
                  className={`rounded-lg border py-2 text-sm ${
                    slot === s ? 'border-black bg-black text-white' : 'border-neutral-300'}`}>
                  {fmtTime(s)}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={!slot} onClick={() => setStep('details')}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-30">
            Continuar
          </button>
        </>
      )}

      {step === 'details' && (
        <>
          <button className="text-sm text-neutral-500" onClick={() => setStep('datetime')}>← Cambiar horario</button>
          <h2 className="text-lg font-semibold">3. Tus datos</h2>
          <p className="text-sm text-neutral-600">
            {service!.name} · {fmtDay(new Date(slot!))} {fmtTime(slot!)} hs
          </p>
          {(['firstName', 'lastName', 'whatsapp'] as const).map((k) => (
            <input key={k} value={form[k]} inputMode={k === 'whatsapp' ? 'tel' : 'text'}
              placeholder={{ firstName: 'Nombre', lastName: 'Apellido', whatsapp: 'WhatsApp (ej. 3815551234)' }[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3" />
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={confirm}
            disabled={loading || !form.firstName || !form.lastName || form.whatsapp.replace(/\D/g, '').length < 10}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-30">
            {loading ? 'Reservando…' : 'Confirmar reserva'}
          </button>
        </>
      )}
    </section>
  );
}