'use server';

import { db } from "@/lib/dynamodb";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

const MOCK_USER_ID = "USER#dev@bytefinance.com";
const TABLE_NAME = "ByteFinanceApp";

// --- TRANSACCIONES (Historial) ---

export async function saveTransaction(transactionData: {
  id?: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  status: 'paid' | 'received' | 'pending';
  method?: string;
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
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error saving transaction:", error);
    return { success: false };
  }
}

export async function getTransactions() {
  try {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": MOCK_USER_ID, ":sk": "TX#" },
    }));

    if (!result.Items) return [];

    return result.Items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      type: item.type,
      date: item.date,
      status: item.status,
      method: item.method, 
      day: new Date(item.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''),
      source: 'manual',
    }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}

// --- PAGOS FRECUENTES (/recurring) ---

export async function saveRecurringPayment(data: { id?: string; name: string; amount: number; nextDate: string; frequency: string }) {
  try {
    const id = data.id || crypto.randomUUID(); 
    
    await db.send(new PutCommand({
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
    }));
    revalidatePath('/recurring');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error saving recurring:", error);
    return { success: false };
  }
}

export async function getRecurringPayments() {
  try {
    const result = await db.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": MOCK_USER_ID, ":sk": "REC#" },
    }));

    if (!result.Items) return [];
    
    return result.Items.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      nextDate: item.nextDate,
      frequency: item.frequency
    }));
  } catch (error) {
    console.error("Error getting recurring:", error);
    return [];
  }
}

export async function deleteRecurringPayment(id: string) {
  try {
    await db.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: MOCK_USER_ID,
        SK: `REC#${id}`
      }
    }));
    revalidatePath('/recurring');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error borrando:", error);
    return { success: false };
  }
}