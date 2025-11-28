'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Download,
  FileText,
  Mail,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { calculatePlatformFees, type PlanType } from '@/lib/pricing-config';

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

      // If reservation has no customer (self-fill mode), redirect to customer info page
      if (!data.reservation.customerId && data.reservation.status === 'pending_payment') {
        window.location.href = `/reservation/${token}/customer-info`;
        return;
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

  // Calculate platform fees based on team plan
  const teamPlan = (reservation?.team?.plan || 'free') as PlanType;
  const paymentAmount = parseFloat(reservation?.depositAmount || reservation?.totalAmount || '0');
  const platformFees = calculatePlatformFees(paymentAmount, teamPlan);

  // Reservation Hub for paid reservations
  if (reservation.status !== 'pending_payment' && reservation.status !== 'draft') {
    const contract = reservation.contracts?.[0];
    const contractPdfUrl = contract?.pdfUrl;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Réservation confirmée</h1>
            <p className="text-sm text-gray-500">Réservation #{reservation.id.slice(0, 8)}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Contract Section */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-green-600" />
                Contrat de location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contract?.signedAt && contract?.signedPdfUrl ? (
                <>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <p className="font-medium text-sm">Contrat signé électroniquement</p>
                  </div>
                  <a
                    href={contract.signedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le contrat
                  </a>
                </>
              ) : contract?.yousignSignatureRequestId ? (
                <>
                  <div className="flex items-center gap-2 text-blue-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="font-medium text-sm">En attente de signature</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Un email avec le lien de signature électronique vous a été envoyé.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Actualiser
                  </Button>
                </>
              ) : contractPdfUrl ? (
                <>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="w-4 h-4" />
                    <p className="font-medium text-sm">Contrat en préparation</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Vous recevrez un email pour signer électroniquement le contrat.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <p className="font-medium text-sm">Génération du contrat en cours</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    L'agence va générer votre contrat. Vous recevrez un email dès qu'il sera prêt.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="w-4 h-4 text-primary" />
                  Véhicule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-gray-900">
                  {reservation.vehicle.brand} {reservation.vehicle.model}
                </p>
                <p className="text-sm text-gray-600 font-mono">{reservation.vehicle.plate}</p>
                {reservation.vehicle.year && (
                  <p className="text-xs text-gray-500 mt-1">{reservation.vehicle.year}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-primary" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {reservation.customer.firstName} {reservation.customer.lastName}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {reservation.customer.email}
                </p>
                {reservation.customer.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {reservation.customer.phone}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dates and Payment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-primary" />
                Dates de location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Début</span>
                <span className="font-medium">{formatDate(reservation.startDate)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Fin</span>
                <span className="font-medium">{formatDate(reservation.endDate)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50/50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-green-600" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Paiement confirmé</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Montant total</span>
                <span className="font-bold">{formatCurrency(parseFloat(reservation.totalAmount))}</span>
              </div>
              {reservation.depositAmount && (
                <div className="flex justify-between items-center text-sm">
                  <span>Reste à payer</span>
                  <span>{formatCurrency(parseFloat(reservation.totalAmount) - parseFloat(reservation.depositAmount))}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Info */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="pt-4 pb-4">
              <h3 className="font-medium text-blue-900 mb-2 text-sm">📋 À savoir</h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Présentez-vous à l'heure convenue avec votre permis et pièce d'identité</li>
                <li>• Le contrat de location vous a été envoyé par email</li>
                <li>• Contactez l'agence en cas de besoin</li>
              </ul>
            </CardContent>
          </Card>
        </div>
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
                      Le solde de {formatCurrency(parseFloat(reservation.totalAmount) - parseFloat(reservation.depositAmount))} sera à régler lors de la prise en charge du véhicule
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
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais Carbly</span>
                  <span className="text-gray-600">{formatCurrency(platformFees.totalFee)}</span>
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
                      {formatCurrency(paymentAmount + platformFees.totalFee)}
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
                `Payer ${formatCurrency(paymentAmount + platformFees.totalFee)}`
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
