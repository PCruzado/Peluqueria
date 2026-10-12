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
    'h-13 w-full rounded-2xl bg-[#C05621] hover:bg-[#A84717] active:scale-[0.99] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-[#C05621]/25 hover:shadow-xl hover:shadow-[#C05621]/35 transition-all disabled:bg-[#E2D6C5] disabled:text-[#9A8D7E] disabled:shadow-none disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2';
  const backBtn =
    'mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8C3D15] hover:text-[#C05621] transition-colors cursor-pointer';

  const SlotGroup = ({
    title,
    icon,
    items,
  }: {
    title: string;
    icon: string;
    items: string[];
  }) =>
    items.length === 0 ? null : (
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6E6356]">
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {items.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              aria-pressed={slot === s}
              className={`rounded-xl border py-2.5 text-[15px] font-bold transition-all cursor-pointer ${
                slot === s
                  ? 'border-2 border-[#C05621] bg-[#C05621] text-white shadow-md shadow-[#C05621]/25 scale-[1.02]'
                  : 'border-[#DFD5C7] bg-white text-[#241D17] hover:border-[#C05621] hover:bg-[#FBF6EE] shadow-xs'
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
      <section className="px-5 pb-12 pt-9">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FDF3EB] border-2 border-[#F1BF9E] shadow-xs">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C05621"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m5 12 5 5 9-10" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-[#241D17]">
          ¡Turno confirmado!
        </h2>
        <div className="mt-5 rounded-2xl border border-[#E2D6C5] bg-white p-5 shadow-xs">
          <p className="font-display text-xl font-bold text-[#241D17]">{service!.name}</p>
          <p className="mt-1 capitalize text-sm font-semibold text-[#6E6356]">{longDay(slot!)}</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-[#C05621]">
            {fmtTime(slot!)} hs
          </p>
        </div>
        <p className="mt-4 text-sm text-[#6E6356] leading-relaxed">
          Te vamos a avisar por WhatsApp un día antes y unas horas antes del turno con todos los detalles.
        </p>
        <button onClick={reset} className={`${primaryBtn} mt-7`}>
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
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= STEP_INDEX[step] ? 'bg-[#C05621]' : 'bg-[#E2D6C5]'
            }`}
          />
        ))}
      </div>
      <p className="mb-5 mt-2.5 text-xs font-bold uppercase tracking-wider text-[#8C3D15]">
        Paso {STEP_INDEX[step] + 1} de 3
      </p>

      {/* ---------- Paso 1: servicio ---------- */}
      {step === 'service' && (
        <>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#241D17]">
            Elegí el servicio
          </h2>
          {services.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#E2D6C5] bg-white p-5 text-center text-[#6E6356]">
              Todavía no hay servicios disponibles.
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    setStep('datetime');
                  }}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#E2D6C5] bg-white p-4.5 text-left shadow-xs transition-all hover:border-[#C05621] hover:bg-[#FDFBF7] hover:shadow-md active:scale-[0.99] cursor-pointer"
                >
                  <div>
                    <span className="block font-display text-lg font-bold leading-tight text-[#241D17] group-hover:text-[#C05621] transition-colors">
                      {s.name}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#6E6356] bg-[#F4EFE6] px-2 py-0.5 rounded-md">
                      ⏱ {s.duration_minutes} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-extrabold text-[#C05621]">
                      {money(s.price_ars)}
                    </span>
                    <svg
                      className="w-5 h-5 text-[#C05621] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- Paso 2: día y horario ---------- */}
      {step === 'datetime' && (
        <>
          <button className={backBtn} onClick={() => setStep('service')}>
            <span>←</span>
            <span>Cambiar servicio</span>
          </button>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#241D17]">
            Elegí día y horario
          </h2>
          <p className="mt-1 text-sm text-[#6E6356]">
            {service!.name} · <span className="font-semibold text-[#241D17]">{service!.duration_minutes} minutos</span>
          </p>

          {/* Carrusel horizontal de días */}
          <div className="-mx-5 mt-4 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 pt-1">
            {days.map((d, i) => {
              const ymd = toYmd(d);
              const active = date === ymd;
              return (
                <button
                  key={ymd}
                  onClick={() => setDate(ymd)}
                  aria-pressed={active}
                  className={`w-[4.2rem] shrink-0 snap-start rounded-2xl border py-3 text-center transition-all cursor-pointer ${
                    active
                      ? 'border-2 border-[#C05621] bg-[#C05621] text-white shadow-md shadow-[#C05621]/25 scale-[1.03]'
                      : 'border-[#DFD5C7] bg-white text-[#241D17] hover:border-[#C05621] hover:bg-[#FAF5EC] shadow-xs'
                  }`}
                >
                  <span
                    className={`block text-[11px] font-bold uppercase tracking-wider ${
                      active ? 'text-white/90' : 'text-[#6E6356]'
                    }`}
                  >
                    {i === 0 ? 'hoy' : weekdayShort(d)}
                  </span>
                  <span
                    className={`block font-display text-2xl font-extrabold leading-tight ${
                      active ? 'text-white' : 'text-[#241D17]'
                    }`}
                  >
                    {dayNumber(d)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-5" aria-live="polite">
            {!date && (
              <p className="text-sm text-[#6E6356] bg-white/70 border border-[#E2D6C5] rounded-xl p-3 text-center">
                Elegí un día arriba para ver los horarios disponibles.
              </p>
            )}
            {date && loading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#6E6356]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C05621] border-t-transparent" />
                <span>Buscando horarios disponibles…</span>
              </div>
            )}

            {date && !loading && mode === 'walk_in' && (
              <div className="rounded-2xl border border-[#F1C18D] bg-[#FEF3E6] p-4 text-[#8C3D15] shadow-xs">
                <p className="font-display text-lg font-bold">Ese día se atiende por orden de llegada</p>
                <p className="mt-1 text-sm text-[#8C3D15]/90">
                  No hace falta sacar turno online: podés acercarte al local dentro del horario de atención.
                </p>
              </div>
            )}
            {date && !loading && mode === 'closed' && (
              <div className="rounded-2xl border border-[#E2D6C5] bg-white p-4 shadow-xs">
                <p className="font-display text-lg font-bold text-[#241D17]">Ese día el local está cerrado</p>
                <p className="mt-1 text-sm text-[#6E6356]">Probá seleccionando otro día en el calendario.</p>
              </div>
            )}
            {date && !loading && mode === 'online' && slots.length === 0 && (
              <div className="rounded-2xl border border-[#E2D6C5] bg-white p-4 shadow-xs">
                <p className="font-display text-lg font-bold text-[#241D17]">Ya no quedan horarios ese día</p>
                <p className="mt-1 text-sm text-[#6E6356]">Probá seleccionando otro día disponible.</p>
              </div>
            )}

            {!loading && mode === 'online' && (
              <>
                <SlotGroup title="Mañana" icon="☀️" items={morning} />
                <SlotGroup title="Tarde y noche" icon="🌙" items={afternoon} />
              </>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-[15px] font-semibold text-[#B91C1C]">
              {error}
            </p>
          )}
          <button disabled={!slot} onClick={() => setStep('details')} className={`${primaryBtn} mt-7`}>
            <span>Continuar</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </>
      )}

      {/* ---------- Paso 3: datos ---------- */}
      {step === 'details' && (
        <>
          <button className={backBtn} onClick={() => setStep('datetime')}>
            <span>←</span>
            <span>Cambiar horario</span>
          </button>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#241D17]">
            Tus datos
          </h2>

          <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-[#E2D6C5] bg-white p-4.5 shadow-xs">
            <div>
              <p className="font-display text-lg font-bold leading-tight text-[#241D17]">{service!.name}</p>
              <p className="mt-0.5 text-sm capitalize text-[#6E6356]">{longDay(slot!)}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold leading-tight text-[#C05621]">{fmtTime(slot!)}</p>
              <span className="mt-0.5 inline-block text-xs font-bold text-[#8C3D15] bg-[#FDF3EB] px-2.5 py-0.5 rounded-md border border-[#F1BF9E]">
                {money(service!.price_ars)}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {(
              [
                { k: 'firstName', label: 'Nombre', type: 'text', mode: 'text', auto: 'given-name', placeholder: 'Tu nombre' },
                { k: 'lastName', label: 'Apellido', type: 'text', mode: 'text', auto: 'family-name', placeholder: 'Tu apellido' },
                { k: 'whatsapp', label: 'WhatsApp', type: 'tel', mode: 'tel', auto: 'tel-national', placeholder: 'Ej: 3815551234' },
              ] as const
            ).map((f) => (
              <label key={f.k} className="block">
                <span className="mb-1.5 block text-sm font-bold text-[#241D17]">{f.label}</span>
                <input
                  type={f.type}
                  inputMode={f.mode}
                  autoComplete={f.auto}
                  placeholder={f.placeholder}
                  value={form[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="h-12 w-full rounded-xl border border-[#D5C9B8] bg-white px-4 text-base text-[#241D17] placeholder:text-[#9E9283] outline-none focus:border-[#C05621] focus:ring-3 focus:ring-[#C05621]/20 transition-all shadow-xs"
                />
                {f.k === 'whatsapp' && (
                  <span className="mt-1.5 block text-xs text-[#6E6356]">
                    Con código de área, sin 0 ni 15. Por ejemplo: 3815551234
                  </span>
                )}
              </label>
            ))}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-[15px] font-semibold text-[#B91C1C]">
              {error}
            </p>
          )}
          <button onClick={confirm} disabled={!canBook} className={`${primaryBtn} mt-7`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Reservando…</span>
              </span>
            ) : (
              <span>Confirmar turno</span>
            )}
          </button>
        </>
      )}
    </section>
  );
}