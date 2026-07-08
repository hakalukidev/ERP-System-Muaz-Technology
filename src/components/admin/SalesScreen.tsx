"use client"

import { useMemo, useState, type FormEvent } from 'react'
import { CalendarClock, ClipboardPlus, FileDown, PackageCheck, Printer, ReceiptText, ShoppingCart } from 'lucide-react'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useERP } from '@/lib/erp/provider'
import type { OrderRecord } from '@/lib/erp/types'
import { formatCurrency, formatDate, getReadableOrderState, toArray } from '@/lib/erp/utils'

const emptyOrder = {
  customerId: '',
  productId: '',
  quantity: '1',
  paid: '0',
  deliveryDate: '',
}

type SalesDocument = Pick<
  OrderRecord,
  'id' | 'customerId' | 'customerName' | 'salesPersonName' | 'total' | 'paid' | 'due' | 'deliveryDate' | 'createdAt' | 'items'
>

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
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
  const receivableTotal = orders.reduce((sum, order) => sum + order.due, 0)
  const supplierPayableEstimate = toArray(data?.purchases).reduce((sum, purchase) => sum + purchase.total, 0)
  const overdueOrders = orders.filter((order) => {
    if (order.due <= 0) {
      return false
    }

    const deliveryDate = new Date(order.deliveryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return deliveryDate < today
  })
  const dueReminderRows = orders
    .filter((order) => order.due > 0)
    .sort((left, right) => left.deliveryDate.localeCompare(right.deliveryDate))
    .slice(0, 5)

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

  function buildSalesDocumentHtml(type: 'Quotation' | 'Invoice', document: SalesDocument) {
    const customer = customers.find((entry) => entry.id === document.customerId)
    const issueDate = formatDate(document.createdAt)
    const deliveryDate = formatDate(document.deliveryDate)
    const currency = data?.settings.currency

    const rows = document.items
      .map((item, index) => {
        const lineTotal = item.quantity * item.unitPrice

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.productName)}</td>
            <td class="numeric">${item.quantity}</td>
            <td class="numeric">${formatCurrency(item.unitPrice, currency)}</td>
            <td class="numeric">${formatCurrency(lineTotal, currency)}</td>
          </tr>
        `
      })
      .join('')

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${type} ${escapeHtml(document.id)}</title>
          <style>
            * { box-sizing: border-box; }
            body { color: #111827; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
            .header { align-items: flex-start; border-bottom: 2px solid #111827; display: flex; justify-content: space-between; padding-bottom: 18px; }
            .brand h1 { font-size: 24px; margin: 0; }
            .brand p, .meta p, .party p { color: #4b5563; font-size: 13px; margin: 5px 0 0; }
            .title { font-size: 28px; font-weight: 700; margin: 0; text-align: right; text-transform: uppercase; }
            .section { margin-top: 26px; }
            .party-grid { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; }
            .party { border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; }
            .party h2 { font-size: 13px; letter-spacing: .08em; margin: 0 0 8px; text-transform: uppercase; }
            table { border-collapse: collapse; margin-top: 18px; width: 100%; }
            th { background: #f3f4f6; color: #374151; font-size: 12px; text-align: left; text-transform: uppercase; }
            th, td { border: 1px solid #d1d5db; padding: 10px; }
            td { font-size: 13px; }
            .numeric { text-align: right; }
            .totals { margin-left: auto; margin-top: 18px; width: 320px; }
            .totals div { display: flex; justify-content: space-between; padding: 7px 0; }
            .totals .grand { border-top: 2px solid #111827; font-size: 18px; font-weight: 700; }
            .note { color: #4b5563; font-size: 12px; margin-top: 32px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <h1>${escapeHtml(data?.settings.companyName ?? 'IMS ERP')}</h1>
              <p>Sales & Billing</p>
            </div>
            <div class="meta">
              <p class="title">${type}</p>
              <p><strong>No:</strong> ${escapeHtml(document.id)}</p>
              <p><strong>Issue:</strong> ${issueDate}</p>
              <p><strong>Due/Delivery:</strong> ${deliveryDate}</p>
            </div>
          </div>

          <div class="section party-grid">
            <div class="party">
              <h2>Bill To</h2>
              <p><strong>${escapeHtml(document.customerName)}</strong></p>
              <p>${escapeHtml(customer?.company ?? 'Retail')}</p>
              <p>${escapeHtml(customer?.phone ?? '')}</p>
              <p>${escapeHtml(customer?.location ?? '')}</p>
            </div>
            <div class="party">
              <h2>Prepared By</h2>
              <p><strong>${escapeHtml(document.salesPersonName)}</strong></p>
              <p>Payment status: ${document.due > 0 ? 'Due' : 'Paid'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th class="numeric">Qty</th>
                <th class="numeric">Unit Price</th>
                <th class="numeric">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="totals">
            <div><span>Total</span><strong>${formatCurrency(document.total, currency)}</strong></div>
            <div><span>Paid</span><strong>${formatCurrency(document.paid, currency)}</strong></div>
            <div class="grand"><span>Due</span><strong>${formatCurrency(document.due, currency)}</strong></div>
          </div>

          <p class="note">Use the print dialog's Save as PDF option to download this ${type.toLowerCase()}.</p>
          <script>
            window.addEventListener('load', () => {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `
  }

  function printSalesDocument(type: 'Quotation' | 'Invoice', document: SalesDocument) {
    const popup = window.open('', '_blank', 'width=920,height=720')

    if (!popup) {
      setFeedback('Allow popups to print or save the document as PDF.')
      return
    }

    popup.document.open()
    popup.document.write(buildSalesDocumentHtml(type, document))
    popup.document.close()
  }

  function handleQuotationPrint() {
    setFeedback(null)

    const customer = customers.find((entry) => entry.id === orderForm.customerId)
    const product = products.find((entry) => entry.id === orderForm.productId)
    const quantity = Number(orderForm.quantity)

    if (!customer || !product || quantity <= 0 || !orderForm.deliveryDate) {
      setFeedback('Select customer, product, quantity, and due date before printing a quotation.')
      return
    }

    const total = product.sellingPrice * quantity
    printSalesDocument('Quotation', {
      id: `QT-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      salesPersonName: 'Sales desk',
      total,
      paid: 0,
      due: total,
      deliveryDate: orderForm.deliveryDate,
      createdAt: new Date().toISOString(),
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
        },
      ],
    })
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
              ['Quotations', 'Create printable quotations from the order form before saving stock movement.', 'Ready'],
              ['Invoices', 'Print invoices and use Save as PDF from the browser print dialog.', 'Ready'],
              ['Sales history', 'Review the full order trail and fulfillment states.', 'Ready'],
              ['Due / credit tracking', 'Follow receivable dues, supplier payable estimates, and due reminders.', 'Ready'],
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{openOrders}</p>
              <Progress value={orders.length ? (openOrders / orders.length) * 100 : 0} className="mt-4" />
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Ready</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{readyOrders}</p>
              <Progress value={orders.length ? (readyOrders / orders.length) * 100 : 0} className="mt-4" />
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Customer receivable</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCurrency(receivableTotal, data?.settings.currency)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{overdueOrders.length} overdue reminders</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Supplier payable estimate</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{formatCurrency(supplierPayableEstimate, data?.settings.currency)}</p>
              <p className="mt-2 text-xs text-muted-foreground">From recorded purchases</p>
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={handleQuotationPrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print quotation
                    </Button>
                    <Button type="submit" className="rounded-xl">
                      <ClipboardPlus className="mr-2 h-4 w-4" />
                      Save order
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">Your current role cannot create orders.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Order board</CardTitle>
              <CardDescription>Update fulfillment, print invoices, and download PDFs from the live sales list.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead className="text-right">Invoice</TableHead>
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
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => printSalesDocument('Invoice', order)} aria-label={`Print invoice ${order.id}`}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => printSalesDocument('Invoice', order)} aria-label={`Download invoice ${order.id} as PDF`}>
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Due reminders</CardTitle>
              <CardDescription>Customers with unpaid or partial-payment invoices, sorted by due date.</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full">
              <CalendarClock className="mr-1 h-3.5 w-3.5" />
              {overdueOrders.length} overdue
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Due amount</TableHead>
                    <TableHead className="text-right">Reminder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueReminderRows.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <p className="font-semibold">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.items[0]?.productName ?? 'N/A'}</p>
                      </TableCell>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                      <TableCell>{formatCurrency(order.due, data?.settings.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => printSalesDocument('Invoice', order)}>
                          <ReceiptText className="mr-2 h-4 w-4" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dueReminderRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No due reminders.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
