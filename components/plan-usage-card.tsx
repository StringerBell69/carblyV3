'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { usePlanLimits } from '@/hooks/use-plan-limits'
import { Car, Users, Calendar } from 'lucide-react'

export function PlanUsageCard({ teamId }: { teamId: string }) {
  const { data: usage, isLoading } = usePlanLimits(teamId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Utilisation du plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Utilisation du plan</span>
          <Badge variant="outline">{usage.plan.toUpperCase()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Véhicules */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Véhicules
            </span>
            <span className="font-medium">
              {usage.usage.vehicles.current}
              {usage.usage.vehicles.limit !== null && ` / ${usage.usage.vehicles.limit}`}
              {usage.usage.vehicles.limit === null && ' / ∞'}
            </span>
          </div>
          {usage.usage.vehicles.limit !== null && (
            <Progress value={usage.usage.vehicles.percentage} />
          )}
        </div>

        {/* Utilisateurs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </span>
            <span className="font-medium">
              {usage.usage.users.current}
              {usage.usage.users.limit !== null && ` / ${usage.usage.users.limit}`}
              {usage.usage.users.limit === null && ' / ∞'}
            </span>
          </div>
          {usage.usage.users.limit !== null && (
            <Progress value={usage.usage.users.percentage} />
          )}
        </div>

        {/* Réservations */}
        {usage.usage.reservations.limit !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Réservations ce mois
              </span>
              <span className="font-medium">
                {usage.usage.reservations.current} / {usage.usage.reservations.limit}
              </span>
            </div>
            <Progress value={usage.usage.reservations.percentage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
