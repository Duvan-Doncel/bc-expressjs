// src/lib/mongoose.ts - Conexion unica a MongoDB (se llama solo desde server.ts y seed.ts)
import mongoose from 'mongoose';
import { logger } from '../config/logger';

export async function connectDB(): Promise<void> {
  // Evita re-instanciar la conexion si ya esta abierta
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env['MONGODB_URI'];
  if (!uri) throw new Error('MONGODB_URI is not defined');
  await mongoose.connect(uri);
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
