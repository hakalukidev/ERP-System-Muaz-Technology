import { ModuleFeatureScreen } from '@/components/admin/ModuleFeatureScreen'

export default function SuppliersPage() {
  return (
    <ModuleFeatureScreen
      active="Suppliers & Imports"
      eyebrow="Suppliers & imports"
      title="Supplier database, purchase orders, and landed cost control"
      description="This module groups local and foreign suppliers, purchase orders, LC tracking, shipment status, and currency-aware purchase handling into one place."
      highlights={[
        { label: 'Supplier records', value: 'Local + foreign', note: 'Keep one searchable supplier database.' },
        { label: 'Import flow', value: 'PO → LC → Received', note: 'Track shipments through every stage.' },
        { label: 'Costing', value: 'Per-unit landed cost', note: 'Combine shipping, customs, and LC.' },
        { label: 'Currency', value: 'Every purchase', note: 'Store original currency and BDT equivalent.' },
      ]}
      sections={[
        {
          title: 'Procurement workflow',
          description: 'The buying flow is organized around supplier intelligence and import control.',
          items: [
            { title: 'Supplier database', description: 'Keep local and foreign suppliers in one register.', status: 'Ready' },
            { title: 'Purchase orders and invoices', description: 'Track buying documents from ordering to receipt.', status: 'Scaffolded' },
            { title: 'Import shipment status', description: 'Mark shipments as in transit or received.', status: 'Scaffolded' },
          ],
        },
        {
          title: 'Finance handoff',
          description: 'Supplier transactions should feed the shared exchange-rate and landed-cost logic.',
          items: [
            { title: 'LC tracking', description: 'Keep letter-of-credit state attached to each import.', status: 'Planned' },
            { title: 'Currency on purchase entry', description: 'Capture original currency for each purchase line.', status: 'Ready' },
            { title: 'Landed cost calculator', description: 'Allocate shipping and customs into per-unit cost.', status: 'Planned' },
          ],
        },
      ]}
      actions={[{ label: 'Open stock overview', href: '/admin/stock/overview', variant: 'outline' }]}
    />
  )
}