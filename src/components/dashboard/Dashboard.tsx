"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  LucideIcon,
  PlusCircle,
  ArrowRight,
  MinusCircle,
  ArrowDownCircle,
  ArrowRightLeft,
} from "lucide-react";
import Swal from "sweetalert2";

import WeeklyChart from "./WeeklyChart";
import DailyClosingPanel from "./DailyClosingPanel";
import ExpensePanel from "./ExpensePanel";
import IncomePanel from "./IncomePanel";
import WithdrawalPanel from "./WithdrawalPanel";
import TransferPanel from "./TransferPanel";
import CategoryChart from "./CategoryChart";
import PaymentConfirmationModal from "../recurring/PaymentConfirmationModal";
import AccountSelectorModal from "./AccountSelectorModal";
import {
  saveTransaction,
  saveRecurringPayment,
  updateAccountBalance,
  saveTransfer,
} from "@/lib/actions";

interface Transaction {
  id: string | number;
  name: string;
  day: string;
  date: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  status: "paid" | "received" | "pending";
  source?: "recurring" | "manual";
  category?: string;
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
interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  nextDate: string;
  frequency?: string;
}

interface DashboardProps {
  initialData: Transaction[];
  recurringConfig: RecurringPayment[];
  categories: Category[];
  accounts: Account[];
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "#1e293b",
  color: "#fff",
  iconColor: "#34d399",
  customClass: { popup: "colored-toast" },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export default function Dashboard({
  initialData,
  recurringConfig,
  categories,
  accounts,
}: DashboardProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialData || []
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Estados de Modales
  const [isClosingPanelOpen, setIsClosingPanelOpen] = useState(false);
  const [isExpensePanelOpen, setIsExpensePanelOpen] = useState(false);
  const [isIncomePanelOpen, setIsIncomePanelOpen] = useState(false);
  const [isWithdrawalPanelOpen, setIsWithdrawalPanelOpen] = useState(false);
  const [isTransferPanelOpen, setIsTransferPanelOpen] = useState(false);

  const [paymentTx, setPaymentTx] = useState<Transaction | null>(null);
  const [isCardSelectorOpen, setIsCardSelectorOpen] = useState(false);

  useEffect(() => {
    setTransactions(initialData || []);
  }, [initialData]);

  // Recurrentes
  useEffect(() => {
    if (!recurringConfig || recurringConfig.length === 0) return;
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 7);
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const newTxToAdd: Transaction[] = [];
    recurringConfig.forEach((rec) => {
      const dueDate = new Date(rec.nextDate + "T12:00:00");
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      const isDueThisWeek = dueDate >= todayStart && dueDate <= endOfWeek;
      if (isDueThisWeek) {
        const alreadyPaid = transactions.find(
          (t) =>
            t.name === rec.name &&
            t.type === "expense" &&
            (t.status === "paid" || t.status === "pending") &&
            t.source !== "recurring"
        );
        if (!alreadyPaid) {
          const dayName = dayNames[dueDate.getDay()];
          const dateStr = dueDate.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
          });
          newTxToAdd.push({
            id: `pending-${rec.id}`,
            name: rec.name,
            day: dayName,
            date: `Vence: ${dateStr}`,
            amount: -Math.abs(rec.amount),
            type: "expense",
            status: "pending",
            source: "recurring",
          });
        }
      }
    });
    if (newTxToAdd.length > 0) {
      setTransactions((prev) => {
        const cleanPrev = prev.filter(
          (p) => !p.id.toString().startsWith("pending-")
        );
        return [...cleanPrev, ...newTxToAdd];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, recurringConfig]);

  // --- HANDLERS ---
  const handleSaveClosing = async (values: {
    didi: string;
    uber: string;
    cash: string;
    date: string;
  }) => {
    const dateString = values.date;
    const promises = [];
    if (Number(values.didi) !== 0) {
      promises.push(
        saveTransaction({
          name: "Didi Card (Ingreso)",
          amount: Number(values.didi),
          type: "income",
          date: dateString,
          status: "received",
          method: "Didi Card",
          category: "Ingreso",
        })
      );
      promises.push(updateAccountBalance("Didi Card", Number(values.didi)));
    }
    if (Number(values.uber) !== 0) {
      promises.push(
        saveTransaction({
          name: "Uber Card (Ingreso)",
          amount: Number(values.uber),
          type: "income",
          date: dateString,
          status: "received",
          method: "Uber Card",
          category: "Ingreso",
        })
      );
      promises.push(updateAccountBalance("Uber Card", Number(values.uber)));
    }
    if (Number(values.cash) !== 0) {
      promises.push(
        saveTransaction({
          name: "Efectivo (Mano)",
          amount: Number(values.cash),
          type: "income",
          date: dateString,
          status: "received",
          method: "Efectivo",
          category: "Ingreso",
        })
      );
      promises.push(updateAccountBalance("Efectivo", Number(values.cash)));
    }
    await Promise.all(promises);
    setIsClosingPanelOpen(false);
    Toast.fire({ icon: "success", title: "Cierre guardado" });
    router.refresh();
  };
  const handleSaveIncome = async (values: {
    name: string;
    amount: string;
    date: string;
    category?: string;
    accountName?: string;
  }) => {
    const amountVal = Math.abs(Number(values.amount));
    await saveTransaction({
      name: values.name,
      amount: amountVal,
      type: "income",
      date: values.date,
      status: "received",
      category: values.category,
      method: values.accountName,
    });
    if (values.accountName) {
      await updateAccountBalance(values.accountName, amountVal);
    }
    setIsIncomePanelOpen(false);
    Toast.fire({ icon: "success", title: "Ingreso registrado" });
    router.refresh();
  };
  const handleSaveExpense = async (values: {
    name: string;
    amount: string;
    date: string;
    status: "paid" | "pending";
    category?: string;
    accountName?: string;
  }) => {
    const amountVal = Math.abs(Number(values.amount));
    await saveTransaction({
      name: values.name,
      amount: -amountVal,
      type: "expense",
      date: values.date,
      status: values.status,
      category: values.category,
      method: values.accountName,
    });
    if (values.status === "paid" && values.accountName) {
      await updateAccountBalance(values.accountName, -amountVal);
    }
    setIsExpensePanelOpen(false);
    Toast.fire({ icon: "success", title: "Gasto registrado" });
    router.refresh();
  };
  const handleSaveTransfer = async (values: {
    amount: string;
    date: string;
    fromName: string;
    toName: string;
  }) => {
    await saveTransfer({
      amount: Math.abs(Number(values.amount)),
      date: values.date,
      fromName: values.fromName,
      toName: values.toName,
    });
    setIsTransferPanelOpen(false);
    Toast.fire({ icon: "success", title: "Transferencia exitosa" });
    router.refresh();
  };

  // --- NUEVO HANDLER DE RETIRO (Ahora es un TRASPASO) ---
  const handleSaveWithdrawal = async (values: {
    amount: string;
    date: string;
    fromAccountId: string;
  }) => {
    // 1. Encontrar nombre de cuenta origen
    const fromAcc = accounts.find((a) => a.id === values.fromAccountId);
    // 2. Encontrar cuenta de efectivo (destino)
    const cashAcc = accounts.find(
      (a) => a.type === "cash" || a.name.toLowerCase().includes("efectivo")
    );

    if (fromAcc && cashAcc) {
      // Ejecutamos como si fuera un traspaso
      await saveTransfer({
        amount: Math.abs(Number(values.amount)),
        date: values.date,
        fromName: fromAcc.name,
        toName: cashAcc.name,
      });
      Toast.fire({
        icon: "success",
        title: "Retiro registrado (Efectivo sumado)",
      });
    } else {
      Toast.fire({ icon: "error", title: "Error: Falta cuenta de Efectivo" });
    }
    setIsWithdrawalPanelOpen(false);
    router.refresh();
  };

  // ... (Confirmación de Pago y Renderizado igual que antes) ...
  const processPayment = async (accountName: string) => {
    if (!paymentTx) return;
    const todayISO = new Date().toLocaleDateString("en-CA");
    const amountVal = Math.abs(paymentTx.amount);
    if (paymentTx.id.toString().startsWith("pending-")) {
      await saveTransaction({
        name: paymentTx.name,
        amount: paymentTx.amount,
        type: "expense",
        date: todayISO,
        status: "paid",
        method: accountName,
        category: "Suscripciones",
      });
      const originalRecurringId = paymentTx.id
        .toString()
        .replace("pending-", "");
      const config = recurringConfig.find((r) => r.id === originalRecurringId);
      if (config) {
        const current = new Date(config.nextDate + "T12:00:00");
        const next = new Date(current);
        const freq = config.frequency || "monthly";
        if (freq === "weekly") next.setDate(current.getDate() + 7);
        if (freq === "biweekly") next.setDate(current.getDate() + 15);
        if (freq === "monthly") next.setMonth(current.getMonth() + 1);
        if (freq === "yearly") next.setFullYear(current.getFullYear() + 1);
        await saveRecurringPayment({
          id: config.id,
          name: config.name,
          amount: config.amount,
          frequency: freq,
          nextDate: next.toLocaleDateString("en-CA"),
        });
      }
    } else {
      await saveTransaction({
        id: paymentTx.id.toString(),
        name: paymentTx.name,
        amount: paymentTx.amount,
        type: "expense",
        date: paymentTx.date,
        status: "paid",
        method: accountName,
        category: paymentTx.category,
      });
    }
    await updateAccountBalance(accountName, -amountVal);
    setPaymentTx(null);
    setIsCardSelectorOpen(false);
    Toast.fire({
      icon: "success",
      title: "Pago registrado y saldo actualizado",
    });
    router.refresh();
  };
  const handleConfirmMethod = (method: "cash" | "card") => {
    if (method === "cash") {
      const cashAcc = accounts.find(
        (a) => a.type === "cash" || a.name.toLowerCase().includes("efectivo")
      );
      processPayment(cashAcc ? cashAcc.name : "Efectivo");
    } else {
      setIsCardSelectorOpen(true);
    }
  };
  const handleSelectCard = (account: Account) => {
    processPayment(account.name);
  };

  const chartData = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const dataMap = days.map((day) => ({ name: day, income: 0, expense: 0 }));
    transactions.forEach((t) => {
      if (t.type === "transfer") return;
      let dayIndex = -1;
      if (t.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const d = new Date(t.date + "T12:00:00");
        const jsDay = d.getDay();
        dayIndex = jsDay === 0 ? 6 : jsDay - 1;
      } else {
        const normalizedDay =
          t.day.charAt(0).toUpperCase() + t.day.slice(1).toLowerCase();
        dayIndex = days.indexOf(normalizedDay);
      }
      if (dayIndex >= 0 && dayIndex < 7) {
        if (t.type === "income") {
          dataMap[dayIndex].income += t.amount;
        } else if (t.status === "paid" || t.status === "received") {
          dataMap[dayIndex].expense += Math.abs(t.amount);
        }
      }
    });
    return dataMap;
  }, [transactions]);
  const filteredTransactions = useMemo(() => {
    return selectedDay
      ? transactions.filter((t) => t.day === selectedDay)
      : transactions;
  }, [selectedDay, transactions]);
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let payable = 0;
    let balance = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "transfer") return;
      if (t.type === "income") {
        if (t.amount > 0) income += t.amount;
        else expense += Math.abs(t.amount);
        if (t.status === "received") balance += t.amount;
      } else {
        if (t.status === "pending") {
          payable += Math.abs(t.amount);
        } else {
          expense += Math.abs(t.amount);
          balance += t.amount;
        }
      }
    });
    return { income, expense, payable, balance };
  }, [filteredTransactions]);
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(val);
  const cardAccounts = accounts.filter(
    (a) => a.type !== "cash" && !a.name.toLowerCase().includes("efectivo")
  );

  return (
    <div className="space-y-8 text-slate-200 relative min-h-screen">
      <DailyClosingPanel
        isOpen={isClosingPanelOpen}
        onClose={() => setIsClosingPanelOpen(false)}
        onSave={handleSaveClosing}
      />
      <ExpensePanel
        isOpen={isExpensePanelOpen}
        onClose={() => setIsExpensePanelOpen(false)}
        onSave={handleSaveExpense}
        categories={categories}
        accounts={accounts}
      />
      <IncomePanel
        isOpen={isIncomePanelOpen}
        onClose={() => setIsIncomePanelOpen(false)}
        onSave={handleSaveIncome}
        categories={categories}
        accounts={accounts}
      />

      {/* PANEL RETIRO (Actualizado props) */}
      <WithdrawalPanel
        isOpen={isWithdrawalPanelOpen}
        onClose={() => setIsWithdrawalPanelOpen(false)}
        onSave={handleSaveWithdrawal}
        accounts={accounts}
      />

      <TransferPanel
        isOpen={isTransferPanelOpen}
        onClose={() => setIsTransferPanelOpen(false)}
        onSave={handleSaveTransfer}
        accounts={accounts}
      />
      <PaymentConfirmationModal
        isOpen={!!paymentTx && !isCardSelectorOpen}
        onClose={() => setPaymentTx(null)}
        onConfirm={handleConfirmMethod}
        itemName={paymentTx?.name || ""}
        amount={Math.abs(paymentTx?.amount || 0)}
      />
      <AccountSelectorModal
        isOpen={isCardSelectorOpen}
        onClose={() => setIsCardSelectorOpen(false)}
        onSelect={handleSelectCard}
        accounts={cardAccounts}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resumen Financiero</h1>
          <p className="text-slate-400">
            {selectedDay
              ? `Mostrando actividad del día ${selectedDay}.`
              : "Tu actividad financiera de esta semana."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsExpensePanelOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 hover:border-rose-500/50 px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <MinusCircle size={20} /> Gasto
          </button>
          <button
            onClick={() => setIsIncomePanelOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <PlusCircle size={20} /> Ingreso
          </button>
          <button
            onClick={() => setIsWithdrawalPanelOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 hover:border-orange-500/50 px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <ArrowDownCircle size={20} /> Retiro
          </button>
          <button
            onClick={() => setIsTransferPanelOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 hover:border-indigo-500/50 px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-95"
          >
            <ArrowRightLeft size={20} /> Traspaso
          </button>
          <button
            onClick={() => setIsClosingPanelOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <TrendingUp size={20} /> Cierre
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title="Balance (Real)"
          amount={formatCurrency(metrics.balance)}
          icon={DollarSign}
        />
        <Card
          title="Ingresos"
          amount={formatCurrency(metrics.income)}
          icon={TrendingUp}
        />
        <Card
          title="Gastos (Pagados)"
          amount={formatCurrency(metrics.expense)}
          icon={TrendingDown}
        />
        <Card
          title="Por Pagar"
          amount={formatCurrency(metrics.payable)}
          icon={Wallet}
          highlight={metrics.payable > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 h-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Flujo Semanal</h3>
            {selectedDay && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
                Filtrando: {selectedDay}
              </span>
            )}
          </div>
          <div className="h-[calc(100%-2rem)] w-full">
            <WeeklyChart
              onDayClick={(day) =>
                setSelectedDay((prev) => (prev === day ? null : day))
              }
              chartData={chartData}
            />
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-96 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center z-10">
            <h3 className="font-semibold text-white">
              {selectedDay
                ? `Movimientos (${selectedDay})`
                : "Últimos movimientos"}
            </h3>
            {selectedDay ? (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} /> Borrar filtro
              </button>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                Historial <ArrowRight size={10} />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredTransactions.length > 0 ? (
              filteredTransactions
                .slice(0)
                .reverse()
                .map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    {...tx}
                    onDoubleClick={() => {
                      if (tx.status === "pending") setPaymentTx(tx);
                    }}
                  />
                ))
            ) : (
              <p className="text-center text-slate-500 text-sm py-10">
                No hay movimientos.
              </p>
            )}
          </div>
        </div>
        <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 p-6 h-96">
          <h3 className="font-semibold text-white mb-4">
            Gastos por Categoría
          </h3>
          <div className="h-[calc(100%-2rem)] w-full">
            <CategoryChart transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponentes igual
interface CardProps {
  title: string;
  amount: string;
  icon: LucideIcon;
  highlight?: boolean;
}
function Card({ title, amount, icon: Icon, highlight }: CardProps) {
  return (
    <div
      className={`p-6 rounded-xl border transition-all duration-300 ${
        highlight
          ? "bg-amber-950/20 border-amber-500/30"
          : "bg-slate-900 border-slate-800 hover:border-slate-700"
      }`}
    >
      {" "}
      <div className="flex justify-between items-start mb-4">
        {" "}
        <div
          className={`p-2 rounded-lg border ${
            highlight
              ? "bg-amber-900/20 border-amber-500/30 text-amber-500"
              : "bg-slate-800 border-slate-700 text-slate-300"
          }`}
        >
          {" "}
          <Icon size={20} />{" "}
        </div>{" "}
      </div>{" "}
      <p
        className={`text-sm font-medium ${
          highlight ? "text-amber-400/80" : "text-slate-400"
        }`}
      >
        {title}
      </p>{" "}
      <h3
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-amber-400" : "text-white"
        }`}
      >
        {amount}
      </h3>{" "}
    </div>
  );
}
interface TransactionItemProps extends Transaction {
  onDoubleClick?: () => void;
}
function TransactionItem({
  name,
  date,
  amount,
  type,
  status,
  category,
  onDoubleClick,
}: TransactionItemProps) {
  const isIncome = type === "income";
  const isTransfer = type === "transfer";
  const displayAmount = isTransfer
    ? `$${Math.abs(amount)}`
    : isIncome && amount > 0
    ? `+$${amount}`
    : `-$${Math.abs(amount)}`;
  let bgClass = "",
    textClass = "";
  if (isTransfer) {
    bgClass = "bg-indigo-500/20 text-indigo-400";
    textClass = "text-indigo-400";
  } else if (isIncome) {
    bgClass = "bg-emerald-500/20 text-emerald-400";
    textClass = "text-emerald-400";
  } else {
    bgClass = "bg-rose-500/20 text-rose-400";
    textClass = "text-white";
  }
  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`flex justify-between items-center py-3 px-4 rounded-xl border transition-all duration-300 bg-slate-900 border-slate-800 hover:border-slate-700 relative overflow-hidden select-none`}
      title={status === "pending" ? "Doble clic para pagar" : ""}
    >
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${bgClass}`}
        >
          {" "}
          {isTransfer ? <ArrowRightLeft size={14} /> : name.charAt(0)}{" "}
        </div>{" "}
        <div>
          {" "}
          <p className="font-medium text-sm text-slate-200">{name}</p>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <p className="text-xs text-slate-500">{date}</p>{" "}
            {category && (
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">
                {category}
              </span>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="text-right">
        {" "}
        <span className={`font-bold text-sm block ${textClass}`}>
          {displayAmount}
        </span>{" "}
        {status === "pending" && (
          <span className="text-[10px] text-amber-500 font-medium">
            Por Pagar
          </span>
        )}{" "}
      </div>{" "}
    </div>
  );
}
