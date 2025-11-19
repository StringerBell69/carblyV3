import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/utils';

interface RecentReservationsProps {
  reservations: Array<{
    id: string;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
    };
    totalAmount: string;
  }>;
}

export function RecentReservations({ reservations }: RecentReservationsProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No sales yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {reservations.slice(0, 5).map((reservation) => {
        const initials = `${reservation.customer.firstName[0]}${reservation.customer.lastName[0]}`;
        return (
          <div key={reservation.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">
                {reservation.customer.firstName} {reservation.customer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {reservation.customer.email}
              </p>
            </div>
            <div className="ml-auto font-medium">
              {formatCurrency(parseFloat(reservation.totalAmount))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
