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

  // Reservation Hub for paid reservations
  if (reservation.status !== 'pending_payment' && reservation.status !== 'draft') {
    const contract = reservation.contracts?.[0];
    const contractPdfUrl = contract?.pdfUrl;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Réservation confirmée</h1>
            <p className="text-gray-600">Réservation #{reservation.id.slice(0, 8)}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Contract Section */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Contrat de location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract?.signedAt && contract?.signedPdfUrl ? (
                // Contract is signed - show download link
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-medium">Contrat signé</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Votre contrat a été signé électroniquement. Vous pouvez le télécharger ci-dessous.
                  </p>
                  <a
                    href={contract.signedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger le contrat signé
                  </a>
                </>
              ) : contract?.yousignSignatureRequestId ? (
                // Contract generated but not signed - show Yousign link
                <>
                  <div className="flex items-center gap-2 text-blue-600">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium">Signature requise</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Le contrat de location est prêt. Veuillez le signer électroniquement via Yousign.
                  </p>
                  <p className="text-sm text-gray-500">
                    Un email avec le lien de signature vous a été envoyé. Vous pouvez également accéder directement à la signature ci-dessous.
                  </p>
                  <Button
                    onClick={() => {
                      // Reload to check if signature link is available
                      window.location.reload();
                    }}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Actualiser le statut
                  </Button>
                </>
              ) : contractPdfUrl ? (
                // Contract PDF exists but Yousign not initiated
                <>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="w-5 h-5" />
                    <p className="font-medium">Contrat en préparation</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Le contrat est en cours de préparation par l'agence. Vous recevrez un email avec le lien de signature électronique très prochainement.
                  </p>
                </>
              ) : (
                // No contract yet
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <p className="font-medium">En attente du contrat</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    L'agence va générer votre contrat de location sous peu. Vous recevrez un email dès qu'il sera prêt à signer.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 Le contrat sera disponible une fois le paiement complet effectué ou lorsque l'agence le générera.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Vehicle Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Véhicule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                  <p className="text-gray-600 font-mono">{reservation.vehicle.plate}</p>
                </div>
                {reservation.vehicle.year && (
                  <div>
                    <p className="text-sm text-gray-500">Année</p>
                    <p className="font-medium">{reservation.vehicle.year}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Vos informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {reservation.customer.firstName} {reservation.customer.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <p className="text-sm">{reservation.customer.email}</p>
                </div>
                {reservation.customer.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <p className="text-sm">{reservation.customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rental Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Période de location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de début</p>
                    <p className="font-semibold text-lg">{formatDate(reservation.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-3">
                    <Calendar className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date de fin</p>
                    <p className="font-semibold text-lg">{formatDate(reservation.endDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Informations de paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">Paiement confirmé</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant total</span>
                  <span className="font-semibold text-lg">{formatCurrency(parseFloat(reservation.totalAmount))}</span>
                </div>
                {reservation.depositAmount && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Acompte payé</span>
                    <span className="font-medium">{formatCurrency(parseFloat(reservation.depositAmount))}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Important Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Informations importantes</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Présentez-vous à l'heure convenue pour récupérer le véhicule</li>
                <li>• N'oubliez pas votre permis de conduire et une pièce d'identité</li>
                <li>• Le contrat de location vous a été envoyé par email</li>
                <li>• En cas de problème, contactez directement l'agence</li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>Besoin d'aide ? Consultez le contrat ou contactez l'agence de location.</p>
          </div>
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
