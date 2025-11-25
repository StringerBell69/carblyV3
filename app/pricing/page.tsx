import { PricingCard } from '@/components/pricing-card'
import { PLAN_PRICING } from '@/lib/pricing-config'

export default function PricingPage() {
  return (
    <div className="container py-12 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Commencez gratuitement, upgradez quand vous êtes prêt. Tous les plans incluent les fonctionnalités essentielles pour gérer vos locations.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
        {Object.entries(PLAN_PRICING).map(([key, config]) => (
          <PricingCard
            key={key}
            plan={key as any}
            config={config}
            highlighted={key === 'pro'}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Questions fréquentes
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Comment fonctionnent les frais de transaction ?</h3>
            <p className="text-muted-foreground text-sm">
              Les frais de transaction sont prélevés automatiquement sur chaque paiement reçu via Stripe. Plus votre plan est élevé, plus les frais sont réduits.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Puis-je changer de plan à tout moment ?</h3>
            <p className="text-muted-foreground text-sm">
              Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet immédiatement et sont proratisés.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Que se passe-t-il si je dépasse les limites de mon plan ?</h3>
            <p className="text-muted-foreground text-sm">
              Vous serez invité à upgrader votre plan dès que vous atteignez une limite. Aucun dépassement n&apos;est autorisé pour garantir une expérience optimale.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Puis-je essayer gratuitement avant de m&apos;engager ?</h3>
            <p className="text-muted-foreground text-sm">
              Oui ! Le plan FREE vous permet de tester la plateforme avec jusqu&apos;à 3 véhicules et 5 réservations par mois. Tous les plans payants incluent 14 jours d&apos;essai gratuit.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
