'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { completeOnboarding } from '../actions';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Session invalide');
      setLoading(false);
      return;
    }

    completeOnboarding(sessionId)
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          // Wait 2 seconds before redirecting
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      })
      .catch(() => {
        setError('Une erreur est survenue');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-lg font-medium">Finalisation de votre compte...</p>
              <p className="text-sm text-gray-500">
                Nous vérifions votre paiement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">❌</div>
              <h2 className="text-xl font-semibold">Erreur</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => router.push('/onboarding')}>
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl">Bienvenue sur Carbly !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Votre compte a été créé avec succès. Vous allez être redirigé vers votre
              tableau de bord...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-sm text-gray-500">Redirection en cours...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
