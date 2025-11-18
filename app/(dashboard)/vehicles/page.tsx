import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getVehicles } from './actions';
import { formatCurrency } from '@/lib/utils';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  rented: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  out_of_service: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  rented: 'Loué',
  maintenance: 'Maintenance',
  out_of_service: 'Hors service',
};

export default async function VehiclesPage() {
  const result = await getVehicles();

  if ('error' in result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{result.error}</p>
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
        <Link href="/vehicles/new">
          <Button>
            <span className="mr-2">➕</span>
            Ajouter un véhicule
          </Button>
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold mb-2">Aucun véhicule</h3>
              <p className="text-gray-600 mb-6">
                Commencez par ajouter votre premier véhicule à la flotte
              </p>
              <Link href="/vehicles/new">
                <Button>Ajouter un véhicule</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🚗
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {vehicle.year || 'N/A'} • {vehicle.plate}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        statusColors[vehicle.status]
                      }`}
                    >
                      {statusLabels[vehicle.status]}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    {vehicle.fuelType && (
                      <p className="text-gray-600">
                        ⛽ {vehicle.fuelType === 'diesel' ? 'Diesel' : vehicle.fuelType === 'gasoline' ? 'Essence' : vehicle.fuelType === 'electric' ? 'Électrique' : 'Hybride'}
                      </p>
                    )}
                    {vehicle.transmission && (
                      <p className="text-gray-600">
                        ⚙️ {vehicle.transmission === 'manual' ? 'Manuelle' : 'Automatique'}
                      </p>
                    )}
                    {vehicle.seats && (
                      <p className="text-gray-600">
                        👥 {vehicle.seats} places
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tarif journalier</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(parseFloat(vehicle.dailyRate))}/j
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
