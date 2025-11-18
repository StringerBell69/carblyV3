import { redirect } from 'next/navigation';
import { getCurrentSession, getCurrentTeam } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard/nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has any team
  // This uses cached DB query to avoid multiple lookups per request
  const team = await getCurrentTeam();

  if (!team) {
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
