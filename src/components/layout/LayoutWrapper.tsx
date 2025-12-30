'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isAuthPage = ['/login', '/register'].includes(pathname);

  if (isAuthPage) {
    // MODO AUTH: Limpio, sin márgenes, ocupa toda la pantalla
    return (
      <main className="min-h-screen w-full bg-slate-950 relative flex items-center justify-center">
        {children}
      </main>
    );
  }

  // MODO DASHBOARD: Estructura con Sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      {/* Aquí sí aplicamos el margen para el sidebar */}
      <main className="flex-1 md:ml-64 h-full overflow-y-auto p-4 md:p-8 relative">
        {children}
      </main>
    </div>
  );
}