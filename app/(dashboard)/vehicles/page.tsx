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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Véhicules</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Gérez votre flotte de véhicules
          </p>
        </div>
        {team.maxVehicles > vehicles.length && (
          <Link href="/vehicles/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un véhicule
            </Button>
          </Link>
        )}
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 sm:py-12">
              <div className="mb-4 flex justify-center">
                <Car className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun véhicule</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 px-4">
                Commencez par ajouter votre premier véhicule à la flotte
              </p>
              <Link href="/vehicles/new">
                <Button className="h-11">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un véhicule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-all hover:scale-[1.01] sm:hover:scale-[1.02] duration-200 h-full group overflow-hidden">
              <div className="aspect-[16/10] sm:aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <VehicleCardActions vehicleId={vehicle.id} vehicleName={`${vehicle.brand} ${vehicle.model}`} />
                </div>
                {/* Mobile: Show status badge on image */}
                <div className="absolute bottom-2 left-2 sm:hidden">
                  <Badge variant={statusConfig[vehicle.status].variant}>
                    {statusConfig[vehicle.status].label}
                  </Badge>
                </div>
              </div>
              <Link href={`/vehicles/${vehicle.id}`}>
                <CardContent className="p-3 sm:pt-4 sm:p-4 cursor-pointer">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors truncate">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {vehicle.year || 'N/A'} • {vehicle.plate}
                      </p>
                    </div>
                    {/* Desktop: Show badge here */}
                    <Badge variant={statusConfig[vehicle.status].variant} className="hidden sm:flex ml-2 shrink-0">
                      {statusConfig[vehicle.status].label}
                    </Badge>
                  </div>

                  {/* Vehicle details - Hidden on mobile for compact view */}
                  <div className="hidden sm:block space-y-2 text-sm">
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

                  {/* Price - Always visible and prominent */}
                  <div className="mt-3 pt-3 border-t sm:mt-4 sm:pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Tarif journalier</span>
                      <span className="text-base sm:text-lg font-bold text-primary">
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
