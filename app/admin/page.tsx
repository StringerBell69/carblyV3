import { db } from '@/lib/db';
import { organizations, teams, users, reservations, vehicles, payments } from '@/drizzle/schema';
import { sql, eq, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  Building2,
  Users,
  Euro,
  TrendingUp,
  Car,
  Calendar,
  CheckCircle2,
  Shield,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // Get global statistics
  const [
    orgsCount,
    teamsCount,
    usersCount,
    vehiclesCount,
    reservationsCount,
    activeSubscriptions,
    totalRevenue,
  ] = await Promise.all([
    db.select({ count: count() }).from(organizations),
    db.select({ count: count() }).from(teams),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(vehicles),
    db.select({ count: count() }).from(reservations),
    db.select({ count: count() }).from(teams).where(eq(teams.subscriptionStatus, 'active')),
    db.select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(eq(payments.status, 'succeeded')),
  ]);

  // Get plan distribution
  const planDistribution = await db
    .select({
      plan: teams.plan,
      count: count(),
    })
    .from(teams)
    .groupBy(teams.plan);

  // Get recent organizations
  const recentOrgs = await db.query.organizations.findMany({
    orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
    limit: 5,
    with: {
      teams: true,
    },
  });

  const planLabels: Record<string, string> = {
    starter: 'Starter (49€)',
    pro: 'Pro (99€)',
    business: 'Business (199€)',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de la plateforme Carbly
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgsCount[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total organisations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Actives</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              sur {teamsCount[0]?.count || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Car className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehiclesCount[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total dans la plateforme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Euro className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(totalRevenue[0]?.total || '0'))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Tous les paiements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usersCount[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Comptes utilisateurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reservationsCount[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total réservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agences (Teams)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamsCount[0]?.count || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total d'agences</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {planDistribution.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <span className="font-medium">{planLabels[item.plan]}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${((item.count / (teamsCount[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organisations Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{org.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Users className="h-3.5 w-3.5" />
                      {org.teams.length} agence(s)
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Créée le {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                {org.stripeCustomerId && (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Stripe
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
