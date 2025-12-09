import { cache } from 'react';
import { auth } from './auth';
import { headers } from 'next/headers';
import { db } from './db';
import { teamMembers, teams } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Get current user session
 * Cached per-request to avoid multiple auth calls
 */
export const getCurrentSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

/**
 * Get current user's team with full details
 * Cached per-request to avoid multiple DB queries
 *
 * Returns the user's team from DB instead of relying on session.user.currentTeamId
 * which may not be up-to-date after onboarding
 * 
 * Includes retry logic to handle potential DB timing issues after login
 */
export const getCurrentTeam = cache(async () => {
  const session = await getCurrentSession();

  if (!session?.user) {
    return null;
  }

  // Retry logic to handle DB timing issues
  const maxRetries = 3;
  const retryDelay = 100; // ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
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

    if (userTeam?.team) {
      return userTeam.team;
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  return null;
});

/**
 * Get current team ID
 * Convenience wrapper for getCurrentTeam
 */
export const getCurrentTeamId = cache(async () => {
  const team = await getCurrentTeam();
  return team?.id || null;
});

/**
 * Get current organization ID
 * Convenience wrapper for getCurrentTeam
 */
export const getCurrentOrganizationId = cache(async () => {
  const team = await getCurrentTeam();
  return team?.organizationId || null;
});

/**
 * Require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Require team membership
 * Throws error if user doesn't have a team
 */
export async function requireTeam() {
  const team = await getCurrentTeam();

  if (!team) {
    throw new Error('No team found');
  }

  return team;
}
