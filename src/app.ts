import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';

import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';

import authRoutes from './modules/auth/auth.routes';
import eventRoutes from './modules/events/event.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import paymentRoutes from './modules/payments/payment.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import uploadRoutes from './modules/upload/upload.routes';
import promoCodeRoutes from './modules/promoCodes/promo-code.routes';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Trust the Apache reverse proxy so rate limiting uses real client IPs
app.set('trust proxy', 1);

// Security & parsing middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api', globalLimiter);

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Eventful API Documentation',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promo-codes', promoCodeRoutes);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');

  // Serve static files from React build
  app.use(express.static(clientBuildPath));

  // Handle React routing - send all non-API requests to index.html
  // Using Express 5.x compatible wildcard route
  app.use((_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handler
app.use(errorHandler);

export default app;
