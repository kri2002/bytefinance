'use client';

import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Filter, Calendar } from 'lucide-react';

// --- INTERFAZ DE DATOS ---
interface Transaction {
  id: number;
  name: string;
  date: string; 
  rawDate: string; 
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'received' | 'pending';
  method?: string; 
}

// --- DATOS SIMULADOS (MOCK) ---
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, name: "Supermercado", date: "Lun, 30 Dic", rawDate: "2025-12-30", amount: -1200, type: "expense", status: "paid", method: "Tarjeta" },
  { id: 2, name: "Renta Enero", date: "Lun, 30 Dic", rawDate: "2025-12-30", amount: -4000, type: "expense", status: "pending", method: "Transferencia" }, 
  { id: 3, name: "Transferencia Cliente", date: "Dom, 29 Dic", rawDate: "2025-12-29", amount: 4500, type: "income", status: "received", method: "Banco" },
  { id: 4, name: "Gasolina", date: "Sáb, 28 Dic", rawDate: "2025-12-28", amount: -600, type: "expense", status: "paid", method: "Efectivo" },
  { id: 5, name: "Cena Restaurante", date: "Vie, 27 Dic", rawDate: "2025-12-27", amount: -850, type: "expense", status: "paid", method: "Tarjeta" },
  { id: 6, name: "Venta de Servicio", date: "Jue, 26 Dic", rawDate: "2025-12-26", amount: 1200, type: "income", status: "received", method: "Efectivo" },
];

export default function TransactionsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // FILTRADO
  const filteredData = MOCK_TRANSACTIONS.filter(tx => {
    // Excluir Pendientes
    if (tx.status === 'pending') return false;

    // Filtro por Texto
    const matchesSearch = tx.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por Tipo
    const matchesType = filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Transacciones</h1>
          <p className="text-slate-400 mt-1">Registro histórico de ingresos y gastos realizados.</p>
        </div>
      </div>

      {/* Barra de Herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por concepto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
        </div>

        <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
                <option value="all">Todos los movimientos</option>
                <option value="income">Solo Ingresos</option>
                <option value="expense">Solo Gastos</option>
            </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold pl-6">Concepto</th>
                        <th className="p-4 font-semibold">Fecha</th>
                        <th className="p-4 font-semibold">Método</th>
                        <th className="p-4 font-semibold text-right pr-6">Monto</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {filteredData.map((tx) => {
                        const isIncome = tx.type === 'income';
                        return (
                            <tr key={tx.id} className="group hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                        }`}>
                                            {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <span className="block font-bold text-white">{tx.name}</span>
                                            <span className="text-xs text-slate-500 capitalize">{tx.status === 'received' ? 'Ingreso Recibido' : 'Gasto Realizado'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-600"/>
                                        {tx.date}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-400 text-sm">
                                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs">
                                        {tx.method || 'General'}
                                    </span>
                                </td>
                                <td className={`p-4 text-right pr-6 font-mono font-bold ${
                                    isIncome ? 'text-emerald-400' : 'text-white'
                                }`}>
                                    {isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                                </td>
                            </tr>
                        );
                    })}
                    
                    {filteredData.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                                        <Filter size={20} />
                                    </div>
                                    <p className="text-slate-500">No se encontraron transacciones realizadas.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}