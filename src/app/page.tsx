import Dashboard from '@/components/dashboard/Dashboard';
import { 
  getTransactions, 
  getRecurringPayments, 
  getCategories, 
  getAccounts, 
  getDebts // 1. Ya lo tienes importado aquí, ¡bien!
} from '@/lib/actions';

export default async function DashboardPage() {
  // 2. Agregamos 'debts' al destructuring y 'getDebts()' al Promise.all
  const [transactions, recurring, categories, accounts, debts] = await Promise.all([
    getTransactions(),
    getRecurringPayments(),
    getCategories(),
    getAccounts(),
    getDebts() // <--- AQUI HACEMOS LA PETICIÓN
  ]);

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Dashboard 
            initialData={transactions as any} 
            recurringConfig={recurring as any}
            categories={categories as any}
            accounts={accounts as any}
            debts={debts as any} // 3. SE LO PASAMOS AL COMPONENTE
        />
      </div>
    </main>
  );
}