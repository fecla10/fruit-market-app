/**
 * Utility functions for formatting data in the application
 */

/**
 * Format price with currency symbol and proper decimal places
 */
export function formatPrice(
  price: number, 
  currency: string = 'USD',
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price)
}

/**
 * Format currency (alias for formatPrice for compatibility)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  return formatPrice(amount, currency, decimals)
}

/**
 * Format percentage change with + or - sign
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  showSign: boolean = true
): string {
  const formatted = Math.abs(value).toFixed(decimals)
  const sign = value >= 0 ? '+' : '-'
  
  return showSign ? `${sign}${formatted}%` : `${formatted}%`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(
  num: number,
  decimals: number = 1
): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B'
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M'
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K'
  }
  return num.toString()
}

/**
 * Format volume with appropriate units
 */
export function formatVolume(volume: number): string {
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M lbs`
  }
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K lbs`
  }
  return `${volume} lbs`
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(dateObj)
}

/**
 * Format time for display
 */
export function formatTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: true,
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }

  return 'just now'
}

/**
 * Format market cap
 */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  }
  return formatPrice(value)
}

/**
 * Get trend direction and color
 */
export function getTrendInfo(value: number) {
  const isPositive = value > 0
  const isNegative = value < 0
  
  return {
    direction: isPositive ? 'up' : isNegative ? 'down' : 'neutral',
    color: isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600',
    bgColor: isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50',
    darkBgColor: isPositive ? 'dark:bg-green-900/20' : isNegative ? 'dark:bg-red-900/20' : 'dark:bg-gray-900/20',
    icon: isPositive ? '↗' : isNegative ? '↘' : '→',
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}