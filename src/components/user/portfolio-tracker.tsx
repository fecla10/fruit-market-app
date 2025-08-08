"use client"

import { useState, useEffect } from 'react'
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  PieChart,
  BarChart3,
  Download
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { MiniSparkline, generateSparklineData } from '@/components/charts/mini-sparkline'
import { formatPrice, formatPercentage, formatDate, getTrendInfo } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface PortfolioHolding {
  id: string
  symbol: string
  name: string
  category: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number
  totalValue: number
  totalCost: number
  unrealizedPL: number
  unrealizedPLPercent: number
  lastUpdate: Date
  sparklineData: Array<{ time: string | number; value: number }>
}

interface Portfolio {
  id: string
  name: string
  description?: string
  holdings: PortfolioHolding[]
  totalValue: number
  totalCost: number
  totalPL: number
  totalPLPercent: number
  createdAt: Date
  lastUpdate: Date
}

interface Transaction {
  id: string
  portfolioId: string
  symbol: string
  type: 'BUY' | 'SELL'
  quantity: number
  price: number
  total: number
  date: Date
  notes?: string
}

interface AddHoldingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (holding: { symbol: string; name: string; quantity: number; price: number }) => void
}

// Mock data
const mockHoldings: PortfolioHolding[] = [
  {
    id: '1',
    symbol: 'APPL',
    name: 'Premium Red Apples',
    category: 'Apples',
    quantity: 100,
    avgBuyPrice: 3.20,
    currentPrice: 3.45,
    totalValue: 345,
    totalCost: 320,
    unrealizedPL: 25,
    unrealizedPLPercent: 7.81,
    lastUpdate: new Date(),
    sparklineData: generateSparklineData(20, 3.45, 0.1)
  },
  {
    id: '2',
    symbol: 'BANA',
    name: 'Organic Bananas',
    category: 'Bananas',
    quantity: 200,
    avgBuyPrice: 3.00,
    currentPrice: 2.89,
    totalValue: 578,
    totalCost: 600,
    unrealizedPL: -22,
    unrealizedPLPercent: -3.67,
    lastUpdate: new Date(),
    sparklineData: generateSparklineData(20, 2.89, 0.08)
  },
  {
    id: '3',
    symbol: 'STRW',
    name: 'Fresh Strawberries',
    category: 'Berries',
    quantity: 50,
    avgBuyPrice: 5.20,
    currentPrice: 5.67,
    totalValue: 283.5,
    totalCost: 260,
    unrealizedPL: 23.5,
    unrealizedPLPercent: 9.04,
    lastUpdate: new Date(),
    sparklineData: generateSparklineData(20, 5.67, 0.12)
  }
]

const mockTransactions: Transaction[] = [
  {
    id: '1',
    portfolioId: '1',
    symbol: 'APPL',
    type: 'BUY',
    quantity: 100,
    price: 3.20,
    total: 320,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    notes: 'Initial position'
  },
  {
    id: '2',
    portfolioId: '1',
    symbol: 'BANA',
    type: 'BUY',
    quantity: 200,
    price: 3.00,
    total: 600,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    portfolioId: '1',
    symbol: 'STRW',
    type: 'BUY',
    quantity: 50,
    price: 5.20,
    total: 260,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  }
]

