// components/premium/PremiumDashboard.tsx
import { Badge, Card, Col, Row, Statistic } from 'antd';
import { useCollection } from '@/lib/hooks/useFirebase';
import { PieChart } from 'recharts';

export function PremiumDashboard() {
  const { data: premiumCustomers } = useCollection('customers', [
    { field: 'customerType', operator: 'in', value: ['premium', 'vip'] }
  ]);
  
  const { data: promotionLogs } = useCollection('promotionLogs', [
    { field: 'promotedBy', operator: '==', value: 'system' }
  ]);
  
  // Calculate metrics
  const totalPremium = premiumCustomers?.length || 0;
  const vipCount = premiumCustomers?.filter(c => c.customerType === 'vip').length || 0;
  const totalPremiumRevenue = premiumCustomers?.reduce((sum, c) => sum + c.totalSpent, 0) || 0;
  const recentUpgrades = promotionLogs?.filter(log => {
    const date = log.promotedAt.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // Last 7 days
  }).length || 0;
  
  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card><Statistic title={`Total Premium (+${recentUpgrades} this week)`} value={totalPremium} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="VIP Customers" value={vipCount} suffix={`${((vipCount / (totalPremium || 1)) * 100).toFixed(1)}%`} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="Total Revenue" prefix="$" value={totalPremiumRevenue} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card><Statistic title="Avg. Order Value" prefix="$" value={premiumCustomers?.reduce((sum, c) => sum + c.averageOrderValue, 0) / (totalPremium || 1)} precision={0} /></Card>
        </Col>
      </Row>
      
      <div className="grid grid-cols-2 gap-6">
        <Card title="Premium Tiers Distribution">
            <PieChart data={[
              { name: 'Gold', value: totalPremium - vipCount },
              { name: 'Platinum', value: vipCount }
            ]} />
        </Card>
        
        <Card title="Recent Upgrades">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {promotionLogs?.slice(0, 10).map((log) => (
                <div key={log.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{log.customerId}</p>
                    <p className="text-sm text-gray-500">{log.reason}</p>
                  </div>
                  <Badge>
                    {log.promotedFrom} → {log.promotedTo}
                  </Badge>
                </div>
              ))}
            </div>
        </Card>
      </div>
    </div>
  );
}
