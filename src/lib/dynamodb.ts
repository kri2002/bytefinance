// src/lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// 1. Configuración usando tus variables de entorno
const config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
};

// 2. Cliente base (bajo nivel)
const client = new DynamoDBClient(config);

// 3. Cliente Document (alto nivel)
// Este es el "traductor" que nos permite usar objetos JSON normales de JavaScript
export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Limpia campos undefined automáticamente
  },
});