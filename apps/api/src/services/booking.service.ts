import { bookingRepo } from '../repositories/booking.repo.js';
import { vendorRepo } from '../repositories/vendor.repo.js';
import { matchingService } from './matching.service.js';
import { paymentService } from './payment.service.js';
import type { CreateBooking, Booking, BookingStatus } from '@booking-platform/shared/schemas';

export const bookingService = {
  async createBooking(data: CreateBooking, customerId: string): Promise<Booking> {
    // Check vendor exists and is available
    const vendor = await vendorRepo.findById(data.vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Check service exists
    const services = await vendorRepo.getServices(data.vendorId);
    const service = services.find(s => s.id === data.serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Check availability / no conflicts
    const hasConflict = await matchingService.checkConflict(data.vendorId, new Date(data.bookingAt), service.durationMinutes);
    if (hasConflict) {
      throw new Error('Time slot not available');
    }

    // Check vendor is within service area
    const withinRadius = await matchingService.isWithinServiceArea(data.vendorId, data.lat, data.lng);
    if (!withinRadius) {
      throw new Error('Service location outside vendor service area');
    }

    // Create booking
    const booking = await bookingRepo.create({
      customerId,
      vendorId: data.vendorId,
      serviceId: data.serviceId,
      bookingAt: new Date(data.bookingAt),
      lat: data.lat,
      lng: data.lng,
    });

    return booking as Booking;
  },

  async getBooking(id: string): Promise<Booking | null> {
    const booking = await bookingRepo.findById(id);
    return booking as Booking | null;
  },

  async listCustomerBookings(customerId: string, params: { status?: BookingStatus; limit?: number; offset?: number }): Promise<Booking[]> {
    return (await bookingRepo.findByCustomer(customerId, params)) as Booking[];
  },

  async listVendorBookings(vendorId: string, params: { status?: BookingStatus; limit?: number; offset?: number }): Promise<Booking[]> {
    return (await bookingRepo.findByVendor(vendorId, params)) as Booking[];
  },

  async updateStatus(bookingId: string, status: BookingStatus, actorId: string, actorRole: 'vendor' | 'customer'): Promise<Booking> {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['matched', 'cancelled'],
      matched: ['paid', 'cancelled'],
      paid: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      throw new Error(`Invalid status transition from ${booking.status} to ${status}`);
    }

    // Authorization checks
    if (status === 'completed' && actorRole !== 'vendor') {
      throw new Error('Only vendor can mark booking as completed');
    }

    if (status === 'cancelled' && actorRole === 'vendor') {
      throw new Error('Vendor cannot cancel bookings');
    }

    // Capture payment when completing
    if (status === 'completed' && booking.stripePaymentIntentId) {
      try {
        await paymentService.capturePayment(booking.stripePaymentIntentId, booking.authorizedCents || 0);
        await bookingRepo.capture(bookingId, booking.authorizedCents || 0);
      } catch (err) {
        throw new Error('Payment capture failed');
      }
    }

    const updated = await bookingRepo.updateStatus(bookingId, status);
    if (!updated) throw new Error('Failed to update booking');
    return updated as Booking;
  },

  async cancelBooking(bookingId: string, customerId: string): Promise<Booking> {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.customerId !== customerId) throw new Error('Unauthorized');
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('Cannot cancel this booking');
    }

    // Void payment if exists
    if (booking.stripePaymentIntentId) {
      await paymentService.cancelPayment(booking.stripePaymentIntentId);
    }

    const updated = await bookingRepo.cancel(bookingId);
    if (!updated) throw new Error('Failed to cancel booking');
    return updated as Booking;
  },
};