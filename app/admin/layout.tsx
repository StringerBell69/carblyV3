import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  if (!(session.user as any).isSuperAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span className="text-xl font-bold">Carbly Admin</span>
              </Link>
              <nav className="flex gap-6">
                <Link href="/admin" className="hover:text-gray-300">
                  Dashboard
                </Link>
                <Link href="/admin/organizations" className="hover:text-gray-300">
                  Organizations
                </Link>
                <Link href="/admin/teams" className="hover:text-gray-300">
                  Teams
                </Link>
                <Link href="/admin/users" className="hover:text-gray-300">
                  Users
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">{session.user.email}</span>
              <Link
                href="/dashboard"
                className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
