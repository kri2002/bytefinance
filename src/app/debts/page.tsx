import { getDebts, getAccounts } from '@/lib/actions';
import DebtsPage from '@/components/debts/DebtsPage';

export default async function Page() {
    const debts = await getDebts();
    const accounts = await getAccounts();

    return (
        <div className="container mx-auto p-4 md:p-8">
            <DebtsPage initialData={debts as any} accounts={accounts} />
        </div>
    );
}