"use client";

import { useState } from "react";
import { X, Save, Tag } from "lucide-react";
import { CategoryFormValues } from "./CategoryManager";

interface CategorySidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormValues) => void;
  initialData: CategoryFormValues | null;
}

const COLORS = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Violet", value: "bg-violet-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Fuchsia", value: "bg-fuchsia-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Rose", value: "bg-rose-500" },
];

const DEFAULT_FORM_DATA = {
  name: "",
  color: COLORS[0].value,
  type: "expense" as "expense" | "income",
};

export default function CategorySidePanel({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CategorySidePanelProps) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [prevPropState, setPrevPropState] = useState(
    JSON.stringify({ isOpen, initialData })
  );
  const currentPropState = JSON.stringify({ isOpen, initialData });

  if (prevPropState !== currentPropState) {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          color: initialData.color,
          type: initialData.type || "expense",
        });
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
    }
    setPrevPropState(currentPropState);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-50 h-full backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full md:w-100 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Tag className="text-blue-500" />{" "}
              {isEditing ? "Editar Categoría" : "Nueva Categoría"}
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
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Nombre
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Comida, Transporte..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Tipo de Movimiento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    formData.type === "expense"
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`py-3 rounded-xl border font-medium transition-all ${
                    formData.type === "income"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  Ingreso
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">
                Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={`h-10 rounded-full ${c.value} transition-all ${
                      formData.color === c.value
                        ? "ring-2 ring-white scale-110"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex items-center justify-center gap-3">
              <div
                className={`w-8 h-8 rounded-full ${formData.color} flex items-center justify-center text-white text-xs font-bold`}
              >
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium">
                {formData.name || "Nombre Categoría"}
              </span>
            </div>
          </form>

          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-900/20"
            >
              <Save size={20} /> Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
