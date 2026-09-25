import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/item.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { sanitizeInputs } from './middlewares/sanitize.js';
import { globalLimiter, corsOptions } from './config/security.js';

const app: Express = express();

// No revelar que el servidor usa Express
app.disable('x-powered-by');

// Security layers — order matters
app.use(helmet());
app.use(globalLimiter);
// cors() ya responde los preflight OPTIONS. El app.options('*') del starter se quito:
// en Express 5 la ruta '*' no es valida y el servidor no arrancaba.
app.use(cors(corsOptions));

// Body parsing (limite de tamaño para evitar payloads enormes)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitize inputs AFTER parsing, BEFORE routes (express-mongo-sanitize)
app.use(sanitizeInputs);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);

// Error handling (always last)
app.use(notFound);
app.use(errorHandler);

export { app };
