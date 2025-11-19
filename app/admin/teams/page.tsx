import { db } from '@/lib/db';
import { teams, vehicles } from '@/drizzle/schema';
import { eq, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Users, Building2, Car, Calendar, Shield, Eye } from 'lucide-react';

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
    incomplete: 'default',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Teams (Agences)
        </h1>
        <p className="text-muted-foreground mt-1">
          {allTeams.length} agence(s) totale(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les agences</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agence</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead className="text-center">Plan</TableHead>
                <TableHead className="text-center">Véhicules</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead>Créée le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamsWithVehicleCounts.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{team.organization.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={planColors[team.plan]}>
                      <Shield className="h-3 w-3 mr-1" />
                      {planLabels[team.plan]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {team.vehicleCount} / {team.maxVehicles}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusColors[team.subscriptionStatus || 'incomplete']}>
                      {team.subscriptionStatus || 'incomplete'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(team.createdAt)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
