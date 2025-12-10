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

  // Check if team has completed onboarding based on plan type
  const isFree = team.plan === 'free';
  const hasActiveSubscription = team.stripeSubscriptionId && team.subscriptionStatus === 'active';
  const isConnectConfigured = team.stripeConnectOnboarded;

  // Determine if onboarding is needed
  if (isFree && !isConnectConfigured) {
    // Free plan: needs Connect setup, send to plan selection
    redirect('/onboarding?step=payment');
  } else if (!isFree && !hasActiveSubscription) {
    // Paid plan without active subscription: needs to pay, send to plan selection
    redirect('/onboarding?step=payment');
  } else if (!isFree && hasActiveSubscription && !isConnectConfigured) {
    // Paid plan with active subscription but no Connect: send to Connect setup
    redirect('/onboarding/connect-refresh');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={session.user} />
      <div className="lg:pl-64 pt-16 lg:pt-0">
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
