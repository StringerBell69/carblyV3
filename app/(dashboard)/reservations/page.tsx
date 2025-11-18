import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getReservations } from './actions';
import { formatCurrency, formatDate } from '@/lib/utils';

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

export default async function ReservationsPage() {
  const result = await getReservations();

  if ('error' in result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{result.error}</p>
      </div>
    );
  }

  const { reservations } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-gray-600 mt-1">
            Gérez toutes vos locations
          </p>
        </div>
        <Link href="/reservations/new">
          <Button>
            <span className="mr-2">➕</span>
            Nouvelle réservation
          </Button>
        </Link>
      </div>

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Aucune réservation</h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre première réservation
              </p>
              <Link href="/reservations/new">
                <Button>Créer une réservation</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Toutes les réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/reservations/${reservation.id}`}
                  className="block p-4 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold truncate">
                          {reservation.vehicle.brand} {reservation.vehicle.model}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                            statusColors[reservation.status]
                          }`}
                        >
                          {statusLabels[reservation.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {reservation.customer.firstName} {reservation.customer.lastName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        📅 {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(parseFloat(reservation.totalAmount))}
                      </p>
                      <p className="text-xs text-gray-500">
                        Créé le {formatDate(reservation.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
