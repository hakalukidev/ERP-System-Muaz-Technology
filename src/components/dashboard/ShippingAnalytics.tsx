// components/dashboard/ShippingAnalytics.tsx
import { Card, Col, Row, Statistic } from 'antd';
import { useCollection } from '@/lib/hooks/useFirebase';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ShippingAnalytics() {
  const { data: orders } = useCollection('orders');
  
  // Calculate shipping metrics
  const totalOrders = orders?.length || 0;
  const totalShippingCost = orders?.reduce((sum, o) => sum + o.shippingCost, 0) || 0;
  const avgShipping = totalOrders > 0 ? totalShippingCost / totalOrders : 0;
  
  // Group by shipping method
  const byMethod = orders?.reduce((acc, o) => {
    const method = o.shippingMethod || 'unknown';
    if (!acc[method]) acc[method] = { count: 0, cost: 0 };
    acc[method].count++;
    acc[method].cost += o.shippingCost;
    return acc;
  }, {} as Record<string, { count: number; cost: number }>) || {};
  
  const chartData = (Object.entries(byMethod) as [string, { count: number; cost: number }][])
    .map(([method, data]) => ({
    method: method.toUpperCase(),
    count: data.count,
    cost: data.cost,
    avgCost: data.cost / data.count
  }));
  
  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card><Statistic title={`Total Shipping Cost (${totalOrders} orders)`} prefix="$" value={totalShippingCost} precision={2} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title="Average Shipping" prefix="$" value={avgShipping} precision={2} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title="Most Used Method" value={chartData.sort((a, b) => b.count - a.count)[0]?.method || 'N/A'} /></Card>
        </Col>
      </Row>
      
      <Card title="Shipping Cost by Method">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="method" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cost" fill="#3b82f6" name="Total Cost" />
            <Bar dataKey="count" fill="#10b981" name="Order Count" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
