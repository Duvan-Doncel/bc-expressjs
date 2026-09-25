// src/server.ts - Entry point: valida la config, conecta a MongoDB y luego escucha
import 'dotenv/config';
import { app } from './app.js';
import { connectDB, disconnectDB } from './lib/mongoose.js';
import { assertJwtConfig } from './utils/jwt.js';
import { logger } from './config/logger.js';

const PORT = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  assertJwtConfig();
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server: http://localhost:${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/api/v1/health`);
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
