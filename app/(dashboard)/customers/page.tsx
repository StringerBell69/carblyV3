import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { customers, reservations } from '@/drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';

export default async function CustomersPage() {
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
    .groupBy(customers.id)
    .orderBy(sql`COUNT(${reservations.id}) DESC`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-gray-600 mt-1">
          Gérez votre base de clients
        </p>
      </div>

      {customersList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Aucun client</h3>
              <p className="text-gray-600">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Nom</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Téléphone</th>
                    <th className="text-center py-3 px-4 font-medium text-sm">Réservations</th>
                    <th className="text-center py-3 px-4 font-medium text-sm">Vérifié</th>
                    <th className="text-center py-3 px-4 font-medium text-sm">Points</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {customersList.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm">{customer.email}</td>
                      <td className="py-3 px-4 text-sm">{customer.phone || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold">
                          {customer.reservationCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {customer.identityVerified ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {customer.loyaltyPoints}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(customer.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
