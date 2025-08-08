"use client"

import { useEffect, useRef } from 'react'
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  LineData,
  ColorType 
} from 'lightweight-charts'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface SparklineData {
  time: string | number
  value: number
}

interface MiniSparklineProps {
  data: SparklineData[]
  width?: number
  height?: number
  color?: string
  positiveColor?: string
  negativeColor?: string
  className?: string
  showLastValue?: boolean
  animate?: boolean
}

export function MiniSparkline({
  data,
  width = 120,
  height = 40,
  color,
  positiveColor = '#10B981',
  negativeColor = '#EF4444',
  className,
  showLastValue = false,
  animate = true
}: MiniSparklineProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const { theme } = useTheme()

  // Determine if the trend is positive or negative
  const isPositiveTrend = data.length >= 2 && data[data.length - 1].value > data[0].value
  const lineColor = color || (isPositiveTrend ? positiveColor : negativeColor)
  
  // Get the last value for display
  const lastValue = data.length > 0 ? data[data.length - 1].value : null

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return

    // Chart configuration for sparkline
    const chartOptions = {
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: 'transparent' 
        },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0, // Disabled
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width,
      height,
    })

    // Create line series
    const lineSeries = chart.addLineSeries({
      color: lineColor,
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    })

    // Convert data to the format expected by TradingView
    const chartData: LineData[] = data.map((point, index) => ({
      time: point.time as any,
      value: point.value
    }))

    // Set data
    if (animate) {
      // Animate data loading
      const animateData = () => {
        for (let i = 0; i <= chartData.length; i++) {
          setTimeout(() => {
            if (i < chartData.length && lineSeries) {
              lineSeries.setData(chartData.slice(0, i + 1))
            }
          }, i * 50) // 50ms delay between each point
        }
      }
      animateData()
    } else {
      lineSeries.setData(chartData)
    }

    // Fit content
    chart.timeScale().fitContent()

    chartRef.current = chart
    seriesRef.current = lineSeries

    return () => {
      if (chart) {
        chart.remove()
      }
    }
  }, [data, width, height, lineColor, animate])

  // Handle theme changes
  useEffect(() => {
    if (chartRef.current && seriesRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: { 
            type: ColorType.Solid, 
            color: 'transparent' 
          },
        },
      })
      
      seriesRef.current.applyOptions({
        color: lineColor,
      })
    }
  }, [theme, lineColor])

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <div 
        ref={chartContainerRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="shrink-0"
      />
      {showLastValue && lastValue !== null && (
        <span 
          className={cn(
            'ml-2 text-sm font-medium',
            isPositiveTrend ? 'text-green-600' : 'text-red-600'
          )}
        >
          {lastValue.toFixed(2)}
        </span>
      )}
    </div>
  )
}

// Utility function to generate sample sparkline data
export function generateSparklineData(
  points: number = 20,
  baseValue: number = 100,
  volatility: number = 0.1
): SparklineData[] {
  const data: SparklineData[] = []
  let currentValue = baseValue
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * volatility * baseValue
    currentValue += change
    
    data.push({
      time: Date.now() - (points - i) * 3600000, // Hourly data
      value: currentValue
    })
  }
  
  return data
}

// Preset configurations for common use cases
export const SparklinePresets = {
  price: {
    positiveColor: '#10B981',
    negativeColor: '#EF4444',
    height: 32,
    width: 100,
  },
  volume: {
    color: '#6366F1',
    height: 24,
    width: 80,
  },
  performance: {
    positiveColor: '#059669',
    negativeColor: '#DC2626',
    height: 40,
    width: 120,
    showLastValue: true,
  }
} as const