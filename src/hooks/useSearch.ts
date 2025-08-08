import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from './useDebounce'

interface SearchFilters {
  category?: string
  region?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'name' | 'price' | 'change' | 'volume'
  sortOrder?: 'asc' | 'desc'
}

interface SearchResult {
  id: string
  name: string
  category: string
  variety?: string
  unit: string
  description?: string
  imageUrl?: string
  currentPrice?: number
  change?: number
  volume?: number
  region?: string
  lastUpdate?: Date
  symbol: string
}

interface SearchResponse {
  results: SearchResult[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface Suggestion {
  id?: string
  name: string
  type: 'fruit' | 'category' | 'region'
  category?: string
  variety?: string
  currentPrice?: number
}

interface SuggestionsResponse {
  fruits: Suggestion[]
  categories: Suggestion[]
  regions: Suggestion[]
  total: number
}

export function useSearch(
  initialQuery: string = '',
  initialFilters: SearchFilters = {},
  options: {
    enabled?: boolean
    limit?: number
    debounceMs?: number
  } = {}
) {
  const { enabled = true, limit = 20, debounceMs = 300 } = options
  
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [offset, setOffset] = useState(0)
  
  const debouncedQuery = useDebounce(query, debounceMs)

  // Build search parameters
  const searchParams = new URLSearchParams()
  if (debouncedQuery) searchParams.set('q', debouncedQuery)
  if (filters.category) searchParams.set('category', filters.category)
  if (filters.region) searchParams.set('region', filters.region)
  if (filters.minPrice !== undefined) searchParams.set('minPrice', filters.minPrice.toString())
  if (filters.maxPrice !== undefined) searchParams.set('maxPrice', filters.maxPrice.toString())
  if (filters.sortBy) searchParams.set('sortBy', filters.sortBy)
  if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder)
  searchParams.set('limit', limit.toString())
  searchParams.set('offset', offset.toString())

  // Search query
  const {
    data: searchData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['search', debouncedQuery, filters, offset],
    queryFn: async (): Promise<SearchResponse> => {
      const response = await fetch(`/api/search?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Search failed')
      }
      return result.data
    },
    enabled: enabled && (debouncedQuery.length >= 2 || Object.keys(filters).length > 0),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  })

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setOffset(0) // Reset pagination when filters change
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setOffset(0)
  }, [])

  // Load more results
  const loadMore = useCallback(() => {
    if (searchData?.pagination.hasMore) {
      setOffset(prev => prev + limit)
    }
  }, [searchData?.pagination.hasMore, limit])

  // Reset search
  const reset = useCallback(() => {
    setQuery('')
    setFilters({})
    setOffset(0)
  }, [])

  // Log search for analytics
  const logSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    try {
      await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters: searchFilters,
        }),
      })
    } catch (error) {
      console.warn('Failed to log search:', error)
    }
  }, [])

  // Log search when query or filters change
  useEffect(() => {
    if (debouncedQuery || Object.keys(filters).length > 0) {
      logSearch(debouncedQuery, filters)
    }
  }, [debouncedQuery, filters, logSearch])

  return {
    // State
    query,
    filters,
    offset,
    
    // Data
    results: searchData?.results || [],
    pagination: searchData?.pagination,
    
    // Status
    isLoading,
    error,
    
    // Actions
    setQuery,
    updateFilters,
    clearFilters,
    loadMore,
    reset,
    refetch,
    
    // Derived state
    hasResults: (searchData?.results.length || 0) > 0,
    hasMore: searchData?.pagination.hasMore || false,
    total: searchData?.pagination.total || 0,
  }
}

export function useSearchSuggestions(
  query: string,
  options: {
    enabled?: boolean
    limit?: number
    debounceMs?: number
  } = {}
) {
  const { enabled = true, limit = 10, debounceMs = 200 } = options
  
  const debouncedQuery = useDebounce(query, debounceMs)

  const {
    data: suggestions,
    isLoading,
    error
  } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async (): Promise<SuggestionsResponse> => {
      const params = new URLSearchParams()
      params.set('q', debouncedQuery)
      params.set('limit', limit.toString())
      
      const response = await fetch(`/api/search/suggestions?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch suggestions')
      }
      return result.data
    },
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  })

  return {
    suggestions: suggestions || { fruits: [], categories: [], regions: [], total: 0 },
    isLoading,
    error,
    hasResults: (suggestions?.total || 0) > 0,
  }
}

// Hook for recent searches (localStorage-based)
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<Array<{
    id: string
    query: string
    timestamp: Date
    type: 'fruit' | 'general'
    url?: string
  }>>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecentSearches(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      } catch (error) {
        console.warn('Failed to parse recent searches:', error)
      }
    }
  }, [])

  const addRecentSearch = useCallback((search: {
    query: string
    type: 'fruit' | 'general'
    url?: string
  }) => {
    const newSearch = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...search
    }

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.query !== search.query)
      const updated = [newSearch, ...filtered].slice(0, 10)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }, [])

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  }
}