"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, LabelList } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
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
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Euro } from "lucide-react"

interface RevenueDataPoint {
  month: string
  revenue: number
}

interface ChartAreaInteractiveProps {
  data: RevenueDataPoint[]
}

const chartConfig = {
  revenue: { label: "Chiffre d'affaires", color: "hsl(142, 76%, 36%)" },
} satisfies ChartConfig

// Format value for labels (compact)
const formatCompact = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k€`
  return `${value}€`
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const monthData = payload[0].payload;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3 min-w-[140px]">
        <p className="text-xs text-muted-foreground font-medium mb-1">
          {monthData.monthLong}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatCurrency(value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("6")

  React.useEffect(() => {
    if (isMobile) setTimeRange("3")
  }, [isMobile])

  const chartData = data.map((item) => {
    const [year, month] = item.month.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' })
    const monthNameLong = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      monthLong: monthNameLong.charAt(0).toUpperCase() + monthNameLong.slice(1),
      revenue: item.revenue,
      date: item.month,
    }
  })

  const filteredData = timeRange === "all" ? chartData : chartData.slice(-parseInt(timeRange))

  const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenue, 0)
  const avgRevenue = filteredData.length > 0 ? totalRevenue / filteredData.length : 0
  const maxRevenue = Math.max(...filteredData.map(d => d.revenue), 0)
  
  const midPoint = Math.floor(filteredData.length / 2)
  const firstHalf = filteredData.slice(0, midPoint).reduce((sum, d) => sum + d.revenue, 0) / (midPoint || 1)
  const secondHalf = filteredData.slice(midPoint).reduce((sum, d) => sum + d.revenue, 0) / ((filteredData.length - midPoint) || 1)
  const trendPercent = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
  const isPositiveTrend = trendPercent >= 0

  const getDescription = () => {
    if (timeRange === "all") return { long: "Depuis le début", short: "Tout" }
    return { long: `${timeRange} derniers mois`, short: `${timeRange}M` }
  }

  const description = getDescription()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <Euro className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-base sm:text-lg">Revenus</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{description.long}</span>
              <span className="sm:hidden">{description.short}</span>
            </CardDescription>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[90px] h-8 text-xs sm:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 mois</SelectItem>
              <SelectItem value="6">6 mois</SelectItem>
              <SelectItem value="12">1 an</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => { if (value) setTimeRange(value) }}
            className="hidden sm:flex"
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="3" className="text-xs px-2.5">3M</ToggleGroupItem>
            <ToggleGroupItem value="6" className="text-xs px-2.5">6M</ToggleGroupItem>
            <ToggleGroupItem value="12" className="text-xs px-2.5">1A</ToggleGroupItem>
            <ToggleGroupItem value="all" className="text-xs px-2.5">Tout</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-end justify-between pt-3 gap-4">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-foreground tabular-nums tracking-tight">
              {formatCurrency(totalRevenue)}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {isPositiveTrend ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{trendPercent.toFixed(1)}%
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {trendPercent.toFixed(1)}%
                </div>
              )}
              <span className="text-xs text-muted-foreground">tendance</span>
            </div>
          </div>
          
          <div className="hidden sm:flex gap-4 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Moyenne</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(avgRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="text-sm font-semibold tabular-nums text-green-600">{formatCurrency(maxRevenue)}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-4 pt-2 pb-4">
        {filteredData.length === 0 ? (
          <div className="flex h-[180px] sm:h-[220px] items-center justify-center">
            <p className="text-muted-foreground text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[180px] sm:h-[220px] w-full">
            <AreaChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 30,
                right: 30,
                top: 35,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="rgb(16, 185, 129)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.5}
              />
              
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={isMobile ? 30 : 40}
                tick={{ 
                  fontSize: isMobile ? 10 : 12, 
                  fill: 'hsl(var(--muted-foreground))',
                  fontWeight: 500
                }}
              />
              
              <ChartTooltip
                cursor={{ 
                  stroke: 'hsl(var(--primary))', 
                  strokeWidth: 1,
                  strokeDasharray: '4 4',
                  strokeOpacity: 0.5
                }}
                content={<CustomTooltip />}
              />
              
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#revenueGradient)"
                stroke="rgb(34, 197, 94)"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "rgb(34, 197, 94)",
                  stroke: "white",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "rgb(34, 197, 94)",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              >
                <LabelList
                  dataKey="revenue"
                  position="top"
                  offset={10}
                  formatter={(value: any) => formatCompact(Number(value))}
                  style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 600,
                    fill: 'hsl(var(--foreground))',
                  }}
                />
              </Area>
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
