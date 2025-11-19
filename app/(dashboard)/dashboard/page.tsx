import { getDashboardStats, getRecentReservations, getMonthlyRevenue } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  MapPin,
  TrendingUp,
  Car,
  Plus,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { RevenueChart } from './revenue-chart';

export default async function DashboardPage() {
  const [stats, recentData, revenueData] = await Promise.all([
    getDashboardStats(),
    getRecentReservations(),
    getMonthlyRevenue(),
  ]);

  if ('error' in stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{stats.error}</p>
      </div>
    );
  }

  const reservationStatusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'> = {
    draft: 'outline',
    pending_payment: 'warning',
    paid: 'secondary',
    confirmed: 'success',
    in_progress: 'secondary',
    completed: 'secondary',
    cancelled: 'destructive',
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

  // Calculate revenue trend (mock for now - could be calculated from real data)
  const revenueTrend = 12.5; // +12.5%
  const occupancyTrend = -2.3; // -2.3%

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <Link href="/reservations/new">
          <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-primary">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Nouvelle réservation</p>
                <p className="text-xs text-muted-foreground">Créer rapidement</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {revenueTrend >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+{revenueTrend}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">{revenueTrend}%</span>
                </>
              )}
              <span>vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations actives</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReservations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upcomingReservations} réservation{stats.upcomingReservations > 1 ? 's' : ''} à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {occupancyTrend >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+{occupancyTrend}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">{occupancyTrend}%</span>
                </>
              )}
              <span>vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flotte</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Car className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableVehicles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              sur {stats.totalVehicles} véhicule{stats.totalVehicles > 1 ? 's' : ''} au total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Aperçu des revenus</CardTitle>
            <CardDescription>
              Revenus mensuels des 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {revenueData && 'data' in revenueData ? (
              <RevenueChart data={revenueData.data} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Réservations récentes</CardTitle>
                <CardDescription className="mt-1">
                  Les 5 dernières réservations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!recentData || 'error' in recentData || recentData.reservations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Aucune réservation</p>
                <Link href="/reservations/new" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Créer la première
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentData.reservations.map((reservation) => {
                  const initials = `${reservation.customer.firstName[0]}${reservation.customer.lastName[0]}`;
                  return (
                    <Link
                      key={reservation.id}
                      href={`/reservations/${reservation.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none truncate">
                            {reservation.customer.firstName} {reservation.customer.lastName}
                          </p>
                          <Badge variant={reservationStatusVariants[reservation.status]} className="text-xs">
                            {reservationStatusLabels[reservation.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Car className="h-3 w-3" />
                          <span className="truncate">
                            {reservation.vehicle.brand} {reservation.vehicle.model}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(parseFloat(reservation.totalAmount))}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/vehicles">
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Gérer les véhicules</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.totalVehicles} véhicule{stats.totalVehicles > 1 ? 's' : ''} dans la flotte
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/customers">
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Base clients</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gérer vos clients
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reservations">
          <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Toutes les réservations</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.activeReservations} active{stats.activeReservations > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
