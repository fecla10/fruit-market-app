// Vercel MCP (Model Context Protocol) integration
import { NextRequest } from 'next/server'

export interface MCPContext {
  user: {
    id: string
    email?: string
    role?: string
  }
  session: {
    id: string
    timestamp: number
  }
  request: {
    path: string
    method: string
    userAgent?: string
    ip?: string
  }
  features: {
    realtime: boolean
    notifications: boolean
    analytics: boolean
  }
}

export interface MCPResponse {
  success: boolean
  data?: any
  error?: string
  context?: MCPContext
  metadata?: {
    timestamp: number
    requestId: string
    cacheHit?: boolean
    processingTime?: number
  }
}

export class MCPService {
  private static instance: MCPService
  
  private constructor() {}
  
  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService()
    }
    return MCPService.instance
  }

  // Create MCP context from Next.js request
  static createContext(request: NextRequest, user?: any): MCPContext {
    return {
      user: {
        id: user?.id || 'anonymous',
        email: user?.email,
        role: user?.role || 'user'
      },
      session: {
        id: request.headers.get('x-session-id') || this.generateSessionId(),
        timestamp: Date.now()
      },
      request: {
        path: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.ip || request.headers.get('x-forwarded-for') || undefined
      },
      features: {
        realtime: this.supportsRealtime(request),
        notifications: this.supportsNotifications(request),
        analytics: true
      }
    }
  }

  // Generate standard MCP response
  static createResponse(
    success: boolean,
    data?: any,
    error?: string,
    context?: MCPContext,
    processingTime?: number
  ): MCPResponse {
    return {
      success,
      data,
      error,
      context,
      metadata: {
        timestamp: Date.now(),
        requestId: this.generateRequestId(),
        processingTime
      }
    }
  }

  // Helper to check if client supports real-time features
  private static supportsRealtime(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || ''
    return !userAgent.includes('bot') && !userAgent.includes('crawler')
  }

  // Helper to check if client supports notifications
  private static supportsNotifications(request: NextRequest): boolean {
    return request.headers.get('accept')?.includes('text/event-stream') || false
  }

  // Generate unique session ID
  private static generateSessionId(): string {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate unique request ID
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Middleware for MCP context injection
  static withMCP(handler: (request: NextRequest, context: MCPContext) => Promise<Response>) {
    return async (request: NextRequest) => {
      const startTime = Date.now()
      
      try {
        // Create MCP context (user would be extracted from session/token)
        const context = this.createContext(request)
        
        // Call the actual handler
        const response = await handler(request, context)
        
        // Add MCP headers to response
        const mcpHeaders = this.createMCPHeaders(context, Date.now() - startTime)
        mcpHeaders.forEach((value, key) => {
          response.headers.set(key, value)
        })
        
        return response
      } catch (error) {
        const context = this.createContext(request)
        const errorResponse = this.createResponse(
          false,
          null,
          error instanceof Error ? error.message : 'Internal server error',
          context,
          Date.now() - startTime
        )
        
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...this.createMCPHeaders(context, Date.now() - startTime)
          }
        })
      }
    }
  }

  // Create MCP-specific headers
  private static createMCPHeaders(context: MCPContext, processingTime: number): Headers {
    const headers = new Headers()
    
    headers.set('X-MCP-Session-ID', context.session.id)
    headers.set('X-MCP-User-ID', context.user.id)
    headers.set('X-MCP-Processing-Time', processingTime.toString())
    headers.set('X-MCP-Timestamp', context.session.timestamp.toString())
    headers.set('X-MCP-Features', JSON.stringify(context.features))
    
    return headers
  }

  // Feature flag checking
  static hasFeature(context: MCPContext, feature: keyof MCPContext['features']): boolean {
    return context.features[feature]
  }

  // Analytics event tracking
  static async trackEvent(context: MCPContext, event: string, properties?: Record<string, any>) {
    try {
      // In a real implementation, this would send to your analytics service
      const eventData = {
        event,
        properties,
        user: context.user,
        session: context.session,
        request: context.request,
        timestamp: Date.now()
      }
      
      // For now, just log (replace with actual analytics service)
      console.log('MCP Analytics Event:', eventData)
      
      // You could also store in Vercel KV for later processing
      // await kv.lpush('analytics:events', JSON.stringify(eventData))
      
    } catch (error) {
      console.error('Failed to track MCP event:', error)
    }
  }

  // Rate limiting with MCP context
  static async checkRateLimit(context: MCPContext, identifier?: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = identifier || `${context.user.id}:${context.request.path}`
    
    // Implement rate limiting based on user role
    const limits = {
      admin: { requests: 1000, window: 3600 },
      premium: { requests: 500, window: 3600 },
      user: { requests: 100, window: 3600 },
    }
    
    const userRole = context.user.role || 'user'
    const limit = limits[userRole as keyof typeof limits] || limits.user
    
    // Use your cache service for rate limiting
    try {
      // This is a simplified implementation
      return { allowed: true, remaining: limit.requests }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return { allowed: true, remaining: 0 }
    }
  }

  // WebSocket connection management
  static createWebSocketContext(context: MCPContext) {
    return {
      connectionId: `ws_${context.session.id}`,
      userId: context.user.id,
      features: context.features,
      subscriptions: new Set<string>(),
      lastActivity: Date.now()
    }
  }

  // Error handling with MCP context
  static handleError(error: Error, context?: MCPContext): MCPResponse {
    console.error('MCP Error:', {
      error: error.message,
      stack: error.stack,
      context
    })
    
    return this.createResponse(
      false,
      null,
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      context
    )
  }

  // Health check endpoint
  static async healthCheck(): Promise<MCPResponse> {
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      services: {
        database: true, // Check database connection
        cache: true,    // Check cache connection
        websocket: true // Check WebSocket server
      }
    }
    
    return this.createResponse(true, health)
  }

  // Feature toggles
  static getFeatureFlags(context: MCPContext): Record<string, boolean> {
    const baseFeatures = {
      realtime: context.features.realtime,
      notifications: context.features.notifications,
      analytics: context.features.analytics,
    }
    
    // Add role-based features
    const roleFeatures = {
      admin: {
        ...baseFeatures,
        adminPanel: true,
        advancedAnalytics: true,
        bulkOperations: true
      },
      premium: {
        ...baseFeatures,
        advancedCharts: true,
        exportData: true,
        prioritySupport: true
      },
      user: baseFeatures
    }
    
    const userRole = context.user.role || 'user'
    return roleFeatures[userRole as keyof typeof roleFeatures] || roleFeatures.user
  }
}

// Export default instance
export default MCPService.getInstance()