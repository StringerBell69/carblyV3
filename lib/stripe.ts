import Stripe from 'stripe';
import { calculatePlatformFees } from './pricing-config';

// Allow undefined during build time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  // Use latest API version supported by stripe@19.3.1
  typescript: true,
});

// Platform application fee: 0.99€ per transaction (DEPRECATED - use calculatePlatformFees instead)
export const PLATFORM_FEE_AMOUNT = 99; // in cents

// Plan configurations for platform subscriptions
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: "",
    maxVehicles: 3,
    features: [
      "Jusqu'à 3 véhicules",
      "10 réservations/mois",
      "Paiements en ligne",
      "Contrats PDF",
      "Frais: 5% (min 2.50€)",
      "Support basique",
    ],
  },
  starter: {
    name: "Starter",
    price: 49,
    priceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
    maxVehicles: 10,
    features: [
      "Jusqu'à 10 véhicules",
      "Réservations illimitées",
      "Acomptes configurables",
      "Signature électronique (très prochainement)",
      "Check-in/Check-out (prochainement)",
      "Frais: 2% (min 2€)",
      "Support email",
    ],
  },
  pro: {
    name: "Pro",
    price: 99,
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro",
    maxVehicles: 25,
    features: [
      "Jusqu'à 25 véhicules",
      "Toutes les fonctionnalités Starter",
      "Caution en ligne (pré-autorisation)",
      "SMS automatiques",
      "Vérification d'identité (prochainement)",
      "Programme de fidélité",
      "Analytics avancés",
      "Frais: 1% (min 1.50€, max 15€)",
      "Support prioritaire",
    ],
  },
  business: {
    name: "Business",
    price: 199,
    priceId: process.env.STRIPE_PRICE_BUSINESS || "price_business",
    maxVehicles: -1, // unlimited
    features: [
      "Véhicules illimités",
      "Toutes les fonctionnalités Pro",
      "Multi-agences",
      // 'API complète',
      // 'Rapports personnalisés',
      "Single Sign-On (SSO)",
      "White Label (très prochainement)",
      "Frais: 0.5% (min 1€, max 5€)",
      "Support dédié 24/7",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

/**
 * STRIPE CONNECT FUNCTIONS
 * Each team has their own Connect account to receive payments
 */

/**
 * Create a Stripe Connect Express account for a team
 */
export async function createConnectAccount({
  email,
  businessName,
  country = 'FR',
}: {
  email: string;
  businessName: string;
  country?: string;
}): Promise<{ accountId?: string; error?: string }> {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      business_type: 'company',
      company: {
        name: businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        sepa_debit_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily',
          },
        },
      },
    });

    return { accountId: account.id };
  } catch (error: any) {
    console.error('[createConnectAccount]', error);
    
    // Check if error is because Connect is not enabled
    if (error?.message?.includes('signed up for Connect')) {
      return { 
        error: 'Stripe Connect n\'est pas activé sur ce compte. Veuillez activer Connect dans votre dashboard Stripe : https://dashboard.stripe.com/settings/connect' 
      };
    }
    
    return { error: error?.message || 'Failed to create Connect account' };
  }
}

/**
 * Create an account link for Connect onboarding
 */
export async function createConnectAccountLink({
  accountId,
  refreshUrl,
  returnUrl,
}: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<{ url?: string; error?: string }> {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  } catch (error) {
    console.error('[createConnectAccountLink]', error);
    return { error: 'Failed to create account link' };
  }
}

/**
 * Check if a Connect account is fully onboarded
 */
export async function checkConnectAccountStatus(
  accountId: string
): Promise<{ onboarded: boolean; error?: string }> {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    const onboarded =
      account.charges_enabled &&
      account.payouts_enabled &&
      account.details_submitted;

    return { onboarded };
  } catch (error) {
    console.error('[checkConnectAccountStatus]', error);
    return { onboarded: false, error: 'Failed to check account status' };
  }
}

/**
 * Create Express Dashboard login link
 * Allows Express account holders to access their dashboard without manual login
 */
export async function createExpressDashboardLink(
  accountId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return { url: loginLink.url };
  } catch (error: any) {
    console.error('[createExpressDashboardLink]', error);
    return { error: error?.message || 'Failed to create dashboard login link' };
  }
}

/**
 * PAYMENT FUNCTIONS WITH CONNECT
 */

/**
 * Create a Checkout Session for reservation payment
 * - Amount goes to the connected account
 * - Platform takes application fee based on plan
 * - Stripe fees are separate and paid by the connected account
 */
