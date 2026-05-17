import { Router } from 'express';
import { AppError } from '../middleware/error.middleware.js';

export const adminRouter = Router();

// Admin routes placeholder for future implementation
adminRouter.get('/stats', async (_req, _res, next) => {
  try {
    // Placeholder for admin statistics
    next(new AppError(501, 'Not implemented'));
  } catch (err) {
    next(err);
  }
});