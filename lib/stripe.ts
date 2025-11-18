import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Plan configurations
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
    maxVehicles: 5,
    features: [
      'Jusqu\'à 5 véhicules',
      'Réservations illimitées',
      'Paiements en ligne (carte)',
      'Génération de contrats PDF',
      'Dashboard basique',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    maxVehicles: 20,
    features: [
      'Jusqu\'à 20 véhicules',
      'Toutes les features Starter',
      'Paiements SEPA',
      'Vérification d\'identité (Stripe Identity)',
      'Pré-autorisation caution en ligne',
      'Assurance optionnelle',
      'Calendrier de disponibilité',
      'Prolongation de réservation',
      'Annulation avec remboursement',
    ],
  },
  business: {
    name: 'Business',
    price: 199,
    priceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business',
    maxVehicles: -1, // unlimited
    features: [
      'Véhicules illimités',
      'Toutes les features Pro',
      'Multi-utilisateurs avec rôles',
      'Programme de fidélité',
      'Export comptable (CSV)',
      'White-label contrats',
      'Support prioritaire',
      'API & webhooks',
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Helper to create a checkout session for subscription
export async function createSubscriptionCheckout({
  planType,
  customerEmail,
  organizationId,
  teamId,
  successUrl,
  cancelUrl,
}: {
  planType: PlanType;
  customerEmail: string;
  organizationId: string;
  teamId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = PLANS[planType];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['sepa_debit', 'card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    metadata: {
      organizationId,
      teamId,
      plan: planType,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// Helper to create a payment intent for reservation
export async function createReservationPayment({
  amount,
  reservationId,
  teamId,
  customerEmail,
  vehicleDescription,
  vehicleImage,
}: {
  amount: number;
  reservationId: string;
  teamId: string;
  customerEmail: string;
  vehicleDescription: string;
  vehicleImage?: string;
}) {
  // Create payment intent with reservation amount + 0.99€ fee
  const totalAmount = Math.round((amount + 0.99) * 100); // in cents

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'eur',
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: customerEmail,
    metadata: {
      reservationId,
      teamId,
      type: 'reservation',
    },
    description: `Location ${vehicleDescription}`,
  });

  return paymentIntent;
}

// Helper to create a caution pre-authorization (Pro+)
export async function createCautionPreAuthorization({
  amount,
  reservationId,
  customerEmail,
}: {
  amount: number;
  reservationId: string;
  customerEmail: string;
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'eur',
    capture_method: 'manual', // Don't capture immediately
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: customerEmail,
    metadata: {
      reservationId,
      type: 'caution',
    },
    description: `Caution - Réservation ${reservationId.slice(0, 8)}`,
  });

  return paymentIntent;
}

// Helper to create Stripe Identity verification session (Pro+)
export async function createIdentityVerification({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const verificationSession = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: {
      customerId,
    },
    return_url: returnUrl,
  });

  return verificationSession;
}
