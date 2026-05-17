import { z } from 'zod';

export const CustomerRegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  password: z.string().min(8).max(128),
});

export const CustomerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CustomerProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  phone: z.string().optional(),
  createdAt: z.string().datetime(),
});

export type CustomerRegister = z.infer<typeof CustomerRegisterSchema>;
export type CustomerLogin = z.infer<typeof CustomerLoginSchema>;
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;