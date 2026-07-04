import type {
  ActivityRecord,
  ERPData,
  NotificationRecord,
  OrderRecord,
  ProductRecord,
  UserRecord,
} from '@/lib/erp/types'

export function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function toArray<T extends { id: string }>(record?: Record<string, T> | null) {
  return record ? Object.values(record) : []
}

export function formatCurrency(value: number, currency = 'BDT') {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function isSameCalendarDay(value: string, target = new Date()) {
  const date = new Date(value)

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  )
}

export function getProductStatus(stockQty: number, minStock: number): ProductRecord['status'] {
  if (stockQty <= 0) {
    return 'out-of-stock'
  }

  if (stockQty <= minStock) {
    return 'low-stock'
  }

  return 'active'
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function getPermissions(data: ERPData | null, user: UserRecord | null) {
  if (!data || !user) {
    return []
  }

  return data.roles[user.roleId]?.permissions ?? []
}

export function hasPermission(data: ERPData | null, user: UserRecord | null, permission: string) {
  return getPermissions(data, user).includes(permission)
}

export function buildDashboardSnapshot(data: ERPData | null) {
  const orders = sortByCreatedAtDesc(toArray(data?.orders))
  const purchases = sortByCreatedAtDesc(toArray(data?.purchases))
  const products = toArray(data?.products)
  const tasks = toArray(data?.tasks)
  const notifications = sortByCreatedAtDesc(toArray(data?.notifications))
  const activities = sortByCreatedAtDesc(toArray(data?.activities))

  const todayOrders = orders.filter((order) => isSameCalendarDay(order.createdAt))
  const todayPurchases = purchases.filter((purchase) => isSameCalendarDay(purchase.createdAt))
  const todaySales = todayOrders.reduce((total, order) => total + order.total, 0)
  const todayPurchase = todayPurchases.reduce((total, purchase) => total + purchase.total, 0)
  const todayCost = todayOrders.reduce(
    (total, order) =>
      total +
      order.items.reduce((sum, item) => {
        return sum + item.purchasePrice * item.quantity
      }, 0),
    0
  )
  const lowStock = products.filter((product) => product.stockQty <= product.minStock)
  const topProducts = products
    .map((product) => {
      const sold = orders.reduce((sum, order) => {
        const item = order.items.find((entry) => entry.productId === product.id)
        return sum + (item?.quantity ?? 0)
      }, 0)

      return {
        id: product.id,
        name: product.name,
        stockQty: product.stockQty,
        sold,
        revenue: orders.reduce((sum, order) => {
          const item = order.items.find((entry) => entry.productId === product.id)
          return sum + (item ? item.unitPrice * item.quantity : 0)
        }, 0),
      }
    })
    .sort((left, right) => right.sold - left.sold)
    .slice(0, 5)

  const orderStatusCounts = orders.reduce<Record<string, number>>((result, order) => {
    result[order.status] = (result[order.status] ?? 0) + 1
    return result
  }, {})

  const monthlyRevenue = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const label = date.toLocaleDateString('en-BD', { month: 'short' })
    const revenue = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt)
        return `${orderDate.getFullYear()}-${orderDate.getMonth()}` === key
      })
      .reduce((sum, order) => sum + order.total, 0)
    const expense = purchases
      .filter((purchase) => {
        const purchaseDate = new Date(purchase.createdAt)
        return `${purchaseDate.getFullYear()}-${purchaseDate.getMonth()}` === key
      })
      .reduce((sum, purchase) => sum + purchase.total, 0)

    return {
      month: label,
      revenue,
      expense,
    }
  })

  return {
    metrics: {
      todaySales,
      todayPurchase,
      todayProfit: todaySales - todayCost,
      todayExpense: todayPurchase,
      pendingDelivery: orders.filter((order) => ['pending', 'ready'].includes(order.status)).length,
      pendingPayment: orders.filter((order) => order.due > 0).length,
      todaysOrders: todayOrders.length,
      lowStockCount: lowStock.length,
      activeWarrantyClaims: tasks.filter((task) => task.module === 'support' && task.status !== 'done').length,
    },
    topProducts,
    orderStatusCounts,
    lowStock,
    notifications,
    activities,
    monthlyRevenue,
  }
}

export function buildUserReport(data: ERPData | null) {
  const users = toArray(data?.users)
  const orders = toArray(data?.orders)

  return users.map((user) => {
    const userOrders = orders.filter((order) => order.salesPersonId === user.id)

    return {
      id: user.id,
      name: user.name,
      role: data?.roles[user.roleId]?.name ?? user.roleId,
      totalOrders: userOrders.length,
      pendingOrders: userOrders.filter((order) => order.status === 'pending').length,
      completedOrders: userOrders.filter((order) => order.status === 'completed').length,
      revenue: userOrders.reduce((sum, order) => sum + order.total, 0),
      due: userOrders.reduce((sum, order) => sum + order.due, 0),
    }
  })
}

export function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }

  return value
}

export function notificationToneClass(notification: NotificationRecord) {
  if (notification.level === 'critical') {
    return 'border-rose-200 bg-rose-500/10 text-rose-700 dark:border-rose-900 dark:text-rose-300'
  }

  if (notification.level === 'warning') {
    return 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900 dark:text-amber-300'
  }

  return 'border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-900 dark:text-sky-300'
}

export function activitySummary(activity: ActivityRecord) {
  return `${activity.userName} · ${activity.message}`
}

export function getReadableOrderState(order: OrderRecord) {
  return order.status.replace('-', ' ')
}
