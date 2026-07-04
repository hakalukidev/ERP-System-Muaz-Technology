"use client"

import Image from 'next/image'
import Link from 'next/link'
import { ReactNode, useMemo, useState } from 'react'
import {
  Bell,
  Boxes,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { useERP } from '@/lib/erp/provider'
import { cn } from '@/lib/utils'

type NavigationItem = {
  label: string
  description: string
  href: string
  icon: typeof LayoutDashboard
  permission: string
}

type NavigationGroup = {
  title: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    title: 'Operations',
    items: [
      {
        label: 'Dashboard',
        description: "Today's sales, alerts, and warranty claims",
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        permission: 'view_dashboard',
      },
      {
        label: 'Sales & Billing',
        description: 'POS, invoices, returns, and due tracking',
        href: '/admin/sales',
        icon: ShoppingCart,
        permission: 'manage_orders',
      },
      {
        label: 'Inventory / Stock',
        description: 'Products, warehouses, and warranty-linked inventory',
        href: '/admin/stock/overview',
        icon: Boxes,
        permission: 'view_products',
      },
      {
        label: 'Suppliers & Imports',
        description: 'Purchase orders, LC tracking, and landed cost',
        href: '/admin/suppliers',
        icon: Truck,
        permission: 'view_products',
      },
      {
        label: 'Customers (CRM)',
        description: 'Customer history, support, and credit tracking',
        href: '/admin/customers',
        icon: Users,
        permission: 'view_reports',
      },
      {
        label: 'Accounting & Finance',
        description: 'Ledger, profit/loss, and multi-currency reporting',
        href: '/admin/finance',
        icon: Wallet,
        permission: 'view_finance',
      },
      {
        label: 'Reports',
        description: 'Sales, stock, returns, and warranty reports',
        href: '/admin/reports',
        icon: FileSpreadsheet,
        permission: 'view_reports',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Notifications',
        description: 'Alert channels, thresholds, and recipients',
        href: '/admin/notifications',
        icon: Bell,
        permission: 'view_dashboard',
      },
      {
        label: 'User & Role Management',
        description: 'Employee logins and permission matrix',
        href: '/admin/users',
        icon: ShieldCheck,
        permission: 'view_reports',
      },
      {
        label: 'Settings',
        description: 'Company profile, warehouses, and policy defaults',
        href: '/admin/settings',
        icon: Settings2,
        permission: 'view_dashboard',
      },
    ],
  },
] as const

type AdminShellProps = {
  active: string
  children: ReactNode
}

function SidebarContent({
  active,
  onNavigate,
}: {
  active: string
  onNavigate?: () => void
}) {
  const { hasPermission, currentUser } = useERP()

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="space-y-4 border-b border-sidebar-border px-5 py-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sidebar-primary/10 ring-1 ring-sidebar-primary/15">
            <Image src="/muaz-logo.svg" alt="IMS" width={34} height={34} className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-sidebar-foreground/60">
              IMS ERP
            </p>
            <h2 className="text-lg font-semibold">Muaz Technology</h2>
          </div>
        </Link>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="px-2 text-xs font-medium uppercase tracking-[0.26em] text-sidebar-foreground/45">
                {group.title}
              </p>
              <nav className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.label

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'group flex items-start gap-3 rounded-2xl border px-3 py-3 transition-all',
                        isActive
                          ? 'border-sidebar-primary/25 bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'
                          : 'border-transparent bg-transparent hover:border-sidebar-border hover:bg-sidebar-accent'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          isActive
                            ? 'bg-white/18 text-sidebar-primary-foreground'
                            : 'bg-sidebar-accent text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span
                          className={cn(
                            'mt-1 block text-xs leading-5',
                            isActive ? 'text-sidebar-primary-foreground/80' : 'text-sidebar-foreground/60'
                          )}
                        >
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

       
      </div>
    </div>
  )
}

export function AdminShell({ active, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { currentUser, data, seedDemoData, logout } = useERP()

  const allNavigationItems = navigationGroups.flatMap((group) => group.items)

  const currentPage = useMemo(
    () => allNavigationItems.find((item) => item.label === active) ?? allNavigationItems[0],
    [active, allNavigationItems]
  )

  const unreadNotifications = Object.values(data?.notifications ?? {}).filter((item) => !item.read).length
  const roleName = currentUser ? data?.roles[currentUser.roleId]?.name ?? currentUser.roleId : 'Loading'

  if (!currentUser) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[320px] border-r border-sidebar-border bg-sidebar shadow-[24px_0_80px_-48px_rgba(15,23,42,0.45)] lg:block">
          <SidebarContent active={active} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] border-sidebar-border bg-sidebar p-0">
                      <SheetHeader className="px-5 pt-6 text-left">
                        <SheetTitle>Navigation</SheetTitle>
                        <SheetDescription>Browse the ERP workspace.</SheetDescription>
                      </SheetHeader>
                      <div className="mt-4 h-[calc(100%-5rem)]">
                        <SidebarContent active={active} onNavigate={() => setMobileOpen(false)} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em]">
                        {currentPage.label}
                      </Badge>
                      <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                        {roleName}
                      </Badge>
                    </div>
                    <h1 className="mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                      {currentPage.description}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle className="hidden sm:inline-flex" />
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => void seedDemoData()}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Reset demo data
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Realtime sync active
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications} unread notifications
                  </span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">{currentUser.name}</p>
                  <p className="text-muted-foreground">
                    {currentUser.title} · {roleName}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <footer className="border-t border-border/60 px-4 py-5 text-sm text-muted-foreground sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>Next.js + Firebase Realtime Database ERP workspace with live inventory, sales, and operations data.</p>
              <p>{data?.settings.companyName ?? 'IMS'} · {data?.settings.timezone ?? 'Asia/Dhaka'}</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
