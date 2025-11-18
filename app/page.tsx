import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS } from '@/lib/stripe';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              C
            </div>
            <span className="text-xl font-bold">Carbly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button>Démarrer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Gérez votre flotte de location
          <br />
          en toute simplicité
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          La plateforme SaaS complète pour les agences de location de voitures.
          Réservations, paiements, contrats signés et statistiques en un seul endroit.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Démarrer gratuitement
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Voir la démo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Réservations simplifiées</CardTitle>
              <CardDescription>
                Créez des réservations en quelques clics et envoyez automatiquement
                les liens de paiement à vos clients.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Paiements sécurisés</CardTitle>
              <CardDescription>
                Acceptez les paiements par carte et SEPA avec Stripe. Gestion
                automatique des cautions et des acomptes.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contrats signés</CardTitle>
              <CardDescription>
                Génération automatique de contrats PDF et signature électronique
                via Yousign. Conforme et sécurisé.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Check-in / Check-out</CardTitle>
              <CardDescription>
                Documentez l'état du véhicule avec photos, kilométrage et niveau
                de carburant à chaque location.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dashboard & Analytics</CardTitle>
              <CardDescription>
                Suivez votre CA, taux d'occupation et performances en temps réel
                avec des graphiques détaillés.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Notifications automatiques</CardTitle>
              <CardDescription>
                Emails et SMS automatiques pour confirmations, rappels et
                notifications importantes.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-4">
          Tarifs simples et transparents
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Choisissez le plan adapté à la taille de votre agence
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Object.entries(PLANS).map(([key, plan]) => (
            <Card key={key} className={key === 'pro' ? 'border-primary border-2' : ''}>
              <CardHeader>
                {key === 'pro' && (
                  <div className="bg-primary text-white text-xs px-2 py-1 rounded-full w-fit mb-2">
                    POPULAIRE
                  </div>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block mt-6">
                  <Button
                    className="w-full"
                    variant={key === 'pro' ? 'default' : 'outline'}
                  >
                    Commencer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Prêt à transformer votre agence ?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Rejoignez des centaines d'agences qui font confiance à Carbly
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-8">
            Démarrer gratuitement
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Carbly. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
