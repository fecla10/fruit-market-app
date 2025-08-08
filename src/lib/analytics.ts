import { prisma } from '@/lib/db'
import CacheService from '@/lib/kv'

export interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalFruits: number
  totalPrices: number
  totalAlerts: number
  triggeredAlerts: number
  portfolioValue: number
  topFruits: Array<{
    name: string
    symbol: string
    price: number
    change: number
    changePercentage: number
    volume: number
  }>
  priceDistribution: Array<{
    range: string
    count: number
  }>
  userActivity: Array<{
    date: string
    users: number
    alerts: number
    transactions: number
  }>
  marketTrends: Array<{
    date: string
    avgPrice: number
    totalVolume: number
    volatility: number
  }>
}

export interface UserAnalytics {
  userId: string
  watchlistCount: number
  alertsCount: number
  portfolioValue: number
  portfolioReturn: number
  totalTransactions: number
  favoriteCategories: string[]
  activityScore: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
}

export interface FruitAnalytics {
  fruitId: string
  symbol: string
  name: string
  currentPrice: number
  priceChange24h: number
  priceChangePercentage24h: number
  volume24h: number
  marketCap: number
  volatility: number
  trend: 'bullish' | 'bearish' | 'neutral'
  support: number
  resistance: number
  rsi: number
  movingAverage: {
    ma7: number
    ma30: number
    ma90: number
  }
}

