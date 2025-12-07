'use server';

import { getCurrentTeamId } from '@/lib/session';
import { db } from '@/lib/db';
import { teams } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { createExpressDashboardLink } from '@/lib/stripe';

/**
 * Get Stripe Express Dashboard login link for the current team
 */
export async function getStripeDashboardLink(): Promise<{ url?: string; error?: string }> {
  try {
    const teamId = await getCurrentTeamId();
    
    if (!teamId) {
      return { error: 'Unauthorized' };
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team || !team.stripeConnectAccountId) {
      return { error: 'Stripe Connect account not found' };
    }

    const result = await createExpressDashboardLink(team.stripeConnectAccountId);
    
    return result;
  } catch (error) {
    console.error('[getStripeDashboardLink]', error);
    return { error: 'Failed to get dashboard link' };
  }
}
