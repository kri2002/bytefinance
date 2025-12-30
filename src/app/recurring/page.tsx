import RecurringPage from '@/components/recurring/RecurringPage';

interface PaymentItem {
  name: string;
  amount: number;
  date: string;
}

export default function Page() {
  const handlePayment = async (item: PaymentItem) => {
    'use server';
    
    console.log("Procesar pago:", item);
    // Aquí conectarías con tu base de datos (DynamoDB/Postgres) en el futuro
  };

  return <RecurringPage onProcessPayment={handlePayment} />;
}