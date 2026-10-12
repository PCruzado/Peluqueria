import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import BookingFlow from '@/components/booking/BookingFlow';

export default async function BarberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const db = createAdminClient();
  const { data: barber } = await db
    .from('barbers')
    .select('id, slug, business_name, logo_url, address, maps_url, instagram, max_days_ahead')
    .eq('slug', slug)
    .single();

  if (!barber) notFound();

  const { data: services } = await db
    .from('services')
    .select('id, name, price_ars, duration_minutes')
    .eq('barber_id', barber.id)
    .eq('active', true)
    .order('sort_order');

  const handle = barber.instagram?.replace('@', '');
  const initial = barber.business_name.trim().charAt(0).toUpperCase();

  return (
    <main className="mx-auto min-h-screen max-w-md bg-mist sm:border-x sm:border-line">
      <header className="bg-ink text-white">
        <div className="px-5 pb-8 pt-9">
          {barber.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={barber.logo_url}
              alt={barber.business_name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-lemon"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-lemon font-display text-3xl font-extrabold text-ink">
              {initial}
            </div>
          )}

          <h1 className="mt-6 break-words font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight">
            {barber.business_name}
          </h1>

          <div className="mt-4 flex flex-col gap-1.5 text-[15px] text-white/85">
            {barber.address && (
              <a
                href={
                  barber.maps_url ??
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barber.address)}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-2 underline decoration-white/40 underline-offset-4"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden>
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {barber.address}
              </a>
            )}
            {handle && (
              <a
                href={`https://instagram.com/${handle}`}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/40 underline-offset-4"
              >
                @{handle}
              </a>
            )}
          </div>
        </div>
        <div className="pole" />
      </header>

      <BookingFlow
        slug={barber.slug}
        services={services ?? []}
        maxDaysAhead={barber.max_days_ahead}
      />
    </main>
  );
}