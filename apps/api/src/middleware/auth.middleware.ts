import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import type { CustomerPayload, VendorPayload } from '@booking-platform/shared/types';

declare global {
  namespace Express {
    interface Request {
      auth?: CustomerPayload | VendorPayload | { id: string; email: string; role: 'admin' };
    }
  }
}

export function authorize(...roles: Array<'customer' | 'vendor' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next(new Error('Unauthorized: No token provided'));
      return;
    }

    const token = authHeader.slice(7);
    const payload = authService.verifyToken(token);
    if (!payload) {
      next(new Error('Unauthorized: Invalid token'));
      return;
    }

    if (!roles.includes(payload.role)) {
      next(new Error('Forbidden: Insufficient permissions'));
      return;
    }

    req.auth = payload;
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = authService.verifyToken(token);
    if (payload) {
      req.auth = payload;
    }
  }
  next();
}