'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Car, Calendar, User, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
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

  if (reservation.status !== 'pending_payment' && reservation.status !== 'draft') {
    // Find the contract PDF
    const contract = reservation.contracts?.[0];
    const contractPdfUrl = contract?.pdfUrl;

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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Réservation confirmée
                </h2>
                <p className="text-gray-600 mb-4">
                  Votre réservation a déjà été confirmée et payée.
                </p>
                {contractPdfUrl && (
                  <div className="mt-6">
                    <a
                      href={contractPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      Télécharger le contrat
                    </a>
                    <p className="text-sm text-gray-500 mt-3">
                      Le contrat a également été envoyé par email
                    </p>
                  </div>
                )}
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Confirmer votre réservation</h1>
          <p className="text-gray-600 text-lg">
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
                  <p className="text-sm text-gray-600">{reservation.customer.email}</p>
                </div>
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
                    <span className="text-gray-600">Frais bancaires (estimation)</span>
                    <span className="text-xs text-gray-400">~1.4% + 0.25€</span>
                  </div>
                  <span className="text-gray-600">
                    ~{formatCurrency(
                      Math.round((parseFloat(reservation.depositAmount || reservation.totalAmount) * 0.014 + 0.25) * 100) / 100
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais Carbly</span>
                  <span className="text-gray-600">0,99€</span>
                </div>
                <p className="text-xs text-gray-500 italic pt-1">
                  Les frais sont facturés séparément pour la transparence
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
                <li>• Paiement 100% sécurisé</li>
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
              {paying ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirection vers le paiement...
                </div>
              ) : (
                `Payer ${formatCurrency(parseFloat(reservation.depositAmount || reservation.totalAmount) + 0.99)}`
              )}
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
