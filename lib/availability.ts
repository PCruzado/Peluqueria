// lib/availability.ts
export type DayMode = 'online' | 'walk_in' | 'closed';

export interface WorkingRange { weekday: number; start_time: string; end_time: string; mode: DayMode }
export interface Override { date: string; mode: DayMode }
export interface Busy { starts_at: string; ends_at: string }

export interface AvailabilityInput {
  date: string;                  // 'YYYY-MM-DD' (hora de Tucumán)
  durationMinutes: number;
  stepMinutes: number;
  minNoticeMinutes: number;
  ranges: WorkingRange[];        // working_hours del peluquero
  overrides: Override[];         // date_overrides
  busy: Busy[];                  // turnos 'confirmed' de ese día
  now?: Date;
}

export interface AvailabilityResult {
  mode: DayMode;                 // el front muestra cartel si es 'walk_in' o 'closed'
  slots: string[];               // ISO UTC de cada inicio posible
}

const TZ_OFFSET = '-03:00'; // Tucumán: UTC-3 fijo, sin horario de verano

const toDate = (date: string, hhmm: string) =>
  new Date(`${date}T${hhmm.slice(0, 5)}:00${TZ_OFFSET}`);

const weekdayOf = (date: string) =>
  new Date(`${date}T12:00:00${TZ_OFFSET}`).getUTCDay();

export function getAvailability(input: AvailabilityInput): AvailabilityResult {
  const { date, durationMinutes, stepMinutes, minNoticeMinutes, ranges, overrides, busy } = input;
  const now = input.now ?? new Date();

  // 1) Una excepción por fecha puntual manda sobre el horario semanal
  const override = overrides.find((o) => o.date === date);
  const dayRanges = ranges.filter((r) => r.weekday === weekdayOf(date));

  let mode: DayMode;
  if (override) mode = override.mode;
  else if (dayRanges.length === 0) mode = 'closed';
  else mode = dayRanges.some((r) => r.mode === 'walk_in') ? 'walk_in' : 'online';

  // 2) Orden de llegada o cerrado: NO se generan turnos online
  if (mode !== 'online') return { mode, slots: [] };

  // 3) Si el override fuerza 'online' pero no hay rangos ese día, no hay nada que ofrecer
  const durMs = durationMinutes * 60_000;
  const stepMs = stepMinutes * 60_000;
  const earliest = now.getTime() + minNoticeMinutes * 60_000;
  const busyMs = busy.map((b) => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()]);

  const slots: string[] = [];
  for (const r of dayRanges) {
    const rangeStart = toDate(date, r.start_time).getTime();
    const rangeEnd = toDate(date, r.end_time).getTime();

    for (let t = rangeStart; t + durMs <= rangeEnd; t += stepMs) {
      if (t < earliest) continue;
      const end = t + durMs;
      const overlaps = busyMs.some(([bs, be]) => t < be && end > bs);
      if (!overlaps) slots.push(new Date(t).toISOString());
    }
  }
  return { mode, slots };
}