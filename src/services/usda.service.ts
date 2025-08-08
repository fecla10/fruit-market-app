import axios, { AxiosInstance, AxiosError } from 'axios'

interface USDAConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  retryCount: number
  retryDelay: number
}

interface USDAFruitData {
  ndbno: string
  name: string
  group: string
  ds: string
  manu?: string
}

interface USDASearchResult {
  list: {
    q: string
    sr: string
    ds: string
    start: number
    end: number
    total: number
    group: string
    sort: string
    item: USDAFruitData[]
  }
}

interface USDANutrientReport {
  foods: Array<{
    food: {
      sr: string
      type: string
      desc: string
    }
    nutrients: Array<{
      nutrient_id: number
      name: string
      group: string
      unit: string
      value: string
      gm: number
    }>
  }>
}

interface ProcessedFruitData {
  id: string
  name: string
  category: string
  unit: string
  price?: number
  volume?: number
  source: string
  region?: string
}

export class USDAService {
  private client: AxiosInstance
  private config: USDAConfig
  private rateLimitQueue: Array<() => Promise<any>> = []
  private lastRequestTime = 0
  private readonly MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

  constructor() {
    this.config = {
      apiKey: process.env.USDA_API_KEY || '',
      baseUrl: process.env.USDA_API_URL || 'https://api.nal.usda.gov/ndb',
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      params: {
        api_key: this.config.apiKey,
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await this.delay(this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      }
      
      this.lastRequestTime = Date.now()
      return config
    })

    // Response interceptor for retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any
        
        if (!config || config.retryCount >= this.config.retryCount) {
          return Promise.reject(error)
        }

        config.retryCount = (config.retryCount || 0) + 1
        
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, config.retryCount - 1)
        await this.delay(delay)
        
        return this.client.request(config)
      }
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Search for fruits in USDA database
   */
  async searchFruits(query: string, limit: number = 50): Promise<ProcessedFruitData[]> {
    try {
      const response = await this.client.get<USDASearchResult>('/search', {
        params: {
          q: query,
          ds: 'Standard Reference',
          max: limit,
          offset: 0,
          format: 'json',
        },
      })

      return this.processFruitData(response.data.list.item)
    } catch (error) {
      this.handleError(error as AxiosError, 'searchFruits')
      throw error
    }
  }

  /**
   * Get detailed nutrient report for a specific fruit
   */
  async getNutrientReport(ndbNo: string): Promise<USDANutrientReport> {
    try {
      const response = await this.client.get<USDANutrientReport>('/nutrients', {
        params: {
          ndbno: ndbNo,
          format: 'json',
        },
      })

      return response.data
    } catch (error) {
      this.handleError(error as AxiosError, 'getNutrientReport')
      throw error
    }
  }

  /**
   * Get fruit price data (simulated from nutritional data)
   */
  async getFruitPrices(fruitIds: string[]): Promise<Array<{
    fruitId: string
    open: number
    high: number
    low: number
    close: number
    volume?: number
    date: Date
    source: string
    region?: string
  }>> {
    try {
      const priceData = []
      
      for (const fruitId of fruitIds) {
        // Since USDA doesn't provide actual price data, we'll simulate it
        // In a real implementation, you'd integrate with agricultural market data
        const simulatedPrice = this.generateSimulatedPrice(fruitId)
        priceData.push(simulatedPrice)
      }

      return priceData
    } catch (error) {
      this.handleError(error as AxiosError, 'getFruitPrices')
      throw error
    }
  }

  /**
   * Batch update fruit data from USDA
   */
  async batchUpdateFruits(fruitNames: string[]): Promise<ProcessedFruitData[]> {
    const results: ProcessedFruitData[] = []
    
    for (const fruitName of fruitNames) {
      try {
        const fruits = await this.searchFruits(fruitName, 10)
        results.push(...fruits)
        
        // Rate limiting between batch requests
        await this.delay(this.MIN_REQUEST_INTERVAL)
      } catch (error) {
        console.error(`Failed to fetch data for ${fruitName}:`, error)
        continue
      }
    }

    return results
  }

  /**
   * Validate API connection and configuration
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.searchFruits('apple', 1)
      return true
    } catch (error) {
      console.error('USDA API connection validation failed:', error)
      return false
    }
  }

  private processFruitData(usdaData: USDAFruitData[]): ProcessedFruitData[] {
    return usdaData
      .filter(item => this.isFruitRelated(item.name))
      .map(item => ({
        id: item.ndbno,
        name: this.cleanFruitName(item.name),
        category: this.categorizesFruit(item.name),
        unit: 'per lb', // Default unit
        source: 'USDA',
      }))
  }

  private isFruitRelated(name: string): boolean {
    const fruitKeywords = [
      'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
      'raspberry', 'blackberry', 'cherry', 'peach', 'pear', 'plum',
      'apricot', 'kiwi', 'mango', 'pineapple', 'papaya', 'avocado',
      'lemon', 'lime', 'grapefruit', 'cantaloupe', 'watermelon',
      'honeydew', 'cranberry', 'pomegranate', 'fig', 'date'
    ]

    const lowerName = name.toLowerCase()
    return fruitKeywords.some(keyword => lowerName.includes(keyword))
  }

  private cleanFruitName(name: string): string {
    // Remove common USDA food database prefixes/suffixes
    return name
      .replace(/^[^,]+,\s*/, '') // Remove everything before first comma
      .replace(/\s*\(.*?\)/g, '') // Remove parenthetical information
      .replace(/\s*,.*$/, '') // Remove everything after comma
      .trim()
  }

  private categorizesFruit(name: string): string {
    const lowerName = name.toLowerCase()
    
    if (lowerName.includes('berry')) return 'Berries'
    if (lowerName.includes('citrus') || lowerName.includes('orange') || 
        lowerName.includes('lemon') || lowerName.includes('lime') || 
        lowerName.includes('grapefruit')) return 'Citrus'
    if (lowerName.includes('melon')) return 'Melons'
    if (lowerName.includes('stone') || lowerName.includes('peach') || 
        lowerName.includes('plum') || lowerName.includes('apricot')) return 'Stone Fruits'
    if (lowerName.includes('tropical') || lowerName.includes('mango') || 
        lowerName.includes('pineapple') || lowerName.includes('papaya')) return 'Tropical'
    
    return 'Other Fruits'
  }

  private generateSimulatedPrice(fruitId: string) {
    // Generate realistic-looking price data for demonstration
    const basePrice = Math.random() * 5 + 1 // $1-$6 per lb
    const volatility = 0.1
    
    const open = basePrice
    const high = open * (1 + Math.random() * volatility)
    const low = open * (1 - Math.random() * volatility)
    const close = low + Math.random() * (high - low)
    
    return {
      fruitId,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
      date: new Date(),
      source: 'USDA_SIMULATED',
      region: 'US_NATIONAL',
    }
  }

  private handleError(error: AxiosError, method: string) {
    console.error(`USDA Service ${method} error:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    })
  }
}

// Singleton instance
export const usdaService = new USDAService()