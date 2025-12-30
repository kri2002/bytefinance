'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, RefreshCcw, Save, Edit } from 'lucide-react';

// 1. Definimos la interfaz del objeto que recibiremos para editar
interface RecurringItemData {
    id?: number; // Opcional porque al crear uno nuevo no tiene ID todavía
    name: string;
    amount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    nextDate: string;
}

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { name: string; amount: string; frequency: string; nextDate: string }) => void;
  // 2. Nueva prop: Datos iniciales para edición (opcional)
  initialData?: RecurringItemData | null;
}

export default function RecurringFormModal({ isOpen, onClose, onSave, initialData }: RecurringFormModalProps) {
  const getTodayString = () => new Date().toLocaleDateString('en-CA');
  
  // 3. Determinamos si estamos en modo edición basado en si existe initialData
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    nextDate: getTodayString()
  });

  // 4. EFECTO COMBINADO: Bloqueo de scroll y Pre-llenado del formulario
  useEffect(() => {
    if (isOpen) {
      // Bloqueo de scroll
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

      // Lógica de pre-llenado
      if (initialData) {
          // MODO EDICIÓN: Llenamos con los datos existentes
          setFormData({
              name: initialData.name,
              // Convertimos el número a string para el input
              amount: initialData.amount.toString(),
              frequency: initialData.frequency,
              nextDate: initialData.nextDate
          });
      } else {
          // MODO CREACIÓN: Reseteamos a valores por defecto
          setFormData({ name: '', amount: '', frequency: 'monthly', nextDate: getTodayString() });
      }

    } else {
      // Desbloqueo scroll al cerrar
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
    // IMPORTANTE: Añadir initialData a las dependencias para que reaccione al cambio
  }, [isOpen, initialData]); 

  const handleClose = () => {
    onClose();
    // Limpiamos el formulario después de la animación de cierre
    setTimeout(() => {
        setFormData({ name: '', amount: '', frequency: 'monthly', nextDate: getTodayString() });
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;
    
    // Enviamos los datos al padre
    onSave(formData);
    
    // Cerramos (el padre se encarga de limpiar el estado de edición)
    onClose();
  };

  const formatPreview = (val: string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-[90] h-full backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose} 
      />

      <div 
        className={`fixed top-0 right-0 z-[100] h-[100dvh] w-full md:w-[450px] bg-slate-950 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
            
            {/* Header Dinámico */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {/* Cambiamos icono y texto según modo */}
                    {isEditing ? <Edit size={20} className="text-amber-400"/> : <RefreshCcw size={20} className="text-blue-500"/>}
                    {isEditing ? 'Editar Recurrente' : 'Nuevo Recurrente'}
                </h2>
                <p className="text-sm text-slate-400">
                    {isEditing ? 'Modifica los detalles del pago.' : 'Configura un pago fijo.'}
                </p>
              </div>
              <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
               {/* ... (Inputs del formulario permanecen igual) ... */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200"><Tag size={16} /> Nombre del Servicio</label>
                <input type="text" placeholder="Ej. Netflix, Renta, Gym..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"/>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-400"><DollarSign size={16} /> Monto</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"><DollarSign size={18} /></div>
                  <input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
              </div>

              <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300"><RefreshCcw size={16} /> Frecuencia de Cobro</label>
                  <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                      <option value="weekly">Semanal (Cada 7 días)</option>
                      <option value="biweekly">Quincenal (Cada 15 días)</option>
                      <option value="monthly">Mensual (Cada mes)</option>
                      <option value="yearly">Anual (Cada año)</option>
                  </select>
              </div>

              <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300"><Calendar size={16} /> Próxima Fecha de Cobro</label>
                  <input type="date" value={formData.nextDate} onChange={e => setFormData({...formData, nextDate: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"/>
                  <p className="text-xs text-slate-500 pl-1">Esta fecha determinará cuándo aparecerá en tu dashboard.</p>
              </div>
            </form>

            <div className="p-5 border-t border-slate-800 bg-slate-900/50 space-y-3 pb-safe">
                <div className="flex justify-between text-sm text-slate-400 px-1">
                    <span>Monto Recurrente:</span>
                    <span className="font-bold text-blue-400">{formatPreview(formData.amount)}</span>
                </div>
                {/* Botón Dinámico */}
                <button 
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all flex justify-center items-center gap-2 shadow-lg hover:-translate-y-0.5 ${
                      isEditing 
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 hover:shadow-amber-900/60' // Color Ámbar para editar
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 hover:shadow-blue-900/60' // Color Azul para crear
                  }`}
                >
                  {isEditing ? <Edit size={20} /> : <Save size={20} />} 
                  {isEditing ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
                </button>
            </div>
        </div>
      </div>
    </>
  );
}