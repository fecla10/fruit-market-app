"use client"

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  SortAsc,
  Grid,
  List,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  X,
  ChevronDown
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { MiniSparkline, generateSparklineData } from '@/components/charts/mini-sparkline'
import { formatPrice, formatPercentage, getTrendInfo } from '@/lib/utils/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

interface SearchFilter {
  categories: string[]
  priceRange: [number, number]
  regions: string[]
  sortBy: 'name' | 'price' | 'change' | 'volume'
  sortOrder: 'asc' | 'desc'
  dateRange: 'today' | 'week' | 'month' | 'year'
  onlyActive: boolean
}

interface FruitResult {
  id: string
  symbol: string
  name: string
  category: string
  currentPrice: number
  change: number
  changePercentage: number
  volume: string
  region: string
  lastUpdate: Date
  description: string
  imageUrl?: string
  isActive: boolean
  sparklineData: Array<{ time: string | number; value: number }>
}

// Mock data
const mockResults: FruitResult[] = [
  {
    id: '1',
    symbol: 'APPL',
    name: 'Premium Red Apples',
    category: 'Apples',
    currentPrice: 3.45,
    change: 0.12,
    changePercentage: 3.6,
    volume: '142K lbs',
    region: 'Washington',
    lastUpdate: new Date(),
    description: 'Premium quality red delicious apples from Washington orchards',
    isActive: true,
    sparklineData: generateSparklineData(20, 3.45, 0.1)
  },
  {
    id: '2',
    symbol: 'BANA',
    name: 'Organic Bananas',
    category: 'Bananas',
    currentPrice: 2.89,
    change: -0.05,
    changePercentage: -1.7,
    volume: '89K lbs',
    region: 'California',
    lastUpdate: new Date(),
    description: 'Certified organic bananas, fair trade sourced',
    isActive: true,
    sparklineData: generateSparklineData(20, 2.89, 0.08)
  },
  {
    id: '3',
    symbol: 'STRW',
    name: 'Fresh Strawberries',
    category: 'Berries',
    currentPrice: 5.67,
    change: 0.23,
    changePercentage: 4.2,
    volume: '67K lbs',
    region: 'Florida',
    lastUpdate: new Date(),
    description: 'Peak season strawberries, vine-ripened',
    isActive: true,
    sparklineData: generateSparklineData(20, 5.67, 0.12)
  },
  // Add more mock data...
]

