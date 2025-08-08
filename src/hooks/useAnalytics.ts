import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { AnalyticsData, UserAnalytics, FruitAnalytics } from '@/lib/analytics'

interface UseAnalyticsOptions {
  enabled?: boolean
  period?: string
  refreshInterval?: number
}

export function useMarketAnalytics(options: UseAnalyticsOptions = {}) {
  const { enabled = true, period = '7d', refreshInterval = 300000 } = options // 5 minutes default

  return useQuery({
    queryKey: ['analytics', 'market', period],
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await fetch(`/api/analytics?type=market&period=${period}`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch market analytics')
      }
      
      return result.data
    },
    enabled,
    staleTime: 240000, // 4 minutes
    gcTime: 600000, // 10 minutes
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
  })
}

export function useUserAnalytics(userId?: string, options: UseAnalyticsOptions = {}) {
  const { data: session } = useSession()
  const { enabled = true, refreshInterval = 300000 } = options
  const targetUserId = userId || session?.user?.id

  return useQuery({
    queryKey: ['analytics', 'user', targetUserId],
    queryFn: async (): Promise<UserAnalytics> => {
      if (!targetUserId) {
        throw new Error('User ID is required')
      }

      const response = await fetch(`/api/analytics?type=user&userId=${targetUserId}`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch user analytics')
      }
      
      return result.data
    },
    enabled: enabled && !!targetUserId,
    staleTime: 180000, // 3 minutes
    gcTime: 600000, // 10 minutes
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
  })
}

export function useFruitAnalytics(fruitId: string, options: UseAnalyticsOptions = {}) {
  const { enabled = true, refreshInterval = 60000 } = options // 1 minute default for real-time data

  return useQuery({
    queryKey: ['analytics', 'fruit', fruitId],
    queryFn: async (): Promise<FruitAnalytics> => {
      const response = await fetch(`/api/analytics?type=fruit&fruitId=${fruitId}`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch fruit analytics')
      }
      
      return result.data
    },
    enabled: enabled && !!fruitId,
    staleTime: 45000, // 45 seconds
    gcTime: 300000, // 5 minutes
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
  })
}

// Composite hook for dashboard analytics
export function useDashboardAnalytics(period: string = '7d') {
  const { data: session } = useSession()
  
  const marketAnalytics = useMarketAnalytics({ period })
  const userAnalytics = useUserAnalytics(session?.user?.id)
  
  const isLoading = marketAnalytics.isLoading || userAnalytics.isLoading
  const error = marketAnalytics.error || userAnalytics.error
  
  return {
    market: marketAnalytics.data,
    user: userAnalytics.data,
    isLoading,
    error,
    refetch: () => {
      marketAnalytics.refetch()
      userAnalytics.refetch()
    }
  }
}

// Hook for analytics with real-time updates
export function useRealTimeAnalytics(fruitIds: string[] = []) {
  const marketQuery = useMarketAnalytics({ refreshInterval: 30000 }) // 30 seconds
  
  const fruitQueries = fruitIds.map(fruitId => 
    useFruitAnalytics(fruitId, { refreshInterval: 15000 }) // 15 seconds
  )
  
  const isLoading = marketQuery.isLoading || fruitQueries.some(q => q.isLoading)
  const hasError = !!marketQuery.error || fruitQueries.some(q => q.error)
  
  return {
    market: marketQuery.data,
    fruits: fruitQueries.map(q => q.data).filter(Boolean),
    isLoading,
    hasError,
    lastUpdate: new Date(),
    refetchAll: () => {
      marketQuery.refetch()
      fruitQueries.forEach(q => q.refetch())
    }
  }
}

// Hook for portfolio analytics
export function usePortfolioAnalytics(userId?: string) {
  const { data: session } = useSession()
  const targetUserId = userId || session?.user?.id
  
  const userAnalytics = useUserAnalytics(targetUserId, { 
    refreshInterval: 60000 // 1 minute 
  })
  
  return {
    portfolioValue: userAnalytics.data?.portfolioValue || 0,
    portfolioReturn: userAnalytics.data?.portfolioReturn || 0,
    totalTransactions: userAnalytics.data?.totalTransactions || 0,
    riskProfile: userAnalytics.data?.riskProfile || 'conservative',
    favoriteCategories: userAnalytics.data?.favoriteCategories || [],
    activityScore: userAnalytics.data?.activityScore || 0,
    isLoading: userAnalytics.isLoading,
    error: userAnalytics.error,
    refetch: userAnalytics.refetch
  }
}

// Hook for market trends and insights
export function useMarketInsights(period: string = '30d') {
  return useQuery({
    queryKey: ['market-insights', period],
    queryFn: async () => {
      const [marketData] = await Promise.all([
        fetch(`/api/analytics?type=market&period=${period}`).then(r => r.json())
      ])
      
      if (!marketData.success) {
        throw new Error(marketData.error || 'Failed to fetch market insights')
      }
      
      const market = marketData.data as AnalyticsData
      
      // Calculate insights
      const insights = {
        totalMarketValue: market.portfolioValue,
        avgDailyVolume: market.marketTrends.reduce((sum, t) => sum + t.totalVolume, 0) / market.marketTrends.length,
        marketVolatility: market.marketTrends[market.marketTrends.length - 1]?.volatility || 0,
        topPerformer: market.topFruits[0],
        worstPerformer: market.topFruits[market.topFruits.length - 1],
        activeUsersGrowth: market.userActivity.length > 1 ? 
          ((market.userActivity[market.userActivity.length - 1].users - market.userActivity[0].users) / market.userActivity[0].users) * 100 : 0,
        alertTriggerRate: market.totalAlerts > 0 ? (market.triggeredAlerts / market.totalAlerts) * 100 : 0,
        marketTrend: this.determineMarketTrend(market.marketTrends),
        priceRangeDistribution: market.priceDistribution,
        period
      }
      
      return insights
    },
    staleTime: 600000, // 10 minutes
    gcTime: 1200000, // 20 minutes
  })
}

// Helper function to determine overall market trend
function determineMarketTrend(trends: any[]): 'bullish' | 'bearish' | 'sideways' {
  if (trends.length < 2) return 'sideways'
  
  const recent = trends.slice(-7) // Last 7 data points
  const older = trends.slice(-14, -7) // Previous 7 data points
  
  if (recent.length === 0 || older.length === 0) return 'sideways'
  
  const recentAvg = recent.reduce((sum, t) => sum + t.avgPrice, 0) / recent.length
  const olderAvg = older.reduce((sum, t) => sum + t.avgPrice, 0) / older.length
  
  const change = (recentAvg - olderAvg) / olderAvg
  
  if (change > 0.05) return 'bullish'
  if (change < -0.05) return 'bearish'
  return 'sideways'
}