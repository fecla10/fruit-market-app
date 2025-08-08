"use client"

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp, 
  TrendingDown,
  Volume2,
  Zap,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice, formatPercentage, formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  fruitSymbol: string
  fruitName: string
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE' | 'VOLUME_SPIKE'
  threshold: number
  condition: string
  active: boolean
  triggered: boolean
  lastTriggered?: Date
  createdAt: Date
  triggeredCount: number
  description?: string
}

interface CreateAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (alert: Omit<Alert, 'id' | 'createdAt' | 'triggered' | 'lastTriggered' | 'triggeredCount'>) => void
  editAlert?: Alert
}

// Mock alert data
const mockAlerts: Alert[] = [
  {
    id: '1',
    fruitSymbol: 'APPL',
    fruitName: 'Premium Red Apples',
    type: 'PRICE_ABOVE',
    threshold: 3.50,
    condition: 'Price rises above $3.50',
    active: true,
    triggered: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    triggeredCount: 0,
    description: 'Alert when apple prices hit resistance level'
  },
  {
    id: '2',
    fruitSymbol: 'BANA',
    fruitName: 'Organic Bananas',
    type: 'PRICE_BELOW',
    threshold: 2.50,
    condition: 'Price drops below $2.50',
    active: true,
    triggered: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    triggeredCount: 3
  },
  {
    id: '3',
    fruitSymbol: 'STRW',
    fruitName: 'Fresh Strawberries',
    type: 'PERCENT_CHANGE',
    threshold: 5,
    condition: 'Daily change > 5%',
    active: true,
    triggered: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    triggeredCount: 1,
    description: 'High volatility alert for strawberry season'
  },
  {
    id: '4',
    fruitSymbol: 'ORNG',
    fruitName: 'Fresh Oranges',
    type: 'VOLUME_SPIKE',
    threshold: 200,
    condition: 'Volume > 200K lbs',
    active: false,
    triggered: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    triggeredCount: 0
  }
]

const alertTypes = [
  { value: 'PRICE_ABOVE', label: 'Price Above', icon: TrendingUp, description: 'Alert when price rises above threshold' },
  { value: 'PRICE_BELOW', label: 'Price Below', icon: TrendingDown, description: 'Alert when price drops below threshold' },
  { value: 'PERCENT_CHANGE', label: 'Percent Change', icon: Zap, description: 'Alert on significant price movement' },
  { value: 'VOLUME_SPIKE', label: 'Volume Spike', icon: Volume2, description: 'Alert on high trading volume' },
]

