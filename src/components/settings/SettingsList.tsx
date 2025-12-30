'use client';

import { useState } from 'react';
import { User, Bell, Shield, Download, Trash2, Save, Mail, Moon, Globe, DollarSign } from 'lucide-react';

export default function SettingsList() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del Formulario
  const [profile, setProfile] = useState({
    name: 'Cristo Aguilar',
    email: 'dev@bytefinance.com',
    currency: 'MXN',
    budgetLimit: '15000',
    notifications: true,
    darkMode: true
  });

  const handleSave = () => {
    setIsLoading(true);
    // Simular petición al servidor
    setTimeout(() => {
        setIsLoading(false);
        // Aquí podrías poner un Toast de éxito
        alert("Configuración guardada correctamente.");
    }, 1000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "bytefinance_backup.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400 mt-1">Administra tu perfil y preferencias de la aplicación.</p>
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: MENÚ / PERFIL RÁPIDO */}
        <div className="space-y-6">
            {/* Tarjeta de Perfil */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-1 mb-4">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                        {/* Avatar Placeholder */}
                        <User size={40} className="text-slate-400" />
                        {/* Si tuvieras imagen real: <img src="..." /> */}
                    </div>
                </div>
                <h2 className="text-white font-bold text-lg">{profile.name}</h2>
                <p className="text-slate-500 text-sm">Plan Gratuito</p>
                
                <button className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors w-full">
                    Cambiar Avatar
                </button>
            </div>

            {/* Navegación Rápida (Estética) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hidden md:block">
                <div className="p-4 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer flex items-center gap-3 text-white transition-colors">
                    <User size={18} className="text-blue-500"/> Mi Perfil
                </div>
                <div className="p-4 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                    <Bell size={18} className="text-slate-500"/> Notificaciones
                </div>
                <div className="p-4 hover:bg-slate-800/50 cursor-pointer flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                    <Shield size={18} className="text-slate-500"/> Seguridad
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIOS */}
        <div className="md:col-span-2 space-y-6">
            
            {/* Sección 1: Datos Personales */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <User size={20} className="text-blue-500"/> Información Personal
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Correo Electrónico</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input 
                                type="email" 
                                value={profile.email}
                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección 2: Preferencias */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Globe size={20} className="text-emerald-500"/> Preferencias de la App
                </h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Moneda Principal</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                                <select 
                                    value={profile.currency}
                                    onChange={(e) => setProfile({...profile, currency: e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="MXN">Peso Mexicano (MXN)</option>
                                    <option value="USD">Dólar (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Límite de Presupuesto (Alerta)</label>
                            <input 
                                type="number" 
                                value={profile.budgetLimit}
                                onChange={(e) => setProfile({...profile, budgetLimit: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-900 p-2 rounded-lg text-slate-400"><Bell size={20}/></div>
                            <div>
                                <p className="text-white font-medium">Notificaciones de Pagos</p>
                                <p className="text-xs text-slate-500">Recibir alertas cuando un pago recurrente venza.</p>
                            </div>
                        </div>
                        {/* Toggle Switch Simulado */}
                        <button 
                            onClick={() => setProfile({...profile, notifications: !profile.notifications})}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${profile.notifications ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile.notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-900 p-2 rounded-lg text-slate-400"><Moon size={20}/></div>
                            <div>
                                <p className="text-white font-medium">Modo Oscuro</p>
                                <p className="text-xs text-slate-500">Siempre activo en ByteFinance.</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">ACTIVO</div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Guardando...' : <><Save size={18}/> Guardar Cambios</>}
                    </button>
                </div>
            </div>

            {/* Sección 3: Zona de Datos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-rose-500"/> Gestión de Datos
                </h3>

                <div className="space-y-4">
                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center justify-between p-4 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-xl transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Download size={20} className="text-slate-400 group-hover:text-white transition-colors"/>
                            <div className="text-left">
                                <p className="text-white font-medium">Exportar mis datos</p>
                                <p className="text-xs text-slate-500">Descarga una copia de tus transacciones (JSON).</p>
                            </div>
                        </div>
                    </button>

                    <button className="w-full flex items-center justify-between p-4 bg-rose-950/10 border border-rose-900/30 hover:bg-rose-950/20 hover:border-rose-500/50 rounded-xl transition-all group">
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