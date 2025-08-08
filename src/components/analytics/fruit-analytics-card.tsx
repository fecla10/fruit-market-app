"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Target,
  Shield,
  AlertTriangle,
  DollarSign,
  Volume2
} from 'lucide-react'
import { useFruitAnalytics } from '@/hooks/useAnalytics'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface FruitAnalyticsCardProps {
  fruitId: string
  className?: string
  compact?: boolean
}

export function FruitAnalyticsCard({ fruitId, className, compact = false }: FruitAnalyticsCardProps) {
  const { data: analytics, isLoading, error } = useFruitAnalytics(fruitId)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="animate-pulse">
          <div className="h-5 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="space-y-4 animate-pulse">
          <div className="h-8 w-24 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load fruit analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200'
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200'
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return TrendingUp
      case 'bearish': return TrendingDown
      case 'neutral': return Activity
      default: return Activity
    }
  }

  if (compact) {
    const TrendIcon = getTrendIcon(analytics.trend)
    
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">{analytics.name}</h3>
              <p className="text-sm text-muted-foreground">{analytics.symbol}</p>
            </div>
            <Badge 
              variant="outline" 
              className={getTrendColor(analytics.trend)}
            >
              <TrendIcon className="h-3 w-3 mr-1" />
              {analytics.trend}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-medium">{formatCurrency(analytics.currentPrice)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">24h Change</span>
              <span className={cn(
                "text-sm font-medium",
                analytics.priceChangePercentage24h >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercentage(analytics.priceChangePercentage24h)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const TrendIcon = getTrendIcon(analytics.trend)
  const isPositiveChange = analytics.priceChangePercentage24h >= 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{analytics.name}</h3>
            <p className="text-sm text-muted-foreground">{analytics.symbol}</p>
          </div>
          <Badge 
            variant="outline"
            className={getTrendColor(analytics.trend)}
          >
            <TrendIcon className="h-3 w-3 mr-1" />
            {analytics.trend}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Price Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analytics.currentPrice)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "font-medium",
                  isPositiveChange ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(analytics.priceChange24h)}
                </span>
                <span className="text-muted-foreground">
                  ({formatPercentage(analytics.priceChangePercentage24h)})
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(analytics.volume24h)}
                  </p>
                </div>
                <Volume2 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary">
                  {analytics.volume24h > 10000 ? 'High' : 
                   analytics.volume24h > 5000 ? 'Medium' : 'Low'} Volume
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Indicators */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">RSI (14)</span>
              <span className="text-sm font-bold">{analytics.rsi.toFixed(1)}</span>
            </div>
            <Progress value={analytics.rsi} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Oversold (30)</span>
              <span>Overbought (70)</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Volatility</span>
              <span className="text-sm font-bold">{formatPercentage(analytics.volatility)}</span>
            </div>
            <Progress value={Math.min(100, analytics.volatility * 5)} className="h-2" />
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Support</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(analytics.support)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Resistance</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(analytics.resistance)}
            </p>
          </div>
        </div>

        {/* Moving Averages */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Moving Averages
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MA(7)</span>
              <span className="text-sm font-medium">
                {formatCurrency(analytics.movingAverage.ma7)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MA(30)</span>
              <span className="text-sm font-medium">
                {formatCurrency(analytics.movingAverage.ma30)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MA(90)</span>
              <span className="text-sm font-medium">
                {formatCurrency(analytics.movingAverage.ma90)}
              </span>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="font-medium">{formatCurrency(analytics.marketCap)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Volatility</p>
              <p className="font-medium">{formatPercentage(analytics.volatility)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}