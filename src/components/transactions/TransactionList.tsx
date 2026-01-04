"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Calendar,
  Loader2,
} from "lucide-react";
import { getTransactionsByMonth } from "@/lib/actions";

interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  status: "paid" | "received" | "pending";
  method?: string;
}

interface TransactionsListProps {
  initialData: Transaction[];
  initialYear: number;
  initialMonth: number;
}

export default function TransactionsList({
  initialData,
  initialYear,
  initialMonth,
}: TransactionsListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "15days"
  >("all");

  const observerTarget = useRef(null);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const filteredData = transactions.filter((tx) => {
    const matchesSearch = tx.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || tx.type === filterType;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const todayStr = new Date().toLocaleDateString("en-CA");

      if (dateFilter === "today") {
        matchesDate = tx.date === todayStr;
      } else {
        const txDate = new Date(tx.date + "T12:00:00");
        const todayDate = new Date(todayStr + "T12:00:00");

        const diffTime = Math.abs(todayDate.getTime() - txDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === "week") matchesDate = diffDays <= 7;
        if (dateFilter === "15days") matchesDate = diffDays <= 15;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Historial de Transacciones
          </h1>
          <p className="text-slate-400 mt-1">
            Viendo historial desde{" "}
            {new Date(currentYear, currentMonth - 1).toLocaleDateString(
              "es-MX",
              { month: "long", year: "numeric" }
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: "all", label: "Histórico" },
            { id: "today", label: "Hoy" },
            { id: "week", label: "Última Semana" },
            { id: "15days", label: "Últimos 15 días" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDateFilter(opt.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                dateFilter === opt.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos los tipos</option>
              <option value="income">Solo Ingresos</option>
              <option value="expense">Solo Gastos</option>
            </select>
          </div>
        </div>
      </div>

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
                const isIncome = tx.type === "income";
                return (
                  <tr
                    key={tx.id}
                    className="group hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                        <div>
                          <span className="block font-bold text-white">
                            {tx.name}
                          </span>
                          <span className="text-xs text-slate-500 capitalize">
                            {tx.status === "received"
                              ? "Ingreso Recibido"
                              : tx.status === "paid"
                              ? "Pagado"
                              : "Pendiente"}
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
                    <td
                      className={`p-4 text-right pr-6 font-mono font-bold ${
                        isIncome ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {isIncome ? "+" : ""}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">
                    No se encontraron movimientos con estos filtros.
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
              <Loader2 className="animate-spin" /> Cargando mes anterior...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
