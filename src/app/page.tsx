import Dashboard from '@/components/dashboard/Dashboard';
import { getTransactions, getRecurringPayments } from '@/lib/actions';

export default async function Home() {
  
  const [transactions, recurringConfig] = await Promise.all([
    getTransactions(),
    getRecurringPayments()
  ]);

  return (
    <main className="p-4 md:p-8">
      <Dashboard 
          initialData={transactions as any} 
          recurringConfig={recurringConfig as any} 
      />
    </main>
  );
}