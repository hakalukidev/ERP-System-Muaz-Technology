"use client"

import { useMemo, useState, type FormEvent } from 'react'
import { ClipboardPlus, PackageCheck, ShoppingCart } from 'lucide-react'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useERP } from '@/lib/erp/provider'
import { formatCurrency, formatDate, getReadableOrderState, toArray } from '@/lib/erp/utils'

const emptyOrder = {
  customerId: '',
  productId: '',
  quantity: '1',
  paid: '0',
  deliveryDate: '',
}

export function SalesScreen() {
  const { data, hasPermission, createOrder, updateOrderStatus } = useERP()
  const orders = useMemo(
    () => toArray(data?.orders).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [data?.orders]
  )
  const customers = useMemo(() => toArray(data?.customers), [data?.customers])
  const products = useMemo(() => toArray(data?.products), [data?.products])
  const [orderForm, setOrderForm] = useState(emptyOrder)
  const [feedback, setFeedback] = useState<string | null>(null)

  const openOrders = orders.filter((order) => order.status !== 'completed').length
  const readyOrders = orders.filter((order) => order.status === 'ready').length
  const dueOrders = orders.filter((order) => order.due > 0).length

  async function handleOrderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    try {
      await createOrder({
        customerId: orderForm.customerId,
        productId: orderForm.productId,
        quantity: Number(orderForm.quantity),
        paid: Number(orderForm.paid),
        deliveryDate: orderForm.deliveryDate,
      })
      setOrderForm(emptyOrder)
      setFeedback('Sales order created and inventory updated in realtime.')
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Unable to create order.')
    }
  }

  return (
    <AdminShell active="Sales & Billing">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-secondary/80 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Sales desk</Badge>
                <Badge variant="outline" className="rounded-full">Orders + fulfillment</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Sales and billing workflow board</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create sales orders, advance delivery status, and keep dues visible from a single module.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  Open orders
                </div>
                <p className="mt-1 text-2xl font-semibold">{openOrders}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PackageCheck className="h-4 w-4" />
                  Ready to ship
                </div>
                <p className="mt-1 text-2xl font-semibold">{readyOrders}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClipboardPlus className="h-4 w-4" />
                  Orders with due
                </div>
                <p className="mt-1 text-2xl font-semibold">{dueOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Sales & billing scope</CardTitle>
            <CardDescription>The sidebar now groups the full billing workflow, not only order entry.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['New sale / POS entry', 'Create new sales orders from the live inventory set.', 'Ready'],
              ['Quotations', 'Reserve draft sales quotes before converting them to invoices.', 'Planned'],
              ['Invoices', 'Create, print, and download invoice output.', 'Planned'],
              ['Sales history', 'Review the full order trail and fulfillment states.', 'Ready'],
              ['Due / credit tracking', 'Follow unpaid and partial-payment sales.', 'Ready'],
              ['Returns & refunds', 'Link a return request to the original invoice.', 'Planned'],
            ].map(([title, description, status]) => (
              <div key={title} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                  <Badge variant="outline">{status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {feedback ? (
          <Card className="border-border/70 bg-primary/5 shadow-sm">
            <CardContent className="p-4 text-sm text-primary">{feedback}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{openOrders}</p>
              <Progress value={orders.length ? (openOrders / orders.length) * 100 : 0} className="mt-4" />
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Ready</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{readyOrders}</p>
              <Progress value={orders.length ? (readyOrders / orders.length) * 100 : 0} className="mt-4" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Create sales order</CardTitle>
              <CardDescription>Available to roles that can manage orders.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasPermission('manage_orders') ? (
                <form className="space-y-4" onSubmit={handleOrderSubmit}>
                  <Select value={orderForm.customerId} onValueChange={(value) => setOrderForm((current) => ({ ...current, customerId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} · due {formatCurrency(customer.due, data?.settings.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={orderForm.productId} onValueChange={(value) => setOrderForm((current) => ({ ...current, productId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} · stock {product.stockQty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input type="number" min="1" value={orderForm.quantity} onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))} required />
                    <Input type="number" min="0" value={orderForm.paid} onChange={(event) => setOrderForm((current) => ({ ...current, paid: event.target.value }))} required />
                    <Input type="date" value={orderForm.deliveryDate} onChange={(event) => setOrderForm((current) => ({ ...current, deliveryDate: event.target.value }))} required />
                  </div>
                  <Button type="submit" className="w-full rounded-xl">
                    <ClipboardPlus className="mr-2 h-4 w-4" />
                    Save order
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">Your current role cannot create orders.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Order board</CardTitle>
              <CardDescription>Update fulfillment state directly from the live sales list.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.salesPersonName}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.items[0]?.productName ?? 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(order.total, data?.settings.currency)}</TableCell>
                        <TableCell>{formatCurrency(order.due, data?.settings.currency)}</TableCell>
                        <TableCell>
                          {hasPermission('manage_orders') ? (
                            <Select value={order.status} onValueChange={(value) => void updateOrderStatus(order.id, value as typeof order.status)}>
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="hold">Hold</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{getReadableOrderState(order)}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  )
}