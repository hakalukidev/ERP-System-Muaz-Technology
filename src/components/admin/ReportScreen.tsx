"use client";

import { PrinterOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AdminShell } from './AdminShell';

const { Title, Text } = Typography;

type RowData = {
  key: string;
  name: string;
  total: number;
  pending: number;
  ready: number;
  hold: number;
  packaging: number;
  shipped: number;
  cancelled: number;
  completed: number;
  failed: number;
};

const users = ['Rahat', 'Ritu', 'shuvo'];
const data: RowData[] = users.map((name) => ({
  key: name,
  name,
  total: 0,
  pending: 0,
  ready: 0,
  hold: 0,
  packaging: 0,
  shipped: 0,
  cancelled: 0,
  completed: 0,
  failed: 0,
}));

const columns: ColumnsType<RowData> = [
  { title: 'USER NAME', dataIndex: 'name', fixed: 'left', width: 130 },
  { title: 'TOTAL ORDER', dataIndex: 'total', render: (v) => badge(v) },
  { title: 'PENDING', dataIndex: 'pending', render: (v) => badge(v) },
  { title: 'READY TO SHIP', dataIndex: 'ready', render: (v) => badge(v) },
  { title: 'HOLD', dataIndex: 'hold', render: (v) => badge(v) },
  { title: 'PACKAGING', dataIndex: 'packaging', render: (v) => badge(v) },
  { title: 'SHIPPED', dataIndex: 'shipped', render: (v) => badge(v, 'green') },
  { title: 'CANCELLED', dataIndex: 'cancelled', render: (v) => badge(v, 'red') },
  { title: 'COMPLETED', dataIndex: 'completed', render: (v) => badge(v, 'green') },
  { title: 'DEL. FAIL', dataIndex: 'failed', render: (v) => badge(v, 'red') },
];

function badge(value: number, color: 'red' | 'green' | 'gold' = 'gold') {
  return <Tag className="status-pill" color={color}>{value}</Tag>;
}

export function ReportScreen() {
  return (
    <AdminShell active="Reports">
      <section className="page-head">
        <div>
          <Title level={3}>User Report</Title>
          <Text>View user-wise order summary, status count, success percentage and failed percentage.</Text>
          <div className="breadcrumb">Dashboard / User Report</div>
        </div>
        <Button type="primary" icon={<PrinterOutlined />} size="large">Print Report</Button>
      </section>

      <Card className="report-card" title="REPORT FILTERS">
        <Space wrap size={14} className="filter-row">
          <div>
            <Text strong>Start Date</Text>
            <DatePicker placeholder="2026-06-30" />
          </div>
          <div>
            <Text strong>End Date</Text>
            <DatePicker placeholder="2026-06-30" />
          </div>
          <div>
            <Text strong>Select User</Text>
            <Select
              placeholder="Select a User"
              style={{ width: 300 }}
              options={users.map((name) => ({ value: name, label: name }))}
            />
          </div>
          <Button className="reset-btn">Reset</Button>
        </Space>
      </Card>

      <Card className="report-card" title="USER SUMMARY">
        <Table
          size="small"
          columns={columns}
          dataSource={[...data, { ...data[0], key: 'total', name: 'Total' }]}
          pagination={false}
          scroll={{ x: 980 }}
          rowClassName={(record) => record.key === 'total' ? 'summary-row' : ''}
        />
      </Card>
    </AdminShell>
  );
}
