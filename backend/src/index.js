import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { logError, logInfo } from './utils/logger.js';

dotenv.config();

const FILE = 'index.js';
const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(globalLimiter);

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/deliveries', deliveryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on('uncaughtException', (error) => {
  logError(FILE, error);
});

process.on('unhandledRejection', (error) => {
  logError(FILE, error instanceof Error ? error : new Error(String(error)));
});

app.listen(PORT, () => {
  logInfo(FILE, `CarryMate backend running on port ${PORT}`);
});
