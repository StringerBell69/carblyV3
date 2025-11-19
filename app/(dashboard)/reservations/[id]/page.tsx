import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getReservation } from '../actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  Car,
  DollarSign,
  Phone,
  Mail,
  Shield,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Copy,
} from 'lucide-react';

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/reservations" className="text-primary hover:underline mb-4 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux réservations
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Détails de la réservation</h1>
            <p className="text-gray-600 mt-1">Réservation #{reservation.id.slice(0, 8)}</p>
          </div>
          <Badge variant={statusConfig[reservation.status].variant} className="text-base px-4 py-2">
            <StatusIcon className="mr-2 h-4 w-4" />
            {statusConfig[reservation.status].label}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  Véhicule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    {reservation.vehicle.brand} {reservation.vehicle.model}
                  </p>
                  <p className="text-muted-foreground">{reservation.vehicle.plate}</p>
                </div>
                {reservation.vehicle.year && (
                  <div>
                    <p className="text-sm text-muted-foreground">Année</p>
                    <p className="font-medium">{reservation.vehicle.year}</p>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Tarif journalier</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatCurrency(parseFloat(reservation.vehicle.dailyRate))}/jour
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="rounded-md bg-primary/10 p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xl font-semibold">
                    {reservation.customer.firstName} {reservation.customer.lastName}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{reservation.customer.email}</p>
                    </div>
                  </div>
                  {reservation.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{reservation.customer.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                {reservation.customer.identityVerified && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-green-600">
                      <Shield className="h-4 w-4" />
                      <p className="text-sm font-medium">Identité vérifiée</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Dates et durée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-green-100 p-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de début</p>
                    <p className="font-semibold text-lg">{formatDate(reservation.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-red-100 p-3">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de fin</p>
                    <p className="font-semibold text-lg">{formatDate(reservation.endDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {reservation.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes internes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{reservation.internalNotes}</p>
              </CardContent>
            </Card>
          )}

          {magicLink && reservation.status === 'pending_payment' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <AlertCircle className="h-5 w-5" />
                  Lien de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-yellow-800">
                    Partagez ce lien avec le client pour qu'il puisse payer sa réservation
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={magicLink}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md text-sm bg-white"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(magicLink);
                        alert('Lien copié !');
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique de la réservation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px h-full bg-border mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold">Réservation créée</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(reservation.createdAt)}
                    </p>
                  </div>
                </div>

                {reservation.status === 'pending_payment' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-yellow-100 p-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="w-px h-full bg-border mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold">En attente de paiement</p>
                      <p className="text-sm text-muted-foreground">
                        Le client doit confirmer le paiement
                      </p>
                    </div>
                  </div>
                )}

                {(reservation.status === 'paid' || reservation.status === 'confirmed' || reservation.status === 'in_progress' || reservation.status === 'completed') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="w-px h-full bg-border mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold">Paiement confirmé</p>
                      <p className="text-sm text-muted-foreground">
                        Le paiement a été reçu
                      </p>
                    </div>
                  </div>
                )}

                {(reservation.status === 'in_progress' || reservation.status === 'completed') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-blue-100 p-2">
                        <Car className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="w-px h-full bg-border mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold">Location en cours</p>
                      <p className="text-sm text-muted-foreground">
                        Le véhicule a été remis au client
                      </p>
                    </div>
                  </div>
                )}

                {reservation.status === 'completed' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Location terminée</p>
                      <p className="text-sm text-muted-foreground">
                        Le véhicule a été restitué
                      </p>
                    </div>
                  </div>
                )}

                {reservation.status === 'cancelled' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-red-100 p-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Réservation annulée</p>
                      <p className="text-sm text-muted-foreground">
                        Cette réservation a été annulée
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                Informations de paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Montant total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(parseFloat(reservation.totalAmount))}
                  </span>
                </div>

                {reservation.depositAmount && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Acompte</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(reservation.depositAmount))}
                    </span>
                  </div>
                )}

                {reservation.includeInsurance && reservation.insuranceAmount && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Assurance</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(reservation.insuranceAmount))}
                    </span>
                  </div>
                )}

                {reservation.cautionAmount && (
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Caution</span>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(parseFloat(reservation.cautionAmount))}
                    </span>
                  </div>
                )}
              </div>

              {reservation.payments && reservation.payments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Historique des paiements
                    </h4>
                    <div className="space-y-2">
                      {reservation.payments.map((payment: any) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{payment.type}</p>
                            <p className="text-sm text-muted-foreground">{payment.status}</p>
                          </div>
                          <span className="font-semibold">{formatCurrency(parseFloat(payment.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
