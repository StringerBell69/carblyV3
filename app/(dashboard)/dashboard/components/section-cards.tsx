import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface SectionCardsProps {
  stats: {
    revenue: number
    activeReservations: number
    upcomingReservations: number
    occupancyRate: number
    totalVehicles: number
    availableVehicles: number
  }
  trends: {
    revenueTrend: number
    reservationsTrend: number
    vehiclesTrend: number
    occupancyTrend: number
  }
}

export function SectionCards({ stats, trends }: SectionCardsProps) {
  const { revenueTrend, reservationsTrend, vehiclesTrend, occupancyTrend } = trends

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Chiffre d'affaires du mois</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.revenue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revenueTrend >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {revenueTrend >= 0 ? '+' : ''}{revenueTrend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueTrend >= 0 ? `+${revenueTrend.toFixed(1)}% vs mois dernier` : `${revenueTrend.toFixed(1)}% vs mois dernier`}{' '}
            {revenueTrend >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Comparaison à la même période
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Réservations actives</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.activeReservations}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {reservationsTrend >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {reservationsTrend >= 0 ? '+' : ''}{reservationsTrend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {reservationsTrend >= 0 ? `+${reservationsTrend.toFixed(1)}% de nouvelles réservations` : `${reservationsTrend.toFixed(1)}% de nouvelles réservations`}{' '}
            {reservationsTrend >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {stats.upcomingReservations} réservation{stats.upcomingReservations !== 1 ? 's' : ''} à venir
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Véhicules disponibles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.availableVehicles}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {vehiclesTrend >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {vehiclesTrend >= 0 ? '+' : ''}{Math.abs(vehiclesTrend).toFixed(1)}pts
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {vehiclesTrend >= 0 ? 'Disponibilité en hausse' : 'Forte demande'}{' '}
            {vehiclesTrend >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Sur {stats.totalVehicles} véhicule{stats.totalVehicles !== 1 ? 's' : ''} au total
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Taux d'occupation</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.occupancyRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {occupancyTrend >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {occupancyTrend >= 0 ? '+' : ''}{Math.abs(occupancyTrend).toFixed(1)}pts
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {occupancyTrend >= 0 ? 'Occupation en hausse' : 'Occupation en baisse'}{' '}
            {occupancyTrend >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {occupancyTrend >= 0 ? `+${occupancyTrend.toFixed(1)} points vs mois dernier` : `${occupancyTrend.toFixed(1)} points vs mois dernier`}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
