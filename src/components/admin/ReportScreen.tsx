"use client"

import { useMemo, useState } from 'react'
import { CalendarDays, FileDown, FileSpreadsheet, Printer } from 'lucide-react'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useERP } from '@/lib/erp/provider'
import type { OrderRecord } from '@/lib/erp/types'
import { buildUserReport, exportCsv, formatCurrency, formatDate, toArray } from '@/lib/erp/utils'
import { cn } from '@/lib/utils'

type SalesReportRow = {
  sn: number
  order: OrderRecord
  clientPhone: string
  clientAddress: string
  products: string
  totalQuantity: number
  ref: string
}

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

export function ReportScreen() {
  const { data, currentUser, currentPermissions } = useERP()
  const [dailyDate, setDailyDate] = useState(dateInputValue())
  const [monthlyFilter, setMonthlyFilter] = useState(monthInputValue())
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily')

  const orders = useMemo(
    () => toArray(data?.orders).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [data?.orders]
  )
  const customers = useMemo(() => toArray(data?.customers), [data?.customers])
  const products = useMemo(() => toArray(data?.products), [data?.products])
  const suppliers = useMemo(() => toArray(data?.suppliers), [data?.suppliers])
  const purchases = useMemo(() => toArray(data?.purchases), [data?.purchases])
  const userReport = buildUserReport(data)
  const currency = data?.settings.currency

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      reportMode === 'daily' ? isSameDate(order.createdAt, dailyDate) : isSameMonth(order.createdAt, monthlyFilter)
    )
  }, [dailyDate, monthlyFilter, orders, reportMode])

  const salesRows = useMemo<SalesReportRow[]>(() => {
    return filteredOrders.map((order, index) => {
      const customer = customers.find((entry) => entry.id === order.customerId)
      const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
      const productsText = order.items.map((item) => `${item.productName} x ${item.quantity}`).join(', ')

      return {
        sn: index + 1,
        order,
        clientPhone: customer?.phone ?? '',
        clientAddress: customer?.location ?? customer?.company ?? '',
        products: productsText,
        totalQuantity,
        ref: order.due > 0 ? 'Owner / courier follow-up' : 'Paid',
      }
    })
  }, [customers, filteredOrders])

  const reportTitle =
    reportMode === 'daily'
      ? `Daily Sales Report - ${formatDate(dailyDate)}`
      : `Monthly Sales Report - ${new Date(`${monthlyFilter}-01`).toLocaleDateString('en-BD', {
          month: 'long',
          year: 'numeric',
        })}`

  const totals = useMemo(() => {
    return {
      sales: filteredOrders.reduce((sum, order) => sum + order.total, 0),
      cash: filteredOrders.reduce((sum, order) => sum + order.paid, 0),
      due: filteredOrders.reduce((sum, order) => sum + order.due, 0),
      quantity: salesRows.reduce((sum, row) => sum + row.totalQuantity, 0),
      bills: filteredOrders.length,
    }
  }, [filteredOrders, salesRows])

  function salesCsvRows(rows = salesRows) {
    return rows.map((row) => [
      String(row.sn),
      String(row.order.total),
      row.order.id,
      formatDate(row.order.createdAt),
      row.order.customerName,
      row.clientPhone,
      row.clientAddress,
      row.products,
      String(row.totalQuantity),
      String(row.order.paid),
      String(row.order.due),
      row.ref,
    ])
  }

  function exportSalesCsv() {
    exportCsv(
      `${reportMode}-sales-report-${reportMode === 'daily' ? dailyDate : monthlyFilter}.csv`,
      ['SN', 'Sales', 'Bill No.', 'Date', 'Client Name', 'Phone No.', 'Address', 'Product Name / Qty', 'Total Quantity', 'Cash', 'Due', 'Ref'],
      salesCsvRows()
    )
  }

  function exportAllCsv() {
    exportCsv(
      'ims-all-operational-report.csv',
      ['Section', 'SN', 'Name / Bill', 'Date', 'Contact', 'Quantity', 'Cash / Cost', 'Due / Stock', 'Ref / Status'],
      [
        ...salesRows.map((row) => [
          'Sales',
          String(row.sn),
          `${row.order.id} - ${row.order.customerName}`,
          formatDate(row.order.createdAt),
          row.clientPhone,
          String(row.totalQuantity),
          String(row.order.paid),
          String(row.order.due),
          row.ref,
        ]),
        ...customers.map((customer, index) => [
          'Customers',
          String(index + 1),
          customer.name,
          customer.createdAt ? formatDate(customer.createdAt) : '',
          customer.phone,
          '',
          '',
          String(customer.due),
          customer.supportStatus,
        ]),
        ...products.map((product, index) => [
          'Stock',
          String(index + 1),
          product.name,
          product.updatedAt ? formatDate(product.updatedAt) : '',
          product.sku,
          String(product.stockQty),
          String(product.sellingPrice),
          String(product.minStock),
          product.status,
        ]),
        ...suppliers.map((supplier, index) => [
          'Suppliers',
          String(index + 1),
          supplier.name,
          supplier.updatedAt ? formatDate(supplier.updatedAt) : '',
          supplier.phone,
          '',
          String(supplier.productCost + supplier.shippingCost + supplier.customsDuty + supplier.otherCost),
          '',
          supplier.lcStatus,
        ]),
        ...purchases.map((purchase, index) => [
          'Purchases',
          String(index + 1),
          purchase.productName,
          formatDate(purchase.createdAt),
          purchase.supplierName,
          String(purchase.quantity),
          String(purchase.total),
          '',
          purchase.status,
        ]),
      ]
    )
  }

  function exportStockCsv() {
    exportCsv(
      'ims-stock-report.csv',
      ['SN', 'Product', 'SKU', 'Supplier', 'Stock', 'Min Stock', 'Selling Price', 'Status'],
      products.map((product, index) => [
        String(index + 1),
        product.name,
        product.sku,
        data?.suppliers[product.supplierId]?.name ?? '',
        String(product.stockQty),
        String(product.minStock),
        String(product.sellingPrice),
        product.status,
      ])
    )
  }

  function exportCustomerCsv() {
    exportCsv(
      'ims-customer-ledger.csv',
      ['SN', 'Customer', 'Company', 'Phone', 'Location', 'Due', 'Support Status'],
      customers.map((customer, index) => [
        String(index + 1),
        customer.name,
        customer.company,
        customer.phone,
        customer.location,
        String(customer.due),
        customer.supportStatus,
      ])
    )
  }

  function exportSupplierCsv() {
    exportCsv(
      'ims-supplier-import-report.csv',
      ['SN', 'Supplier', 'Type', 'Phone', 'Country', 'LC No.', 'LC Status', 'Product Cost', 'Shipping', 'Customs', 'Other', 'Landed Cost'],
      suppliers.map((supplier, index) => [
        String(index + 1),
        supplier.name,
        supplier.supplierType,
        supplier.phone,
        supplier.country,
        supplier.lcNumber,
        supplier.lcStatus,
        String(supplier.productCost),
        String(supplier.shippingCost),
        String(supplier.customsDuty),
        String(supplier.otherCost),
        String(supplier.productCost + supplier.shippingCost + supplier.customsDuty + supplier.otherCost),
      ])
    )
  }

  function exportUserCsv() {
    exportCsv(
      'ims-user-performance-report.csv',
      ['User', 'Role', 'Orders', 'Pending Orders', 'Completed Orders', 'Revenue', 'Due'],
      userReport.map((row) => [
        row.name,
        row.role,
        String(row.totalOrders),
        String(row.pendingOrders),
        String(row.completedOrders),
        String(row.revenue),
        String(row.due),
      ])
    )
  }

  function printSalesReport() {
    const rows = salesRows
      .map(
        (row) => `
          <tr class="${row.order.due > 0 ? 'due-row' : ''}">
            <td>${row.sn}</td>
            <td>${formatCurrency(row.order.total, currency)}</td>
            <td>${escapeHtml(row.order.id)}</td>
            <td>${formatDate(row.order.createdAt)}</td>
            <td>${escapeHtml(row.order.customerName)}</td>
            <td>${escapeHtml(row.clientPhone)}</td>
            <td>${escapeHtml(row.clientAddress)}</td>
            <td>${escapeHtml(row.products)}</td>
            <td class="numeric">${row.totalQuantity}</td>
            <td class="numeric">${formatCurrency(row.order.paid, currency)}</td>
            <td class="numeric">${formatCurrency(row.order.due, currency)}</td>
            <td>${escapeHtml(row.ref)}</td>
          </tr>
        `
      )
      .join('')

    const popup = window.open('', '_blank', 'width=1120,height=760')
    if (!popup) {
      return
    }

    popup.document.open()
    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            * { box-sizing: border-box; }
            body { color: #111827; font-family: Arial, sans-serif; margin: 0; padding: 24px; }
            h1 { font-size: 22px; margin: 0; }
            p { color: #4b5563; font-size: 12px; margin: 6px 0 0; }
            .summary { display: grid; gap: 10px; grid-template-columns: repeat(4, 1fr); margin: 20px 0; }
            .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
            .box strong { display: block; font-size: 18px; margin-top: 4px; }
            table { border-collapse: collapse; width: 100%; }
            th { background: #f3f4f6; color: #374151; font-size: 11px; text-align: left; text-transform: uppercase; }
            th, td { border: 1px solid #d1d5db; padding: 8px; }
            td { font-size: 12px; vertical-align: top; }
            .numeric { text-align: right; }
            .due-row { background: #fee2e2; color: #991b1b; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(reportTitle)}</h1>
          <p>${escapeHtml(data?.settings.companyName ?? 'IMS ERP')} | Generated ${formatDate(new Date().toISOString())}</p>
          <div class="summary">
            <div class="box">Bills<strong>${totals.bills}</strong></div>
            <div class="box">Quantity<strong>${totals.quantity}</strong></div>
            <div class="box">Cash<strong>${formatCurrency(totals.cash, currency)}</strong></div>
            <div class="box">Due<strong>${formatCurrency(totals.due, currency)}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>SN</th><th>Sales</th><th>Bill No.</th><th>Date</th><th>Client Name</th><th>Phn No.</th><th>Address</th><th>Product</th><th>Total Qty</th><th>Cash</th><th>Due</th><th>Ref</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="12">No data found.</td></tr>'}</tbody>
          </table>
          <script>
            window.addEventListener('load', () => {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `)
    popup.document.close()
  }

  return (
    <AdminShell active="Reports">
      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Reports</Badge>
                <Badge variant="outline" className="rounded-full">CSV + PDF export</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Daily and monthly report center</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Export sales, stock, supplier/import, customer ledger, purchases, and user reports as CSV or printable PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-xl" onClick={exportAllCsv}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export all CSV
              </Button>
              <Button className="rounded-xl" onClick={printSalesReport}>
                <FileDown className="mr-2 h-4 w-4" />
                Sales PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Sales report filters</CardTitle>
            <CardDescription>Select any old date or any month/year, then export the matching bill data.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[180px_1fr_1fr_auto_auto] lg:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium">Report type</p>
              <Select value={reportMode} onValueChange={(value) => setReportMode(value as typeof reportMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Sales</SelectItem>
                  <SelectItem value="monthly">Monthly Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Daily date</p>
              <Input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Month / year</p>
              <Input type="month" value={monthlyFilter} onChange={(event) => setMonthlyFilter(event.target.value)} />
            </div>
            <Button variant="outline" className="rounded-xl" onClick={exportSalesCsv}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button className="rounded-xl" onClick={printSalesReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print/PDF
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['Bills', totals.bills.toLocaleString('en-BD')],
            ['Sales', formatCurrency(totals.sales, currency)],
            ['Quantity', totals.quantity.toLocaleString('en-BD')],
            ['Cash', formatCurrency(totals.cash, currency)],
            ['Due', formatCurrency(totals.due, currency)],
          ].map(([label, value]) => (
            <Card key={label} className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>{reportTitle}</CardTitle>
              <CardDescription>Rows with due amount are highlighted red until due becomes zero.</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full">
              <CalendarDays className="mr-1 h-3.5 w-3.5" />
              {salesRows.length} entries
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>SN</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Bill No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Phn No.</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Cash</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRows.map((row) => (
                    <TableRow
                      key={row.order.id}
                      className={cn(
                        row.order.due > 0 &&
                          'bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300'
                      )}
                    >
                      <TableCell>{row.sn}</TableCell>
                      <TableCell>{formatCurrency(row.order.total, currency)}</TableCell>
                      <TableCell>{row.order.id}</TableCell>
                      <TableCell>{formatDate(row.order.createdAt)}</TableCell>
                      <TableCell>{row.order.customerName}</TableCell>
                      <TableCell>{row.clientPhone || 'N/A'}</TableCell>
                      <TableCell>{row.clientAddress || 'N/A'}</TableCell>
                      <TableCell className="min-w-56">{row.products}</TableCell>
                      <TableCell>{row.totalQuantity}</TableCell>
                      <TableCell>{formatCurrency(row.order.paid, currency)}</TableCell>
                      <TableCell>{formatCurrency(row.order.due, currency)}</TableCell>
                      <TableCell>{row.ref}</TableCell>
                    </TableRow>
                  ))}
                  {salesRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-28 text-center text-muted-foreground">
                        No sales data found for this filter.
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
            <CardTitle>Other CSV reports</CardTitle>
            <CardDescription>Download separate operational CSV files for every major module.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Button variant="outline" className="rounded-xl justify-start" onClick={exportStockCsv}>Stock CSV</Button>
            <Button variant="outline" className="rounded-xl justify-start" onClick={exportCustomerCsv}>Customer CSV</Button>
            <Button variant="outline" className="rounded-xl justify-start" onClick={exportSupplierCsv}>Supplier CSV</Button>
            <Button variant="outline" className="rounded-xl justify-start" onClick={exportUserCsv}>User CSV</Button>
            <Button variant="outline" className="rounded-xl justify-start" onClick={exportAllCsv}>All CSV</Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>User summary</CardTitle>
            <CardDescription>Realtime order, due, and revenue output by teammate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userReport.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.totalOrders}</TableCell>
                      <TableCell>{row.pendingOrders}</TableCell>
                      <TableCell>{row.completedOrders}</TableCell>
                      <TableCell>{formatCurrency(row.revenue, currency)}</TableCell>
                      <TableCell>{formatCurrency(row.due, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Current role</p>
            <p className="mt-2 text-lg font-semibold">{currentUser ? data?.roles[currentUser.roleId]?.name : 'Loading role'}</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentPermissions.length} active permissions</p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
