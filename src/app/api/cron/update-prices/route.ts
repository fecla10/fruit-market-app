import { NextRequest } from 'next/server'
import { MCPService } from '@/lib/mcp'
import { prisma } from '@/lib/db'
import { broadcastBulkPriceUpdate } from '@/lib/realtime'
import CacheService from '@/lib/kv'

// Cron job to update fruit prices every 5 minutes
export async function GET(request: NextRequest) {
  return MCPService.withMCP(async (req, context) => {
    const startTime = Date.now()
    
    try {
      console.log('Starting price update cron job...')
      
      // Verify this is a legitimate cron request
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response(
          JSON.stringify(MCPService.createResponse(false, null, 'Unauthorized')),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Get all active fruits
      const fruits = await prisma.fruit.findMany({
        where: { active: true },
        select: { id: true, symbol: true, name: true, category: true }
      })

      if (fruits.length === 0) {
        return new Response(
          JSON.stringify(MCPService.createResponse(true, { message: 'No fruits to update' })),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      const priceUpdates: any[] = []
      const newPrices: any[] = []

      // Generate mock price data for each fruit
      for (const fruit of fruits) {
        try {
          // Get the last price for this fruit
          const lastPrice = await prisma.price.findFirst({
            where: { fruitId: fruit.id },
            orderBy: { date: 'desc' },
          })

          // Generate realistic price movement
          const basePrice = lastPrice?.close || generateBasePrice(fruit.category)
          const volatility = getCategoryVolatility(fruit.category)
          const change = (Math.random() - 0.5) * 2 * volatility * basePrice
          const newClose = Math.max(0.01, basePrice + change)
          
          // Generate OHLC data
          const high = newClose + (Math.random() * volatility * newClose)
          const low = newClose - (Math.random() * volatility * newClose)
          const open = low + Math.random() * (high - low)
          const volume = Math.floor(Math.random() * 10000) + 1000

          // Create new price record
          const priceData = {
            fruitId: fruit.id,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(newClose.toFixed(2)),
            volume,
            date: new Date(),
            source: 'MOCK_GENERATOR',
            region: 'US',
          }

          newPrices.push(priceData)

          // Prepare WebSocket update
          const changeAmount = lastPrice ? newClose - lastPrice.close : 0
          const changePercentage = lastPrice ? (changeAmount / lastPrice.close) * 100 : 0

          priceUpdates.push({
            symbol: fruit.symbol,
            price: newClose,
            change: parseFloat(changeAmount.toFixed(2)),
            changePercentage: parseFloat(changePercentage.toFixed(2)),
            volume,
            timestamp: new Date(),
          })

          // Update cache
          await CacheService.setPrices(fruit.id, '1m', [priceData], true)

        } catch (error) {
          console.error(`Error updating price for fruit ${fruit.symbol}:`, error)
        }
      }

      // Bulk insert new prices
      if (newPrices.length > 0) {
        await prisma.price.createMany({
          data: newPrices,
          skipDuplicates: true
        })
      }

      // Broadcast price updates via WebSocket
      if (priceUpdates.length > 0) {
        broadcastBulkPriceUpdate(priceUpdates)
      }

      // Invalidate relevant caches
      await CacheService.del('fruits:all')

      const processingTime = Date.now() - startTime
      console.log(`Price update completed: ${newPrices.length} prices updated in ${processingTime}ms`)

      const response = MCPService.createResponse(
        true,
        {
          updatedCount: newPrices.length,
          processingTime,
          timestamp: Date.now()
        },
        undefined,
        context,
        processingTime
      )

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Price update cron job failed:', error)
      
      const response = MCPService.createResponse(
        false,
        null,
        error instanceof Error ? error.message : 'Unknown error',
        context,
        Date.now() - startTime
      )

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })(request)
}

// Helper function to generate base prices based on fruit category
function generateBasePrice(category: string): number {
  const basePrices: Record<string, number> = {
    'citrus': 2.50,
    'tropical': 4.00,
    'stone': 3.25,
    'berry': 5.50,
    'apple': 2.75,
    'exotic': 8.00,
    'vegetable': 1.85
  }
  
  return basePrices[category.toLowerCase()] || 3.00
}

// Helper function to get volatility based on fruit category
function getCategoryVolatility(category: string): number {
  const volatilities: Record<string, number> = {
    'citrus': 0.05,
    'tropical': 0.08,
    'stone': 0.06,
    'berry': 0.12,
    'apple': 0.04,
    'exotic': 0.15,
    'vegetable': 0.07
  }
  
  return volatilities[category.toLowerCase()] || 0.08
}