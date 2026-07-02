"use client";

import {
  BarChartOutlined,
  DollarCircleOutlined,
  FundOutlined,
  GiftOutlined,
  RocketOutlined,
  ShopOutlined,
  TruckOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Row, Space, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminShell } from './AdminShell';

const { Title, Text } = Typography;

const infoCards = [
  { label: 'Account Balance', value: '500000', icon: <WalletOutlined />, danger: true },
  { label: 'Total Payment', value: '500000 TK', icon: <DollarCircleOutlined /> },
  { label: 'Total Cost', value: '0 TK', icon: <FundOutlined /> },
  { label: 'Wholesale Payment', value: '500000 TK', icon: <ShopOutlined /> },
  { label: 'Courier Payment', value: '0 TK', icon: <TruckOutlined /> },
  { label: 'Office Sale Payment', value: '0 TK', icon: <BarChartOutlined /> },
  { label: 'Office Cost', value: '0 TK', icon: <GiftOutlined /> },
  { label: 'Boost Cost', value: '0 TK', icon: <RocketOutlined /> },
];

const paymentData = [
  { name: 'Courier', payment: 500000, cost: 0 },
  { name: 'Office Sale', payment: 0, cost: 0 },
  { name: 'Wholesale', payment: 500000, cost: 0 },
];

const orderStatus = [
  { name: 'Pending', value: 0 },
  { name: 'Hold', value: 0 },
  { name: 'Cancelled', value: 0 },
  { name: 'Ready', value: 0 },
  { name: 'Packaging', value: 0 },
  { name: 'Shipped', value: 0 },
];

const pieData = [
  { name: 'Courier', value: 30, color: '#1f78ff' },
  { name: 'Office Sale', value: 20, color: '#24a064' },
  { name: 'Wholesale', value: 50, color: '#e51f35' },
];

const courierCards = ['Courier Pending', 'Completed', 'Partial Delivery', 'Del. Failed', 'Unknown'];

export function DashboardScreen() {
  return (
    <AdminShell active="Dashboard">
      <section className="panel hero-panel">
        <Title level={4}>Danpite Tech</Title>
        <div className="hero-row">
          <Title level={4}>INFORMATION</Title>
          <Space wrap>
            <Button type="primary" className="print-btn">Print</Button>
            <Text>From:</Text>
            <DatePicker defaultValue={undefined} placeholder="2026-06-30" />
            <Text>To:</Text>
            <DatePicker defaultValue={undefined} placeholder="2026-06-30" />
          </Space>
        </div>
      </section>

      <section className="panel">
        <Row gutter={[18, 18]}>
          {infoCards.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.label}>
              <Card className="metric-tile">
                <span className="metric-bg" />
                <div className="metric-icon">{item.icon}</div>
                <div>
                  <Text className="metric-label">{item.label}</Text>
                  <strong className={item.danger ? 'danger-text' : ''}>{item.value}</strong>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <Row gutter={[18, 18]}>
        <Col xs={24} lg={12}>
          <Card className="chart-card" title="Payment vs Cost">
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={paymentData}>
                <CartesianGrid stroke="#222" strokeOpacity={0.55} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="payment" fill="#21875a" />
                <Bar dataKey="cost" fill="#e51f35" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="chart-card" title="Payment Breakdown">
            <ResponsiveContainer width="100%" height={245}>
              <PieChart>
                <Legend />
                <Tooltip />
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={88}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]} className="mt-18">
        <Col xs={24} lg={12}>
          <Card className="chart-card" title="Order Status Chart">
            <ResponsiveContainer width="100%" height={245}>
              <BarChart data={orderStatus}>
                <CartesianGrid stroke="#222" strokeOpacity={0.55} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="value" fill="#1f78ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="chart-card" title="Courier Status Chart">
            <ResponsiveContainer width="100%" height={245}>
              <PieChart>
                <Legend />
                <Pie data={[{ name: 'Unknown', value: 1 }]} dataKey="value" nameKey="name" outerRadius={70} fill="#ff9d00" />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <section className="panel mt-18">
        <Row gutter={[18, 18]}>
          {courierCards.map((label) => (
            <Col xs={24} sm={12} lg={6} key={label}>
              <Card className="metric-tile courier-tile">
                <span className="metric-bg" />
                <Text className="metric-label">{label}</Text>
                <strong>0</strong>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </AdminShell>
  );
}
