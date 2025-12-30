'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Save, Calendar, Tag, CheckCircle2, Clock } from 'lucide-react';

interface ExpensePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: { name: string; amount: string; date: string; status: 'paid' | 'pending' }) => void;
}

export default function ExpensePanel({ isOpen, onClose, onSave }: ExpensePanelProps) {
  const getTodayString = () => {
    const d = new Date();
    return d.toLocaleDateString('en-CA');
  };

  const [form, setForm] = useState({
    name: '',
    amount: '',
    date: getTodayString(),
    status: 'pending' as 'paid' | 'pending' 
  });

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const toggleStatus = () => {
    setForm(prev => ({
      ...prev,
      status: prev.status === 'paid' ? 'pending' : 'paid'
    }));
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setForm({ name: '', amount: '', date: getTodayString(), status: 'pending' });
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    
    onSave(form);
    setForm({ name: '', amount: '', date: getTodayString(), status: 'pending' }); 
  };

  const formatPreview = (val: string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 h-full bg-black/60 z-90 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose} 
      />

      <div 
        className={`fixed top-0 right-0 z-100 h-dvh w-full md:w-112.5 bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white">Registrar Gasto</h2>
                <p className="text-sm text-slate-400">Gasolina, comida, reparaciones...</p>
              </div>
              <button 
                onClick={handleClose} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Calendar size={16} />
                    Fecha del Gasto
                </label>
                <input 
                    type="date" 
                    name="date"
                    max={getTodayString()}
                    value={form.date}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all scheme-dark"
                />
              </div>

              <hr className="border-slate-800" />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <Tag size={16} />
                    Concepto
                </label>
                <input 
                  type="text" 
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Ej. Gasolina Magna"
                  autoComplete="off"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-rose-400">
                    <DollarSign size={16} />
                    Monto
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors">
                    <DollarSign size={18} />
                  </div>
                  <input 
                    type="number" 
                    name="amount"
                    value={form.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* TOGGLE STATUS */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    Estado del pago
                </label>
                <button
                    type="button"
                    onClick={toggleStatus}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        form.status === 'paid' 
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' 
                            : 'bg-amber-950/30 border-amber-500/50 text-amber-400'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {form.status === 'paid' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                        <span className="font-medium text-lg">
                            {form.status === 'paid' ? 'Pagado' : 'Pendiente de pago'}
                        </span>
                    </div>
                    <div className="text-xs opacity-70">
                        Click para cambiar
                    </div>
                </button>
              </div>

            </form>

            <div className="p-5 border-t border-slate-800 bg-slate-900/50 space-y-3 pb-safe">
                <div className="flex justify-between text-sm text-slate-400 px-1">
                    <span>Gasto a registrar:</span>
                    <span className="font-bold text-rose-400">
                        {formatPreview(form.amount)}
                    </span>
                </div>
                <button 
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-900/40 hover:shadow-rose-900/60 hover:-translate-y-0.5"
                >
                  <Save size={20} /> Guardar Gasto
                </button>
            </div>
        </div>
      </div>
    </>
  );
}