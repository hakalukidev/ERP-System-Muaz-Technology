import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  companyName: string;
  customerType: 'regular' | 'premium' | 'vip';
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Timestamp;
  joinDate: Timestamp;
  creditLimit: number;
  balance: number;
  discountRate: number; // Premium customers get 10-20% discount
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  assignedAgent?: string; // Premium customer gets dedicated agent
  notes: string[];
  // Auto-calculated fields
  isPremium: boolean;
  premiumSince?: Timestamp;
  lifetimeValue: number;
  purchaseFrequency: number; // Days between purchases
}

export interface PremiumMetrics {
  customerId: string;
  totalSpentLast30Days: number;
  totalSpentLast90Days: number;
  totalSpentLastYear: number;
  orderCount: number;
  averageOrderValue: number;
  maxOrderValue: number;
  lastOrderDate: Timestamp;
  riskScore: number; // 0-100, for credit risk assessment
  priorityLevel: 'high' | 'medium' | 'low';
}

export interface AutoPromotionLog {
  id: string;
  customerId: string;
  promotedFrom: 'regular' | 'premium';
  promotedTo: 'premium' | 'vip';
  reason: string;
  metrics: {
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
  };
  promotedBy: 'system' | 'admin';
  promotedAt: Timestamp;
  notificationSent: boolean;
}
