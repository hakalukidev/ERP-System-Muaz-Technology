"use client"

import { useMemo, useState, type FormEvent } from 'react'
import { Check, Edit, MapPin, Phone, Plus, Search, Trash2, Wrench } from 'lucide-react'

import { AdminShell } from '@/components/admin/AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useERP } from '@/lib/erp/provider'
import type { CustomerInput, CustomerRecord } from '@/lib/erp/types'
import { formatCurrency, formatDate, toArray } from '@/lib/erp/utils'
import { cn } from '@/lib/utils'

type CustomerFormState = {
  name: string
  company: string
  phone: string
  location: string
  due: string
  supportStatus: CustomerRecord['supportStatus']
  supportNote: string
}

const emptyCustomerForm: CustomerFormState = {
  name: '',
  company: '',
  phone: '',
  location: '',
  due: '0',
  supportStatus: 'none',
  supportNote: '',
}

const supportLabels: Record<CustomerRecord['supportStatus'], string> = {
  none: 'No support',
  needed: 'Support needed',
  'in-progress': 'In service',
  resolved: 'Resolved',
}

function supportToneClass(status: CustomerRecord['supportStatus']) {
  if (status === 'needed') {
    return 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900 dark:text-amber-300'
  }

  if (status === 'in-progress') {
    return 'border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-900 dark:text-sky-300'
  }

  if (status === 'resolved') {
    return 'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300'
  }

  return 'border-border bg-muted text-muted-foreground'
}

function formFromCustomer(customer: CustomerRecord): CustomerFormState {
  return {
    name: customer.name,
    company: customer.company,
    phone: customer.phone,
    location: customer.location,
    due: String(customer.due),
    supportStatus: customer.supportStatus,
    supportNote: customer.supportNote,
  }
}

