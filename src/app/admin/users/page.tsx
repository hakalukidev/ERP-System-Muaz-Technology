import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { AdminShell } from '@/components/admin/AdminShell'
import { UserManagementPanel } from '@/components/admin/UserManagementPanel'

export default function UsersPage() {
  return (
    <AdminShell active="User & Role Management">
      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>User and role management</CardTitle>
            <CardDescription>Add employee logins and control permissions from one admin-only screen.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The permission matrix is driven by Firebase data, so user access changes are immediate across the app.
          </CardContent>
        </Card>

        <UserManagementPanel />
      </div>
    </AdminShell>
  )
}