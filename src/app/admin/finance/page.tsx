"use client"

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, FileDown, Printer, ReceiptText, Wallet } from 'lucide-react'

import { AdminShell } from '@/components/admin/AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { OrderRecord } from '@/lib/erp/types'
import { useERP } from '@/lib/erp/provider'
import { formatCurrency, formatDate, toArray } from '@/lib/erp/utils'
import { cn } from '@/lib/utils'

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function monthInputValue(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

function isSameDate(value: string, target: string) {
  return value.slice(0, 10) === target
}

function isSameMonth(value: string, target: string) {
  return value.slice(0, 7) === target
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getOrderCost(order: OrderRecord) {
  return order.items.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0)
}

export default function FinancePage() {
  const { data } = useERP()
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily')
  const [selectedDate, setSelectedDate] = useState(dateInputValue())
  const [selectedMonth, setSelectedMonth] = useState(monthInputValue())
  const [feedback, setFeedback] = useState<string | null>(null)

  const orders = useMemo(
    () => toArray(data?.orders).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [data?.orders]
  )
  const purchases = useMemo(
    () => toArray(data?.purchases).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [data?.purchases]
  )
  const customers = useMemo(() => toArray(data?.customers), [data?.customers])
  const suppliers = useMemo(() => toArray(data?.suppliers), [data?.suppliers])
  const currency = data?.settings.currency

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      mode === 'daily' ? isSameDate(order.createdAt, selectedDate) : isSameMonth(order.createdAt, selectedMonth)
    )
  }, [mode, orders, selectedDate, selectedMonth])

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) =>
      mode === 'daily' ? isSameDate(purchase.createdAt, selectedDate) : isSameMonth(purchase.createdAt, selectedMonth)
    )
  }, [mode, purchases, selectedDate, selectedMonth])

  const finance = useMemo(() => {
    const revenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
    const cashIn = filteredOrders.reduce((sum, order) => sum + order.paid, 0)
    const receivable = filteredOrders.reduce((sum, order) => sum + order.due, 0)
    const cogs = filteredOrders.reduce((sum, order) => sum + getOrderCost(order), 0)
    const purchaseExpense = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0)
    const importCharges = suppliers.reduce(
      (sum, supplier) => sum + supplier.shippingCost + supplier.customsDuty + supplier.otherCost,
      0
    )
    const grossProfit = revenue - cogs
    const netCashFlow = cashIn - purchaseExpense

    return {
      revenue,
      cashIn,
      receivable,
      cogs,
      purchaseExpense,
      importCharges,
      grossProfit,
      netCashFlow,
      invoices: filteredOrders.length,
      unitsSold: filteredOrders.reduce(
        (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      ),
    }
  }, [filteredOrders, filteredPurchases, suppliers])

  const monthlyRows = useMemo(() => {
    const year = Number(selectedMonth.slice(0, 4)) || new Date().getFullYear()

    return Array.from({ length: 12 }).map((_, index) => {
      const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`
      const monthOrders = orders.filter((order) => isSameMonth(order.createdAt, monthKey))
      const monthPurchases = purchases.filter((purchase) => isSameMonth(purchase.createdAt, monthKey))
      const revenue = monthOrders.reduce((sum, order) => sum + order.total, 0)
      const cash = monthOrders.reduce((sum, order) => sum + order.paid, 0)
      const due = monthOrders.reduce((sum, order) => sum + order.due, 0)
      const cogs = monthOrders.reduce((sum, order) => sum + getOrderCost(order), 0)
      const expense = monthPurchases.reduce((sum, purchase) => sum + purchase.total, 0)

      return {
        key: monthKey,
        month: new Date(`${monthKey}-01`).toLocaleDateString('en-BD', { month: 'long' }),
        invoices: monthOrders.length,
        revenue,
        cash,
        due,
        cogs,
        expense,
        profit: revenue - cogs,
      }
    })
  }, [orders, purchases, selectedMonth])

  function buildInvoiceHtml(order: OrderRecord) {
    const customer = customers.find((entry) => entry.id === order.customerId)
    const rows = order.items
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.productName)}</td>
            <td class="numeric">${item.quantity}</td>
            <td class="numeric">${formatCurrency(item.unitPrice, currency)}</td>
            <td class="numeric">${formatCurrency(item.unitPrice * item.quantity, currency)}</td>
          </tr>
        `
      )
      .join('')

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${escapeHtml(order.id)}</title>
          <style>
            * { box-sizing: border-box; }
            body { color: #111827; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
            .header { border-bottom: 2px solid #111827; display: flex; justify-content: space-between; padding-bottom: 18px; }
            h1 { font-size: 24px; margin: 0; }
            p { color: #4b5563; font-size: 13px; margin: 5px 0 0; }
            .title { font-size: 28px; font-weight: 700; text-align: right; text-transform: uppercase; }
            .grid { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; margin-top: 26px; }
            .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; }
            table { border-collapse: collapse; margin-top: 18px; width: 100%; }
            th { background: #f3f4f6; color: #374151; font-size: 12px; text-align: left; text-transform: uppercase; }
            th, td { border: 1px solid #d1d5db; padding: 10px; }
            td { font-size: 13px; }
            .numeric { text-align: right; }
            .totals { margin-left: auto; margin-top: 18px; width: 320px; }
            .totals div { display: flex; justify-content: space-between; padding: 7px 0; }
            .totals .grand { border-top: 2px solid #111827; font-size: 18px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${escapeHtml(data?.settings.companyName ?? 'IMS ERP')}</h1>
              <p>Accounting & Finance</p>
            </div>
            <div>
              <p class="title">Invoice</p>
              <p><strong>No:</strong> ${escapeHtml(order.id)}</p>
              <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
              <p><strong>Due date:</strong> ${formatDate(order.deliveryDate)}</p>
            </div>
          </div>
          <div class="grid">
            <div class="box">
              <strong>Bill To</strong>
              <p>${escapeHtml(order.customerName)}</p>
              <p>${escapeHtml(customer?.phone ?? '')}</p>
              <p>${escapeHtml(customer?.location ?? '')}</p>
            </div>
            <div class="box">
              <strong>Payment</strong>
              <p>Cash: ${formatCurrency(order.paid, currency)}</p>
              <p>Due: ${formatCurrency(order.due, currency)}</p>
            </div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Item</th><th class="numeric">Qty</th><th class="numeric">Rate</th><th class="numeric">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="totals">
            <div><span>Total</span><strong>${formatCurrency(order.total, currency)}</strong></div>
            <div><span>Cash</span><strong>${formatCurrency(order.paid, currency)}</strong></div>
            <div class="grand"><span>Due</span><strong>${formatCurrency(order.due, currency)}</strong></div>
          </div>
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

  function printInvoice(order: OrderRecord) {
    setFeedback(null)
    const popup = window.open('', '_blank', 'width=920,height=720')

    if (!popup) {
      setFeedback('Allow popups to print or save invoice as PDF.')
      return
    }

    popup.document.open()
    popup.document.write(buildInvoiceHtml(order))
    popup.document.close()
  }

  return (
    <AdminShell active="Accounting & Finance">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-secondary/80 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Accounting & finance</Badge>
                <Badge variant="outline" className="rounded-full">Income, expense, profit/loss</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Finance dashboard</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track daily and monthly sales, cash received, customer dues, purchase expenses, and automatic profit/loss from one place.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'daily' ? (
                <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
              ) : (
                <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              )}
            </div>
          </CardContent>
        </Card>

        {feedback ? (
          <Card className="border-border/70 bg-primary/5 shadow-sm">
            <CardContent className="p-4 text-sm text-primary">{feedback}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Revenue / Sales', formatCurrency(finance.revenue, currency), ArrowUpRight, 'Total invoice value'],
            ['Cash received', formatCurrency(finance.cashIn, currency), Wallet, 'Paid amount collected'],
            ['Customer due', formatCurrency(finance.receivable, currency), ReceiptText, 'Receivable balance'],
            ['Gross profit/loss', formatCurrency(finance.grossProfit, currency), finance.grossProfit >= 0 ? ArrowUpRight : ArrowDownLeft, 'Sales minus product cost'],
          ].map(([label, value, Icon, note]) => {
            const MetricIcon = Icon as typeof ArrowUpRight

            return (
              <Card key={label as string} className="border-border/70 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MetricIcon className="h-4 w-4" />
                    {label as string}
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{value as string}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{note as string}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Invoices', finance.invoices.toLocaleString('en-BD'), `${finance.unitsSold} units sold`],
            ['COGS', formatCurrency(finance.cogs, currency), 'Product purchase cost'],
            ['Purchase expense', formatCurrency(finance.purchaseExpense, currency), 'Inventory purchases in period'],
            ['Net cash flow', formatCurrency(finance.netCashFlow, currency), 'Cash received minus purchases'],
          ].map(([label, value, note]) => (
            <Card key={label} className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Sales and invoice ledger</CardTitle>
              <CardDescription>Download invoices as PDF from the browser print dialog.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Cash</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead className="text-right">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const profit = order.total - getOrderCost(order)

                      return (
                        <TableRow key={order.id} className={cn(order.due > 0 && 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300')}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{formatCurrency(order.total, currency)}</TableCell>
                          <TableCell>{formatCurrency(order.paid, currency)}</TableCell>
                          <TableCell>{formatCurrency(order.due, currency)}</TableCell>
                          <TableCell>{formatCurrency(profit, currency)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => printInvoice(order)} aria-label={`Print invoice ${order.id}`}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => printInvoice(order)} aria-label={`Download invoice ${order.id}`}>
                                <FileDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                          No invoices found for this period.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Expense and payable view</CardTitle>
              <CardDescription>Purchase expenses, supplier import charges, and outstanding receivables.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Supplier import charges</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.importCharges, currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Shipping + customs + other costs</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Total customer ledger due</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(customers.reduce((sum, customer) => sum + customer.due, 0), currency)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Total supplier landed cost</p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(
                    suppliers.reduce(
                      (sum, supplier) =>
                        sum + supplier.productCost + supplier.shippingCost + supplier.customsDuty + supplier.otherCost,
                      0
                    ),
                    currency
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Monthly profit/loss report</CardTitle>
            <CardDescription>Full 12-month view for the selected year.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Month</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Cash</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>COGS</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell>{row.invoices}</TableCell>
                      <TableCell>{formatCurrency(row.revenue, currency)}</TableCell>
                      <TableCell>{formatCurrency(row.cash, currency)}</TableCell>
                      <TableCell>{formatCurrency(row.due, currency)}</TableCell>
                      <TableCell>{formatCurrency(row.cogs, currency)}</TableCell>
                      <TableCell>{formatCurrency(row.expense, currency)}</TableCell>
                      <TableCell className={cn(row.profit < 0 && 'text-destructive')}>{formatCurrency(row.profit, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
