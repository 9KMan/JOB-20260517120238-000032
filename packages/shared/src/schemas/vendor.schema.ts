import { z } from 'zod';

export const VendorRegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  password: z.string().min(8).max(128),
  category: z.string().min(1).max(100),
});

export const VendorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const VendorProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  category: z.string(),
  rating: z.number().min(0).max(5),
  createdAt: z.string().datetime(),
});

export const VendorNearbyQuerySchema = z.object({
  lat: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
  radius: z.string().transform(Number).pipe(z.number().min(100).max(50000)).optional().default('5000'),
  category: z.string().optional(),
});

export const VendorServiceSchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  name: z.string().min(1).max(255),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0),
});

export const VendorAvailabilitySchema = z.object({
  id: z.string().uuid(),
  vendorId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export type VendorRegister = z.infer<typeof VendorRegisterSchema>;
export type VendorLogin = z.infer<typeof VendorLoginSchema>;
export type VendorProfile = z.infer<typeof VendorProfileSchema>;
export type VendorNearbyQuery = z.infer<typeof VendorNearbyQuerySchema>;
export type VendorService = z.infer<typeof VendorServiceSchema>;
export type VendorAvailability = z.infer<typeof VendorAvailabilitySchema>;