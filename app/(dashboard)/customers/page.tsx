import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { customers, reservations } from '@/drizzle/schema';
import { sql, eq, and } from 'drizzle-orm';
import { Users, Plus } from 'lucide-react';
import { CustomersTable } from './components/customers-table';
import { getCurrentOrganizationId } from '@/lib/session';

export default async function CustomersPage() {
  const organizationId = await getCurrentOrganizationId();

  if (!organizationId) {
    return <div>Unauthorized</div>;
  }

  const customersList = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      phone: customers.phone,
      identityVerified: customers.identityVerified,
      loyaltyPoints: customers.loyaltyPoints,
      createdAt: customers.createdAt,
      reservationCount: sql<number>`COUNT(${reservations.id})`,
    })
    .from(customers)
    .leftJoin(reservations, eq(customers.id, reservations.customerId))
    .where(eq(customers.organizationId, organizationId))
    .groupBy(customers.id)
    .orderBy(sql`COUNT(${reservations.id}) DESC`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Clients
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre base de clients
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {customersList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucun client</h3>
              <p className="text-muted-foreground">
                Les clients seront ajoutés automatiquement lors de la création de réservations
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tous les clients ({customersList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomersTable customers={customersList} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
