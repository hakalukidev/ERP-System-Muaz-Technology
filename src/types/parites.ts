import { createElement } from 'react';
import { Badge, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Timestamp } from 'firebase/firestore';
import { useCollection } from '@/lib/hooks/useFirebase';

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  country: 'local' | 'foreign';
  products: string[];
  lcDetails: {
    number: string;
    amount: number;
    date: Timestamp;
    status: 'active' | 'completed' | 'cancelled';
  }[];
  shippingCost: number;
  dutyCost: number;
  paymentTerms: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
  };
  creditLimit: number;
  balance: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  companyName: string;
  creditLimit: number;
  balance: number;
  orders: string[];
  lastOrder: Timestamp;
  notes: string[];
}

export function SupplierList() {
  const { data: suppliers } = useCollection('suppliers');
  const columns: ColumnsType<Supplier> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Company', dataIndex: 'companyName' },
    { title: 'Phone', dataIndex: 'phone' },
    {
      title: 'Balance',
      render: (_, row) => `$${row.balance.toFixed(2)}`,
    },
    {
      title: 'Credit Limit',
      render: (_, row) => `$${row.creditLimit}`,
    },
    {
      title: 'LC Status',
      render: (_, row) => {
        const activeLC = row.lcDetails?.find((lc) => lc.status === 'active');
        return createElement(Badge, activeLC
          ? { status: 'success', text: `Active LC: ${activeLC.number}` }
          : { status: 'default', text: 'No Active LC' }
        );
      },
    },
  ];

  return createElement(Table<Supplier>, {
    rowKey: 'id',
    columns,
    dataSource: suppliers || [],
  });
}
