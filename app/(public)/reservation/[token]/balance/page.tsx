'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Car,
  Calendar,
  User,
  CreditCard,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BalancePaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);

  useEffect(() => {
    loadReservation();
  }, [token]);

  const loadReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/public/${token}/balance`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Réservation non trouvée');
      }

      setReservation(data.reservation);
      setBalanceInfo(data.balanceInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    setError('');

    try {
      const response = await fetch(`/api/reservations/public/${token}/balance/checkout`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de paiement');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de paiement');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-center">Chargement de votre réservation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !reservation) {
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if balance is already paid
  if (balanceInfo?.alreadyPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Solde déjà payé</h2>
                <p className="text-gray-600">Le solde de cette réservation a déjà été réglé.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Paiement du solde</h1>
          <p className="text-gray-600 text-lg">
            Finalisez votre réservation en payant le solde restant
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Détails de la réservation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Vehicle */}
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="rounded-full bg-blue-100 p-2">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Véhicule</p>
                  <p className="font-semibold text-lg text-gray-900">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                  <p className="text-sm text-gray-600 font-mono">{reservation.vehicle.plate}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="rounded-full bg-orange-100 p-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Période de location</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Du:</span>
                      <p className="font-medium text-gray-900">{formatDate(reservation.startDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Au:</span>
                      <p className="font-medium text-gray-900">{formatDate(reservation.endDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Client</p>
                  <p className="font-semibold text-gray-900">
                    {reservation.customer.firstName} {reservation.customer.lastName}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {reservation.customer.email}
                  </p>
                  {reservation.customer.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {reservation.customer.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold">Détail du paiement</h4>

              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Montant total de la réservation</span>
                  <span className="font-medium">{formatCurrency(balanceInfo.totalReservation)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Acompte déjà payé</span>
                  <span className="font-medium text-green-600">- {formatCurrency(balanceInfo.depositPaid)}</span>
                </div>

                <div className="flex justify-between text-sm border-t border-blue-300 pt-2">
                  <span className="font-medium text-gray-900">Solde restant</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(balanceInfo.balance)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de plateforme Carbly</span>
                  <span className="text-gray-600">{formatCurrency(balanceInfo.platformFees)}</span>
                </div>

                <div className="border-t-2 border-blue-400 pt-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total à payer</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(balanceInfo.totalToPay)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium">ℹ️ Informations importantes</p>
              <ul className="space-y-1 text-gray-700">
                <li>• Paiement 100% sécurisé via Stripe</li>
                <li>• Carte bancaire ou SEPA acceptés</li>
                <li>• Vous recevrez une confirmation par email</li>
                <li>• Le paiement finalise votre réservation</li>
              </ul>
            </div>

            <Button
              onClick={handlePayment}
              disabled={paying}
              className="w-full"
              size="lg"
            >
              {paying ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirection vers le paiement...
                </div>
              ) : (
                `Payer ${formatCurrency(balanceInfo.totalToPay)}`
              )}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Paiement sécurisé - Vos données bancaires sont protégées
        </p>
      </div>
    </div>
  );
}
