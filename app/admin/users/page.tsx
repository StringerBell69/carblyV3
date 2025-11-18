import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default async function AdminUsersPage() {
  const allUsers = await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    with: {
      teamMemberships: {
        with: {
          team: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Utilisateurs</h1>
        <p className="text-gray-600 mt-1">
          {allUsers.length} utilisateur(s) total(aux)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Nom</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">Agences</th>
                  <th className="text-center py-3 px-4 font-medium text-sm">SuperAdmin</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{user.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{user.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col gap-1">
                        {user.teamMemberships.length > 0 ? (
                          user.teamMemberships.map((membership) => (
                            <span
                              key={membership.id}
                              className="text-xs bg-gray-100 px-2 py-1 rounded"
                            >
                              {membership.team.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {user.isSuperAdmin ? (
                        <Badge variant="destructive">Admin</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
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