const categories = ['Apples', 'Bananas', 'Citrus', 'Berries', 'Stone Fruits', 'Melons', 'Tropical']
const regions = ['California', 'Washington', 'Florida', 'Oregon', 'Texas', 'Michigan', 'New York']

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [results, setResults] = useState<FruitResult[]>(mockResults)
  const [filteredResults, setFilteredResults] = useState<FruitResult[]>(mockResults)
  const [loading, setLoading] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  
  const [filters, setFilters] = useState<SearchFilter>({
    categories: [],
    priceRange: [0, 10],
    regions: [],
    sortBy: 'name',
    sortOrder: 'asc',
    dateRange: 'week',
    onlyActive: true
  })

  // Update URL when search query changes
  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      const params = new URLSearchParams()
      if (debouncedQuery) params.set('q', debouncedQuery)
      router.push(`/search?${params.toString()}`)
    }
  }, [debouncedQuery, initialQuery, router])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...results]

    // Search filter
    if (debouncedQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.symbol.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(item => 
        filters.categories.includes(item.category)
      )
    }

    // Price range filter
    filtered = filtered.filter(item => 
      item.currentPrice >= filters.priceRange[0] && 
      item.currentPrice <= filters.priceRange[1]
    )

    // Region filter
    if (filters.regions.length > 0) {
      filtered = filtered.filter(item => 
        filters.regions.includes(item.region)
      )
    }

    // Active only filter
    if (filters.onlyActive) {
      filtered = filtered.filter(item => item.isActive)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (filters.sortBy) {
        case 'price':
          aVal = a.currentPrice
          bVal = b.currentPrice
          break
        case 'change':
          aVal = a.changePercentage
          bVal = b.changePercentage
          break
        case 'volume':
          aVal = parseFloat(a.volume.replace(/[^\d.]/g, ''))
          bVal = parseFloat(b.volume.replace(/[^\d.]/g, ''))
          break
        default:
          aVal = a.name
          bVal = b.name
      }

      if (filters.sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      }
    })

    setFilteredResults(filtered)
  }, [results, debouncedQuery, filters])

  const handleFilterChange = (key: keyof SearchFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 10],
      regions: [],
      sortBy: 'name',
      sortOrder: 'asc',
      dateRange: 'week',
      onlyActive: true
    })
  }

  const activeFilterCount = 
    filters.categories.length + 
    filters.regions.length + 
    (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10 ? 1 : 0) +
    (!filters.onlyActive ? 1 : 0)

  const ResultCard = ({ result }: { result: FruitResult }) => {
    const trendInfo = getTrendInfo(result.change)
    
    if (viewMode === 'list') {
      return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{result.name}</h3>
                    <Badge variant="outline">{result.symbol}</Badge>
                    <Badge variant="secondary">{result.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {result.region}
                    </span>
                    <span>Vol: {result.volume}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <MiniSparkline 
                  data={result.sparklineData}
                  width={80}
                  height={32}
                  color={result.change >= 0 ? '#10B981' : '#EF4444'}
                />
                
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatPrice(result.currentPrice)}
                  </div>
                  <div className={cn('text-sm', trendInfo.color)}>
                    {trendInfo.icon} {formatPercentage(Math.abs(result.changePercentage))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{result.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{result.symbol}</Badge>
                <Badge variant="secondary" className="text-xs">{result.category}</Badge>
              </div>
            </div>
            <div className={cn('p-1 rounded-full', trendInfo.bgColor, trendInfo.darkBgColor)}>
              {result.change >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <MiniSparkline 
            data={result.sparklineData}
            width={120}
            height={40}
            color={result.change >= 0 ? '#10B981' : '#EF4444'}
          />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">
                {formatPrice(result.currentPrice)}
              </div>
              <div className={cn('text-sm', trendInfo.color)}>
                {trendInfo.icon} {formatPercentage(Math.abs(result.changePercentage))}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {result.region}
              </div>
              <div>Vol: {result.volume}</div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {result.description}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardShell
      title="Search & Discovery"
      description={`${filteredResults.length} results found${query ? ` for "${query}"` : ''}`}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-80 shrink-0 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fruits..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Categories */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                  <span className="font-medium text-sm">Categories</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          const newCategories = checked
                            ? [...filters.categories, category]
                            : filters.categories.filter(c => c !== category)
                          handleFilterChange('categories', newCategories)
                        }}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">Price Range</Label>
                  <span className="text-xs text-muted-foreground">
                    ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </span>
                </div>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => handleFilterChange('priceRange', value as [number, number])}
                  max={10}
                  step={0.1}
                  className="py-2"
                />
              </div>

              <Separator />

              {/* Regions */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                  <span className="font-medium text-sm">Regions</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {regions.map(region => (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region}`}
                        checked={filters.regions.includes(region)}
                        onCheckedChange={(checked) => {
                          const newRegions = checked
                            ? [...filters.regions, region]
                            : filters.regions.filter(r => r !== region)
                          handleFilterChange('regions', newRegions)
                        }}
                      />
                      <Label 
                        htmlFor={`region-${region}`}
                        className="text-sm cursor-pointer"
                      >
                        {region}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Other Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="active-only" className="text-sm">Active markets only</Label>
                  <Switch
                    id="active-only"
                    checked={filters.onlyActive}
                    onCheckedChange={(checked) => handleFilterChange('onlyActive', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
          {/* Sort Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Sort by:</Label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value: any) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="change">Change %</SelectItem>
                        <SelectItem value="volume">Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <SortAsc className={cn('h-4 w-4', filters.sortOrder === 'desc' && 'rotate-180')} />
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  {filteredResults.length} of {results.length} results
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Grid/List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'space-y-3'
            )}>
              {filteredResults.map(result => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  {query 
                    ? `No fruits found matching "${query}"`
                    : "Try adjusting your filters to see more results"
                  }
                </p>
                <Button onClick={clearFilters}>Clear filters</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <DashboardShell title="Search" description="Loading search results...">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </DashboardShell>
    }>
      <SearchContent />
    </Suspense>
  )
}