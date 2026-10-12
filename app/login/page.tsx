'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#241D17] flex flex-col items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8C3D15] hover:text-[#C05621] mb-6 transition-colors"
        >
          <span>←</span>
          <span>Volver al inicio</span>
        </Link>

        <div className="rounded-3xl border border-[#E2D6C5] bg-white p-7 sm:p-9 shadow-sm">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#FDF3EB] border border-[#F1BF9E] text-2xl mx-auto shadow-xs">
              💈
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#241D17]">
              Panel del Peluquero
            </h1>
            <p className="text-sm text-[#6E6356]">
              Ingresá para gestionar tus turnos, horarios y servicios.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#241D17]">Email</span>
              <input
                type="email"
                placeholder="tuemail@ejemplo.com"
                className="h-12 w-full rounded-xl border border-[#D5C9B8] bg-white px-4 text-base text-[#241D17] placeholder:text-[#9E9283] outline-none focus:border-[#C05621] focus:ring-3 focus:ring-[#C05621]/20 transition-all shadow-xs"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#241D17]">Contraseña</span>
              <input
                type="password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-[#D5C9B8] bg-white px-4 text-base text-[#241D17] placeholder:text-[#9E9283] outline-none focus:border-[#C05621] focus:ring-3 focus:ring-[#C05621]/20 transition-all shadow-xs"
              />
            </label>

            <button
              type="submit"
              className="mt-2 h-13 w-full rounded-2xl bg-[#C05621] hover:bg-[#A84717] active:scale-[0.99] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-[#C05621]/25 hover:shadow-xl hover:shadow-[#C05621]/35 transition-all cursor-pointer"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#6E6356]">
            ¿No tenés una cuenta todavía?{' '}
            <Link href="/" className="font-bold text-[#C05621] underline underline-offset-4">
              Consultar por WhatsApp
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}