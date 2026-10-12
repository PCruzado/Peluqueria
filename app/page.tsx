import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#FAF7F2] text-[#241D17] flex flex-col items-center justify-center p-5 sm:p-8 overflow-hidden">
      {/* Resplandor cálido decorativo de fondo */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-[#F3E5D3] opacity-60 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-7 py-8">
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E2D6C5] bg-white/90 px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#8C3D15] shadow-xs backdrop-blur-xs">
          <span className="flex h-2 w-2 rounded-full bg-[#C05621]" />
          <span>💈 Barberías & Peluquerías Tucumán</span>
        </div>

        {/* Título principal */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#241D17] leading-[1.08]">
            Tu agenda llena, tus cortes{' '}
            <span className="text-[#C05621]">sin pausas</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6E6356] max-w-md mx-auto leading-relaxed">
            Tus clientes reservan su turno desde Instagram o WhatsApp en menos de un minuto. Simple, automático y descansado a la vista.
          </p>
        </div>

        {/* Botones principales de acción con alto contraste y colores cálidos atractivos */}
        <div className="w-full max-w-sm flex flex-col gap-3.5 pt-2">
          <Link
            href="/barberia-demo"
            className="group w-full rounded-2xl bg-[#C05621] hover:bg-[#A84717] active:scale-[0.99] text-white font-bold py-4 px-6 text-base shadow-lg shadow-[#C05621]/25 hover:shadow-xl hover:shadow-[#C05621]/35 transition-all flex items-center justify-center gap-2"
          >
            <span>Ver Barbería Demo</span>
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          <Link
            href="/login"
            className="w-full rounded-2xl bg-white hover:bg-[#F6EFE6] active:scale-[0.99] text-[#241D17] border-2 border-[#DCD2C4] hover:border-[#C05621] font-bold py-3.5 px-6 text-base shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5 text-[#8C3D15]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Soy Peluquero (Ingresar)</span>
          </Link>
        </div>

        {/* Tarjetas informativas de beneficios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4 text-left">
          <div className="rounded-2xl border border-[#E2D6C5] bg-white p-4 shadow-xs">
            <span className="text-2xl block mb-1.5">⚡</span>
            <p className="font-display font-bold text-sm text-[#241D17]">Rápido</p>
            <p className="text-xs text-[#6E6356] mt-0.5">Elegir servicio y horario toma menos de 45 segundos.</p>
          </div>
          <div className="rounded-2xl border border-[#E2D6C5] bg-white p-4 shadow-xs">
            <span className="text-2xl block mb-1.5">📲</span>
            <p className="font-display font-bold text-sm text-[#241D17]">Recordatorios</p>
            <p className="text-xs text-[#6E6356] mt-0.5">Aviso por WhatsApp automático para evitar ausencias.</p>
          </div>
          <div className="rounded-2xl border border-[#E2D6C5] bg-white p-4 shadow-xs">
            <span className="text-2xl block mb-1.5">💈</span>
            <p className="font-display font-bold text-sm text-[#241D17]">A tu medida</p>
            <p className="text-xs text-[#6E6356] mt-0.5">Configurá turnos online o días por orden de llegada.</p>
          </div>
        </div>
      </div>
    </main>
  );
}