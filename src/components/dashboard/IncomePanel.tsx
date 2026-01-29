"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  TrendingUp,
  Calendar,
  Tag,
  FileText,
  Wallet,
} from "lucide-react";

// 1. Interfaces necesarias
interface Transaction {
  id: string | number;
  name: string;
  date: string;
  amount: number;
  type: string;
  status: string;
  category?: string;
  method?: string;
}
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
  type: string;
  balance: number;
}

interface IncomePanelProps {
  isOpen: boolean;
  onClose: () => void;
  // 2. Actualizar onSave para soporte de edición
  onSave: (
    data: {
      name: string;
      amount: string;
      date: string;
      category?: string;
      accountName?: string;
    },
    isEdit?: boolean
  ) => void;
  categories: Category[];
  accounts: Account[];
  // 3. Nueva prop editData
  editData?: Transaction | null;
}

export default function IncomePanel({
  isOpen,
  onClose,
  onSave,
  categories,
  accounts,
  editData,
}: IncomePanelProps) {
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories]
  );
  // Para ingresos, mostramos todas las cuentas (excepto crédito, aunque podrías recibir un reembolso ahí)
  const availableAccounts = useMemo(
    () => accounts.filter((a) => a.type !== "credit"),
    [accounts]
  );

  const getLocalToday = () => new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    date: getLocalToday(),
    categoryId: "",
    accountId: "",
  });

  // 4. useEffect para MODO EDICIÓN
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // --- PRE-LLENAR ---
        const editCat =
          categories.find((c) => c.name === editData.category)?.id || "";
        const editAcc =
          accounts.find((a) => a.name === editData.method)?.id ||
          (availableAccounts.length > 0 ? availableAccounts[0].id : "");

        setFormData({
          name: editData.name,
          amount: editData.amount.toString(), // Los ingresos ya son positivos
          date: editData.date,
          categoryId: editCat,
          accountId: editAcc,
        });
      } else {
        // --- RESET ---
        setFormData((prev) => ({
          name: "",
          amount: "",
          date: getLocalToday(),
          categoryId:
            prev.categoryId ||
            (incomeCategories.length > 0 ? incomeCategories[0].id : ""),
          accountId:
            prev.accountId ||
            (availableAccounts.length > 0 ? availableAccounts[0].id : ""),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]);

  useEffect(() => {
    if (
      isOpen &&
      !editData &&
      !formData.categoryId &&
      incomeCategories.length > 0
    )
      setFormData((prev) => ({ ...prev, categoryId: incomeCategories[0].id }));
    if (
      isOpen &&
      !editData &&
      availableAccounts.length > 0 &&
      !formData.accountId
    )
      setFormData((prev) => ({ ...prev, accountId: availableAccounts[0].id }));
  }, [
    isOpen,
    editData,
    incomeCategories,
    availableAccounts,
    formData.categoryId,
    formData.accountId,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCat = categories.find((c) => c.id === formData.categoryId);
    const selectedAcc = accounts.find((a) => a.id === formData.accountId);

    // 5. Pasar bandera isEdit
    onSave(
      {
        ...formData,
        category: selectedCat ? selectedCat.name : undefined,
        accountName: selectedAcc ? selectedAcc.name : undefined,
      },
      !!editData
    );
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
        className={`fixed top-0 right-0 h-full w-full md:w-112.5 bg-slate-950 border-l border-slate-800 shadow-2xl z-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="text-emerald-500" size={20} />
              </div>
              {/* 6. Título dinámico */}
              {editData ? "Editar Ingreso" : "Registrar Ingreso"}
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
                Monto del Ingreso
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-bold">
                  $
                </span>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  step="0.01"
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
                placeholder="Ej. Nómina, Venta..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Selector de CUENTA DE DESTINO */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet size={16} /> Depositar en
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableAccounts.map((acc) => (
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
                      className={`w-3 h-3 rounded-full bg-linear-to-br ${acc.color}`}
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none scheme-dark"
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
              {/* 7. Texto dinámico */}
              <Save size={20} />{" "}
              {editData ? "Guardar Cambios" : "Registrar Ingreso"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
