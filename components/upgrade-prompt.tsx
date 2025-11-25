'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PLAN_PRICING, type PlanType } from '@/lib/pricing-config'

interface UpgradePromptProps {
  currentPlan: PlanType
  suggestedPlan: PlanType
  feature: string
  message: string
}

export function UpgradePrompt({
  currentPlan,
  suggestedPlan,
  feature,
  message,
}: UpgradePromptProps) {
  const router = useRouter()
  const suggestedConfig = PLAN_PRICING[suggestedPlan]

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertTitle className="flex items-center gap-2">
        Passez au plan {suggestedPlan.toUpperCase()}
        <Badge variant="default">{suggestedConfig.subscription.monthly}€/mois</Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">{message}</p>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/settings/billing')}
            size="sm"
          >
            Upgrader maintenant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/pricing')}
          >
            Voir tous les plans
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
