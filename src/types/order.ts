// types/order.ts
import { Timestamp } from 'firebase/firestore';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerType: 'regular' | 'premium' | 'vip';
  
  // Order Items
  items: OrderItem[];
  
  // Pricing Breakdown
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  
  // Shipping
  shippingCost: number;
  shippingMethod: 'air' | 'sea' | 'land';
  shippingProvider: string;
  trackingNumber: string;
  
  // Additional Costs
  insuranceCost: number;
  handlingCost: number;
  packagingCost: number;
  dutyTaxCost: number;
  vat: number;
  
  // Allocated Costs (per item)
  allocatedShipping: number;
  allocatedInsurance: number;
  allocatedDuty: number;
  
  // Totals
  total: number;
  totalInBDT: number;
  
  // Payment
  paymentMethod: 'cash' | 'credit' | 'bank' | 'lc';
  currency: 'USD' | 'BDT';
  exchangeRate: number;
  
  // Status
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Weight-based shipping allocation
  weight: number;
  volume: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  
  // Allocated costs for this item
  allocatedShipping: number;
  allocatedInsurance: number;
  allocatedDuty: number;
  allocatedHandling: number;
  
  // Final price per item after allocation
  finalUnitPrice: number;
  finalTotalPrice: number;
}

export interface ShippingCostBreakdown {
  totalShipping: number;
  perItemBreakdown: {
    itemId: string;
    cost: number;
    percentage: number;
    method: 'weight' | 'volume' | 'value' | 'quantity';
  }[];
  insurance: number;
  duty: number;
  handling: number;
  packaging: number;
  vat: number;
  grandTotal: number;
}
