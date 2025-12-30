'use client';

import { useState, useEffect } from 'react';
import { X, Save, Wallet, CreditCard, Landmark, Hash, Palette } from 'lucide-react';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: any) => void;
}

// Opciones de colores para las tarjetas
const CARD_COLORS = [
    { name: 'Azul BBVA', value: 'from-blue-600 to-blue-900', ring: 'ring-blue-500' },
    { name: 'Morado Nu', value: 'from-purple-600 to-purple-900', ring: 'ring-purple-500' },
    { name: 'Naranja Didi', value: 'from-orange-600 to-orange-900', ring: 'ring-orange-500' },
    { name: 'Verde Efectivo', value: 'from-emerald-600 to-emerald-900', ring: 'ring-emerald-500' },
    { name: 'Rojo Santander', value: 'from-red-600 to-red-900', ring: 'ring-red-500' },
    { name: 'Negro Amex', value: 'from-slate-700 to-black', ring: 'ring-slate-500' },
];

export default function AccountFormModal({ isOpen, onClose, onSave }: AccountFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    type: 'debit',
    balance: '',
    last4: '',
    color: CARD_COLORS[0].value
  });

  // Bloqueo de scroll y reset
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form al abrir si se desea, o mantener persistencia. Aquí reseteamos.
      setFormData({ name: '', bankName: '', type: 'debit', balance: '', last4: '', color: CARD_COLORS[0].value });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.balance) return;
    onSave({ ...formData, balance: Number(formData.balance) });
    onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-[90] backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose} 
      />

      <div className={`fixed top-0 right-0 z-[100] h-[100dvh] w-full md:w-[450px] bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet size={20} className="text-blue-500"/> Nueva Cuenta
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              
              {/* Tipo de Cuenta */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Tipo de Cuenta</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'debit', label: 'Débito', icon: Landmark },
                        { id: 'credit', label: 'Crédito', icon: CreditCard },
                        { id: 'cash', label: 'Efectivo', icon: Wallet },
                    ].map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({...formData, type: type.id})}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                formData.type === type.id 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                            <type.icon size={20} className="mb-1" />
                            <span className="text-xs font-bold">{type.label}</span>
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Nombre de la Cuenta</label>
                <input 
                    type="text" placeholder="Ej. Nómina, Ahorros, Cartera..." 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Institución / Banco (Opcional)</label>
                <input 
                    type="text" placeholder="Ej. BBVA, Nu, Santander..." 
                    value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-400 ml-1">Saldo Inicial / Actual</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input 
                        type="number" placeholder="0.00" 
                        value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} 
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 pl-8 text-white focus:border-blue-500 outline-none transition-all text-lg font-mono"
                    />
                </div>
                <p className="text-xs text-slate-500 ml-1">
                    {formData.type === 'credit' ? 'Ingresa tu deuda actual (en positivo).' : 'Dinero disponible actualmente.'}
                </p>
              </div>

              {formData.type !== 'cash' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-1"><Hash size={14}/> Últimos 4 dígitos (Opcional)</label>
                    <input 
                        type="text" maxLength={4} placeholder="1234" 
                        value={formData.last4} onChange={e => setFormData({...formData, last4: e.target.value})} 
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all tracking-widest text-center w-32"
                    />
                  </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1 flex items-center gap-1"><Palette size={14}/> Color de Tarjeta</label>
                <div className="grid grid-cols-6 gap-2">
                    {CARD_COLORS.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setFormData({...formData, color: c.value})}
                            className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.value} transition-all ${formData.color === c.value ? `ring-2 ring-offset-2 ring-offset-slate-950 ${c.ring} scale-110` : 'opacity-70 hover:opacity-100'}`}
                            title={c.name}
                        />
                    ))}
                </div>
              </div>

            </form>

            <div className="p-5 border-t border-slate-800 bg-slate-900/50 pb-safe">
                <button 
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-900/40"
                >
                  <Save size={20} /> Guardar Cuenta
                </button>
            </div>
        </div>
      </div>
    </>
  );
}