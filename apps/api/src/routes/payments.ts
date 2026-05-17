import { Router } from 'express';
import { paymentService } from '../services/payment.service.js';
import { bookingRepo } from '../repositories/booking.repo.js';
import { validate } from '../middleware/validation.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { CreatePaymentIntentSchema } from '@booking-platform/shared/schemas';
import { AppError } from '../middleware/error.middleware.js';

export const paymentsRouter = Router();

// POST /v1/payments/intent (Customer only)
paymentsRouter.post('/intent', authorize('customer'), validate(CreatePaymentIntentSchema), async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (booking.customerId !== req.auth!.id) {
      throw new AppError(403, 'Cannot pay for another customer booking');
    }
    if (booking.status !== 'pending' && booking.status !== 'matched') {
      throw new AppError(400, 'Booking cannot be paid');
    }

    const amountCents = 100; // Would come from service lookup
    const result = await paymentService.createPaymentIntent(bookingId, amountCents);

    res.status(201).json({
      paymentIntentId: result.stripeId,
      clientSecret: result.clientSecret,
    });
  } catch (err) {
    next(err);
  }
});

// POST /v1/payments/capture/:id (System - called by vendor completion)
paymentsRouter.post('/capture/:id', async (req, res, next) => {
  try {
    const { paymentIntentId, amountCents } = req.body;
    const result = await paymentService.capturePayment(paymentIntentId, amountCents);
    res.json({ success: true, paymentIntent: result });
  } catch (err) {
    if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else {
      next(err);
    }
  }
});

// POST /v1/payments/cancel/:id (Customer)
paymentsRouter.post('/cancel/:id', authorize('customer'), async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const result = await paymentService.cancelPayment(paymentIntentId);
    res.json({ success: true, paymentIntent: result });
  } catch (err) {
    if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else {
      next(err);
    }
  }
});

// POST /v1/webhooks/stripe
paymentsRouter.post('/webhooks/stripe', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw new AppError(400, 'Missing stripe-signature header');
    }

    const payload = req.body as Buffer;
    const result = await paymentService.handleWebhook(payload, signature);

    res.json({ received: true, type: result.type });
  } catch (err) {
    if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else {
      next(err);
    }
  }
});