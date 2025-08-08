import { kv } from '@vercel/kv'

// Cache keys
export const CACHE_KEYS = {
  FRUITS: 'fruits:all',
  FRUIT_DETAILS: (id: string) => `fruit:${id}`,
  PRICES: (fruitId: string, timeframe: string) => `prices:${fruitId}:${timeframe}`,
  MARKET_STATUS: 'market:status',
  USER_WATCHLIST: (userId: string) => `watchlist:${userId}`,
  USER_ALERTS: (userId: string) => `alerts:${userId}`,
  USER_PORTFOLIO: (userId: string) => `portfolio:${userId}`,
  PRICE_ALERTS: 'alerts:price:active',
  SEARCH_RESULTS: (query: string) => `search:${query}`,
  ANALYTICS: (type: string, period: string) => `analytics:${type}:${period}`,
} as const

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  FRUITS: 3600, // 1 hour
  FRUIT_DETAILS: 1800, // 30 minutes
  PRICES_REALTIME: 30, // 30 seconds
  PRICES_HISTORICAL: 3600, // 1 hour
  MARKET_STATUS: 60, // 1 minute
  USER_DATA: 300, // 5 minutes
  SEARCH_RESULTS: 1800, // 30 minutes
  ANALYTICS: 7200, // 2 hours
} as const

export class CacheService {
  // Generic cache operations
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await kv.get(key)
      return cached as T | null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await kv.setex(key, ttl, JSON.stringify(value))
      } else {
        await kv.set(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await kv.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await kv.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  // Fruit-specific cache operations
  static async getFruits() {
    return this.get(CACHE_KEYS.FRUITS)
  }

  static async setFruits(fruits: any[]) {
    return this.set(CACHE_KEYS.FRUITS, fruits, CACHE_TTL.FRUITS)
  }

  static async getFruitDetails(fruitId: string) {
    return this.get(CACHE_KEYS.FRUIT_DETAILS(fruitId))
  }

  static async setFruitDetails(fruitId: string, details: any) {
    return this.set(CACHE_KEYS.FRUIT_DETAILS(fruitId), details, CACHE_TTL.FRUIT_DETAILS)
  }

  // Price cache operations
  static async getPrices(fruitId: string, timeframe: string) {
    return this.get(CACHE_KEYS.PRICES(fruitId, timeframe))
  }

  static async setPrices(fruitId: string, timeframe: string, prices: any[], isRealtime = false) {
    const ttl = isRealtime ? CACHE_TTL.PRICES_REALTIME : CACHE_TTL.PRICES_HISTORICAL
    return this.set(CACHE_KEYS.PRICES(fruitId, timeframe), prices, ttl)
  }

  // User data cache operations
  static async getUserWatchlist(userId: string) {
    return this.get(CACHE_KEYS.USER_WATCHLIST(userId))
  }

  static async setUserWatchlist(userId: string, watchlist: any[]) {
    return this.set(CACHE_KEYS.USER_WATCHLIST(userId), watchlist, CACHE_TTL.USER_DATA)
  }

  static async getUserAlerts(userId: string) {
    return this.get(CACHE_KEYS.USER_ALERTS(userId))
  }

  static async setUserAlerts(userId: string, alerts: any[]) {
    return this.set(CACHE_KEYS.USER_ALERTS(userId), alerts, CACHE_TTL.USER_DATA)
  }

  static async getUserPortfolio(userId: string) {
    return this.get(CACHE_KEYS.USER_PORTFOLIO(userId))
  }

  static async setUserPortfolio(userId: string, portfolio: any) {
    return this.set(CACHE_KEYS.USER_PORTFOLIO(userId), portfolio, CACHE_TTL.USER_DATA)
  }

  // Search cache operations
  static async getSearchResults(query: string) {
    return this.get(CACHE_KEYS.SEARCH_RESULTS(query))
  }

  static async setSearchResults(query: string, results: any[]) {
    return this.set(CACHE_KEYS.SEARCH_RESULTS(query), results, CACHE_TTL.SEARCH_RESULTS)
  }

  // Market status cache
  static async getMarketStatus() {
    return this.get(CACHE_KEYS.MARKET_STATUS)
  }

  static async setMarketStatus(status: any) {
    return this.set(CACHE_KEYS.MARKET_STATUS, status, CACHE_TTL.MARKET_STATUS)
  }

  // Bulk operations
  static async invalidateUserCache(userId: string) {
    const keys = [
      CACHE_KEYS.USER_WATCHLIST(userId),
      CACHE_KEYS.USER_ALERTS(userId),
      CACHE_KEYS.USER_PORTFOLIO(userId),
    ]
    
    await Promise.all(keys.map(key => this.del(key)))
  }

  static async invalidateFruitCache(fruitId: string) {
    try {
      // Get all timeframes that might be cached
      const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']
      const keys = [
        CACHE_KEYS.FRUIT_DETAILS(fruitId),
        ...timeframes.map(tf => CACHE_KEYS.PRICES(fruitId, tf))
      ]
      
      await Promise.all(keys.map(key => this.del(key)))
    } catch (error) {
      console.error('Error invalidating fruit cache:', error)
    }
  }

  // Pattern-based operations
  static async deletePattern(pattern: string) {
    try {
      // Note: This is a simplified version - in production you'd use SCAN
      // to handle large datasets efficiently
      const keys = await kv.keys(pattern)
      if (keys.length > 0) {
        await kv.del(...keys)
      }
    } catch (error) {
      console.error('Error deleting cache pattern:', error)
    }
  }

  // Health check
  static async healthCheck() {
    try {
      const testKey = 'health:test'
      const testValue = Date.now()
      
      await this.set(testKey, testValue, 5)
      const retrieved = await this.get(testKey)
      await this.del(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.error('Cache health check failed:', error)
      return false
    }
  }

  // Analytics cache
  static async getAnalytics(type: string, period: string) {
    return this.get(CACHE_KEYS.ANALYTICS(type, period))
  }

  static async setAnalytics(type: string, period: string, data: any) {
    return this.set(CACHE_KEYS.ANALYTICS(type, period), data, CACHE_TTL.ANALYTICS)
  }

  // Session-based caching for real-time data
  static async setSessionCache(sessionId: string, key: string, value: any, ttl = 300) {
    const sessionKey = `session:${sessionId}:${key}`
    return this.set(sessionKey, value, ttl)
  }

  static async getSessionCache(sessionId: string, key: string) {
    const sessionKey = `session:${sessionId}:${key}`
    return this.get(sessionKey)
  }

  static async clearSessionCache(sessionId: string) {
    try {
      const pattern = `session:${sessionId}:*`
      await this.deletePattern(pattern)
    } catch (error) {
      console.error('Error clearing session cache:', error)
    }
  }

  // Rate limiting helpers
  static async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const key = `rate_limit:${identifier}`
      const current = await kv.get(key) as number || 0
      
      if (current >= limit) {
        return { allowed: false, remaining: 0 }
      }
      
      const pipeline = kv.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, windowSeconds)
      await pipeline.exec()
      
      return { allowed: true, remaining: limit - current - 1 }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true, remaining: limit } // Fail open
    }
  }
}

export default CacheService