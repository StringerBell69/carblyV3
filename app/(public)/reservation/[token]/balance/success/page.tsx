'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Home,
  Mail,
  Car,
} from 'lucide-react';
import Link from 'next/link';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-center">Vérification de votre paiement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-8 pb-6">
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12">
      <Card className="w-full max-w-lg border-green-200">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4 animate-pulse">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Paiement confirmé !
              </h1>
              <p className="text-lg text-gray-600">
                Le solde de votre réservation a été payé avec succès
              </p>
            </div>

            {/* Reservation Details */}
            {reservation && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Car className="w-5 h-5" />
                  <p className="font-semibold">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Du {new Date(reservation.startDate).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-blue-900">
                <Mail className="w-5 h-5" />
                <p className="font-medium">Confirmation envoyée</p>
              </div>
              <p className="text-sm text-blue-800">
                Un email de confirmation a été envoyé à votre adresse. Vous y trouverez tous les détails de votre réservation.
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-900 mb-2">📋 Prochaines étapes</h3>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Conservez votre email de confirmation</li>
                <li>• Préparez vos documents (permis, carte d'identité)</li>
                <li>• Présentez-vous à l'heure convenue pour récupérer le véhicule</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Link href={`/reservation/${token}`}>
                <Button className="w-full" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  Voir ma réservation
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500">
              Vous pouvez fermer cette page en toute sécurité
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
