import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { vendors, services, vendorAvailability } from '../db/schema.js';
import type { Vendor, VendorAvailability } from '@booking-platform/shared/types';
import type { VendorService, VendorAvailability as VendorAvailabilitySchema } from '@booking-platform/shared/schemas';

export const vendorRepo = {
  async findByEmail(email: string): Promise<Vendor | null> {
    const result = await db.select().from(vendors).where(eq(vendors.email, email)).limit(1);
    return result[0] ?? null;
  },

  async findById(id: string): Promise<Vendor | null> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return result[0] ?? null;
  },

  async create(data: {
    email: string;
    name: string;
    phone?: string;
    passwordHash: string;
    category: string;
  }): Promise<Vendor> {
    const result = await db.insert(vendors).values(data).returning();
    return result[0];
  },

  async findNearby(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    category?: string;
  }): Promise<Vendor[]> {
    const { lat, lng, radiusMeters, category } = params;
    // Using Haversine approximation - vendors within rough bounding box
    // Actual distance filtering happens in the location repo
    let query = db.select().from(vendors);
    if (category) {
      query = query.where(eq(vendors.category, category)) as typeof query;
    }
    return query.limit(50);
  },

  async getServices(vendorId: string): Promise<VendorService[]> {
    const result = await db.select().from(services).where(eq(services.vendorId, vendorId));
    return result;
  },

  async addService(data: {
    vendorId: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  }): Promise<VendorService> {
    const result = await db.insert(services).values(data).returning();
    return result[0];
  },

  async getAvailability(vendorId: string): Promise<VendorAvailabilitySchema[]> {
    const result = await db.select().from(vendorAvailability).where(eq(vendorAvailability.vendorId, vendorId));
    return result;
  },

  async setAvailability(vendorId: string, slots: Omit<VendorAvailabilitySchema, 'id' | 'vendorId'>[]): Promise<VendorAvailabilitySchema[]> {
    // Delete existing and insert new
    await db.delete(vendorAvailability).where(eq(vendorAvailability.vendorId, vendorId));
    const result = await db.insert(vendorAvailability).values(
      slots.map(slot => ({ ...slot, vendorId }))
    ).returning();
    return result;
  },

  async updateRating(vendorId: string, newRating: number): Promise<void> {
    await db.update(vendors).set({ rating: newRating.toString() }).where(eq(vendors.id, vendorId));
  },
};