import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getReservation } from '../actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending_payment: 'En attente de paiement',
  paid: 'Payé',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getReservation(params.id);

  if ('error' in result) {
    notFound();
  }

  const { reservation } = result;

  const magicLink = reservation.magicLinkToken
    ? `${process.env.NEXT_PUBLIC_URL}/reservation/${reservation.magicLinkToken}`
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/reservations" className="text-primary hover:underline mb-4 inline-block">
          ← Retour aux réservations
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Détails de la réservation</h1>
            <p className="text-gray-600 mt-1">Réservation #{reservation.id.slice(0, 8)}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[reservation.status]
            }`}
          >
            {statusLabels[reservation.status]}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-2xl font-bold">
                {reservation.vehicle.brand} {reservation.vehicle.model}
              </p>
              <p className="text-gray-600">{reservation.vehicle.plate}</p>
            </div>
            {reservation.vehicle.year && (
              <p className="text-sm text-gray-600">Année: {reservation.vehicle.year}</p>
            )}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">Tarif journalier</p>
              <p className="font-semibold">
                {formatCurrency(parseFloat(reservation.vehicle.dailyRate))}/jour
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xl font-semibold">
                {reservation.customer.firstName} {reservation.customer.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{reservation.customer.email}</p>
            </div>
            {reservation.customer.phone && (
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium">{reservation.customer.phone}</p>
              </div>
            )}
            {reservation.customer.identityVerified && (
              <div className="pt-2 border-t">
                <p className="text-sm text-green-600">✓ Identité vérifiée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dates et durée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date de début</p>
              <p className="font-semibold text-lg">{formatDate(reservation.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de fin</p>
              <p className="font-semibold text-lg">{formatDate(reservation.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Montant total</span>
              <span className="font-medium">
                {formatCurrency(parseFloat(reservation.totalAmount))}
              </span>
            </div>
            {reservation.depositAmount && (
              <div className="flex justify-between">
                <span className="text-sm">Acompte</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(reservation.depositAmount))}
                </span>
              </div>
            )}
            {reservation.includeInsurance && reservation.insuranceAmount && (
              <div className="flex justify-between">
                <span className="text-sm">Assurance</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(reservation.insuranceAmount))}
                </span>
              </div>
            )}
            {reservation.cautionAmount && (
              <div className="flex justify-between">
                <span className="text-sm">Caution</span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(reservation.cautionAmount))}
                </span>
              </div>
            )}
          </div>

          {reservation.payments && reservation.payments.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Paiements</p>
              {reservation.payments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between text-sm">
                  <span>{payment.type} - {payment.status}</span>
                  <span>{formatCurrency(parseFloat(payment.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {magicLink && reservation.status === 'pending_payment' && (
        <Card>
          <CardHeader>
            <CardTitle>Lien de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Partagez ce lien avec le client pour qu'il puisse payer sa réservation
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={magicLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-gray-50"
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(magicLink);
                    alert('Lien copié !');
                  }}
                >
                  Copier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reservation.internalNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes internes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{reservation.internalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
