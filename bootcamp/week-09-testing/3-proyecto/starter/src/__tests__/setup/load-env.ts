// Se ejecuta antes de cada archivo de test (setupFiles en jest.config.ts)
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });
