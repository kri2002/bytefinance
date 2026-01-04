'use client';

import { X, CreditCard, Landmark } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    color: string;
    type: string;
}

interface AccountSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  accounts: Account[];
}

export default function AccountSelectorModal({ isOpen, onClose, onSelect, accounts }: AccountSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-90 h-full backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 z-100 shadow-2xl animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="text-blue-500" /> Selecciona la Tarjeta
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">¿Con qué cuenta deseas realizar este pago?</p>

        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {accounts.map((acc) => (
                <button
                    key={acc.id}
                    onClick={() => onSelect(acc)}
                    className="group relative flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-blue-500/50 transition-all active:scale-[0.98]"
                >
                    {/* Fondo Gradiente sutil al hover */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${acc.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        {/* Círculo de color */}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${acc.color} flex items-center justify-center shadow-lg`}>
                            {acc.type === 'debit' ? <Landmark size={18} className="text-white"/> : <CreditCard size={18} className="text-white"/>}
                        </div>
                        
                        <div className="text-left">
                            <h3 className="text-white font-bold text-lg">{acc.name}</h3>
                            <span className="text-xs text-slate-500 uppercase font-medium tracking-wider">{acc.type === 'credit' ? 'Crédito' : 'Débito'}</span>
                        </div>
                    </div>

                    {/* Flechita indicativa */}
                    <div className="text-slate-600 group-hover:text-blue-400 transition-colors">
                         <div className="w-2 h-2 rounded-full bg-current"></div>
                    </div>
                </button>
            ))}

            {accounts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                    <p>No tienes tarjetas registradas.</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
}