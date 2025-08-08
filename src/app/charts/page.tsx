"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  BarChart3, 
  GitCompare, 
  Sparkles,
  Download,
  Share,
  Settings
} from 'lucide-react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { MainPriceChart, PriceData } from '@/components/charts/main-price-chart'
import { ComparisonChart, generateComparisonData } from '@/components/charts/comparison-chart'
import { MiniSparkline, generateSparklineData, SparklinePresets } from '@/components/charts/mini-sparkline'

// Generate sample data
const generatePriceData = (days: number = 100): PriceData[] => {
  const data: PriceData[] = []
  let currentPrice = 100
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    
    const open = currentPrice
    const change = (Math.random() - 0.5) * 10
    const close = Math.max(0.1, open + change)
    const high = Math.max(open, close) + Math.random() * 5
    const low = Math.min(open, close) - Math.random() * 5
    const volume = Math.floor(Math.random() * 10000) + 1000
    
    data.push({
      time: Math.floor(date.getTime() / 1000) as any,
      open,
      high,
      low,
      close,
      volume
    })
    
    currentPrice = close
  }
  
  return data
}

const sampleFruits = [
  { symbol: 'APPL', name: 'Premium Apples', basePrice: 3.45 },
  { symbol: 'BANA', name: 'Organic Bananas', basePrice: 2.89 },
  { symbol: 'ORNG', name: 'Fresh Oranges', basePrice: 3.12 },
  { symbol: 'STRW', name: 'Strawberries', basePrice: 5.67 },
]

export default function ChartsPage() {
  const [selectedFruit, setSelectedFruit] = useState('APPL')
  const [comparisonData, setComparisonData] = useState(() => 
    generateComparisonData(sampleFruits.slice(0, 3))
  )
  const [priceData] = useState(() => generatePriceData())

  const handleTimeframeChange = (timeframe: string) => {
    console.log('Timeframe changed:', timeframe)
    // In a real app, you would fetch new data here
  }

  const handleRemoveSeries = (symbol: string) => {
    setComparisonData(prev => prev.filter(item => item.symbol !== symbol))
  }

  const handleAddSeries = () => {
    const availableFruits = sampleFruits.filter(
      fruit => !comparisonData.some(data => data.symbol === fruit.symbol)
    )
    
    if (availableFruits.length > 0) {
      const newFruit = availableFruits[0]
      const newData = generateComparisonData([newFruit])
      setComparisonData(prev => [...prev, ...newData])
    }
  }

  const sparklineData = generateSparklineData(20, 100, 0.05)
  const sparklineDataNegative = generateSparklineData(20, 100, 0.08).map(point => ({
    ...point,
    value: point.value * 0.9 // Make it trend downward
  }))

  return (
    <DashboardShell
      title="Interactive Charts"
      description="Advanced charting tools for fruit market analysis with technical indicators and comparison features."
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </>
      }
    >
      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Single Chart
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="sparklines" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Sparklines
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Single Fruit Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Detailed price chart with technical indicators and drawing tools.
              </p>
            </div>
            <Select value={selectedFruit} onValueChange={setSelectedFruit}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sampleFruits.map(fruit => (
                  <SelectItem key={fruit.symbol} value={fruit.symbol}>
                    {fruit.name} ({fruit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MainPriceChart
            data={priceData}
            title={sampleFruits.find(f => f.symbol === selectedFruit)?.name || 'Price Chart'}
            symbol={selectedFruit}
            height={500}
            showControls={true}
            showVolume={true}
            onTimeframeChange={handleTimeframeChange}
          />

          {/* Additional chart metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$3.45</div>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.3% today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">24h Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">$3.12 - $3.67</div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">142.5K lbs</div>
                <p className="text-xs text-muted-foreground">vs 134K avg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">$2.1M</div>
                <p className="text-xs text-muted-foreground">Regional estimate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Market Comparison</h3>
            <p className="text-sm text-muted-foreground">
              Compare multiple fruits side-by-side to identify trends and opportunities.
            </p>
          </div>

          <ComparisonChart
            data={comparisonData}
            title="Fruit Price Comparison"
            height={500}
            onRemoveSeries={handleRemoveSeries}
            onAddSeries={handleAddSeries}
            maxSeries={4}
          />

          {/* Comparison stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Strawberries</p>
                    <p className="text-sm text-muted-foreground">STRW</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    +8.9%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Volatile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Premium Apples</p>
                    <p className="text-sm text-muted-foreground">APPL</p>
                  </div>
                  <Badge variant="outline">
                    15.2% range
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Correlation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>APPL-ORNG</span>
                    <span className="font-medium">0.78</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>BANA-STRW</span>
                    <span className="font-medium">0.45</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sparklines" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Sparkline Overview</h3>
            <p className="text-sm text-muted-foreground">
              Quick visual summaries of price movements for all tracked fruits.
            </p>
          </div>

          <div className="grid gap-4">
            {sampleFruits.map((fruit, index) => (
              <Card key={fruit.symbol}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold">{fruit.name}</p>
                        <p className="text-sm text-muted-foreground">{fruit.symbol}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ${fruit.basePrice.toFixed(2)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <MiniSparkline
                        data={index % 2 === 0 ? sparklineData : sparklineDataNegative}
                        {...SparklinePresets.price}
                        showLastValue={true}
                      />
                      
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {index % 2 === 0 ? '+' : '-'}{(Math.random() * 5).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">24h</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sparkline demos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sparkline Variations</CardTitle>
              <CardDescription>
                Different sparkline configurations for various use cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Price Trend (Standard)</span>
                <MiniSparkline data={sparklineData} {...SparklinePresets.price} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Volume Activity</span>
                <MiniSparkline data={sparklineData} {...SparklinePresets.volume} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span>Performance (with value)</span>
                <MiniSparkline data={sparklineData} {...SparklinePresets.performance} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Market Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Advanced analytics and insights derived from chart patterns and market data.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technical Indicators</CardTitle>
                <CardDescription>Current signals from popular indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">RSI (14)</span>
                  <Badge variant="outline" className="text-yellow-600">Neutral (52)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MACD</span>
                  <Badge variant="outline" className="text-green-600">Bullish</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Moving Average (20)</span>
                  <Badge variant="outline" className="text-green-600">Above</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bollinger Bands</span>
                  <Badge variant="outline" className="text-blue-600">Mid-range</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pattern Recognition</CardTitle>
                <CardDescription>Identified chart patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Triangle Formation</span>
                  <Badge variant="outline">Detected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Support Level</span>
                  <Badge variant="outline">$3.12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Resistance Level</span>
                  <Badge variant="outline">$3.67</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trend Direction</span>
                  <Badge variant="outline" className="text-green-600">Bullish</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Insights</CardTitle>
              <CardDescription>
                Machine learning analysis of market patterns and predictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Bullish Pattern Detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current apple prices show a strong ascending triangle pattern with 78% confidence. 
                      Historical data suggests a potential 12-15% upward movement over the next 2 weeks.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-yellow-100 dark:bg-yellow-900/40 rounded">
                    <BarChart3 className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Volume Analysis</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trading volume is 23% above average, indicating increased market interest. 
                      This supports the current price momentum.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}