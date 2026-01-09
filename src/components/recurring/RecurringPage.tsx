'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Plus, Trash2, CheckCircle2, AlertCircle, Edit, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

// 1. IMPORTAMOS TUS MODALES PERSONALIZADOS
// Ajusta la ruta si los tienes en otra carpeta, por ejemplo '@/components/dashboard/...'
import RecurringFormModal from './RecurringFormModal'; 
import PaymentConfirmationModal from './PaymentConfirmationModal';
import AccountSelectorModal from '../dashboard/AccountSelectorModal';

import { 
  saveRecurringPayment, 
  deleteRecurringPayment, 
  saveTransaction, 
  updateAccountBalance 
} from '@/lib/actions';

// INTERFACES
interface RecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  nextDate: string; 
}

interface Account {
  id: string;
  name: string;
  color: string;
  type: string;
  balance: number;
}

interface RecurringPageProps {
  initialData: RecurringItem[];
  accounts: Account[]; // Necesario para el selector de tarjetas
}

export default function RecurringPage({ initialData, accounts }: RecurringPageProps) {
  const router = useRouter();
  const getTodayString = () => new Date().toLocaleDateString('en-CA');

  // --- ESTADOS ---
  const [items, setItems] = useState<RecurringItem[]>(initialData || []);
  
  // Estado para Crear/Editar Suscripción
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados para el Flujo de Pago (Igual que en Dashboard)
  const [paymentItem, setPaymentItem] = useState<RecurringItem | null>(null);
  const [isCardSelectorOpen, setIsCardSelectorOpen] = useState(false);

  useEffect(() => {
    setItems(initialData || []);
  }, [initialData]);

  // Filtros y Ordenamiento
  const sortedItems = [...items].sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  const itemToEdit = editingId ? items.find(i => i.id === editingId) : null;
  
  // Filtramos cuentas para que no salga "Efectivo" en el selector de tarjetas
  const cardAccounts = accounts.filter(
    (a) => a.type !== "cash" && !a.name.toLowerCase().includes("efectivo")
  );

  // --- LÓGICA DE PROCESAMIENTO DE PAGO ---
  const processPayment = async (accountName: string) => {
    if (!paymentItem) return;

    const amountVal = Math.abs(paymentItem.amount);
    const todayISO = getTodayString();

    // 1. Guardar la Transacción (Gasto)
    await saveTransaction({
        name: paymentItem.name,
        amount: -amountVal, // Gasto es negativo
        type: 'expense',
        date: todayISO,
        status: 'paid',
        method: accountName,
        category: 'Suscripciones'
    });

    // 2. Descontar Saldo
    await updateAccountBalance(accountName, -amountVal);

    // 3. Calcular Nueva Fecha
    const currentNextDate = new Date(paymentItem.nextDate + 'T12:00:00');
    const next = new Date(currentNextDate);
    
    if (paymentItem.frequency === 'weekly') next.setDate(currentNextDate.getDate() + 7);
    if (paymentItem.frequency === 'biweekly') next.setDate(currentNextDate.getDate() + 15);
    if (paymentItem.frequency === 'monthly') next.setMonth(currentNextDate.getMonth() + 1);
    if (paymentItem.frequency === 'yearly') next.setFullYear(currentNextDate.getFullYear() + 1);

    const newNextDateStr = next.toLocaleDateString('en-CA');

    // 4. Actualizar la Suscripción en BD
    await saveRecurringPayment({
        ...paymentItem,
        nextDate: newNextDateStr
    });

    // 5. Actualizar UI Localmente (Optimistic Update)
    setItems(prev => prev.map(i => i.id === paymentItem.id ? { ...i, nextDate: newNextDateStr } : i));

    // Limpieza
    setPaymentItem(null);
    setIsCardSelectorOpen(false);

    Swal.fire({
        toast: true, position: 'top-end', icon: 'success', 
        title: 'Pago registrado', showConfirmButton: false, timer: 3000, 
        background: '#1e293b', color: '#fff'
    });
    
    router.refresh();
  };

  // --- HANDLERS DE INTERACCIÓN DE PAGO ---
  
  // Paso 1: Usuario da click en pagar -> Se abre PaymentConfirmationModal (setPaymentItem)
  const handleInitiatePayment = (item: RecurringItem) => {
    setPaymentItem(item);
  };

  // Paso 2: Usuario confirma método (Efectivo o Tarjeta)
  const handleConfirmMethod = (method: 'cash' | 'card') => {
    if (method === 'cash') {
        const cashAcc = accounts.find(a => a.type === 'cash' || a.name.toLowerCase().includes('efectivo'));
        processPayment(cashAcc ? cashAcc.name : 'Efectivo');
    } else {
        setIsCardSelectorOpen(true);
        // No cerramos paymentItem aún, esperamos a que seleccione la tarjeta
    }
  };

  // Paso 3: Usuario selecciona la tarjeta específica
  const handleSelectCard = (account: Account) => {
    processPayment(account.name);
  };

  // --- HANDLERS DE CREACIÓN / EDICIÓN ---
  const handleOpenNew = () => { setEditingId(null); setIsFormModalOpen(true); };
  const handleOpenEdit = (id: string) => { setEditingId(id); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => { setIsFormModalOpen(false); setEditingId(null); };

  const handleSaveItem = async (formData: { name: string; amount: string; frequency: string; nextDate: string }) => {
    // ... (Tu lógica existente de guardado) ...
    const tempId = editingId || crypto.randomUUID(); 
    const newItem = {
        id: tempId,
        name: formData.name,
        amount: Number(formData.amount),
        frequency: formData.frequency as RecurringItem['frequency'],
        nextDate: formData.nextDate
    };

    if (editingId) {
        setItems(prev => prev.map(i => i.id === editingId ? newItem : i));
    } else {
        setItems(prev => [...prev, newItem]);
    }
    handleCloseFormModal();

    await saveRecurringPayment({
        id: editingId || undefined,
        name: formData.name,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        nextDate: formData.nextDate
    });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
        title: '¿Eliminar?', text: "Se borrará de tu configuración.",
        icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#1e293b',
        confirmButtonText: 'Sí, borrar', background: '#0f172a', color: '#fff'
    });

    if (confirm.isConfirmed) {
        setItems(prev => prev.filter(i => i.id !== id)); 
        await deleteRecurringPayment(id);
        router.refresh();
    }
  };

  // HELPERS VISUALES
  const isDue = (dateStr: string) => new Date(dateStr) <= new Date(getTodayString());
  const getDaysRemaining = (dateStr: string) => {
    const today = new Date(getTodayString()); 
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  const getFrequencyLabel = (freq: string) => {
    const map: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', yearly: 'Anual' };
    return map[freq] || freq;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2 md:p-0">
      
      {/* 1. MODAL FORMULARIO (Crear/Editar) */}
      <RecurringFormModal 
          isOpen={isFormModalOpen} 
          onClose={handleCloseFormModal} 
          onSave={handleSaveItem} 
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          initialData={itemToEdit as any}
      />
      
      {/* 2. MODAL CONFIRMACIÓN DE MÉTODO DE PAGO */}
      <PaymentConfirmationModal 
        isOpen={!!paymentItem && !isCardSelectorOpen} 
        onClose={() => setPaymentItem(null)}
        onConfirm={handleConfirmMethod}
        itemName={paymentItem?.name || ''}
        amount={paymentItem?.amount || 0}
      />

      {/* 3. MODAL SELECTOR DE TARJETA */}
      <AccountSelectorModal
        isOpen={isCardSelectorOpen}
        onClose={() => setIsCardSelectorOpen(false)}
        onSelect={handleSelectCard}
        accounts={cardAccounts}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><RefreshCcw className="text-blue-400" /> Pagos Frecuentes</h1>
            <p className="text-slate-400 mt-1">Suscripciones y servicios ordenados por vencimiento.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
            <Plus size={20}/> Nuevo
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">Servicio</th>
                        <th className="p-4 font-semibold hidden md:table-cell">Frecuencia</th>
                        <th className="p-4 font-semibold">Próximo Cobro</th>
                        <th className="p-4 font-semibold text-right">Monto</th>
                        <th className="p-4 font-semibold text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {sortedItems.map((item) => {
                        const due = isDue(item.nextDate);
                        const daysLeft = getDaysRemaining(item.nextDate);
                        const showCountdown = daysLeft > 0 && daysLeft <= 15;

                        return (
                            <tr key={item.id} className={`group transition-colors ${due ? 'bg-amber-950/10 hover:bg-amber-950/20' : 'hover:bg-slate-800/50'}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white block">{item.name}</span>
                                        {due && <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold uppercase">Vence Hoy</span>}
                                        {showCountdown && (
                                            <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-medium">
                                                <Clock size={10} /> {daysLeft} días
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-400 text-sm hidden md:table-cell">
                                    {getFrequencyLabel(item.frequency)}
                                </td>
                                <td className={`p-4 font-mono text-sm ${due ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                                    {item.nextDate}
                                </td>
                                <td className="p-4 text-right font-mono text-slate-200">
                                    {formatCurrency(item.amount)}
                                </td>
                                <td className="p-4 flex justify-center items-center gap-2">
                                    <button 
                                        onClick={() => handleInitiatePayment(item)} 
                                        title={due ? "Pagar ahora" : "Adelantar pago"} 
                                        className={`p-2 rounded-lg transition-all ${due ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                    >
                                        {due ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
                                    </button>
                                    <button onClick={() => handleOpenEdit(item.id)} className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-950/30 transition-colors">
                                        <Edit size={18}/>
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    {sortedItems.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay pagos configurados.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}