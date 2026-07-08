"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useERP } from '@/lib/erp/provider'
import {
  buildCategoryRevenue,
  buildDashboardSnapshot,
  buildPaymentStatusCounts,
  buildRevenueSeries,
  formatCurrency,
  notificationToneClass,
  REVENUE_RANGE_OPTIONS,
  RevenueRange,
  toArray,
} from '@/lib/erp/utils'

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'hsl(var(--chart-1))',
  ready: 'hsl(var(--chart-5))',
  shipped: 'hsl(var(--chart-4))',
  completed: 'hsl(var(--chart-2))',
  hold: 'hsl(var(--chart-3))',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: 'hsl(var(--chart-2))',
  partial: 'hsl(var(--chart-5))',
  unpaid: 'hsl(var(--chart-3))',
}

export function DashboardScreen() {
  const { data, loading, error, currentUser } = useERP()
  const snapshot = buildDashboardSnapshot(data, currentUser?.roleId)
  const overduePayments = toArray(data?.orders).filter(
    (order) => order.due > 0 && new Date(order.paymentDueDate).getTime() < Date.now()
  ).length

  const [revenueRange, setRevenueRange] = useState<RevenueRange>('6m')
  const revenueSeries = useMemo(() => buildRevenueSeries(data, revenueRange), [data, revenueRange])
  const categoryRevenue = useMemo(() => buildCategoryRevenue(data, revenueRange), [data, revenueRange])
  const paymentStatusData = Object.entries(buildPaymentStatusCounts(data)).map(([status, total]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    total,
    color: PAYMENT_STATUS_COLORS[status] ?? 'hsl(var(--chart-1))',
  }))

  const orderStatusData = Object.entries(snapshot.orderStatusCounts).map(([status, total]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    total,
    color: ORDER_STATUS_COLORS[status] ?? 'hsl(var(--chart-1))',
  }))

  const kpis = [
    { key: 'todaySales', label: "Today's sales", icon: Wallet, value: formatCurrency(snapshot.metrics.todaySales, data?.settings.currency), tone: 'chart-1' },
    { key: 'todayProfit', label: "Today's profit", icon: TrendingUp, value: formatCurrency(snapshot.metrics.todayProfit, data?.settings.currency), tone: 'chart-2' },
    { key: 'todaysOrders', label: "Today's orders", icon: ShoppingCart, value: snapshot.metrics.todaysOrders, tone: 'chart-4' },
    { key: 'pendingDelivery', label: 'Pending deliveries', icon: Package, value: snapshot.metrics.pendingDelivery, tone: 'chart-5' },
    { key: 'overduePayments', label: 'Overdue payments', icon: AlertTriangle, value: overduePayments, tone: 'destructive' },
    { key: 'lowStockCount', label: 'Low stock items', icon: AlertTriangle, value: snapshot.metrics.lowStockCount, tone: 'chart-3' },
  ] as const

  return (
    <AdminShell active="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/stock/overview">Add inventory</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/sales">Open sales</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/admin/reports">Open reports</Link>
          </Button>
        </div>

        {error ? (
          <Card className="border-rose-200 bg-rose-500/5">
            <CardContent className="p-5 text-sm text-rose-700 dark:text-rose-300">{error}</CardContent>
          </Card>
        ) : null}

        {loading ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading realtime dashboard data...</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {kpis.map((item) => {
            const Icon = item.icon

            return (
              <Card
                key={item.key}
                className="overflow-hidden border-border/70 shadow-sm transition-transform hover:-translate-y-0.5"
                style={{ borderTopWidth: 3, borderTopColor: `hsl(var(--${item.tone}))` }}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `hsl(var(--${item.tone}) / 0.15)`, color: `hsl(var(--${item.tone}))` }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 truncate text-lg font-semibold tracking-tight">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Revenue vs expense</CardTitle>
              <CardDescription>Order revenue against purchase spend over the selected period.</CardDescription>
            </div>
            <Select value={revenueRange} onValueChange={(value) => setRevenueRange(value as RevenueRange)}>
              <SelectTrigger className="w-40 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVENUE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--chart-3))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Order status mix</CardTitle>
              <CardDescription>Share of orders currently in each pipeline stage.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {orderStatusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="total"
                      nameKey="status"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                      cornerRadius={4}
                    >
                      {orderStatusData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Order volume</CardTitle>
              <CardDescription>
                Number of orders placed over {REVENUE_RANGE_OPTIONS.find((option) => option.value === revenueRange)?.label.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue by category</CardTitle>
              <CardDescription>
                Top product categories by revenue over {REVENUE_RANGE_OPTIONS.find((option) => option.value === revenueRange)?.label.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {categoryRevenue.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRevenue} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={110} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, data?.settings.currency)} />
                    <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                      {categoryRevenue.map((entry, index) => (
                        <Cell key={entry.category} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No sales recorded for this period.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Payment status mix</CardTitle>
              <CardDescription>Share of orders by payment status.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {paymentStatusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      dataKey="total"
                      nameKey="status"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                      cornerRadius={4}
                    >
                      {paymentStatusData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No orders recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Top selling products</CardTitle>
              <CardDescription>Products with the strongest sales contribution so far.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.topProducts.length ? (
                snapshot.topProducts.map((product) => (
                  <div key={product.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sold} sold · {product.stockQty} in stock</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.revenue, data?.settings.currency)}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Low stock items</CardTitle>
              <CardDescription>Products that need replenishment soon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.lowStock.length ? (
                snapshot.lowStock.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Minimum {product.minStock} · Available {product.stockQty}</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/admin/stock/overview">
                        Restock
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No low stock products right now.</p>
              )}
            </CardContent>
          </Card>
        </div>

    
      </div>
    </AdminShell>
  )
}
