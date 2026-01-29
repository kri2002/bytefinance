"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Save,
  ArrowRightLeft,
  Calendar,
  Wallet,
  ArrowRight,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  color: string;
  balance: number;
  type: string;
}

interface TransferPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    amount: string;
    date: string;
    fromAccountId: string;
    toAccountId: string;
    fromName: string;
    toName: string;
  }) => void;
  accounts: Account[];
}

export default function TransferPanel({
  isOpen,
  onClose,
  onSave,
  accounts,
}: TransferPanelProps) {
  const getLocalToday = () => new Date().toLocaleDateString("en-CA");

  // FILTRO: Solo cuentas con saldo o crédito para el origen
  const sourceAccounts = useMemo(
    () => accounts.filter((a) => a.type === "credit" || a.balance > 0),
    [accounts]
  );

  const [formData, setFormData] = useState({
    amount: "",
    date: getLocalToday(),
    fromAccountId: "",
    toAccountId: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sourceAccounts.length > 0) {
      setFormData({
        amount: "",
        date: getLocalToday(),
        fromAccountId: sourceAccounts[0].id,
        toAccountId:
          accounts.length > 1
            ? accounts.find((a) => a.id !== sourceAccounts[0].id)?.id || ""
            : "",
      });
      setError(null);
    }
  }, [isOpen, sourceAccounts, accounts]);

  useEffect(() => {
    const fromAcc = accounts.find((a) => a.id === formData.fromAccountId);
    const val = Number(formData.amount);

    if (fromAcc && val > 0) {
      if (fromAcc.type !== "credit" && val > fromAcc.balance) {
        setError(
          `Solo tienes $${fromAcc.balance.toLocaleString()} en ${fromAcc.name}`
        );
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }

    if (
      formData.fromAccountId &&
      formData.fromAccountId === formData.toAccountId
    ) {
      const other = accounts.find((a) => a.id !== formData.fromAccountId);
      if (other) setFormData((prev) => ({ ...prev, toAccountId: other.id }));
    }
  }, [formData.amount, formData.fromAccountId, formData.toAccountId, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;

    const fromAcc = accounts.find((a) => a.id === formData.fromAccountId);
    const toAcc = accounts.find((a) => a.id === formData.toAccountId);

    if (!fromAcc || !toAcc) return;

    onSave({
      ...formData,
      fromName: fromAcc.name,
      toName: toAcc.name,
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
        className={`fixed top-0 right-0 h-full w-full md:w-112.5 bg-slate- 950 border-l border-slate-800 shadow-2xl z-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="bg-indigo-500/20 p-2 rounded-lg">
                <ArrowRightLeft className="text-indigo-500" size={20} />
              </div>
              Transferir entre Cuentas
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
            {/* CUENTA ORIGEN (FILTRADA) */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet size={16} /> Desde (Origen)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {sourceAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        fromAccountId: acc.id,
                      }))
                    }
                    disabled={acc.id === formData.toAccountId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      formData.fromAccountId === acc.id
                        ? "bg-slate-800 border-indigo-500 shadow-md shadow-indigo-900/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-600"
                    } ${
                      acc.id === formData.toAccountId
                        ? "opacity-30 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        formData.fromAccountId === acc.id
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {acc.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ${acc.balance.toLocaleString()}
                    </span>
                  </button>
                ))}
                {sourceAccounts.length === 0 && (
                  <p className="text-xs text-rose-500">
                    No hay cuentas con fondos para transferir.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <div className="bg-slate-800 p-2 rounded-full text-slate-500">
                <ArrowRight size={20} className="rotate-90 md:rotate-0" />
              </div>
            </div>

            {/* CUENTA DESTINO (TODAS) */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Wallet size={16} /> Hacia (Destino)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, toAccountId: acc.id }))
                    }
                    disabled={acc.id === formData.fromAccountId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      formData.toAccountId === acc.id
                        ? "bg-slate-800 border-emerald-500 shadow-md shadow-emerald-900/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-600"
                    } ${
                      acc.id === formData.fromAccountId
                        ? "opacity-30 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        formData.toAccountId === acc.id
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {acc.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ${acc.balance.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-indigo-400">
                  Monto
                </label>
                {error && (
                  <span className="text-xs text-rose-500 font-bold animate-pulse">
                    {error}
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
                      : "border-slate-700 focus:border-indigo-500"
                  }`}
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar size={16} /> Fecha
              </label>
              <input
                required
                type="date"
                max={getLocalToday()}
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
              disabled={!!error || !formData.amount}
              className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${
                error || !formData.amount
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] shadow-indigo-900/20"
              }`}
            >
              <Save size={20} /> Realizar Transferencia
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
