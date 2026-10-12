import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241D17]">
      <header className="border-b border-[#E2D6C5] bg-white px-6 py-4 shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-[#241D17]">
            <span>💈</span>
            <span>Turnos Tucumán</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold text-[#6E6356]">
            <Link href="/dashboard" className="hover:text-[#C05621] transition-colors">
              Inicio
            </Link>
            <Link href="/dashboard/horarios" className="hover:text-[#C05621] transition-colors">
              Horarios
            </Link>
            <Link href="/dashboard/servicios" className="hover:text-[#C05621] transition-colors">
              Servicios
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}