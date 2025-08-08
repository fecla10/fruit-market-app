"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  LineData,
  AreaSeriesOptions,
  LineSeriesOptions
} from 'lightweight-charts'
import { useMarketAnalytics } from '@/hooks/useAnalytics'
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface MarketTrendsChartProps {
  period?: string
  height?: number
  className?: string
}

export function MarketTrendsChart({ 
  period = '30d', 
  height = 300,
  className 
}: MarketTrendsChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const priceSeriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  
  const [chartType, setChartType] = useState<'price' | 'volume' | 'volatility'>('price')
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  
  const { data: analytics, isLoading, error } = useMarketAnalytics({ 
    period: selectedPeriod,
    refreshInterval: 60000 // 1 minute
  })

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !analytics?.marketTrends) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#374151',
      },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    })

    chartRef.current = chart

    // Create series based on chart type
    if (chartType === 'price') {
      const priceSeries = chart.addAreaSeries({
        topColor: 'rgba(34, 197, 94, 0.4)',
        bottomColor: 'rgba(34, 197, 94, 0.0)',
        lineColor: 'rgba(34, 197, 94, 1)',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      })
      priceSeriesRef.current = priceSeries
      
      // Convert data for price series
      const priceData: LineData[] = analytics.marketTrends.map(trend => ({
        time: trend.date,
        value: trend.avgPrice,
      }))
      
      priceSeries.setData(priceData)
      
    } else if (chartType === 'volume') {
      const volumeSeries = chart.addLineSeries({
        color: 'rgba(147, 51, 234, 1)',
        lineWidth: 2,
        priceFormat: {
          type: 'volume',
        },
      })
      volumeSeriesRef.current = volumeSeries
      
      // Convert data for volume series
      const volumeData: LineData[] = analytics.marketTrends.map(trend => ({
        time: trend.date,
        value: trend.totalVolume,
      }))
      
      volumeSeries.setData(volumeData)
      
    } else if (chartType === 'volatility') {
      const volatilitySeries = chart.addAreaSeries({
        topColor: 'rgba(239, 68, 68, 0.4)',
        bottomColor: 'rgba(239, 68, 68, 0.0)',
        lineColor: 'rgba(239, 68, 68, 1)',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })
      
      // Convert data for volatility series
      const volatilityData: LineData[] = analytics.marketTrends.map(trend => ({
        time: trend.date,
        value: trend.volatility,
      }))
      
      volatilitySeries.setData(volatilityData)
    }

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      priceSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [analytics, chartType, height])

  const getChartStats = () => {
    if (!analytics?.marketTrends || analytics.marketTrends.length === 0) return null

    const trends = analytics.marketTrends
    const latest = trends[trends.length - 1]
    const previous = trends[trends.length - 2]

    if (!latest || !previous) return null

    switch (chartType) {
      case 'price':
        const priceChange = latest.avgPrice - previous.avgPrice
        const priceChangePercent = (priceChange / previous.avgPrice) * 100
        return {
          current: formatCurrency(latest.avgPrice),
          change: formatCurrency(Math.abs(priceChange)),
          changePercent: priceChangePercent.toFixed(2),
          isPositive: priceChange >= 0,
          label: 'Average Price'
        }
      
      case 'volume':
        const volumeChange = latest.totalVolume - previous.totalVolume
        const volumeChangePercent = (volumeChange / previous.totalVolume) * 100
        return {
          current: formatNumber(latest.totalVolume),
          change: formatNumber(Math.abs(volumeChange)),
          changePercent: volumeChangePercent.toFixed(2),
          isPositive: volumeChange >= 0,
          label: 'Total Volume'
        }
      
      case 'volatility':
        const volatilityChange = latest.volatility - previous.volatility
        const volatilityChangePercent = previous.volatility !== 0 ? 
          (volatilityChange / previous.volatility) * 100 : 0
        return {
          current: latest.volatility.toFixed(4),
          change: Math.abs(volatilityChange).toFixed(4),
          changePercent: volatilityChangePercent.toFixed(2),
          isPositive: volatilityChange >= 0,
          label: 'Volatility'
        }
      
      default:
        return null
    }
  }

  const stats = getChartStats()

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load market trends</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Trends
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div className="flex rounded-lg border">
              {['7d', '30d', '90d'].map((p) => (
                <Button
                  key={p}
                  variant={selectedPeriod === p ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  onClick={() => setSelectedPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex rounded-lg border">
              {[
                { key: 'price', label: 'Price', icon: TrendingUp },
                { key: 'volume', label: 'Volume', icon: BarChart3 },
                { key: 'volatility', label: 'Volatility', icon: Activity }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={chartType === key ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  onClick={() => setChartType(key as any)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stats Display */}
        {stats && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{stats.label}</p>
                <p className="text-2xl font-bold">{stats.current}</p>
              </div>
              
              <div className="flex items-center gap-1">
                {stats.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  stats.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {stats.isPositive ? '+' : '-'}{stats.change}
                </span>
                <Badge 
                  variant="outline"
                  className={cn(
                    stats.isPositive ? "text-green-600 border-green-600" : "text-red-600 border-red-600"
                  )}
                >
                  {stats.isPositive ? '+' : '-'}{stats.changePercent}%
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">
              Loading chart data...
            </div>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full" />
        )}
      </CardContent>
    </Card>
  )
}