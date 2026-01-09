import { getTransactionsByMonth, getCategories, getAccounts } from "@/lib/actions"; // 👈 IMPORTAR ESTOS DOS
import TransactionsList from "@/components/transactions/TransactionList";

export default async function TransactionsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 1. OBTENER LOS DATOS
  const initialData = await getTransactionsByMonth(currentYear, currentMonth);
  const categories = await getCategories(); // 👈 OBTENER CATEGORÍAS
  const accounts = await getAccounts();     // 👈 OBTENER CUENTAS

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <TransactionsList
          initialData={initialData as any}
          initialYear={currentYear}
          initialMonth={currentMonth}
          // 2. PASAR LAS PROPS QUE FALTABAN 👇
          categories={categories || []} 
          accounts={accounts || []}
        />
      </div>
    </main>
  );
}