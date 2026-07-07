"use client"

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Package,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useERP } from '@/lib/erp/provider'
import {
  activitySummary,
  buildDashboardSnapshot,
  formatCurrency,
  formatDateTime,
  notificationToneClass,
  toArray,
} from '@/lib/erp/utils'

const metricMeta = [
  { key: 'todaySales', label: "Today's total sales", icon: Wallet },
  { key: 'todayPurchase', label: "Today's purchase", icon: CreditCard },
  { key: 'todayProfit', label: "Today's profit", icon: TrendingUp },
  { key: 'todayExpense', label: "Today's expense", icon: ShoppingCart },
  { key: 'pendingDelivery', label: 'Pending deliveries', icon: Package },
  { key: 'pendingPayment', label: 'Due payment alerts', icon: AlertTriangle },
  { key: 'todaysOrders', label: "Today's orders", icon: CheckCircle2 },
  { key: 'lowStockCount', label: 'Low-stock alerts', icon: AlertTriangle },
  { key: 'activeWarrantyClaims', label: 'Active warranty claims', icon: ShieldCheck },
] as const

export function DashboardScreen() {
  const { data, loading, error, currentUser } = useERP()
  const snapshot = buildDashboardSnapshot(data, currentUser?.roleId)
  const activeWarrantyClaims = toArray(data?.tasks).filter((task) => task.module === 'support' && task.status !== 'done').length

  return (
    <AdminShell active="Dashboard">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-primary/5 shadow-lg shadow-primary/5">
          <CardContent className="surface-grid flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">Realtime ERP</Badge>
                <Badge variant="outline" className="rounded-full">Firebase powered</Badge>
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  {data?.settings.companyName ?? 'IMS'}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Operational control center</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Track sales, replenishment, dues, and urgent activity from one shared realtime workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
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
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Today\'s total sales</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(snapshot.metrics.todaySales, data?.settings.currency)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Due payment alerts</p>
              <p className="mt-2 text-3xl font-semibold">{snapshot.metrics.pendingPayment}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Low-stock alerts</p>
              <p className="mt-2 text-3xl font-semibold">{snapshot.metrics.lowStockCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Active warranty claims</p>
              <p className="mt-2 text-3xl font-semibold">{activeWarrantyClaims}</p>
            </CardContent>
          </Card>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricMeta.map((item) => {
            const Icon = item.icon
            const value = snapshot.metrics[item.key]
            const isMoney = ['todaySales', 'todayPurchase', 'todayProfit', 'todayExpense'].includes(item.key)

            return (
              <Card key={item.key} className="border-border/70 shadow-sm transition-transform hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      {isMoney ? formatCurrency(value, data?.settings.currency) : value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue vs expense</CardTitle>
              <CardDescription>Last six months of order revenue against purchase spend.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot.monthlyRevenue}>
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

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Order status mix</CardTitle>
              <CardDescription>Current pipeline across the sales and fulfillment stages.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(snapshot.orderStatusCounts).map(([status, total]) => ({
                    status,
                    total,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Top selling products</CardTitle>
              <CardDescription>Products with the strongest sales contribution so far.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.topProducts.map((product) => (
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
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Realtime alerts</CardTitle>
              <CardDescription>Unread and recent system notifications from the database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className={`rounded-2xl border px-4 py-3 text-sm ${notificationToneClass(notification)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{notification.title}</p>
                    {!notification.read ? <Badge variant="outline">Unread</Badge> : null}
                  </div>
                  <p className="mt-2 leading-6">{notification.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Everything written to the operational timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshot.activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm font-medium">{activitySummary(activity)}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{activity.module}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-1">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Low stock items</CardTitle>
              <CardDescription>Products that need replenishment soon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.lowStock.length ? (
                snapshot.lowStock.map((product) => (
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

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Feature coverage</CardTitle>
            <CardDescription>Shortcuts to the broader module set requested for the ERP sidebar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Returns & refunds', 'Link returns to the original invoice and restock flow.'],
              ['Suppliers & imports', 'Track LC, landed cost, and currency-aware purchases.'],
              ['Customer CRM', 'Keep purchase history and support in one queue.'],
              ['Notifications', 'Configure alert channels and recipients.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </AdminShell>
  )
}
