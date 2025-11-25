import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS } from '@/lib/stripe';
import { ArrowRight, Zap, Shield, FileText, Camera, BarChart3, Bell } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
              C
            </div>
            <span className="text-2xl font-bold">Carbly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-primary/10">Connexion</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                Démarrer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="inline-block mb-6 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-medium text-primary animate-fade-in-up">
          🚗 Plateforme SaaS pour agences de location
        </div>

        <h1 className="animate-fade-in-up stagger-1 opacity-0 mb-6">
          <span className="gradient-text block">Gérez votre flotte</span>
          <span className="block mt-2">en toute simplicité</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up stagger-2 opacity-0">
          La plateforme complète pour les agences de location de voitures.
          <br className="hidden md:block" />
          Réservations, paiements, contrats signés et statistiques en un seul endroit.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up stagger-3 opacity-0">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-10 py-6 bg-primary hover:bg-primary-dark text-primary-foreground shadow-2xl hover:shadow-primary/50 transition-all group">
              Démarrer gratuitement
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary">
            Voir la démo
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in-up stagger-4 opacity-0">
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">500+</div>
            <div className="text-sm text-muted-foreground">Véhicules gérés</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Agences actives</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">10k+</div>
            <div className="text-sm text-muted-foreground">Réservations</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text mb-2">98%</div>
            <div className="text-sm text-muted-foreground">Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-32 relative">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tout ce dont vous avez <span className="gradient-text">besoin</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une suite complète d'outils pour gérer votre agence de location avec efficacité
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Réservations simplifiées',
              description: 'Créez des réservations en quelques clics et envoyez automatiquement les liens de paiement à vos clients.',
              color: 'from-primary to-primary-light'
            },
            {
              icon: Shield,
              title: 'Paiements sécurisés',
              description: 'Acceptez les paiements par carte et SEPA avec Stripe. Gestion automatique des cautions et des acomptes.',
              color: 'from-accent to-yellow-400'
            },
            {
              icon: FileText,
              title: 'Contrats signés',
              description: 'Génération automatique de contrats PDF et signature électronique via Yousign. Conforme et sécurisé.',
              color: 'from-primary-light to-primary'
            },
            {
              icon: Camera,
              title: 'Check-in / Check-out',
              description: 'Documentez l\'état du véhicule avec photos, kilométrage et niveau de carburant à chaque location.',
              color: 'from-accent to-orange-400'
            },
            {
              icon: BarChart3,
              title: 'Dashboard & Analytics',
              description: 'Suivez votre CA, taux d\'occupation et performances en temps réel avec des graphiques détaillés.',
              color: 'from-primary to-primary-dark'
            },
            {
              icon: Bell,
              title: 'Notifications automatiques',
              description: 'Emails et SMS automatiques pour confirmations, rappels et notifications importantes.',
              color: 'from-primary-light to-accent'
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card-elevated rounded-2xl p-8 bg-card hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl -z-10"></div>

        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tarifs <span className="gradient-text">simples</span> et transparents
          </h2>
          <p className="text-xl text-muted-foreground">
            Choisissez le plan adapté à la taille de votre agence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {Object.entries(PLANS).map(([key, plan], index) => (
            <div
              key={key}
              className={`card-elevated rounded-3xl p-6 bg-card relative overflow-hidden transition-all duration-300 ${
                key === 'pro' ? 'md:-translate-y-4 shadow-2xl' : ''
              }`}
            >
              {key === 'pro' && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary via-primary-light to-accent"></div>
              )}

              {key === 'pro' && (
                <div className="bg-gradient-to-r from-primary to-primary-light text-primary-foreground text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 shadow-lg">
                  ⭐ POPULAIRE
                </div>
              )}

              <h3 className="text-xl font-bold mb-2 capitalize">
                {plan.name}
              </h3>

              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold gradient-text">
                  {plan.price}€
                </span>
                <span className="text-muted-foreground ml-2 text-sm">/mois</span>
              </div>

              <ul className="space-y-3 mb-6 min-h-[200px]">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span className="text-xs leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block">
                <Button
                  className={`w-full py-5 text-sm font-semibold transition-all ${
                    key === 'pro'
                      ? 'bg-gradient-to-r from-primary to-primary-light hover:shadow-xl text-primary-foreground'
                      : 'border-2 border-primary/30 hover:bg-primary/10'
                  }`}
                  variant={key === 'pro' ? 'default' : 'outline'}
                >
                  {key === 'free' ? 'Commencer gratuitement' : 'Commencer'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary opacity-5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Prêt à <span className="gradient-text">transformer</span> votre agence ?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Rejoignez des centaines d'agences qui font confiance à Carbly
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-12 py-7 bg-primary hover:bg-primary-dark text-primary-foreground shadow-2xl hover:shadow-primary/50 transition-all group">
              Démarrer gratuitement
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                C
              </div>
              <span className="text-lg font-bold">Carbly</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Carbly. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
