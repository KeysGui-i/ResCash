import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

if (!MONGODB_URI || !MONGODB_DB_NAME) {
  throw new Error('[mongo] MONGODB_URI / MONGODB_DB_NAME not set');
}
let connectionPromise = null;
export async function connectMongo() {
  const uri = MONGODB_URI.endsWith('/')
    ? `${MONGODB_URI}${MONGODB_DB_NAME}`
    : `${MONGODB_URI}/${MONGODB_DB_NAME}`;

  connectionPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
      console.log("[mongo] connected");
    })
    .catch((err) => {
      connectionPromise = null;
      console.error("[mongo] connection failed:", err);
      throw err;
    });

  return connectionPromise;
}

export function getMongoConnection() {
  return mongoose.connection;
}
