import { db } from '@/lib/db';
import { teams, vehicles } from '@/drizzle/schema';
import { eq, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default async function AdminTeamsPage() {
  const allTeams = await db.query.teams.findMany({
    orderBy: (teams, { desc }) => [desc(teams.createdAt)],
    with: {
      organization: true,
    },
  });

  // Get vehicle count for each team
  const teamsWithVehicleCounts = await Promise.all(
    allTeams.map(async (team) => {
      const vehicleCount = await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.teamId, team.id));

      return {
        ...team,
        vehicleCount: vehicleCount[0]?.count || 0,
      };
    })
  );

  const planLabels: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    business: 'Business',
  };

  const planColors: Record<string, 'default' | 'secondary' | 'success'> = {
    starter: 'secondary',
    pro: 'default',
    business: 'success',
  };

  const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
    active: 'success',
    past_due: 'warning',
    canceled: 'destructive',
    incomplete: 'secondary',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teams (Agences)</h1>
        <p className="text-gray-600 mt-1">
          {allTeams.length} agence(s) totale(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les agences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Agence</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Organisation</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Plan</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Véhicules</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {teamsWithVehicleCounts.map((team) => (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-gray-500">{team.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">{team.organization.name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={planColors[team.plan]}>
                        {planLabels[team.plan]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm">
                        {team.vehicleCount} / {team.maxVehicles}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={statusColors[team.subscriptionStatus || 'incomplete']}>
                        {team.subscriptionStatus || 'incomplete'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(team.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
