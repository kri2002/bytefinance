'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); router.push('/'); }, 1500);
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      
      {/* FONDO DECORATIVO (Estilo Esmeralda para registro) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-slate-950 to-slate-950"></div>

      <div className="bg-slate-900/80 border border-slate-800 w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
            <p className="text-slate-400 mt-2 text-sm">Comienza a tomar el control de tu dinero hoy.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nombre Completo</label>
                <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input type="text" required placeholder="Tu Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600" />
                </div>
            </div>
            {/* ... Resto de inputs (Email, Password) ... */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input type="email" required placeholder="correo@ejemplo.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600" />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Contraseña</label>
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600" />
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Registrarme <ArrowRight size={18} /></>}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
                ¿Ya tienes cuenta? <Link href="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">Inicia Sesión</Link>
            </p>
        </div>
      </div>
    </div>
  );
}