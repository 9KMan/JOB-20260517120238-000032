import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { CustomerPayload, VendorPayload } from '@booking-platform/shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateCustomerToken(customer: { id: string; email: string }): string {
    const payload: CustomerPayload = { id: customer.id, email: customer.email, role: 'customer' };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  generateVendorToken(vendor: { id: string; email: string }): string {
    const payload: VendorPayload = { id: vendor.id, email: vendor.email, role: 'vendor' };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  generateAdminToken(admin: { id: string; email: string }): string {
    const payload = { id: admin.id, email: admin.email, role: 'admin' as const };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  verifyToken(token: string): CustomerPayload | VendorPayload | { id: string; email: string; role: 'admin' } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as CustomerPayload | VendorPayload | { id: string; email: string; role: 'admin' };
    } catch {
      return null;
    }
  },
};