import RecurringPage from '@/components/recurring/RecurringPage'; 
import { getRecurringPayments } from '@/lib/actions';

export default async function Page() {
  const recurringData = await getRecurringPayments();

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RecurringPage initialData={recurringData as any} />
      </div>
    </main>
  );
}