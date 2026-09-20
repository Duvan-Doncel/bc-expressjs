// src/config/logger.ts - Winston (nivel http en dev, warn en prod)
import { createLogger, format, transports } from 'winston';
import type { transport } from 'winston';

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