import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { db } from '@/lib/db';
import { customers, reservations } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Award,
  Car,
  Clock,
} from 'lucide-react';

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, params.id),
  });

  if (!customer) {
    notFound();
  }

  const customerReservations = await db.query.reservations.findMany({
    where: eq(reservations.customerId, params.id),
    with: {
      vehicle: true,
    },
    orderBy: (reservations, { desc }) => [desc(reservations.createdAt)],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmée</Badge>;
      case 'active':
        return <Badge className="bg-green-600">En cours</Badge>;
      case 'completed':
        return <Badge variant="outline">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/customers"
          className="text-primary hover:underline mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux clients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Détails du client et historique des réservations
            </p>
          </div>
          <Button asChild>
            <a href={`mailto:${customer.email}`}>
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un email
            </a>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">
                  {customer.firstName} {customer.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>

            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inscrit le</p>
                <p className="font-medium">{formatDate(customer.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut et points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {customer.identityVerified ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vérification</p>
                {customer.identityVerified ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Identité vérifiée
                  </Badge>
                ) : (
                  <Badge variant="outline">Non vérifié</Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points de fidélité</p>
                <p className="font-medium text-2xl">{customer.loyaltyPoints}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Nombre de réservations
                </p>
                <p className="font-medium text-2xl">
                  {customerReservations.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des réservations</CardTitle>
        </CardHeader>
        <CardContent>
          {customerReservations.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                Aucune réservation
              </h3>
              <p className="text-muted-foreground">
                Ce client n'a pas encore de réservations
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Car className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {reservation.vehicle.brand} {reservation.vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.vehicle.plate}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-green-600" />
                          {formatDate(reservation.startDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-red-600" />
                          {formatDate(reservation.endDate)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(parseFloat(reservation.totalAmount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
