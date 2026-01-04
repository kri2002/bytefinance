import AccountsList from '@/components/accounts/AccountsList';
import { getAccounts } from '@/lib/actions';

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AccountsList initialData={accounts as any} />
      </div>
    </main>
  );
}