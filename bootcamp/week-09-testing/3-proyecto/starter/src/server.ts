import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';

async function startServer(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  app.listen(env.PORT, () => {
    console.log(`Mercado campesino API en http://localhost:${env.PORT}`);
  });
}

startServer().catch((err: unknown) => {
  console.error('No se pudo iniciar el servidor:', err instanceof Error ? err.message : err);
  process.exit(1);
});
