import type { CustomerPayload } from './customer.type.js';
import type { VendorPayload } from './vendor.type.js';

export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  status: 'pending' | 'matched' | 'paid' | 'completed' | 'cancelled';
  bookingAt: Date;
  lat: number;
  lng: number;
  stripePaymentIntentId?: string;
  authorizedCents?: number;
  capturedCents?: number;
  createdAt: Date;
}

export interface VendorAvailability {
  id: string;
  vendorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type AuthPayload = CustomerPayload | VendorPayload | { id: string; email: string; role: 'admin' };