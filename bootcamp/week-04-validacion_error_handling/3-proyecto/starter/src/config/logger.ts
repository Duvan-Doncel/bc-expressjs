// ============================================
// CONFIG - logger de Winston + stream para Morgan
// ============================================
import { createLogger, format, transports } from 'winston';
import type { transport } from 'winston';
import morgan from 'morgan';

const isProduction = process.env['NODE_ENV'] === 'production';

const devFormat = format.combine(
  format.timestamp({ format: 'HH:mm:ss' }),
  format.colorize(),
  format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
);

const prodFormat = format.combine(format.timestamp(), format.json());

const logTransports: transport[] = [new transports.Console()];

if (isProduction) {
  logTransports.push(new transports.File({ filename: 'logs/error.log', level: 'error' }));
}

export const logger = createLogger({
  level: isProduction ? 'warn' : 'http',
  format: isProduction ? prodFormat : devFormat,
  transports: logTransports,
});

// Stream de Morgan: redirige cada peticion HTTP a logger.http()
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

const morganFormat = isProduction ? 'combined' : 'dev';

export const morganMiddleware = morgan(morganFormat, { stream: morganStream });
