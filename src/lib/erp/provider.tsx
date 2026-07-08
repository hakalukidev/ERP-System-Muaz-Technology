'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { get, onValue, ref, set, update } from 'firebase/database'

import { createDefaultERPData } from '@/lib/erp/defaultData'
import type {
  CustomerInput,
  CustomerRecord,
  ERPData,
  OrderInput,
  OrderRecord,
  ProductInput,
  PurchaseInput,
  SupplierInput,
  SupplierRecord,
  TaskInput,
  TaskRecord,
  UserInput,
  UserRecord,
  WarehouseInput,
} from '@/lib/erp/types'
import {
  createId,
  getPermissions,
  getProductStatus,
  hasPermission as hasPermissionCheck,
  toArray,
} from '@/lib/erp/utils'
import { database } from '@/lib/firebase/config'

const DEFAULT_ERP_DATA = createDefaultERPData()

type ERPContextValue = {
  data: ERPData | null
  loading: boolean
  error: string | null
  users: UserRecord[]
  currentUser: UserRecord | null
  currentPermissions: string[]
  login: (identifier: string, password: string) => Promise<UserRecord>
  logout: () => void
  switchUser: (userId: string) => void
  createUser: (input: UserInput) => Promise<void>
  hasPermission: (permission: string) => boolean
  seedDemoData: () => Promise<void>
  saveCustomer: (input: CustomerInput, customerId?: string) => Promise<void>
  deleteCustomer: (customerId: string) => Promise<void>
  saveSupplier: (input: SupplierInput, supplierId?: string) => Promise<void>
  deleteSupplier: (supplierId: string) => Promise<void>
  saveProduct: (input: ProductInput, productId?: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  saveWarehouse: (input: WarehouseInput, warehouseId?: string) => Promise<void>
  deleteWarehouse: (warehouseId: string) => Promise<void>
  recordPurchase: (input: PurchaseInput) => Promise<void>
  createOrder: (input: OrderInput) => Promise<void>
  updateOrderStatus: (orderId: string, status: OrderRecord['status']) => Promise<void>
  createTask: (input: TaskInput) => Promise<void>
  updateTaskStatus: (taskId: string, status: TaskRecord['status']) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
}

const ERPContext = createContext<ERPContextValue | undefined>(undefined)
const CURRENT_USER_STORAGE_KEY = 'ims-current-user'

function normalizeLookup(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizePhoneLookup(value: unknown) {
  const digits = typeof value === 'string' || typeof value === 'number' ? String(value).replace(/\D/g, '') : ''

  if (!digits) {
    return ''
  }

  return digits.replace(/^(?:880|88|0)+/, '')
}

function mergeRecordMap<T extends { id: string }>(defaults: Record<string, T>, current?: Record<string, T> | null) {
  const merged: Record<string, T> = { ...defaults }

  for (const [id, record] of Object.entries(current ?? {})) {
    const defaultRecord = merged[id]
    merged[id] = defaultRecord ? { ...defaultRecord, ...record } : record
  }

  return merged
}

function normalizeCustomerRecord(customer: CustomerRecord): CustomerRecord {
  const now = new Date().toISOString()

  return {
    ...customer,
    company: customer.company || 'Retail',
    phone: customer.phone || '',
    location: customer.location || '',
    due: Number(customer.due ?? 0),
    supportStatus: customer.supportStatus ?? 'none',
    supportNote: customer.supportNote || '',
    createdAt: customer.createdAt || now,
    updatedAt: customer.updatedAt || customer.createdAt || now,
  }
}

function normalizeCustomerMap(customers?: Record<string, CustomerRecord> | null) {
  return Object.fromEntries(
    Object.entries(mergeRecordMap(DEFAULT_ERP_DATA.customers, customers)).map(([id, customer]) => [
      id,
      normalizeCustomerRecord(customer),
    ])
  )
}

function normalizeSupplierRecord(supplier: SupplierRecord): SupplierRecord {
  const now = new Date().toISOString()

  return {
    ...supplier,
    company: supplier.company || supplier.name || 'Supplier',
    phone: supplier.phone || '',
    email: supplier.email || '',
    location: supplier.location || '',
    supplierType: supplier.supplierType ?? 'local',
    country: supplier.country || 'Bangladesh',
    lcNumber: supplier.lcNumber || '',
    lcStatus: supplier.lcStatus ?? 'not-required',
    productCost: Number(supplier.productCost ?? 0),
    shippingCost: Number(supplier.shippingCost ?? 0),
    customsDuty: Number(supplier.customsDuty ?? 0),
    otherCost: Number(supplier.otherCost ?? 0),
    currency: supplier.currency || 'BDT',
    notes: supplier.notes || '',
    createdAt: supplier.createdAt || now,
    updatedAt: supplier.updatedAt || supplier.createdAt || now,
  }
}

function normalizeSupplierMap(suppliers?: Record<string, SupplierRecord> | null) {
  return Object.fromEntries(
    Object.entries(mergeRecordMap(DEFAULT_ERP_DATA.suppliers, suppliers)).map(([id, supplier]) => [
      id,
      normalizeSupplierRecord(supplier),
    ])
  )
}

function normalizeERPData(data: ERPData | null): ERPData | null {
  if (!data) {
    return DEFAULT_ERP_DATA
  }

  return {
    ...DEFAULT_ERP_DATA,
    ...data,
    roles: mergeRecordMap(DEFAULT_ERP_DATA.roles, data.roles),
    users: mergeRecordMap(DEFAULT_ERP_DATA.users, data.users),
    suppliers: normalizeSupplierMap(data.suppliers),
    customers: normalizeCustomerMap(data.customers),
    settings: {
      ...DEFAULT_ERP_DATA.settings,
      ...data.settings,
    },
    meta: {
      ...DEFAULT_ERP_DATA.meta,
      ...data.meta,
    },
  }
}

function getStoredCurrentUserId() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(CURRENT_USER_STORAGE_KEY)
}

function persistCurrentUserId(userId: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (userId) {
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId)
    return
  }

  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
}

