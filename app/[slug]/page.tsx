import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import BookingFlow from '@/components/booking/BookingFlow';
import { Suspense } from 'react';

export async function generateStaticParams() {
  return [{ slug: 'barberia-demo' }];
}

async function BarberContent({ slug }: { slug: string }) {
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
    <main className="mx-auto min-h-screen max-w-md bg-[#FAF7F2] sm:border-x sm:border-[#E2D6C5] shadow-xs">
      <header className="bg-[#241D17] text-[#FAF7F2]">
        <div className="px-5 pb-8 pt-9">
          {barber.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={barber.logo_url}
              alt={barber.business_name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-[#E0834B] shadow-md"
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#C05621] font-display text-3xl font-extrabold text-white shadow-md">
              {initial}
            </div>
          )}

          <h1 className="mt-5 break-words font-display text-[2.5rem] font-extrabold leading-[1.02] tracking-tight text-[#FAF7F2]">
            {barber.business_name}
          </h1>

          <div className="mt-4 flex flex-col gap-1.5 text-[15px] text-[#DDD4C9]">
            {barber.address && (
              <a
                href={
                  barber.maps_url ??
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barber.address)}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-2 underline decoration-[#DDD4C9]/40 underline-offset-4 hover:text-white transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mt-0.5 shrink-0 text-[#E0834B]"
                  aria-hidden
                >
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
                className="underline decoration-[#DDD4C9]/40 underline-offset-4 hover:text-white transition-colors"
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

export default async function BarberPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] text-[#241D17] grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#C05621] border-t-transparent" />
            <p className="text-sm font-semibold text-[#6E6356]">Cargando barbería…</p>
          </div>
        </div>
      }
    >
      <BarberContent slug={slug} />
    </Suspense>
  );
}