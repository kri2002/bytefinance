import Dashboard from '@/components/dashboard/Dashboard';
import { 
  getTransactions, 
  getRecurringPayments, 
  getCategories, 
  getAccounts, 
  getDebts 
} from '@/lib/actions';

export default async function DashboardPage() {
  const [transactions, recurring, categories, accounts, debts] = await Promise.all([
    getTransactions(),
    getRecurringPayments(),
    getCategories(),
    getAccounts(),
    getDebts()
  ]);

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Dashboard 
            initialData={transactions} 
            recurringConfig={recurring}
            categories={categories}
            accounts={accounts}
            debts={debts}
        />
      </div>
    </main>
  );
}