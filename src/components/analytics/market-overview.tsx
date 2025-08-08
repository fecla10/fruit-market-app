"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Apple, 
  AlertTriangle, 
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react'
import { useMarketAnalytics } from '@/hooks/useAnalytics'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface MarketOverviewProps {
  period?: string
  className?: string
}

export function MarketOverview({ period = '7d', className }: MarketOverviewProps) {
  const { data: analytics, isLoading, error } = useMarketAnalytics({ period })

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted rounded mb-2"></div>
              <div className="h-3 w-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load market overview</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(analytics.totalUsers),
      change: analytics.activeUsers,
      changeLabel: `${analytics.activeUsers} active`,
      icon: Users,
      trend: 'neutral' as const
    },
    {
      title: 'Active Fruits',
      value: formatNumber(analytics.totalFruits),
      change: analytics.totalPrices,
      changeLabel: `${formatNumber(analytics.totalPrices)} price updates`,
      icon: Apple,
      trend: 'neutral' as const
    },
    {
      title: 'Portfolio Value',
      value: formatCurrency(analytics.portfolioValue),
      change: analytics.portfolioValue > 0 ? 1 : 0,
      changeLabel: 'Total market value',
      icon: DollarSign,
      trend: analytics.portfolioValue > 0 ? 'up' : 'neutral' as const
    },
    {
      title: 'Active Alerts',
      value: formatNumber(analytics.totalAlerts),
      change: analytics.triggeredAlerts,
      changeLabel: `${analytics.triggeredAlerts} triggered`,
      icon: AlertTriangle,
      trend: analytics.triggeredAlerts > 0 ? 'up' : 'neutral' as const
    }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.trend === 'up'
          const isNegative = stat.trend === 'down'
          
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={cn(
                  "text-xs flex items-center gap-1",
                  isPositive && "text-green-600",
                  isNegative && "text-red-600",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}>
                  {isPositive && <TrendingUp className="h-3 w-3" />}
                  {isNegative && <TrendingDown className="h-3 w-3" />}
                  {stat.changeLabel}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Top Fruits and Market Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performing Fruits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.topFruits.slice(0, 5).map((fruit, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{fruit.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {fruit.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(fruit.price)}
                  </div>
                  <div className={cn(
                    "text-sm flex items-center gap-1",
                    fruit.changePercentage > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {fruit.changePercentage > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatPercentage(fruit.changePercentage)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Activity Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.activeUsers}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Active Users
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage((analytics.activeUsers / analytics.totalUsers) * 100)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Activity Rate
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {analytics.userActivity.slice(-3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="text-sm">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="outline">
                      {activity.users} users
                    </Badge>
                    <Badge variant="outline">
                      {activity.alerts} alerts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Price Range Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.priceDistribution.map((range, index) => (
              <div key={index} className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-semibold">{range.count}</div>
                <div className="text-sm text-muted-foreground">{range.range}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}