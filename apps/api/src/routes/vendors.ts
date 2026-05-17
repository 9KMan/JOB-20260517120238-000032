import { Router } from 'express';
import { vendorRepo } from '../repositories/vendor.repo.js';
import { locationRepo } from '../repositories/location.repo.js';
import { authService } from '../services/auth.service.js';
import { matchingService } from '../services/matching.service.js';
import { validate } from '../middleware/validation.middleware.js';
import { authorize, optionalAuth } from '../middleware/auth.middleware.js';
import { VendorRegisterSchema, VendorLoginSchema, VendorNearbyQuerySchema, VendorServiceSchema, VendorAvailabilitySchema } from '@booking-platform/shared/schemas';
import { AppError } from '../middleware/error.middleware.js';

export const vendorsRouter = Router();

// POST /v1/vendors/register
vendorsRouter.post('/register', validate(VendorRegisterSchema), async (req, res, next) => {
  try {
    const { email, name, phone, password, category } = req.body;

    const existing = await vendorRepo.findByEmail(email);
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await authService.hashPassword(password);
    const vendor = await vendorRepo.create({ email, name, phone, passwordHash, category });
    const token = authService.generateVendorToken(vendor);

    res.status(201).json({
      vendor: { id: vendor.id, email: vendor.email, name: vendor.name, category: vendor.category },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /v1/vendors/login
vendorsRouter.post('/login', validate(VendorLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const vendor = await vendorRepo.findByEmail(email);
    if (!vendor) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await authService.verifyPassword(password, vendor.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = authService.generateVendorToken(vendor);

    res.json({
      vendor: { id: vendor.id, email: vendor.email, name: vendor.name, category: vendor.category },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/vendors/nearby
vendorsRouter.get('/nearby', optionalAuth, async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 5000);
    const category = req.query.category as string | undefined;

    if (isNaN(lat) || isNaN(lng)) {
      throw new AppError(400, 'lat and lng are required');
    }

    const results = await matchingService.findNearbyVendors({
      lat, lng, radiusMeters: radius, category,
    });

    res.json({
      vendors: results.map(r => ({
        ...r.vendor,
        distanceMeters: Math.round(r.distance),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/vendors/:id
vendorsRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const vendor = await vendorRepo.findById(req.params.id);
    if (!vendor) {
      throw new AppError(404, 'Vendor not found');
    }
    const vendorServices = await vendorRepo.getServices(vendor.id);
    const vendorAvailability = await vendorRepo.getAvailability(vendor.id);

    res.json({
      ...vendor,
      services: vendorServices,
      availability: vendorAvailability,
    });
  } catch (err) {
    next(err);
  }
});

// POST /v1/vendors/:id/services (Vendor only)
vendorsRouter.post('/:id/services', authorize('vendor'), validate(VendorServiceSchema), async (req, res, next) => {
  try {
    if (req.auth!.id !== req.params.id) {
      throw new AppError(403, 'Cannot add services to another vendor');
    }

    const service = await vendorRepo.addService({
      vendorId: req.params.id,
      name: req.body.name,
      durationMinutes: req.body.durationMinutes,
      priceCents: req.body.priceCents,
    });

    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
});

// POST /v1/vendors/:id/location (Vendor only)
vendorsRouter.post('/:id/location', authorize('vendor'), async (req, res, next) => {
  try {
    if (req.auth!.id !== req.params.id) {
      throw new AppError(403, 'Cannot update location for another vendor');
    }

    const { lat, lng, city, radiusKm } = req.body;
    const location = await locationRepo.upsert({
      vendorId: req.params.id,
      lat,
      lng,
      city,
      radiusKm: radiusKm || 5,
    });

    res.status(201).json(location);
  } catch (err) {
    next(err);
  }
});

// POST /v1/vendors/:id/availability (Vendor only)
vendorsRouter.post('/:id/availability', authorize('vendor'), async (req, res, next) => {
  try {
    if (req.auth!.id !== req.params.id) {
      throw new AppError(403, 'Cannot update availability for another vendor');
    }

    const slots = req.body.slots;
    if (!Array.isArray(slots)) {
      throw new AppError(400, 'slots must be an array');
    }

    const availability = await vendorRepo.setAvailability(req.params.id, slots);
    res.status(201).json(availability);
  } catch (err) {
    next(err);
  }
});