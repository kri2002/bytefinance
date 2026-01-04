import Dashboard from '@/components/dashboard/Dashboard';
import { getTransactions, getRecurringPayments, getCategories, getAccounts } from '@/lib/actions';

export default async function DashboardPage() {
  // Cargamos TODO: Transacciones, Recurrentes, Categorías y Cuentas
  const [transactions, recurring, categories, accounts] = await Promise.all([
    getTransactions(),
    getRecurringPayments(),
    getCategories(),
    getAccounts()
  ]);

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Dashboard 
            initialData={transactions as any} 
            recurringConfig={recurring as any}
            categories={categories as any}
            accounts={accounts as any}
        />
      </div>
    </main>
  );
}