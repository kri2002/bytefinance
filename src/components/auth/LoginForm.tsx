'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
// 1. IMPORTAR SIGNIN DE AWS
import { signIn } from 'aws-amplify/auth';

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // 2. ESTADO PARA ERRORES
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        // 3. LÓGICA DE INICIO DE SESIÓN
        const { isSignedIn, nextStep } = await signIn({
            username: formData.email, // En Cognito el 'username' es el email
            password: formData.password
        });

        if (isSignedIn) {
            // Éxito: El LayoutWrapper detectará el cambio de sesión automáticamente.
            // Redirigimos al home por seguridad.
            router.push('/');
        } else {
            // Casos especiales (ej: si Cognito pidiera cambiar password obligatoriamente)
            console.log("Login incompleto, paso siguiente:", nextStep);
            setIsLoading(false);
        }
    } catch (err: any) {
        console.error('Error login:', err);
        // 4. MANEJO DE ERRORES DE USUARIO
        if (err.name === 'NotAuthorizedException') {
            setError('Correo o contraseña incorrectos.');
        } else if (err.name === 'UserNotFoundException') {
            setError('No existe una cuenta con este correo.');
        } else {
            setError('Ocurrió un error inesperado. Intenta más tarde.');
        }
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      
      {/* FONDO DECORATIVO */}
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
            {/* ALERT DE ERROR (Solo se muestra si falla) */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

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