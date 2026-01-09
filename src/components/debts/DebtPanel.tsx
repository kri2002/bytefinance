"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Save, CreditCard, Calendar, DollarSign, Hash, Layers, Calculator, Clock } from "lucide-react";

interface DebtPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function DebtPanel({ isOpen, onClose, onSave }: DebtPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: "",
    totalAmount: "",
    minimumPayment: "",
    nextPaymentDate: today,
    paymentFrequency: "monthly",
    isInstallments: true,
    totalInstallments: "",
    installmentsPaid: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        totalAmount: "",
        minimumPayment: "",
        nextPaymentDate: today,
        paymentFrequency: "monthly",
        isInstallments: true,
        totalInstallments: "",
        installmentsPaid: ""
      });
    }
  }, [isOpen]);

  // --- CÁLCULO AUTOMÁTICO DE PLAZOS ---
  // Cuando cambian el Monto Total o el Pago Mínimo, calculamos los meses.
  useEffect(() => {
    const total = Number(formData.totalAmount);
    const min = Number(formData.minimumPayment);

    // Solo calculamos si ambos valores son válidos y mayores a 0
    if (total > 0 && min > 0) {
        // Redondeamos hacia arriba (ej: 100 / 30 = 3.33 -> 4 pagos)
        const estimatedInstallments = Math.ceil(total / min);
        
        setFormData(prev => ({
            ...prev,
            totalInstallments: estimatedInstallments.toString()
        }));
    }
  }, [formData.totalAmount, formData.minimumPayment]);

  // --- CÁLCULOS DE SALDO (RESUMEN) ---
  const calculations = useMemo(() => {
    const totalAmount = Number(formData.totalAmount) || 0;
    const minPayment = Number(formData.minimumPayment) || 0;
    const paidCount = Number(formData.installmentsPaid) || 0;
    const totalCount = Number(formData.totalInstallments) || 0;

    const amountPaidSoFar = minPayment * paidCount;
    const currentBalance = Math.max(0, totalAmount - amountPaidSoFar);
    const remainingInstallments = Math.max(0, totalCount - paidCount);

    return { currentBalance, remainingInstallments, amountPaidSoFar };
  }, [formData.totalAmount, formData.minimumPayment, formData.installmentsPaid, formData.totalInstallments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalAmount) return;

    setIsLoading(true);

    await onSave({
      name: formData.name,
      totalAmount: Number(formData.totalAmount),
      minimumPayment: Number(formData.minimumPayment),
      nextPaymentDate: formData.nextPaymentDate,
      paymentFrequency: formData.paymentFrequency,
      currentBalance: calculations.currentBalance,
      totalInstallments: Number(formData.totalInstallments),
      installmentsPaid: Number(formData.installmentsPaid)
    });
    
    setIsLoading(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-90 h-full backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 right-0 h-full md:w-[500px] bg-slate-950 border-l border-slate-800 shadow-2xl z-100 transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="text-rose-500" /> Registrar Deuda
            </h2>
            <p className="text-slate-400 text-xs mt-1">Calcularemos tu saldo y plazos automáticamente.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Acreedor / Nombre</label>
            <input 
              type="text" 
              placeholder="Ej: Préstamo Coche" 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Monto Inicial ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-9 text-white focus:border-rose-500 outline-none"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Pago Mínimo ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-9 text-white focus:border-rose-500 outline-none"
                  value={formData.minimumPayment}
                  onChange={(e) => setFormData({...formData, minimumPayment: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Frecuencia de Pago</label>
                <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-9 text-white focus:border-rose-500 outline-none appearance-none cursor-pointer"
                        value={formData.paymentFrequency}
                        onChange={(e) => setFormData({...formData, paymentFrequency: e.target.value})}
                    >
                        <option value="monthly">Mensual</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="weekly">Semanal</option>
                    </select>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Próximo Pago</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="date" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-9 text-white focus:border-rose-500 outline-none date-input-dark"
                        value={formData.nextPaymentDate}
                        onChange={(e) => setFormData({...formData, nextPaymentDate: e.target.value})}
                    />
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-rose-400">
                <Layers size={20} />
                <span className="font-medium">Detalle de Plazos</span>
            </div>

            <div className="grid grid-cols-2 gap-5 p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pagos</label>
                    <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                        <input 
                        type="number" 
                        placeholder="Calculado..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-8 text-white focus:border-rose-500 outline-none"
                        value={formData.totalInstallments}
                        readOnly // Se calcula solo, pero permitimos editar si quieren ajustarlo
                        onChange={(e) => setFormData({...formData, totalInstallments: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pagos Hechos</label>
                    <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                        type="number" 
                        placeholder="Ej: 2" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pl-8 text-white focus:border-rose-500 outline-none"
                        value={formData.installmentsPaid}
                        onChange={(e) => setFormData({...formData, installmentsPaid: e.target.value})}
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Calculator size={18} />
                <span className="font-bold text-sm">Resumen Calculado</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Abonado ({formData.installmentsPaid} pagos):</span>
                <span className="text-white font-mono">{formatCurrency(calculations.amountPaidSoFar)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Pagos Restantes:</span>
                <span className="text-white font-mono font-bold">{calculations.remainingInstallments}</span>
            </div>

            <div className="h-px bg-emerald-900/50 my-2"></div>

            <div className="flex justify-between items-center">
                <span className="text-slate-300 font-bold">Saldo Actual:</span>
                <span className="text-emerald-400 font-mono font-bold text-lg">{formatCurrency(calculations.currentBalance)}</span>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <button 
            onClick={handleSubmit}
            disabled={isLoading || !formData.name || !formData.totalAmount}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-rose-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <span className="animate-pulse">Guardando...</span> : <><Save size={20} /> Guardar Deuda</>}
          </button>
        </div>

      </div>
    </>
  );
}