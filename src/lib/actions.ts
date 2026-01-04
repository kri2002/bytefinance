"use server";

import { db } from "@/lib/dynamodb";
import {
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";

const MOCK_USER_ID = "USER#dev@bytefinance.com";
const TABLE_NAME = "ByteFinanceApp";

// --- TRANSACCIONES (Historial) ---

export async function saveTransaction(transactionData: {
  id?: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  status: "paid" | "received" | "pending";
  method?: string;
  category?: string;
}) {
  try {
    const timestamp = new Date().toISOString();
    const uniqueId = transactionData.id || crypto.randomUUID();

    const item = {
      PK: MOCK_USER_ID,
      SK: `TX#${transactionData.date}#${uniqueId}`,
      id: uniqueId,
      createdAt: timestamp,
      ...transactionData,
    };

    await db.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error saving transaction:", error);
    return { success: false };
  }
}

export async function getTransactions() {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": MOCK_USER_ID, ":sk": "TX#" },
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
      source: "manual",
    }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}

// --- PAGOS FRECUENTES (/recurring) ---

export async function saveRecurringPayment(data: {
  id?: string;
  name: string;
  amount: number;
  nextDate: string;
  frequency: string;
}) {
  try {
    const id = data.id || crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: MOCK_USER_ID,
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

export async function getRecurringPayments() {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": MOCK_USER_ID, ":sk": "REC#" },
      })
    );

    if (!result.Items) return [];

    return result.Items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      nextDate: item.nextDate,
      frequency: item.frequency,
    }));
  } catch (error) {
    console.error("Error getting recurring:", error);
    return [];
  }
}

export async function deleteRecurringPayment(id: string) {
  try {
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: MOCK_USER_ID,
          SK: `REC#${id}`,
        },
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

/* TRANSACCIONES (/transactions) */
export async function getTransactionsByMonth(year: number, month: number) {
  try {
    const monthStr = month.toString().padStart(2, "0");
    const prefix = `TX#${year}-${monthStr}`;

    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": MOCK_USER_ID,
          ":sk": prefix,
        },
      })
    );

    if (!result.Items) return [];

    // Mapeamos igual que siempre
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
      source: "manual",
    })).reverse();
  } catch (error) {
    console.error("Error getting transactions by month:", error);
    return [];
  }
}

/* CUENTAS (/accounts) */
export async function saveAccount(data: {
  id?: string;
  name: string;
  type: string;
  balance: number;
  bankName: string;
  last4?: string;
  color: string;
}) {
  try {
    const id = data.id || crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: MOCK_USER_ID,
          SK: `ACC#${id}`,
          id: id,
          name: data.name,
          type: data.type,
          balance: data.balance,
          bankName: data.bankName,
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

export async function getAccounts() {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": MOCK_USER_ID, ":sk": "ACC#" },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log("No accounts found. Seeding defaults...");
      const defaults = [
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

    return result.Items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      balance: item.balance,
      bankName: item.bankName,
      last4: item.last4,
      color: item.color,
    }));
  } catch (error) {
    console.error("Error getting accounts:", error);
    return [];
  }
}

export async function deleteAccount(id: string) {
  try {
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: MOCK_USER_ID,
          SK: `ACC#${id}`,
        },
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
) {
  try {
    const accounts = await getAccounts();

    const targetAccount = accounts.find(
      (acc) =>
        acc.name.toLowerCase().includes(accountName.toLowerCase()) ||
        accountName.toLowerCase().includes(acc.name.toLowerCase())
    );

    if (!targetAccount) {
      console.warn(`No se encontró cuenta para: ${accountName}`);
      return { success: false };
    }

    await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: MOCK_USER_ID,
          SK: `ACC#${targetAccount.id}`,
        },
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

// CATEGORÍAS (CATEGORIES) ---
export async function saveCategory(data: {
  id?: string;
  name: string;
  color: string;
  type: "expense" | "income";
}) {
  try {
    const id = data.id || crypto.randomUUID();

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: MOCK_USER_ID,
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

export async function getCategories() {
  try {
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": MOCK_USER_ID, ":sk": "CAT#" },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      const defaults = [
        { name: "Comida", color: "bg-orange-500", type: "expense" },
        { name: "Transporte", color: "bg-blue-500", type: "expense" },
        { name: "Casa", color: "bg-indigo-500", type: "expense" },
        { name: "Ocio", color: "bg-purple-500", type: "expense" },
        { name: "Salud", color: "bg-emerald-500", type: "expense" },
        { name: "Nómina", color: "bg-green-600", type: "income" },
        { name: "Ventas", color: "bg-cyan-500", type: "income" },
      ];

      for (const cat of defaults) {
        await saveCategory(cat as any);
      }
      return getCategories();
    }

    return result.Items.map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      type: item.type,
    }));
  } catch (error) {
    console.error("Error getting categories:", error);
    return [];
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: MOCK_USER_ID, SK: `CAT#${id}` },
      })
    );
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false };
  }
}


/* traspasos */
export async function saveTransfer(data: { amount: number; date: string; fromName: string; toName: string }) {
  try {
    const { amount, date, fromName, toName } = data;

    await updateAccountBalance(fromName, -amount);

    await updateAccountBalance(toName, amount);
    
    const id = crypto.randomUUID();
    await db.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: MOCK_USER_ID,
        SK: `TX#${date}#${id}`,
        id: id,
        name: `Traspaso a ${toName}`,
        amount: -amount,
        type: 'transfer',
        date: date,
        status: 'paid',
        method: fromName,
        category: 'Traspaso',
        createdAt: new Date().toISOString()
      },
    }));

    revalidatePath('/');
    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    console.error("Error saving transfer:", error);
    return { success: false };
  }
}