"use client";

import {
  CrownOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useCollection } from '@/lib/hooks/useFirebase';
import type { Customer } from '@/types/customer';

export function PremiumCustomerList() {
  const { data: customers, loading } = useCollection<Customer>('customers', [
    { field: 'customerType', operator: 'in', value: ['premium', 'vip'] },
  ]);

  const [type, setType] = useState('all');
  const [tier, setTier] = useState('all');
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter((customer) => {
    const matchesType = type === 'all' || customer.customerType === type;
    const matchesTier = tier === 'all' || customer.tier === tier;
    const matchesSearch = [customer.name, customer.phone, customer.email]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.toLowerCase()));

    return matchesType && matchesTier && matchesSearch;
  });

  const columns: ColumnsType<Customer> = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name) => (
        <Space>
          <UserOutlined />
          {name || 'N/A'}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      render: (value) => (
        <Tag color={value === 'vip' ? 'gold' : 'blue'} icon={<CrownOutlined />}>
          {String(value).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      render: (value) => <Tag>{value || 'N/A'}</Tag>,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      render: (value = 0) => `$${Number(value).toLocaleString()}`,
      sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
    },
    {
      title: 'Avg Order',
      dataIndex: 'averageOrderValue',
      render: (value = 0) => `$${Number(value).toFixed(0)}`,
    },
    {
      title: 'Discount',
      dataIndex: 'discountRate',
      render: (value = 0) => `${value}%`,
    },
    {
      title: 'Agent',
      dataIndex: 'assignedAgent',
      render: (value) => value || 'N/A',
    },
    {
      title: 'Premium Since',
      dataIndex: 'premiumSince',
      render: (value) => value?.toDate?.().toLocaleDateString() || 'N/A',
    },
  ];

  return (
    <div className="space-y-4">
      <Space wrap>
        <Select
          value={type}
          onChange={setType}
          style={{ width: 140 }}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'premium', label: 'Premium' },
            { value: 'vip', label: 'VIP' },
          ]}
        />
        <Select
          value={tier}
          onChange={setTier}
          style={{ width: 150 }}
          options={[
            { value: 'all', label: 'All Tiers' },
            { value: 'gold', label: 'Gold' },
            { value: 'platinum', label: 'Platinum' },
          ]}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search customer"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 220 }}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredCustomers}
        scroll={{ x: true }}
      />
    </div>
  );
}
