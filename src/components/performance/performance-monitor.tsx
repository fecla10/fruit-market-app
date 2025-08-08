"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Clock, 
  Gauge, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { usePerformanceMonitor } from '@/lib/performance'
import { formatNumber } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface PerformanceMonitorProps {
  className?: string
  showDetails?: boolean
}

export function PerformanceMonitor({ className, showDetails = false }: PerformanceMonitorProps) {
  const { getSummary, exportMetrics } = usePerformanceMonitor()
  const [summary, setSummary] = useState(getSummary())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const updateSummary = () => setSummary(getSummary())
    
    const interval = setInterval(updateSummary, 5000)
    updateSummary()
    
    return () => clearInterval(interval)
  }, [getSummary])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate refresh
    setSummary(getSummary())
    setIsRefreshing(false)
  }

  const handleExport = () => {
    const metrics = exportMetrics()
    const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getVitalStatus = (name: string, value: number) => {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    }

    const threshold = thresholds[name]
    if (!threshold) return 'neutral'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.needsImprovement) return 'needs-improvement'
    return 'poor'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return CheckCircle
      case 'needs-improvement': return AlertTriangle
      case 'poor': return XCircle
      default: return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-3 w-3 mr-1', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              {showDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                >
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(summary.vitals).map(([name, value]) => {
              const status = getVitalStatus(name, value)
              const StatusIcon = getStatusIcon(status)
              
              return (
                <div key={name} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{name}</span>
                    <StatusIcon className={cn(
                      'h-4 w-4',
                      status === 'good' && 'text-green-600',
                      status === 'needs-improvement' && 'text-yellow-600',
                      status === 'poor' && 'text-red-600'
                    )} />
                  </div>
                  
                  <div className="text-lg font-bold mb-1">
                    {name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`}
                  </div>
                  
                  <Badge 
                    variant="outline"
                    className={cn('text-xs', getStatusColor(status))}
                  >
                    {status === 'good' && 'Good'}
                    {status === 'needs-improvement' && 'Needs Improvement'}
                    {status === 'poor' && 'Poor'}
                  </Badge>
                </div>
              )
            })}
          </div>
          
          {/* Performance Score */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Performance Score</span>
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            
            {(() => {
              const vitals = Object.entries(summary.vitals)
              const goodCount = vitals.filter(([name, value]) => 
                getVitalStatus(name, value) === 'good'
              ).length
              const score = Math.round((goodCount / vitals.length) * 100)
              
              return (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <Progress value={score} className="flex-1" />
                    <span className="text-lg font-bold">{score}/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goodCount} of {vitals.length} vitals are in good range
                  </p>
                </>
              )
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Metrics
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {summary.metrics.slice(-10).map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{metric.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {metric.type}
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-mono">
                    {formatNumber(metric.value)}
                    {metric.name.includes('Time') || metric.name.includes('Duration') ? 'ms' : ''}
                  </div>
                </div>
              ))}
              
              {summary.metrics.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No metrics recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Compact version for dashboard
export function PerformanceWidget({ className }: { className?: string }) {
  const { getSummary } = usePerformanceMonitor()
  const [summary, setSummary] = useState(getSummary())

  useEffect(() => {
    const updateSummary = () => setSummary(getSummary())
    const interval = setInterval(updateSummary, 10000)
    updateSummary()
    return () => clearInterval(interval)
  }, [getSummary])

  const vitals = Object.entries(summary.vitals)
  const goodCount = vitals.filter(([name, value]) => {
    const thresholds: Record<string, { good: number }> = {
      LCP: { good: 2500 },
      FID: { good: 100 },
      CLS: { good: 0.1 },
      FCP: { good: 1800 },
      TTFB: { good: 800 }
    }
    return value <= (thresholds[name]?.good || Infinity)
  }).length
  
  const score = vitals.length > 0 ? Math.round((goodCount / vitals.length) * 100) : 0

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Performance
          </h3>
          <Badge 
            variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {score}/100
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Core Web Vitals</span>
            <span className="text-muted-foreground">
              {goodCount}/{vitals.length} good
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>
        
        {summary.recommendations.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {summary.recommendations.length} recommendation{summary.recommendations.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}