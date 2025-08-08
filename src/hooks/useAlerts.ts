import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Alert {
  id: string
  userId: string
  fruitId: string
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE' | 'VOLUME_SPIKE'
  threshold: number
  condition: string
  active: boolean
  triggered: boolean
  lastTriggered?: Date
  createdAt: Date
}

interface CreateAlertData {
  fruitId: string
  type: Alert['type']
  threshold: number
  condition: string
  active?: boolean
}

interface UpdateAlertData {
  id: string
  fruitId?: string
  type?: Alert['type']
  threshold?: number
  condition?: string
  active?: boolean
  triggered?: boolean
}

interface UseAlertsOptions {
  enabled?: boolean
  active?: boolean
  triggered?: boolean
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const { enabled = true, active, triggered } = options
  const queryClient = useQueryClient()

  // Build query parameters
  const params = new URLSearchParams()
  if (active !== undefined) params.set('active', active.toString())
  if (triggered !== undefined) params.set('triggered', triggered.toString())

  // Fetch alerts
  const {
    data: alerts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['alerts', active, triggered],
    queryFn: async (): Promise<Alert[]> => {
      const response = await fetch(`/api/alerts?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch alerts')
      }
      return result.data
    },
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })

  // Create alert
  const createMutation = useMutation({
    mutationFn: async (alertData: CreateAlertData) => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create alert')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create alert')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  // Update alert
  const updateMutation = useMutation({
    mutationFn: async (alertData: UpdateAlertData) => {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update alert')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update alert')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  // Delete alert
  const deleteMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete alert')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete alert')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  // Helper functions
  const createAlert = (alertData: CreateAlertData) => {
    return createMutation.mutateAsync(alertData)
  }

  const updateAlert = (alertData: UpdateAlertData) => {
    return updateMutation.mutateAsync(alertData)
  }

  const deleteAlert = (alertId: string) => {
    return deleteMutation.mutateAsync(alertId)
  }

  const toggleAlert = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId)
    if (alert) {
      return updateAlert({
        id: alertId,
        active: !alert.active
      })
    }
  }

  const clearTriggered = (alertId: string) => {
    return updateAlert({
      id: alertId,
      triggered: false
    })
  }

  // Get alerts by fruit
  const getAlertsByFruit = (fruitId: string) => {
    return alerts.filter(alert => alert.fruitId === fruitId)
  }

  // Check if fruit has active alerts
  const hasActiveAlerts = (fruitId: string) => {
    return alerts.some(alert => alert.fruitId === fruitId && alert.active)
  }

  return {
    // Data
    alerts,
    alertCount: alerts.length,
    activeAlerts: alerts.filter(a => a.active),
    triggeredAlerts: alerts.filter(a => a.triggered),
    
    // Status
    isLoading,
    error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Actions
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    clearTriggered,
    refetch,
    
    // Helpers
    getAlertsByFruit,
    hasActiveAlerts,
    
    // Mutation objects (for more control)
    createMutation,
    updateMutation,
    deleteMutation,
  }
}

// Hook for alert statistics
export function useAlertStats() {
  const { alerts, isLoading } = useAlerts()
  
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.active).length,
    inactive: alerts.filter(a => !a.active).length,
    triggered: alerts.filter(a => a.triggered).length,
    untriggered: alerts.filter(a => !a.triggered).length,
    
    // By type
    byType: {
      priceAbove: alerts.filter(a => a.type === 'PRICE_ABOVE').length,
      priceBelow: alerts.filter(a => a.type === 'PRICE_BELOW').length,
      percentChange: alerts.filter(a => a.type === 'PERCENT_CHANGE').length,
      volumeSpike: alerts.filter(a => a.type === 'VOLUME_SPIKE').length,
    },
    
    // Recent activity
    triggeredToday: alerts.filter(a => {
      if (!a.lastTriggered) return false
      const today = new Date()
      const triggered = new Date(a.lastTriggered)
      return triggered.toDateString() === today.toDateString()
    }).length,
    
    triggeredThisWeek: alerts.filter(a => {
      if (!a.lastTriggered) return false
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const triggered = new Date(a.lastTriggered)
      return triggered >= weekAgo
    }).length,
  }
  
  return {
    stats,
    isLoading,
    isEmpty: alerts.length === 0,
  }
}

// Hook for managing alerts for a specific fruit
export function useFruitAlerts(fruitId: string) {
  const { alerts, createAlert, deleteAlert, toggleAlert, hasActiveAlerts } = useAlerts()
  
  const fruitAlerts = alerts.filter(alert => alert.fruitId === fruitId)
  
  const createFruitAlert = (alertData: Omit<CreateAlertData, 'fruitId'>) => {
    return createAlert({ ...alertData, fruitId })
  }
  
  const deleteAllFruitAlerts = async () => {
    const deletePromises = fruitAlerts.map(alert => deleteAlert(alert.id))
    await Promise.all(deletePromises)
  }
  
  return {
    alerts: fruitAlerts,
    alertCount: fruitAlerts.length,
    hasActiveAlerts: hasActiveAlerts(fruitId),
    createFruitAlert,
    deleteAllFruitAlerts,
    toggleAlert,
    deleteAlert,
  }
}