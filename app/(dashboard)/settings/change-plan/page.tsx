import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { teams } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';
import { ChangePlanClient } from './change-plan-client';

export default async function ChangePlanPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const teamId = await getCurrentTeamId();

  if (!teamId) {
    redirect('/login');
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
  });

  if (!team) {
    return <div>Team not found</div>;
  }

  return <ChangePlanClient currentPlan={team.plan} />;
}
