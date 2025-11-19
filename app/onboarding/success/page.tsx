'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { completeOnboarding } from '../actions';
import { createTeamConnectAccount, getConnectOnboardingLink } from '../connect-actions';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'verifying' | 'creating-connect' | 'redirecting'>('verifying');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Session invalide');
      setLoading(false);
      return;
    }

    handleOnboarding(sessionId);
  }, [searchParams, router]);

  const handleOnboarding = async (sessionId: string) => {
    try {
      // Step 1: Complete subscription onboarding
      setStep('verifying');
      const result = await completeOnboarding(sessionId);

      if (result.error || !result.teamId) {
        setError(result.error || 'Failed to complete onboarding');
        setLoading(false);
        return;
      }

      // Step 2: Create Stripe Connect account
      setStep('creating-connect');
      const connectResult = await createTeamConnectAccount({
        teamId: result.teamId,
      });

      if (connectResult.error) {
        setError(connectResult.error);
        setLoading(false);
        return;
      }

      // Step 3: Get Connect onboarding link
      setStep('redirecting');
      const linkResult = await getConnectOnboardingLink(result.teamId);

      if (linkResult.error || !linkResult.url) {
        setError(linkResult.error || 'Failed to get onboarding link');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Connect onboarding
      setTimeout(() => {
        window.location.href = linkResult.url!;
      }, 1000);
    } catch (err) {
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  if (loading) {
    const stepMessages = {
      verifying: 'Vérification de votre paiement...',
      'creating-connect': 'Configuration de votre compte de paiement...',
      redirecting: 'Redirection vers la configuration finale...',
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Finalisation de votre compte...
                </p>
                <p className="text-sm text-gray-500">
                  {stepMessages[step]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
                <p className="text-gray-600">{error}</p>
              </div>
              <Button onClick={() => router.push('/onboarding')} variant="default">
                Recommencer l'onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Presque terminé !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Votre abonnement a été créé avec succès
              </AlertDescription>
            </Alert>
            <div>
              <p className="text-gray-600 mb-4">
                Une dernière étape pour configurer l'acceptation des paiements...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-gray-500">Redirection en cours...</span>
              </div>
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
