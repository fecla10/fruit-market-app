"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  TrendingUp,
  Search,
  Heart,
  Bell,
  Briefcase,
  BarChart3,
  GitCompare,
  Settings,
  HelpCircle,
  Zap,
  Archive,
  User
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: true
  },
  {
    name: 'Markets',
    href: '/markets',
    icon: TrendingUp,
    badge: 'Live'
  },
  {
    name: 'Charts',
    href: '/charts',
    icon: BarChart3
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search
  }
]

const personalNavigation = [
  {
    name: 'Watchlist',
    href: '/watchlist',
    icon: Heart,
    badge: '12'
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: Bell,
    badge: '3'
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: Briefcase
  }
]

const analyticsNavigation = [
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3
  },
  {
    name: 'Compare',
    href: '/compare',
    icon: GitCompare
  },
  {
    name: 'Trends',
    href: '/trends',
    icon: Zap
  }
]

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  },
  {
    name: 'Help & Support',
    href: '/help',
    icon: HelpCircle
  }
]

export function Sidebar({ collapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname()

  const NavItem = ({ 
    item, 
    collapsed 
  }: { 
    item: typeof navigation[0] & { badge?: string }, 
    collapsed: boolean 
  }) => {
    const Icon = item.icon
    const isActive = pathname === item.href

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
          isActive 
            ? "bg-accent text-accent-foreground" 
            : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className={cn("h-4 w-4", collapsed ? "h-5 w-5" : "")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <Badge 
                variant={item.badge === 'Live' ? 'destructive' : 'secondary'}
                className="h-5 px-1.5 text-xs"
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    )
  }

  const SectionHeader = ({ title }: { title: string }) => {
    if (collapsed) return <Separator className="my-2" />
    
    return (
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar Header with Toggle */}
      <div className="flex h-16 items-center border-b px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="font-bold">Fruit Markets</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "h-8 w-8 p-0",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar Content */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {/* Main Navigation */}
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} collapsed={collapsed} />
          ))}

          <SectionHeader title="Personal" />
          
          {/* Personal Navigation */}
          {personalNavigation.map((item) => (
            <NavItem key={item.name} item={item} collapsed={collapsed} />
          ))}

          <SectionHeader title="Analytics" />
          
          {/* Analytics Navigation */}
          {analyticsNavigation.map((item) => (
            <NavItem key={item.name} item={item} collapsed={collapsed} />
          ))}
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="border-t p-3">
        <div className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavItem key={item.name} item={item} collapsed={collapsed} />
          ))}
        </div>
        
        {!collapsed && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Archive className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">Data Archive</p>
                <p className="text-xs text-muted-foreground">
                  Historical data available
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}