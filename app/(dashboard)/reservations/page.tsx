import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getReservations } from './actions';
import { Plus } from 'lucide-react';
import { ReservationsList } from './components/reservations-list';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Réservations</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Gérez toutes vos locations
          </p>
        </div>
        <Link href="/reservations/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-11">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Button>
        </Link>
      </div>

      <ReservationsList reservations={reservations} />
    </div>
  );
}
