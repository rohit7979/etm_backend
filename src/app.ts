import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import apiV1Routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { ApiResponse } from './utils/apiResponse';
import { env } from './config/env';

const app: Application = express();

// Global Middlewares
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return ApiResponse.success(res, 'ETM API is healthy', {
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatusMap[dbState] || 'unknown',
  });
});

// API Routes
app.use('/api/v1', apiV1Routes);
app.use('/api', apiV1Routes);

// Root welcome endpoint
app.get('/', (req, res) => {
  return ApiResponse.success(res, 'Employee Training Management System API v1', {
    documentation: '/api/v1',
    health: '/api/v1/health',
  });
});

// 404 and Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
