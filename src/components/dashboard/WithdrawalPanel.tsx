"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  DollarSign,
  Calendar,
  FileText,
  Wallet,
  AlertCircle,
  ArrowDownCircle,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  color: string;
  type: string;
  balance: number;
}
interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface WithdrawalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: string;
    date: string;
    accountName: string;
    category?: string;
  }) => void;
  accounts: Account[];
  categories: Category[];
}

export default function WithdrawalPanel({
  isOpen,
  onClose,
  onSave,
  accounts,
  categories,
}: WithdrawalPanelProps) {
  const getLocalToday = () => new Date().toLocaleDateString("en-CA");

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    date: getLocalToday(),
    accountId: "",
    categoryId: "",
  });

  const [error, setError] = useState<string | null>(null);

  // Inicializar con la primera cuenta disponible
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        name: "",
        amount: "",
        date: getLocalToday(),
        accountId:
          prev.accountId || (accounts.length > 0 ? accounts[0].id : ""),
        categoryId: "", // Opcional, o podrías buscar una categoría "Retiro"
      }));
      setError(null);
    }
  }, [isOpen, accounts]);

  // VALIDACIÓN DE SALDO EN TIEMPO REAL
  useEffect(() => {
    const selectedAcc = accounts.find((a) => a.id === formData.accountId);
    const amountVal = Number(formData.amount);

    if (selectedAcc && formData.amount) {
      // Solo validamos saldo insuficiente en Débito o Efectivo (Crédito permite negativo)
      if (selectedAcc.type !== "credit" && amountVal > selectedAcc.balance) {
        setError(`Saldo insuficiente. Solo tienes $${selectedAcc.balance}`);
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [formData.amount, formData.accountId, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return; // No dejar enviar si hay error

    const selectedAcc = accounts.find((a) => a.id === formData.accountId);
    const selectedCat = categories.find((c) => c.id === formData.categoryId);

    if (!selectedAcc) return;

    onSave({
      ...formData,
      accountName: selectedAcc.name,
      category: selectedCat ? selectedCat.name : "Retiro", // Si no elige, ponemos 'Retiro' por defecto
    });
  };

  const selectedAccount = accounts.find((a) => a.id === formData.accountId);

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
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <ArrowDownCircle className="text-orange-500" size={20} />
              </div>
              Registrar Retiro
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
            {/* Selector de CUENTA ORIGEN (Lo ponemos primero porque define el saldo) */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet size={16} /> Retirar de
              </label>
              <div className="grid grid-cols-1 gap-3">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, accountId: acc.id }))
                    }
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      formData.accountId === acc.id
                        ? "bg-slate-800 border-orange-500 shadow-md shadow-orange-900/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-br ${acc.color}`}
                      ></div>
                      <span
                        className={`text-sm font-medium ${
                          formData.accountId === acc.id
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {acc.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      ${acc.balance.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-orange-400">
                  Monto a Retirar
                </label>
                {selectedAccount && (
                  <span
                    className={`text-xs ${
                      error ? "text-rose-500 font-bold" : "text-slate-500"
                    }`}
                  >
                    Disponible: ${selectedAccount.balance.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-bold">
                  $
                </span>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  className={`w-full bg-slate-900 border rounded-2xl pl-10 pr-4 py-4 text-3xl font-bold text-white placeholder:text-slate-600 outline-none transition-all ${
                    error
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-rose-500 text-xs mt-1 animate-pulse">
                  <AlertCircle size={12} /> {error}
                </div>
              )}
            </div>

            {/* Concepto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileText size={16} /> Concepto
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Retiro Cajero, Préstamo..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
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
              disabled={!!error || !formData.amount}
              className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${
                error || !formData.amount
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-500 text-white hover:scale-[1.02] shadow-orange-900/20"
              }`}
            >
              <Save size={20} /> Confirmar Retiro
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
