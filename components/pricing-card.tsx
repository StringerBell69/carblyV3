'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { PLAN_PRICING, calculatePlatformFees, type PlanType } from '@/lib/pricing-config'

interface PricingCardProps {
  plan: PlanType
  config: typeof PLAN_PRICING.free
  highlighted?: boolean
}

export function PricingCard({ plan, config, highlighted }: PricingCardProps) {
  const fees = calculatePlatformFees(100, plan)

  return (
    <Card className={highlighted ? 'border-blue-500 shadow-lg relative' : ''}>
      {highlighted && (
        <div className="bg-blue-500 text-white text-center py-1 text-sm font-semibold rounded-t-lg absolute -top-0 left-0 right-0">
          Le plus populaire
        </div>
      )}

      <CardHeader className={highlighted ? 'mt-6' : ''}>
        <CardTitle className="capitalize">{plan}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {config.subscription.monthly}€
          </span>
          <span className="text-muted-foreground">/mois</span>
        </div>
        {config.subscription.yearly > 0 && (
          <p className="text-sm text-muted-foreground">
            ou {config.subscription.yearly}€/an (2 mois offerts)
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Frais de transaction */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">Frais par transaction</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Commission :</span>
              <span className="font-medium">{config.platformFees.percentageFee}%</span>
            </div>
            <div className="flex justify-between">
              <span>Frais fixes :</span>
              <span className="font-medium">{config.platformFees.fixedFee}€</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Ex: Location 100€ → Vous recevez {fees.netAmount}€
          </div>
        </div>

        {/* Limites */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Limites</p>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{config.limits.vehicles ?? '∞'} véhicules</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{config.limits.users ?? '∞'} utilisateurs</span>
            </li>
            {config.limits.reservationsPerMonth && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{config.limits.reservationsPerMonth} réservations/mois</span>
              </li>
            )}
            {!config.limits.reservationsPerMonth && plan !== 'free' && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Réservations illimitées</span>
              </li>
            )}
          </ul>
        </div>

        {/* Features clés */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Fonctionnalités</p>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Paiements Stripe</span>
            </li>
            {config.features.deposits && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Acomptes</span>
              </li>
            )}
            {config.features.contracts && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Contrats PDF + Signature électronique</span>
              </li>
            )}
            {config.features.checkinCheckout && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Check-in/Check-out avec photos</span>
              </li>
            )}
            {config.features.cautionOnline && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Caution en ligne (pré-autorisation)</span>
              </li>
            )}
            {config.features.sms && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>SMS</span>
              </li>
            )}
            {config.features.identityVerification && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Vérification d&apos;identité</span>
              </li>
            )}
            {config.features.loyaltyProgram && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Programme de fidélité</span>
              </li>
            )}
            {config.features.advancedAnalytics && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Analytics avancés</span>
              </li>
            )}
            {config.features.multiAgency && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Multi-agences</span>
              </li>
            )}
            {config.features.api && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>API complète</span>
              </li>
            )}
            {config.features.customReports && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Rapports personnalisés</span>
              </li>
            )}
            {config.features.sso && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Single Sign-On (SSO)</span>
              </li>
            )}
            {config.features.whiteLabel && (
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>White Label (sans branding)</span>
              </li>
            )}
          </ul>
        </div>

        {/* Support */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Support :</span>
            <Badge variant="outline" className="capitalize">
              {config.features.support === 'community' && 'Communauté'}
              {config.features.support === 'email' && 'Email'}
              {config.features.support === 'priority' && 'Prioritaire'}
              {config.features.support === 'dedicated' && 'Dédié'}
            </Badge>
          </div>
        </div>

        <Button className="w-full" variant={highlighted ? 'default' : 'outline'}>
          {plan === 'free' ? 'Commencer gratuitement' : 'Essayer 14 jours'}
        </Button>
      </CardContent>
    </Card>
  )
}
