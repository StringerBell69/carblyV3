'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, LogOut } from 'lucide-react';
import { getConnectOnboardingLink } from '../connect-actions';
import { checkExistingTeam } from '../actions';
import { signOut } from '@/lib/auth-client';

function ConnectRefreshContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team_id');
  const [existingTeamStatus, setExistingTeamStatus] = useState<{id?: string; stripeConnectAccountId?: string | null}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkForExistingTeam();
  }, []);

  const checkForExistingTeam = async () => {
    try {
      const result = await checkExistingTeam();
      if (result.team) {
        setExistingTeamStatus(result.team);
      }
    } catch (err) {
      console.error('Error checking existing team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!existingTeamStatus.id) {
      setError('Team ID missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, check if Connect account exists - if not, create it
      if (!existingTeamStatus.stripeConnectAccountId) {
        const { createTeamConnectAccount } = await import('../connect-actions');
        const createResult = await createTeamConnectAccount({ teamId: existingTeamStatus.id });
        
        if (createResult.error) {
          setError(createResult.error);
          setLoading(false);
          return;
        }
      }

      // Now get the onboarding link
      const result = await getConnectOnboardingLink(existingTeamStatus.id);

      if (result.error || !result.url) {
        setError(result.error || 'Failed to get onboarding link');
        return;
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = result.url;
    } catch (err) {
      setError('Failed to restart onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    if (confirm('Voulez-vous vous déconnecter ou continuer vers le tableau de bord ?\n\nCliquez sur OK pour vous déconnecter\nCliquez sur Annuler pour aller au tableau de bord')) {
      signOut();
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-yellow-200">
        <CardContent className="pt-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-yellow-100 p-3">
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Configuration interrompue
              </h2>
              <p className="text-gray-600 mb-3">
                La configuration de votre compte de paiement n'a pas été terminée.
              </p>
              <p className="text-sm text-gray-500">
                Vous devez compléter cette étape pour accepter les paiements de vos clients.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleRetry}
                disabled={loading || !existingTeamStatus.id}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirection...
                  </div>
                ) : (
                  'Reprendre la configuration'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleLater}
                className="w-full"
              >
                Plus tard
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  router.push('/login');
                }}
                className="w-full text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Vous pouvez également compléter cette étape depuis les paramètres
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectRefreshPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ConnectRefreshContent />
    </Suspense>
  );
}
