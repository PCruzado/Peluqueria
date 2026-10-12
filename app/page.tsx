import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Turnos Peluquerías <span className="text-indigo-400">Tucumán</span>
        </h1>
        <p className="text-gray-400 text-sm">
          La solución simple para que tus clientes saquen turno desde Instagram o WhatsApp sin interrumpir tus cortes.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/barberia-demo"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Ver Barbería Demo
          </Link>
          <Link
            href="/login"
            className="w-full bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition"
          >
            Soy Peluquero (Ingresar)
          </Link>
        </div>
      </div>
    </main>
  );
}