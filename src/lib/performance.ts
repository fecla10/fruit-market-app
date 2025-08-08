// Performance monitoring and optimization utilities
import { toast } from 'sonner'

interface PerformanceMetrics {
  name: string
  value: number
  timestamp: number
  type: 'navigation' | 'resource' | 'custom'
  metadata?: Record<string, any>
}

interface VitalsThresholds {
  good: number
  needsImprovement: number
}

const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []
  private vitals: Map<string, number> = new Map()

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeMonitoring() {
    // Core Web Vitals monitoring
    this.measureLCP()
    this.measureFID()
    this.measureCLS()
    this.measureFCP()
    this.measureTTFB()
    
    // Resource loading monitoring
    this.monitorResources()
    
    // Navigation timing
    this.monitorNavigation()
    
    // Memory monitoring
    this.monitorMemory()
    
    // Bundle size monitoring
    this.monitorBundleSize()
  }

  // Largest Contentful Paint
  private measureLCP() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any
      
      if (lastEntry) {
        const lcp = lastEntry.startTime
        this.vitals.set('LCP', lcp)
        this.recordMetric('LCP', lcp, 'navigation', {
          element: lastEntry.element?.tagName
        })
        
        this.evaluateVital('LCP', lcp, VITALS_THRESHOLDS.LCP)
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('[Performance] LCP monitoring not supported')
    }
  }

  // First Input Delay
  private measureFID() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime
        this.vitals.set('FID', fid)
        this.recordMetric('FID', fid, 'navigation', {
          eventType: entry.name
        })
        
        this.evaluateVital('FID', fid, VITALS_THRESHOLDS.FID)
      })
    })

    try {
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('[Performance] FID monitoring not supported')
    }
  }

  // Cumulative Layout Shift
  private measureCLS() {
    if (!('PerformanceObserver' in window)) return

    let clsValue = 0
    let sessionValue = 0
    let sessionEntries: any[] = []

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0]
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

          if (sessionValue && 
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value
            sessionEntries.push(entry)
          } else {
            sessionValue = entry.value
            sessionEntries = [entry]
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue
            this.vitals.set('CLS', clsValue)
            this.recordMetric('CLS', clsValue, 'navigation')
            this.evaluateVital('CLS', clsValue, VITALS_THRESHOLDS.CLS)
          }
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('[Performance] CLS monitoring not supported')
    }
  }

  // First Contentful Paint
  private measureFCP() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          const fcp = entry.startTime
          this.vitals.set('FCP', fcp)
          this.recordMetric('FCP', fcp, 'navigation')
          this.evaluateVital('FCP', fcp, VITALS_THRESHOLDS.FCP)
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('[Performance] FCP monitoring not supported')
    }
  }

  // Time to First Byte
  private measureTTFB() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.fetchStart
      this.vitals.set('TTFB', ttfb)
      this.recordMetric('TTFB', ttfb, 'navigation')
      this.evaluateVital('TTFB', ttfb, VITALS_THRESHOLDS.TTFB)
    }
  }

  // Resource monitoring
  private monitorResources() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (entry.duration > 1000) { // Flag slow resources
          this.recordMetric(`Resource Load: ${entry.name}`, entry.duration, 'resource', {
            type: entry.initiatorType,
            size: entry.transferSize,
            cached: entry.transferSize === 0
          })
          
          console.warn('[Performance] Slow resource detected:', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          })
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('[Performance] Resource monitoring not supported')
    }
  }

  // Navigation monitoring
  private monitorNavigation() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const metrics = {
          'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
          'TCP Connection': navigation.connectEnd - navigation.connectStart,
          'TLS Handshake': navigation.secureConnectionStart > 0 ? 
            navigation.connectEnd - navigation.secureConnectionStart : 0,
          'Request Time': navigation.responseStart - navigation.requestStart,
          'Response Time': navigation.responseEnd - navigation.responseStart,
          'DOM Processing': navigation.domContentLoadedEventStart - navigation.responseEnd,
          'Load Complete': navigation.loadEventEnd - navigation.loadEventStart
        }

        Object.entries(metrics).forEach(([name, value]) => {
          this.recordMetric(name, value, 'navigation')
        })
      }
    })
  }

  // Memory monitoring
  private monitorMemory() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory
        const memoryInfo = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }

        this.recordMetric('Memory Usage', memoryInfo.used, 'custom', memoryInfo)
        
        // Warn if memory usage is high
        const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100
        if (usagePercent > 80) {
          console.warn('[Performance] High memory usage detected:', usagePercent.toFixed(1) + '%')
        }
      }

      // Check memory every 30 seconds
      setInterval(checkMemory, 30000)
      checkMemory()
    }
  }

  // Bundle size monitoring
  private monitorBundleSize() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource')
      let totalJSSize = 0
      let totalCSSSize = 0

      resources.forEach((resource: any) => {
        if (resource.name.includes('.js')) {
          totalJSSize += resource.transferSize || 0
        } else if (resource.name.includes('.css')) {
          totalCSSSize += resource.transferSize || 0
        }
      })

      this.recordMetric('Total JS Bundle Size', totalJSSize, 'resource')
      this.recordMetric('Total CSS Bundle Size', totalCSSSize, 'resource')

      // Warn about large bundles
      if (totalJSSize > 500000) { // 500KB
        console.warn('[Performance] Large JS bundle detected:', (totalJSSize / 1024).toFixed(1) + 'KB')
      }
    })
  }

  // Record custom metrics
  public recordMetric(name: string, value: number, type: 'navigation' | 'resource' | 'custom' = 'custom', metadata?: Record<string, any>) {
    const metric: PerformanceMetrics = {
      name,
      value,
      timestamp: Date.now(),
      type,
      metadata
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    console.log('[Performance] Metric recorded:', metric)
  }

  // Evaluate vital against thresholds
  private evaluateVital(name: string, value: number, thresholds: VitalsThresholds) {
    let status: 'good' | 'needs-improvement' | 'poor'
    
    if (value <= thresholds.good) {
      status = 'good'
    } else if (value <= thresholds.needsImprovement) {
      status = 'needs-improvement'
    } else {
      status = 'poor'
    }

    console.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${status})`)

    // Show warning for poor vitals
    if (status === 'poor') {
      toast.warning(`Poor ${name}`, {
        description: `${name} is ${value.toFixed(2)}ms (target: <${thresholds.good}ms)`
      })
    }
  }

  // Get performance summary
  public getPerformanceSummary() {
    return {
      vitals: Object.fromEntries(this.vitals),
      metrics: this.metrics.slice(-20), // Last 20 metrics
      recommendations: this.getRecommendations()
    }
  }

  // Get performance recommendations
  private getRecommendations(): string[] {
    const recommendations: string[] = []
    
    const lcp = this.vitals.get('LCP')
    if (lcp && lcp > VITALS_THRESHOLDS.LCP.needsImprovement) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing resource loading')
    }
    
    const fid = this.vitals.get('FID')
    if (fid && fid > VITALS_THRESHOLDS.FID.needsImprovement) {
      recommendations.push('Reduce First Input Delay by splitting long tasks and optimizing JavaScript execution')
    }
    
    const cls = this.vitals.get('CLS')
    if (cls && cls > VITALS_THRESHOLDS.CLS.needsImprovement) {
      recommendations.push('Improve Cumulative Layout Shift by setting dimensions on images and avoiding injecting content')
    }

    return recommendations
  }

  // Export metrics for analytics
  public exportMetrics() {
    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      vitals: Object.fromEntries(this.vitals),
      metrics: this.metrics,
      recommendations: this.getRecommendations()
    }
  }

  // Cleanup
  public cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
    this.vitals.clear()
  }
}

// Utility functions for performance optimization
export class PerformanceOptimizer {
  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Lazy load images
  static setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }

  // Preload critical resources
  static preloadCriticalResources(resources: string[]) {
    resources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      
      if (resource.endsWith('.js')) {
        link.as = 'script'
      } else if (resource.endsWith('.css')) {
        link.as = 'style'
      } else if (resource.match(/\.(png|jpg|jpeg|webp|avif)$/)) {
        link.as = 'image'
      }
      
      document.head.appendChild(link)
    })
  }

  // Measure function performance
  static measureFunction<T extends (...args: any[]) => any>(
    name: string,
    func: T
  ): T {
    return ((...args: any[]) => {
      const start = performance.now()
      const result = func.apply(this, args)
      const end = performance.now()
      
      PerformanceMonitor.getInstance().recordMetric(
        `Function: ${name}`,
        end - start,
        'custom'
      )
      
      return result
    }) as T
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()

  return {
    recordMetric: (name: string, value: number, metadata?: Record<string, any>) => 
      monitor.recordMetric(name, value, 'custom', metadata),
    getSummary: () => monitor.getPerformanceSummary(),
    exportMetrics: () => monitor.exportMetrics()
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()