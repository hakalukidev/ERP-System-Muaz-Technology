"use client";

import {
  InboxOutlined,
  PrinterOutlined,
  SearchOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AdminShell } from './AdminShell';

const { Title, Text } = Typography;

type ProductStock = {
  key: string;
  sl: string;
  image: string;
  product: string;
  stock: string[];
};

const stockCards = [
  { label: "MEN'S JACKET", value: '257 pcs', sub: 'Total Stock: 261 pcs' },
  { label: 'PUNJABI', value: '120 pcs', sub: 'Total Stock: 120 pcs' },
  { label: 'TRACKSUIT', value: '0 pcs', sub: 'Total Stock: 0 pcs' },
  { label: 'TOTAL AVAILABLE STOCK', value: '377 pcs', sub: 'Total Stock: 381 pcs', highlight: true },
];

const products: ProductStock[] = [
  {
    key: '75',
    sl: 'ID: 75\nSKU: NBCP02',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=220&q=80',
    product: 'Noir Black Crown - Popcorn Elegance Punjabi',
    stock: [
      'Size: M        Total: 10        Sold: 0        Available: 10',
      'Size: L        Total: 10        Sold: 0        Available: 10',
      'Size: XL       Total: 10        Sold: 0        Available: 10',
      'Size: XXL      Total: 10        Sold: 0        Available: 10',
    ],
  },
];

const columns: ColumnsType<ProductStock> = [
  {
    title: 'PRODUCT SL',
    dataIndex: 'sl',
    width: 130,
    render: (value) => <strong className="pre-line">{value}</strong>,
  },
  {
    title: 'IMAGE',
    dataIndex: 'image',
    width: 130,
    render: (src) => <img className="stock-product-img" src={src} alt="Product" />,
  },
  {
    title: 'PRODUCT',
    dataIndex: 'product',
    render: (value) => <strong>{value}</strong>,
  },
  {
    title: 'STOCK',
    dataIndex: 'stock',
    width: 360,
    render: (rows: string[]) => (
      <Space direction="vertical" size={10}>
        {rows.map((row) => <strong key={row}>{row}</strong>)}
      </Space>
    ),
  },
];

export function StockOverviewScreen() {
  return (
    <AdminShell active="Store">
      <section className="page-head stock-head">
        <div>
          <Title level={3}>Products Stock Overview</Title>
          <Text>Category-wise stock summary and product stock report.</Text>
        </div>
        <Button type="primary" danger icon={<PrinterOutlined />} size="large">Print Report</Button>
      </section>

      <Row gutter={[16, 16]} className="stock-summary">
        {stockCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.label}>
            <Card className={`stock-card ${card.highlight ? 'highlight' : ''}`}>
              <span className="stock-card-icon">
                {card.highlight ? <InboxOutlined /> : <ShoppingOutlined />}
              </span>
              <div>
                <Text className="metric-label">{card.label}</Text>
                <strong>{card.value}</strong>
                <small>{card.sub}</small>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="report-card stock-report" title={<><strong>Stock Report</strong><br /><Text>Product-wise stock and status list</Text></>}>
        <div className="stock-toolbar">
          <Space>
            <Text>Show</Text>
            <Select defaultValue={50} options={[{ value: 50, label: '50' }, { value: 100, label: '100' }]} />
            <Text>entries</Text>
          </Space>
          <Input prefix={<SearchOutlined />} placeholder="Search stock..." />
        </div>

        <Table
          columns={columns}
          dataSource={products}
          pagination={false}
          scroll={{ x: 900 }}
          className="stock-table"
        />
      </Card>
    </AdminShell>
  );
}
