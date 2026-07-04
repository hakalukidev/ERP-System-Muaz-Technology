"use client"

import { useDeferredValue, useMemo, useState } from 'react'
import { AlertTriangle, PackagePlus, Search, ShoppingBag, Truck } from 'lucide-react'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useERP } from '@/lib/erp/provider'
import { formatCurrency, formatDateTime, getProductStatus, toArray } from '@/lib/erp/utils'

const emptyProduct = {
  name: '',
  category: '',
  brand: '',
  sku: '',
  warehouseId: '',
  supplierId: '',
  purchasePrice: '0',
  sellingPrice: '0',
  wholesalePrice: '0',
  stockQty: '0',
  minStock: '0',
  maxStock: '0',
  description: '',
}

const emptyPurchase = {
  productId: '',
  supplierId: '',
  quantity: '1',
  unitCost: '0',
  currency: 'BDT',
}

export function StockOverviewScreen() {
  const { data, hasPermission, saveProduct, recordPurchase, loading } = useERP()
  const products = useMemo(() => toArray(data?.products), [data?.products])
  const suppliers = useMemo(() => toArray(data?.suppliers), [data?.suppliers])
  const warehouses = useMemo(() => toArray(data?.warehouses), [data?.warehouses])
  const [search, setSearch] = useState('')
  const [productForm, setProductForm] = useState(emptyProduct)
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase)
  const [feedback, setFeedback] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search)

  const filteredProducts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    if (!query) {
      return products
    }

    return products.filter((product) => {
      return [product.name, product.category, product.brand, product.sku].some((value) =>
        value.toLowerCase().includes(query)
      )
    })
  }, [deferredSearch, products])

  const lowStock = products.filter((product) => product.stockQty <= product.minStock)
  const totalInventoryValue = products.reduce((sum, product) => sum + product.purchasePrice * product.stockQty, 0)
  const totalUnits = products.reduce((sum, product) => sum + product.stockQty, 0)

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    try {
      await saveProduct({
        name: productForm.name,
        category: productForm.category,
        brand: productForm.brand,
        sku: productForm.sku,
        warehouseId: productForm.warehouseId,
        supplierId: productForm.supplierId,
        purchasePrice: Number(productForm.purchasePrice),
        sellingPrice: Number(productForm.sellingPrice),
        wholesalePrice: Number(productForm.wholesalePrice),
        stockQty: Number(productForm.stockQty),
        minStock: Number(productForm.minStock),
        maxStock: Number(productForm.maxStock),
        description: productForm.description,
      })
      setProductForm(emptyProduct)
      setFeedback('Product saved to Firebase Realtime Database.')
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Unable to save product.')
    }
  }

  async function handlePurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    try {
      await recordPurchase({
        productId: purchaseForm.productId,
        supplierId: purchaseForm.supplierId,
        quantity: Number(purchaseForm.quantity),
        unitCost: Number(purchaseForm.unitCost),
        currency: purchaseForm.currency,
      })
      setPurchaseForm(emptyPurchase)
      setFeedback('Purchase received and inventory updated in realtime.')
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : 'Unable to record purchase.')
    }
  }

  return (
    <AdminShell active="Inventory / Stock">
      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Inventory hub</Badge>
                <Badge variant="outline" className="rounded-full">Realtime stock control</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Inventory and purchasing</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Add products, receive stock, and search warehouse availability from the same live dataset.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="mt-1 text-2xl font-semibold">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                <p className="text-sm text-muted-foreground">Units in stock</p>
                <p className="mt-1 text-2xl font-semibold">{totalUnits}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                <p className="text-sm text-muted-foreground">Inventory value</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalInventoryValue, data?.settings.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Inventory scope</CardTitle>
            <CardDescription>The sidebar now groups stock movement, warranty links, and warehouse visibility together.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['All products', 'Keep name, model, serial, and warranty details searchable.', 'Ready'],
              ['Stock in / stock out', 'Track the movement of goods through warehouse updates.', 'Ready'],
              ['Warehouse-wise stock view', 'Compare availability by location and transit hub.', 'Ready'],
              ['Low-stock alerts config', 'Tune the thresholds that drive replenishment warnings.', 'Planned'],
              ['Warranty claims', 'Use one queue for serial-number lookup and service status.', 'Planned'],
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available units</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{totalUnits}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low stock</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{lowStock.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suppliers</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{suppliers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <PackagePlus className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warehouses</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{warehouses.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Stock report</CardTitle>
              <CardDescription>Search by name, category, brand, or SKU. Every change updates live.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4 w-full sm:w-[320px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search stock..." />
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Sell price</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const warehouse = data?.warehouses[product.warehouseId]
                      const status = getProductStatus(product.stockQty, product.minStock)

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.category} · {product.brand}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.sku}</TableCell>
                          <TableCell>{warehouse?.name ?? 'Unknown warehouse'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{product.stockQty}</span>
                              <Badge variant={status === 'active' ? 'outline' : 'destructive'}>
                                {status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(product.sellingPrice, data?.settings.currency)}</TableCell>
                          <TableCell>{formatDateTime(product.updatedAt)}</TableCell>
                        </TableRow>
                      )
                    })}
                    {!filteredProducts.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          No products matched your search.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Add new product</CardTitle>
                <CardDescription>Available to roles with inventory management permission.</CardDescription>
              </CardHeader>
              <CardContent>
                {hasPermission('manage_products') ? (
                  <form className="space-y-4" onSubmit={handleCreateProduct}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} required />
                      <Input placeholder="SKU" value={productForm.sku} onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} required />
                      <Input placeholder="Category" value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} required />
                      <Input placeholder="Brand" value={productForm.brand} onChange={(event) => setProductForm((current) => ({ ...current, brand: event.target.value }))} required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select value={productForm.warehouseId} onValueChange={(value) => setProductForm((current) => ({ ...current, warehouseId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={productForm.supplierId} onValueChange={(value) => setProductForm((current) => ({ ...current, supplierId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input type="number" min="0" placeholder="Purchase price" value={productForm.purchasePrice} onChange={(event) => setProductForm((current) => ({ ...current, purchasePrice: event.target.value }))} required />
                      <Input type="number" min="0" placeholder="Selling price" value={productForm.sellingPrice} onChange={(event) => setProductForm((current) => ({ ...current, sellingPrice: event.target.value }))} required />
                      <Input type="number" min="0" placeholder="Wholesale price" value={productForm.wholesalePrice} onChange={(event) => setProductForm((current) => ({ ...current, wholesalePrice: event.target.value }))} required />
                      <Input type="number" min="0" placeholder="Opening stock" value={productForm.stockQty} onChange={(event) => setProductForm((current) => ({ ...current, stockQty: event.target.value }))} required />
                      <Input type="number" min="0" placeholder="Minimum stock" value={productForm.minStock} onChange={(event) => setProductForm((current) => ({ ...current, minStock: event.target.value }))} required />
                      <Input type="number" min="0" placeholder="Maximum stock" value={productForm.maxStock} onChange={(event) => setProductForm((current) => ({ ...current, maxStock: event.target.value }))} required />
                    </div>
                    <Textarea placeholder="Description" value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} rows={4} />
                    <Button type="submit" className="w-full rounded-xl">Save product</Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">Your current role can view stock but cannot create or edit products.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Receive purchase</CardTitle>
                <CardDescription>Increase stock and log a purchase transaction instantly.</CardDescription>
              </CardHeader>
              <CardContent>
                {hasPermission('manage_products') ? (
                  <form className="space-y-4" onSubmit={handlePurchase}>
                    <Select value={purchaseForm.productId} onValueChange={(value) => setPurchaseForm((current) => ({ ...current, productId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={purchaseForm.supplierId} onValueChange={(value) => setPurchaseForm((current) => ({ ...current, supplierId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={purchaseForm.currency} onValueChange={(value) => setPurchaseForm((current) => ({ ...current, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {['BDT', 'USD', 'CNY', 'EUR'].map((currency) => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input type="number" min="1" value={purchaseForm.quantity} onChange={(event) => setPurchaseForm((current) => ({ ...current, quantity: event.target.value }))} required />
                      <Input type="number" min="0" value={purchaseForm.unitCost} onChange={(event) => setPurchaseForm((current) => ({ ...current, unitCost: event.target.value }))} required />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full rounded-xl">Receive stock</Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">Your current role cannot record inbound purchases.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {loading ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-4 text-sm text-muted-foreground">Loading inventory...</CardContent>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  )
}
