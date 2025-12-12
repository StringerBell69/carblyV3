'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Check, Loader2 } from 'lucide-react';

export default function ReservationSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let pollAttempts = 0;
    const maxAttempts = 10;

    const pollReservationStatus = async () => {
      try {
        const response = await fetch(`/api/reservations/public/${token}`);
        const data = await response.json();

        if (response.ok && data.reservation) {
          if (data.reservation.status === 'paid') {
            setChecking(false);
            return;
          }
        }

        pollAttempts++;

        if (pollAttempts < maxAttempts) {
          setTimeout(pollReservationStatus, 1000);
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error('Error polling reservation:', error);
        pollAttempts++;

        if (pollAttempts < maxAttempts) {
          setTimeout(pollReservationStatus, 1000);
        } else {
          setChecking(false);
        }
      }
    };

    pollReservationStatus();
  }, [token]);

  useEffect(() => {
    if (!checking) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const redirectTimer = setTimeout(() => {
        router.push(`/reservation/${token}`);
      }, 3000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(redirectTimer);
      };
    }
  }, [checking, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm border-green-200">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-5">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Paiement réussi !</h1>
              <p className="text-sm text-gray-600">Votre réservation est confirmée</p>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm text-gray-700">Paiement confirmé</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                {checking ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin shrink-0" />
                ) : (
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                )}
                <span className="text-sm text-gray-700">Email de confirmation envoyé</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                {checking ? (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin shrink-0" />
                ) : (
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                )}
                <span className="text-sm text-gray-700">Contrat en préparation</span>
              </div>
            </div>

            {/* Redirect countdown */}
            {!checking && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Redirection dans {countdown}s...
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 leading-relaxed">
              Vous recevrez un email avec le contrat à signer électroniquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
