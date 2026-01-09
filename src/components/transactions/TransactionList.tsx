"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Calendar,
  Loader2,
  Trash2,
  Pencil,
  ArrowRightLeft
} from "lucide-react";
import Swal from "sweetalert2";

// Server Actions
import { 
  getTransactionsByMonth, 
  deleteTransactionWithReversal, 
  editTransactionWithReversal 
} from "@/lib/actions";

// Componentes de Edición
import ExpensePanel from "../dashboard/ExpensePanel";
import IncomePanel from "../dashboard/IncomePanel";

// Interfaces
interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  status: "paid" | "received" | "pending";
  method?: string;
  createdAt?: string;
  category?: string; // Necesario para editar
}

interface Category { id: string; name: string; color: string; type: 'income' | 'expense'; }
interface Account { id: string; name: string; color: string; type: string; balance: number; }

interface TransactionsListProps {
  initialData: Transaction[];
  initialYear: number;
  initialMonth: number;
  // 👇 Necesitamos esto para los formularios de edición
  categories: Category[];
  accounts: Account[];
}

const Toast = Swal.mixin({
  toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true,
  background: "#1e293b", color: "#fff", iconColor: "#34d399",
  customClass: { popup: "colored-toast" },
  didOpen: (toast) => { toast.addEventListener("mouseenter", Swal.stopTimer); toast.addEventListener("mouseleave", Swal.resumeTimer); },
});

