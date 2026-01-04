import TransactionsList from '@/components/transactions/TransactionList';
import { getTransactionsByMonth } from '@/lib/actions';

export default async function TransactionsPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const initialData = await getTransactionsByMonth(currentYear, currentMonth);

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <TransactionsList 
            initialData={initialData as any} 
            initialYear={currentYear} 
            initialMonth={currentMonth}
        />
      </div>
    </main>
  );
}