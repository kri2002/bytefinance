import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "us-east-1";

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "FATAL ERROR: Faltan las credenciales de AWS (AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY) en las variables de entorno."
  );
}
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: true,
  },
});
