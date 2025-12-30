"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Save, Calendar } from "lucide-react";

interface DailyClosingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: {
    didi: string;
    uber: string;
    cash: string;
    date: string;
  }) => void;
}

export default function DailyClosingPanel({
  isOpen,
  onClose,
  onSave,
}: DailyClosingPanelProps) {
  const getTodayString = () => {
    const d = new Date();
    return d.toLocaleDateString("en-CA");
  };

  const [form, setForm] = useState({
    didi: "",
    uber: "",
    cash: "",
    date: getTodayString(),
  });

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setForm({ didi: "", uber: "", cash: "", date: getTodayString() });
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setForm({ didi: "", uber: "", cash: "", date: getTodayString() });
  };

  const formatPreview = (val: string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);
  };

  const totalEstimated =
    Number(form.didi) + Number(form.uber) + Number(form.cash);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-90 h-full backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed top-0 right-0 z-100 h-dvh w-full md:w-112.5 bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold text-white">Cierre Diario</h2>
              <p className="text-sm text-slate-400">Registra tus ingresos.</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar"
          >
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Calendar size={16} />
                Fecha del Registro
              </label>
              <input
                type="date"
                name="date"
                max={getTodayString()}
                value={form.date}
                onChange={handleInputChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all scheme-dark"
              />
            </div>

            <hr className="border-slate-800" />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                Didi Card
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  name="didi"
                  value={form.didi}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"></span>
                Uber Card
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  name="uber"
                  value={form.uber}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                Efectivo (Mano)
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  name="cash"
                  value={form.cash}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-3 pb-safe">
            <div className="flex justify-between text-sm text-slate-400 px-1">
              <span>Total Ingreso Estimado:</span>
              <span className="font-bold text-emerald-400">
                {formatPreview(totalEstimated.toString())}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:-translate-y-0.5"
            >
              <Save size={20} /> Confirmar Cierre
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
