'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getConnectOnboardingLink } from '../connect-actions';

export default function ConnectRefreshPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team_id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRetry = async () => {
    if (!teamId) {
      setError('Team ID missing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await getConnectOnboardingLink(teamId);

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-semibold">Configuration interrompue</h2>
            <p className="text-gray-600">
              La configuration de votre compte de paiement n'a pas été terminée.
            </p>
            <p className="text-sm text-gray-500">
              Vous devez compléter cette étape pour accepter les paiements de vos clients.
            </p>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 pt-4">
              <Button
                onClick={handleRetry}
                disabled={loading || !teamId}
                className="w-full"
              >
                {loading ? 'Redirection...' : 'Reprendre la configuration'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Plus tard
              </Button>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Vous pouvez également compléter cette étape depuis les paramètres
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
