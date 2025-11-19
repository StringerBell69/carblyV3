'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { checkTeamConnectStatus } from '../connect-actions';

function ConnectReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team_id');

  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teamId) {
      setStatus('error');
      setError('Team ID missing - URL incorrecte');
      return;
    }

    checkStatus();
  }, [teamId]);

  const checkStatus = async () => {
    if (!teamId) return;

    try {
      const result = await checkTeamConnectStatus(teamId);

      if (result.error) {
        setStatus('error');
        setError(result.error);
        return;
      }

      if (result.onboarded) {
        setStatus('success');
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setStatus('error');
        setError('Onboarding not completed. Please complete all required information.');
      }
    } catch (err) {
      setStatus('error');
      setError('Failed to verify onboarding status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Card className={`w-full max-w-md ${status === 'error' ? 'border-red-200' : status === 'success' ? 'border-green-200' : ''}`}>
        <CardContent className="pt-8">
          {status === 'checking' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Vérification de votre compte...
                </h2>
                <p className="text-gray-500">Veuillez patienter</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Configuration terminée !
                </h2>
                <p className="text-gray-600">
                  Votre compte de paiement est maintenant configuré. Redirection vers le tableau de bord...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
                <p className="text-gray-600">{error}</p>
                {teamId && (
                  <p className="text-xs text-gray-500 mt-2">Team ID: {teamId}</p>
                )}
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Continuer vers le tableau de bord
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <ConnectReturnContent />
    </Suspense>
  );
}
