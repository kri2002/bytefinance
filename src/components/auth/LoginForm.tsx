'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        router.push('/');
    }, 1500);
  };

  return (
    // Quitamos "min-h-screen" de aquí porque ya lo tiene el LayoutWrapper
    // Usamos w-full para asegurar que se centre bien
    <div className="w-full flex items-center justify-center p-4">
      
      {/* FONDO DECORATIVO MEJORADO (Sin cortes) */}
      {/* Este div se posiciona fijo respecto a la ventana, creando un brillo azul arriba */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>

      <div className="bg-slate-900/80 border border-slate-800 w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
                <span className="font-bold text-white text-xl">B</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
            <p className="text-slate-400 mt-2 text-sm">Ingresa a tu cuenta para gestionar tus finanzas.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="email" 
                        required
                        placeholder="ejemplo@bytefinance.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Contraseña</label>
                    <Link href="#" className="text-xs text-blue-400 hover:text-blue-300">¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Ingresar <ArrowRight size={18} /></>}
            </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
                ¿No tienes una cuenta? <Link href="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">Regístrate aquí</Link>
            </p>
        </div>
      </div>
    </div>
  );
}