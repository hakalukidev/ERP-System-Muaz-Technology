import { ModuleFeatureScreen } from '@/components/admin/ModuleFeatureScreen'

export default function FinancePage() {
  return (
    <ModuleFeatureScreen
      active="Accounting & Finance"
      eyebrow="Accounting & finance"
      title="Ledger, profit/loss, dues, and multi-currency accounting"
      description="The finance module keeps the BDT base ledger, foreign-currency supplier entries, exchange rates, and exportable reports aligned with the rest of the ERP."
      highlights={[
        { label: 'Base currency', value: 'BDT', note: 'Use BDT for reporting and tax output.' },
        { label: 'Foreign transactions', value: 'Original + BDT', note: 'Store supplier values in source currency and equivalent.' },
        { label: 'Exchange rates', value: 'Shared table', note: 'Finance and suppliers use one rate source.' },
        { label: 'Export', value: 'Excel / PDF', note: 'Move reports into spreadsheets or PDFs.' },
      ]}
      sections={[
        {
          title: 'Accounting coverage',
          description: 'Core finance flows should stay tightly linked to sales and supplier data.',
          items: [
            { title: 'Income and expense entries', description: 'Record operational cashflow in one ledger.', status: 'Planned' },
            { title: 'Profit and loss report', description: 'Summarize profit, cost, and expense trends.', status: 'Ready' },
            { title: 'Due payment reminders', description: 'Surface upcoming customer and supplier reminders.', status: 'Scaffolded' },
          ],
        },
        {
          title: 'Multi-currency ledger',
          description: 'Foreign supplier transactions should preserve source amounts and BDT equivalent values.',
          items: [
            { title: 'Daily exchange rate entry', description: 'Allow manual or daily-rate source updates.', status: 'Planned' },
            { title: 'Foreign supplier currency', description: 'Attach USD, CNY, or other currencies to purchases.', status: 'Ready' },
            { title: 'Landed cost impact', description: 'Feed the exchange rate into landed cost calculations.', status: 'Planned' },
          ],
        },
      ]}
      actions={[{ label: 'Open reports', href: '/admin/reports', variant: 'outline' }]}
    />
  )
}