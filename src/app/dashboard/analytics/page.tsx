"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { MarketOverview } from '@/components/analytics/market-overview'
import { UserAnalyticsCard } from '@/components/analytics/user-analytics-card'
import { MarketTrendsChart } from '@/components/analytics/market-trends-chart'
import { useDashboardAnalytics, useMarketInsights } from '@/hooks/useAnalytics'

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [activeTab, setActiveTab] = useState('overview')
  
  const { market, user, isLoading, error, refetch } = useDashboardAnalytics(selectedPeriod)
  const { data: insights } = useMarketInsights(selectedPeriod)

  const periods = [
    { key: '1d', label: '1 Day' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
  ]

  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to Load Analytics</h2>
              <p className="text-muted-foreground mb-4">
                There was an error loading the analytics data.
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive market insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
            {periods.map(period => (
              <Button
                key={period.key}
                variant={selectedPeriod === period.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Insights Banner */}
      {insights && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Market Insights ({selectedPeriod})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Market Trend</p>
                    <Badge 
                      variant={insights.marketTrend === 'bullish' ? 'default' : 
                               insights.marketTrend === 'bearish' ? 'destructive' : 'secondary'}
                      className="font-medium"
                    >
                      {insights.marketTrend === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {insights.marketTrend}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Top Performer</p>
                    <p className="font-medium text-blue-900">
                      {insights.topPerformer?.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Alert Trigger Rate</p>
                    <p className="font-medium text-blue-900">
                      {insights.alertTriggerRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Trends
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MarketOverview period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <MarketTrendsChart 
            period={selectedPeriod} 
            height={400}
            className="col-span-full"
          />
          
          {/* Additional trend analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Price Distribution Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {market?.priceDistribution && (
                  <div className="space-y-3">
                    {market.priceDistribution.map((range, index) => {
                      const total = market.priceDistribution.reduce((sum, r) => sum + r.count, 0)
                      const percentage = (range.count / total) * 100
                      
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{range.range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {range.count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Market Value</span>
                    <span className="text-lg font-bold text-green-600">
                      {insights && new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        notation: 'compact'
                      }).format(insights.totalMarketValue)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Avg Daily Volume</span>
                    <span className="text-lg font-bold">
                      {insights && new Intl.NumberFormat('en-US', {
                        notation: 'compact'
                      }).format(insights.avgDailyVolume)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Market Volatility</span>
                    <span className="text-lg font-bold text-orange-600">
                      {insights && insights.marketVolatility.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <UserAnalyticsCard />
            
            <Card>
              <CardHeader>
                <CardTitle>Your Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${user.portfolioValue.toFixed(2)}
                        </div>
                        <div className="text-sm text-green-700">Portfolio Value</div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {user.activityScore}/100
                        </div>
                        <div className="text-sm text-blue-700">Activity Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Portfolio Return</span>
                        <span className={`text-sm font-medium ${
                          user.portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {user.portfolioReturn >= 0 ? '+' : ''}{user.portfolioReturn.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Transactions</span>
                        <span className="text-sm font-medium">{user.totalTransactions}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Watchlist Items</span>
                        <span className="text-sm font-medium">{user.watchlistCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p>Loading your analytics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {insights && (
                    <>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Market Sentiment</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={insights.marketTrend === 'bullish' ? 'default' : 
                                     insights.marketTrend === 'bearish' ? 'destructive' : 'secondary'}
                          >
                            {insights.marketTrend}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            based on {selectedPeriod} trend
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">User Growth</h4>
                        <div className="text-2xl font-bold">
                          {insights.activeUsersGrowth > 0 ? '+' : ''}
                          {insights.activeUsersGrowth.toFixed(1)}%
                        </div>
                        <span className="text-sm text-muted-foreground">
                          active users growth
                        </span>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Alert Efficiency</h4>
                        <div className="text-2xl font-bold">
                          {insights.alertTriggerRate.toFixed(1)}%
                        </div>
                        <span className="text-sm text-muted-foreground">
                          alerts triggered
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}