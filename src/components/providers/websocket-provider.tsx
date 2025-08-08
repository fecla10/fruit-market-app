"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { wsService } from '@/lib/websocket'
import { FloatingNotification } from '@/components/notifications/notification-center'

interface WebSocketContextType {
  connected: boolean
  connecting: boolean
  error?: string
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  connecting: false,
  reconnect: () => {},
})

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Don't connect during SSR or if session is loading
    if (typeof window === 'undefined' || status === 'loading') {
      return
    }

    const handleConnection = (data: { status: string; reason?: string; error?: string }) => {
      switch (data.status) {
        case 'connected':
          console.log('WebSocket Provider: Connected')
          setConnected(true)
          setConnecting(false)
          setError(undefined)
          
          // Subscribe to user-specific events if authenticated
          if (session?.user?.id) {
            wsService.subscribeToUserAlerts(session.user.id)
            console.log('WebSocket Provider: Subscribed to user alerts')
          }
          break
          
        case 'disconnected':
          console.log('WebSocket Provider: Disconnected')
          setConnected(false)
          setConnecting(false)
          break
          
        case 'failed':
          console.error('WebSocket Provider: Connection failed', data.error)
          setConnected(false)
          setConnecting(false)
          setError(data.error)
          break
      }
    }

    // Set up connection event listener
    const unsubscribe = wsService.on('connection', handleConnection)

    // Initialize connection
    if (!wsService.connected) {
      console.log('WebSocket Provider: Initializing connection')
      setConnecting(true)
      wsService.connect()
    }

    return () => {
      unsubscribe()
    }
  }, [session?.user?.id, status])

  // Handle session changes
  useEffect(() => {
    if (connected && session?.user?.id) {
      // Re-subscribe to user alerts when session changes
      wsService.subscribeToUserAlerts(session.user.id)
    }
  }, [connected, session?.user?.id])

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !connected && !connecting) {
        // Page became visible and we're not connected - try to reconnect
        console.log('WebSocket Provider: Page visible, reconnecting...')
        setConnecting(true)
        wsService.connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connected, connecting])

  const reconnect = () => {
    if (!connected && !connecting) {
      console.log('WebSocket Provider: Manual reconnect')
      setConnecting(true)
      setError(undefined)
      wsService.connect()
    }
  }

  const contextValue: WebSocketContextType = {
    connected,
    connecting,
    error,
    reconnect,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
      {/* Show floating notifications when connected */}
      {connected && <FloatingNotification />}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

// Connection status indicator component
export function WebSocketStatus() {
  const { connected, connecting, error, reconnect } = useWebSocketContext()

  if (connecting) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Connecting...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-red-600">Offline</span>
        <button
          onClick={reconnect}
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span>Live</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="h-2 w-2 rounded-full bg-gray-400" />
      <span>Offline</span>
    </div>
  )
}