export default function CustomersPage() {
  const { data, saveCustomer, deleteCustomer } = useERP()
  const currency = data?.settings.currency
  const customers = useMemo(() => toArray(data?.customers), [data?.customers])
  const orders = useMemo(() => toArray(data?.orders), [data?.orders])
  const [query, setQuery] = useState('')
  const [supportFilter, setSupportFilter] = useState<CustomerRecord['supportStatus'] | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(emptyCustomerForm)
  const [feedback, setFeedback] = useState<string | null>(null)

  const customerRows = useMemo(() => {
    return customers
      .map((customer) => {
        const customerOrders = orders.filter((order) => order.customerId === customer.id)
        const purchaseTotal = customerOrders.reduce((sum, order) => sum + order.total, 0)
        const lastOrder = [...customerOrders].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]

        return {
          customer,
          orderCount: customerOrders.length,
          purchaseTotal,
          dueTotal: customerOrders.reduce((sum, order) => sum + order.due, 0),
          lastPurchaseDate: lastOrder?.createdAt ?? customer.updatedAt,
          hasOrders: customerOrders.length > 0,
        }
      })
      .sort((left, right) => right.purchaseTotal - left.purchaseTotal)
  }, [customers, orders])

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return customerRows.filter(({ customer }) => {
      const matchesSearch =
        !normalizedQuery ||
        [customer.name, customer.company, customer.phone, customer.location, customer.supportNote]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesSupport = supportFilter === 'all' || customer.supportStatus === supportFilter

      return matchesSearch && matchesSupport
    })
  }, [customerRows, query, supportFilter])

  const metrics = useMemo(() => {
    return {
      totalCustomers: customers.length,
      purchaseTotal: customerRows.reduce((sum, row) => sum + row.purchaseTotal, 0),
      dueTotal: customers.reduce((sum, customer) => sum + customer.due, 0),
      supportOpen: customers.filter((customer) => ['needed', 'in-progress'].includes(customer.supportStatus)).length,
    }
  }, [customerRows, customers])

  function openCreateDialog() {
    setEditingCustomer(null)
    setCustomerForm(emptyCustomerForm)
    setFeedback(null)
    setDialogOpen(true)
  }

  function openEditDialog(customer: CustomerRecord) {
    setEditingCustomer(customer)
    setCustomerForm(formFromCustomer(customer))
    setFeedback(null)
    setDialogOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    const input: CustomerInput = {
      name: customerForm.name,
      company: customerForm.company,
      phone: customerForm.phone,
      location: customerForm.location,
      due: Number(customerForm.due),
      supportStatus: customerForm.supportStatus,
      supportNote: customerForm.supportNote,
    }

    try {
      await saveCustomer(input, editingCustomer?.id)
      setDialogOpen(false)
      setCustomerForm(emptyCustomerForm)
      setEditingCustomer(null)
      setFeedback(editingCustomer ? 'Customer details updated.' : 'New customer added.')
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Unable to save customer.')
    }
  }

  async function handleDelete(customer: CustomerRecord) {
    setFeedback(null)

    try {
      await deleteCustomer(customer.id)
      setFeedback(`${customer.name} removed from customer list.`)
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Unable to delete customer.')
    }
  }

  async function handleSupportStatusChange(
    customer: CustomerRecord,
    supportStatus: CustomerRecord['supportStatus']
  ) {
    if (customer.supportStatus === supportStatus) {
      return
    }

    setFeedback(null)

    try {
      await saveCustomer(
        {
          name: customer.name,
          company: customer.company,
          phone: customer.phone,
          location: customer.location,
          due: customer.due,
          supportStatus,
          supportNote: customer.supportNote,
        },
        customer.id
      )
      setFeedback(`${customer.name} support status changed to ${supportLabels[supportStatus]}.`)
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Unable to update support status.')
    }
  }

  return (
    <AdminShell active="Customers (CRM)">
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-secondary/80 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Customer CRM</Badge>
                <Badge variant="outline" className="rounded-full">Purchase + support history</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Customer relationship management</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track customer identity, phone, location, organization, purchase amount, due balance, and technical support follow-up.
              </p>
            </div>
            <Button onClick={openCreateDialog} className="h-11 rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add customer
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Customers', metrics.totalCustomers.toLocaleString('en-BD'), 'Active CRM records'],
            ['Total purchase', formatCurrency(metrics.purchaseTotal, currency), 'From sales history'],
            ['Due balance', formatCurrency(metrics.dueTotal, currency), 'Customer ledger due'],
            ['Support open', metrics.supportOpen.toLocaleString('en-BD'), 'Needs servicing follow-up'],
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

        {feedback ? (
          <Card className="border-border/70 bg-primary/5 shadow-sm">
            <CardContent className="p-4 text-sm text-primary">{feedback}</CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Customer data table</CardTitle>
              <CardDescription>Search by name, phone, company, location, or support note.</CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_190px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Search customers"
                />
              </div>
              <Select value={supportFilter} onValueChange={(value) => setSupportFilter(value as typeof supportFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All support</SelectItem>
                  <SelectItem value="needed">Support needed</SelectItem>
                  <SelectItem value="in-progress">In service</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="none">No support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Purchase</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Support</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(({ customer, orderCount, purchaseTotal, dueTotal, lastPurchaseDate, hasOrders }) => (
                    <TableRow key={customer.id}>
                      <TableCell className="min-w-56">
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.company || 'Retail'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-44">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-48">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.location || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-44">
                        <p className="font-medium">{formatCurrency(purchaseTotal, currency)}</p>
                        <p className="text-xs text-muted-foreground">
                          {orderCount} orders, last {formatDate(lastPurchaseDate)}
                        </p>
                      </TableCell>
                      <TableCell>{formatCurrency(customer.due || dueTotal, currency)}</TableCell>
                      <TableCell className="min-w-64">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'h-8 rounded-full px-3 text-sm font-medium',
                                supportToneClass(customer.supportStatus)
                              )}
                            >
                              <Wrench className="mr-1 h-3.5 w-3.5" />
                              {supportLabels[customer.supportStatus]}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {(Object.keys(supportLabels) as CustomerRecord['supportStatus'][]).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => void handleSupportStatusChange(customer, status)}
                              >
                                {customer.supportStatus === status ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <span className="h-4 w-4" />
                                )}
                                {supportLabels[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <p className="mt-2 max-w-72 text-xs leading-5 text-muted-foreground">
                          {customer.supportNote || 'No service note added.'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => openEditDialog(customer)} aria-label={`Edit ${customer.name}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => void handleDelete(customer)}
                            disabled={hasOrders}
                            aria-label={`Delete ${customer.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit customer' : 'Add new customer'}</DialogTitle>
            <DialogDescription>Save the required CRM, purchase due, and service-tracking details.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={customerForm.name}
                onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Customer name"
                required
              />
              <Input
                value={customerForm.phone}
                onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
                required
              />
              <Input
                value={customerForm.company}
                onChange={(event) => setCustomerForm((current) => ({ ...current, company: event.target.value }))}
                placeholder="Company or organization"
              />
              <Input
                value={customerForm.location}
                onChange={(event) => setCustomerForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Customer location"
              />
              <Input
                type="number"
                min="0"
                value={customerForm.due}
                onChange={(event) => setCustomerForm((current) => ({ ...current, due: event.target.value }))}
                placeholder="Opening due"
              />
              <Select
                value={customerForm.supportStatus}
                onValueChange={(value) =>
                  setCustomerForm((current) => ({
                    ...current,
                    supportStatus: value as CustomerRecord['supportStatus'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No support</SelectItem>
                  <SelectItem value="needed">Support needed</SelectItem>
                  <SelectItem value="in-progress">In service</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={customerForm.supportNote}
              onChange={(event) => setCustomerForm((current) => ({ ...current, supportNote: event.target.value }))}
              placeholder="Technical support or servicing note"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl">
                {editingCustomer ? 'Update customer' : 'Save customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
