'use server';

import { db } from '@/lib/db';
import { teams } from '@/drizzle/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { createConnectAccount, createConnectAccountLink, checkConnectAccountStatus } from '@/lib/stripe';

/**
 * Create a Stripe Connect account for the team
 */
export async function createTeamConnectAccount(data: {
  teamId: string;
  businessName?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Get team with organization
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, data.teamId),
      with: {
        organization: true,
      },
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Use organization name or provided business name
    const businessName = data.businessName || team.organization.name;

    // Create Stripe Connect account
    const { accountId, error } = await createConnectAccount({
      email: session.user.email,
      businessName,
      country: 'FR',
    });

    if (error || !accountId) {
      return { error: error || 'Failed to create Connect account' };
    }

    // Update team with Connect account ID
    await db
      .update(teams)
      .set({
        stripeConnectAccountId: accountId,
      })
      .where(eq(teams.id, data.teamId));

    return { accountId };
  } catch (error) {
    console.error('[createTeamConnectAccount]', error);
    return { error: 'Failed to create Connect account' };
  }
}

/**
 * Get Connect onboarding link
 */
export async function getConnectOnboardingLink(teamId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized' };
    }

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team || !team.stripeConnectAccountId) {
      return { error: 'Connect account not found' };
    }

    // Create account link
    const { url, error } = await createConnectAccountLink({
      accountId: team.stripeConnectAccountId,
      refreshUrl: `${process.env.NEXT_PUBLIC_URL}/onboarding/connect-refresh?team_id=${teamId}`,
      returnUrl: `${process.env.NEXT_PUBLIC_URL}/onboarding/connect-return?team_id=${teamId}`,
    });

    if (error || !url) {
      return { error: error || 'Failed to create onboarding link' };
    }

    return { url };
  } catch (error) {
    console.error('[getConnectOnboardingLink]', error);
    return { error: 'Failed to get onboarding link' };
  }
}

/**
 * Check if Connect account is fully onboarded
 */
export async function checkTeamConnectStatus(teamId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: 'Unauthorized', onboarded: false };
    }

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team || !team.stripeConnectAccountId) {
      return { error: 'Connect account not found', onboarded: false };
    }

    // Check account status
    const { onboarded, error } = await checkConnectAccountStatus(team.stripeConnectAccountId);

    if (error) {
      return { error, onboarded: false };
    }

    // Update team if onboarded
    if (onboarded) {
      await db
        .update(teams)
        .set({
          stripeConnectOnboarded: true,
          // Mark onboarding as completed once Connect is configured
          onboardingCompleted: true,
        })
        .where(eq(teams.id, teamId));
    }

    return { onboarded };
  } catch (error) {
    console.error('[checkTeamConnectStatus]', error);
    return { error: 'Failed to check Connect status', onboarded: false };
  }
}