function AddHoldingDialog({ open, onOpenChange, onAdd }: AddHoldingProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    quantity: 0,
    price: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.symbol && formData.name && formData.quantity > 0 && formData.price > 0) {
      onAdd(formData)
      setFormData({ symbol: '', name: '', quantity: 0, price: 0 })
      onOpenChange(false)
    }
  }

  const totalCost = formData.quantity * formData.price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
          <DialogDescription>
            Add a new fruit position to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    symbol: e.target.value.toUpperCase() 
                  }))}
                  placeholder="APPL"
                  maxLength={6}
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
                  placeholder="Premium Red Apples"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity (lbs)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="price">Buy Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="3.20"
                />
              </div>
            </div>

            {totalCost > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Cost</span>
                  <span className="text-lg font-bold">{formatPrice(totalCost)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.symbol || !formData.name || formData.quantity <= 0 || formData.price <= 0}
            >
              Add Position
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface PortfolioTrackerProps {
  className?: string
}

export function PortfolioTracker({ className }: PortfolioTrackerProps) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(mockHoldings)
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('holdings')

  // Calculate portfolio metrics
  const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0)
  const totalCost = holdings.reduce((sum, holding) => sum + holding.totalCost, 0)
  const totalPL = totalValue - totalCost
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

  const todaysPL = holdings.reduce((sum, holding) => {
    // Simulate today's change based on current sparkline trend
    const todayChange = (Math.random() - 0.5) * holding.currentPrice * 0.02 // ±2% max
    return sum + (todayChange * holding.quantity)
  }, 0)

  const handleAddHolding = (newHolding: { symbol: string; name: string; quantity: number; price: number }) => {
    const holding: PortfolioHolding = {
      id: crypto.randomUUID(),
      symbol: newHolding.symbol,
      name: newHolding.name,
      category: 'Other', // Would be determined by API
      quantity: newHolding.quantity,
      avgBuyPrice: newHolding.price,
      currentPrice: newHolding.price + (Math.random() - 0.5) * 0.5, // Simulate current price
      totalValue: 0,
      totalCost: newHolding.quantity * newHolding.price,
      unrealizedPL: 0,
      unrealizedPLPercent: 0,
      lastUpdate: new Date(),
      sparklineData: generateSparklineData(20, newHolding.price, 0.1)
    }

    holding.currentPrice = Math.max(0.1, holding.currentPrice)
    holding.totalValue = holding.quantity * holding.currentPrice
    holding.unrealizedPL = holding.totalValue - holding.totalCost
    holding.unrealizedPLPercent = (holding.unrealizedPL / holding.totalCost) * 100

    setHoldings(prev => [holding, ...prev])

    // Add transaction
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      portfolioId: '1',
      symbol: newHolding.symbol,
      type: 'BUY',
      quantity: newHolding.quantity,
      price: newHolding.price,
      total: newHolding.quantity * newHolding.price,
      date: new Date(),
      notes: 'Added via portfolio tracker'
    }
    setTransactions(prev => [transaction, ...prev])
  }

  const handleRemoveHolding = (id: string) => {
    setHoldings(prev => prev.filter(holding => holding.id !== id))
  }

  // Get top performers
  const topPerformer = holdings.reduce((max, holding) => 
    holding.unrealizedPLPercent > max.unrealizedPLPercent ? holding : max, 
    holdings[0] || {} as PortfolioHolding
  )

  const worstPerformer = holdings.reduce((min, holding) => 
    holding.unrealizedPLPercent < min.unrealizedPLPercent ? holding : min, 
    holdings[0] || {} as PortfolioHolding
  )

  // Portfolio allocation
  const allocationData = holdings.map(holding => ({
    symbol: holding.symbol,
    name: holding.name,
    value: holding.totalValue,
    percentage: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
    color: `hsl(${Math.abs(holding.symbol.charCodeAt(0)) * 137.5 % 360}, 70%, 50%)`
  }))

  return (
    <div className={cn('space-y-6', className)}>
      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              portfolio value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', getTrendInfo(totalPL).color)}>
              {formatPrice(totalPL)}
            </div>
            <p className={cn('text-xs', getTrendInfo(totalPL).color)}>
              {formatPercentage(totalPLPercent)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Today's P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', getTrendInfo(todaysPL).color)}>
              {formatPrice(todaysPL)}
            </div>
            <p className="text-xs text-muted-foreground">
              today's change
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holdings.length}</div>
            <p className="text-xs text-muted-foreground">
              active positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              My Portfolio
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Position
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="holdings" className="mt-4">
              {holdings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fruit</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Market Value</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Chart</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map((holding) => {
                      const plTrendInfo = getTrendInfo(holding.unrealizedPL)
                      return (
                        <TableRow key={holding.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {holding.symbol}
                              </Badge>
                              <div>
                                <div className="font-medium">{holding.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {holding.category}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{holding.quantity.toLocaleString()} lbs</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              {formatPrice(holding.avgBuyPrice)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">
                              {formatPrice(holding.currentPrice)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">
                              {formatPrice(holding.totalValue)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Cost: {formatPrice(holding.totalCost)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn('font-medium', plTrendInfo.color)}>
                              {formatPrice(holding.unrealizedPL)}
                            </div>
                            <div className={cn('text-sm', plTrendInfo.color)}>
                              {formatPercentage(holding.unrealizedPLPercent)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <MiniSparkline
                              data={holding.sparklineData}
                              width={80}
                              height={32}
                              color={holding.unrealizedPL >= 0 ? '#10B981' : '#EF4444'}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveHolding(holding.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your fruit portfolio by adding your first position.
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Position
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="allocation" className="mt-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Portfolio Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allocationData.map(item => (
                        <div key={item.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({item.symbol})
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{item.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-muted-foreground">
                              {formatPrice(item.value)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topPerformer.id && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Top Performer
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {topPerformer.symbol} - {topPerformer.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatPercentage(topPerformer.unrealizedPLPercent)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {worstPerformer.id && worstPerformer.unrealizedPLPercent < 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              Needs Attention
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {worstPerformer.symbol} - {worstPerformer.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              {formatPercentage(worstPerformer.unrealizedPLPercent)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Invested</span>
                        <span className="font-medium">{formatPrice(totalCost)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Current Value</span>
                        <span className="font-medium">{formatPrice(totalValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Net Profit/Loss</span>
                        <span className={cn('font-bold', getTrendInfo(totalPL).color)}>
                          {formatPrice(totalPL)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(transaction.date)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {transaction.symbol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === 'BUY' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {transaction.quantity.toLocaleString()} lbs
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {formatPrice(transaction.price)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">
                          {formatPrice(transaction.total)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {transaction.notes || '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
                <p className="text-muted-foreground">
                  Advanced performance charts and analytics coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AddHoldingDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddHolding}
      />
    </div>
  )
}