'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Plus, Trash2, TrendingDown, CheckCircle2, Calendar, Clock, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { saveDebt, deleteDebt, registerDebtPayment } from '@/lib/actions';

import DebtPanel from './DebtPanel'; 
import PaymentConfirmationModal from '../recurring/PaymentConfirmationModal'; 
import AccountSelectorModal from '../dashboard/AccountSelectorModal';

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  minimumPayment: number;
  nextPaymentDate: string; 
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly';
  totalInstallments?: number;
  installmentsPaid?: number;
}

interface Account { id: string; name: string; color: string; type: string; balance: number; }

interface DebtsPageProps {
  initialData: Debt[];
  accounts: Account[];
}

export default function DebtsPage({ initialData, accounts }: DebtsPageProps) {
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>(initialData);
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); 
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false); 

  const cardAccounts = accounts.filter(
    (a) => a.type !== "cash" && !a.name.toLowerCase().includes("efectivo")
  );

  useEffect(() => {
    setDebts(initialData);
  }, [initialData]);

  // --- LÓGICA DE ORDENAMIENTO AUTOMÁTICO ---
  const sortedDebts = useMemo(() => {
    // Creamos una copia para no mutar el estado directamente
    return [...debts].sort((a, b) => {
      // 1. Identificar si están pagadas (saldo casi 0)
      const aFinished = a.currentBalance <= 0.1;
      const bFinished = b.currentBalance <= 0.1;

      // 2. REGLA PRINCIPAL: Las pagadas se van al final
      if (aFinished && !bFinished) return 1; // a va después
      if (!aFinished && bFinished) return -1; // a va antes

      // 3. REGLA SECUNDARIA: Por fecha (De la más cercana a la más lejana)
      const dateA = new Date(a.nextPaymentDate).getTime();
      const dateB = new Date(b.nextPaymentDate).getTime();
      
      return dateA - dateB; // Ascendente (Enero antes que Febrero)
    });
  }, [debts]);

  // --- HELPERS ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  
  const getFrequencyLabel = (freq: string) => {
      const map: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
      return map[freq] || 'Mensual';
  };
  
  const getDaysUntilDue = (dateStr: string) => {
      const today = new Date(); today.setHours(0,0,0,0);
      const due = new Date(dateStr + "T12:00:00");
      const diff = due.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (days: number, isFinished: boolean) => {
    if (isFinished) return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'Pagado', icon: CheckCircle2 };
    if (days < 0) return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: `Vencido hace ${Math.abs(days)} días`, icon: AlertCircle };
    if (days === 0) return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: 'Vence Hoy', icon: Clock };
    if (days <= 7) return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: `Vence en ${days} días`, icon: Clock };
    if (days <= 15) return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', text: `Faltan ${days} días`, icon: Clock };
    return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: `Faltan ${days} días`, icon: Calendar };
  };

  const getAutomaticPaymentAmount = (debt: Debt) => {
    if (debt.totalInstallments && debt.totalInstallments > 0) return debt.totalAmount / debt.totalInstallments;
    if (debt.minimumPayment > 0) return debt.minimumPayment;
    return debt.currentBalance;
  };

  // --- HANDLERS ---
  const handleInitiatePayment = (debt: Debt) => {
    setActiveDebt(debt);
    setIsPaymentModalOpen(true);
  };

  const handleMethodSelection = (method: 'cash' | 'card') => {
    if (!activeDebt) return;
    if (method === 'cash') {
        const cashAcc = accounts.find(a => a.type === 'cash' || a.name.toLowerCase().includes('efectivo'));
        executePayment(activeDebt, cashAcc ? cashAcc.name : 'Efectivo');
    } else {
        setIsPaymentModalOpen(false); 
        setIsAccountModalOpen(true);  
    }
  };

  const handleAccountSelection = (account: Account) => {
    if (!activeDebt) return;
    executePayment(activeDebt, account.name);
  };

  const executePayment = async (debt: Debt, accountName: string) => {
    const amountToPay = getAutomaticPaymentAmount(debt);
    const isInstallment = debt.totalInstallments ? debt.totalInstallments > 0 : false;

    const res = await registerDebtPayment(debt.id, {
        amount: amountToPay,
        date: new Date().toLocaleDateString('en-CA'),
        accountName: accountName,
        debtName: debt.name,
        isInstallment: isInstallment
    });

    setIsPaymentModalOpen(false);
    setIsAccountModalOpen(false);
    setActiveDebt(null);

    if (res.success) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Abono registrado', showConfirmButton: false, timer: 3000, background: '#1e293b', color: '#fff' });
        router.refresh();
    }
  };

  const handleSaveDebt = async (data: any) => {
    await saveDebt(data);
    setIsPanelOpen(false);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Deuda registrada', showConfirmButton: false, timer: 3000, background: '#1e293b', color: '#fff' });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
        title: '¿Eliminar deuda?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', background: '#0f172a', color: '#fff'
    });
    if (res.isConfirmed) {
        await deleteDebt(id);
        setDebts(prev => prev.filter(d => d.id !== id));
        router.refresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <DebtPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onSave={handleSaveDebt} />

      <PaymentConfirmationModal 
        isOpen={isPaymentModalOpen && !!activeDebt}
        onClose={() => { setIsPaymentModalOpen(false); setActiveDebt(null); }}
        onConfirm={handleMethodSelection}
        itemName={activeDebt?.name || ''}
        amount={activeDebt ? getAutomaticPaymentAmount(activeDebt) : 0}
      />

      <AccountSelectorModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSelect={handleAccountSelection}
        accounts={cardAccounts}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="text-rose-500" /> Mis Deudas
          </h1>
          <p className="text-slate-400 text-sm mt-1">Controla tus préstamos y compras a meses.</p>
        </div>
        <button onClick={() => setIsPanelOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors shadow-lg shadow-blue-900/20">
            <Plus size={18} /> Nueva Deuda
        </button>
      </div>

      {/* GRID (Usando sortedDebts en lugar de debts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedDebts.map(debt => {
            const paidAmount = debt.totalAmount - debt.currentBalance;
            const percentage = Math.min(100, Math.round((paidAmount / debt.totalAmount) * 100));
            const isFinished = debt.currentBalance <= 0.1;
            const daysLeft = getDaysUntilDue(debt.nextPaymentDate);
            const isUrgent = daysLeft <= 7 && !isFinished;
            const status = getStatusBadge(daysLeft, isFinished);
            const StatusIcon = status.icon;

            return (
                <div key={debt.id} className={`border rounded-2xl p-6 relative overflow-hidden transition-all group ${isFinished ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                    
                    {/* Alerta Lateral Roja */}
                    {isUrgent && <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>}

                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${isFinished ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                            {isFinished ? <CheckCircle2 size={24}/> : <TrendingDown size={24}/>}
                        </div>
                        <button onClick={() => handleDelete(debt.id)} className="text-slate-600 hover:text-rose-500 transition-colors bg-slate-950/50 p-2 rounded-lg">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 truncate" title={debt.name}>{debt.name}</h3>
                    
                    {/* FECHA SIEMPRE VISIBLE */}
                    <div className="flex items-center gap-2 text-xs mb-4">
                        <span className={`px-2 py-0.5 rounded border ${isUrgent ? 'bg-rose-950/30 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                            {getFrequencyLabel(debt.paymentFrequency)}
                        </span>
                        {!isFinished && (
                            <span className="flex items-center gap-1 text-slate-300 font-medium">
                                <Calendar size={12} className="text-slate-500"/> 
                                {new Date(debt.nextPaymentDate + "T12:00:00").toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </span>
                        )}
                    </div>
                    
                    {/* INFO DE MONTOS */}
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Restante</p>
                            <p className={`text-2xl font-mono font-bold ${isFinished ? 'text-emerald-400' : 'text-white'}`}>
                                {formatCurrency(debt.currentBalance)}
                            </p>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
                                <p className="text-xs font-medium text-slate-400 line-through decoration-slate-600">
                                    {formatCurrency(debt.totalAmount)}
                                </p>
                            </div>
                            {!isFinished && (
                                <div>
                                    <p className="text-[10px] text-emerald-500/70 uppercase tracking-wider">Abonado</p>
                                    <p className="text-sm font-bold text-emerald-400">
                                        {formatCurrency(paidAmount)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <div className="relative w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-rose-500'}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    
                    {/* INFO INFERIOR */}
                    <div className="flex justify-between items-center mb-6 h-8">
                        <span className="text-xs text-slate-400 font-medium">
                            {debt.totalInstallments && debt.totalInstallments > 0 
                                ? `${debt.installmentsPaid} / ${debt.totalInstallments} Pagos`
                                : `${percentage}% Pagado`
                            }
                        </span>

                        {!isFinished && (
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${status.color}`}>
                                <StatusIcon size={12} />
                                {status.text}
                            </div>
                        )}
                    </div>

                    {!isFinished ? (
                        <button 
                            onClick={() => handleInitiatePayment(debt)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:border-blue-500/50 group-hover:bg-blue-600/10 group-hover:border-blue-500/30 group-hover:text-blue-400"
                        >
                            <TrendingDown size={18}/> Registrar Abono
                        </button>
                    ) : (
                        <div className="w-full bg-emerald-900/20 border border-emerald-500/20 py-3 rounded-xl flex items-center justify-center gap-2 text-emerald-400 font-bold">
                            <CheckCircle2 size={18}/> Deuda Saldada
                        </div>
                    )}
                </div>
            )
        })}

        {debts.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <CreditCard size={40} className="mb-4 opacity-50" />
                <p>No tienes deudas registradas.</p>
                <button onClick={() => setIsPanelOpen(true)} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold">Registrar primera deuda</button>
            </div>
        )}
      </div>
    </div>
  );
}