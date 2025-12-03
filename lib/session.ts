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
 */
export const getCurrentTeam = cache(async () => {
  const session = await getCurrentSession();

  if (!session?.user) {
    return null;
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

  return userTeam?.team || null;
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
