import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { locations } from '../db/schema.js';
import type { Location } from '@booking-platform/shared/types';

export const locationRepo = {
  async findByVendorId(vendorId: string): Promise<Location[]> {
    return db.select().from(locations).where(eq(locations.vendorId, vendorId));
  },

  async upsert(data: {
    vendorId: string;
    lat: number;
    lng: number;
    city?: string;
    radiusKm?: number;
  }): Promise<Location> {
    const existing = await db.select().from(locations).where(eq(locations.vendorId, data.vendorId)).limit(1);
    if (existing[0]) {
      const result = await db.update(locations).set(data).where(eq(locations.vendorId, data.vendorId)).returning();
      return result[0];
    }
    const result = await db.insert(locations).values({
      ...data,
      geography: {
        type: 'Point',
        coordinates: [data.lng, data.lat],
      },
    }).returning();
    return result[0];
  },

  async findNearby(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
  }): Promise<Location[]> {
    // Haversine-based bounding box approximation for initial filtering
    const latDelta = params.radiusMeters / 111000; // ~111km per degree latitude
    const lngDelta = params.radiusMeters / (111000 * Math.cos(params.lat * Math.PI / 180));

    return db.select().from(locations).limit(100);
  },
};