export class AnalyticsService {
  // Get general market analytics
  static async getMarketAnalytics(period: string = '7d'): Promise<AnalyticsData> {
    const cacheKey = `analytics:market:${period}`
    const cached = await CacheService.get<AnalyticsData>(cacheKey)
    if (cached) return cached

    const startDate = this.getPeriodStartDate(period)

    try {
      // Total counts
      const [totalUsers, activeUsers, totalFruits, totalPrices, alerts] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastLogin: { gte: startDate }
          }
        }),
        prisma.fruit.count({ where: { active: true } }),
        prisma.price.count({
          where: { date: { gte: startDate } }
        }),
        prisma.alert.findMany({
          where: { createdAt: { gte: startDate } },
          select: { triggered: true }
        })
      ])

      const triggeredAlerts = alerts.filter(a => a.triggered).length

      // Portfolio value calculation
      const portfolios = await prisma.portfolio.findMany({
        include: {
          transactions: {
            include: { fruit: true }
          }
        }
      })

      const portfolioValue = portfolios.reduce((total, portfolio) => {
        return total + (portfolio.totalValue || 0)
      }, 0)

      // Top performing fruits
      const topFruits = await this.getTopFruits(10)

      // Price distribution
      const priceDistribution = await this.getPriceDistribution()

      // User activity over time
      const userActivity = await this.getUserActivityTrend(period)

      // Market trends
      const marketTrends = await this.getMarketTrends(period)

      const analytics: AnalyticsData = {
        totalUsers,
        activeUsers,
        totalFruits,
        totalPrices,
        totalAlerts: alerts.length,
        triggeredAlerts,
        portfolioValue,
        topFruits,
        priceDistribution,
        userActivity,
        marketTrends
      }

      // Cache for 1 hour
      await CacheService.setAnalytics('market', period, analytics)
      
      return analytics
    } catch (error) {
      console.error('Error getting market analytics:', error)
      throw error
    }
  }

  // Get user-specific analytics
  static async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const cacheKey = `analytics:user:${userId}`
    const cached = await CacheService.get<UserAnalytics>(cacheKey)
    if (cached) return cached

    try {
      const [watchlist, alerts, portfolio, transactions] = await Promise.all([
        prisma.watchlistItem.count({ where: { watchlist: { userId } } }),
        prisma.alert.count({ where: { userId } }),
        prisma.portfolio.findUnique({ where: { userId } }),
        prisma.portfolioTransaction.findMany({
          where: { portfolio: { userId } },
          include: { fruit: { select: { category: true } } }
        })
      ])

      // Calculate favorite categories
      const categoryCount: Record<string, number> = {}
      transactions.forEach(t => {
        const category = t.fruit.category
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })

      const favoriteCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category)

      // Calculate activity score (based on recent activity)
      const activityScore = this.calculateActivityScore(userId, watchlist, alerts.length, transactions.length)

      // Determine risk profile based on transaction patterns
      const riskProfile = this.determineRiskProfile(transactions)

      const analytics: UserAnalytics = {
        userId,
        watchlistCount: watchlist,
        alertsCount: alerts,
        portfolioValue: portfolio?.totalValue || 0,
        portfolioReturn: portfolio?.totalReturn || 0,
        totalTransactions: transactions.length,
        favoriteCategories,
        activityScore,
        riskProfile
      }

      // Cache for 30 minutes
      await CacheService.setAnalytics('user', userId, analytics)
      
      return analytics
    } catch (error) {
      console.error('Error getting user analytics:', error)
      throw error
    }
  }

  // Get fruit-specific analytics with technical indicators
  static async getFruitAnalytics(fruitId: string): Promise<FruitAnalytics> {
    const cacheKey = `analytics:fruit:${fruitId}`
    const cached = await CacheService.get<FruitAnalytics>(cacheKey)
    if (cached) return cached

    try {
      const fruit = await prisma.fruit.findUnique({
        where: { id: fruitId },
        select: { symbol: true, name: true }
      })

      if (!fruit) {
        throw new Error('Fruit not found')
      }

      // Get recent price data for calculations
      const prices = await prisma.price.findMany({
        where: { fruitId },
        orderBy: { date: 'desc' },
        take: 100
      })

      if (prices.length === 0) {
        throw new Error('No price data available')
      }

      const currentPrice = prices[0]
      const yesterdayPrice = prices[1]

      // Calculate 24h changes
      const priceChange24h = yesterdayPrice ? currentPrice.close - yesterdayPrice.close : 0
      const priceChangePercentage24h = yesterdayPrice ? (priceChange24h / yesterdayPrice.close) * 100 : 0

      // Calculate volume
      const volume24h = currentPrice.volume || 0

      // Calculate market cap (simplified - using volume * price)
      const marketCap = currentPrice.close * volume24h

      // Calculate volatility (standard deviation of returns)
      const volatility = this.calculateVolatility(prices)

      // Determine trend
      const trend = this.determineTrend(prices)

      // Calculate support and resistance levels
      const { support, resistance } = this.calculateSupportResistance(prices)

      // Calculate RSI
      const rsi = this.calculateRSI(prices)

      // Calculate moving averages
      const movingAverage = {
        ma7: this.calculateMA(prices, 7),
        ma30: this.calculateMA(prices, 30),
        ma90: this.calculateMA(prices, 90)
      }

      const analytics: FruitAnalytics = {
        fruitId,
        symbol: fruit.symbol,
        name: fruit.name,
        currentPrice: currentPrice.close,
        priceChange24h,
        priceChangePercentage24h,
        volume24h,
        marketCap,
        volatility,
        trend,
        support,
        resistance,
        rsi,
        movingAverage
      }

      // Cache for 15 minutes
      await CacheService.setAnalytics('fruit', fruitId, analytics)
      
      return analytics
    } catch (error) {
      console.error('Error getting fruit analytics:', error)
      throw error
    }
  }

  // Helper methods
  private static getPeriodStartDate(period: string): Date {
    const now = new Date()
    switch (period) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  private static async getTopFruits(limit: number) {
    const result = await prisma.$queryRaw`
      SELECT 
        f.name,
        f.symbol,
        p1.close as price,
        p1.close - p2.close as change,
        ((p1.close - p2.close) / p2.close * 100) as "changePercentage",
        p1.volume
      FROM fruits f
      JOIN LATERAL (
        SELECT close, volume
        FROM prices
        WHERE "fruitId" = f.id
        ORDER BY date DESC
        LIMIT 1
      ) p1 ON true
      JOIN LATERAL (
        SELECT close
        FROM prices
        WHERE "fruitId" = f.id
        ORDER BY date DESC
        OFFSET 1
        LIMIT 1
      ) p2 ON true
      WHERE f.active = true
      ORDER BY "changePercentage" DESC
      LIMIT ${limit}
    ` as any[]

    return result.map(row => ({
      name: row.name,
      symbol: row.symbol,
      price: Number(row.price),
      change: Number(row.change),
      changePercentage: Number(row.changePercentage),
      volume: Number(row.volume)
    }))
  }

  private static async getPriceDistribution() {
    const result = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN close < 1 THEN '$0 - $1'
          WHEN close < 5 THEN '$1 - $5'
          WHEN close < 10 THEN '$5 - $10'
          WHEN close < 20 THEN '$10 - $20'
          ELSE '$20+'
        END as range,
        COUNT(*) as count
      FROM prices p
      JOIN fruits f ON p."fruitId" = f.id
      WHERE f.active = true
      GROUP BY range
      ORDER BY MIN(close)
    ` as any[]

    return result.map(row => ({
      range: row.range,
      count: Number(row.count)
    }))
  }

  private static async getUserActivityTrend(period: string) {
    const startDate = this.getPeriodStartDate(period)
    
    const result = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as users,
        COUNT(CASE WHEN table_name = 'alerts' THEN 1 END) as alerts,
        COUNT(CASE WHEN table_name = 'transactions' THEN 1 END) as transactions
      FROM (
        SELECT created_at, user_id, 'alerts' as table_name FROM alerts WHERE created_at >= ${startDate}
        UNION ALL
        SELECT created_at, (SELECT user_id FROM portfolios WHERE id = portfolio_id), 'transactions' 
        FROM portfolio_transactions WHERE created_at >= ${startDate}
      ) combined
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as any[]

    return result.map(row => ({
      date: row.date,
      users: Number(row.users),
      alerts: Number(row.alerts),
      transactions: Number(row.transactions)
    }))
  }

  private static async getMarketTrends(period: string) {
    const startDate = this.getPeriodStartDate(period)
    
    const result = await prisma.$queryRaw`
      SELECT 
        DATE(date) as date,
        AVG(close) as "avgPrice",
        SUM(volume) as "totalVolume",
        STDDEV(close) as volatility
      FROM prices
      WHERE date >= ${startDate}
      GROUP BY DATE(date)
      ORDER BY date
    ` as any[]

    return result.map(row => ({
      date: row.date,
      avgPrice: Number(row.avgPrice),
      totalVolume: Number(row.totalVolume),
      volatility: Number(row.volatility)
    }))
  }

  private static calculateActivityScore(userId: string, watchlistCount: number, alertsCount: number, transactionsCount: number): number {
    // Simple scoring algorithm
    return Math.min(100, (watchlistCount * 5) + (alertsCount * 3) + (transactionsCount * 2))
  }

  private static determineRiskProfile(transactions: any[]): 'conservative' | 'moderate' | 'aggressive' {
    if (transactions.length === 0) return 'conservative'
    
    // Simple heuristic based on transaction frequency and volume
    const avgTransactionSize = transactions.reduce((sum, t) => sum + t.quantity * t.price, 0) / transactions.length
    
    if (avgTransactionSize < 100) return 'conservative'
    if (avgTransactionSize < 500) return 'moderate'
    return 'aggressive'
  }

  private static calculateVolatility(prices: any[]): number {
    if (prices.length < 2) return 0
    
    const returns = []
    for (let i = 1; i < Math.min(prices.length, 30); i++) {
      const return_ = (prices[i-1].close - prices[i].close) / prices[i].close
      returns.push(return_)
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance) * 100 // Convert to percentage
  }

  private static determineTrend(prices: any[]): 'bullish' | 'bearish' | 'neutral' {
    if (prices.length < 5) return 'neutral'
    
    const recent = prices.slice(0, 5)
    const older = prices.slice(5, 10)
    
    const recentAvg = recent.reduce((sum, p) => sum + p.close, 0) / recent.length
    const olderAvg = older.reduce((sum, p) => sum + p.close, 0) / older.length
    
    const change = (recentAvg - olderAvg) / olderAvg
    
    if (change > 0.02) return 'bullish'
    if (change < -0.02) return 'bearish'
    return 'neutral'
  }

  private static calculateSupportResistance(prices: any[]): { support: number; resistance: number } {
    if (prices.length === 0) return { support: 0, resistance: 0 }
    
    const recentPrices = prices.slice(0, 20).map(p => p.close)
    const support = Math.min(...recentPrices)
    const resistance = Math.max(...recentPrices)
    
    return { support, resistance }
  }

  private static calculateRSI(prices: any[], period: number = 14): number {
    if (prices.length < period + 1) return 50
    
    const changes = []
    for (let i = 1; i <= period; i++) {
      changes.push(prices[i-1].close - prices[i].close)
    }
    
    const gains = changes.filter(c => c > 0)
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c))
    
    const avgGain = gains.reduce((sum, g) => sum + g, 0) / period
    const avgLoss = losses.reduce((sum, l) => sum + l, 0) / period
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private static calculateMA(prices: any[], period: number): number {
    if (prices.length < period) return 0
    
    const relevantPrices = prices.slice(0, period)
    return relevantPrices.reduce((sum, p) => sum + p.close, 0) / period
  }
}

export default AnalyticsService