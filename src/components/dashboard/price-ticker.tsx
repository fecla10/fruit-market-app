"use client"

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatPercentage, getTrendInfo } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface TickerItem {
  id: string
  symbol: string
  name: string
  price: number
  change: number
  volume: string
  lastUpdate: Date
}

// Mock ticker data
const generateTickerData = (): TickerItem[] => [
  { 
    id: '1', 
    symbol: 'APPL', 
    name: 'Apples', 
    price: 2.45, 
    change: 3.2, 
    volume: '142K',
    lastUpdate: new Date()
  },
  { 
    id: '2', 
    symbol: 'BANA', 
    name: 'Bananas', 
    price: 1.89, 
    change: -1.5, 
    volume: '89K',
    lastUpdate: new Date()
  },
  { 
    id: '3', 
    symbol: 'ORNG', 
    name: 'Oranges', 
    price: 3.12, 
    change: 5.7, 
    volume: '234K',
    lastUpdate: new Date()
  },
  { 
    id: '4', 
    symbol: 'STRW', 
    name: 'Strawberries', 
    price: 4.67, 
    change: -2.3, 
    volume: '67K',
    lastUpdate: new Date()
  },
  { 
    id: '5', 
    symbol: 'MANG', 
    name: 'Mangoes', 
    price: 5.23, 
    change: 8.9, 
    volume: '45K',
    lastUpdate: new Date()
  },
  { 
    id: '6', 
    symbol: 'PINE', 
    name: 'Pineapples', 
    price: 3.78, 
    change: 1.2, 
    volume: '78K',
    lastUpdate: new Date()
  },
  { 
    id: '7', 
    symbol: 'BLUE', 
    name: 'Blueberries', 
    price: 6.45, 
    change: -0.8, 
    volume: '34K',
    lastUpdate: new Date()
  },
  { 
    id: '8', 
    symbol: 'RASP', 
    name: 'Raspberries', 
    price: 7.89, 
    change: 4.1, 
    volume: '23K',
    lastUpdate: new Date()
  },
]

interface PriceTickerProps {
  className?: string
  speed?: 'slow' | 'normal' | 'fast'
  paused?: boolean
}

export function PriceTicker({ 
  className, 
  speed = 'normal', 
  paused = false 
}: PriceTickerProps) {
  const [tickerData, setTickerData] = useState<TickerItem[]>(generateTickerData())
  const [isAnimating, setIsAnimating] = useState(!paused)

  // Simulate real-time price updates
  useEffect(() => {
    if (paused) return

    const interval = setInterval(() => {
      setTickerData(current => 
        current.map(item => ({
          ...item,
          price: item.price + (Math.random() - 0.5) * 0.1,
          change: item.change + (Math.random() - 0.5) * 2,
          lastUpdate: new Date(),
        }))
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [paused])

  const speedClasses = {
    slow: 'animate-scroll-slow',
    normal: 'animate-scroll',
    fast: 'animate-scroll-fast',
  }

  const TickerItemComponent = ({ item }: { item: TickerItem }) => {
    const trendInfo = getTrendInfo(item.change)
    
    return (
      <div className="flex items-center gap-3 px-4 py-2 whitespace-nowrap border-r">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {item.symbol}
          </Badge>
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono font-bold">
            {formatPrice(item.price)}
          </span>
          <span className={cn('font-mono', trendInfo.color)}>
            {formatPercentage(item.change)}
          </span>
          <span className="text-muted-foreground text-xs">
            Vol: {item.volume}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Live Market Prices</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Updated: {new Date().toLocaleTimeString()}</span>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="hover:text-foreground transition-colors"
          >
            {isAnimating ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>
      
      <div className="relative h-16 flex items-center overflow-hidden">
        <div 
          className={cn(
            'flex items-center gap-0',
            isAnimating && speedClasses[speed]
          )}
          style={{
            animationPlayState: isAnimating ? 'running' : 'paused'
          }}
        >
          {/* First set of ticker items */}
          {tickerData.map((item) => (
            <TickerItemComponent key={`first-${item.id}`} item={item} />
          ))}
          
          {/* Duplicate set for seamless loop */}
          {tickerData.map((item) => (
            <TickerItemComponent key={`second-${item.id}`} item={item} />
          ))}
        </div>
        
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </Card>
  )
}

// Add these CSS classes to your global CSS or Tailwind config
// @keyframes scroll {
//   0% { transform: translateX(0); }
//   100% { transform: translateX(-50%); }
// }
// .animate-scroll { animation: scroll 30s linear infinite; }
// .animate-scroll-slow { animation: scroll 60s linear infinite; }
// .animate-scroll-fast { animation: scroll 15s linear infinite; }