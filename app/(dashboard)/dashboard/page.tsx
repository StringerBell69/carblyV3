import { getDashboardStats, getRecentReservations } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const [stats, recentData] = await Promise.all([
    getDashboardStats(),
    getRecentReservations(),
  ]);

  if ('error' in stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{stats.error}</p>
      </div>
    );
  }

  const reservationStatusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const reservationStatusLabels: Record<string, string> = {
    draft: 'Brouillon',
    pending_payment: 'En attente de paiement',
    paid: 'Payé',
    confirmed: 'Confirmé',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA du mois</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Revenus mensuels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations en cours</CardTitle>
            <span className="text-2xl">📍</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReservations}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.upcomingReservations} à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules disponibles</CardTitle>
            <span className="text-2xl">🚗</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableVehicles}</div>
            <p className="text-xs text-gray-500 mt-1">
              sur {stats.totalVehicles} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/reservations/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-primary">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">➕</div>
                <h3 className="font-semibold">Nouvelle réservation</h3>
                <p className="text-sm text-gray-600">
                  Créer une location pour un client
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/vehicles/new">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">🚙</div>
                <h3 className="font-semibold">Ajouter un véhicule</h3>
                <p className="text-sm text-gray-600">
                  Ajouter un véhicule à votre flotte
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/customers">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">👥</div>
                <h3 className="font-semibold">Voir les clients</h3>
                <p className="text-sm text-gray-600">
                  Gérer votre base clients
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Réservations récentes</CardTitle>
            <Link
              href="/reservations"
              className="text-sm text-primary hover:underline"
            >
              Voir tout
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!recentData || 'error' in recentData || recentData.reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune réservation pour le moment</p>
              <Link href="/reservations/new" className="text-primary hover:underline mt-2 inline-block">
                Créer votre première réservation
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentData.reservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/reservations/${reservation.id}`}
                  className="block p-4 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">
                          {reservation.vehicle.brand} {reservation.vehicle.model}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            reservationStatusColors[reservation.status]
                          }`}
                        >
                          {reservationStatusLabels[reservation.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {reservation.customer.firstName} {reservation.customer.lastName} •{' '}
                        {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(parseFloat(reservation.totalAmount))}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(reservation.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
