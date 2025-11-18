import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const planEnum = pgEnum('plan', ['starter', 'pro', 'business']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['available', 'rented', 'maintenance', 'out_of_service']);
export const reservationStatusEnum = pgEnum('reservation_status', ['draft', 'pending_payment', 'paid', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const paymentTypeEnum = pgEnum('payment_type', ['deposit', 'total', 'caution', 'insurance']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);

// Organizations
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  teams: many(teams),
}));

// Teams (= Agences)
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  address: text('address'),
  logo: text('logo'),
  plan: planEnum('plan').default('starter').notNull(),
  maxVehicles: integer('max_vehicles').default(5).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  subscriptionStatus: text('subscription_status').default('active'), // active, past_due, canceled
  stripeConnectAccountId: text('stripe_connect_account_id').unique(),
  stripeConnectOnboarded: boolean('stripe_connect_onboarded').default(false).notNull(),
  smsNotificationsEnabled: boolean('sms_notifications_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
  vehicles: many(vehicles),
  reservations: many(reservations),
}));

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  passwordHash: text('password_hash'),
  isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
  currentTeamId: uuid('current_team_id').references(() => teams.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  currentTeam: one(teams, {
    fields: [users.currentTeamId],
    references: [teams.id],
  }),
  teamMemberships: many(teamMembers),
}));

// Team Members (relation users <-> teams)
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').default('member').notNull(), // admin, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

// Vehicles
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  plate: text('plate').notNull().unique(),
  vin: text('vin'),
  status: vehicleStatusEnum('status').default('available').notNull(),
  dailyRate: decimal('daily_rate', { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),
  fuelType: text('fuel_type'), // diesel, gasoline, electric, hybrid
  transmission: text('transmission'), // manual, automatic
  seats: integer('seats'),
  mileage: integer('mileage'),
  images: jsonb('images').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  team: one(teams, {
    fields: [vehicles.teamId],
    references: [teams.id],
  }),
  reservations: many(reservations),
}));

// Customers (clients finaux)
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  identityVerified: boolean('identity_verified').default(false).notNull(),
  stripeIdentityVerificationId: text('stripe_identity_verification_id'),
  verifiedAt: timestamp('verified_at'),
  loyaltyPoints: integer('loyalty_points').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
}));

// Reservations
export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'restrict' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: reservationStatusEnum('status').default('draft').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal('deposit_amount', { precision: 10, scale: 2 }),
  cautionAmount: decimal('caution_amount', { precision: 10, scale: 2 }),
  collectCautionOnline: boolean('collect_caution_online').default(false).notNull(),
  insuranceAmount: decimal('insurance_amount', { precision: 10, scale: 2 }),
  includeInsurance: boolean('include_insurance').default(false).notNull(),
  magicLinkToken: text('magic_link_token').unique(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeCautionIntentId: text('stripe_caution_intent_id'),
  checkinAt: timestamp('checkin_at'),
  checkinPhotos: jsonb('checkin_photos').$type<string[]>(),
  checkinNotes: text('checkin_notes'),
  checkinMileage: integer('checkin_mileage'),
  checkinFuelLevel: integer('checkin_fuel_level'), // 0-100%
  checkoutAt: timestamp('checkout_at'),
  checkoutPhotos: jsonb('checkout_photos').$type<string[]>(),
  checkoutNotes: text('checkout_notes'),
  checkoutMileage: integer('checkout_mileage'),
  checkoutFuelLevel: integer('checkout_fuel_level'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  team: one(teams, {
    fields: [reservations.teamId],
    references: [teams.id],
  }),
  vehicle: one(vehicles, {
    fields: [reservations.vehicleId],
    references: [vehicles.id],
  }),
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  contracts: many(contracts),
  payments: many(payments),
}));

// Contracts
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  reservationId: uuid('reservation_id').references(() => reservations.id, { onDelete: 'cascade' }).notNull(),
  yousignSignatureRequestId: text('yousign_signature_request_id'),
  pdfUrl: text('pdf_url'),
  signedAt: timestamp('signed_at'),
  signedPdfUrl: text('signed_pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contractsRelations = relations(contracts, ({ one }) => ({
  reservation: one(reservations, {
    fields: [contracts.reservationId],
    references: [reservations.id],
  }),
}));

// Payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  reservationId: uuid('reservation_id').references(() => reservations.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 10, scale: 2 }).default('0.99').notNull(),
  type: paymentTypeEnum('type').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  reservation: one(reservations, {
    fields: [payments.reservationId],
    references: [reservations.id],
  }),
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type User = typeof users.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type Payment = typeof payments.$inferSelect;

export type NewOrganization = typeof organizations.$inferInsert;
export type NewTeam = typeof teams.$inferInsert;
export type NewUser = typeof users.$inferInsert;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type NewVehicle = typeof vehicles.$inferInsert;
export type NewCustomer = typeof customers.$inferInsert;
export type NewReservation = typeof reservations.$inferInsert;
export type NewContract = typeof contracts.$inferInsert;
export type NewPayment = typeof payments.$inferInsert;
