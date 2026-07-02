import { Timestamp } from "firebase/firestore";

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'sale' | 'purchase' | 'salary' | 'utility' | 'transport' | 'duty' | 'lc';
  amount: number;
  currency: string;
  date: Timestamp;
  description: string;
  party: string; // Customer or Supplier ID
  reference: string; // Invoice or LC number
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  dueDate: Timestamp;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paymentMethod: 'cash' | 'credit' | 'bank';
}