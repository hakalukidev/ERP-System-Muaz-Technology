import { ModuleFeatureScreen } from '@/components/admin/ModuleFeatureScreen'

export default function CustomersPage() {
  return (
    <ModuleFeatureScreen
      active="Customers (CRM)"
      eyebrow="Customers"
      title="Customer CRM and support in one place"
      description="Customer records, purchase history, dues, and technical support should share one ticket view so warranty and service follow-ups stay consistent."
      highlights={[
        { label: 'Customer records', value: 'Single CRM', note: 'Keep customer and company details aligned.' },
        { label: 'Purchase history', value: 'Per customer', note: 'Link orders, invoices, and returns.' },
        { label: 'Service flow', value: 'Merged tickets', note: 'Warranty claims and technical support use one timeline.' },
        { label: 'Credit tracking', value: 'Visible due', note: 'Monitor outstanding balances by customer.' },
      ]}
      sections={[
        {
          title: 'CRM coverage',
          description: 'The CRM module concentrates on customer records and after-sales service.',
          items: [
            { title: 'Customer database', description: 'Keep identity, company, and contact details searchable.', status: 'Ready' },
            { title: 'Purchase history', description: 'Show orders and invoices by customer.', status: 'Scaffolded' },
            { title: 'Due / credit tracking', description: 'Expose customer balances and follow-up tasks.', status: 'Ready' },
          ],
        },
        {
          title: 'Support workflow',
          description: 'Warranty claims and technical support should resolve through the same queue.',
          items: [
            { title: 'Single ticket view', description: 'Merge servicing and warranty into one thread.', status: 'Planned' },
            { title: 'Serial lookup', description: 'Search by serial number to load purchase and warranty context.', status: 'Planned' },
            { title: 'Claim resolution', description: 'Move tickets from received to resolved or replaced.', status: 'Planned' },
          ],
        },
      ]}
      actions={[{ label: 'Open sales & billing', href: '/admin/sales', variant: 'outline' }]}
    />
  )
}