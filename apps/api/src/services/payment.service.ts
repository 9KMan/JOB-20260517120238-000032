import Stripe from 'stripe';
import { bookingRepo } from '../repositories/booking.repo.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10',
});

export const paymentService = {
  async createPaymentIntent(bookingId: string, amountCents: number): Promise<{ stripeId: string; clientSecret: string }> {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'pending' && booking.status !== 'matched') {
      throw new Error('Booking cannot be paid');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'manual', // Authorization hold - capture later
      metadata: { bookingId },
    });

    // Update booking with payment intent
    await bookingRepo.setPaymentIntent(bookingId, paymentIntent.id, amountCents);

    return {
      stripeId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    };
  },

  async capturePayment(paymentIntentId: string, amountCents: number): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: amountCents,
    });
    return paymentIntent;
  },

  async cancelPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return paymentIntent;
  },

  async handleWebhook(payload: Buffer, signature: string): Promise<{ type: string; bookingId?: string }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new Error('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata.bookingId;
        if (bookingId) {
          await bookingRepo.updateStatus(bookingId, 'paid');
        }
        return { type: 'payment_intent.succeeded', bookingId };
      }
      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const bookingId = pi.metadata.bookingId;
        if (bookingId) {
          await bookingRepo.updateStatus(bookingId, 'cancelled');
        }
        return { type: 'payment_intent.canceled', bookingId };
      }
      case 'charge.refunded': {
        return { type: 'charge.refunded' };
      }
      default:
        return { type: event.type };
    }
  },
};