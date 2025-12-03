import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { teams, vehicles } from '@/drizzle/schema';
import { eq, count } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { getCurrentTeamId } from '@/lib/session';
import {
  User,
  Users,
  CreditCard,
  Bell,
  Building2,
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const teamId = await getCurrentTeamId();

  if (!teamId) {
    redirect('/login');
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      organization: true,
    },
  });

  if (!team) {
    return <div>Team not found</div>;
  }

  // Count vehicles for this team
  const vehicleCountResult = await db
    .select({ count: count() })
    .from(vehicles)
    .where(eq(vehicles.teamId, teamId));

  const vehicleCount = vehicleCountResult[0]?.count || 0;

  const planLabels = {
    free: 'Gratuit - 0€/mois',
    starter: 'Starter - 49€/mois',
    pro: 'Pro - 99€/mois',
    business: 'Business - 199€/mois',
  };

  const getStatusBadge = () => {
    if (team.subscriptionStatus === 'active') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Actif
        </Badge>
      );
    } else if (team.subscriptionStatus === 'past_due') {
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
          <AlertTriangle className="h-3 w-3" />
          Paiement en retard
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Inactif
        </Badge>
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre compte et votre abonnement
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Équipe
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Facturation
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil utilisateur
              </CardTitle>
              <CardDescription>Informations de votre compte personnel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Nom</span>
                  </div>
                  <p className="text-base font-medium pl-6">
                    {session.user.name || 'Non renseigné'}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email</span>
                  </div>
                  <p className="text-base font-medium pl-6">{session.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organisation et Agence
              </CardTitle>
              <CardDescription>Informations de votre organisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Nom de l'organisation</span>
                  </div>
                  <p className="text-base font-medium pl-6">{team.organization.name}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Nom de l'agence</span>
                  </div>
                  <p className="text-base font-medium pl-6">{team.name}</p>
                </div>
                {team.address && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Adresse</span>
                      </div>
                      <p className="text-base font-medium pl-6">{team.address}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Abonnement
              </CardTitle>
              <CardDescription>Gérez votre plan et votre facturation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Plan actuel</span>
                  </div>
                  <p className="text-lg font-semibold text-primary pl-6">
                    {planLabels[team.plan]}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Véhicules</span>
                  </div>
                  <p className="text-base font-medium pl-6">
                    {vehicleCount} / {team.maxVehicles} utilisés
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Statut</span>
                  </div>
                  <div className="pl-6">{getStatusBadge()}</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Changer de plan</p>
                    <p className="text-sm text-muted-foreground">
                      Passez à un plan supérieur ou inférieur selon vos besoins
                    </p>
                  </div>
                  <Link href="/settings/change-plan">
                    <Button variant="outline">Changer de plan</Button>
                  </Link>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-3">
                  Pour modifier votre plan ou accéder à votre portail de facturation Stripe :
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Annuler votre abonnement</p>
                  <p>• Mettre à jour votre moyen de paiement</p>
                  <p>• Consulter vos factures</p>
                  <p>• Changer de plan</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Note: Le portail Stripe sera disponible après configuration complète.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configurez vos préférences de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Notifications SMS</span>
                </div>
                <div className="pl-6">
                  {team.smsNotificationsEnabled ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Activées
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Désactivées
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {team.plan === 'starter'
                      ? 'Disponible à partir du plan Pro'
                      : 'Les clients recevront des SMS pour les confirmations importantes'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Zone de danger
              </CardTitle>
              <CardDescription>Actions irréversibles</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                La suppression de votre compte entraînera la suppression définitive de toutes vos
                données, véhicules, réservations et clients.
              </p>
              <p className="text-xs text-muted-foreground">
                Contactez le support pour supprimer votre compte.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
