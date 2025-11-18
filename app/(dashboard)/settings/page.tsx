import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { teams } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.currentTeamId) {
    redirect('/login');
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, session.user.currentTeamId),
    with: {
      organization: true,
    },
  });

  if (!team) {
    return <div>Team not found</div>;
  }

  const planLabels = {
    starter: 'Starter - 49€/mois',
    pro: 'Pro - 99€/mois',
    business: 'Business - 199€/mois',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Gérez votre compte et votre abonnement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Nom</p>
            <p className="font-medium">{session.user.name || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
          <CardDescription>Informations de votre organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Nom de l'organisation</p>
            <p className="font-medium">{team.organization.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nom de l'agence</p>
            <p className="font-medium">{team.name}</p>
          </div>
          {team.address && (
            <div>
              <p className="text-sm text-gray-600">Adresse</p>
              <p className="font-medium">{team.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>Gérez votre plan d'abonnement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Plan actuel</p>
            <p className="font-semibold text-lg text-primary">
              {planLabels[team.plan]}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Véhicules</p>
            <p className="font-medium">0 / {team.maxVehicles} utilisés</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Statut</p>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                team.subscriptionStatus === 'active'
                  ? 'bg-green-100 text-green-800'
                  : team.subscriptionStatus === 'past_due'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {team.subscriptionStatus === 'active'
                ? 'Actif'
                : team.subscriptionStatus === 'past_due'
                ? 'Paiement en retard'
                : 'Inactif'}
            </span>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Pour modifier votre plan ou accéder à votre portail de facturation Stripe :
            </p>
            <div className="space-y-2">
              <p className="text-sm">• Annuler votre abonnement</p>
              <p className="text-sm">• Mettre à jour votre moyen de paiement</p>
              <p className="text-sm">• Consulter vos factures</p>
              <p className="text-sm">• Changer de plan</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: Le portail Stripe sera disponible après configuration complète.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configurez vos préférences de notification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Notifications SMS</p>
            <p className="font-medium">
              {team.smsNotificationsEnabled ? '✓ Activées' : '✗ Désactivées'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {team.plan === 'starter'
                ? 'Disponible à partir du plan Pro'
                : 'Les clients recevront des SMS pour les confirmations importantes'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            La suppression de votre compte entraînera la suppression définitive de toutes vos
            données, véhicules, réservations et clients.
          </p>
          <p className="text-xs text-gray-500">
            Contactez le support pour supprimer votre compte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