export async function createReservationCheckoutSession({
  amount, // reservation amount in euros
  connectedAccountId,
  customerEmail,
  reservationId,
  teamId,
  teamPlan, // Team plan to calculate fees
  successUrl,
  cancelUrl,
  description,
  cautionAmount, // optional deposit hold
  paymentType = 'total', // 'deposit' or 'total'
}: {
  amount: number;
  connectedAccountId: string;
  customerEmail: string;
  reservationId: string;
  teamId: string;
  teamPlan: PlanType;
  successUrl: string;
  cancelUrl: string;
  description: string;
  cautionAmount?: number;
  paymentType?: 'deposit' | 'total';
}): Promise<{ url?: string; sessionId?: string; error?: string }> {
  try {
    const amountInCents = Math.round(amount * 100);

    // Calculate platform fees based on team plan
    const fees = calculatePlatformFees(amount, teamPlan);
    const platformFeeInCents = Math.round(fees.totalFee * 100);

    console.log('[Stripe] Creating checkout session with metadata:', {
      reservationId,
      teamId,
      teamPlan,
    });

    // Build fee description
    let feeDescription = `${fees.percentageFee}%`;

    if (fees.isMinimumApplied) {
      feeDescription += ` (minimum ${fees.minFee}€ appliqué)`;
    } else if (fees.maxCap !== null) {
      feeDescription += ` (max ${fees.maxCap}€)`;
      if (fees.isCapped) {
        feeDescription += ' - Plafond atteint';
      }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Location de véhicule',
            description,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais Carbly',
            description: feeDescription,
          },
          unit_amount: platformFeeInCents,
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card', 'sepa_debit'],
        customer_email: customerEmail,
        line_items: lineItems,
        payment_intent_data: {
          // Use application_fee_amount so Stripe fees are deducted from the connected account
          // Carbly takes only the platform fee, Stripe fees are paid by the rental owner
          application_fee_amount: platformFeeInCents, // Carbly's fee only
          metadata: {
            reservationId,
            teamId,
            teamPlan,
            platformFeePercentage: String(fees.percentageFee),
            platformFeeMaxCap: fees.maxCap !== null ? String(fees.maxCap) : 'none',
            platformFeeTotal: String(fees.totalFee),
            platformFeeIsCapped: String(fees.isCapped),
            type: 'reservation_payment',
          },
        },
        metadata: {
          reservationId,
          teamId,
          teamPlan,
          paymentType,
          platformFeeTotal: String(fees.totalFee), // Add fee to session metadata for webhook
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        custom_text: {
          submit: {
            message: 'Paiement sécurisé géré par Carbly',
          },
        },
      },
      {
        stripeAccount: connectedAccountId, // Payment is created on the connected account
      }
    );

    console.log('[Stripe] Checkout session created:', {
      sessionId: session.id,
      url: session.url,
      metadata: session.metadata,
    });

    return { url: session.url || undefined, sessionId: session.id };
  } catch (error) {
    console.error('[createReservationCheckoutSession]', error);
    return { error: 'Failed to create checkout session' };
  }
}

/**
 * Create a payment intent for deposit hold (empreinte bancaire)
 * - Creates a pre-authorization that holds funds
 * - Does NOT charge the customer immediately
 * - Must be captured or cancelled later
 */
export async function createDepositHold({
  amount, // deposit amount in euros
  connectedAccountId,
  customerId,
  reservationId,
}: {
  amount: number;
  connectedAccountId: string;
  customerId?: string;
  reservationId: string;
}): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }> {
  try {
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: 'eur',
        customer: customerId,
        capture_method: 'manual', // Pre-authorization (empreinte)
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          reservationId,
          type: 'deposit_hold',
        },
        description: `Caution - Réservation ${reservationId.slice(0, 8)}`,
      },
      {
        stripeAccount: connectedAccountId, // On the connected account
      }
    );

    return {
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('[createDepositHold]', error);
    return { error: 'Failed to create deposit hold' };
  }
}

/**
 * Cancel a deposit hold (release the funds)
 */
export async function cancelDepositHold(
  paymentIntentId: string,
  connectedAccountId: string
): Promise<{ success: boolean }> {
  try {
    await stripe.paymentIntents.cancel(
      paymentIntentId,
      {},
      { stripeAccount: connectedAccountId }
    );
    return { success: true };
  } catch (error) {
    console.error('[cancelDepositHold]', error);
    return { success: false };
  }
}

/**
 * Capture a deposit hold (charge the customer)
 */
export async function captureDepositHold({
  paymentIntentId,
  connectedAccountId,
  amount, // Optional: capture partial amount
}: {
  paymentIntentId: string;
  connectedAccountId: string;
  amount?: number;
}): Promise<{ success: boolean }> {
  try {
    await stripe.paymentIntents.capture(
      paymentIntentId,
      {
        amount_to_capture: amount ? Math.round(amount * 100) : undefined,
      },
      { stripeAccount: connectedAccountId }
    );
    return { success: true };
  } catch (error) {
    console.error('[captureDepositHold]', error);
    return { success: false };
  }
}

/**
 * PLATFORM SUBSCRIPTION FUNCTIONS
 * For teams paying their monthly Carbly subscription
 */

/**
 * Create subscription checkout for platform fees
 */
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
}): Promise<{ url?: string; error?: string }> {
  try {
    const plan = PLANS[planType];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
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

    return { url: session.url || undefined };
  } catch (error) {
    console.error('[createSubscriptionCheckout]', error);
    return { error: 'Failed to create subscription checkout' };
  }
}

/**
 * Create Stripe Identity verification session (for Pro+ plans)
 */
export async function createIdentityVerification({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url?: string; error?: string }> {
  try {
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        customerId,
      },
      return_url: returnUrl,
    });

    return { url: verificationSession.url || undefined };
  } catch (error) {
    console.error('[createIdentityVerification]', error);
    return { error: 'Failed to create identity verification' };
  }
}
