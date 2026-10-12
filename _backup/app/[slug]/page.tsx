import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import BookingFlow from '@/components/booking/BookingFlow';

export default async function BarberPage({ params }: { params: { slug: string } }) {
  const db = createAdminClient();
  const { data: barber } = await db.from('barbers')
    .select('id, slug, business_name, logo_url, address, maps_url, instagram, max_days_ahead')
    .eq('slug', params.slug).single();
  if (!barber) notFound();

  const { data: services } = await db.from('services')
    .select('id, name, price_ars, duration_minutes')
    .eq('barber_id', barber.id).eq('active', true).order('sort_order');

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white pb-10">
      <header className="flex flex-col items-center gap-2 px-4 pt-8 text-center">
        {barber.logo_url && (
          <img src={barber.logo_url} alt={barber.business_name}
               className="h-24 w-24 rounded-full object-cover ring-2 ring-neutral-200" />
        )}
        <h1 className="text-2xl font-bold">{barber.business_name}</h1>
        {barber.address && (
          <a href={barber.maps_url ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barber.address)}`}
             target="_blank" rel="noreferrer" className="text-sm text-neutral-600 underline">
            📍 {barber.address}
          </a>
        )}
        {barber.instagram && (
          <a href={`https://instagram.com/${barber.instagram.replace('@', '')}`}
             target="_blank" rel="noreferrer" className="text-sm text-neutral-600">
            @{barber.instagram.replace('@', '')}
          </a>
        )}
      </header>
      <BookingFlow slug={barber.slug} services={services ?? []} maxDaysAhead={barber.max_days_ahead} />
    </main>
  );
}