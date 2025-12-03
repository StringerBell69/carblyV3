import { redirect } from 'next/navigation';
import { getCurrentSession, getCurrentTeam } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard/nav';
import { Toaster } from 'sonner';

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

  // Check if team has completed onboarding
  // User might have created team but not completed payment or Stripe Connect setup
  const isFree = team.plan === 'free';
  
  const needsOnboarding = isFree
    ? !team.stripeConnectOnboarded // Free plan only needs Connect onboarding
    : (!team.stripeSubscriptionId ||
       team.subscriptionStatus !== 'active' ||
       !team.stripeConnectOnboarded);

  if (needsOnboarding) {
    // Redirect to appropriate page based on onboarding status
    if (!isFree && (!team.stripeSubscriptionId || team.subscriptionStatus !== 'active')) {
      // Payment not completed - redirect to onboarding page that will show current status
      redirect('/onboarding');
    } else if (!team.stripeConnectOnboarded) {
      // Stripe Connect not completed - redirect to connect refresh page
      redirect('/onboarding/connect-refresh');
    }
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
      <Toaster position="top-right" />
    </div>
  );
}
