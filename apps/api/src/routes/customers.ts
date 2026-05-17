import { Router } from 'express';
import { customerRepo } from '../repositories/customer.repo.js';
import { authService } from '../services/auth.service.js';
import { validate } from '../middleware/validation.middleware.js';
import { authorize, optionalAuth } from '../middleware/auth.middleware.js';
import { CustomerRegisterSchema, CustomerLoginSchema } from '@booking-platform/shared/schemas';
import { AppError } from '../middleware/error.middleware.js';

export const customersRouter = Router();

// POST /v1/customers/register
customersRouter.post('/register', validate(CustomerRegisterSchema), async (req, res, next) => {
  try {
    const { email, name, phone, password } = req.body;

    const existing = await customerRepo.findByEmail(email);
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await authService.hashPassword(password);
    const customer = await customerRepo.create({ email, name, phone, passwordHash });
    const token = authService.generateCustomerToken(customer);

    res.status(201).json({
      customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// POST /v1/customers/login
customersRouter.post('/login', validate(CustomerLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const customer = await customerRepo.findByEmail(email);
    if (!customer) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await authService.verifyPassword(password, customer.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = authService.generateCustomerToken(customer);

    res.json({
      customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/customers/me
customersRouter.get('/me', authorize('customer'), async (req, res, next) => {
  try {
    const customer = await customerRepo.findById(req.auth!.id);
    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }
    res.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      createdAt: customer.createdAt,
    });
  } catch (err) {
    next(err);
  }
});