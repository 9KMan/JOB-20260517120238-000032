import { z } from 'zod';

export const CreatePaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});

export const PaymentIntentSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  stripePaymentIntentId: z.string(),
  amountCents: z.number().int(),
  status: z.enum(['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'succeeded', 'canceled']),
  createdAt: z.string().datetime(),
});

export const CapturePaymentSchema = z.object({
  paymentIntentId: z.string(),
});

export const CancelPaymentSchema = z.object({
  paymentIntentId: z.string(),
});

export type CreatePaymentIntent = z.infer<typeof CreatePaymentIntentSchema>;
export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;
export type CapturePayment = z.infer<typeof CapturePaymentSchema>;
export type CancelPayment = z.infer<typeof CancelPaymentSchema>;