import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { ERPProvider } from '@/lib/erp/provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'IMS - Inventory Management System',
  description: 'Inventory Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ERPProvider>{children}</ERPProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
