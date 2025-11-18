'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PublicReservationPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadReservation();
  }, [token]);

  const loadReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/public/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Réservation non trouvée');
      }

      setReservation(data.reservation);
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
      const response = await fetch(`/api/reservations/public/${token}/checkout`, {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">❌</div>
              <h2 className="text-xl font-semibold">Erreur</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reservation.status !== 'pending_payment' && reservation.status !== 'draft') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-semibold">Réservation déjà payée</h2>
              <p className="text-gray-600">
                Votre réservation a déjà été confirmée et payée.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Confirmer votre réservation</h1>
          <p className="text-gray-600">
            Finalisez le paiement pour valider votre location
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
            <CardTitle>Détails de la réservation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Véhicule</p>
                <p className="font-semibold text-lg">
                  {reservation.vehicle.brand} {reservation.vehicle.model}
                </p>
                <p className="text-sm text-gray-600">{reservation.vehicle.plate}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date de début</p>
                  <p className="font-medium">{formatDate(reservation.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de fin</p>
                  <p className="font-medium">{formatDate(reservation.endDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium">
                  {reservation.customer.firstName} {reservation.customer.lastName}
                </p>
                <p className="text-sm text-gray-600">{reservation.customer.email}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold">Détail du paiement</h4>

              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Montant de la location</span>
                  <span className="font-medium">{formatCurrency(parseFloat(reservation.totalAmount))}</span>
                </div>

                {reservation.depositAmount && (
                  <>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium text-gray-900">Acompte à payer maintenant</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(parseFloat(reservation.depositAmount))}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      Le solde sera à régler lors de la prise en charge du véhicule
                    </p>
                  </>
                )}

                {reservation.includeInsurance && reservation.insuranceAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Assurance incluse</span>
                    <span className="font-medium">{formatCurrency(parseFloat(reservation.insuranceAmount))}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600">Frais Stripe (estimation)</span>
                    <span className="text-xs text-gray-400">~1.4% + 0.25€</span>
                  </div>
                  <span className="text-gray-600">
                    ~{formatCurrency(
                      Math.round((parseFloat(reservation.depositAmount || reservation.totalAmount) * 0.014 + 0.25) * 100) / 100
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de service Carbly</span>
                  <span className="text-gray-600">0,99€</span>
                </div>
                <p className="text-xs text-gray-500 italic pt-1">
                  Les frais de paiement sont facturés séparément pour la transparence
                </p>
              </div>

              <div className="border-t pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total à payer</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        parseFloat(reservation.depositAmount || reservation.totalAmount) + 0.99
                      )}
                    </div>
                    <p className="text-xs text-gray-500">+ frais de paiement</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium">ℹ️ Informations importantes</p>
              <ul className="space-y-1 text-gray-700">
                <li>• Paiement sécurisé par Stripe</li>
                <li>• Carte bancaire ou SEPA acceptés</li>
                <li>• Un contrat de location sera généré après paiement</li>
                <li>• Vous recevrez une confirmation par email</li>
              </ul>
            </div>

            <Button
              onClick={handlePayment}
              disabled={paying}
              className="w-full"
              size="lg"
            >
              {paying ? 'Redirection...' : `Payer ${formatCurrency(parseFloat(reservation.depositAmount || reservation.totalAmount) + 0.99)}`}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          En continuant, vous acceptez nos conditions générales de location
        </p>
      </div>
    </div>
  );
}
