"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { signUp, confirmSignUp } from "aws-amplify/auth";

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState<"register" | "confirm">("register");
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [code, setCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            name: formData.name,
          },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("confirm");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error registro:", err);
      const errorObj = err as { name: string };

      if (errorObj.name === "UsernameExistsException") {
        setError("Este correo ya está registrado.");
      } else if (errorObj.name === "InvalidPasswordException") {
        setError(
          "La contraseña es muy débil (usa mayúsculas, números y símbolos)."
        );
      } else {
        setError("Error al registrar. Intenta nuevamente.");
      }
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: formData.email,
        confirmationCode: code,
      });

      if (isSignUpComplete) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Error confirmación:", err);
      const errorObj = err as { name: string };

      if (errorObj.name === "CodeMismatchException") {
        setError("Código incorrecto. Verifica tu correo.");
      } else {
        setError("Error al verificar.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-900/30 via-slate-950 to-slate-950"></div>

      <div className="bg-slate-900/80 border border-slate-800 w-full max-w-md p-8 rounded-2xl shadow-2xl relative z-10 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            {step === "register" ? "Crear Cuenta" : "Verifica tu Correo"}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {step === "register"
              ? "Comienza a tomar el control de tu dinero hoy."
              : `Hemos enviado un código a ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === "register" && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Nombre Completo
              </label>
              <div className="relative group">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="Tu Nombre"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Registrarme <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {step === "confirm" && (
          <form
            onSubmit={handleVerify}
            className="space-y-6 animate-in fade-in zoom-in-95"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Código de Verificación
              </label>
              <div className="relative group">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600 tracking-widest font-mono text-center text-lg"
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Revisa tu bandeja de entrada o spam.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Verificar Cuenta <CheckCircle2 size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep("register")}
              className="w-full text-sm text-slate-500 hover:text-white transition-colors"
            >
              ¿Te equivocaste de correo? Volver
            </button>
          </form>
        )}

        {step === "register" && (
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
              >
                Inicia Sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
