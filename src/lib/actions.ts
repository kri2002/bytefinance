"use server";

import { db } from "@/lib/dynamodb";
import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/utils/amplify-server-utils";

import {
  Transaction,
  Debt,
  Account,
  RecurringPayment,
  Category,
  ActionResponse,
} from "./types";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "ByteFinanceApp";

async function getUserPK(): Promise<string> {
  const user = await getAuthenticatedUser();
  if (!user || !user.id) {
    throw new Error("Unauthorized: Usuario no autenticado.");
  }
  return `USER#${user.id}`;
}

// TRANSACCIONES

type CreateTransactionDTO = Omit<
  Transaction,
  "id" | "createdAt" | "source" | "day"
> & {
  id?: string;
};

export async function saveTransaction(
  data: CreateTransactionDTO
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const timestamp = new Date().toISOString();
    const uniqueId = data.id || crypto.randomUUID();

    const item = {
      PK: PK,
      SK: `TX#${data.date}#${uniqueId}`,
      id: uniqueId,
      createdAt: timestamp,
      ...data,
    };

    await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    revalidatePath("/");
    return { success: true, message: "Transacción guardada correctamente" };
  } catch (error) {
    console.error("Error saving transaction:", error);
    return { success: false, message: "Error al guardar transacción" };
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const PK = await getUserPK();
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": PK, ":sk": "TX#" },
      })
    );

    if (!result.Items) return [];

    return result.Items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      date: item.date,
      status: item.status,
      method: item.method,
      category: item.category,
      day: new Date(item.date + "T12:00:00")
        .toLocaleDateString("es-MX", { weekday: "short" })
        .replace(".", ""),
      createdAt: item.createdAt || item.date,
      source: "manual",
    })) as Transaction[];
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}

export async function deleteTransactionWithReversal(tx: {
  id: string;
  date: string;
  amount: number;
  type: string;
  method?: string;
  name?: string;
}): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const { id, date, amount, type, method, name } = tx;

    // Lógica de reversión de saldos
    if (method) {
      if (type === "expense") {
        await updateAccountBalance(method, Math.abs(amount));
      } else if (type === "income") {
        await updateAccountBalance(method, -Math.abs(amount));
      } else if (type === "transfer") {
        await updateAccountBalance(method, Math.abs(amount));
        if (name && name.startsWith("Traspaso a ")) {
          const toAccountName = name.replace("Traspaso a ", "");
          await updateAccountBalance(toAccountName, -Math.abs(amount));
        }
      }
    }

    const sk = `TX#${date}#${id}`;

    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: PK, SK: sk },
      })
    );

    revalidatePath("/");
    return {
      success: true,
      message: "Transacción eliminada y saldo revertido",
    };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, message: "Error al eliminar transacción" };
  }
}

export async function editTransactionWithReversal(
  originalTx: {
    id: string;
    date: string;
    amount: number;
    type: string;
    method?: string;
  },
  newValues: {
    name: string;
    amount: number;
    date: string;
    category?: string;
    accountName?: string;
    status?: string;
  }
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();

    // Revertir saldo original
    if (originalTx.method && originalTx.type !== "transfer") {
      await updateAccountBalance(originalTx.method, -originalTx.amount);
    }

    // Preparar nuevos valores
    let finalNewAmount = Math.abs(newValues.amount);
    if (originalTx.type === "expense") {
      finalNewAmount = -finalNewAmount;
    }
    const newStatus =
      newValues.status || (originalTx.type === "income" ? "received" : "paid");

    // Actualizar DynamoDB
    const sk = `TX#${originalTx.date}#${originalTx.id}`;

    await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: PK, SK: sk },
        UpdateExpression:
          "set #n = :n, amount = :a, #d = :d, category = :c, #m = :m, #s = :s",
        ExpressionAttributeNames: {
          "#n": "name",
          "#d": "date",
          "#m": "method",
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":n": newValues.name,
          ":a": finalNewAmount,
          ":d": newValues.date,
          ":c": newValues.category || null,
          ":m": newValues.accountName || "General",
          ":s": newStatus,
        },
      })
    );

    // Aplicar nuevo saldo
    if (newValues.accountName && originalTx.type !== "transfer") {
      if (newStatus === "paid" || newStatus === "received") {
        await updateAccountBalance(newValues.accountName, finalNewAmount);
      }
    }

    revalidatePath("/");
    return { success: true, message: "Transacción actualizada" };
  } catch (error) {
    console.error("Error editing transaction:", error);
    return { success: false, message: "Error al editar transacción" };
  }
}

