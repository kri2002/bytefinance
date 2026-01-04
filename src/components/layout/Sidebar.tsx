'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, ArrowRightLeft, Settings, PieChart, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pagos Frecuentes', href: '/recurring', icon: RefreshCcw },
  { name: 'Transacciones', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Categorias', href: '/categories', icon: PieChart },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  // NOTA: Ya no necesitamos ocultarlo aquí, el LayoutWrapper lo hace por nosotros.

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 p-4 hidden md:flex flex-col z-50">
      
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-2 pt-2">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
          B
        </div>
        <span className="text-xl font-bold tracking-tight text-white">ByteFinance</span>
      </div>

      {/* Menú de Navegación */}
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar (Usuario) */}
      <div className="mt-auto border-t border-slate-800 pt-4">
        <div className="px-2 py-2 flex items-center gap-3 hover:bg-slate-900/50 rounded-lg cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-500 to-emerald-500 p-px">
             <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs text-white font-bold">
                CA
             </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-500">Sesión iniciada</p>
            <p className="text-sm font-medium text-slate-200 truncate w-32">Cristo Aguilar</p>
          </div>
        </div>
      </div>
    </aside>
  );
}