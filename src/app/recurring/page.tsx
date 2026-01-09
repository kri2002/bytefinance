// src/app/recurring/page.tsx
import { getRecurringPayments, getAccounts } from '@/lib/actions';
import RecurringPage from '@/components/recurring/RecurringPage';

export default async function Page() {
    const data = await getRecurringPayments();
    const accounts = await getAccounts();

    // Pasamos 'accounts' al componente
    return <RecurringPage initialData={data} accounts={accounts} />;
}