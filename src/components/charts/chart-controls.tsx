"use client"

import { useState } from 'react'
import { 
  TrendingUp, 
  Minus, 
  Activity,
  BarChart3,
  Zap,
  Target,
  Edit,
  RotateCcw,
  Download,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface TechnicalIndicator {
  id: string
  name: string
  symbol: string
  enabled: boolean
  color: string
}

interface DrawingTool {
  id: string
  name: string
  icon: React.ComponentType<any>
  active: boolean
}

const technicalIndicators: TechnicalIndicator[] = [
  { id: 'sma20', name: 'Simple Moving Average (20)', symbol: 'SMA20', enabled: false, color: '#3B82F6' },
  { id: 'sma50', name: 'Simple Moving Average (50)', symbol: 'SMA50', enabled: false, color: '#EF4444' },
  { id: 'ema20', name: 'Exponential Moving Average (20)', symbol: 'EMA20', enabled: false, color: '#10B981' },
  { id: 'bb', name: 'Bollinger Bands', symbol: 'BB', enabled: false, color: '#8B5CF6' },
  { id: 'rsi', name: 'Relative Strength Index', symbol: 'RSI', enabled: false, color: '#F59E0B' },
  { id: 'macd', name: 'MACD', symbol: 'MACD', enabled: false, color: '#EC4899' },
]

const drawingTools: DrawingTool[] = [
  { id: 'trendline', name: 'Trend Line', icon: TrendingUp, active: false },
  { id: 'horizontal', name: 'Horizontal Line', icon: Minus, active: false },
  { id: 'rectangle', name: 'Rectangle', icon: Target, active: false },
  { id: 'annotation', name: 'Text Annotation', icon: Edit, active: false },
]

interface ChartControlsProps {
  className?: string
  onIndicatorToggle?: (indicatorId: string, enabled: boolean) => void
  onDrawingToolSelect?: (toolId: string) => void
  onTimeframeChange?: (timeframe: string) => void
  onExport?: () => void
  onReset?: () => void
}

export function ChartControls({
  className,
  onIndicatorToggle,
  onDrawingToolSelect,
  onTimeframeChange,
  onExport,
  onReset
}: ChartControlsProps) {
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>(technicalIndicators)
  const [tools, setTools] = useState<DrawingTool[]>(drawingTools)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')

  const handleIndicatorToggle = (indicatorId: string) => {
    setIndicators(prev => 
      prev.map(indicator => 
        indicator.id === indicatorId 
          ? { ...indicator, enabled: !indicator.enabled }
          : indicator
      )
    )
    
    const indicator = indicators.find(i => i.id === indicatorId)
    if (indicator) {
      onIndicatorToggle?.(indicatorId, !indicator.enabled)
    }
  }

  const handleDrawingToolSelect = (toolId: string) => {
    setTools(prev => 
      prev.map(tool => ({
        ...tool,
        active: tool.id === toolId ? !tool.active : false
      }))
    )
    
    const tool = tools.find(t => t.id === toolId)
    if (tool) {
      onDrawingToolSelect?.(tool.active ? '' : toolId)
    }
  }

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe)
    onTimeframeChange?.(timeframe)
  }

  const enabledIndicators = indicators.filter(i => i.enabled)
  const activeTool = tools.find(t => t.active)

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center gap-2 p-2 bg-card border rounded-lg flex-wrap',
        className
      )}>
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1">
          {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(timeframe => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeframeChange(timeframe)}
              className="h-7 px-2 text-xs"
            >
              {timeframe}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Technical Indicators */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Indicators
              {enabledIndicators.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {enabledIndicators.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>Technical Indicators</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {indicators.map(indicator => (
              <DropdownMenuItem
                key={indicator.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleIndicatorToggle(indicator.id)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: indicator.color }}
                  />
                  <span>{indicator.name}</span>
                </div>
                {indicator.enabled && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    ON
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {drawingTools.map(tool => {
            const Icon = tool.icon
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool.active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDrawingToolSelect(tool.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Icon className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tool.name}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onReset} className="h-7 w-7 p-0">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Chart</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onExport} className="h-7 w-7 p-0">
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Chart</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Chart Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Grid Lines</DropdownMenuItem>
              <DropdownMenuItem>Price Scale</DropdownMenuItem>
              <DropdownMenuItem>Time Scale</DropdownMenuItem>
              <DropdownMenuItem>Volume</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Indicators Display */}
        {enabledIndicators.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1 flex-wrap">
              {enabledIndicators.map(indicator => (
                <Badge 
                  key={indicator.id}
                  variant="outline" 
                  className="h-6 px-2 text-xs cursor-pointer hover:bg-muted"
                  onClick={() => handleIndicatorToggle(indicator.id)}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: indicator.color }}
                  />
                  {indicator.symbol}
                </Badge>
              ))}
            </div>
          </>
        )}

        {/* Active Tool Display */}
        {activeTool && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="default" className="h-6 px-2 text-xs">
              {activeTool.name} Active
            </Badge>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}