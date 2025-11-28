'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Check, Loader2 } from 'lucide-react';

export default function ReservationSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let pollAttempts = 0;
    const maxAttempts = 10; // Try for up to 10 seconds

    const pollReservationStatus = async () => {
      try {
        const response = await fetch(`/api/reservations/public/${token}`);
        const data = await response.json();

        if (response.ok && data.reservation) {
          // If status is paid, wait a moment to show success then redirect
          if (data.reservation.status === 'paid') {
            setChecking(false);

            // Start countdown
            const countdownInterval = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  router.push(`/reservation/${token}`);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            return;
          }
        }

        pollAttempts++;

        // Continue polling if not paid yet and haven't exceeded max attempts
        if (pollAttempts < maxAttempts) {
          setTimeout(pollReservationStatus, 1000);
        } else {
          // After max attempts, redirect anyway
          setChecking(false);
          setTimeout(() => {
            router.push(`/reservation/${token}`);
          }, 2000);
        }
      } catch (error) {
        console.error('Error polling reservation:', error);
        pollAttempts++;

        if (pollAttempts < maxAttempts) {
          setTimeout(pollReservationStatus, 1000);
        } else {
          setChecking(false);
          setTimeout(() => {
            router.push(`/reservation/${token}`);
          }, 2000);
        }
      }
    };

    pollReservationStatus();
  }, [token, router]);

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
            <CardTitle className="text-2xl text-gray-900">Paiement réussi !</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Votre réservation a été confirmée avec succès
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Paiement confirmé</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  {checking ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">Email de confirmation envoyé</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  {checking ? (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">Contrat en cours de génération</span>
              </div>
            </div>

            {!checking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                </p>
              </div>
            )}

            <p className="text-sm text-gray-600 leading-relaxed">
              Vous allez recevoir un email avec le contrat de location à signer électroniquement dans les prochaines minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
