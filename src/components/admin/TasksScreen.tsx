"use client";

import { ArrowsAltOutlined, PrinterOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Input, Select, Space, Table, Typography } from 'antd';
import { AdminShell } from './AdminShell';

const { Title, Text } = Typography;

export function TasksScreen() {
  return (
    <AdminShell active="Dashboard">
      <section className="tasks-page">
        <Button className="floating-expand" icon={<ArrowsAltOutlined />} />
        <Space size={18} className="task-counts">
          <Card className="task-count"><strong>0</strong><span>Pending</span></Card>
          <Card className="task-count"><strong>0</strong><span>Solved</span></Card>
        </Space>

        <div className="tasks-title-row">
          <Title level={2}>My Daily Task List</Title>
          <Button type="primary" danger icon={<PlusOutlined />}>Create Task</Button>
        </div>

        <Space wrap className="task-filters">
          <div><Text>Start Date</Text><Input defaultValue="2026-06-15" /></div>
          <div><Text>End Date</Text><Input defaultValue="2026-06-30" /></div>
          <div><Text>Choose Status</Text><Select defaultValue="Pending" options={[{ value: 'Pending' }, { value: 'Solved' }]} /></div>
          <div><Text>Choose User</Text><Select defaultValue="All" options={[{ value: 'All' }, { value: 'Rahat' }]} /></div>
          <Button type="primary" className="print-btn" icon={<PrinterOutlined />}>Print</Button>
        </Space>

        <Table
          size="small"
          pagination={false}
          dataSource={[]}
          locale={{ emptyText: 'No data available in table' }}
          columns={[
            { title: 'SL', dataIndex: 'sl' },
            { title: 'Date', dataIndex: 'date' },
            { title: 'Task Name', dataIndex: 'task' },
            { title: 'Note', dataIndex: 'note' },
            { title: 'Status', dataIndex: 'status' },
            { title: 'Created By', dataIndex: 'createdBy' },
            { title: 'Action', dataIndex: 'action' },
          ]}
        />

        <Text type="danger">Showing 0 to 0 of 0 entries</Text>
      </section>

      <footer className="admin-footer">© 2026 <strong>Danpite Tech</strong>, All Rights Reserved.</footer>
    </AdminShell>
  );
}
