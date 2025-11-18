import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { DashboardNav } from '@/components/dashboard/nav';
import { db } from '@/lib/db';
import { teamMembers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has any team instead of relying on currentTeamId
  // This prevents redirect loop when session is not refreshed after onboarding
  const userTeams = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, session.user.id),
    with: {
      team: true,
    },
  });

  if (!userTeams) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={session.user} />
      <div className="lg:pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
