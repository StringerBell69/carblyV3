import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getReservation } from '../actions';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  Car,
  Euro,
  Phone,
  Mail,
  Shield,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { PaymentLinkCard } from './components/payment-link-card';
import { ContractSection } from './components/contract-section';
import { BalancePaymentCard } from './components/balance-payment-card';
import { CancelReservationButton } from './components/cancel-reservation-button';
import { PaymentStatusCard } from './components/payment-status-card';
import { calculatePlatformFees, type PlanType } from '@/lib/pricing-config';
import { isYousignEnabled } from '@/lib/feature-flags';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: any }> = {
  draft: { variant: 'secondary', label: 'Brouillon', icon: FileText },
  pending_payment: { variant: 'outline', label: 'En attente de paiement', icon: AlertCircle },
  paid: { variant: 'default', label: 'Payé', icon: CheckCircle2 },
  confirmed: { variant: 'default', label: 'Confirmé', icon: CheckCircle2 },
  in_progress: { variant: 'default', label: 'En cours', icon: Clock },
  completed: { variant: 'secondary', label: 'Terminé', icon: CheckCircle2 },
  cancelled: { variant: 'destructive', label: 'Annulé', icon: XCircle },
};

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getReservation(id);

  if ('error' in result) {
    notFound();
  }

  const { reservation } = result;

  const magicLink = reservation.magicLinkToken
    ? `${process.env.NEXT_PUBLIC_URL}/reservation/${reservation.magicLinkToken}`
    : null;

  const StatusIcon = statusConfig[reservation.status].icon;

  // Calculate balance payment details
  const totalAmount = parseFloat(reservation.totalAmount);
  const depositAmount = reservation.depositAmount ? parseFloat(reservation.depositAmount) : 0;
  const balanceBeforeFees = totalAmount - depositAmount;
  const teamPlan = (reservation.team?.plan || 'free') as PlanType;
  const balanceFees = calculatePlatformFees(balanceBeforeFees, teamPlan);

  // Check payment statuses
  const depositPayment = reservation.payments?.find(
    (p) => (p.type === 'deposit' || p.type === 'total') && p.status === 'succeeded'
  );
  const balancePayment = reservation.payments?.find(
    (p) => p.type === 'balance' && p.status === 'succeeded'
  );
  const hasDeposit = !!reservation.depositAmount && depositAmount > 0;
  const depositPaid = !!depositPayment;
  const balanceAlreadyPaid = !!balancePayment;
  const shouldShowBalanceCard = hasDeposit && (depositPaid || balanceAlreadyPaid);

  // Calculate total paid amount for cancellation
  const totalPaidOnline = reservation.payments
    ?.filter((p) => p.status === 'succeeded' && p.stripePaymentIntentId)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/reservations"
          className="text-primary hover:underline inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Retour</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge
            variant={statusConfig[reservation.status].variant}
            className="text-xs px-2.5 py-1"
          >
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {statusConfig[reservation.status].label}
          </Badge>
          <CancelReservationButton
            reservationId={reservation.id}
            status={reservation.status}
            hasPayments={reservation.payments && reservation.payments.length > 0}
            totalPaidOnline={totalPaidOnline}
          />
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Vehicle & Customer Row */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Vehicle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Car className="h-3.5 w-3.5" />
                Véhicule
              </div>
              <p className="font-bold text-base sm:text-lg">
                {reservation.vehicle.brand} {reservation.vehicle.model}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {reservation.vehicle.plate}
              </p>
            </div>

            {/* Customer */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <User className="h-3.5 w-3.5" />
                Client
              </div>
              <p className="font-bold text-base sm:text-lg">
                {reservation.customer?.firstName} {reservation.customer?.lastName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {reservation.customer?.email}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5" />
                Début
              </div>
              <p className="font-semibold text-sm sm:text-base">
                {formatDate(reservation.startDate)}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(reservation.startDate)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5" />
                Fin
              </div>
              <p className="font-semibold text-sm sm:text-base">
                {formatDate(reservation.endDate)}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(reservation.endDate)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Payment Summary */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            {hasDeposit && (
              <div className="text-right space-y-0.5">
                <p className="text-xs sm:text-sm text-muted-foreground">Acompte</p>
                <p className="font-semibold text-sm sm:text-base">
                  {formatCurrency(depositAmount)}
                  {depositPaid && (
                    <CheckCircle2 className="inline ml-1.5 h-4 w-4 text-green-500" />
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Customer Contact */}
          {reservation.customer?.phone && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-4 text-sm">
                <a 
                  href={`mailto:${reservation.customer?.email}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </a>
                <a 
                  href={`tel:${reservation.customer?.phone}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {reservation.customer?.phone}
                </a>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Cards - Show only relevant ones */}
      {magicLink && reservation.status === "pending_payment" && (
        <>
          <PaymentLinkCard
            magicLink={magicLink}
            reservationId={reservation.id}
            customerEmail={reservation.customer?.email}
            customerName={`${reservation.customer?.firstName} ${reservation.customer?.lastName}`}
            hasCustomer={!!reservation.customer}
          />
          <PaymentStatusCard reservationId={reservation.id} />
        </>
      )}

      <ContractSection
        reservationId={reservation.id}
        contract={reservation.contracts?.[0]}
        status={reservation.status}
        yousignEnabled={isYousignEnabled()}
      />

      {shouldShowBalanceCard && (
        <BalancePaymentCard
          reservationId={reservation.id}
          totalAmount={totalAmount}
          depositAmount={depositAmount}
          platformFees={balanceFees.totalFee}
          customerEmail={reservation.customer?.email}
          customerName={`${reservation.customer?.firstName} ${reservation.customer?.lastName}`}
          balanceAlreadyPaid={balanceAlreadyPaid}
          depositPaid={depositPaid}
        />
      )}

      {/* Internal Notes */}
      {reservation.internalNotes && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes internes</p>
                <p className="text-sm whitespace-pre-wrap">{reservation.internalNotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments History - Collapsible style */}
      {reservation.payments && reservation.payments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    Historique des paiements ({reservation.payments.length})
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3 space-y-2">
                {reservation.payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {payment.status === 'succeeded' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : payment.status === 'refunded' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="capitalize">
                        {payment.type === 'deposit' ? 'Acompte' : 
                         payment.type === 'balance' ? 'Solde' : 
                         payment.type === 'total' ? 'Total' : payment.type}
                      </span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(payment.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Timeline - Simplified */}
      <Card>
        <CardContent className="p-4">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Historique</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <div className="mt-3 space-y-3 pl-6 border-l-2 border-border">
              {/* Created */}
              <div className="relative">
                <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <p className="text-sm font-medium">Réservation créée</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(reservation.createdAt)}
                </p>
              </div>

              {/* Payment Status */}
              {depositPaid && (
                <div className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <p className="text-sm font-medium">Paiement reçu</p>
                  <p className="text-xs text-muted-foreground">Acompte confirmé</p>
                </div>
              )}

              {/* Contract Signed */}
              {reservation.contracts?.[0]?.signedAt && (
                <div className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Contrat signé</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(reservation.contracts[0].signedAt)}
                  </p>
                </div>
              )}

              {/* Current Status */}
              {reservation.status !== 'draft' && (
                <div className="relative">
                  <div className={`absolute -left-[25px] w-4 h-4 rounded-full flex items-center justify-center ${
                    reservation.status === 'cancelled' ? 'bg-red-100' :
                    reservation.status === 'completed' ? 'bg-green-100' :
                    reservation.status === 'in_progress' ? 'bg-blue-100' :
                    'bg-yellow-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      reservation.status === 'cancelled' ? 'bg-red-500' :
                      reservation.status === 'completed' ? 'bg-green-500' :
                      reservation.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`} />
                  </div>
                  <p className="text-sm font-medium">
                    {statusConfig[reservation.status].label}
                  </p>
                </div>
              )}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
