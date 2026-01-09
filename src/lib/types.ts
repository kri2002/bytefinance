export type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  date: string;
  status: "paid" | "received" | "pending";
  category?: string;
  method?: string; // Nombre de la cuenta asociada
  source?: "recurring" | "manual";
  createdAt?: string;
  day?: string;
};

export type Debt = {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  minimumPayment: number;
  nextPaymentDate: string;
  paymentFrequency: "weekly" | "biweekly" | "monthly";
  totalInstallments?: number;
  installmentsPaid?: number;
  updatedAt?: string;
};

export type Account = {
  id: string;
  name: string;
  type: "debit" | "credit" | "cash";
  balance: number;
  color: string;
  bankName?: string; 
  last4?: string;
}

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  nextDate: string;
  frequency: "weekly" | "biweekly" | "monthly" | "yearly";
  category?: string;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon?: string;
};

export type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};