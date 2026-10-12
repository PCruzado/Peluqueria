'use client';
import { useEffect, useMemo, useState } from 'react';

type Service = { id: string; name: string; price_ars: number; duration_minutes: number };
type Step = 'service' | 'datetime' | 'details' | 'done';
type Mode = 'online' | 'walk_in' | 'closed';

const TZ = 'America/Argentina/Tucuman';

const weekdayShort = (d: Date) =>
  d.toLocaleDateString('es-AR', { weekday: 'short', timeZone: TZ }).replace('.', '');
const dayNumber = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', timeZone: TZ });
const longDay = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const toYmd = (d: Date) => new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
const localHour = (iso: string) => (new Date(iso).getUTCHours() + 21) % 24; // UTC-3 fijo
const money = (n: number) => `$${n.toLocaleString('es-AR')}`;

const STEP_INDEX: Record<Step, number> = { service: 0, datetime: 1, details: 2, done: 3 };

export default function BookingFlow({
  slug,
  services,
  maxDaysAhead,
}: {
  slug: string;
  services: Service[];
  maxDaysAhead: number;
}) {
  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('online');
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({ firstName: '', lastName: '', whatsapp: '' });
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: maxDaysAhead }, (_, i) => new Date(Date.now() + i * 86_400_000)),
    [maxDaysAhead]
  );

  useEffect(() => {
    if (!service || !date) return;
    let ignore = false;
    setLoading(true);
    setSlot(null);
    setSlots([]);
    fetch(`/api/slots?slug=${slug}&date=${date}&serviceId=${service.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (ignore) return;
        setMode(d.mode ?? 'online');
        setSlots(d.slots ?? []);
      })
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [service, date, slug, refresh]);

  async function confirm() {
    setError(null);
    setLoading(true);
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, serviceId: service!.id, startsAt: slot, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'No pudimos reservar el turno. Probá de nuevo.');
      if (res.status === 409) {
        setStep('datetime');
        setSlot(null);
        setRefresh((r) => r + 1);
      }
      return;
    }
    setStep('done');
  }

  function reset() {
    setStep('service');
    setService(null);
    setDate(null);
    setSlot(null);
    setSlots([]);
    setError(null);
    setForm({ firstName: '', lastName: '', whatsapp: '' });
  }

  const morning = slots.filter((s) => localHour(s) < 14);
  const afternoon = slots.filter((s) => localHour(s) >= 14);
  const phoneOk = form.whatsapp.replace(/\D/g, '').length >= 10;
  const canBook = !!form.firstName.trim() && !!form.lastName.trim() && phoneOk && !loading;

  const primaryBtn =
    'h-13 w-full rounded-xl bg-ink px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-moss disabled:bg-line disabled:text-muted';
  const backBtn = 'mb-4 text-sm font-medium text-muted underline underline-offset-4';

  const SlotGroup = ({ title, items }: { title: string; items: string[] }) =>
    items.length === 0 ? null : (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted">{title}</h3>
        <div className="grid grid-cols-4 gap-2">
          {items.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              aria-pressed={slot === s}
              className={`rounded-xl border py-2.5 text-[15px] font-medium transition-colors ${
                slot === s
                  ? 'border-ink bg-lemon font-bold text-ink'
                  : 'border-line bg-white hover:border-ink'
              }`}
            >
              {fmtTime(s)}
            </button>
          ))}
        </div>
      </div>
    );

  /* ---------- Turno confirmado ---------- */
  if (step === 'done')
    return (
      <section className="px-5 pb-12 pt-10">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-lemon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#12261f"
               strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12 5 5 9-10" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight">Turno confirmado</h2>
        <div className="mt-5 rounded-xl border border-line bg-white p-4">
          <p className="font-display text-xl font-bold">{service!.name}</p>
          <p className="mt-1 capitalize text-muted">{longDay(slot!)}</p>
          <p className="font-display text-3xl font-extrabold">{fmtTime(slot!)} hs</p>
        </div>
        <p className="mt-4 text-muted">
          Te vamos a avisar por WhatsApp un día antes y unas horas antes del turno.
        </p>
        <button onClick={reset} className={`${primaryBtn} mt-6`}>
          Reservar otro turno
        </button>
      </section>
    );

  return (
    <section className="px-5 pb-12 pt-7">
      {/* Progreso: es una secuencia real de 3 pasos */}
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= STEP_INDEX[step] ? 'bg-ink' : 'bg-line'}`}
          />
        ))}
      </div>
      <p className="mb-5 mt-2 text-sm text-muted">Paso {STEP_INDEX[step] + 1} de 3</p>

      {/* ---------- Paso 1: servicio ---------- */}
      {step === 'service' && (
        <>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Elegí el servicio</h2>
          {services.length === 0 ? (
            <p className="mt-4 text-muted">Todavía no hay servicios cargados.</p>
          ) : (
            <ul className="mt-3 border-t border-line">
              {services.map((s) => (
                <li key={s.id} className="border-b border-line">
                  <button
                    onClick={() => {
                      setService(s);
                      setStep('datetime');
                    }}
                    className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left transition-colors hover:bg-white"
                  >
                    <span>
                      <span className="block font-display text-xl font-bold leading-tight">{s.name}</span>
                      <span className="text-sm text-muted">{s.duration_minutes} minutos</span>
                    </span>
                    <span className="font-display text-xl font-bold">{money(s.price_ars)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ---------- Paso 2: día y horario ---------- */}
      {step === 'datetime' && (
        <>
          <button className={backBtn} onClick={() => setStep('service')}>
            Cambiar servicio
          </button>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Elegí día y horario</h2>
          <p className="mt-1 text-muted">
            {service!.name}, {service!.duration_minutes} minutos
          </p>

          <div className="-mx-5 mt-4 flex snap-x gap-2 overflow-x-auto px-5 pb-2">
            {days.map((d, i) => {
              const ymd = toYmd(d);
              const active = date === ymd;
              return (
                <button
                  key={ymd}
                  onClick={() => setDate(ymd)}
                  aria-pressed={active}
                  className={`w-[3.9rem] shrink-0 snap-start rounded-xl border py-2.5 text-center transition-colors ${
                    active ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'
                  }`}
                >
                  <span className="block text-xs font-medium capitalize">
                    {i === 0 ? 'hoy' : weekdayShort(d)}
                  </span>
                  <span className="block font-display text-2xl font-extrabold leading-tight">
                    {dayNumber(d)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-5" aria-live="polite">
            {!date && <p className="text-muted">Elegí un día para ver los horarios.</p>}
            {date && loading && <p className="text-muted">Buscando horarios…</p>}

            {date && !loading && mode === 'walk_in' && (
              <div className="rounded-xl bg-lemon p-4 text-ink">
                <p className="font-display text-lg font-bold">Ese día se atiende por orden de llegada</p>
                <p className="mt-1 text-[15px]">
                  No hace falta sacar turno. Pasá por el local en el horario de atención.
                </p>
              </div>
            )}
            {date && !loading && mode === 'closed' && (
              <div className="rounded-xl border border-line bg-white p-4">
                <p className="font-display text-lg font-bold">Ese día el local está cerrado</p>
                <p className="mt-1 text-[15px] text-muted">Probá con otro día.</p>
              </div>
            )}
            {date && !loading && mode === 'online' && slots.length === 0 && (
              <div className="rounded-xl border border-line bg-white p-4">
                <p className="font-display text-lg font-bold">Ya no quedan horarios ese día</p>
                <p className="mt-1 text-[15px] text-muted">Probá con otro día.</p>
              </div>
            )}

            {!loading && mode === 'online' && (
              <>
                <SlotGroup title="Mañana" items={morning} />
                <SlotGroup title="Tarde y noche" items={afternoon} />
              </>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-[15px] font-medium text-alert">
              {error}
            </p>
          )}
          <button disabled={!slot} onClick={() => setStep('details')} className={`${primaryBtn} mt-6`}>
            Continuar
          </button>
        </>
      )}

      {/* ---------- Paso 3: datos ---------- */}
      {step === 'details' && (
        <>
          <button className={backBtn} onClick={() => setStep('datetime')}>
            Cambiar horario
          </button>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Tus datos</h2>

          <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <div>
              <p className="font-display text-lg font-bold leading-tight">{service!.name}</p>
              <p className="mt-0.5 text-sm capitalize text-muted">{longDay(slot!)}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold leading-tight">{fmtTime(slot!)}</p>
              <p className="text-sm text-muted">{money(service!.price_ars)}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {(
              [
                { k: 'firstName', label: 'Nombre', type: 'text', mode: 'text', auto: 'given-name' },
                { k: 'lastName', label: 'Apellido', type: 'text', mode: 'text', auto: 'family-name' },
                { k: 'whatsapp', label: 'WhatsApp', type: 'tel', mode: 'tel', auto: 'tel-national' },
              ] as const
            ).map((f) => (
              <label key={f.k} className="block">
                <span className="mb-1.5 block text-sm font-semibold">{f.label}</span>
                <input
                  type={f.type}
                  inputMode={f.mode}
                  autoComplete={f.auto}
                  value={form[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
                />
                {f.k === 'whatsapp' && (
                  <span className="mt-1.5 block text-sm text-muted">
                    Con código de área, sin 0 ni 15. Por ejemplo: 3815551234
                  </span>
                )}
              </label>
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-[15px] font-medium text-alert">
              {error}
            </p>
          )}
          <button onClick={confirm} disabled={!canBook} className={`${primaryBtn} mt-6`}>
            {loading ? 'Reservando…' : 'Confirmar turno'}
          </button>
        </>
      )}
    </section>
  );
}