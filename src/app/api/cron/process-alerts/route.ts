import { NextRequest } from 'next/server'
import { MCPService } from '@/lib/mcp'
import { prisma } from '@/lib/db'
import { sendUserAlert } from '@/lib/realtime'
import CacheService from '@/lib/kv'

// Cron job to process alert conditions every minute
export async function GET(request: NextRequest) {
  return MCPService.withMCP(async (req, context) => {
    const startTime = Date.now()
    
    try {
      console.log('Starting alert processing cron job...')
      
      // Verify this is a legitimate cron request
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response(
          JSON.stringify(MCPService.createResponse(false, null, 'Unauthorized')),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Get all active alerts
      const alerts = await prisma.alert.findMany({
        where: {
          active: true,
          triggered: false,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      })

      if (alerts.length === 0) {
        return new Response(
          JSON.stringify(MCPService.createResponse(true, { message: 'No active alerts to process' })),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      const triggeredAlerts: string[] = []
      const notifications: any[] = []

      // Process each alert
      for (const alert of alerts) {
        try {
          // Fetch fruit details (Alert model has only fruitId)
          const fruit = await prisma.fruit.findUnique({
            where: { id: alert.fruitId },
            select: { id: true, name: true },
          })
          if (!fruit) {
            console.log(`Fruit not found for alert ${alert.id}`)
            continue
          }
          const computedSymbol = fruit.name.slice(0, 3).toUpperCase()
          // Get the latest price for this fruit
          const latestPrice = await prisma.price.findFirst({
            where: { fruitId: alert.fruitId },
            orderBy: { date: 'desc' },
          })

          if (!latestPrice) {
            console.log(`No price data found for fruit ${computedSymbol}`)
            continue
          }

          let shouldTrigger = false
          let alertMessage = ''

          // Check alert conditions
          switch (alert.type) {
            case 'PRICE_ABOVE':
              shouldTrigger = latestPrice.close > alert.threshold
              alertMessage = `${fruit.name} price reached $${latestPrice.close.toFixed(2)} (above $${alert.threshold})`
              break

            case 'PRICE_BELOW':
              shouldTrigger = latestPrice.close < alert.threshold
              alertMessage = `${fruit.name} price dropped to $${latestPrice.close.toFixed(2)} (below $${alert.threshold})`
              break

            case 'PERCENT_CHANGE':
              // Get price from 24 hours ago for comparison
              const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
              const previousPrice = await prisma.price.findFirst({
                where: {
                  fruitId: alert.fruitId,
                  date: { lte: dayAgo }
                },
                orderBy: { date: 'desc' }
              })

              if (previousPrice) {
                const percentChange = ((latestPrice.close - previousPrice.close) / previousPrice.close) * 100
                shouldTrigger = Math.abs(percentChange) >= alert.threshold
                alertMessage = `${fruit.name} changed ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}% in 24h`
              }
              break

            case 'VOLUME_SPIKE':
              // Get average volume from last 7 days
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              const avgVolumeResult = await prisma.price.aggregate({
                where: {
                  fruitId: alert.fruitId,
                  date: { gte: weekAgo }
                },
                _avg: { volume: true }
              })

              if (avgVolumeResult._avg.volume && latestPrice.volume) {
                const volumeIncrease = ((latestPrice.volume - avgVolumeResult._avg.volume) / avgVolumeResult._avg.volume) * 100
                shouldTrigger = volumeIncrease >= alert.threshold
                alertMessage = `${fruit.name} volume spiked +${volumeIncrease.toFixed(2)}% (${latestPrice.volume.toLocaleString()})`
              }
              break
          }

          if (shouldTrigger) {
            // Mark alert as triggered
            await prisma.alert.update({
              where: { id: alert.id },
              data: {
                triggered: true,
                lastTriggered: new Date()
              }
            })

            triggeredAlerts.push(alert.id)

            // Create notification
            const notification = {
              id: `alert_${alert.id}_${Date.now()}`,
              type: 'PRICE_ALERT',
              title: `Alert Triggered: ${fruit.name}`,
              message: alertMessage,
              fruitSymbol: computedSymbol,
              timestamp: new Date(),
              priority: determineAlertPriority(alert.type, alert.threshold),
              userId: alert.userId
            }

            notifications.push(notification)

            // Send real-time notification
            sendUserAlert(alert.userId, notification)

            console.log(`Alert triggered for user ${alert.user?.email}: ${alertMessage}`)
          }

        } catch (error) {
          console.error(`Error processing alert ${alert.id}:`, error)
        }
      }

      // Update cache with triggered alerts
      if (triggeredAlerts.length > 0) {
        // Invalidate user alert caches
        const userIds = [...new Set(notifications.map(n => n.userId))]
        await Promise.all(
          userIds.map(userId => CacheService.del(`alerts:${userId}`))
        )
      }

      const processingTime = Date.now() - startTime
      console.log(`Alert processing completed: ${triggeredAlerts.length} alerts triggered in ${processingTime}ms`)

      const response = MCPService.createResponse(
        true,
        {
          processedCount: alerts.length,
          triggeredCount: triggeredAlerts.length,
          notificationsSent: notifications.length,
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
      console.error('Alert processing cron job failed:', error)
      
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

// Helper function to determine alert priority
function determineAlertPriority(type: string, threshold: number): 'low' | 'medium' | 'high' {
  switch (type) {
    case 'PRICE_ABOVE':
    case 'PRICE_BELOW':
      return threshold > 10 ? 'high' : threshold > 5 ? 'medium' : 'low'
    
    case 'PERCENT_CHANGE':
      return threshold > 20 ? 'high' : threshold > 10 ? 'medium' : 'low'
    
    case 'VOLUME_SPIKE':
      return threshold > 100 ? 'high' : threshold > 50 ? 'medium' : 'low'
    
    default:
      return 'medium'
  }
}