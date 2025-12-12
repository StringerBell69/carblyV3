'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Car,
  Calendar,
  User,
  CreditCard,
  Loader2,
  CheckCircle2,
  Shield,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !reservation) {
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

  // Already paid view
  if (balanceInfo?.alreadyPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm border-green-200">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-1">Solde déjà payé</h2>
            <p className="text-sm text-gray-600">Le solde de cette réservation a été réglé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paiement du solde</h1>
          <p className="text-sm text-gray-600">Finalisez votre réservation</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Info Card */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Vehicle & Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Car className="h-3.5 w-3.5" />
                  Véhicule
                </div>
                <p className="font-semibold text-sm">
                  {reservation.vehicle.brand} {reservation.vehicle.model}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {reservation.vehicle.plate}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <User className="h-3.5 w-3.5" />
                  Client
                </div>
                <p className="font-semibold text-sm">
                  {reservation.customer.firstName} {reservation.customer.lastName}
                </p>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-green-600 font-medium mb-0.5">Début</div>
                <p className="font-semibold text-sm">{formatDate(reservation.startDate)}</p>
              </div>
              <div>
                <div className="text-xs text-red-600 font-medium mb-0.5">Fin</div>
                <p className="font-semibold text-sm">{formatDate(reservation.endDate)}</p>
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total réservation</span>
                <span>{formatCurrency(balanceInfo.totalReservation)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Acompte payé</span>
                <span>- {formatCurrency(balanceInfo.depositPaid)}</span>
              </div>
              <Separator className="bg-blue-200" />
              <div className="flex justify-between text-sm font-medium">
                <span>Solde restant</span>
                <span>{formatCurrency(balanceInfo.balance)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Frais Carbly</span>
                <span>{formatCurrency(balanceInfo.platformFees)}</span>
              </div>
              <Separator className="bg-blue-300" />
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold">Total à payer</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(balanceInfo.totalToPay)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Paiement sécurisé</span>
          </div>
          <p>CB ou SEPA acceptés. Confirmation par email.</p>
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={paying}
          className="w-full h-12 text-base"
          size="lg"
        >
          {paying ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirection...
            </div>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Payer {formatCurrency(balanceInfo.totalToPay)}
            </>
          )}
        </Button>

        <p className="text-center text-[10px] text-gray-400">
          Paiement sécurisé via Stripe
        </p>
      </div>
    </div>
  );
}
