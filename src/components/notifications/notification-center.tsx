"use client"

import { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  TrendingUp,
  TrendingDown,
  Volume2,
  Settings,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAlertNotifications } from '@/hooks/useWebSocket'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  className?: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'PRICE_ALERT':
      return TrendingUp
    case 'VOLUME_ALERT':
      return Volume2
    case 'MARKET_NEWS':
      return Info
    default:
      return Bell
  }
}

const getNotificationColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
    case 'low':
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
  }
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [browserNotifications, setBrowserNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    requestNotificationPermission,
    isConnected
  } = useAlertNotifications()

  // Check current notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBrowserNotifications(Notification.permission === 'granted')
    }
  }, [])

  const handleEnableBrowserNotifications = async () => {
    if (browserNotifications) {
      setBrowserNotifications(false)
    } else {
      const granted = await requestNotificationPermission()
      setBrowserNotifications(granted)
    }
  }

  const handleMarkAllAsRead = () => {
    markAsRead()
  }

  const handleClearAll = () => {
    clearNotifications()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('relative', className)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} new</Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Stay updated with real-time market alerts and price movements
                </SheetDescription>
              </div>
              <div className="flex items-center gap-1">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4 py-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="browser-notifications" className="text-sm">
                    Browser Notifications
                  </Label>
                  <Switch
                    id="browser-notifications"
                    checked={browserNotifications}
                    onCheckedChange={handleEnableBrowserNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-notifications" className="text-sm">
                    Sound Alerts
                  </Label>
                  <Switch
                    id="sound-notifications"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <Separator />

            {/* Notifications List */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Recent Notifications</h4>
              
              <ScrollArea className="h-[400px] w-full">
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification, index) => {
                      const Icon = getNotificationIcon(notification.type)
                      const colorClass = getNotificationColor(notification.priority)
                      
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'rounded-lg border p-3 transition-all hover:shadow-sm',
                            colorClass
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-sm">
                                  {notification.title}
                                </h5>
                                {notification.fruitSymbol && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.fruitSymbol}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// Floating notification component for real-time alerts
export function FloatingNotification() {
  const { notifications } = useAlertNotifications()
  const [visibleNotification, setVisibleNotification] = useState<any>(null)
  const [showFloating, setShowFloating] = useState(false)

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      setVisibleNotification(latest)
      setShowFloating(true)
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowFloating(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [notifications])

  if (!showFloating || !visibleNotification) return null

  const Icon = getNotificationIcon(visibleNotification.type)

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
      <Card className="w-80 shadow-lg border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {visibleNotification.title}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFloating(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {visibleNotification.message}
              </p>
              {visibleNotification.fruitSymbol && (
                <Badge variant="outline" className="text-xs mt-2">
                  {visibleNotification.fruitSymbol}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}