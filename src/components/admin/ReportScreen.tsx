"use client"

import { Printer } from 'lucide-react'

import { AdminShell } from './AdminShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useERP } from '@/lib/erp/provider'
import { buildUserReport, exportCsv, formatCurrency, notificationToneClass, toArray } from '@/lib/erp/utils'

export function ReportScreen() {
  const { data, currentUser, currentPermissions, markNotificationRead } = useERP()
  const report = buildUserReport(data)
  const permissions = toArray(data?.permissions)

  const roleId = currentUser?.roleId
  const notifications = toArray(data?.notifications)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .filter((item) => {
      if (!roleId) return true
      if (roleId === 'admin') return true
      if (!item.roles || item.roles.length === 0) return true
      return item.roles.includes(roleId)
    })
  const totalRevenue = report.reduce((sum, row) => sum + row.revenue, 0)
  const totalDue = report.reduce((sum, row) => sum + row.due, 0)

  function handleExport() {
    exportCsv(
      'ims-user-report.csv',
      ['User', 'Role', 'Orders', 'Pending Orders', 'Completed Orders', 'Revenue', 'Due'],
      report.map((row) => [
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

  return (
    <AdminShell active="Reports">
      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Reports</Badge>
                <Badge variant="outline" className="rounded-full">Team and access matrix</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Performance and role reporting</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review user performance, dynamic permissions, revenue concentration, and live notifications from the SRS core modules.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl" onClick={handleExport}>
                Export CSV
              </Button>
              <Button className="rounded-xl" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Report pack</CardTitle>
            <CardDescription>All operational reports should stay exportable in both Excel and PDF form.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Sales report', 'Sales, invoices, and payment history.'],
              ['Stock report', 'Current stock, low stock, and warehouse view.'],
              ['Supplier/import cost', 'Purchase orders, LC, and landed cost summaries.'],
              ['Customer ledger', 'Customer history, dues, and support activity.'],
              ['Profit and loss', 'Finance summary with base-currency reporting.'],
              ['Returns and warranty claims', 'Track refund, replacement, and claim resolution.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total tracked revenue</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalRevenue, data?.settings.currency)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total outstanding due</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalDue, data?.settings.currency)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Current role permissions</p>
              <p className="mt-2 text-lg font-semibold">{currentUser ? data?.roles[currentUser.roleId]?.name : 'Loading role'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{currentPermissions.length} active permissions</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>User summary</CardTitle>
            <CardDescription>Realtime order, due, and revenue output by teammate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <div className="overflow-x-auto">
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
                    {report.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.totalOrders}</TableCell>
                        <TableCell>{row.pendingOrders}</TableCell>
                        <TableCell>{row.completedOrders}</TableCell>
                        <TableCell>{formatCurrency(row.revenue, data?.settings.currency)}</TableCell>
                        <TableCell>{formatCurrency(row.due, data?.settings.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Role and permission matrix</CardTitle>
              <CardDescription>Permissions are stored in Firebase data instead of being hardcoded in the UI.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Permission</TableHead>
                        {Object.values(data?.roles ?? {}).map((role) => (
                          <TableHead key={role.id}>{role.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{permission.label}</p>
                              <p className="text-sm text-muted-foreground">{permission.description}</p>
                            </div>
                          </TableCell>
                          {Object.values(data?.roles ?? {}).map((role) => (
                            <TableCell key={role.id}>
                              {role.permissions.includes(permission.id) ? (
                                <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">Allowed</Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-full">No access</Badge>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Review and clear outstanding operational alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className={`rounded-2xl border p-4 ${notificationToneClass(notification)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{notification.title}</p>
                      <p className="mt-2 text-sm leading-6">{notification.body}</p>
                    </div>
                    {!notification.read ? (
                      <Button variant="outline" className="rounded-full" onClick={() => void markNotificationRead(notification.id)}>
                        Mark read
                      </Button>
                    ) : (
                      <Badge variant="outline">Read</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  )
}
