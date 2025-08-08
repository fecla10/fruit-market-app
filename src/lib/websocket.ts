import { io, Socket } from 'socket.io-client'

export interface PriceUpdate {
  symbol: string
  price: number
  change: number
  changePercentage: number
  volume?: number
  timestamp: Date
}

export interface AlertNotification {
  id: string
  type: 'PRICE_ALERT' | 'VOLUME_ALERT' | 'MARKET_NEWS'
  title: string
  message: string
  fruitSymbol?: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high'
}

export interface MarketUpdate {
  type: 'MARKET_OPEN' | 'MARKET_CLOSE' | 'MARKET_STATUS'
  message: string
  timestamp: Date
}

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false
  private listeners: Map<string, Set<Function>> = new Map()

  constructor() {
    this.initializeSocket()
  }

  private initializeSocket() {
    if (typeof window === 'undefined') return

    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      autoConnect: false,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connection', { status: 'connected' })
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      this.isConnected = false
      this.emit('connection', { status: 'disconnected', reason })
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        this.emit('connection', { status: 'failed', error: error.message })
      }
    })

    // Price updates
    this.socket.on('price_update', (data: PriceUpdate) => {
      this.emit('priceUpdate', data)
    })

    this.socket.on('bulk_price_update', (data: PriceUpdate[]) => {
      this.emit('bulkPriceUpdate', data)
    })

    // Alert notifications
    this.socket.on('alert_triggered', (data: AlertNotification) => {
      this.emit('alertTriggered', data)
    })

    // Market updates
    this.socket.on('market_update', (data: MarketUpdate) => {
      this.emit('marketUpdate', data)
    })

    // System notifications
    this.socket.on('system_notification', (data: any) => {
      this.emit('systemNotification', data)
    })
  }

  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect()
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  // Subscribe to watchlist updates
  subscribeToWatchlist(symbols: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_watchlist', { symbols })
    }
  }

  // Unsubscribe from watchlist updates
  unsubscribeFromWatchlist(symbols: string[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_watchlist', { symbols })
    }
  }

  // Subscribe to specific fruit updates
  subscribeToFruit(symbol: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_fruit', { symbol })
    }
  }

  // Unsubscribe from specific fruit updates
  unsubscribeFromFruit(symbol: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe_fruit', { symbol })
    }
  }

  // Subscribe to user alerts
  subscribeToUserAlerts(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe_user_alerts', { userId })
    }
  }

  // Generic event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  off(event: string, callback?: Function) {
    if (callback) {
      this.listeners.get(event)?.delete(callback)
    } else {
      this.listeners.delete(event)
    }
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in WebSocket event handler for ${event}:`, error)
      }
    })
  }

  // Connection status
  get connected() {
    return this.isConnected
  }

  get connectionId() {
    return this.socket?.id
  }

  // Send custom messages
  send(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data)
    }
  }

  // Cleanup
  destroy() {
    this.listeners.clear()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

// Singleton instance
export const wsService = new WebSocketService()

// Auto-connect when window loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    wsService.connect()
  })

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    wsService.destroy()
  })

  // Handle visibility changes (pause/resume connection)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, we could pause some subscriptions
      console.log('Page hidden - WebSocket still connected')
    } else {
      // Page is visible again, ensure we're connected
      if (!wsService.connected) {
        wsService.connect()
      }
    }
  })
}

export default wsService