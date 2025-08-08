"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Apple,
  BarChart3,
  User,
  Settings,
  FileText,
  ArrowRight
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchResult {
  id: string
  title: string
  description: string
  category: 'fruit' | 'market' | 'analysis' | 'page' | 'user'
  url: string
  icon: React.ComponentType<any>
  price?: number
  change?: number
  recent?: boolean
}

interface RecentSearch {
  id: string
  query: string
  timestamp: Date
  type: 'fruit' | 'general'
  url?: string
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock search results - in a real app, this would come from your API
const generateSearchResults = (query: string): SearchResult[] => {
  if (!query) return []

  const mockResults: SearchResult[] = [
    // Fruits
    { 
      id: '1', 
      title: 'Premium Apples', 
      description: 'Organic red delicious apples from Washington',
      category: 'fruit',
      url: '/charts/APPL',
      icon: Apple,
      price: 3.45,
      change: 2.3
    },
    { 
      id: '2', 
      title: 'Gala Apples', 
      description: 'Fresh gala variety, current season',
      category: 'fruit',
      url: '/charts/GALA',
      icon: Apple,
      price: 2.89,
      change: -1.2
    },
    // Markets
    { 
      id: '3', 
      title: 'California Fruit Exchange', 
      description: 'Major fruit trading hub in California',
      category: 'market',
      url: '/markets/california',
      icon: TrendingUp
    },
    { 
      id: '4', 
      title: 'Pacific Northwest Market', 
      description: 'Apple and berry trading center',
      category: 'market',
      url: '/markets/pacific-northwest',
      icon: TrendingUp
    },
    // Analysis/Reports
    { 
      id: '5', 
      title: 'Apple Market Analysis Q4', 
      description: 'Quarterly report on apple price trends',
      category: 'analysis',
      url: '/analytics/apple-q4-2024',
      icon: BarChart3
    },
    // Pages
    { 
      id: '6', 
      title: 'Settings', 
      description: 'Account and application preferences',
      category: 'page',
      url: '/settings',
      icon: Settings
    },
    { 
      id: '7', 
      title: 'Documentation', 
      description: 'API docs and user guides',
      category: 'page',
      url: '/docs',
      icon: FileText
    },
  ]

  return mockResults.filter(result => 
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description.toLowerCase().includes(query.toLowerCase())
  )
}

const getCategoryIcon = (category: SearchResult['category']) => {
  switch (category) {
    case 'fruit': return Apple
    case 'market': return TrendingUp
    case 'analysis': return BarChart3
    case 'page': return FileText
    case 'user': return User
    default: return Search
  }
}

const getCategoryColor = (category: SearchResult['category']) => {
  switch (category) {
    case 'fruit': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case 'market': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case 'analysis': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case 'page': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    case 'user': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const debouncedQuery = useDebounce(query, 200)
  const [results, setResults] = useState<SearchResult[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setRecentSearches(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })))
      } catch (error) {
        console.error('Failed to parse recent searches:', error)
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((search: Omit<RecentSearch, 'id' | 'timestamp'>) => {
    const newSearch: RecentSearch = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...search
    }

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.query !== search.query)
      const updated = [newSearch, ...filtered].slice(0, 10) // Keep only last 10
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Search for results
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const searchResults = generateSearchResults(debouncedQuery)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  const handleSelect = useCallback((result: SearchResult | string) => {
    if (typeof result === 'string') {
      // Handle recent search selection
      const recentSearch = recentSearches.find(r => r.id === result)
      if (recentSearch) {
        setQuery(recentSearch.query)
        if (recentSearch.url) {
          router.push(recentSearch.url)
          onOpenChange(false)
        }
      }
      return
    }

    // Handle regular search result selection
    saveRecentSearch({
      query: result.title,
      type: result.category === 'fruit' ? 'fruit' : 'general',
      url: result.url
    })

    router.push(result.url)
    onOpenChange(false)
    setQuery('')
  }, [recentSearches, router, onOpenChange, saveRecentSearch])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle Enter key for general search
    if (event.key === 'Enter' && query.length >= 2 && results.length === 0) {
      saveRecentSearch({
        query,
        type: 'general',
        url: `/search?q=${encodeURIComponent(query)}`
      })
      router.push(`/search?q=${encodeURIComponent(query)}`)
      onOpenChange(false)
      setQuery('')
    }
  }, [query, results.length, saveRecentSearch, router, onOpenChange])

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search fruits, markets, or navigate..." 
        value={query}
        onValueChange={setQuery}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        <CommandEmpty>
          {query.length >= 2 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Enter</kbd> to search globally
              </p>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Type to search fruits, markets, and more...
            </p>
          )}
        </CommandEmpty>

        {query.length < 2 && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.slice(0, 5).map(search => (
              <CommandItem 
                key={search.id}
                value={search.id}
                onSelect={() => handleSelect(search.id)}
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{search.query}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {search.type}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions (shown when no query) */}
        {query.length < 2 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => router.push('/dashboard')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Dashboard
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </CommandItem>
              <CommandItem onSelect={() => router.push('/watchlist')}>
                <User className="mr-2 h-4 w-4" />
                My Watchlist
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </CommandItem>
              <CommandItem onSelect={() => router.push('/charts')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Charts
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Search Results */}
        {Object.entries(groupedResults).map(([category, items]) => {
          const CategoryIcon = getCategoryIcon(category as SearchResult['category'])
          
          return (
            <CommandGroup 
              key={category} 
              heading={`${category.charAt(0).toUpperCase() + category.slice(1)}s`}
            >
              {items.map(item => {
                const ItemIcon = item.icon
                return (
                  <CommandItem 
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                  >
                    <ItemIcon className="mr-2 h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        <Badge 
                          variant="outline" 
                          className={getCategoryColor(item.category)}
                        >
                          {category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.price && (
                        <div className="text-sm font-medium">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                      {item.change !== undefined && (
                        <div className={`text-xs ${
                          item.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
    </CommandDialog>
  )
}