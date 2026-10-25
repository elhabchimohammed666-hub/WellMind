import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './src/routes/auth.js';
import surveyRoutes from './src/routes/surveys.js';
import actionRoutes from './src/routes/actions.js';
import userRoutes from './src/routes/users.js';
import organizationRoutes from './src/routes/organization.js';
import { errorHandler } from './src/middleware/error-handler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);

if (process.env.NODE_ENV !== 'test') {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Configurez MONGODB_URI et un JWT_SECRET aléatoire d’au moins 32 caractères avant de démarrer l’API.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`WellMind API listening on http://localhost:${port}`));
}

export default app;
