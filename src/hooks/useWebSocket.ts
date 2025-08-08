import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { wsService, PriceUpdate, AlertNotification, MarketUpdate } from '@/lib/websocket'

interface ConnectionStatus {
  connected: boolean
  connecting: boolean
  error?: string
}

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false, connecting: false })

  useEffect(() => {
    const handleConnection = (data: { status: string; reason?: string; error?: string }) => {
      switch (data.status) {
        case 'connected':
          setStatus({ connected: true, connecting: false })
          break
        case 'disconnected':
          setStatus({ connected: false, connecting: false })
          break
        case 'failed':
          setStatus({ connected: false, connecting: false, error: data.error })
          break
      }
    }

    const unsubscribe = wsService.on('connection', handleConnection)

    // Initial connection attempt
    if (!wsService.connected) {
      setStatus(prev => ({ ...prev, connecting: true }))
      wsService.connect()
    }

    return unsubscribe
  }, [])

  const reconnect = useCallback(() => {
    if (!wsService.connected) {
      setStatus({ connected: false, connecting: true, error: undefined })
      wsService.connect()
    }
  }, [])

  return {
    ...status,
    reconnect,
    wsService,
  }
}

export function usePriceUpdates(symbols?: string[]) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map())
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { connected } = useWebSocket()

  useEffect(() => {
    if (!connected) return

    const handlePriceUpdate = (update: PriceUpdate) => {
      setPrices(prev => {
        const newPrices = new Map(prev)
        newPrices.set(update.symbol, update)
        return newPrices
      })
      setLastUpdate(new Date())
    }

    const handleBulkPriceUpdate = (updates: PriceUpdate[]) => {
      setPrices(prev => {
        const newPrices = new Map(prev)
        updates.forEach(update => {
          newPrices.set(update.symbol, update)
        })
        return newPrices
      })
      setLastUpdate(new Date())
    }

    const unsubscribeSingle = wsService.on('priceUpdate', handlePriceUpdate)
    const unsubscribeBulk = wsService.on('bulkPriceUpdate', handleBulkPriceUpdate)

    // Subscribe to symbols if provided
    if (symbols && symbols.length > 0) {
      wsService.subscribeToWatchlist(symbols)
    }

    return () => {
      unsubscribeSingle()
      unsubscribeBulk()
      
      // Unsubscribe from symbols
      if (symbols && symbols.length > 0) {
        wsService.unsubscribeFromWatchlist(symbols)
      }
    }
  }, [connected, symbols])

  const getPrice = useCallback((symbol: string) => {
    return prices.get(symbol)
  }, [prices])

  const getPrices = useCallback(() => {
    return Array.from(prices.values())
  }, [prices])

  return {
    prices: getPrices(),
    pricesMap: prices,
    getPrice,
    lastUpdate,
    isConnected: connected,
  }
}

export function useAlertNotifications() {
  const [notifications, setNotifications] = useState<AlertNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { connected } = useWebSocket()
  const { data: session } = useSession()

  useEffect(() => {
    if (!connected || !session?.user?.id) return

    const handleAlertTriggered = (notification: AlertNotification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
      setUnreadCount(prev => prev + 1)
      
      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        })
      }
    }

    const unsubscribe = wsService.on('alertTriggered', handleAlertTriggered)

    // Subscribe to user alerts
    wsService.subscribeToUserAlerts(session.user.id)

    return unsubscribe
  }, [connected, session?.user?.id])

  const markAsRead = useCallback((notificationId?: string) => {
    if (notificationId) {
      // Mark specific notification as read (you'd implement this)
      setUnreadCount(prev => Math.max(0, prev - 1))
    } else {
      // Mark all as read
      setUnreadCount(0)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    requestNotificationPermission,
    isConnected: connected,
  }
}

export function useMarketUpdates() {
  const [updates, setUpdates] = useState<MarketUpdate[]>([])
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'unknown'>('unknown')
  const { connected } = useWebSocket()

  useEffect(() => {
    if (!connected) return

    const handleMarketUpdate = (update: MarketUpdate) => {
      setUpdates(prev => [update, ...prev].slice(0, 20)) // Keep last 20 updates
      
      // Update market status based on update type
      if (update.type === 'MARKET_OPEN') {
        setMarketStatus('open')
      } else if (update.type === 'MARKET_CLOSE') {
        setMarketStatus('closed')
      }
    }

    const unsubscribe = wsService.on('marketUpdate', handleMarketUpdate)

    return unsubscribe
  }, [connected])

  return {
    updates,
    marketStatus,
    isConnected: connected,
  }
}

export function useWatchlistLive(symbols: string[]) {
  const { prices, getPrice, lastUpdate } = usePriceUpdates(symbols)
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([])

  useEffect(() => {
    // Update subscription when symbols change
    const newSymbols = symbols.filter(s => !subscribedSymbols.includes(s))
    const removedSymbols = subscribedSymbols.filter(s => !symbols.includes(s))

    if (newSymbols.length > 0) {
      wsService.subscribeToWatchlist(newSymbols)
    }

    if (removedSymbols.length > 0) {
      wsService.unsubscribeFromWatchlist(removedSymbols)
    }

    setSubscribedSymbols(symbols)
  }, [symbols, subscribedSymbols])

  return {
    prices: symbols.map(symbol => getPrice(symbol)).filter(Boolean),
    getPrice,
    lastUpdate,
  }
}

export function useFruitLive(symbol: string) {
  const [price, setPrice] = useState<PriceUpdate | null>(null)
  const { connected } = useWebSocket()

  useEffect(() => {
    if (!connected || !symbol) return

    const handlePriceUpdate = (update: PriceUpdate) => {
      if (update.symbol === symbol) {
        setPrice(update)
      }
    }

    const unsubscribe = wsService.on('priceUpdate', handlePriceUpdate)
    
    // Subscribe to specific fruit
    wsService.subscribeToFruit(symbol)

    return () => {
      unsubscribe()
      wsService.unsubscribeFromFruit(symbol)
    }
  }, [connected, symbol])

  return {
    price,
    isConnected: connected,
  }
}

// Custom hook for connection health monitoring
export function useConnectionHealth() {
  const [health, setHealth] = useState({
    connected: false,
    latency: 0,
    lastPing: null as Date | null,
    reconnectCount: 0,
  })

  useEffect(() => {
    let pingInterval: NodeJS.Timeout
    let reconnectCount = 0

    const handleConnection = (data: { status: string }) => {
      if (data.status === 'connected') {
        setHealth(prev => ({ 
          ...prev, 
          connected: true,
          reconnectCount: reconnectCount++ 
        }))
        
        // Start ping monitoring
        pingInterval = setInterval(() => {
          const startTime = Date.now()
          wsService.send('ping', { timestamp: startTime })
        }, 30000) // Ping every 30 seconds
        
      } else {
        setHealth(prev => ({ ...prev, connected: false }))
        clearInterval(pingInterval)
      }
    }

    const handlePong = (data: { timestamp: number }) => {
      const latency = Date.now() - data.timestamp
      setHealth(prev => ({
        ...prev,
        latency,
        lastPing: new Date(),
      }))
    }

    const unsubscribeConnection = wsService.on('connection', handleConnection)
    const unsubscribePong = wsService.on('pong', handlePong)

    return () => {
      clearInterval(pingInterval)
      unsubscribeConnection()
      unsubscribePong()
    }
  }, [])

  return health
}