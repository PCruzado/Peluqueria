import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const sans = Figtree({ subsets: ['latin'], variable: '--font-figtree' });

export const metadata: Metadata = {
  title: 'Turnos Peluquerías Tucumán',
  description: 'Sacá tu turno online en menos de un minuto.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF7F2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-[#FAF7F2] text-[#241D17] antialiased selection:bg-[#F1BF9E] selection:text-[#241D17]">
        {children}
      </body>
    </html>
  );
}