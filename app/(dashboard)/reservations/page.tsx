import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getReservations } from './actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plus,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  XCircle,
  User,
  Car,
  DollarSign,
  CalendarDays,
} from 'lucide-react';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
  draft: { variant: 'secondary', label: 'Brouillon' },
  pending_payment: { variant: 'outline', label: 'En attente de paiement' },
  paid: { variant: 'default', label: 'Payé' },
  confirmed: { variant: 'default', label: 'Confirmé' },
  in_progress: { variant: 'default', label: 'En cours' },
  completed: { variant: 'secondary', label: 'Terminé' },
  cancelled: { variant: 'destructive', label: 'Annulé' },
};

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réservations</h1>
          <p className="text-gray-600 mt-1">
            Gérez toutes vos locations
          </p>
        </div>
        <Link href="/reservations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Button>
        </Link>
      </div>

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <Calendar className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucune réservation</h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre première réservation
              </p>
              <Link href="/reservations/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une réservation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Toutes les réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Véhicule
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Client
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Période
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Montant
                      </div>
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-primary/10 p-2">
                            <Car className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {reservation.vehicle.brand} {reservation.vehicle.model}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reservation.vehicle.plate}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-muted p-2">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            {reservation.customer.firstName} {reservation.customer.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(parseFloat(reservation.totalAmount))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Créé le {formatDate(reservation.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[reservation.status].variant}>
                          {statusConfig[reservation.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Ouvrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/reservations/${reservation.id}`} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/reservations/${reservation.id}/edit`} className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Annuler
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
