import { pgTable, uuid, text, timestamp, numeric, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Customers ---
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Vendors ---
export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  category: text('category').notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- Locations (vendor service area) ---
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  lat: numeric('lat', { precision: 9, scale: 6 }).notNull(),
  lng: numeric('lng', { precision: 9, scale: 6 }).notNull(),
  city: text('city'),
  radiusKm: integer('radius_km').default(5).notNull(),
  // geography column stored as JSON for migration compatibility
  geography: jsonb('geography'),
});

// --- Services (vendor offerings) ---
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
});

// --- Bookings ---
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  status: text('status').default('pending').notNull(),
  bookingAt: timestamp('booking_at', { withTimezone: true }).notNull(),
  lat: numeric('lat', { precision: 9, scale: 6 }).notNull(),
  lng: numeric('lng', { precision: 9, scale: 6 }).notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  authorizedCents: integer('authorized_cents'),
  capturedCents: integer('captured_cents'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('bookings_customer_idx').on(table.customerId),
  vendorIdx: index('bookings_vendor_idx').on(table.vendorId),
  statusIdx: index('bookings_status_idx').on(table.status),
}));

// --- Vendor Availability (weekly schedule) ---
export const vendorAvailability = pgTable('vendor_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sun, 6=Sat
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(),
});

// --- Relations ---
export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  locations: many(locations),
  services: many(services),
  bookings: many(bookings),
  availability: many(vendorAvailability),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  vendor: one(vendors, { fields: [locations.vendorId], references: [vendors.id] }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  vendor: one(vendors, { fields: [services.vendorId], references: [vendors.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  vendor: one(vendors, { fields: [bookings.vendorId], references: [vendors.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
}));

export const vendorAvailabilityRelations = relations(vendorAvailability, ({ one }) => ({
  vendor: one(vendors, { fields: [vendorAvailability.vendorId], references: [vendors.id] }),
}));