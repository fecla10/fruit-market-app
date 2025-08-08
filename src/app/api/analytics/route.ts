import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MCPService } from '@/lib/mcp'
import { AnalyticsService } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  return MCPService.withMCP(async (req, context) => {
    try {
      const { searchParams } = req.nextUrl
      const type = searchParams.get('type') || 'market'
      const period = searchParams.get('period') || '7d'
      const userId = searchParams.get('userId')
      const fruitId = searchParams.get('fruitId')

      // Get user session for authentication
      const session: any = await getServerSession(authOptions)
      
      let analyticsData

      switch (type) {
        case 'market':
          analyticsData = await AnalyticsService.getMarketAnalytics(period)
          break

        case 'user':
          // Require authentication for user analytics
          if (!session?.user) {
            const response = MCPService.createResponse(
              false,
              null,
              'Authentication required',
              context
            )
            return new Response(JSON.stringify(response), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          // Users can only access their own analytics unless they're admin
          const targetUserId = userId || session.user.id
          if (targetUserId !== session.user.id && session.user.role !== 'admin') {
            const response = MCPService.createResponse(
              false,
              null,
              'Insufficient permissions',
              context
            )
            return new Response(JSON.stringify(response), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          analyticsData = await AnalyticsService.getUserAnalytics(targetUserId)
          break

        case 'fruit':
          if (!fruitId) {
            const response = MCPService.createResponse(
              false,
              null,
              'Fruit ID is required for fruit analytics',
              context
            )
            return new Response(JSON.stringify(response), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          analyticsData = await AnalyticsService.getFruitAnalytics(fruitId)
          break

        default:
          const response = MCPService.createResponse(
            false,
            null,
            'Invalid analytics type. Supported types: market, user, fruit',
            context
          )
          return new Response(JSON.stringify(response), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
      }

      // Track analytics request
      await MCPService.trackEvent(context, 'analytics_requested', {
        type,
        period,
        userId: session?.user?.id,
        targetUserId: userId,
        fruitId
      })

      const response = MCPService.createResponse(
        true,
        analyticsData,
        undefined,
        context
      )

      return new Response(JSON.stringify(response), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': type === 'market' ? 'public, max-age=300' : 'private, max-age=60'
        }
      })

    } catch (error) {
      console.error('Analytics API error:', error)
      
      const response = MCPService.createResponse(
        false,
        null,
        error instanceof Error ? error.message : 'Failed to get analytics data',
        context
      )

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })(request)
}