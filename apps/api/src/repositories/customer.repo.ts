import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { customers } from '../db/schema.js';
import type { Customer } from '@booking-platform/shared/types';

export const customerRepo = {
  async findByEmail(email: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
    return result[0] ?? null;
  },

  async findById(id: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0] ?? null;
  },

  async create(data: {
    email: string;
    name: string;
    phone?: string;
    passwordHash: string;
  }): Promise<Customer> {
    const result = await db.insert(customers).values(data).returning();
    return result[0];
  },

  async updateProfile(id: string, data: { name?: string; phone?: string }): Promise<Customer | null> {
    const result = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return result[0] ?? null;
  },
};