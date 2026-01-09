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

// Subcomponentes
import WeeklyChart from "./WeeklyChart";
import DailyClosingPanel from "./DailyClosingPanel";
import ExpensePanel from "./ExpensePanel";
import IncomePanel from "./IncomePanel";
import WithdrawalPanel from "./WithdrawalPanel";
import TransferPanel from "./TransferPanel";
import CategoryChart from "./CategoryChart";
import PaymentConfirmationModal from "../recurring/PaymentConfirmationModal";
import AccountSelectorModal from "./AccountSelectorModal";

// Server Actions
import {
  saveTransaction,
  saveRecurringPayment,
  updateAccountBalance,
  saveTransfer,
  deleteTransactionWithReversal,
  editTransactionWithReversal,
  registerDebtPayment, // Importamos la acción de pago de deuda
} from "@/lib/actions";

// Interfaces
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
  method?: string;
  createdAt?: string;
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

// 1. INTERFAZ ACTUALIZADA (Agregamos totalInstallments)
interface Debt {
  id: string;
  name: string;
  currentBalance: number;
  minimumPayment: number;
  nextPaymentDate: string;
  totalInstallments?: number; // Para saber si es a meses
}

interface DashboardProps {
  initialData: Transaction[];
  recurringConfig: RecurringPayment[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
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
  debts = [],
}: DashboardProps) {
  const router = useRouter();

  // --- ESTADOS ---
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialData || []
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modales
  const [isClosingPanelOpen, setIsClosingPanelOpen] = useState(false);
  const [isExpensePanelOpen, setIsExpensePanelOpen] = useState(false);
  const [isIncomePanelOpen, setIsIncomePanelOpen] = useState(false);
  const [isWithdrawalPanelOpen, setIsWithdrawalPanelOpen] = useState(false);
  const [isTransferPanelOpen, setIsTransferPanelOpen] = useState(false);

  // Estados de Acción
  const [paymentTx, setPaymentTx] = useState<Transaction | null>(null);
  const [isCardSelectorOpen, setIsCardSelectorOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    setTransactions(initialData || []);
  }, [initialData]);

  // --- RECURRENTES Y DEUDAS (Lógica Unificada) ---
  useEffect(() => {
    const today = new Date();
    // Calcular fin de semana (Domingo)
    const endOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToEnd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    endOfWeek.setDate(today.getDate() + diffToEnd);
    endOfWeek.setHours(23, 59, 59, 999);

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const newTxToAdd: Transaction[] = [];

    // 1. PROCESAR SUSCRIPCIONES
    if (recurringConfig && recurringConfig.length > 0) {
      recurringConfig.forEach((rec) => {
        const dueDate = new Date(rec.nextDate + "T12:00:00");
        const isDueThisWeek = dueDate <= endOfWeek;

        if (isDueThisWeek) {
          const alreadyPaid = transactions.find(
            (t) =>
              t.name === rec.name &&
              t.type === "expense" &&
              (t.status === "paid" || t.status === "pending") &&
              t.source !== "recurring" &&
              t.date.substring(0, 7) === rec.nextDate.substring(0, 7)
          );

          if (!alreadyPaid) {
            const dayName = dayNames[dueDate.getDay()];
            newTxToAdd.push({
              id: `pending-${rec.id}`,
              name: rec.name,
              day: dayName,
              date: rec.nextDate,
              amount: -Math.abs(rec.amount),
              type: "expense",
              status: "pending",
              source: "recurring",
              category: "Suscripciones",
            });
          }
        }
      });
    }

    // 2. PROCESAR DEUDAS
    if (debts && debts.length > 0) {
      debts.forEach((debt) => {
        if (debt.currentBalance > 0.1) {
          // Solo si hay deuda activa
          const dueDate = new Date(debt.nextPaymentDate + "T12:00:00");

          // Si vence esta semana (o antes)
          if (dueDate <= endOfWeek) {
            // Verificar si ya se pagó HOY (para no duplicar en el mismo día)
            const paidToday = transactions.find(
              (t) =>
                t.name.includes(debt.name) &&
                t.date === new Date().toLocaleDateString("en-CA")
            );

            if (!paidToday) {
              const dayName = dayNames[dueDate.getDay()];
              newTxToAdd.push({
                id: `pending-debt-${debt.id}`,
                name: `Pago: ${debt.name}`,
                day: dayName,
                date: debt.nextPaymentDate,
                // Sugerimos Pago Mínimo, o el Saldo Total si es menor
                amount: -Math.abs(
                  debt.minimumPayment > 0
                    ? debt.minimumPayment
                    : debt.currentBalance
                ),
                type: "expense",
                status: "pending",
                source: "recurring",
                category: "Deudas",
              });
            }
          }
        }
      });
    }

    if (newTxToAdd.length > 0) {
      setTransactions((prev) => {
        const cleanPrev = prev.filter(
          (p) => !p.id.toString().startsWith("pending-")
        );
        const combined = [...cleanPrev, ...newTxToAdd];
        // Ordenar por fecha
        return combined.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
    }
  }, [initialData, recurringConfig, debts]);

  // --- CONTROL DE PANELES ---
  const closeAllPanels = () => {
    setIsExpensePanelOpen(false);
    setIsIncomePanelOpen(false);
    setIsWithdrawalPanelOpen(false);
    setIsTransferPanelOpen(false);
    setIsClosingPanelOpen(false);
    setTimeout(() => setEditingTx(null), 300);
  };

  // --- HANDLERS DE PAGO Y COBRO ---

  // Lógica unificada para procesar el pago (Suscripción o Deuda)
  const processPayment = async (accountName: string) => {
    if (!paymentTx) return;
    const todayISO = new Date().toLocaleDateString("en-CA");
    const amountVal = Math.abs(paymentTx.amount);

    // CASO 1: PAGO DE DEUDA (ID empieza con pending-debt-)
    if (paymentTx.id.toString().startsWith("pending-debt-")) {
      const originalDebtId = paymentTx.id
        .toString()
        .replace("pending-debt-", "");

      // 2. BUSCAMOS LA DEUDA PARA SABER SI ES A MESES
      const associatedDebt = debts.find((d) => d.id === originalDebtId);
      // Si tiene totalInstallments > 0, significa que es a meses y debemos sumar +1 pago
      const shouldMarkInstallment = associatedDebt?.totalInstallments
        ? associatedDebt.totalInstallments > 0
        : false;

      // Usamos la acción especial de deuda que actualiza saldo y registro
      await registerDebtPayment(originalDebtId, {
        amount: amountVal,
        date: todayISO,
        accountName: accountName,
        debtName: paymentTx.name.replace("Pago: ", ""), // Limpiamos el nombre
        isInstallment: shouldMarkInstallment, // <--- CORRECCIÓN AQUÍ
      });

      Toast.fire({ icon: "success", title: "Abono a deuda registrado" });
    }
    // CASO 2: PAGO DE SUSCRIPCIÓN (ID empieza con pending-)
    else if (paymentTx.id.toString().startsWith("pending-")) {
      // Guardar transacción
      await saveTransaction({
        name: paymentTx.name,
        amount: paymentTx.amount,
        type: "expense",
        date: todayISO,
        status: "paid",
        method: accountName,
        category: "Suscripciones",
      });

      // Actualizar próxima fecha
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
      await updateAccountBalance(accountName, -amountVal);
      Toast.fire({ icon: "success", title: "Suscripción pagada" });
    }
    // CASO 3: TRANSACCIÓN MANUAL PENDIENTE
    else {
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
      await updateAccountBalance(accountName, -amountVal);
      Toast.fire({ icon: "success", title: "Pago registrado" });
    }

    setPaymentTx(null);
    setIsCardSelectorOpen(false);
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

  // --- OTROS HANDLERS (Guardar, Editar, Borrar) ---
  const handleSaveClosing = async (values: any) => {
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
    closeAllPanels();
    Toast.fire({ icon: "success", title: "Cierre guardado" });
    router.refresh();
  };

  const handleSaveIncome = async (values: any, isEdit?: boolean) => {
    const amountVal = Math.abs(Number(values.amount));
    if (isEdit && editingTx) {
      await editTransactionWithReversal(
        {
          id: editingTx.id.toString(),
          date: editingTx.date,
          amount: editingTx.amount,
          type: editingTx.type,
          method: editingTx.method,
        },
        {
          name: values.name,
          amount: amountVal,
          date: values.date,
          category: values.category,
          accountName: values.accountName,
        }
      );
      Toast.fire({ icon: "success", title: "Ingreso actualizado" });
    } else {
      await saveTransaction({
        name: values.name,
        amount: amountVal,
        type: "income",
        date: values.date,
        status: "received",
        category: values.category,
        method: values.accountName,
      });
      if (values.accountName)
        await updateAccountBalance(values.accountName, amountVal);
      Toast.fire({ icon: "success", title: "Ingreso registrado" });
    }
    closeAllPanels();
    router.refresh();
  };

  const handleSaveExpense = async (values: any, isEdit?: boolean) => {
    const amountVal = Math.abs(Number(values.amount));
    if (isEdit && editingTx) {
      await editTransactionWithReversal(
        {
          id: editingTx.id.toString(),
          date: editingTx.date,
          amount: editingTx.amount,
          type: editingTx.type,
          method: editingTx.method,
        },
        {
          name: values.name,
          amount: amountVal,
          date: values.date,
          category: values.category,
          accountName: values.accountName,
          status: values.status,
        }
      );
      Toast.fire({ icon: "success", title: "Gasto actualizado" });
    } else {
      await saveTransaction({
        name: values.name,
        amount: -amountVal,
        type: "expense",
        date: values.date,
        status: values.status,
        category: values.category,
        method: values.accountName,
      });
      if (values.status === "paid" && values.accountName)
        await updateAccountBalance(values.accountName, -amountVal);
      Toast.fire({ icon: "success", title: "Gasto registrado" });
    }
    closeAllPanels();
    router.refresh();
  };

  const handleSaveWithdrawal = async (values: any) => {
    const fromAcc = accounts.find((a) => a.id === values.fromAccountId);
    const cashAcc = accounts.find(
      (a) => a.type === "cash" || a.name.toLowerCase().includes("efectivo")
    );
    if (fromAcc && cashAcc) {
      await saveTransfer({
        amount: Math.abs(Number(values.amount)),
        date: values.date,
        fromName: fromAcc.name,
        toName: cashAcc.name,
      });
      Toast.fire({ icon: "success", title: "Retiro registrado" });
    } else {
      Toast.fire({ icon: "error", title: "Error: Falta cuenta de Efectivo" });
    }
    closeAllPanels();
    router.refresh();
  };

  const handleSaveTransfer = async (values: any) => {
    await saveTransfer({
      amount: Math.abs(Number(values.amount)),
      date: values.date,
      fromName: values.fromName,
      toName: values.toName,
    });
    closeAllPanels();
    Toast.fire({ icon: "success", title: "Transferencia exitosa" });
    router.refresh();
  };

  const handleEditClick = (tx: Transaction) => {
    if (tx.type === "transfer") {
      Toast.fire({
        icon: "info",
        title: "La edición de traspasos no está disponible aún.",
      });
      return;
    }
    setEditingTx(tx);
    if (tx.type === "expense") setIsExpensePanelOpen(true);
    else if (tx.type === "income") setIsIncomePanelOpen(true);
  };

  // --- NAVEGACIÓN Y FILTROS ---
  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? 6 : currentDay - 1;
    const realStart = new Date(now);
    realStart.setDate(now.getDate() - diff);
    realStart.setHours(0, 0, 0, 0);
    const viewDay = currentDate.getDay();
    const viewDiff = viewDay === 0 ? 6 : viewDay - 1;
    const viewStart = new Date(currentDate);
    viewStart.setDate(currentDate.getDate() - viewDiff);
    viewStart.setHours(0, 0, 0, 0);
    return viewStart.getTime() >= realStart.getTime();
  }, [currentDate]);

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  // 1. Filtrar Semana
  const { currentWeekTransactions, weekRangeStr } = useMemo(() => {
    const now = new Date(currentDate);
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const filtered = transactions.filter((t) => {
      if (t.type === "transfer") return false;
      const txDate = new Date(t.date + "T12:00:00");
      return txDate >= startOfWeek && txDate <= endOfWeek;
    });

    const format = (d: Date) =>
      d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    return {
      currentWeekTransactions: filtered,
      weekRangeStr: `${format(startOfWeek)} - ${format(endOfWeek)}`,
    };
  }, [transactions, currentDate]);

  // 2. Gráfica
  const chartData = useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const dataMap = days.map((day) => ({ name: day, income: 0, expense: 0 }));
    currentWeekTransactions.forEach((t) => {
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
        if (t.type === "income") dataMap[dayIndex].income += t.amount;
        else if (t.status === "paid" || t.status === "received")
          dataMap[dayIndex].expense += Math.abs(t.amount);
      }
    });
    return dataMap;
  }, [currentWeekTransactions]);

  // 3. Lista Filtrada
  const filteredTransactions = useMemo(() => {
    let items = currentWeekTransactions;
    if (selectedDay) {
      const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
      items = items.filter((t) => {
        const d = new Date(t.date + "T12:00:00");
        const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
        return days[dayIndex] === selectedDay;
      });
    }
    return items;
  }, [selectedDay, currentWeekTransactions]);

  // 4. Métricas
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let payable = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "transfer") return;
      if (t.type === "income") {
        if (t.amount > 0) income += t.amount;
        else expense += Math.abs(t.amount);
      } else {
        if (t.status === "pending") payable += Math.abs(t.amount);
        else expense += Math.abs(t.amount);
      }
    });
    return { income, expense, payable, balance: income - expense };
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
      {/* MODALES */}
      <DailyClosingPanel
        isOpen={isClosingPanelOpen}
        onClose={closeAllPanels}
        onSave={handleSaveClosing}
      />
      <ExpensePanel
        isOpen={isExpensePanelOpen}
        onClose={closeAllPanels}
        onSave={handleSaveExpense}
        categories={categories}
        accounts={accounts}
        editData={editingTx?.type === "expense" ? editingTx : null}
      />
      <IncomePanel
        isOpen={isIncomePanelOpen}
        onClose={closeAllPanels}
        onSave={handleSaveIncome}
        categories={categories}
        accounts={accounts}
        editData={editingTx?.type === "income" ? editingTx : null}
      />
      <WithdrawalPanel
        isOpen={isWithdrawalPanelOpen}
        onClose={closeAllPanels}
        onSave={handleSaveWithdrawal}
        accounts={accounts}
      />
      <TransferPanel
        isOpen={isTransferPanelOpen}
        onClose={closeAllPanels}
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">Resumen Financiero</h1>
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

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title={selectedDay ? `Balance (${selectedDay})` : "Balance (Semanal)"}
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

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-6 h-96">
          <div className="h-full w-full">
            <WeeklyChart
              onDayClick={(day) =>
                setSelectedDay((prev) => (prev === day ? null : day))
              }
              chartData={chartData}
              selectedDay={selectedDay}
              dateRange={weekRangeStr}
              onPrevClick={() => navigateWeek("prev")}
              onNextClick={() => navigateWeek("next")}
              disableNext={isCurrentWeek}
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-96 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center z-10">
            <h3 className="font-semibold text-white">
              {selectedDay ? `Movimientos (${selectedDay})` : "Esta Semana"}
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
                Recientes <ArrowRight size={10} />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredTransactions.length > 0 ? (
              filteredTransactions
                .slice(0)
                .sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  if (dateA !== dateB) return dateA - dateB;
                  const timeA = new Date(a.createdAt || a.date).getTime();
                  const timeB = new Date(b.createdAt || b.date).getTime();
                  return timeA - timeB;
                })
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
            <CategoryChart transactions={filteredTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
}

