import { vendorRepo } from '../repositories/vendor.repo.js';
import { locationRepo } from '../repositories/location.repo.js';
import { bookingRepo } from '../repositories/booking.repo.js';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const matchingService = {
  async findNearbyVendors(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    category?: string;
  }): Promise<Array<{ vendor: Awaited<ReturnType<typeof vendorRepo.findById>>; distance: number }>> {
    const { lat, lng, radiusMeters, category } = params;

    let vendors;
    if (category) {
      vendors = await vendorRepo.findNearby({ lat, lng, radiusMeters, category });
    } else {
      vendors = await vendorRepo.findNearby({ lat, lng, radiusMeters });
    }

    // Get locations for all vendors
    const results: Array<{ vendor: Awaited<ReturnType<typeof vendorRepo.findById>>; distance: number }> = [];

    for (const vendor of vendors) {
      const locs = await locationRepo.findByVendorId(vendor.id);
      if (locs.length > 0) {
        const loc = locs[0];
        const distance = haversineDistance(lat, lng, Number(loc.lat), Number(loc.lng));
        if (distance <= radiusMeters) {
          results.push({ vendor, distance });
        }
      }
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    return results;
  },

  async checkAvailability(vendorId: string, dayOfWeek: number, time: string): Promise<boolean> {
    const slots = await vendorRepo.getAvailability(vendorId);
    const slot = slots.find(s => s.dayOfWeek === dayOfWeek);
    if (!slot) return false;
    return time >= slot.startTime && time <= slot.endTime;
  },

  async checkConflict(vendorId: string, bookingAt: Date, durationMinutes: number): Promise<boolean> {
    const conflicts = await bookingRepo.findConflicting(vendorId, bookingAt, durationMinutes);
    return conflicts.length > 0;
  },

  async isWithinServiceArea(vendorId: string, lat: number, lng: number): Promise<boolean> {
    const locs = await locationRepo.findByVendorId(vendorId);
    if (locs.length === 0) return false;

    const loc = locs[0];
    const distance = haversineDistance(lat, lng, Number(loc.lat), Number(loc.lng));
    const radiusMeters = (loc.radiusKm || 5) * 1000;
    return distance <= radiusMeters;
  },

  async getMatchingScore(vendorId: string, customerLat: number, customerLng: number): Promise<number> {
    const locs = await locationRepo.findByVendorId(vendorId);
    if (locs.length === 0) return 0;

    const loc = locs[0];
    const distance = haversineDistance(customerLat, customerLng, Number(loc.lat), Number(loc.lng));
    const radiusMeters = (loc.radiusKm || 5) * 1000;

    // Score: closer = higher, normalized to 0-100
    if (distance > radiusMeters) return 0;
    return Math.round((1 - distance / radiusMeters) * 100);
  },
};