function getDatabaseOrThrow() {
  if (!database) {
    throw new Error('Firebase Realtime Database is only available in the browser.')
  }

  return database
}

function normalizeProductInput(input: ProductInput) {
  return {
    name: input.name.trim(),
    category: input.category?.trim() ?? '',
    brand: input.brand?.trim() ?? '',
    sku: input.sku.trim().toUpperCase(),
    warehouseId: input.warehouseId,
    supplierId: input.supplierId?.trim() ?? '',
    purchasePrice: input.purchasePrice,
    sellingPrice: input.sellingPrice,
    wholesalePrice: input.wholesalePrice ?? input.sellingPrice,
    stockQty: input.stockQty,
    minStock: input.minStock,
    maxStock: input.maxStock,
    description: input.description?.trim() ?? '',
    imageUrl: input.imageUrl?.trim() ?? '',
    imagePublicId: input.imagePublicId?.trim() ?? '',
  }
}

function normalizeWarehouseInput(input: WarehouseInput) {
  return {
    name: input.name.trim(),
    location: input.location.trim(),
  }
}

function normalizeCustomerInput(input: CustomerInput) {
  return {
    name: input.name.trim(),
    company: input.company?.trim() || 'Retail',
    phone: input.phone.trim(),
    location: input.location?.trim() ?? '',
    due: Math.max(input.due ?? 0, 0),
    supportStatus: input.supportStatus ?? 'none',
    supportNote: input.supportNote?.trim() ?? '',
  }
}

function normalizeSupplierInput(input: SupplierInput) {
  return {
    name: input.name.trim(),
    company: input.company?.trim() || input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() ?? '',
    location: input.location?.trim() ?? '',
    supplierType: input.supplierType ?? 'local',
    country: input.country?.trim() || 'Bangladesh',
    lcNumber: input.lcNumber?.trim() ?? '',
    lcStatus: input.lcStatus ?? 'not-required',
    productCost: Math.max(input.productCost ?? 0, 0),
    shippingCost: Math.max(input.shippingCost ?? 0, 0),
    customsDuty: Math.max(input.customsDuty ?? 0, 0),
    otherCost: Math.max(input.otherCost ?? 0, 0),
    currency: input.currency?.trim().toUpperCase() || 'BDT',
    notes: input.notes?.trim() ?? '',
  }
}

