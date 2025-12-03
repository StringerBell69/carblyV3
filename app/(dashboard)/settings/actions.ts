'use server';

import { db } from '@/lib/db';
import { teams } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { getCurrentTeamId } from '@/lib/session';

export async function changePlan(data: {
  newPlan: 'free' | 'starter' | 'pro' | 'business';
  billingInterval: 'monthly' | 'yearly';
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    const teamId = await getCurrentTeamId();

    if (!teamId) {
      return { error: 'No team found' };
    }

    // Get current team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        organization: true,
      },
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Determine max vehicles based on new plan
    const maxVehicles =
      data.newPlan === 'free' ? 3 :
      data.newPlan === 'starter' ? 10 :
      data.newPlan === 'pro' ? 25 :
      100; // business

    // If changing to free plan, just update the database
    if (data.newPlan === 'free') {
      await db
        .update(teams)
        .set({
          plan: data.newPlan,
          maxVehicles,
          subscriptionStatus: 'active',
        })
        .where(eq(teams.id, teamId));

      return { success: true };
    }

    // For paid plans, create Stripe checkout session
    // Get or create Stripe customer
    let customerId = team.organization.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: team.organization.name,
        metadata: {
          organizationId: team.organizationId,
        },
      });
      customerId = customer.id;

      await db
        .update(teams)
        .set({ 
          plan: data.newPlan,
          maxVehicles,
        })
        .where(eq(teams.id, teamId));
    }

    // Get price ID from environment based on plan and billing interval
    let priceId: string | undefined;

    if (data.billingInterval === 'monthly') {
      priceId =
        data.newPlan === 'starter'
          ? process.env.STRIPE_STARTER_PRICE_ID
          : data.newPlan === 'pro'
          ? process.env.STRIPE_PRO_PRICE_ID
          : process.env.STRIPE_BUSINESS_PRICE_ID;
    } else {
      // yearly
      priceId =
        data.newPlan === 'starter'
          ? process.env.STRIPE_STARTER_YEARLY_PRICE_ID
          : data.newPlan === 'pro'
          ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
          : process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID;
    }

    if (!priceId) {
      return { error: 'Price ID not configured for selected plan and billing interval' };
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        organizationId: team.organizationId,
        teamId: teamId,
        plan: data.newPlan,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings?plan_changed=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings?tab=billing`,
    });

    return { url: checkoutSession.url };
  } catch (error) {
    console.error('[changePlan]', error);
    return { error: 'Failed to change plan' };
  }
}
