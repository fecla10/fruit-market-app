"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Download, 
  X, 
  Check,
  Wifi,
  WifiOff,
  Bell,
  BellOff
} from 'lucide-react'
import { usePWA } from '@/lib/pwa'
import { cn } from '@/lib/utils'

interface InstallPromptProps {
  className?: string
  showNetworkStatus?: boolean
  showNotificationStatus?: boolean
}

export function InstallPrompt({ 
  className, 
  showNetworkStatus = true,
  showNotificationStatus = true 
}: InstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  
  const { install, requestNotifications, isOnline, getInfo } = usePWA()
  const [appInfo, setAppInfo] = useState(getInfo())

  useEffect(() => {
    // Check if install prompt should be shown
    const checkInstallPrompt = () => {
      const info = getInfo()
      setAppInfo(info)
      
      // Show if app can be installed and hasn't been dismissed
      setIsVisible(info.canInstall && !info.isInstalled && !isDismissed)
    }

    checkInstallPrompt()
    
    // Check periodically for changes
    const interval = setInterval(checkInstallPrompt, 5000)
    
    // Listen for beforeinstallprompt event changes
    const handleBeforeInstall = () => checkInstallPrompt()
    const handleAppInstalled = () => {
      setIsVisible(false)
      setAppInfo(getInfo())
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isDismissed, getInfo])

  const handleInstall = async () => {
    setIsInstalling(true)
    
    try {
      const success = await install()
      if (success) {
        setIsVisible(false)
      }
    } catch (error) {
      console.error('Install failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleNotificationRequest = async () => {
    await requestNotifications()
    setAppInfo(getInfo())
  }

  // Don't show if already installed or dismissed
  if (appInfo.isInstalled || !isVisible) {
    return null
  }

  return (
    <Card className={cn(
      "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-green-900">
                  Install Fruit Market Tracker
                </h3>
                <Badge variant="secondary" className="text-xs">
                  PWA
                </Badge>
              </div>
              
              <p className="text-sm text-green-700 mb-3">
                Get the full app experience with offline support, push notifications, and faster loading.
              </p>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-4 mb-3">
                {showNetworkStatus && (
                  <div className="flex items-center gap-1 text-xs">
                    {isOnline() ? (
                      <Wifi className="h-3 w-3 text-green-600" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-red-600" />
                    )}
                    <span className={cn(
                      "font-medium",
                      isOnline() ? "text-green-600" : "text-red-600"
                    )}>
                      {isOnline() ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
                
                {showNotificationStatus && (
                  <div className="flex items-center gap-1 text-xs">
                    {appInfo.notificationsEnabled ? (
                      <Bell className="h-3 w-3 text-green-600" />
                    ) : (
                      <BellOff className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={cn(
                      "font-medium",
                      appInfo.notificationsEnabled ? "text-green-600" : "text-gray-500"
                    )}>
                      {appInfo.notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">Offline Support</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">Push Notifications</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">Faster Loading</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">Native Feel</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {isInstalling ? 'Installing...' : 'Install App'}
                </Button>
                
                {!appInfo.notificationsEnabled && (
                  <Button
                    onClick={handleNotificationRequest}
                    variant="outline"
                    size="sm"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Enable Alerts
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Dismiss Button */}
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6 text-green-600 hover:bg-green-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Network Status Component
export function NetworkStatus({ className }: { className?: string }) {
  const { isOnline } = usePWA()
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const updateStatus = () => setOnline(isOnline())
    
    updateStatus()
    
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [isOnline])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {online ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600" />
      )}
      <span className={cn(
        "text-sm font-medium",
        online ? "text-green-600" : "text-red-600"
      )}>
        {online ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

// PWA Info Component
export function PWAInfo({ className }: { className?: string }) {
  const { getInfo } = usePWA()
  const [info, setInfo] = useState(getInfo())

  useEffect(() => {
    const updateInfo = () => setInfo(getInfo())
    
    const interval = setInterval(updateInfo, 5000)
    
    return () => clearInterval(interval)
  }, [getInfo])

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">App Status</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Installed:</span>
            <Badge variant={info.isInstalled ? "default" : "secondary"}>
              {info.isInstalled ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Service Worker:</span>
            <Badge variant={info.hasServiceWorker ? "default" : "destructive"}>
              {info.hasServiceWorker ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Network:</span>
            <Badge variant={info.isOnline ? "default" : "destructive"}>
              {info.isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Notifications:</span>
            <Badge variant={info.notificationsEnabled ? "default" : "secondary"}>
              {info.notificationsEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          
          {info.queuedOperations > 0 && (
            <div className="flex items-center justify-between">
              <span>Queued Operations:</span>
              <Badge variant="outline">
                {info.queuedOperations}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}