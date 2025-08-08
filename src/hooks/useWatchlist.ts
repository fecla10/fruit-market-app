import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface WatchlistItem {
  id: string
  fruitId: string
  symbol: string
  name: string
  category: string
  currentPrice?: number
  change?: number
  volume?: number
  lastUpdate?: Date
  addedDate: Date
  order: number
}

interface UseWatchlistOptions {
  enabled?: boolean
}

export function useWatchlist(options: UseWatchlistOptions = {}) {
  const { enabled = true } = options
  const queryClient = useQueryClient()

  // Fetch watchlist items
  const {
    data: items = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async (): Promise<WatchlistItem[]> => {
      const response = await fetch('/api/watchlist')
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch watchlist')
      }
      return result.data
    },
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })

  // Add item to watchlist
  const addMutation = useMutation({
    mutationFn: async ({ fruitId, order }: { fruitId: string; order?: number }) => {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fruitId, order }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to watchlist')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to add to watchlist')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })

  // Remove item from watchlist
  const removeMutation = useMutation({
    mutationFn: async ({ id, fruitId }: { id?: string; fruitId?: string }) => {
      const params = new URLSearchParams()
      if (id) params.set('id', id)
      if (fruitId) params.set('fruitId', fruitId)
      
      const response = await fetch(`/api/watchlist?${params.toString()}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove from watchlist')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove from watchlist')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })

  // Update watchlist order
  const updateOrderMutation = useMutation({
    mutationFn: async (itemsWithOrder: Array<{ id: string; order: number }>) => {
      const response = await fetch('/api/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsWithOrder }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update watchlist order')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update watchlist order')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })

  // Helper functions
  const addToWatchlist = (fruitId: string, order?: number) => {
    return addMutation.mutateAsync({ fruitId, order })
  }

  const removeFromWatchlist = (id?: string, fruitId?: string) => {
    return removeMutation.mutateAsync({ id, fruitId })
  }

  const updateOrder = (items: Array<{ id: string; order: number }>) => {
    return updateOrderMutation.mutateAsync(items)
  }

  const isInWatchlist = (fruitId: string) => {
    return items.some(item => item.fruitId === fruitId)
  }

  const getWatchlistItem = (fruitId: string) => {
    return items.find(item => item.fruitId === fruitId)
  }

  return {
    // Data
    items,
    itemCount: items.length,
    
    // Status
    isLoading,
    error,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isUpdatingOrder: updateOrderMutation.isPending,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
    updateOrder,
    refetch,
    
    // Helpers
    isInWatchlist,
    getWatchlistItem,
    
    // Mutation objects (for more control)
    addMutation,
    removeMutation,
    updateOrderMutation,
  }
}

// Hook for watchlist statistics
export function useWatchlistStats() {
  const { items, isLoading } = useWatchlist()
  
  const stats = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.currentPrice || 0), 0),
    gainers: items.filter(item => (item.change || 0) > 0).length,
    losers: items.filter(item => (item.change || 0) < 0).length,
    unchanged: items.filter(item => (item.change || 0) === 0).length,
    averageChange: items.length > 0 
      ? items.reduce((sum, item) => sum + (item.change || 0), 0) / items.length 
      : 0,
  }
  
  return {
    stats,
    isLoading,
    isEmpty: items.length === 0,
  }
}

// Hook for checking if a fruit is in watchlist (useful for toggle buttons)
export function useWatchlistStatus(fruitId: string) {
  const { isInWatchlist, getWatchlistItem, addToWatchlist, removeFromWatchlist, isAdding, isRemoving } = useWatchlist()
  
  const isInList = isInWatchlist(fruitId)
  const item = getWatchlistItem(fruitId)
  
  const toggle = async () => {
    if (isInList && item) {
      await removeFromWatchlist(item.id)
    } else {
      await addToWatchlist(fruitId)
    }
  }
  
  return {
    isInWatchlist: isInList,
    item,
    toggle,
    isLoading: isAdding || isRemoving,
  }
}