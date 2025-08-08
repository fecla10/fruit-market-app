import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { MCPService } from '@/lib/mcp'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

let io: SocketIOServer | null = null

// Initialize Socket.IO server
function initializeSocketIO() {
  if (io) return io

  // Create HTTP server for Socket.IO
  const httpServer = new HTTPServer()
  
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  // Connection handling
  io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id)

    // Store user session in socket
    socket.on('authenticate', async (data) => {
      try {
        // Verify user session
        const session = await getServerSession(authOptions)
        if (session?.user) {
          socket.data.user = session.user
          socket.join(`user:${session.user.id}`)
          console.log(`User ${session.user.email} authenticated on socket ${socket.id}`)
        }
      } catch (error) {
        console.error('Socket authentication error:', error)
        socket.emit('auth_error', { message: 'Authentication failed' })
      }
    })

    // Watchlist subscriptions
    socket.on('subscribe_watchlist', (data) => {
      const { symbols } = data
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.join(`price:${symbol}`)
        })
        console.log(`Socket ${socket.id} subscribed to watchlist:`, symbols)
        socket.emit('subscribed', { type: 'watchlist', symbols })
      }
    })

    socket.on('unsubscribe_watchlist', (data) => {
      const { symbols } = data
      if (Array.isArray(symbols)) {
        symbols.forEach(symbol => {
          socket.leave(`price:${symbol}`)
        })
        console.log(`Socket ${socket.id} unsubscribed from watchlist:`, symbols)
      }
    })

    // Individual fruit subscriptions
    socket.on('subscribe_fruit', (data) => {
      const { symbol } = data
      if (symbol) {
        socket.join(`price:${symbol}`)
        console.log(`Socket ${socket.id} subscribed to fruit:`, symbol)
        socket.emit('subscribed', { type: 'fruit', symbol })
      }
    })

    socket.on('unsubscribe_fruit', (data) => {
      const { symbol } = data
      if (symbol) {
        socket.leave(`price:${symbol}`)
        console.log(`Socket ${socket.id} unsubscribed from fruit:`, symbol)
      }
    })

    // User alert subscriptions
    socket.on('subscribe_user_alerts', (data) => {
      const { userId } = data
      if (userId && socket.data.user?.id === userId) {
        socket.join(`alerts:${userId}`)
        console.log(`Socket ${socket.id} subscribed to user alerts:`, userId)
        socket.emit('subscribed', { type: 'alerts', userId })
      }
    })

    // Ping/pong for connection health
    socket.on('ping', (data) => {
      socket.emit('pong', data)
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket ${socket.id} disconnected:`, reason)
    })

    // Send connection confirmation
    socket.emit('connected', { 
      socketId: socket.id, 
      timestamp: Date.now() 
    })
  })

  return io
}

// API endpoint for Socket.IO
export async function GET(request: NextRequest) {
  return MCPService.withMCP(async (req, context) => {
    if (!io) {
      initializeSocketIO()
    }

    // Return connection info
    const response = MCPService.createResponse(
      true,
      {
        status: 'Socket.IO server running',
        connectedClients: io?.engine?.clientsCount || 0,
        timestamp: Date.now()
      },
      undefined,
      context
    )

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })
  })(request)
}

// Broadcast price updates
function broadcastPriceUpdate(symbol: string, priceData: any) {
  if (io) {
    io.to(`price:${symbol}`).emit('price_update', {
      symbol,
      ...priceData,
      timestamp: new Date()
    })
  }
}

// Broadcast bulk price updates
function broadcastBulkPriceUpdate(updates: Array<{ symbol: string; [key: string]: any }>) {
  if (io) {
    updates.forEach(update => {
      io?.to(`price:${update.symbol}`).emit('price_update', {
        ...update,
        timestamp: new Date()
      })
    })

    // Also send as bulk update for efficiency
    io.emit('bulk_price_update', updates.map(update => ({
      ...update,
      timestamp: new Date()
    })))
  }
}

// Send alert to specific user
function sendUserAlert(userId: string, alertData: any) {
  if (io) {
    io.to(`alerts:${userId}`).emit('alert_triggered', {
      ...alertData,
      timestamp: new Date()
    })
  }
}

// Send market update to all connected clients
function broadcastMarketUpdate(updateData: any) {
  if (io) {
    io.emit('market_update', {
      ...updateData,
      timestamp: new Date()
    })
  }
}

// Send system notification
function sendSystemNotification(notification: any, targetRoom?: string) {
  if (io) {
    const target = targetRoom ? io.to(targetRoom) : io
    target.emit('system_notification', {
      ...notification,
      timestamp: new Date()
    })
  }
}

// Get Socket.IO server instance (for other parts of the app)
function getSocketIOServer() {
  if (!io) {
    initializeSocketIO()
  }
  return io
}

// Health check for WebSocket server
async function checkWebSocketHealth() {
  try {
    const server = getSocketIOServer()
    return {
      status: 'healthy',
      connectedClients: server?.engine?.clientsCount || 0,
      timestamp: Date.now()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }
  }
}