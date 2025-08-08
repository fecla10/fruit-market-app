"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData,
  LineData,
  Time,
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
  Maximize2, 
  TrendingUp, 
  BarChart3, 
  Activity,
  Volume2,
  Settings
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { ChartControls } from './chart-controls'
import { cn } from '@/lib/utils'

export interface PriceData {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface MainPriceChartProps {
  data: PriceData[]
  title?: string
  symbol?: string
  className?: string
  height?: number
  showControls?: boolean
  showVolume?: boolean
  onTimeframeChange?: (timeframe: string) => void
}

type ChartType = 'candlestick' | 'line' | 'area'
type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

export function MainPriceChart({
  data,
  title = "Price Chart",
  symbol = "FRUIT",
  className,
  height = 400,
  showControls = true,
  showVolume = true,
  onTimeframeChange
}: MainPriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  
  const { theme } = useTheme()
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<{ value: number; percentage: number } | null>(null)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Chart configuration
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
          bottom: showVolume ? 0.3 : 0.1,
        },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#374151' : '#E5E7EB',
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (price: number) => `$${price.toFixed(2)}`,
      },
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: height,
    })

    chartRef.current = chart

    // Add main price series based on type
    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderDownColor: '#EF4444',
        borderUpColor: '#10B981',
        wickDownColor: '#EF4444',
        wickUpColor: '#10B981',
      })
      candlestickSeriesRef.current = candlestickSeries
    } else if (chartType === 'line') {
      const lineSeries = chart.addLineSeries({
        color: '#3B82F6',
        lineWidth: 2,
      })
      lineSeriesRef.current = lineSeries
    } else if (chartType === 'area') {
      const areaSeries = chart.addAreaSeries({
        topColor: 'rgba(59, 130, 246, 0.56)',
        bottomColor: 'rgba(59, 130, 246, 0.04)',
        lineColor: 'rgba(59, 130, 246, 1)',
        lineWidth: 2,
      })
      areaSeriesRef.current = areaSeries
    }

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#9CA3AF',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })
      volumeSeriesRef.current = volumeSeries
    }

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
      if (chart) {
        chart.remove()
      }
    }
  }, [theme, chartType, showVolume, height])

  // Update data when props change
  useEffect(() => {
    if (!data.length) return

    // Set data for the active series
    if (chartType === 'candlestick' && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(data as CandlestickData[])
    } else if (chartType === 'line' && lineSeriesRef.current) {
      const lineData = data.map(item => ({
        time: item.time,
        value: item.close
      })) as LineData[]
      lineSeriesRef.current.setData(lineData)
    } else if (chartType === 'area' && areaSeriesRef.current) {
      const areaData = data.map(item => ({
        time: item.time,
        value: item.close
      })) as LineData[]
      areaSeriesRef.current.setData(areaData)
    }

    // Set volume data
    if (showVolume && volumeSeriesRef.current) {
      const volumeData = data
        .filter(item => item.volume !== undefined)
        .map(item => ({
          time: item.time,
          value: item.volume!,
          color: item.close >= item.open ? '#10B98180' : '#EF444480'
        }))
      volumeSeriesRef.current.setData(volumeData)
    }

    // Update current price and price change
    if (data.length > 0) {
      const latest = data[data.length - 1]
      const previous = data.length > 1 ? data[data.length - 2] : latest
      
      setCurrentPrice(latest.close)
      const change = latest.close - previous.close
      const changePercentage = (change / previous.close) * 100
      setPriceChange({ value: change, percentage: changePercentage })
    }
  }, [data, chartType, showVolume])

  const handleChartTypeChange = useCallback((newType: ChartType) => {
    setChartType(newType)
  }, [])

  const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe)
    onTimeframeChange?.(newTimeframe)
  }, [onTimeframeChange])

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
    // In a real app, implement fullscreen logic
  }, [isFullscreen])

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return '↗'
    if (change < 0) return '↘'
    return '→'
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-medium">
            {title}
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {symbol}
          </Badge>
          {currentPrice && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-lg font-bold">
                ${currentPrice.toFixed(2)}
              </span>
              {priceChange && (
                <span className={cn('text-sm font-medium', getPriceChangeColor(priceChange.value))}>
                  {getPriceChangeIcon(priceChange.value)}
                  ${Math.abs(priceChange.value).toFixed(2)} ({Math.abs(priceChange.percentage).toFixed(2)}%)
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showControls && (
            <>
              {/* Chart Type Selector */}
              <Select value={chartType} onValueChange={(value: ChartType) => handleChartTypeChange(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candlestick">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Candlestick
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Line
                    </div>
                  </SelectItem>
                  <SelectItem value="area">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Area
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Timeframe Selector */}
              <Select value={timeframe} onValueChange={(value: Timeframe) => handleTimeframeChange(value)}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1D">1D</SelectItem>
                  <SelectItem value="1W">1W</SelectItem>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                  <SelectItem value="ALL">ALL</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          
          <Button variant="outline" size="sm" onClick={handleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
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