// SUBCOMPONENTES CARD Y TRANSACTIONITEM (Iguales que antes)
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
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-2 rounded-lg border ${
            highlight
              ? "bg-amber-900/20 border-amber-500/30 text-amber-500"
              : "bg-slate-800 border-slate-700 text-slate-300"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p
        className={`text-sm font-medium ${
          highlight ? "text-amber-400/80" : "text-slate-400"
        }`}
      >
        {title}
      </p>
      <h3
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-amber-400" : "text-white"
        }`}
      >
        {amount}
      </h3>
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
  onDoubleClick,
}: TransactionItemProps) {
  const isIncome = type === "income";
  const isTransfer = type === "transfer";
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Math.abs(amount));
  const displayAmount = isTransfer
    ? `${formattedAmount}`
    : isIncome
    ? `+${formattedAmount}`
    : `-${formattedAmount}`;

  let iconStyles = "",
    amountClass = "",
    bgGradient = "";
  if (isTransfer) {
    iconStyles = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    amountClass = "text-indigo-300";
    bgGradient = "hover:from-indigo-500/5";
  } else if (isIncome) {
    iconStyles = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    amountClass = "text-emerald-400";
    bgGradient = "hover:from-emerald-500/5";
  } else {
    iconStyles = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    amountClass = "text-white";
    bgGradient = "hover:from-rose-500/5";
  }

  return (
    <div
      onDoubleClick={onDoubleClick}
      className={`group relative flex justify-between items-center p-4 mb-3 rounded-2xl border border-slate-800/50 bg-slate-900/40 hover:border-slate-700/50 transition-all duration-300 cursor-pointer overflow-hidden select-none bg-gradient-to-r via-transparent to-transparent ${bgGradient}`}
      title={status === "pending" ? "Doble clic para pagar" : ""}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border shrink-0 ${iconStyles}`}
        >
          {isTransfer ? (
            <ArrowRightLeft size={20} />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <p className="font-bold text-base text-slate-100 truncate leading-tight">
            {name}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">{date}</p>
        </div>
      </div>
      <div className="text-right shrink-0 pl-4">
        <span className={`font-bold text-base block ${amountClass}`}>
          {displayAmount}
        </span>
        {status === "pending" && (
          <span className="text-[10px] text-amber-400 font-bold mt-1 block">
            Por Pagar
          </span>
        )}
      </div>
    </div>
  );
}
