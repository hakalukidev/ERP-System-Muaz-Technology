"use client";

import {
  CalculatorOutlined,
  DollarOutlined,
  GiftOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { Card, Col, Descriptions, Progress, Row, Select, Statistic, Tag } from 'antd';
import { useState } from 'react';
import { ShippingAllocationService } from '@/lib/services/ShippingAllocationService';
import type { OrderItem } from '@/types/order';

const demoItems: OrderItem[] = [
  {
    productId: '1',
    productName: 'Product A',
    sku: 'A',
    quantity: 1,
    unitPrice: 50,
    weight: 2,
    volume: 0.5,
    totalPrice: 50,
    dimensions: { length: 0, width: 0, height: 0 },
    allocatedShipping: 0,
    allocatedInsurance: 0,
    allocatedDuty: 0,
    allocatedHandling: 0,
    finalUnitPrice: 50,
    finalTotalPrice: 50,
  },
  {
    productId: '2',
    productName: 'Product B',
    sku: 'B',
    quantity: 1,
    unitPrice: 50,
    weight: 3,
    volume: 0.8,
    totalPrice: 50,
    dimensions: { length: 0, width: 0, height: 0 },
    allocatedShipping: 0,
    allocatedInsurance: 0,
    allocatedDuty: 0,
    allocatedHandling: 0,
    finalUnitPrice: 50,
    finalTotalPrice: 50,
  },
];

export function OrderCalculator() {
  const [orderItems] = useState<OrderItem[]>(demoItems);
  const [shippingMethod, setShippingMethod] = useState<'air' | 'sea' | 'land'>('air');
  const [destination, setDestination] = useState('international');
  const [customerType, setCustomerType] = useState<'regular' | 'premium' | 'vip'>('regular');

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalWeight = orderItems.reduce((sum, item) => sum + item.weight, 0);
  const shipping = ShippingAllocationService.calculateShippingRate(
    totalWeight,
    destination,
    shippingMethod
  );
  const insurance = subtotal * 0.02;
  const duty = subtotal * 0.05;
  const handling = subtotal * 0.01;
  const packaging = 5;
  const vat = subtotal * 0.1;
  const discount = ShippingAllocationService.calculateShippingDiscount({
    customerType,
    subtotal,
    shippingCost: shipping,
  } as any);
  const total = subtotal + shipping + insurance + duty + handling + packaging + vat - discount;
  const qualifiesForPremium = subtotal >= 100;

  return (
    <Card title="Order Calculator" extra={<CalculatorOutlined />}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Select
            className="w-full"
            value={shippingMethod}
            onChange={setShippingMethod}
            options={[
              { value: 'air', label: 'Air Freight' },
              { value: 'sea', label: 'Sea Freight' },
              { value: 'land', label: 'Land Transport' },
            ]}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            className="w-full"
            value={destination}
            onChange={setDestination}
            options={[
              { value: 'local', label: 'Local' },
              { value: 'international', label: 'International' },
              { value: 'premium', label: 'Premium Service' },
            ]}
          />
        </Col>
        <Col xs={24} md={8}>
          <Select
            className="w-full"
            value={customerType}
            onChange={setCustomerType}
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'premium', label: 'Premium' },
              { value: 'vip', label: 'VIP' },
            ]}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} md={8}>
          <Statistic title="Subtotal" prefix={<DollarOutlined />} value={subtotal} precision={2} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Shipping" prefix={<TruckOutlined />} value={shipping - discount} precision={2} />
        </Col>
        <Col xs={24} md={8}>
          <Statistic title="Total" prefix={<DollarOutlined />} value={total} precision={2} />
        </Col>
      </Row>

      <Descriptions bordered size="small" column={1} className="mt-6">
        <Descriptions.Item label="Shipping Discount">${discount.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Insurance">${insurance.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Duty Tax">${duty.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Handling">${handling.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Packaging">${packaging.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="VAT">${vat.toFixed(2)}</Descriptions.Item>
      </Descriptions>

      {qualifiesForPremium && (
        <div className="mt-6">
          <Tag color="gold" icon={<GiftOutlined />}>Premium benefits eligible</Tag>
          {customerType === 'premium' && <Progress percent={100} className="mt-3" />}
        </div>
      )}
    </Card>
  );
}
