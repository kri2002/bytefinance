'use client';

import { useState } from 'react';
import { User, Bell, Shield, FileText, Trash2, Save, Mail, Moon, Globe, DollarSign, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
// 1. IMPORTAR LIBRERÍAS DE PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { updateUserSettings, getFullUserDataForExport } from '@/lib/actions';

interface SettingsListProps {
  initialData: {
    name: string;
    email: string;
    currency: string;
    budgetLimit: string;
    notifications: boolean;
    darkMode: boolean;
  }
}

export default function SettingsList({ initialData }: SettingsListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [profile, setProfile] = useState(initialData);

  const Toast = Swal.mixin({
    toast: true, position: "top-end", showConfirmButton: false, timer: 3000,
    background: "#1e293b", color: "#fff", iconColor: "#34d399",
    customClass: { popup: "colored-toast" }
  });

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateUserSettings({
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
        budgetLimit: profile.budgetLimit,
        notifications: profile.notifications
    });
    setIsLoading(false);
    if (result.success) Toast.fire({ icon: 'success', title: 'Configuración guardada' });
    else Toast.fire({ icon: 'error', title: 'Error al guardar' });
  };

  // --- LÓGICA DE GENERACIÓN DE PDF ---
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        // A. Obtener datos reales
        const data = await getFullUserDataForExport();
        if (!data) throw new Error("No data found");

        // B. Inicializar PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- ENCABEZADO ---
        doc.setFillColor(30, 41, 59); // Color Slate-900 (aprox)
        doc.rect(0, 0, pageWidth, 40, 'F'); // Barra superior oscura
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("ByteFinance", 14, 20); // Logo Texto
        
        doc.setFontSize(10);
        doc.text("Reporte Financiero Completo", 14, 28);
        
        // Datos del Usuario (Derecha)
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, pageWidth - 14, 20, { align: 'right' });
        doc.text(`Usuario: ${profile.name}`, pageWidth - 14, 28, { align: 'right' });

        let currentY = 50; // Posición vertical inicial

        // --- SECCIÓN 1: RESUMEN DE CUENTAS ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Estado de Cuentas", 14, currentY);
        currentY += 5;

        const accountsData = data.accounts.map((acc: any) => [
            acc.name,
            acc.type.toUpperCase(),
            `$${new Intl.NumberFormat('es-MX').format(acc.balance)}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Cuenta', 'Tipo', 'Saldo Actual']],
            body: accountsData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }, // Blue-600
            styles: { fontSize: 10 },
        });

        // Actualizar Y para la siguiente tabla
        // @ts-ignore (autoTable agrega lastAutoTable a doc)
        currentY = doc.lastAutoTable.finalY + 15;

        // --- SECCIÓN 2: HISTORIAL DE TRANSACCIONES ---
        doc.setFontSize(14);
        doc.text("Historial de Movimientos", 14, currentY);
        currentY += 5;

        const txData = data.transactions.map((tx: any) => [
            tx.date,
            tx.name,
            tx.category || '-',
            tx.method || '-',
            tx.type === 'income' ? 'Ingreso' : 'Gasto',
            `$${new Intl.NumberFormat('es-MX').format(Math.abs(tx.amount))}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Fecha', 'Concepto', 'Categoría', 'Método', 'Tipo', 'Monto']],
            body: txData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }, // Emerald-500
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 25 }, // Fecha
                5: { halign: 'right', fontStyle: 'bold' } // Monto alineado a derecha
            }
        });

        // C. Descargar
        doc.save(`ByteFinance_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
        Toast.fire({ icon: 'success', title: 'PDF descargado' });

    } catch (error) {
        console.error(error);
        Toast.fire({ icon: 'error', title: 'Error al generar PDF' });
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400 mt-1">Administra tu perfil y preferencias de la aplicación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: PERFIL */}
        <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-1 mb-4">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        <User size={40} className="text-slate-400" />
                    </div>
                </div>
                <h2 className="text-white font-bold text-lg">{profile.name || 'Usuario'}</h2>
                <p className="text-slate-500 text-sm">Plan Gratuito</p>
            </div>
            
            {/* Menú Lateral (Visual) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hidden md:block">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center gap-3 text-white font-medium">
                    <User size={18} className="text-blue-500"/> Mi Perfil
                </div>
                <div className="p-4 border-b border-slate-800 text-slate-400 flex items-center gap-3">
                    <Bell size={18} className="text-slate-500"/> Notificaciones
                </div>
                 <div className="p-4 text-slate-400 flex items-center gap-3">
                    <Shield size={18} className="text-slate-500"/> Seguridad
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIOS */}
        <div className="md:col-span-2 space-y-6">
            
            {/* Sección 1: Datos Personales (Reducido para brevedad, mantener tu código igual) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <User size={20} className="text-blue-500"/> Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Nombre Completo</label>
                        <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Correo Electrónico</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección 2: Preferencias */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Globe size={20} className="text-emerald-500"/> Preferencias
                </h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Moneda</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                                <select value={profile.currency} onChange={(e) => setProfile({...profile, currency: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:border-emerald-500 outline-none appearance-none">
                                    <option value="MXN">Peso Mexicano (MXN)</option>
                                    <option value="USD">Dólar (USD)</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Presupuesto</label>
                            <input type="number" value={profile.budgetLimit} onChange={(e) => setProfile({...profile, budgetLimit: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end">
                    <button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Guardar
                    </button>
                </div>
            </div>

            {/* Sección 3: GESTIÓN DE DATOS (PDF) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-rose-500"/> Gestión de Datos
                </h3>

                <div className="space-y-4">
                    {/* BOTÓN DE EXPORTAR PDF */}
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-xl transition-all group disabled:opacity-50"
                    >
                        <div className="flex items-center gap-3">
                            {isExporting ? <Loader2 size={20} className="animate-spin text-slate-400"/> : <FileText size={20} className="text-slate-400 group-hover:text-white transition-colors"/>}
                            <div className="text-left">
                                <p className="text-white font-medium">
                                    {isExporting ? 'Generando reporte...' : 'Descargar Reporte PDF'}
                                </p>
                                <p className="text-xs text-slate-500">Obtén un estado de cuenta detallado de tus finanzas.</p>
                            </div>
                        </div>
                    </button>

                    <button disabled className="w-full flex items-center justify-between p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                            <Trash2 size={20} className="text-rose-500"/>
                            <div className="text-left">
                                <p className="text-rose-400 font-medium">Borrar todos los datos</p>
                                <p className="text-xs text-rose-500/60">Esta acción no se puede deshacer.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}