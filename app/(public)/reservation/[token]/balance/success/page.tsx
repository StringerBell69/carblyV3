'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Car,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function BalanceSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setError('Session de paiement invalide');
      setLoading(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/reservations/public/${token}/balance`);
      const data = await response.json();

      if (response.ok) {
        setReservation(data.reservation);
      } else {
        setError(data.error || 'Erreur lors de la vérification');
      }
    } catch (err) {
      setError('Erreur de vérification du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-gray-900 mb-1">Solde payé !</h1>
              <p className="text-sm text-gray-600">Votre réservation est complète</p>
            </div>

            {/* Reservation Info */}
            {reservation && (
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Car className="w-4 h-4" />
                  <span className="font-semibold text-sm">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="bg-green-50 rounded-lg p-3 text-xs text-green-800 text-left">
              <p className="font-medium mb-1">📋 Prochaines étapes</p>
              <ul className="space-y-0.5">
                <li>• Conservez votre email de confirmation</li>
                <li>• Préparez permis et pièce d'identité</li>
                <li>• Présentez-vous à l'heure convenue</li>
              </ul>
            </div>

            {/* Action Button */}
            {reservation?.magicLinkToken && (
              <Link href={`/reservation/${reservation.magicLinkToken}`} className="block">
                <Button className="w-full" size="lg">
                  Voir ma réservation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}

            <p className="text-[10px] text-gray-400">
              Confirmation envoyée par email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
