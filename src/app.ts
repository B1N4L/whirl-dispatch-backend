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

dotenv.config();

export const app: Application = express();

// Security and Utility Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);
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
