'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type User = {
  id: string;
  email: string;
  name?: string | null;
  currentTeamId?: string | null;
};

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Véhicules', href: '/vehicles', icon: Car },
  { name: 'Réservations', href: '/reservations', icon: Calendar },
  { name: 'Clients', href: '/customers', icon: Users },
  { name: 'Communications', href: '/communications', icon: MessageSquare },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              C
            </div>
            <span className="text-xl font-bold">Carbly</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-16 animate-fade-in">
          <nav className="flex flex-col p-4 space-y-2">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all animate-slide-in-right stagger-${index + 1} opacity-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg'
                      : 'text-foreground hover:bg-primary/10'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
            <hr className="my-4 border-border" />
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted">
              <Avatar className="border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground font-bold">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
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
