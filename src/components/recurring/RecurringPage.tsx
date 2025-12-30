'use client';

import { useState } from 'react';
import { RefreshCcw, Plus, Trash2, CheckCircle2, AlertCircle, Edit, Clock } from 'lucide-react';
import RecurringFormModal from './RecurringFormModal';
import PaymentConfirmationModal from './PaymentConfirmationModal';

interface RecurringItem {
  id: number;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  nextDate: string; 
}

interface RecurringPageProps {
  // Actualizamos la firma para aceptar el método
  onProcessPayment: (item: { name: string; amount: number; date: string; method: 'cash' | 'card' }) => void;
}

export default function RecurringPage({ onProcessPayment }: RecurringPageProps) {
  const getTodayString = () => new Date().toLocaleDateString('en-CA');

  const [items, setItems] = useState<RecurringItem[]>([
    { id: 1, name: "Netflix Premium", amount: 299, frequency: 'monthly', nextDate: getTodayString() }, 
    { id: 2, name: "Spotify Duo", amount: 169, frequency: 'monthly', nextDate: '2025-12-15' },
    { id: 3, name: "Préstamo Auto", amount: 4500, frequency: 'monthly', nextDate: '2025-12-28' },
    { id: 4, name: "Internet", amount: 500, frequency: 'monthly', nextDate: '2026-01-05' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // NUEVO ESTADO: El ítem que estamos a punto de pagar
  const [paymentItem, setPaymentItem] = useState<RecurringItem | null>(null);

  const sortedItems = [...items].sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
  const itemToEdit = editingId ? items.find(i => i.id === editingId) : null;

  const getDaysRemaining = (dateStr: string) => {
    const today = new Date(getTodayString()); 
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const handleOpenNew = () => { setEditingId(null); setIsModalOpen(true); };
  const handleOpenEdit = (id: number) => { setEditingId(id); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

  const handleSaveItem = (formData: { name: string; amount: string; frequency: string; nextDate: string }) => {
    if (editingId) {
        setItems(prev => prev.map(item => item.id === editingId ? { ...item, ...formData, amount: Number(formData.amount), frequency: formData.frequency as any } : item));
    } else {
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems(prev => [...prev, { id: newId, ...formData, amount: Number(formData.amount), frequency: formData.frequency as any }]);
    }
    setEditingId(null);
  };

  const handleDelete = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  // 1. INICIAR PROCESO (Click en botón de tabla)
  const handleInitiatePayment = (item: RecurringItem) => {
      setPaymentItem(item); // Esto abre el modal de confirmación
  };

  // 2. CONFIRMAR Y PROCESAR (Click en Efectivo/Tarjeta)
  const handleConfirmPayment = (method: 'cash' | 'card') => {
    if (!paymentItem) return;

    // Enviamos al padre con el método seleccionado
    onProcessPayment({ 
        name: paymentItem.name, 
        amount: paymentItem.amount, 
        date: getTodayString(),
        method 
    });

    // Recalcular próxima fecha
    const current = new Date(paymentItem.nextDate + 'T12:00:00');
    const next = new Date(current);
    if (paymentItem.frequency === 'weekly') next.setDate(current.getDate() + 7);
    if (paymentItem.frequency === 'biweekly') next.setDate(current.getDate() + 15);
    if (paymentItem.frequency === 'monthly') next.setMonth(current.getMonth() + 1);
    if (paymentItem.frequency === 'yearly') next.setFullYear(current.getFullYear() + 1);

    setItems(prev => prev.map(i => i.id === paymentItem.id ? { ...i, nextDate: next.toLocaleDateString('en-CA') } : i));
    
    // Cerramos modal
    setPaymentItem(null);
  };

  const isDue = (dateStr: string) => new Date(dateStr) <= new Date(getTodayString());
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  const getFrequencyLabel = (freq: string) => {
    const map: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual', yearly: 'Anual' };
    return map[freq] || freq;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2 md:p-0">
      
      {/* Modals */}
      <RecurringFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveItem} initialData={itemToEdit} />
      
      <PaymentConfirmationModal 
        isOpen={!!paymentItem} 
        onClose={() => setPaymentItem(null)}
        onConfirm={handleConfirmPayment}
        itemName={paymentItem?.name || ''}
        amount={paymentItem?.amount || 0}
      />

      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><RefreshCcw className="text-blue-400" /> Pagos Frecuentes</h1>
            <p className="text-slate-400 mt-1">Suscripciones y servicios ordenados por vencimiento.</p>
        </div>
        <button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
            <Plus size={20}/> Nuevo
        </button>
      </div>

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
                                    {/* Botón Pagar -> Abre Modal Confirmación */}
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