export default function TransactionsList({
  initialData,
  initialYear,
  initialMonth,
  categories,
  accounts
}: TransactionsListProps) {
  
  // --- ESTADOS DE DATOS ---
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- ESTADOS DE FILTRO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "15days">("all");

  // --- ESTADOS DE EDICIÓN ---
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isExpensePanelOpen, setIsExpensePanelOpen] = useState(false);
  const [isIncomePanelOpen, setIsIncomePanelOpen] = useState(false);

  const observerTarget = useRef(null);

  // --- CARGA INFINITA (Scroll) ---
  const loadPrevMonth = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    let nextMonth = currentMonth - 1;
    let nextYear = currentYear;
    if (nextMonth === 0) {
      nextMonth = 12;
      nextYear -= 1;
    }

    const newTx = await getTransactionsByMonth(nextYear, nextMonth);

    if (newTx && newTx.length > 0) {
      setTransactions((prev) => [...prev, ...(newTx as any)]);
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
    } else {
      setHasMore(false);
    }

    setIsLoading(false);
  }, [currentYear, currentMonth, isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && dateFilter === "all") {
          loadPrevMonth();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadPrevMonth, dateFilter]);


  // --- HANDLERS DE ACCIONES ---

  // 1. Eliminar
  const handleDelete = async (tx: Transaction) => {
    const result = await Swal.fire({
        title: '¿Eliminar movimiento?',
        text: "El saldo de la cuenta se ajustará automáticamente.",
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#1e293b',
        confirmButtonText: 'Sí, borrar', cancelButtonText: 'Cancelar', background: '#0f172a', color: '#fff'
    });

    if (result.isConfirmed) {
        const res = await deleteTransactionWithReversal({
            id: tx.id.toString(), date: tx.date, amount: tx.amount, type: tx.type, method: tx.method, name: tx.name
        });

        if (res.success) {
            // Actualizar estado local eliminando el item
            setTransactions(prev => prev.filter(t => t.id !== tx.id));
            Toast.fire({ icon: 'success', title: 'Eliminado correctamente' });
        }
    }
  };

  // 2. Iniciar Edición
  const handleEditClick = (tx: Transaction) => {
      if (tx.type === 'transfer') {
          Toast.fire({ icon: 'info', title: 'Edición de traspasos no disponible en historial.' });
          return;
      }
      setEditingTx(tx);
      if (tx.type === 'expense') setIsExpensePanelOpen(true);
      if (tx.type === 'income') setIsIncomePanelOpen(true);
  };

  const closePanels = () => {
      setIsExpensePanelOpen(false);
      setIsIncomePanelOpen(false);
      setTimeout(() => setEditingTx(null), 300);
  };

  // 3. Guardar Edición (Gasto)
  const handleSaveExpense = async (values: any, isEdit?: boolean) => {
      if (!isEdit || !editingTx) return;
      const amountVal = Math.abs(Number(values.amount));
      
      const res = await editTransactionWithReversal(
          { id: editingTx.id, date: editingTx.date, amount: editingTx.amount, type: editingTx.type, method: editingTx.method },
          { name: values.name, amount: amountVal, date: values.date, category: values.category, accountName: values.accountName, status: values.status }
      );

      if (res.success) {
          // Actualizar estado local
          setTransactions(prev => prev.map(t => t.id === editingTx.id ? {
              ...t, name: values.name, amount: -amountVal, date: values.date, category: values.category, method: values.accountName, status: values.status
          } : t));
          Toast.fire({ icon: 'success', title: 'Gasto actualizado' });
          closePanels();
      }
  };

  // 4. Guardar Edición (Ingreso)
  const handleSaveIncome = async (values: any, isEdit?: boolean) => {
      if (!isEdit || !editingTx) return;
      const amountVal = Math.abs(Number(values.amount));

      const res = await editTransactionWithReversal(
          { id: editingTx.id, date: editingTx.date, amount: editingTx.amount, type: editingTx.type, method: editingTx.method },
          { name: values.name, amount: amountVal, date: values.date, category: values.category, accountName: values.accountName }
      );

      if (res.success) {
          // Actualizar estado local
          setTransactions(prev => prev.map(t => t.id === editingTx.id ? {
              ...t, name: values.name, amount: amountVal, date: values.date, category: values.category, method: values.accountName
          } : t));
          Toast.fire({ icon: 'success', title: 'Ingreso actualizado' });
          closePanels();
      }
  };

  // --- FILTROS Y ORDENAMIENTO ---
  const filteredData = useMemo(() => {
      return transactions
        .filter((tx) => {
          const matchesSearch = tx.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesType = filterType === "all" || tx.type === filterType;
          let matchesDate = true;
          if (dateFilter !== "all") {
            const todayStr = new Date().toLocaleDateString("en-CA");
            if (dateFilter === "today") matchesDate = tx.date === todayStr;
            else {
              const txDate = new Date(tx.date + "T12:00:00");
              const todayDate = new Date(todayStr + "T12:00:00");
              const diffTime = Math.abs(todayDate.getTime() - txDate.getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              if (dateFilter === "week") matchesDate = diffDays <= 7;
              if (dateFilter === "15days") matchesDate = diffDays <= 15;
            }
          }
          return matchesSearch && matchesType && matchesDate;
        })
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) return dateB - dateA;
          const timeA = new Date(a.createdAt || a.date).getTime();
          const timeB = new Date(b.createdAt || b.date).getTime();
          return timeB - timeA;
        });
  }, [transactions, searchTerm, filterType, dateFilter]);

  const formatCurrency = (val: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Math.abs(val));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* --- MODALES DE EDICIÓN --- */}
      <ExpensePanel 
        isOpen={isExpensePanelOpen} onClose={closePanels} onSave={handleSaveExpense} 
        categories={categories} accounts={accounts} 
        editData={editingTx?.type === 'expense' ? editingTx : null} 
      />
      <IncomePanel 
        isOpen={isIncomePanelOpen} onClose={closePanels} onSave={handleSaveIncome} 
        categories={categories} accounts={accounts} 
        editData={editingTx?.type === 'income' ? editingTx : null} 
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Transacciones</h1>
          <p className="text-slate-400 mt-1">
            Viendo historial desde {new Date(currentYear, currentMonth - 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* --- CONTROLES DE FILTRO --- */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[{ id: "all", label: "Histórico" }, { id: "today", label: "Hoy" }, { id: "week", label: "Última Semana" }, { id: "15days", label: "Últimos 15 días" }].map((opt) => (
            <button key={opt.id} onClick={() => setDateFilter(opt.id as any)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${dateFilter === opt.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer">
              <option value="all">Todos los tipos</option>
              <option value="income">Solo Ingresos</option>
              <option value="expense">Solo Gastos</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- TABLA DE DATOS --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold pl-6">Concepto</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Método</th>
                <th className="p-4 font-semibold text-right">Monto</th>
                <th className="p-4 font-semibold text-center pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredData.map((tx) => {
                const isIncome = tx.type === "income";
                const isTransfer = tx.type === "transfer";

                // Estilos estéticos (Redondos y limpios)
                let iconStyles = '', amountClass = '', sign = '';
                if (isTransfer) { 
                    iconStyles = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'; 
                    amountClass = 'text-indigo-400';
                    sign = "";
                } else if (isIncome) { 
                    iconStyles = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; 
                    amountClass = 'text-emerald-400';
                    sign = "+";
                } else { 
                    iconStyles = 'text-rose-400 bg-rose-500/10 border-rose-500/20'; 
                    amountClass = 'text-white';
                    sign = "-";
                }

                return (
                  <tr key={tx.id} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${iconStyles}`}>
                          {isTransfer ? <ArrowRightLeft size={16} /> : tx.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-bold text-white text-sm">{tx.name}</span>
                          <span className="text-xs text-slate-500 capitalize">
                            {tx.status === "received" ? "Ingreso" : tx.status === "paid" ? "Pagado" : "Pendiente"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-600" />
                        {tx.date}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs capitalize">
                        {tx.method || "General"}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${amountClass}`}>
                      {sign}{formatCurrency(tx.amount)}
                    </td>
                    
                    {/* COLUMNA DE ACCIONES */}
                    <td className="p-4 text-center pr-6">
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                            {!isTransfer && (
                                <button onClick={() => handleEditClick(tx)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar">
                                    <Pencil size={16} />
                                </button>
                            )}
                            <button onClick={() => handleDelete(tx)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Eliminar">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No se encontraron movimientos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dateFilter === "all" && hasMore && (
        <div ref={observerTarget} className="flex justify-center p-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="animate-spin" /> Cargando más...
            </div>
          )}
        </div>
      )}
    </div>
  );
}