export function ERPProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ERPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => getStoredCurrentUserId())

  useEffect(() => {
    let unsubscribe = () => undefined

    try {
      const db = getDatabaseOrThrow()
      const erpRef = ref(db, 'erp')

      get(erpRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return set(erpRef, DEFAULT_ERP_DATA)
          }

          return undefined
        })
        .catch((reason) => {
          setError(reason instanceof Error ? reason.message : 'Unable to initialize ERP data.')
        })

      unsubscribe = onValue(
        erpRef,
        (snapshot) => {
          setData(normalizeERPData(snapshot.val() as ERPData | null))
          setLoading(false)
        },
        (reason) => {
          setError(reason.message)
          setLoading(false)
        }
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Firebase Realtime Database is unavailable.')
      setLoading(false)
    }

    return () => unsubscribe()
  }, [])

  const users = useMemo(() => {
    return [...toArray(data?.users)].sort((left, right) => left.name.localeCompare(right.name))
  }, [data?.users])

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users]
  )

  const currentPermissions = useMemo(() => getPermissions(data, currentUser), [currentUser, data])

  async function seedDemoData() {
    const db = getDatabaseOrThrow()
    await set(ref(db, 'erp'), DEFAULT_ERP_DATA)
  }

  async function login(identifier: string, password: string) {
    if (!data) {
      throw new Error('Authentication data is still loading.')
    }

    const normalizedIdentifier = normalizeLookup(identifier)
    const normalizedPhoneIdentifier = normalizePhoneLookup(identifier)
    const user = users.find((entry) => {
      const loginIdMatches = normalizeLookup(entry.loginId) === normalizedIdentifier
      const phoneMatches = normalizePhoneLookup(entry.phone) === normalizedPhoneIdentifier

      return (loginIdMatches || phoneMatches) && entry.password === password
    })

    const demoAdmin = DEFAULT_ERP_DATA.users.u_admin
    const demoAdminMatches =
      (normalizeLookup(demoAdmin.loginId) === normalizedIdentifier ||
        normalizePhoneLookup(demoAdmin.phone) === normalizedPhoneIdentifier) &&
      demoAdmin.password === password

    const authenticatedUser = user ?? (demoAdminMatches ? demoAdmin : null)

    if (!authenticatedUser) {
      throw new Error('Invalid login ID, phone number, or password.')
    }

    if (authenticatedUser.status !== 'active') {
      throw new Error('This account is inactive.')
    }

    setCurrentUserId(authenticatedUser.id)
    persistCurrentUserId(authenticatedUser.id)

    return authenticatedUser
  }

  function logout() {
    setCurrentUserId(null)
    persistCurrentUserId(null)
  }

  async function writeActivity(action: string, module: string, message: string) {
    if (!currentUser) {
      return
    }

    const db = getDatabaseOrThrow()
    const activityId = createId('activity')
    await update(ref(db, 'erp/activities'), {
      [activityId]: {
        id: activityId,
        action,
        module,
        message,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString(),
      },
    })
  }

  async function writeNotification(
    title: string,
    body: string,
    level: 'info' | 'warning' | 'critical',
    roles?: string[]
  ) {
    const db = getDatabaseOrThrow()
    const notificationId = createId('notification')
    await update(ref(db, 'erp/notifications'), {
      [notificationId]: {
        id: notificationId,
        title,
        body,
        level,
        read: false,
        createdAt: new Date().toISOString(),
        roles: roles || null,
      },
    })
  }

  async function saveProduct(input: ProductInput, productId?: string) {
    if (!data) {
      return
    }

    const normalized = normalizeProductInput(input)

    if (!normalized.name) {
      throw new Error('Product name is required.')
    }

    if (!normalized.sku) {
      throw new Error('SKU or model code is required.')
    }

    if (!data.warehouses[normalized.warehouseId]) {
      throw new Error('Select a valid warehouse.')
    }

    if (normalized.supplierId && !data.suppliers[normalized.supplierId]) {
      throw new Error('Selected supplier was not found.')
    }

    const db = getDatabaseOrThrow()
    const existingProduct = productId ? data.products[productId] : null
    const id = existingProduct?.id ?? createId('product')
    const now = new Date().toISOString()
    const product = {
      id,
      ...normalized,
      status: getProductStatus(normalized.stockQty, normalized.minStock),
      createdAt: existingProduct?.createdAt ?? now,
      updatedAt: now,
    }

    await update(ref(db, 'erp/products'), { [id]: product })
    await writeActivity(
      existingProduct ? 'product_updated' : 'product_created',
      'inventory',
      existingProduct
        ? `Updated ${product.name} inventory details.`
        : `Added ${product.name} with ${product.stockQty} units in stock.`
    )

    if (!existingProduct) {
      await writeNotification(
        'Product added',
        `${product.name} has been added to inventory by ${currentUser?.name ?? 'Admin'}.`,
        'info',
        ['admin', 'store_manager', 'sales_person']
      )
    } else {
      if (existingProduct.stockQty !== product.stockQty) {
        await writeNotification(
          'Stock adjusted',
          `${product.name} stock level was adjusted from ${existingProduct.stockQty} to ${product.stockQty} by ${currentUser?.name ?? 'Admin'}.`,
          'warning',
          ['admin', 'store_manager']
        )
      } else {
        await writeNotification(
          'Product details updated',
          `${product.name} details were updated by ${currentUser?.name ?? 'Admin'}.`,
          'info',
          ['admin', 'store_manager']
        )
      }
    }

    if (product.stockQty <= product.minStock) {
      await writeNotification(
        'Low stock alert',
        `${product.name} is already at or below its minimum stock (${product.stockQty}/${product.minStock}).`,
        'warning',
        ['admin', 'store_manager']
      )
    }
  }

  async function deleteProduct(productId: string) {
    if (!data) {
      return
    }

    const product = data.products[productId]
    if (!product) {
      throw new Error('Product not found.')
    }

    const db = getDatabaseOrThrow()
    await update(ref(db, 'erp'), {
      [`products/${productId}`]: null,
    })
    await writeActivity('product_deleted', 'inventory', `Deleted ${product.name} from inventory.`)
    await writeNotification(
      'Product deleted',
      `${product.name} was deleted from inventory by ${currentUser?.name ?? 'Admin'}.`,
      'warning',
      ['admin', 'store_manager']
    )
  }

  async function saveWarehouse(input: WarehouseInput, warehouseId?: string) {
    if (!data) {
      return
    }

    const normalized = normalizeWarehouseInput(input)

    if (!normalized.name) {
      throw new Error('Warehouse name is required.')
    }

    if (!normalized.location) {
      throw new Error('Warehouse location is required.')
    }

    const db = getDatabaseOrThrow()
    const existingWarehouse = warehouseId ? data.warehouses[warehouseId] : null
    const id = existingWarehouse?.id ?? createId('warehouse')
    const warehouse = {
      id,
      ...normalized,
    }

    await update(ref(db, 'erp/warehouses'), { [id]: warehouse })
    await writeActivity(
      existingWarehouse ? 'warehouse_updated' : 'warehouse_created',
      'warehouse',
      existingWarehouse
        ? `Updated ${warehouse.name} warehouse details.`
        : `Added ${warehouse.name} warehouse.`
    )
  }

  async function saveCustomer(input: CustomerInput, customerId?: string) {
    if (!data) {
      return
    }

    const normalized = normalizeCustomerInput(input)

    if (!normalized.name) {
      throw new Error('Customer name is required.')
    }

    if (!normalized.phone) {
      throw new Error('Customer phone number is required.')
    }

    const db = getDatabaseOrThrow()
    const existingCustomer = customerId ? data.customers[customerId] : null
    const id = existingCustomer?.id ?? createId('customer')
    const now = new Date().toISOString()
    const customer = {
      id,
      ...normalized,
      createdAt: existingCustomer?.createdAt ?? now,
      updatedAt: now,
    }

    await update(ref(db, 'erp/customers'), { [id]: customer })
    await writeActivity(
      existingCustomer ? 'customer_updated' : 'customer_created',
      'customers',
      existingCustomer ? `Updated ${customer.name} CRM details.` : `Added customer ${customer.name}.`
    )
  }

  async function deleteCustomer(customerId: string) {
    if (!data) {
      return
    }

    const customer = data.customers[customerId]
    if (!customer) {
      throw new Error('Customer not found.')
    }

    const hasOrders = Object.values(data.orders).some((order) => order.customerId === customerId)
    if (hasOrders) {
      throw new Error('Customers with purchase history cannot be deleted.')
    }

    const db = getDatabaseOrThrow()
    await update(ref(db, 'erp'), {
      [`customers/${customerId}`]: null,
    })
    await writeActivity('customer_deleted', 'customers', `Deleted customer ${customer.name}.`)
  }

  async function saveSupplier(input: SupplierInput, supplierId?: string) {
    if (!data) {
      return
    }

    const normalized = normalizeSupplierInput(input)

    if (!normalized.name) {
      throw new Error('Supplier name is required.')
    }

    if (!normalized.phone) {
      throw new Error('Supplier phone number is required.')
    }

    const db = getDatabaseOrThrow()
    const existingSupplier = supplierId ? data.suppliers[supplierId] : null
    const id = existingSupplier?.id ?? createId('supplier')
    const now = new Date().toISOString()
    const supplier = {
      id,
      ...normalized,
      createdAt: existingSupplier?.createdAt ?? now,
      updatedAt: now,
    }

    await update(ref(db, 'erp/suppliers'), { [id]: supplier })
    await writeActivity(
      existingSupplier ? 'supplier_updated' : 'supplier_created',
      'suppliers',
      existingSupplier
        ? `Updated ${supplier.name} supplier and import details.`
        : `Added supplier ${supplier.name}.`
    )
  }

  async function deleteSupplier(supplierId: string) {
    if (!data) {
      return
    }

    const supplier = data.suppliers[supplierId]
    if (!supplier) {
      throw new Error('Supplier not found.')
    }

    const hasProducts = Object.values(data.products).some((product) => product.supplierId === supplierId)
    const hasPurchases = Object.values(data.purchases).some((purchase) => purchase.supplierId === supplierId)
    if (hasProducts || hasPurchases) {
      throw new Error('Suppliers with product or purchase history cannot be deleted.')
    }

    const db = getDatabaseOrThrow()
    await update(ref(db, 'erp'), {
      [`suppliers/${supplierId}`]: null,
    })
    await writeActivity('supplier_deleted', 'suppliers', `Deleted supplier ${supplier.name}.`)
  }

  async function deleteWarehouse(warehouseId: string) {
    if (!data) {
      return
    }

    const warehouse = data.warehouses[warehouseId]
    if (!warehouse) {
      throw new Error('Warehouse not found.')
    }

    const assignedProducts = Object.values(data.products).filter((product) => product.warehouseId === warehouseId)
    if (assignedProducts.length > 0) {
      throw new Error('Move or delete the products in this warehouse before removing it.')
    }

    const db = getDatabaseOrThrow()
    await update(ref(db, 'erp'), {
      [`warehouses/${warehouseId}`]: null,
    })
    await writeActivity('warehouse_deleted', 'warehouse', `Deleted ${warehouse.name} warehouse.`)
  }

  async function recordPurchase(input: PurchaseInput) {
    if (!data) {
      return
    }

    const db = getDatabaseOrThrow()
    const product = data.products[input.productId]
    const supplier = data.suppliers[input.supplierId]
    if (!product || !supplier) {
      throw new Error('Product or supplier not found.')
    }

    const purchaseId = createId('purchase')
    const nextStock = product.stockQty + input.quantity
    const now = new Date().toISOString()

    await update(ref(db, 'erp'), {
      [`purchases/${purchaseId}`]: {
        id: purchaseId,
        productId: product.id,
        productName: product.name,
        supplierId: supplier.id,
        supplierName: supplier.name,
        quantity: input.quantity,
        unitCost: input.unitCost,
        currency: input.currency,
        total: input.quantity * input.unitCost,
        status: 'received',
        createdAt: now,
      },
      [`products/${product.id}/stockQty`]: nextStock,
      [`products/${product.id}/purchasePrice`]: input.unitCost,
      [`products/${product.id}/status`]: getProductStatus(nextStock, product.minStock),
      [`products/${product.id}/updatedAt`]: now,
    })

    await writeActivity('purchase_received', 'inventory', `Restocked ${product.name} by ${input.quantity} units.`)
    await writeNotification(
      'Purchase recorded',
      `Restocked ${product.name} by ${input.quantity} units from ${supplier.name} by ${currentUser?.name ?? 'Admin'}.`,
      'info',
      ['admin', 'store_manager', 'accountant']
    )
  }

  async function createOrder(input: OrderInput) {
    if (!data || !currentUser) {
      return
    }

    const db = getDatabaseOrThrow()
    const product = data.products[input.productId]
    const customer = data.customers[input.customerId]
    if (!product || !customer) {
      throw new Error('Product or customer not found.')
    }

    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than zero.')
    }

    if (product.stockQty < input.quantity) {
      throw new Error('Insufficient stock for this order.')
    }

    const orderId = createId('order')
    const total = product.sellingPrice * input.quantity
    const paid = Math.min(Math.max(input.paid, 0), total)
    const due = total - paid
    const now = new Date().toISOString()
    const nextStock = product.stockQty - input.quantity

    await update(ref(db, 'erp'), {
      [`orders/${orderId}`]: {
        id: orderId,
        customerId: customer.id,
        customerName: customer.name,
        salesPersonId: currentUser.id,
        salesPersonName: currentUser.name,
        status: 'pending',
        paymentStatus: due === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
        total,
        paid,
        due,
        deliveryDate: input.deliveryDate,
        createdAt: now,
        items: [
          {
            productId: product.id,
            productName: product.name,
            quantity: input.quantity,
            unitPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
          },
        ],
      },
      [`products/${product.id}/stockQty`]: nextStock,
      [`products/${product.id}/status`]: getProductStatus(nextStock, product.minStock),
      [`products/${product.id}/updatedAt`]: now,
      [`customers/${customer.id}/due`]: (data.customers[customer.id]?.due ?? 0) + due,
    })

    await writeActivity('order_created', 'sales', `Created order for ${customer.name} with ${input.quantity} x ${product.name}.`)
    await writeNotification(
      'New sales order',
      `Order ${orderId} created for ${customer.name} by ${currentUser?.name ?? 'Admin'}. Awaiting fulfillment.`,
      'info',
      ['admin', 'sales_person', 'accountant']
    )

    if (nextStock <= product.minStock) {
      await writeNotification(
        'Low stock alert',
        `${product.name} needs replenishment after the latest sale (${nextStock}/${product.minStock}).`,
        'warning',
        ['admin', 'store_manager']
      )
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderRecord['status']) {
    if (!data) {
      return
    }

    const db = getDatabaseOrThrow()
    const order = data.orders[orderId]
    if (!order) {
      return
    }

    await update(ref(db, `erp/orders/${orderId}`), { status })
    await writeActivity('order_status_changed', 'sales', `Moved order ${orderId} to ${status}.`)
    await writeNotification(
      'Order status updated',
      `Order ${orderId} status was updated to "${status}" by ${currentUser?.name ?? 'Admin'}.`,
      'info',
      ['admin', 'sales_person', 'accountant']
    )
  }

  async function createTask(input: TaskInput) {
    if (!data || !currentUser) {
      return
    }

    const db = getDatabaseOrThrow()
    const assignee = data.users[input.assigneeId]
    if (!assignee) {
      throw new Error('Assignee not found.')
    }

    const taskId = createId('task')
    const now = new Date().toISOString()

    await update(ref(db, 'erp/tasks'), {
      [taskId]: {
        id: taskId,
        title: input.title,
        description: input.description,
        module: input.module,
        status: 'pending',
        priority: input.priority,
        assigneeId: assignee.id,
        assigneeName: assignee.name,
        dueDate: input.dueDate,
        createdBy: currentUser.id,
        createdAt: now,
      },
    })

    await writeActivity('task_created', 'operations', `Assigned "${input.title}" to ${assignee.name}.`)
    await writeNotification(
      'New task assigned',
      `Task "${input.title}" was assigned to ${assignee.name} by ${currentUser?.name ?? 'Admin'}.`,
      'info',
      ['admin', assignee.roleId]
    )
  }

  async function createUser(input: UserInput) {
    if (!data || !currentUser) {
      throw new Error('You need to log in before creating users.')
    }

    if (currentUser.roleId !== 'admin') {
      throw new Error('Only admin users can create new users.')
    }

    const normalizedLoginId = normalizeLookup(input.loginId)
    const normalizedPhone = normalizePhoneLookup(input.phone)

    const loginIdExists = users.some((user) => normalizeLookup(user.loginId) === normalizedLoginId)
    if (loginIdExists) {
      throw new Error('That login ID is already in use.')
    }

    const phoneExists = users.some((user) => normalizePhoneLookup(user.phone) === normalizedPhone)
    if (phoneExists) {
      throw new Error('That phone number is already in use.')
    }

    if (!data.roles[input.roleId]) {
      throw new Error('Selected role does not exist.')
    }

    const db = getDatabaseOrThrow()
    const id = createId('user')
    const user: UserRecord = {
      id,
      name: input.name.trim(),
      loginId: normalizedLoginId,
      email: `${normalizedLoginId}@local`,
      phone: normalizedPhone,
      password: input.password,
      roleId: input.roleId,
      title: input.title.trim(),
      status: 'active',
    }

    await update(ref(db, 'erp/users'), { [id]: user })
    await writeActivity('user_created', 'admin', `Created user ${user.name} with ${data.roles[user.roleId]?.name ?? user.roleId} access.`)
    await writeNotification(
      'New user registered',
      `User ${user.name} was registered as ${data?.roles[user.roleId]?.name || user.roleId} by ${currentUser?.name ?? 'Admin'}.`,
      'info',
      ['admin']
    )
  }

  async function updateTaskStatus(taskId: string, status: TaskRecord['status']) {
    const db = getDatabaseOrThrow()
    await update(ref(db, `erp/tasks/${taskId}`), { status })
    await writeActivity('task_updated', 'operations', `Updated task ${taskId} to ${status}.`)
  }

  async function markNotificationRead(notificationId: string) {
    const db = getDatabaseOrThrow()
    await update(ref(db, `erp/notifications/${notificationId}`), { read: true })
  }

  function switchUser(userId: string) {
    setCurrentUserId(userId)
    persistCurrentUserId(userId)
  }

  const value = useMemo<ERPContextValue>(
    () => ({
      data,
      loading,
      error,
      users,
      currentUser,
      currentPermissions,
      login,
      logout,
      switchUser,
      createUser,
      hasPermission: (permission) => hasPermissionCheck(data, currentUser, permission),
      seedDemoData,
      saveProduct,
      deleteProduct,
      saveCustomer,
      deleteCustomer,
      saveSupplier,
      deleteSupplier,
      saveWarehouse,
      deleteWarehouse,
      recordPurchase,
      createOrder,
      updateOrderStatus,
      createTask,
      updateTaskStatus,
      markNotificationRead,
    }),
    [currentPermissions, currentUser, data, error, loading, users]
  )

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>
}

export function useERP() {
  const context = useContext(ERPContext)

  if (!context) {
    throw new Error('useERP must be used inside ERPProvider.')
  }

  return context
}
