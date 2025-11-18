'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { checkTeamConnectStatus } from '../connect-actions';

export default function ConnectReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team_id');

  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!teamId) {
      setStatus('error');
      setError('Team ID missing');
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === 'checking' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <h2 className="text-xl font-semibold">Vérification de votre compte...</h2>
              <p className="text-gray-600">Veuillez patienter</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-semibold">Configuration terminée!</h2>
              <p className="text-gray-600">
                Votre compte de paiement est maintenant configuré. Redirection vers le tableau de bord...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-5xl">❌</div>
              <h2 className="text-xl font-semibold">Erreur</h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-primary hover:underline"
              >
                Retour au tableau de bord
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
