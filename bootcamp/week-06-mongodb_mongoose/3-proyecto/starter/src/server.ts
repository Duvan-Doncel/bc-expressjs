// src/server.ts - Entry point: conecta a MongoDB ANTES de escuchar
import 'dotenv/config';
import { app } from './app';
import { connectDB, disconnectDB } from './lib/mongoose';
import { logger } from './config/logger';

const PORT = Number(process.env['PORT']) || 3000;

async function main(): Promise<void> {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      void disconnectDB().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: unknown) => {
  logger.error(`No se pudo iniciar el servidor: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
