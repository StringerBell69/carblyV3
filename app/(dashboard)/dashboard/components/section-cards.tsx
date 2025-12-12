'use client';

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useRef, useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Euro, CalendarCheck, Car, Percent } from "lucide-react"

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

interface StatCardData {
  title: string
  value: string
  trend: number
  badgeText: string
  subtitle: string
  icon: React.ReactNode
  color: string
}

export function SectionCards({ stats, trends }: SectionCardsProps) {
  const { revenueTrend, reservationsTrend, vehiclesTrend, occupancyTrend } = trends
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const cards: StatCardData[] = [
    {
      title: "Chiffre d'affaires",
      value: formatCurrency(stats.revenue),
      trend: revenueTrend,
      badgeText: revenueTrend >= 0 ? `+${revenueTrend.toFixed(1)}%` : `${revenueTrend.toFixed(1)}%`,
      subtitle: "Ce mois vs mois dernier",
      icon: <Euro className="h-4 w-4" />,
      color: "text-primary",
    },
    {
      title: "Réservations",
      value: stats.activeReservations.toString(),
      trend: reservationsTrend,
      badgeText: `${stats.upcomingReservations} à venir`,
      subtitle: reservationsTrend >= 0 
        ? `+${reservationsTrend.toFixed(0)}% vs mois dernier` 
        : `${reservationsTrend.toFixed(0)}% vs mois dernier`,
      icon: <CalendarCheck className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      title: "Véhicules dispo.",
      value: `${stats.availableVehicles}/${stats.totalVehicles}`,
      trend: vehiclesTrend,
      badgeText: `${stats.totalVehicles - stats.availableVehicles} loués`,
      subtitle: vehiclesTrend >= 0 
        ? `+${vehiclesTrend.toFixed(1)} pts dispo` 
        : `${vehiclesTrend.toFixed(1)} pts dispo`,
      icon: <Car className="h-4 w-4" />,
      color: "text-green-500",
    },
    {
      title: "Occupation",
      value: `${stats.occupancyRate}%`,
      trend: occupancyTrend,
      badgeText: occupancyTrend >= 0 ? `+${occupancyTrend.toFixed(1)} pts` : `${occupancyTrend.toFixed(1)} pts`,
      subtitle: occupancyTrend >= 0 
        ? "Hausse vs mois dernier" 
        : "Baisse vs mois dernier",
      icon: <Percent className="h-4 w-4" />,
      color: "text-orange-500",
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft
        const cardWidth = scrollRef.current.offsetWidth * 0.75
        const newIndex = Math.round(scrollLeft / cardWidth)
        setActiveIndex(Math.min(newIndex, cards.length - 1))
      }
    }

    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', handleScroll)
      return () => ref.removeEventListener('scroll', handleScroll)
    }
  }, [cards.length])

  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth * 0.75
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="space-y-2 px-2 sm:px-4 lg:px-6">
      {/* Mobile Carousel */}
      <div className="@xl/main:hidden">
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card, index) => (
            <div 
              key={card.title}
              className="snap-start shrink-0 w-[75%] first:ml-0"
            >
              <Card className="h-full bg-gradient-to-t from-primary/5 to-card shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-1.5">
                      <span className={card.color}>{card.icon}</span>
                      {card.title}
                    </CardDescription>
                    <Badge 
                      variant={card.trend >= 0 ? "default" : "secondary"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {card.badgeText}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums">
                    {card.value}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {card.trend >= 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    {card.subtitle}
                  </div>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-1.5 pt-1">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="hidden @xl/main:grid grid-cols-2 @5xl/main:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center gap-1.5">
                  <span className={card.color}>{card.icon}</span>
                  {card.title}
                </CardDescription>
                <Badge 
                  variant={card.trend >= 0 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {card.badgeText}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {card.value}
              </CardTitle>
            </CardHeader>
            <CardFooter className="pt-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {card.trend >= 0 ? (
                  <IconTrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <IconTrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                {card.subtitle}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
