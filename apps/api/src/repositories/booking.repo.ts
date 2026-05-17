import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings } from '../db/schema.js';
import type { Booking } from '@booking-platform/shared/types';

export const bookingRepo = {
  async findById(id: string): Promise<Booking | null> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0] ?? null;
  },

  async findByCustomer(customerId: string, params: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Booking[]> {
    const { status, limit = 20, offset = 0 } = params;
    let query = db.select().from(bookings).where(eq(bookings.customerId, customerId));
    if (status) {
      query = query.where(and(eq(bookings.customerId, customerId), eq(bookings.status, status))) as typeof query;
    }
    return query.orderBy(bookings.createdAt).limit(limit).offset(offset);
  },

  async findByVendor(vendorId: string, params: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Booking[]> {
    const { status, limit = 20, offset = 0 } = params;
    let query = db.select().from(bookings).where(eq(bookings.vendorId, vendorId));
    if (status) {
      query = query.where(and(eq(bookings.vendorId, vendorId), eq(bookings.status, status))) as typeof query;
    }
    return query.orderBy(bookings.createdAt).limit(limit).offset(offset);
  },

  async create(data: {
    customerId: string;
    vendorId: string;
    serviceId: string;
    bookingAt: Date;
    lat: number;
    lng: number;
  }): Promise<Booking> {
    const result = await db.insert(bookings).values({
      ...data,
      status: 'pending',
    }).returning();
    return result[0];
  },

  async updateStatus(id: string, status: string): Promise<Booking | null> {
    const result = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return result[0] ?? null;
  },

  async setPaymentIntent(id: string, stripePaymentIntentId: string, authorizedCents: number): Promise<Booking | null> {
    const result = await db.update(bookings).set({ stripePaymentIntentId, authorizedCents, status: 'matched' }).where(eq(bookings.id, id)).returning();
    return result[0] ?? null;
  },

  async capture(id: string, capturedCents: number): Promise<Booking | null> {
    const result = await db.update(bookings).set({ capturedCents, status: 'completed' }).where(eq(bookings.id, id)).returning();
    return result[0] ?? null;
  },

  async cancel(id: string): Promise<Booking | null> {
    const result = await db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, id)).returning();
    return result[0] ?? null;
  },

  async findConflicting(vendorId: string, bookingAt: Date, durationMinutes: number): Promise<Booking[]> {
    const startWindow = new Date(bookingAt.getTime() - durationMinutes * 60000);
    const endWindow = new Date(bookingAt.getTime() + durationMinutes * 60000);
    return db.select().from(bookings).where(
      and(
        eq(bookings.vendorId, vendorId),
        ne(bookings.status, 'cancelled'),
        lte(bookings.bookingAt, endWindow),
        gte(bookings.bookingAt, startWindow)
      )
    );
  },
};