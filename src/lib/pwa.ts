// PWA utilities and service worker management
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export class PWAManager {
  private static instance: PWAManager
  private installPrompt: BeforeInstallPromptEvent | null = null
  private swRegistration: ServiceWorkerRegistration | null = null
  private isOnline = true
  private retryQueue: Array<() => Promise<void>> = []

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializePWA()
    }
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  private async initializePWA() {
    // Register service worker
    await this.registerServiceWorker()
    
    // Set up install prompt
    this.setupInstallPrompt()
    
    // Set up network monitoring
    this.setupNetworkMonitoring()
    
    // Set up push notifications
    this.setupPushNotifications()
    
    // Set up background sync
    this.setupBackgroundSync()
  }

  // Service Worker Management
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        this.swRegistration = registration
        
        console.log('[PWA] Service Worker registered successfully')
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification()
              }
            })
          }
        })

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data)
        })

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error)
      }
    }
  }

  private showUpdateNotification() {
    toast.info('App Update Available', {
      description: 'A new version is available. Restart to update.',
      action: {
        label: 'Restart',
        onClick: () => this.updateServiceWorker()
      },
      duration: 10000
    })
  }

  private updateServiceWorker() {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  // Install Prompt Management
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      this.installPrompt = event
      this.showInstallBanner()
    })

    // Track install completion
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully')
      this.installPrompt = null
      toast.success('App Installed', {
        description: 'Fruit Market Tracker has been installed!'
      })
    })
  }

  private showInstallBanner() {
    // Show install prompt after 30 seconds if not dismissed
    setTimeout(() => {
      if (this.installPrompt && !this.isAppInstalled()) {
        toast.info('Install App', {
          description: 'Install Fruit Market Tracker for a better experience',
          action: {
            label: 'Install',
            onClick: () => this.promptInstall()
          },
          duration: 15000
        })
      }
    }, 30000)
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      toast.error('Installation not available')
      return false
    }

    try {
      await this.installPrompt.prompt()
      const { outcome } = await this.installPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt')
        return true
      } else {
        console.log('[PWA] User dismissed install prompt')
        return false
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error)
      return false
    } finally {
      this.installPrompt = null
    }
  }

  public isInstallAvailable(): boolean {
    return !!this.installPrompt
  }

  private isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  // Network Monitoring
  private setupNetworkMonitoring() {
    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      this.isOnline = true
      toast.success('Back Online', {
        description: 'Connection restored. Syncing data...'
      })
      this.processRetryQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      toast.warning('You\'re Offline', {
        description: 'Some features may be limited'
      })
    })
  }

  public getNetworkStatus(): boolean {
    return this.isOnline
  }

  // Background Sync and Retry Queue
  private setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('[PWA] Background sync is supported')
    }
  }

  public async addToRetryQueue(operation: () => Promise<void>) {
    this.retryQueue.push(operation)
    
    if ('serviceWorker' in navigator && this.swRegistration) {
      try {
        await this.swRegistration.sync.register('background-sync')
      } catch (error) {
        console.error('[PWA] Background sync registration failed:', error)
      }
    }
  }

  private async processRetryQueue() {
    console.log(`[PWA] Processing ${this.retryQueue.length} queued operations`)
    
    const operations = [...this.retryQueue]
    this.retryQueue = []

    for (const operation of operations) {
      try {
        await operation()
      } catch (error) {
        console.error('[PWA] Retry operation failed:', error)
        this.retryQueue.push(operation) // Re-queue failed operations
      }
    }
  }

  // Push Notifications
  private async setupPushNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('[PWA] Push notifications not supported')
      return
    }

    // Check current permission
    const permission = Notification.permission
    console.log('[PWA] Notification permission:', permission)
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        toast.success('Notifications Enabled', {
          description: 'You\'ll receive price alerts and updates'
        })
        
        await this.subscribeToPushNotifications()
        return true
      } else {
        toast.error('Notifications Disabled', {
          description: 'Enable notifications in browser settings for alerts'
        })
        return false
      }
    } catch (error) {
      console.error('[PWA] Notification permission request failed:', error)
      return false
    }
  }

  private async subscribeToPushNotifications() {
    if (!this.swRegistration) {
      console.error('[PWA] Service Worker not registered')
      return
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      })

      console.log('[PWA] Push notification subscription created')
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error)
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })
    } catch (error) {
      console.error('[PWA] Failed to send subscription to server:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Cache Management
  public async clearCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        
        toast.success('Cache Cleared', {
          description: 'App cache has been cleared'
        })
        
        // Reload to get fresh data
        window.location.reload()
      } catch (error) {
        console.error('[PWA] Cache clearing failed:', error)
        toast.error('Failed to clear cache')
      }
    }
  }

  public async preloadRoutes(routes: string[]) {
    if (this.swRegistration) {
      this.swRegistration.active?.postMessage({
        type: 'CACHE_URLS',
        payload: routes
      })
    }
  }

  // Service Worker Message Handling
  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache updated for:', data.url)
        break
      case 'BACKGROUND_SYNC':
        console.log('[PWA] Background sync completed')
        break
      case 'PUSH_NOTIFICATION':
        this.handlePushNotification(data.payload)
        break
      default:
        console.log('[PWA] Unknown message from service worker:', data)
    }
  }

  private handlePushNotification(payload: any) {
    // Handle push notification data
    console.log('[PWA] Push notification received:', payload)
  }

  // Performance Monitoring
  public measurePerformance(name: string, fn: () => Promise<any>) {
    return async (...args: any[]) => {
      const start = performance.now()
      try {
        const result = await fn.apply(this, args)
        const duration = performance.now() - start
        
        console.log(`[PWA] Performance: ${name} took ${duration.toFixed(2)}ms`)
        
        // Send to analytics if needed
        if (duration > 1000) { // Warn for slow operations
          console.warn(`[PWA] Slow operation detected: ${name} (${duration.toFixed(2)}ms)`)
        }
        
        return result
      } catch (error) {
        const duration = performance.now() - start
        console.error(`[PWA] Performance: ${name} failed after ${duration.toFixed(2)}ms`, error)
        throw error
      }
    }
  }

  // App Information
  public getAppInfo() {
    return {
      isInstalled: this.isAppInstalled(),
      isOnline: this.isOnline,
      hasServiceWorker: !!this.swRegistration,
      canInstall: this.isInstallAvailable(),
      notificationsEnabled: Notification.permission === 'granted',
      queuedOperations: this.retryQueue.length
    }
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance()

// React hook for PWA functionality
export function usePWA() {
  return {
    install: () => pwaManager.promptInstall(),
    requestNotifications: () => pwaManager.requestNotificationPermission(),
    clearCache: () => pwaManager.clearCache(),
    isOnline: () => pwaManager.getNetworkStatus(),
    getInfo: () => pwaManager.getAppInfo(),
    addToRetryQueue: (operation: () => Promise<void>) => pwaManager.addToRetryQueue(operation)
  }
}