export async function getTransactionsByMonth(year: number, month: number) {
  try {
    const PK = await getUserPK();
    const monthStr = month.toString().padStart(2, "0");
    const prefix = `TX#${year}-${monthStr}`;

    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": PK,
          ":sk": prefix,
        },
      })
    );

    if (!result.Items) return [];

    return result.Items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      date: item.date,
      status: item.status,
      method: item.method,
      category: item.category,
      day: new Date(item.date + "T12:00:00")
        .toLocaleDateString("es-MX", { weekday: "short" })
        .replace(".", ""),
      createdAt: item.createdAt || item.date,
      source: "manual",
    })).reverse();
  } catch (error) {
    console.error("Error getting transactions by month:", error);
    return [];
  }
}

// PAGOS RECURRENTES

export async function saveRecurringPayment(
  data: Partial<RecurringPayment> & {
    name: string;
    amount: number;
    nextDate: string;
    frequency: string;
  }
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const id = data.id || crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: PK,
          SK: `REC#${id}`,
          id: id,
          name: data.name,
          amount: data.amount,
          nextDate: data.nextDate,
          frequency: data.frequency,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    revalidatePath("/recurring");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error saving recurring:", error);
    return { success: false };
  }
}

export async function getRecurringPayments(): Promise<RecurringPayment[]> {
  try {
    const PK = await getUserPK();
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": PK, ":sk": "REC#" },
      })
    );
    return (result.Items as RecurringPayment[]) || [];
  } catch (error) {
    console.error("Error getting recurring:", error);
    return [];
  }
}

export async function deleteRecurringPayment(
  id: string
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: PK, SK: `REC#${id}` },
      })
    );
    revalidatePath("/recurring");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error borrando:", error);
    return { success: false };
  }
}

// CUENTAS

export async function saveAccount(
  data: Partial<Account> & {
    name: string;
    type: string;
    balance: number;
    color: string;
    bankName?: string;
    last4?: string;
  }
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const id = data.id || crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: PK,
          SK: `ACC#${id}`,
          id: id,
          name: data.name,
          type: data.type,
          balance: data.balance,
          bankName: data.bankName || "",
          last4: data.last4 || "",
          color: data.color,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error saving account:", error);
    return { success: false };
  }
}

export async function getAccounts(): Promise<Account[]> {
  try {
    const PK = await getUserPK();
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": PK, ":sk": "ACC#" },
      })
    );

    // Seeding Default (Si no hay cuentas)
    if (!result.Items || result.Items.length === 0) {
      console.log("No accounts found. Seeding defaults...");

      // Tipado explícito para que coincida con los parámetros de saveAccount
      const defaults: Array<{
        name: string;
        type: Account["type"];
        balance: number;
        bankName: string;
        color: string;
      }> = [
        {
          name: "Didi Card",
          type: "debit",
          balance: 0,
          bankName: "Didi",
          color: "from-orange-600 to-orange-900",
        },
        {
          name: "Uber Card",
          type: "debit",
          balance: 0,
          bankName: "Uber",
          color: "from-gray-800 to-black",
        },
        {
          name: "Efectivo",
          type: "cash",
          balance: 0,
          bankName: "Físico",
          color: "from-emerald-600 to-emerald-900",
        },
      ];

      for (const acc of defaults) {
        await saveAccount(acc);
      }
      return getAccounts();
    }

    return result.Items as Account[];
  } catch (error) {
    console.error("Error getting accounts:", error);
    return [];
  }
}

export async function deleteAccount(id: string): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: PK, SK: `ACC#${id}` },
      })
    );
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false };
  }
}

export async function updateAccountBalance(
  accountName: string,
  amount: number
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const accounts = await getAccounts();

    const targetAccount = accounts.find(
      (acc) =>
        acc.name.toLowerCase().includes(accountName.toLowerCase()) ||
        accountName.toLowerCase().includes(acc.name.toLowerCase())
    );

    if (!targetAccount) {
      console.warn(`No se encontró cuenta para: ${accountName}`);
      return { success: false, message: "Cuenta no encontrada" };
    }

    await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: PK, SK: `ACC#${targetAccount.id}` },
        UpdateExpression: "set balance = balance + :val, updatedAt = :date",
        ExpressionAttributeValues: {
          ":val": amount,
          ":date": new Date().toISOString(),
        },
      })
    );

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating account balance:", error);
    return { success: false };
  }
}

// CATEGORÍAS

export async function saveCategory(data: Category): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const id = data.id || crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: PK,
          SK: `CAT#${id}`,
          id: id,
          name: data.name,
          color: data.color,
          type: data.type,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error saving category:", error);
    return { success: false };
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const PK = await getUserPK();
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": PK, ":sk": "CAT#" },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      const defaults: Partial<Category>[] = [
        { name: "Comida", color: "bg-orange-500", type: "expense" },
        { name: "Transporte", color: "bg-blue-500", type: "expense" },
        { name: "Casa", color: "bg-indigo-500", type: "expense" },
        { name: "Ocio", color: "bg-purple-500", type: "expense" },
        { name: "Salud", color: "bg-emerald-500", type: "expense" },
        { name: "Nómina", color: "bg-green-600", type: "income" },
        { name: "Ventas", color: "bg-cyan-500", type: "income" },
      ];
      for (const cat of defaults) {
        await saveCategory(cat as Category);
      }
      return getCategories();
    }

    return result.Items as Category[];
  } catch (error) {
    console.error("Error getting categories:", error);
    return [];
  }
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: PK, SK: `CAT#${id}` },
      })
    );
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false };
  }
}