function CreateAlertDialog({ open, onOpenChange, onSave, editAlert }: CreateAlertProps) {
  const [formData, setFormData] = useState({
    fruitSymbol: '',
    fruitName: '',
    type: 'PRICE_ABOVE' as Alert['type'],
    threshold: 0,
    active: true,
    description: ''
  })

  useEffect(() => {
    if (editAlert) {
      setFormData({
        fruitSymbol: editAlert.fruitSymbol,
        fruitName: editAlert.fruitName,
        type: editAlert.type,
        threshold: editAlert.threshold,
        active: editAlert.active,
        description: editAlert.description || ''
      })
    } else {
      setFormData({
        fruitSymbol: '',
        fruitName: '',
        type: 'PRICE_ABOVE',
        threshold: 0,
        active: true,
        description: ''
      })
    }
  }, [editAlert])

  const generateCondition = () => {
    const selectedType = alertTypes.find(t => t.value === formData.type)
    switch (formData.type) {
      case 'PRICE_ABOVE':
        return `Price rises above ${formatPrice(formData.threshold)}`
      case 'PRICE_BELOW':
        return `Price drops below ${formatPrice(formData.threshold)}`
      case 'PERCENT_CHANGE':
        return `Daily change > ${formData.threshold}%`
      case 'VOLUME_SPIKE':
        return `Volume > ${formData.threshold}K lbs`
      default:
        return ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.fruitSymbol && formData.fruitName && formData.threshold > 0) {
      onSave({
        ...formData,
        condition: generateCondition()
      })
      onOpenChange(false)
    }
  }

  const selectedType = alertTypes.find(t => t.value === formData.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editAlert ? 'Edit Alert' : 'Create Price Alert'}
          </DialogTitle>
          <DialogDescription>
            Set up automated alerts to stay informed about market movements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Fruit Symbol</Label>
                <Input
                  id="symbol"
                  value={formData.fruitSymbol}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fruitSymbol: e.target.value.toUpperCase() 
                  }))}
                  placeholder="APPL"
                  maxLength={6}
                />
              </div>
              <div>
                <Label htmlFor="name">Fruit Name</Label>
                <Input
                  id="name"
                  value={formData.fruitName}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    fruitName: e.target.value 
                  }))}
                  placeholder="Premium Red Apples"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Alert Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: Alert['type']) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map(type => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedType.description}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="threshold">
                Threshold {formData.type.includes('PRICE') ? '($)' : 
                         formData.type === 'PERCENT_CHANGE' ? '(%)' : 
                         '(K lbs)'}
              </Label>
              <Input
                id="threshold"
                type="number"
                step={formData.type.includes('PRICE') ? '0.01' : '1'}
                min="0"
                value={formData.threshold || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  threshold: parseFloat(e.target.value) || 0 
                }))}
                placeholder={formData.type.includes('PRICE') ? '3.50' : 
                           formData.type === 'PERCENT_CHANGE' ? '5' : '200'}
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
                placeholder="Optional notes about this alert..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Alert Preview</p>
                <p className="text-sm text-muted-foreground">
                  {generateCondition() || 'Configure alert parameters above'}
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  active: checked 
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.fruitSymbol || !formData.fruitName || formData.threshold <= 0}
            >
              {editAlert ? 'Update Alert' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface AlertsManagerProps {
  className?: string
}

export function AlertsManager({ className }: AlertsManagerProps) {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | undefined>()
  const [activeTab, setActiveTab] = useState('all')

  const handleCreateAlert = (newAlert: Omit<Alert, 'id' | 'createdAt' | 'triggered' | 'lastTriggered' | 'triggeredCount'>) => {
    const alert: Alert = {
      ...newAlert,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      triggered: false,
      triggeredCount: 0
    }
    setAlerts(prev => [alert, ...prev])
  }

  const handleEditAlert = (updatedAlert: Omit<Alert, 'id' | 'createdAt' | 'triggered' | 'lastTriggered' | 'triggeredCount'>) => {
    if (!editingAlert) return
    
    setAlerts(prev => prev.map(alert => 
      alert.id === editingAlert.id 
        ? { ...alert, ...updatedAlert }
        : alert
    ))
    setEditingAlert(undefined)
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ))
  }

  const handleClearTriggered = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, triggered: false, lastTriggered: undefined } : alert
    ))
  }

  const filteredAlerts = alerts.filter(alert => {
    switch (activeTab) {
      case 'active':
        return alert.active
      case 'triggered':
        return alert.triggered
      case 'inactive':
        return !alert.active
      default:
        return true
    }
  })

  const activeAlertsCount = alerts.filter(a => a.active).length
  const triggeredAlertsCount = alerts.filter(a => a.triggered).length
  const totalTriggersToday = alerts.reduce((sum, alert) => 
    alert.lastTriggered && 
    alert.lastTriggered.getDate() === new Date().getDate() 
      ? sum + 1 
      : sum, 0)

  const getAlertTypeIcon = (type: Alert['type']) => {
    const alertType = alertTypes.find(t => t.value === type)
    const Icon = alertType?.icon || Bell
    return <Icon className="h-4 w-4" />
  }

  const getAlertStatusColor = (alert: Alert) => {
    if (!alert.active) return 'text-muted-foreground'
    if (alert.triggered) return 'text-red-600'
    return 'text-green-600'
  }

  const getAlertStatusBadge = (alert: Alert) => {
    if (!alert.active) return <Badge variant="secondary">Inactive</Badge>
    if (alert.triggered) return <Badge variant="destructive">Triggered</Badge>
    return <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlertsCount}</div>
            <p className="text-xs text-muted-foreground">
              monitoring price movements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Triggered Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalTriggersToday}</div>
            <p className="text-xs text-muted-foreground">
              alerts fired today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              configured alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Price Alerts
            </CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({alerts.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeAlertsCount})
              </TabsTrigger>
              <TabsTrigger value="triggered">
                Triggered ({triggeredAlertsCount})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({alerts.length - activeAlertsCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredAlerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fruit</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead>Triggers</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {alert.fruitSymbol}
                            </Badge>
                            <div>
                              <div className="font-medium">{alert.fruitName}</div>
                              {alert.description && (
                                <div className="text-xs text-muted-foreground">
                                  {alert.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.type)}
                            <span className="text-sm">
                              {alertTypes.find(t => t.value === alert.type)?.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {alert.condition}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getAlertStatusBadge(alert)}
                        </TableCell>
                        <TableCell>
                          {alert.lastTriggered ? (
                            <div className="text-sm">
                              {formatRelativeTime(alert.lastTriggered)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {alert.triggeredCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAlert(alert.id)}
                              className={getAlertStatusColor(alert)}
                            >
                              {alert.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </Button>
                            {alert.triggered && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClearTriggered(alert.id)}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAlert(alert)
                                setCreateDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' 
                      ? "Create your first price alert to get notified of market movements."
                      : `No ${activeTab} alerts at the moment.`
                    }
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateAlertDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) setEditingAlert(undefined)
        }}
        onSave={editingAlert ? handleEditAlert : handleCreateAlert}
        editAlert={editingAlert}
      />
    </div>
  )
}