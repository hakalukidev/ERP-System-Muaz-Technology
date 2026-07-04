"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, LockKeyhole, LayoutDashboard, Smartphone, Users } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useERP } from '@/lib/erp/provider'

export function LoginScreen() {
  const router = useRouter()
  const { currentUser, loading, login } = useERP()
  const [identifier, setIdentifier] = useState('01844902338')
  const [password, setPassword] = useState('123456')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser) {
      router.replace('/admin/dashboard')
    }
  }, [currentUser, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(identifier, password)
      router.replace('/admin/dashboard')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to log in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.42))]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">IMS ERP</p>
              <h1 className="text-xl font-semibold tracking-tight">Admin login</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="space-y-4">
              <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">Cloud-ready, role-based access</Badge>
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Simple inventory and sales control for mobile and desktop.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Log in once, then manage dashboards, stock, sales, reports, and user access from the same realtime workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="p-5">
                  <LockKeyhole className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-semibold">Admin first</p>
                  <p className="mt-2 text-sm text-muted-foreground">One login opens the control panel.</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="p-5">
                  <Users className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-semibold">Role access</p>
                  <p className="mt-2 text-sm text-muted-foreground">Users only see what their role allows.</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 shadow-sm">
                <CardContent className="p-5">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-semibold">Mobile friendly</p>
                  <p className="mt-2 text-sm text-muted-foreground">Works cleanly on phones and tablets too.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <Card className="border-border/70 shadow-2xl shadow-primary/10">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Demo admin</Badge>
                  <Badge variant="outline" className="rounded-full">Robin</Badge>
                </div>
                <CardTitle className="text-2xl">Sign in to continue</CardTitle>
                <CardDescription>Use phone number or login ID with the password set by admin.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Login ID or phone</label>
                    <Input
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="01844902338"
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

                  <Button type="submit" className="w-full rounded-xl" disabled={submitting || loading}>
                    {submitting ? 'Signing in...' : loading ? 'Loading users...' : 'Enter dashboard'}
                  </Button>
                </form>

                <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-medium text-foreground">Admin demo account</p>
                  <p className="mt-1">Phone: 01844902338</p>
                  <p>Password: 123456</p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
