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
  Download,
  FileText,
  Mail,
  Phone,
  Clock,
  Shield,
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
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

  const teamPlan = (reservation?.team?.plan || 'free') as PlanType;
  const paymentAmount = parseFloat(reservation?.depositAmount || reservation?.totalAmount || '0');
  const platformFees = calculatePlatformFees(paymentAmount, teamPlan);

  // ===== CONFIRMED RESERVATION VIEW =====
  if (reservation.status !== 'pending_payment' && reservation.status !== 'draft') {
    const contract = reservation.contracts?.[0];

    return (
      <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Success Header */}
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h1 className="text-xl font-bold text-gray-900">Réservation confirmée</h1>
            <p className="text-xs text-gray-500">#{reservation.id.slice(0, 8)}</p>
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
                  <p className="text-xs text-muted-foreground">{formatTime(reservation.startDate)}</p>
                </div>
                <div>
                  <div className="text-xs text-red-600 font-medium mb-0.5">Fin</div>
                  <p className="font-semibold text-sm">{formatDate(reservation.endDate)}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(reservation.endDate)}</p>
                </div>
              </div>

              <Separator />

              {/* Payment */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Paiement confirmé</span>
                </div>
                <span className="font-bold text-lg">
                  {formatCurrency(parseFloat(reservation.totalAmount))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contract Section */}
          <Card className={contract?.signedAt ? 'border-green-200 bg-green-50/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className={`h-5 w-5 shrink-0 ${contract?.signedAt ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Contrat de location</p>
                  {contract?.signedAt && contract?.signedPdfUrl ? (
                    <>
                      <p className="text-xs text-green-600 mb-2">Signé électroniquement</p>
                      <a
                        href={contract.signedPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </a>
                    </>
                  ) : contract?.yousignSignatureRequestId ? (
                    <p className="text-xs text-blue-600">En attente de signature - vérifiez vos emails</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">En cours de préparation</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          {(reservation.customer.email || reservation.customer.phone) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 text-sm">
                  {reservation.customer.email && (
                    <a href={`mailto:${reservation.customer.email}`} className="flex items-center gap-1.5 text-primary">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">Email</span>
                    </a>
                  )}
                  {reservation.customer.phone && (
                    <a href={`tel:${reservation.customer.phone}`} className="flex items-center gap-1.5 text-primary">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs truncate">{reservation.customer.phone}</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">📋 À savoir</p>
            <ul className="space-y-0.5">
              <li>• Présentez-vous avec permis et pièce d'identité</li>
              <li>• Contactez l'agence en cas de besoin</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== PAYMENT PENDING VIEW =====
  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Confirmer la réservation</h1>
          <p className="text-sm text-gray-600">Finalisez le paiement</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Reservation Details */}
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
                <p className="text-xs text-muted-foreground">{formatTime(reservation.startDate)}</p>
              </div>
              <div>
                <div className="text-xs text-red-600 font-medium mb-0.5">Fin</div>
                <p className="font-semibold text-sm">{formatDate(reservation.endDate)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(reservation.endDate)}</p>
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant location</span>
                <span>{formatCurrency(parseFloat(reservation.totalAmount))}</span>
              </div>

              {reservation.depositAmount && (
                <div className="flex justify-between text-sm font-medium">
                  <span>Acompte à payer</span>
                  <span>{formatCurrency(parseFloat(reservation.depositAmount))}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Frais Carbly</span>
                <span>{formatCurrency(platformFees.totalFee)}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold">Total à payer</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(paymentAmount + platformFees.totalFee)}
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
              Payer {formatCurrency(paymentAmount + platformFees.totalFee)}
            </>
          )}
        </Button>

        <p className="text-center text-[10px] text-gray-400">
          En payant, vous acceptez les CGV
        </p>
      </div>
    </div>
  );
}
