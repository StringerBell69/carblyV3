'use server';

import { db } from '@/lib/db';
import { organizations, teams, teamMembers, users } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';

export async function createOrganization(name: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        name,
      })
      .returning();

    return { organization: org };
  } catch (error) {
    console.error('[createOrganization]', error);
    return { error: 'Failed to create organization' };
  }
}

export async function createTeam(data: {
  organizationId: string;
  name: string;
  address?: string;
  plan: 'free' |'starter' | 'pro' | 'business';
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Determine max vehicles based on plan
    const maxVehicles = data.plan === 'starter' ? 5 : data.plan === 'pro' ? 20 : 100;

    // Create team
    const [team] = await db
      .insert(teams)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        address: data.address,
        plan: data.plan,
        maxVehicles,
        subscriptionStatus: 'incomplete',
      })
      .returning();

    // Add user as team admin
    await db.insert(teamMembers).values({
      userId: session.user.id,
      teamId: team.id,
      role: 'admin',
    });

    // Update user's current team
    await db
      .update(users)
      .set({ currentTeamId: team.id })
      .where(eq(users.id, session.user.id));

    return { team };
  } catch (error) {
    console.error('[createTeam]', error);
    return { error: 'Failed to create team' };
  }
}

export async function createStripeCheckoutSession(data: {
  organizationId: string;
  teamId: string;
  plan: 'starter' | 'pro' | 'business';
  billingInterval: 'monthly' | 'yearly';
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Get or create Stripe customer
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, data.organizationId));

    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: org.name,
        metadata: {
          organizationId: data.organizationId,
        },
      });
      customerId = customer.id;

      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId })
        .where(eq(organizations.id, data.organizationId));
    }

    // Get price ID from environment based on plan and billing interval
    let priceId: string | undefined;

    if (data.billingInterval === 'monthly') {
      priceId =
        data.plan === 'starter'
          ? process.env.STRIPE_STARTER_PRICE_ID
          : data.plan === 'pro'
          ? process.env.STRIPE_PRO_PRICE_ID
          : process.env.STRIPE_BUSINESS_PRICE_ID;
    } else {
      // yearly
      priceId =
        data.plan === 'starter'
          ? process.env.STRIPE_STARTER_YEARLY_PRICE_ID
          : data.plan === 'pro'
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
        organizationId: data.organizationId,
        teamId: data.teamId,
        plan: data.plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding?step=payment`,
    });

    return { url: checkoutSession.url };
  } catch (error) {
    console.error('[createStripeCheckoutSession]', error);
    return { error: 'Failed to create checkout session' };
  }
}

export async function completeOnboarding(sessionId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Verify Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== 'paid') {
      return { error: 'Payment not completed' };
    }

    const { teamId, organizationId } = stripeSession.metadata as { teamId: string; organizationId: string };

    // Update team with subscription
    await db
      .update(teams)
      .set({
        stripeSubscriptionId: stripeSession.subscription as string,
        subscriptionStatus: 'active',
      })
      .where(eq(teams.id, teamId));

    return { success: true, teamId, organizationId };
  } catch (error) {
    console.error('[completeOnboarding]', error);
    return { error: 'Failed to complete onboarding' };
  }
}

export async function checkExistingTeam() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Get user's team from DB
    const userTeam = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, session.user.id),
      with: {
        team: {
          with: {
            organization: true,
          },
        },
      },
    });

    if (!userTeam?.team) {
      return { team: null };
    }

    return { team: userTeam.team };
  } catch (error) {
    console.error('[checkExistingTeam]', error);
    return { error: 'Failed to check existing team' };
  }
}
