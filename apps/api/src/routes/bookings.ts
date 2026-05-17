import { Router } from 'express';
import { bookingService } from '../services/booking.service.js';
import { validate } from '../middleware/validation.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { CreateBookingSchema, BookingStatusUpdateSchema, BookingListQuerySchema } from '@booking-platform/shared/schemas';
import { AppError } from '../middleware/error.middleware.js';

export const bookingsRouter = Router();

// POST /v1/bookings (Customer only)
bookingsRouter.post('/', authorize('customer'), validate(CreateBookingSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body, req.auth!.id);
    res.status(201).json(booking);
  } catch (err) {
    if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else {
      next(err);
    }
  }
});

// GET /v1/bookings (Customer or Vendor)
bookingsRouter.get('/', authorize('customer', 'vendor'), async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query as Record<string, string>;
    let bookings;

    if (req.auth!.role === 'customer') {
      bookings = await bookingService.listCustomerBookings(req.auth!.id, {
        status: status as any,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
    } else {
      bookings = await bookingService.listVendorBookings(req.auth!.id, {
        status: status as any,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
    }

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// GET /v1/bookings/:id
bookingsRouter.get('/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.getBooking(req.params.id);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// PATCH /v1/bookings/:id/status (Vendor)
bookingsRouter.patch('/:id/status', authorize('vendor'), validate(BookingStatusUpdateSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.updateStatus(req.params.id, req.body.status, req.auth!.id, 'vendor');
    res.json(booking);
  } catch (err) {
    if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else {
      next(err);
    }
  }
});

// DELETE /v1/bookings/:id (Customer cancel)
bookingsRouter.delete('/:id', authorize('customer'), async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.auth!.id);
    res.json(booking);
  } catch (err) {
    if (err instanceof Error) {
      next(new AppError(400, err.message));
    } else {
      next(err);
    }
  }
});