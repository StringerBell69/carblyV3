"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface RevenueDataPoint {
  month: string
  revenue: number
}

interface ChartAreaInteractiveProps {
  data: RevenueDataPoint[]
}

const chartConfig = {
  revenue: { label: "Chiffre d'affaires", color: "var(--primary)" },
} satisfies ChartConfig

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("6")

  React.useEffect(() => {
    if (isMobile) setTimeRange("3")
  }, [isMobile])

  // Transform data: month format is "YYYY-MM", convert to readable format
  const chartData = data.map((item) => {
    const [year, month] = item.month.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    return {
      month: monthName,
      revenue: item.revenue, // Amount is already in euros (decimal format in DB)
      date: item.month,
    }
  })

  const filteredData = timeRange === "all" ? chartData : chartData.slice(-parseInt(timeRange))

  // Descriptions selon la période
  const getDescription = () => {
    if (timeRange === "all") {
      return {
        long: "Revenus depuis le début",
        short: "Tout le temps"
      }
    }
    return {
      long: `Revenus des ${timeRange} derniers mois`,
      short: `${timeRange} derniers mois`
    }
  }

  const description = getDescription()

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Chiffre d'affaires total</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {description.long}
          </span>
          <span className="@[540px]/card:hidden">{description.short}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value)
            }}
            className="hidden @[540px]/card:flex"
            variant="outline"
          >
            <ToggleGroupItem value="3" aria-label="3 derniers mois">
              3M
            </ToggleGroupItem>
            <ToggleGroupItem value="6" aria-label="6 derniers mois">
              6M
            </ToggleGroupItem>
            <ToggleGroupItem value="12" aria-label="12 derniers mois">
              12M
            </ToggleGroupItem>
            <ToggleGroupItem value="all" aria-label="Tout le temps">
              Tout
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[180px] rounded-lg @[540px]/card:hidden"
              aria-label="Sélectionner la période"
            >
              <SelectValue placeholder="3 derniers mois" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3" className="rounded-lg">
                3 derniers mois
              </SelectItem>
              <SelectItem value="6" className="rounded-lg">
                6 derniers mois
              </SelectItem>
              <SelectItem value="12" className="rounded-lg">
                12 derniers mois
              </SelectItem>
              <SelectItem value="all" className="rounded-lg">
                Tout le temps
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {filteredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Aucune donnée de revenu disponible pour cette période
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 0,
                right: 10,
                top: 10,
              }}
            >
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  return value.split(' ')[0] // Just show month, not year
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => value}
                    formatter={(value) => (
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'EUR' })}
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                fillOpacity={0.4}
                stroke="var(--color-revenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
