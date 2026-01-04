'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Layers } from 'lucide-react';
import Swal from 'sweetalert2';
import CategorySidePanel from './CategorySidePanel';
import { saveCategory, deleteCategory } from '@/lib/actions';

interface Category {
  id: string;
  name: string;
  color: string;
  type: 'expense' | 'income';
}

interface CategoryManagerProps {
  initialData: Category[];
}

export default function CategoryManager({ initialData }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialData || []);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleOpenNew = () => { setEditingCategory(null); setIsPanelOpen(true); };
  
  const handleOpenEdit = (cat: Category) => { setEditingCategory(cat); setIsPanelOpen(true); };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (formData: any) => {
    const isEdit = !!editingCategory;
    const tempId = editingCategory?.id || crypto.randomUUID();
    const newCat = { id: tempId, ...formData };

    if (isEdit) {
        setCategories(prev => prev.map(c => c.id === tempId ? newCat : c));
    } else {
        setCategories(prev => [...prev, newCat]);
    }
    setIsPanelOpen(false);

    const res = await saveCategory({ ...formData, id: isEdit ? tempId : undefined });
    if (res.success) {
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: isEdit ? 'Categoría actualizada' : 'Categoría creada', 
            showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#fff'
        });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = await Swal.fire({
        title: '¿Eliminar categoría?',
        text: "Los gastos asociados no se borrarán, pero perderán su etiqueta.",
        icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#ef4444', cancelButtonColor: '#1e293b',
        confirmButtonText: 'Borrar', background: '#0f172a', color: '#fff'
    });

    if (confirm.isConfirmed) {
        setCategories(prev => prev.filter(c => c.id !== id));
        await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <CategorySidePanel 
            isOpen={isPanelOpen} 
            onClose={() => setIsPanelOpen(false)} 
            onSave={handleSave} 
            initialData={editingCategory} 
        />

        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Layers className="text-purple-500"/> Categorías</h1>
                <p className="text-slate-400">Organiza tus movimientos con etiquetas.</p>
            </div>
            <button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
                <Plus size={20}/> Nueva
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
                <div 
                    key={cat.id} 
                    onClick={() => handleOpenEdit(cat)}
                    className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${cat.color} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                            {cat.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded border ${cat.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                {cat.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => handleDelete(cat.id, e)}
                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            ))}
            
            {categories.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-500">No hay categorías. Crea la primera.</p>
                </div>
            )}
        </div>
    </div>
  );
}