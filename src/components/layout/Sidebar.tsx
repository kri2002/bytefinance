"use client";

import Link from "next/link";
// 1. IMPORTAMOS EL ROUTER
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PieChart,
  RefreshCcw,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";
import clsx from "clsx";
import { signOut } from "aws-amplify/auth";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transacciones", href: "/transactions", icon: ArrowRightLeft },
  { name: "Pagos Frecuentes", href: "/recurring", icon: RefreshCcw },
  { name: "Deudas", href: "/debts", icon: CreditCard },
  { name: "Categorias", href: "/categories", icon: PieChart },
  { name: "Cuentas", href: "/accounts", icon: Wallet },
];

interface SidebarProps {
  userProfile: {
    name: string;
    email: string;
  };
}

export default function Sidebar({ userProfile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter(); // Instancia del router

  const displayName = userProfile.name || userProfile.email || "...";

  // LOGOUT MANUAL Y FORZADO
  const handleSignOut = async () => {
    try {
      // 1. Borramos sesión en AWS
      await signOut();

      // 2. Forzamos limpieza de caché de Next.js
      router.refresh();

      // 3. Redirigimos manualmente al Login (o a Home, que redirigirá a Login)
      // Usamos replace para que no puedan volver atrás con el botón del navegador
      router.replace("/login");
    } catch (error) {
      console.error("Error al salir:", error);
      // Fallback de emergencia: recarga forzada del navegador
      window.location.href = "/";
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 border-r border-slate-800 p-4 hidden md:flex flex-col z-50">
      <div className="mb-8 flex items-center gap-2 px-2 pt-2">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
          B
        </div>
        <span className="text-xl font-bold tracking-tight text-white">
          ByteFinance
        </span>
      </div>

      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-4 flex items-center gap-2">
        <Link
          href="/settings"
          className="flex-1 flex items-center gap-3 hover:bg-slate-900/80 p-2 rounded-lg transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 p-px relative shrink-0">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs text-white font-bold uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Settings size={10} className="text-slate-300" />
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-500">Mi Cuenta</p>
            <p
              className="text-sm font-medium text-slate-200 truncate w-32"
              title={displayName}
            >
              {displayName}
            </p>
          </div>
        </Link>

        {/* BOTÓN CON NUEVO HANDLER */}
        <button
          onClick={handleSignOut}
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}
