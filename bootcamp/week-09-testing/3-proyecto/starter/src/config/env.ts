import 'dotenv/config';

// Los secretos JWT NO tienen valor por defecto: deben venir de .env (o de .env.test en los tests)
function requireSecret(name: 'JWT_ACCESS_SECRET'): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} debe estar definido en .env y tener al menos 32 caracteres`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  MONGODB_URI: process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/mercado-campesino-testing',
  JWT_ACCESS_SECRET: requireSecret('JWT_ACCESS_SECRET'),
  JWT_ACCESS_EXPIRES_IN: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
} as const;
