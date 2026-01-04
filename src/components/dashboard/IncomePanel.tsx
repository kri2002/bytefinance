"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Wallet,
  TrendingUp,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
  type: "income" | "expense";
}
interface Account {
  id: string;
  name: string;
  color: string;
}

interface IncomePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: string;
    date: string;
    category?: string;
    accountName?: string;
  }) => void;
  categories: Category[];
  accounts: Account[];
}

export default function IncomePanel({
  isOpen,
  onClose,
  onSave,
  categories,
  accounts,
}: IncomePanelProps) {
  // Filtramos categorías de INGRESO
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories]
  );

  const getLocalToday = () => new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    date: getLocalToday(),
    categoryId: "",
    accountId: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        name: "",
        amount: "",
        date: getLocalToday(),
        categoryId:
          prev.categoryId ||
          (incomeCategories.length > 0 ? incomeCategories[0].id : ""),
        accountId:
          prev.accountId || (accounts.length > 0 ? accounts[0].id : ""),
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !formData.categoryId && incomeCategories.length > 0)
      setFormData((prev) => ({ ...prev, categoryId: incomeCategories[0].id }));
    if (isOpen && !formData.accountId && accounts.length > 0)
      setFormData((prev) => ({ ...prev, accountId: accounts[0].id }));
  }, [
    isOpen,
    incomeCategories,
    accounts,
    formData.categoryId,
    formData.accountId,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCat = categories.find((c) => c.id === formData.categoryId);
    const selectedAcc = accounts.find((a) => a.id === formData.accountId);

    onSave({
      ...formData,
      category: selectedCat ? selectedCat.name : undefined,
      accountName: selectedAcc ? selectedAcc.name : undefined,
    });
  };

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

      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-slate-950 border-l border-slate-800 shadow-2xl z-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="text-emerald-500" size={20} />
              </div>
              Registrar Ingreso Extra
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {/* Monto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-emerald-400">
                Monto Recibido
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-bold">
                  $
                </span>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-3xl font-bold text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none transition-all"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Concepto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileText size={16} /> Concepto
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Venta de Llantas, Freelance..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Selector de CUENTA DESTINO */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet size={16} /> Depositar en
              </label>
              <div className="grid grid-cols-2 gap-3">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, accountId: acc.id }))
                    }
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      formData.accountId === acc.id
                        ? "bg-slate-800 border-emerald-500 shadow-md shadow-emerald-900/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-gradient-to-br ${acc.color}`}
                    ></div>
                    <span
                      className={`text-sm font-medium truncate ${
                        formData.accountId === acc.id
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {acc.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Categoría */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Tag size={16} /> Categoría
              </label>
              <div className="grid grid-cols-2 gap-3">
                {incomeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, categoryId: cat.id }))
                    }
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      formData.categoryId === cat.id
                        ? "bg-slate-800 border-blue-500 shadow-md shadow-blue-900/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        cat.color
                      } shadow-[0_0_8px] shadow-${
                        cat.color.split("-")[1]
                      }-500/50`}
                    ></div>
                    <span
                      className={`text-sm font-medium ${
                        formData.categoryId === cat.id
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar size={16} /> Fecha
              </label>
              <input
                required
                type="date"
                max={getLocalToday()}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </form>

          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <button
              onClick={handleSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-emerald-900/20"
            >
              <Save size={20} /> Guardar Ingreso
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
