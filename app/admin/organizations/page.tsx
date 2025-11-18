import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default async function AdminOrganizationsPage() {
  const allOrganizations = await db.query.organizations.findMany({
    orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
    with: {
      teams: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-gray-600 mt-1">
          {allOrganizations.length} organisation(s) totale(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les organisations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Nom</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Agences</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Stripe</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {allOrganizations.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-gray-500">{org.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-semibold">
                        {org.teams.length}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {org.stripeCustomerId ? (
                        <span className="text-green-600 text-sm">✓</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(org.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
