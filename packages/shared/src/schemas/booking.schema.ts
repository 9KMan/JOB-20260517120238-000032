import { z } from 'zod';

export const BookingStatusEnum = z.enum(['pending', 'matched', 'paid', 'completed', 'cancelled']);

export const CreateBookingSchema = z.object({
  vendorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  bookingAt: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const BookingStatusUpdateSchema = z.object({
  status: BookingStatusEnum,
});

export const BookingSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  vendorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  status: BookingStatusEnum,
  bookingAt: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  stripePaymentIntentId: z.string().optional(),
  authorizedCents: z.number().int().optional(),
  capturedCents: z.number().int().optional(),
  createdAt: z.string().datetime(),
});

export const BookingListQuerySchema = z.object({
  status: BookingStatusEnum.optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional().default('20'),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).optional().default('0'),
});

export type BookingStatus = z.infer<typeof BookingStatusEnum>;
export type CreateBooking = z.infer<typeof CreateBookingSchema>;
export type BookingStatusUpdate = z.infer<typeof BookingStatusUpdateSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type BookingListQuery = z.infer<typeof BookingListQuerySchema>;