'use client';

import { X, CreditCard, Banknote, AlertCircle } from 'lucide-react';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'card') => void;
  itemName: string;
  amount: number;
}

export default function PaymentConfirmationModal({ isOpen, onClose, onConfirm, itemName, amount }: PaymentConfirmationModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <>
      {/* Fondo oscuro backdrop */}
      <div className="fixed inset-0 bg-black/70 h-full backdrop-blur-sm z-[110]" onClick={onClose} />

      {/* Modal de Alerta Centrado */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-[120] p-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 text-amber-500">
                <div className="bg-amber-500/10 p-2 rounded-full">
                    <AlertCircle size={24} />
                </div>
                <h3 className="font-bold text-lg text-white">Confirmar Pago</h3>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="mb-6">
            <p className="text-slate-400 text-sm mb-1">Vas a registrar el pago de:</p>
            <p className="text-white font-bold text-xl">{itemName}</p>
            <p className="text-slate-200 font-mono mt-1 text-lg">{formatCurrency(amount)}</p>
        </div>

        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Selecciona método de pago:</p>
        
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => onConfirm('cash')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-emerald-950/30 hover:border-emerald-500/50 hover:text-emerald-400 transition-all group"
            >
                <Banknote size={24} className="text-slate-400 group-hover:text-emerald-400"/>
                <span className="font-bold text-sm">Efectivo</span>
            </button>

            <button 
                onClick={() => onConfirm('card')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-blue-950/30 hover:border-blue-500/50 hover:text-blue-400 transition-all group"
            >
                <CreditCard size={24} className="text-slate-400 group-hover:text-blue-400"/>
                <span className="font-bold text-sm">Tarjeta</span>
            </button>
        </div>

      </div>
    </>
  );
}