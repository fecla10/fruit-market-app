"use client"

import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatPercentage, getTrendInfo } from '@/lib/utils/formatters'

interface MarketMetric {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: React.ComponentType<any>
  description?: string
}

// Mock data - in a real app, this would come from your API
const marketMetrics: MarketMetric[] = [
  {
    title: 'Total Market Value',
    value: '$2.4B',
    change: 12.5,
    changeLabel: '+12.5% from yesterday',
    icon: DollarSign,
    description: 'Combined value of all tracked fruits',
  },
  {
    title: 'Active Markets',
    value: '147',
    change: 3.2,
    changeLabel: '+3.2% this week',
    icon: Activity,
    description: 'Markets currently trading',
  },
  {
    title: 'Avg Price Change',
    value: '+2.8%',
    change: 2.8,
    changeLabel: 'vs last 24h',
    icon: TrendingUp,
    description: 'Average price movement',
  },
  {
    title: 'Volume Today',
    value: '1.2M lbs',
    change: -5.1,
    changeLabel: '-5.1% from yesterday',
    icon: TrendingDown,
    description: 'Total trading volume',
  },
]

interface TopMover {
  name: string
  symbol: string
  price: number
  change: number
  volume: string
}

const topGainers: TopMover[] = [
  { name: 'Organic Apples', symbol: 'OAPP', price: 3.45, change: 15.2, volume: '45.2K' },
  { name: 'Premium Bananas', symbol: 'PBAN', price: 2.89, change: 12.7, volume: '32.1K' },
  { name: 'Exotic Mangoes', symbol: 'EMNG', price: 5.67, change: 9.8, volume: '18.5K' },
]

const topLosers: TopMover[] = [
  { name: 'Seasonal Oranges', symbol: 'SORG', price: 2.23, change: -8.4, volume: '67.8K' },
  { name: 'Local Strawberries', symbol: 'LSTR', price: 4.12, change: -6.2, volume: '41.3K' },
  { name: 'Imported Grapes', symbol: 'IGRP', price: 3.78, change: -4.9, volume: '29.7K' },
]

export function MarketOverview() {
  return (
    <div className="space-y-6">
      {/* Market Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marketMetrics.map((metric) => {
          const trendInfo = getTrendInfo(metric.change)
          const Icon = metric.icon
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  <span className={trendInfo.color}>
                    {trendInfo.icon} {formatPercentage(Math.abs(metric.change), 1)}
                  </span>
                  <span className="text-muted-foreground">
                    {metric.changeLabel}
                  </span>
                </div>
                {metric.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top Movers */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Gainers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topGainers.map((fruit) => {
              const trendInfo = getTrendInfo(fruit.change)
              
              return (
                <div key={fruit.symbol} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{fruit.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {fruit.symbol}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vol: {fruit.volume}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPrice(fruit.price)}
                    </div>
                    <div className={`text-xs ${trendInfo.color}`}>
                      {trendInfo.icon} {formatPercentage(fruit.change)}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topLosers.map((fruit) => {
              const trendInfo = getTrendInfo(fruit.change)
              
              return (
                <div key={fruit.symbol} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{fruit.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {fruit.symbol}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vol: {fruit.volume}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPrice(fruit.price)}
                    </div>
                    <div className={`text-xs ${trendInfo.color}`}>
                      {trendInfo.icon} {formatPercentage(fruit.change)}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}