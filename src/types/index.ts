import { User, Fruit, Price, Watchlist, Alert, Portfolio, Note, Role, AlertType } from '@prisma/client'

export type {
  User,
  Fruit,
  Price,
  Watchlist,
  Alert,
  Portfolio,
  Note,
  Role,
  AlertType
}

export interface FruitWithPrices extends Fruit {
  prices: Price[]
}

export interface UserWithRelations extends User {
  watchlists: Watchlist[]
  alerts: Alert[]
  portfolios: Portfolio[]
  notes: Note[]
}

export interface ChartData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface PriceChange {
  value: number
  percentage: number
  trend: 'up' | 'down' | 'neutral'
}

export interface MarketOverview {
  totalFruits: number
  avgPrice: number
  topGainer: {
    fruit: Fruit
    change: PriceChange
  }
  topLoser: {
    fruit: Fruit
    change: PriceChange
  }
}

export interface APIResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
}