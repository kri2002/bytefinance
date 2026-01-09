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
} from "lucide-react";

// 1. Importar la interfaz Transaction
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

interface ExpensePanelProps {
  isOpen: boolean;
  onClose: () => void;
  // 2. Actualizar la firma del onSave para soportar edición opcional
  onSave: (
    data: {
      name: string;
      amount: string;
      date: string;
      status: "paid" | "pending";
      category?: string;
      accountName?: string;
    },
    isEdit?: boolean
  ) => void;
  categories: Category[];
  accounts: Account[];
  // 3. Nueva prop: Datos a editar
  editData?: Transaction | null;
}

export default function ExpensePanel({
  isOpen,
  onClose,
  onSave,
  categories,
  accounts,
  editData,
}: ExpensePanelProps) {
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );
  const availableAccounts = useMemo(
    () => accounts.filter((a) => a.type === "credit" || a.balance > 0),
    [accounts]
  );

  const getLocalToday = () => new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    date: getLocalToday(),
    status: "paid" as "paid" | "pending",
    categoryId: "",
    accountId: "",
  });

  // 4. useEffect modificado para detectar MODO EDICIÓN
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // --- MODO EDICIÓN: Pre-llenar datos ---
        const editCat =
          categories.find((c) => c.name === editData.category)?.id || "";
        const editAcc =
          accounts.find((a) => a.name === editData.method)?.id ||
          (availableAccounts.length > 0 ? availableAccounts[0].id : "");

        setFormData({
          name: editData.name,
          // Usar valor absoluto para mostrar en el input
          amount: Math.abs(editData.amount).toString(),
          date: editData.date,
          status: editData.status as "paid" | "pending",
          categoryId: editCat,
          accountId: editAcc,
        });
      } else {
        // --- MODO CREACIÓN (Reset normal) ---
        setFormData((prev) => ({
          name: "",
          amount: "",
          date: getLocalToday(),
          status: "paid",
          categoryId:
            prev.categoryId ||
            (expenseCategories.length > 0 ? expenseCategories[0].id : ""),
          accountId:
            prev.accountId ||
            (availableAccounts.length > 0 ? availableAccounts[0].id : ""),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]); // Importante: Depender de editData

  // (El otro useEffect se mantiene igual para asegurar categorías por defecto en creación)
  useEffect(() => {
    if (
      isOpen &&
      !editData &&
      !formData.categoryId &&
      expenseCategories.length > 0
    )
      setFormData((prev) => ({ ...prev, categoryId: expenseCategories[0].id }));
    if (isOpen && !editData && availableAccounts.length > 0) {
      const currentValid = availableAccounts.find(
        (a) => a.id === formData.accountId
      );
      if (!currentValid)
        setFormData((prev) => ({
          ...prev,
          accountId: availableAccounts[0].id,
        }));
    }
  }, [
    isOpen,
    editData,
    expenseCategories,
    availableAccounts,
    formData.categoryId,
    formData.accountId,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCat = categories.find((c) => c.id === formData.categoryId);
    const selectedAcc = accounts.find((a) => a.id === formData.accountId);

    // 5. Pasar bandera de si es edición
    onSave(
      {
        ...formData,
        category: selectedCat ? selectedCat.name : undefined,
        accountName: selectedAcc ? selectedAcc.name : undefined,
      },
      !!editData
    ); // true si hay editData
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
              <div className="bg-rose-500/20 p-2 rounded-lg">
                <DollarSign className="text-rose-500" size={20} />
              </div>
              {/* 6. Título dinámico */}
              {editData ? "Editar Gasto" : "Registrar Gasto"}
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
            {/* ... (El resto del formulario es IDÉNTICO) ... */}
            {/* Solo asegúrate de que los inputs usen el estado formData correctamente */}

            {/* Monto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-rose-400">
                Monto del Gasto
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-3xl font-bold text-white placeholder:text-slate-600 focus:border-rose-500 outline-none transition-all"
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
                placeholder="Ej. Tacos, Uber, Cine..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Selector de CUENTA */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet size={16} /> Pagar con
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
              {availableAccounts.length === 0 && (
                <p className="text-xs text-rose-500">
                  No tienes cuentas con saldo.
                </p>
              )}
            </div>

            {/* Selector de Categoría */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Tag size={16} /> Categoría
              </label>
              <div className="grid grid-cols-2 gap-3">
                {expenseCategories.map((cat) => (
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

            <div className="grid grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Calendar size={16} /> Fecha
                </label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none [color-scheme:dark]"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              {/* Estatus */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Estatus
                </label>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: "paid" })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.status === "paid"
                        ? "bg-slate-700 text-white shadow"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Pagado
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, status: "pending" })
                    }
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.status === "pending"
                        ? "bg-amber-900/30 text-amber-400 shadow"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Pendiente
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <button
              onClick={handleSubmit}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-rose-900/20"
            >
              {/* 7. Texto dinámico del botón */}
              <Save size={20} />{" "}
              {editData ? "Guardar Cambios" : "Registrar Gasto"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
