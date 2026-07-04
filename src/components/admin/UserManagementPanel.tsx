"use client"

import { useMemo, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useERP } from '@/lib/erp/provider'

const initialForm = {
  name: '',
  loginId: '',
  phone: '',
  password: '',
  roleId: 'viewer',
  title: '',
}

export function UserManagementPanel() {
  const { data, currentUser, createUser } = useERP()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const roles = useMemo(() => Object.values(data?.roles ?? {}), [data?.roles])
  const users = useMemo(() => Object.values(data?.users ?? {}), [data?.users])
  const isAdmin = currentUser?.roleId === 'admin'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)

    try {
      await createUser(form)
      setForm(initialForm)
      setMessage('User created successfully.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create user.')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>User access</CardTitle>
          <CardDescription>Only admin can create users and assign roles.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Log in with the admin account to manage team access.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Admin only</Badge>
            <Badge variant="outline" className="rounded-full">User setup</Badge>
          </div>
          <CardTitle>Create a new user</CardTitle>
          <CardDescription>Set the login ID, password, phone number, and role for a new team member.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Full name"
                required
              />
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Job title"
                required
              />
              <Input
                value={form.loginId}
                onChange={(event) => setForm((current) => ({ ...current, loginId: event.target.value }))}
                placeholder="Login ID"
                required
              />
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
                required
              />
              <Input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Password"
                type="password"
                required
              />
              <Select
                value={form.roleId}
                onValueChange={(value) => setForm((current) => ({ ...current, roleId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="rounded-xl" disabled={saving}>
                {saving ? 'Creating...' : 'Create user'}
              </Button>
              {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
              {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Current users</CardTitle>
          <CardDescription>Login ID and role map for the team already stored in Firebase.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Name</TableHead>
                    <TableHead>Login ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.loginId}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{data?.roles[user.roleId]?.name ?? user.roleId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
