'use client';

import { useState, useEffect } from 'react';
import { X, Save, CreditCard, Edit, Plus } from 'lucide-react';

interface AccountData {
    id?: string;
    name: string;
    type: string;
    balance: number;
    bankName: string;
    last4?: string;
    color: string;
}

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: AccountData | null; // Para editar
}

const COLORS = [
    { name: 'Blue', value: 'from-blue-600 to-blue-900' },
    { name: 'Purple', value: 'from-purple-600 to-purple-900' },
    { name: 'Emerald', value: 'from-emerald-600 to-emerald-900' },
    { name: 'Rose', value: 'from-rose-600 to-rose-900' },
    { name: 'Amber', value: 'from-amber-600 to-amber-900' },
    { name: 'Slate', value: 'from-slate-600 to-slate-900' },
    { name: 'Orange', value: 'from-orange-600 to-orange-900' }, 
    { name: 'Black', value: 'from-gray-800 to-black' }, 
];

export default function AccountFormModal({ isOpen, onClose, onSave, initialData }: AccountFormModalProps) {
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    type: 'debit',
    balance: '',
    last4: '',
    color: COLORS[0].value
  });

  // Efecto para cargar datos al editar o resetear al crear
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({
                name: initialData.name,
                bankName: initialData.bankName,
                type: initialData.type,
                balance: initialData.balance.toString(),
                last4: initialData.last4 || '',
                color: initialData.color
            });
        } else {
            setFormData({ name: '', bankName: '', type: 'debit', balance: '', last4: '', color: COLORS[0].value });
        }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, balance: Number(formData.balance) });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 h-full bg-black/60 backdrop-blur-sm z-90 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose} 
      />

      {/* Panel Lateral Deslizante */}
      <div 
        className={`fixed top-0 right-0 z-100 h-dvh w-full md:w-112.5 bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {isEditing ? <Edit className="text-amber-500" size={24} /> : <Plus className="text-blue-500" size={24} />}
                    {isEditing ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </h2>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nombre de la Cuenta</label>
                    <input required type="text" placeholder="Ej. Nómina, Ahorros..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Banco / Entidad</label>
                        <input required type="text" placeholder="Ej. BBVA..." 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                            value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Tipo</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none appearance-none"
                            value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="debit">Débito</option>
                            <option value="credit">Crédito</option>
                            <option value="cash">Efectivo</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-400">Saldo Actual ($)</label>
                    <input required type="number" placeholder="0.00" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-bold text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none"
                        value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})}
                    />
                    <p className="text-xs text-slate-500">Actualiza este valor para ajustar tu patrimonio.</p>
                </div>

                {formData.type !== 'cash' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Últimos 4 dígitos</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-3.5 text-slate-500" size={18}/>
                            <input type="text" maxLength={4} placeholder="1234" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:border-blue-500 outline-none"
                                value={formData.last4} onChange={e => setFormData({...formData, last4: e.target.value})}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300">Color de Tarjeta</label>
                    <div className="grid grid-cols-4 gap-3">
                        {COLORS.map(c => (
                            <button
                                key={c.name}
                                type="button"
                                onClick={() => setFormData({...formData, color: c.value})}
                                className={`h-12 rounded-lg bg-linear-to-br ${c.value} transition-all ${formData.color === c.value ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'}`}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>

            </form>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                <button 
                    onClick={handleSubmit}
                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg ${
                        isEditing 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                    }`}
                >
                    <Save size={20} /> {isEditing ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
}