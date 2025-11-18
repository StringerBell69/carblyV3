import { db } from '@/lib/db';
import { organizations, teams, users, reservations, vehicles, payments } from '@/drizzle/schema';
import { sql, eq, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de la plateforme Carbly
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgsCount[0]?.count || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total organisations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams Actives</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions[0]?.count || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              sur {teamsCount[0]?.count || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Véhicules</CardTitle>
            <span className="text-2xl">🚗</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehiclesCount[0]?.count || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total dans la plateforme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(parseFloat(totalRevenue[0]?.total || '0'))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tous les paiements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usersCount[0]?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reservationsCount[0]?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Agences (Teams)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamsCount[0]?.count || 0}</div>
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
          <CardTitle>Organisations Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-sm text-gray-600">
                    {org.teams.length} agence(s)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Créée le {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {org.stripeCustomerId && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Stripe ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
