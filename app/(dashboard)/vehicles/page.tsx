import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Car, Fuel, Settings, Users } from 'lucide-react';
import { getVehicles } from './actions';
import { formatCurrency } from '@/lib/utils';
import { VehicleCardActions } from './vehicle-card-actions';
import { teams } from '@/drizzle/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getCurrentTeamId } from '@/lib/session';


const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  available: { label: 'Disponible', variant: 'success' },
  rented: { label: 'Loué', variant: 'default' },
  maintenance: { label: 'Maintenance', variant: 'warning' },
  out_of_service: { label: 'Hors service', variant: 'destructive' },
};

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  rented: 'Loué',
  maintenance: 'Maintenance',
  out_of_service: 'Hors service',
};

export default async function VehiclesPage() {
  const result = await getVehicles();
  
  const teamId = await getCurrentTeamId();
  if (!teamId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Aucune team trouvée</p>
      </div>
    );
  }
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      organization: true,
    },
  });
  
  

  if ('error' in result || !team) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{result.error || 'Aucune team trouvée'}</p>
      </div>
    );
  }

  const { vehicles } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Véhicules</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre flotte de véhicules
          </p>
        </div>
        {team.maxVehicles > vehicles.length && <Link href="/vehicles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un véhicule
          </Button>
        </Link>}
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <Car className="h-16 w-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun véhicule</h3>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter votre premier véhicule à la flotte
              </p>
              <Link href="/vehicles/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un véhicule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-all hover:scale-[1.02] duration-200 h-full group">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg overflow-hidden relative">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <VehicleCardActions vehicleId={vehicle.id} vehicleName={`${vehicle.brand} ${vehicle.model}`} />
                </div>
              </div>
              <Link href={`/vehicles/${vehicle.id}`}>
                <CardContent className="pt-4 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.year || 'N/A'} • {vehicle.plate}
                      </p>
                    </div>
                    <Badge variant={statusConfig[vehicle.status].variant}>
                      {statusConfig[vehicle.status].label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {vehicle.fuelType && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Fuel className="h-4 w-4" />
                        <span>{vehicle.fuelType === 'diesel' ? 'Diesel' : vehicle.fuelType === 'gasoline' ? 'Essence' : vehicle.fuelType === 'electric' ? 'Électrique' : 'Hybride'}</span>
                      </div>
                    )}
                    {vehicle.transmission && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Settings className="h-4 w-4" />
                        <span>{vehicle.transmission === 'manual' ? 'Manuelle' : 'Automatique'}</span>
                      </div>
                    )}
                    {vehicle.seats && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{vehicle.seats} places</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tarif journalier</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(parseFloat(vehicle.dailyRate))}/j
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
