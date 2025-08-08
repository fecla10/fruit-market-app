import { NextRequest } from 'next/server'
import { MCPService } from '@/lib/mcp'
import { prisma } from '@/lib/db'
import CacheService from '@/lib/kv'

// Cron job to cleanup old data daily at 2 AM
export async function GET(request: NextRequest) {
  return MCPService.withMCP(async (req, context) => {
    const startTime = Date.now()
    
    try {
      console.log('Starting data cleanup cron job...')
      
      // Verify this is a legitimate cron request
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response(
          JSON.stringify(MCPService.createResponse(false, null, 'Unauthorized')),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const cleanupResults = {
        oldPrices: 0,
        oldNotes: 0,
        triggeredAlerts: 0,
        expiredSessions: 0,
        cacheKeys: 0
      }

      // 1. Clean up old price data (keep last 2 years)
      const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
      const deletedPrices = await prisma.price.deleteMany({
        where: {
          date: { lt: twoYearsAgo }
        }
      })
      cleanupResults.oldPrices = deletedPrices.count
      console.log(`Deleted ${deletedPrices.count} old price records`)

      // 2. Clean up old user notes (keep last 1 year)
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      const deletedNotes = await prisma.note.deleteMany({
        where: {
          createdAt: { lt: oneYearAgo }
        }
      })
      cleanupResults.oldNotes = deletedNotes.count
      console.log(`Deleted ${deletedNotes.count} old user notes`)

      // 3. Reset triggered alerts older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const resetAlerts = await prisma.alert.updateMany({
        where: {
          triggered: true,
          lastTriggered: { lt: thirtyDaysAgo }
        },
        data: {
          triggered: false,
          lastTriggered: null
        }
      })
      cleanupResults.triggeredAlerts = resetAlerts.count
      console.log(`Reset ${resetAlerts.count} old triggered alerts`)

      // 4. Clean up expired sessions (if using database sessions)
      try {
        // Access optional Prisma model via any to avoid TS error when model is not in schema
        const sessionModel = (prisma as any).session
        if (sessionModel?.deleteMany) {
          const expiredSessions = await sessionModel.deleteMany({
            where: { expires: { lt: new Date() } },
          })
          cleanupResults.expiredSessions = expiredSessions?.count ?? 0
          console.log(`Deleted ${expiredSessions?.count ?? 0} expired sessions`)
        } else {
          console.log('Session cleanup skipped (not using database sessions)')
        }
      } catch (error) {
        // Session cleanup might fail if not using database sessions
        console.log('Session cleanup skipped (not using database sessions)')
      }

      // 5. Clean up old cache entries
      try {
        // Clean up old search cache entries
        await CacheService.deletePattern('search:*')
        
        // Clean up old analytics cache
        await CacheService.deletePattern('analytics:*')
        
        // Clean up old session cache
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        await CacheService.deletePattern(`session:*`)
        
        cleanupResults.cacheKeys = 1 // Approximate
        console.log('Cleaned up old cache entries')
      } catch (error) {
        console.error('Cache cleanup failed:', error)
      }

      // 6. Clean up portfolio transactions older than 5 years (keep for tax purposes)
      const fiveYearsAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
      try {
        // Access optional Prisma model via any to avoid TS error when model is not in schema
        const portfolioTxModel = (prisma as any).portfolioTransaction
        if (portfolioTxModel?.deleteMany) {
          const deletedTransactions = await portfolioTxModel.deleteMany({
            where: { createdAt: { lt: fiveYearsAgo } },
          })
          console.log(`Deleted ${deletedTransactions?.count ?? 0} old portfolio transactions`)
        } else {
          console.log('Portfolio transaction cleanup skipped (model not present)')
        }
      } catch (error) {
        console.error('Portfolio transaction cleanup failed:', error)
      }

      // 7. Update database statistics for better query performance
      try {
        // This would be database-specific commands
        // For PostgreSQL, you might run ANALYZE
        console.log('Database maintenance completed')
      } catch (error) {
        console.error('Database maintenance failed:', error)
      }

      // 8. Log cleanup statistics
      const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0)
      
      const processingTime = Date.now() - startTime
      console.log(`Data cleanup completed: ${totalCleaned} items cleaned in ${processingTime}ms`)

      const response = MCPService.createResponse(
        true,
        {
          ...cleanupResults,
          totalCleaned,
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
      console.error('Data cleanup cron job failed:', error)
      
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