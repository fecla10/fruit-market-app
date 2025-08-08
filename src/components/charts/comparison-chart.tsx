"use client"

import { useEffect, useRef, useState } from 'react'
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  LineData,
  ColorType,
  CrosshairMode
} from 'lightweight-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Maximize2
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { formatPrice, formatPercentage, getTrendInfo } from '@/lib/utils/formatters'

export interface ComparisonData {
  symbol: string
  name: string
  data: Array<{
    time: string | number
    value: number
  }>
  color: string
  currentPrice?: number
  change?: number
  changePercentage?: number
}

interface ComparisonChartProps {
  data: ComparisonData[]
  title?: string
  className?: string
  height?: number
  onRemoveSeries?: (symbol: string) => void
  onAddSeries?: () => void
  maxSeries?: number
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

export function ComparisonChart({
  data,
  title = "Price Comparison",
  className,
  height = 400,
  onRemoveSeries,
  onAddSeries,
  maxSeries = 6
}: ComparisonChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
  
  const { theme } = useTheme()
  const [normalizeData, setNormalizeData] = useState(false)
  const [timeframe, setTimeframe] = useState('1D')

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chartOptions = {
      layout: {
        textColor: theme === 'dark' ? '#D1D5DB' : '#374151',
        background: { 
          type: ColorType.Solid, 
          color: theme === 'dark' ? '#111827' : '#FFFFFF' 
        },
      },
      grid: {
        vertLines: { 
          color: theme === 'dark' ? '#374151' : '#E5E7EB',
          style: 1,
          visible: true
        },
        horzLines: { 
          color: theme === 'dark' ? '#374151' : '#E5E7EB',
          style: 1,
          visible: true
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: normalizeData
          ? (price: number) => `${price.toFixed(2)}%`
          : (price: number) => `$${price.toFixed(2)}`,
      },
    }

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: height,
    })

    chartRef.current = chart

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      seriesRefs.current.clear()
      if (chart) {
        chart.remove()
      }
    }
  }, [theme, height, normalizeData])

  // Update series data
  useEffect(() => {
    if (!chartRef.current || !data.length) return

    const chart = chartRef.current
    
    // Clear existing series
    seriesRefs.current.forEach((series, symbol) => {
      if (!data.find(d => d.symbol === symbol)) {
        chart.removeSeries(series)
        seriesRefs.current.delete(symbol)
      }
    })

    // Add or update series
    data.forEach((item, index) => {
      let series = seriesRefs.current.get(item.symbol)
      
      if (!series) {
        // Create new series
        series = chart.addLineSeries({
          color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          lineWidth: 2,
          title: item.name,
        })
        seriesRefs.current.set(item.symbol, series)
      } else {
        // Update existing series color
        series.applyOptions({
          color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        })
      }

      // Prepare data
      let chartData: LineData[]

      if (normalizeData && item.data.length > 0) {
        // Normalize to percentage change from first value
        const baseValue = item.data[0].value
        chartData = item.data.map(point => ({
          time: point.time as any,
          value: ((point.value - baseValue) / baseValue) * 100
        }))
      } else {
        chartData = item.data.map(point => ({
          time: point.time as any,
          value: point.value
        }))
      }

      series.setData(chartData)
    })

    // Fit content
    chart.timeScale().fitContent()
  }, [data, normalizeData])

  const handleRemoveSeries = (symbol: string) => {
    if (chartRef.current && seriesRefs.current.has(symbol)) {
      const series = seriesRefs.current.get(symbol)!
      chartRef.current.removeSeries(series)
      seriesRefs.current.delete(symbol)
    }
    onRemoveSeries?.(symbol)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select 
              value={normalizeData ? 'percentage' : 'absolute'} 
              onValueChange={(value) => setNormalizeData(value === 'percentage')}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">Price ($)</SelectItem>
                <SelectItem value="percentage">Change (%)</SelectItem>
              </SelectContent>
            </Select>

            {onAddSeries && data.length < maxSeries && (
              <Button variant="outline" size="sm" onClick={onAddSeries}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
            
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend with current prices */}
        <div className="flex flex-wrap gap-2">
          {data.map((item, index) => {
            const trendInfo = item.change !== undefined 
              ? getTrendInfo(item.change) 
              : null

            return (
              <div 
                key={item.symbol}
                className="flex items-center gap-2 p-2 rounded-md border bg-card"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] 
                  }}
                />
                <span className="text-sm font-medium">{item.name}</span>
                <Badge variant="outline" className="text-xs">
                  {item.symbol}
                </Badge>
                
                {item.currentPrice !== undefined && (
                  <span className="text-sm font-bold">
                    {formatPrice(item.currentPrice)}
                  </span>
                )}
                
                {item.change !== undefined && trendInfo && (
                  <span className={cn('text-xs', trendInfo.color)}>
                    {trendInfo.icon} {formatPercentage(Math.abs(item.changePercentage || 0))}
                  </span>
                )}
                
                {onRemoveSeries && data.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveSeries(item.symbol)}
                    className="h-5 w-5 p-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={chartContainerRef}
          className="relative"
          style={{ height: `${height}px` }}
        />
      </CardContent>
    </Card>
  )
}

// Utility function to generate comparison data
export function generateComparisonData(
  fruits: Array<{ symbol: string; name: string; basePrice: number }>,
  points: number = 100
): ComparisonData[] {
  return fruits.map((fruit, index) => {
    const data = []
    let currentPrice = fruit.basePrice
    const startPrice = currentPrice
    
    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * 0.05 * currentPrice
      currentPrice += change
      
      data.push({
        time: Date.now() - (points - i) * 3600000,
        value: currentPrice
      })
    }
    
    const finalPrice = currentPrice
    const change = finalPrice - startPrice
    const changePercentage = (change / startPrice) * 100
    
    return {
      symbol: fruit.symbol,
      name: fruit.name,
      data,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      currentPrice: finalPrice,
      change,
      changePercentage
    }
  })
}