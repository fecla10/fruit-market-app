"use client"

import { useState, useEffect } from 'react'
import { 
  Heart, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  MoreHorizontal,
  Bell,
  BarChart3,
  Eye,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MiniSparkline, generateSparklineData } from '@/components/charts/mini-sparkline'
import { formatPrice, formatPercentage, getTrendInfo } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface WatchlistItem {
  id: string
  symbol: string
  name: string
  category: string
  currentPrice: number
  change: number
  changePercentage: number
  volume: string
  lastUpdate: Date
  addedDate: Date
  notes?: string
  alertEnabled: boolean
  sparklineData: Array<{ time: string | number; value: number }>
}

interface AddToWatchlistProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: { symbol: string; name: string; notes?: string }) => void
}

// Mock watchlist data
const mockWatchlistItems: WatchlistItem[] = [
  {
    id: '1',
    symbol: 'APPL',
    name: 'Premium Red Apples',
    category: 'Apples',
    currentPrice: 3.45,
    change: 0.12,
    changePercentage: 3.6,
    volume: '142K lbs',
    lastUpdate: new Date(),
    addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    notes: 'Seasonal peak coming up',
    alertEnabled: true,
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
    lastUpdate: new Date(),
    addedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    alertEnabled: false,
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
    lastUpdate: new Date(),
    addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    notes: 'High volatility expected',
    alertEnabled: true,
    sparklineData: generateSparklineData(20, 5.67, 0.12)
  },
]

function AddToWatchlistDialog({ open, onOpenChange, onAdd }: AddToWatchlistProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.symbol && formData.name) {
      onAdd(formData)
      setFormData({ symbol: '', name: '', notes: '' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
          <DialogDescription>
            Add a new fruit to your watchlist to track its price movements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                className="col-span-3"
                placeholder="APPL"
                maxLength={6}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Premium Red Apples"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                placeholder="Optional notes about this fruit..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.symbol || !formData.name}>
              Add to Watchlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface WatchlistPanelProps {
  className?: string
  compact?: boolean
}

export function WatchlistPanel({ className, compact = false }: WatchlistPanelProps) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(mockWatchlistItems)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const handleAddItem = (newItem: { symbol: string; name: string; notes?: string }) => {
    const mockItem: WatchlistItem = {
      id: crypto.randomUUID(),
      symbol: newItem.symbol,
      name: newItem.name,
      category: 'Other', // Would be determined by API
      currentPrice: Math.random() * 5 + 1,
      change: (Math.random() - 0.5) * 0.5,
      changePercentage: (Math.random() - 0.5) * 10,
      volume: `${Math.floor(Math.random() * 200)}K lbs`,
      lastUpdate: new Date(),
      addedDate: new Date(),
      notes: newItem.notes,
      alertEnabled: false,
      sparklineData: generateSparklineData(20, Math.random() * 5 + 1, 0.1)
    }
    
    setWatchlistItems(prev => [mockItem, ...prev])
  }

  const handleRemoveItem = (id: string) => {
    setWatchlistItems(prev => prev.filter(item => item.id !== id))
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const handleToggleAlert = (id: string) => {
    setWatchlistItems(prev => prev.map(item => 
      item.id === id ? { ...item, alertEnabled: !item.alertEnabled } : item
    ))
  }

  const handleSelectAll = () => {
    if (selectedItems.size === watchlistItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(watchlistItems.map(item => item.id)))
    }
  }

  const handleBulkRemove = () => {
    setWatchlistItems(prev => prev.filter(item => !selectedItems.has(item.id)))
    setSelectedItems(new Set())
  }

  const totalValue = watchlistItems.reduce((sum, item) => sum + item.currentPrice, 0)
  const totalChange = watchlistItems.reduce((sum, item) => sum + item.change, 0)
  const avgChangePercentage = watchlistItems.length > 0 
    ? watchlistItems.reduce((sum, item) => sum + item.changePercentage, 0) / watchlistItems.length
    : 0

  if (compact) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Watchlist ({watchlistItems.length})
            </CardTitle>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {watchlistItems.slice(0, 5).map((item) => {
            const trendInfo = getTrendInfo(item.change)
            return (
              <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {item.symbol}
                  </Badge>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    {formatPrice(item.currentPrice)}
                  </div>
                  <div className={cn('text-xs', trendInfo.color)}>
                    {formatPercentage(item.changePercentage)}
                  </div>
                </div>
              </div>
            )
          })}
          {watchlistItems.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs">
                View all {watchlistItems.length} items
              </Button>
            </div>
          )}
        </CardContent>
        <AddToWatchlistDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onAdd={handleAddItem}
        />
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchlistItems.length}</div>
            <p className="text-xs text-muted-foreground">
              fruits in watchlist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Combined Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
            <p className={cn(
              'text-xs flex items-center gap-1',
              getTrendInfo(totalChange).color
            )}>
              {getTrendInfo(totalChange).icon} {formatPrice(Math.abs(totalChange))} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              getTrendInfo(avgChangePercentage).color
            )}>
              {formatPercentage(avgChangePercentage)}
            </div>
            <p className="text-xs text-muted-foreground">
              average today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">My Watchlist</CardTitle>
              {selectedItems.size > 0 && (
                <Badge variant="secondary">
                  {selectedItems.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <Button variant="outline" size="sm" onClick={handleBulkRemove}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove Selected
                </Button>
              )}
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {watchlistItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === watchlistItems.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Fruit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Chart</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlistItems.map((item) => {
                  const trendInfo = getTrendInfo(item.change)
                  const isSelected = selectedItems.has(item.id)
                  
                  return (
                    <TableRow 
                      key={item.id}
                      className={cn(isSelected && 'bg-muted/50')}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newSet = new Set(selectedItems)
                            if (isSelected) {
                              newSet.delete(item.id)
                            } else {
                              newSet.add(item.id)
                            }
                            setSelectedItems(newSet)
                          }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.symbol}
                          </Badge>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.category}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground italic">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">
                          {formatPrice(item.currentPrice)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn('flex items-center gap-1', trendInfo.color)}>
                          {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="font-medium">
                            {formatPrice(Math.abs(item.change))}
                          </span>
                          <span className="text-sm">
                            ({formatPercentage(item.changePercentage)})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.volume}</span>
                      </TableCell>
                      <TableCell>
                        <MiniSparkline
                          data={item.sparklineData}
                          width={80}
                          height={32}
                          color={item.change >= 0 ? '#10B981' : '#EF4444'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAlert(item.id)}
                          className={cn(
                            'p-1',
                            item.alertEnabled && 'text-blue-600 hover:text-blue-700'
                          )}
                        >
                          <Bell className={cn('h-4 w-4', item.alertEnabled && 'fill-current')} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Chart
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Add to Compare
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Bell className="h-4 w-4 mr-2" />
                              Set Alert
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items in watchlist</h3>
              <p className="text-muted-foreground mb-4">
                Add fruits to your watchlist to track their price movements.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddToWatchlistDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddItem}
      />
    </div>
  )
}