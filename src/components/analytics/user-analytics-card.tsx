"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Eye, 
  Bell, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  Shield,
  Zap,
  Award
} from 'lucide-react'
import { useUserAnalytics } from '@/hooks/useAnalytics'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface UserAnalyticsCardProps {
  userId?: string
  className?: string
  compact?: boolean
}

export function UserAnalyticsCard({ userId, className, compact = false }: UserAnalyticsCardProps) {
  const { data: analytics, isLoading, error } = useUserAnalytics(userId)

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
            <User className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load user analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRiskProfileColor = (profile: string) => {
    switch (profile) {
      case 'aggressive': return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'conservative': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskProfileIcon = (profile: string) => {
    switch (profile) {
      case 'aggressive': return Zap
      case 'moderate': return Target
      case 'conservative': return Shield
      default: return Activity
    }
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              My Analytics
            </h3>
            <Badge 
              variant="outline" 
              className={getRiskProfileColor(analytics.riskProfile)}
            >
              {analytics.riskProfile}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(analytics.portfolioValue)}
              </div>
              <div className="text-xs text-muted-foreground">Portfolio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {analytics.watchlistCount}
              </div>
              <div className="text-xs text-muted-foreground">Watchlist</div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Activity Score</span>
              <span>{analytics.activityScore}/100</span>
            </div>
            <Progress value={analytics.activityScore} className="h-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const RiskIcon = getRiskProfileIcon(analytics.riskProfile)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Analytics
          </span>
          <Badge 
            variant="outline"
            className={getRiskProfileColor(analytics.riskProfile)}
          >
            <RiskIcon className="h-3 w-3 mr-1" />
            {analytics.riskProfile}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics.portfolioValue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {analytics.portfolioReturn >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "font-medium",
                  analytics.portfolioReturn >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatPercentage(analytics.portfolioReturn)}
                </span>
                <span className="text-muted-foreground">return</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(analytics.totalTransactions)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary">
                  {analytics.totalTransactions > 50 ? 'High' : 
                   analytics.totalTransactions > 20 ? 'Medium' : 'Low'} Activity
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Metrics */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Watchlist Items
              </span>
              <span className="text-sm font-bold">{analytics.watchlistCount}</span>
            </div>
            <Progress value={Math.min(100, (analytics.watchlistCount / 20) * 100)} />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Active Alerts
              </span>
              <span className="text-sm font-bold">{analytics.alertsCount}</span>
            </div>
            <Progress value={Math.min(100, (analytics.alertsCount / 10) * 100)} />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                Activity Score
              </span>
              <span className="text-sm font-bold">{analytics.activityScore}/100</span>
            </div>
            <Progress value={analytics.activityScore} />
          </div>
        </div>

        {/* Favorite Categories */}
        <div>
          <h4 className="text-sm font-medium mb-3">Favorite Categories</h4>
          <div className="flex flex-wrap gap-2">
            {analytics.favoriteCategories.length > 0 ? (
              analytics.favoriteCategories.map((category, index) => (
                <Badge key={index} variant="outline">
                  {category}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No trading activity yet
              </p>
            )}
          </div>
        </div>

        {/* Risk Profile Details */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-2 mb-2">
            <RiskIcon className="h-4 w-4" />
            <span className="font-medium">Risk Profile: {analytics.riskProfile}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {analytics.riskProfile === 'aggressive' && 
              "High-risk, high-reward approach with larger position sizes."}
            {analytics.riskProfile === 'moderate' && 
              "Balanced approach with moderate risk tolerance."}
            {analytics.riskProfile === 'conservative' && 
              "Low-risk approach focused on capital preservation."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}