// TRASPASOS

export async function saveTransfer(data: {
  amount: number;
  date: string;
  fromName: string;
  toName: string;
}): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const { amount, date, fromName, toName } = data;

    await updateAccountBalance(fromName, -amount);
    await updateAccountBalance(toName, amount);

    const id = crypto.randomUUID();
    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: PK,
          SK: `TX#${date}#${id}`,
          id: id,
          name: `Traspaso a ${toName}`,
          amount: -amount,
          type: "transfer",
          date: date,
          status: "paid",
          method: fromName,
          category: "Traspaso",
          createdAt: new Date().toISOString(),
        },
      })
    );

    revalidatePath("/");
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    console.error("Error saving transfer:", error);
    return { success: false };
  }
}

// PERFIL DE USUARIO

export async function getUserSettings() {
  try {
    const PK = await getUserPK();
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: { ":pk": PK, ":sk": "PROFILE" },
      })
    );
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error("Error getting settings:", error);
    return null;
  }
}

export async function updateUserSettings(data: {
  name: string;
  email: string;
  currency: string;
  budgetLimit: string;
  notifications: boolean;
}): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: PK,
          SK: "PROFILE",
          updatedAt: new Date().toISOString(),
          ...data,
        },
      })
    );

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false };
  }
}

// DEUDAS

export async function saveDebt(
  data: Omit<Debt, "id" | "updatedAt"> & { id?: string }
): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    const id = data.id || crypto.randomUUID();
    const currentBalance =
      data.currentBalance !== undefined
        ? data.currentBalance
        : data.totalAmount;

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: PK,
          SK: `DEBT#${id}`,
          id: id,
          updatedAt: new Date().toISOString(),
          ...data,
          currentBalance,
          installmentsPaid: data.installmentsPaid || 0,
          minimumPayment: data.minimumPayment || 0,
        },
      })
    );
    revalidatePath("/debts");
    return { success: true };
  } catch (error) {
    console.error("Error saving debt:", error);
    return { success: false };
  }
}

export async function getDebts(): Promise<Debt[]> {
  try {
    const PK = await getUserPK();
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": PK, ":sk": "DEBT#" },
      })
    );
    return (result.Items as Debt[]) || [];
  } catch (error) {
    console.error("Error getting debts:", error);
    return [];
  }
}

export async function deleteDebt(id: string): Promise<ActionResponse> {
  try {
    const PK = await getUserPK();
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK: `DEBT#${id}` },
      })
    );
    revalidatePath("/debts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting debt:", error);
    return { success: false, message: "Error al eliminar la deuda" };
  }
}

export async function registerDebtPayment(
  debtId: string,
  paymentData: {
    amount: number;
    date: string;
    accountName: string;
    debtName: string;
    isInstallment: boolean;
  }
): Promise<ActionResponse> {
  try {
    const debts = await getDebts();
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) throw new Error("Deuda no encontrada");

    const newBalance = Math.max(0, debt.currentBalance - paymentData.amount);
    const newInstallmentsPaid = paymentData.isInstallment
      ? (debt.installmentsPaid || 0) + 1
      : debt.installmentsPaid || 0;

    let newNextDate = debt.nextPaymentDate;

    if (paymentData.isInstallment || newBalance > 0) {
      const current = new Date(debt.nextPaymentDate + "T12:00:00");
      const next = new Date(current);
      const freq = debt.paymentFrequency || "monthly";

      if (freq === "weekly") next.setDate(current.getDate() + 7);
      else if (freq === "biweekly") next.setDate(current.getDate() + 15);
      else if (freq === "monthly") next.setMonth(current.getMonth() + 1);

      newNextDate = next.toLocaleDateString("en-CA");
    }

    await saveTransaction({
      name: `Pago: ${paymentData.debtName}`,
      amount: -Math.abs(paymentData.amount),
      type: "expense",
      date: paymentData.date,
      status: "paid",
      method: paymentData.accountName,
      category: "Deudas",
    });

    await updateAccountBalance(
      paymentData.accountName,
      -Math.abs(paymentData.amount)
    );

    await saveDebt({
      ...debt,
      currentBalance: newBalance,
      installmentsPaid: newInstallmentsPaid,
      nextPaymentDate: newNextDate,
    });

    revalidatePath("/debts");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error paying debt:", error);
    return { success: false, message: "Error al registrar pago de deuda" };
  }
}
