"use client";

import { useState } from "react";
import {
  Plus,
  Wallet,
  CreditCard,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
} from "lucide-react";
import Swal from "sweetalert2";
import AccountFormModal from "./AccountFormModal";
import { saveAccount, deleteAccount } from "@/lib/actions";
import { Account } from "@/lib/types";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type AccountFormValues = {
  name: string;
  type: "debit" | "cash" | "credit";
  balance: number;
  bankName: string;
  color: string;
  last4?: string;
};

interface AccountsListProps {
  initialData: Account[];
}

interface SortableItemProps {
  account: Account;
  onEdit: (acc: Account) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  formatCurrency: (val: number) => string;
}

function SortableAccountItem({
  account,
  onEdit,
  onDelete,
  formatCurrency,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(account)}
      className={`relative overflow-hidden rounded-2xl p-6 h-52 flex flex-col justify-between transition-all hover:shadow-2xl shadow-lg group select-none cursor-grab active:cursor-grabbing border border-transparent hover:border-white/10 ${
        isDragging ? "shadow-2xl scale-105" : ""
      }`}
    >
      <div
        className={`absolute inset-0 bg-linear-to-br ${account.color} opacity-90 group-hover:opacity-100 transition-opacity`}
      />
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm font-medium">
            {account.bankName || "General"}
          </p>
          <h3 className="text-white font-bold text-lg tracking-wide truncate pr-2">
            {account.name}
          </h3>
        </div>
        <div className="flex gap-2">
          <div className="bg-black/20 p-2 rounded-lg backdrop-blur-sm text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100">
            <Edit2 size={20} />
          </div>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => onDelete(account.id, e)}
            className="bg-black/20 p-2 rounded-lg backdrop-blur-sm text-white/50 hover:text-white hover:bg-rose-500/80 transition-all opacity-0 group-hover:opacity-100 z-20"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {account.type !== "cash" && (
        <div className="relative z-10 w-10 h-8 rounded bg-linear-to-tr from-yellow-200 to-yellow-500 opacity-80 mb-2 shadow-sm border border-yellow-600/30"></div>
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-white/70 text-xs mb-1 uppercase tracking-wider font-medium">
              {account.type === "credit" ? "Saldo Deudor" : "Disponible"}
            </p>
            <p className="text-3xl font-mono font-bold text-white tracking-tight drop-shadow-sm">
              {formatCurrency(account.balance)}
            </p>
          </div>
          {account.last4 && (
            <p className="text-white/80 font-mono text-sm tracking-widest drop-shadow-sm">
              •••• {account.last4}
            </p>
          )}
          <div className="text-white/50 group-hover:text-white/80 transition-colors">
            {account.type === "cash" ? (
              <Wallet size={24} />
            ) : account.type === "debit" ? (
              <Landmark size={24} />
            ) : (
              <CreditCard size={24} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountsList({ initialData }: AccountsListProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialData || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [prevInitialDataJSON, setPrevInitialDataJSON] = useState(
    JSON.stringify(initialData)
  );
  const currentInitialDataJSON = JSON.stringify(initialData);

  if (prevInitialDataJSON !== currentInitialDataJSON) {
    setAccounts(initialData || []);
    setPrevInitialDataJSON(currentInitialDataJSON);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAccounts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleOpenNew = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (formData: AccountFormValues) => {
    const isEdit = !!editingAccount;
    const tempId = editingAccount?.id || crypto.randomUUID();

    const newAccount: Account = {
      id: tempId,
      ...formData,
    };

    if (isEdit) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === tempId ? newAccount : a))
      );
    } else {
      setAccounts((prev) => [...prev, newAccount]);
    }

    setIsModalOpen(false);

    const res = await saveAccount({
      ...formData,
      id: isEdit ? tempId : undefined,
    });

    if (res.success) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isEdit ? "Cuenta actualizada" : "Cuenta creada",
        showConfirmButton: false,
        timer: 2000,
        background: "#1e293b",
        color: "#fff",
      });
    } else {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error al guardar",
        background: "#1e293b",
        color: "#fff",
      });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = await Swal.fire({
      title: "¿Eliminar cuenta?",
      text: "Se borrará permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#1e293b",
      confirmButtonText: "Sí, borrar",
      background: "#0f172a",
      color: "#fff",
    });

    if (confirm.isConfirmed) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      await deleteAccount(id);
    }
  };

  const totalAssets = accounts
    .filter((a) => a.type !== "credit")
    .reduce((acc, curr) => acc + curr.balance, 0);
  const totalDebt = accounts
    .filter((a) => a.type === "credit")
    .reduce((acc, curr) => acc + curr.balance, 0);
  const netWorth = totalAssets - totalDebt;
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAccount}
        initialData={editingAccount as unknown as AccountFormValues | null}
      />

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Cuentas</h1>
          <p className="text-slate-400 mt-1">Gestión de activos y tarjetas.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-40">
            <p className="text-xs text-slate-500 font-medium uppercase">
              Patrimonio Neto
            </p>
            <p
              className={`text-xl font-bold mt-1 ${
                netWorth >= 0 ? "text-white" : "text-rose-400"
              }`}
            >
              {formatCurrency(netWorth)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-40">
            <p className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
              <ArrowUpRight size={14} className="text-emerald-500" /> Activos
            </p>
            <p className="text-xl font-bold mt-1 text-emerald-400">
              {formatCurrency(totalAssets)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-40">
            <p className="text-xs text-slate-500 font-medium uppercase flex items-center gap-1">
              <ArrowDownRight size={14} className="text-rose-500" /> Deuda
            </p>
            <p className="text-xl font-bold mt-1 text-rose-400">
              {formatCurrency(totalDebt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h3 className="text-lg font-semibold text-white">Todas las Cuentas</h3>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={18} /> Agregar Cuenta
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={accounts} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <SortableAccountItem
                key={account.id}
                account={account}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                formatCurrency={formatCurrency}
              />
            ))}

            <button
              onClick={handleOpenNew}
              className="h-52 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 hover:bg-slate-900/50 transition-all gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium">Agregar nueva cuenta</span>
            </button>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}