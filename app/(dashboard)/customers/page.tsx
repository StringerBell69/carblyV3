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
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            Clients
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Gérez votre base de clients
          </p>
        </div>
        <Button className="w-full sm:w-auto h-11">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {customersList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 sm:py-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun client</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
                Les clients seront ajoutés automatiquement lors de la création de réservations
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">
              Tous les clients ({customersList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
            <CustomersTable customers={customersList} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
