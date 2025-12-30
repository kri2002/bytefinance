'use client';

import { useState } from 'react';
import { Plus, Wallet, CreditCard, Landmark, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AccountFormModal from './AccountFormModal'; // <--- Importamos el modal

interface Account {
  id: number;
  name: string;
  type: 'debit' | 'cash' | 'credit';
  balance: number;
  bankName: string;
  last4?: string;
  color: string;
}

// Datos iniciales
const INITIAL_ACCOUNTS: Account[] = [
  { id: 1, name: "Nómina BBVA", type: 'debit', balance: 12500.50, bankName: "BBVA", last4: "8821", color: "from-blue-600 to-blue-900" },
  { id: 2, name: "Efectivo (Cartera)", type: 'cash', balance: 850.00, bankName: "Físico", color: "from-emerald-600 to-emerald-900" },
  { id: 3, name: "Nu Crédito", type: 'credit', balance: 4200.00, bankName: "Nu Bank", last4: "4420", color: "from-purple-600 to-purple-900" },
];

export default function AccountsList() {
  // 1. Convertimos los datos en Estado para poder agregar más
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  
  // 2. Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. Función para agregar cuenta
  const handleAddAccount = (newAccountData: any) => {
    const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    const newAccount: Account = {
        id: newId,
        ...newAccountData
    };
    setAccounts([...accounts, newAccount]);
  };
  
  // CÁLCULO DE TOTALES
  const totalAssets = accounts.filter(a => a.type !== 'credit').reduce((acc, curr) => acc + curr.balance, 0);
  const totalDebt = accounts.filter(a => a.type === 'credit').reduce((acc, curr) => acc + curr.balance, 0);
  const netWorth = totalAssets - totalDebt;

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Modal para Agregar */}
      <AccountFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddAccount} 
      />

      {/* Header y Resumen */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Cuentas</h1>
          <p className="text-slate-400 mt-1">Gestión de activos y tarjetas.</p>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[160px]">
                <p className="text-xs text-slate-500 font-medium uppercase">Patrimonio Neto</p>
                <p className={`text-xl font-bold mt-1 ${netWorth >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    {formatCurrency(netWorth)}
                </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[160px]">
                <p className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
                    <ArrowUpRight size={14} className="text-emerald-500"/> Activos
                </p>
                <p className="text-xl font-bold mt-1 text-emerald-400">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[160px]">
                <p className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
                    <ArrowDownRight size={14} className="text-rose-500"/> Deuda
                </p>
                <p className="text-xl font-bold mt-1 text-rose-400">{formatCurrency(totalDebt)}</p>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-white">Todas las Cuentas</h3>
        
        {/* Botón Header conectado */}
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
            <Plus size={18} /> Agregar Cuenta
        </button>
      </div>

      {/* Grid de Tarjetas Visuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
            <div 
                key={account.id} 
                className={`relative overflow-hidden rounded-2xl p-6 h-52 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-2xl shadow-lg group select-none`}
            >
                {/* Fondo Gradiente */}
                <div className={`absolute inset-0 bg-gradient-to-br ${account.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

                {/* Header Tarjeta */}
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-white/80 text-sm font-medium">{account.bankName || 'General'}</p>
                        <h3 className="text-white font-bold text-lg tracking-wide truncate pr-2">{account.name}</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm text-white shadow-sm">
                        {account.type === 'cash' ? <Wallet size={20}/> : 
                         account.type === 'debit' ? <Landmark size={20}/> : <CreditCard size={20}/>}
                    </div>
                </div>

                {/* Chip Simulado */}
                {account.type !== 'cash' && (
                     <div className="relative z-10 w-10 h-8 rounded bg-gradient-to-tr from-yellow-200 to-yellow-500 opacity-80 mb-2 shadow-sm border border-yellow-600/30"></div>
                )}

                {/* Footer Tarjeta */}
                <div className="relative z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-white/70 text-xs mb-1 uppercase tracking-wider font-medium">
                                {account.type === 'credit' ? 'Saldo Deudor' : 'Disponible'}
                            </p>
                            <p className="text-3xl font-mono font-bold text-white tracking-tight drop-shadow-sm">
                                {formatCurrency(account.balance)}
                            </p>
                        </div>
                        {account.last4 && (
                            <p className="text-white/80 font-mono text-sm tracking-widest drop-shadow-sm">
                                •••• {account.last4}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        ))}

        {/* Botón Grande "Nueva Cuenta" conectado */}
        <button 
            onClick={() => setIsModalOpen(true)}
            className="h-52 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 hover:bg-slate-900/50 transition-all gap-3 group"
        >
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <Plus size={24} />
            </div>
            <span className="font-medium">Agregar nueva cuenta</span>
        </button>
      </div>
    </div>
  );
}