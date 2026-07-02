"use client";

import {
  DollarCircleOutlined,
  RiseOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Select, Statistic } from 'antd';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCollection } from '@/lib/hooks/useFirebase';
import type { Customer } from '@/types/customer';
import type { Order } from '@/types/order';

export function PremiumAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const { data: customers } = useCollection<Customer>('customers');
  const { data: orders } = useCollection<Order>('orders');

  const premiumCustomers = customers.filter((customer) => customer.customerType !== 'regular');
  const regularCustomers = customers.filter((customer) => customer.customerType === 'regular');
  const premiumIds = new Set(premiumCustomers.map((customer) => customer.id));
  const regularIds = new Set(regularCustomers.map((customer) => customer.id));

  const premiumRevenue = orders
    .filter((order) => premiumIds.has(order.customerId))
    .reduce((sum, order) => sum + (order.total || 0), 0);

  const regularRevenue = orders
    .filter((order) => regularIds.has(order.customerId))
    .reduce((sum, order) => sum + (order.total || 0), 0);

  const premiumAvgOrder = premiumCustomers.length ? premiumRevenue / premiumCustomers.length : 0;
  const regularAvgOrder = regularCustomers.length ? regularRevenue / regularCustomers.length : 0;
  const totalRevenue = premiumRevenue + regularRevenue;

  const retentionRate = premiumCustomers.filter((customer) => {
    const lastOrder = customer.lastOrderDate?.toDate?.();
    if (!lastOrder) return false;
    const days = (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 90;
  }).length / (premiumCustomers.length || 1) * 100;

  const chartData = useMemo(() => {
    return premiumCustomers.slice(0, 8).map((customer, index) => ({
      name: customer.name || `Customer ${index + 1}`,
      spent: customer.totalSpent || 0,
    }));
  }, [premiumCustomers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 140 }}
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Premium Revenue" prefix={<DollarCircleOutlined />} value={premiumRevenue} precision={0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Avg Premium Order" prefix={<TrophyOutlined />} value={premiumAvgOrder} precision={0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Retention Rate" prefix={<TeamOutlined />} value={retentionRate} precision={1} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic
              title="Premium Revenue Share"
              prefix={<RiseOutlined />}
              value={totalRevenue ? (premiumRevenue / totalRevenue) * 100 : 0}
              precision={1}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Card title={`Premium Customer Spending (${timeRange})`} extra={`Regular avg: $${regularAvgOrder.toFixed(0)}`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="spent" stroke="#1677ff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
