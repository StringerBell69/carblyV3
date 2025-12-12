'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type User = {
  id: string;
  email: string;
  name?: string | null;
  currentTeamId?: string | null;
};

const navigation = [
  { name: 'Accueil', shortName: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Véhicules', shortName: 'Véhicules', href: '/vehicles', icon: Car },
  { name: 'Réservations', shortName: 'Réserv.', href: '/reservations', icon: Calendar },
  { name: 'Clients', shortName: 'Clients', href: '/customers', icon: Users },
  { name: 'Paramètres', shortName: 'Param.', href: '/settings', icon: Settings },
];

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Top Header - Simplified */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-center py-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              C
            </div>
            <span className="text-lg font-bold">Carbly</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom,0px)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-primary/10' : ''
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                </div>
                <span className={`text-[10px] mt-0.5 font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {item.shortName}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar - unchanged */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card/50 backdrop-blur-sm px-6 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3 h-16 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
              C
            </div>
            <span className="text-2xl font-bold">Carbly</span>
          </Link>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg'
                          : 'text-foreground hover:bg-primary/10 hover:translate-x-1'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto">
              <div className="border-t border-border pt-4 pb-4">
                <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-muted/50">
                  <Avatar className="border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground font-bold">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all hover:translate-x-1"
                >
                  <LogOut className="h-5 w-5" />
                  Déconnexion
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
