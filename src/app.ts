import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { healthRouter } from './routes/health.route';
import { authRouter } from './routes/auth.route';
import { facilitiesRouter } from './routes/facilities.route';
import { fleetRouter } from './routes/fleet.route';
import { workOrdersRouter } from './routes/workOrder.route';
import { attendanceRouter } from './routes/attendance.route';
import { dossierRouter } from './routes/dossier.route';
import { expenseRouter } from './routes/expense.route';
import { billingRouter } from './routes/billing.route';
import { usersRouter } from './routes/users.route';
import { docsRouter } from './routes/docs.route';
import { notificationsRouter, telemetryRouter } from './routes/notifications.route';
import { corsMiddleware } from './config/cors';

dotenv.config();

export const app: Application = express();

// Security and Utility Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core Route Mounts
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/facilities', facilitiesRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/work-orders', workOrdersRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/dossiers', dossierRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/billing', billingRouter);
app.use('/api/users', usersRouter);
app.use('/api/docs', docsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/telemetry', telemetryRouter);

// Root Index Status Route
app.get(['/', '/api'], (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'WhirlDispatch Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      docsJson: '/api/docs/json',
    },
  });
});

// 404 Catch-All Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested endpoint does not exist on WhirlDispatch API server.',
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ServerError]', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: err.message || 'An unexpected error occurred.',
  });
});
