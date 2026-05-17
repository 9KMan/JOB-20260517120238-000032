import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware.js';
import { customersRouter } from './routes/customers.js';
import { vendorsRouter } from './routes/vendors.js';
import { bookingsRouter } from './routes/bookings.js';
import { paymentsRouter } from './routes/payments.js';
import { adminRouter } from './routes/admin.js';

export function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Logging
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/v1/customers', customersRouter);
  app.use('/v1/vendors', vendorsRouter);
  app.use('/v1/bookings', bookingsRouter);
  app.use('/v1/payments', paymentsRouter);
  app.use('/v1/admin', adminRouter);

  // Stripe webhook (raw body needed)
  app.use('/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}