// lib/services/PremiumCustomerService.ts
import { db } from '@/lib/firebase/config';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    where,
    writeBatch
} from 'firebase/firestore';
import type { Customer, PremiumMetrics } from '@/types/customer';

export class PremiumCustomerService {
  
  // Main function to check and upgrade customers
  static async checkAndUpgradeCustomers() {
    console.log('🔄 Running premium customer check...');
    
    try {
      // 1. Get all regular customers with high spending
      const highSpendingCustomers = await this.getHighSpendingCustomers();
      
      // 2. Check each customer against premium criteria
      const upgradeCandidates = await this.analyzeCustomers(highSpendingCustomers);
      
      // 3. Upgrade eligible customers
      const upgraded = await this.upgradeCustomers(upgradeCandidates);
      
      // 4. Send notifications
      await this.sendPremiumNotifications(upgraded);
      
      // 5. Generate reports
      await this.generatePremiumReport(upgraded);
      
      return {
        totalAnalyzed: highSpendingCustomers.length,
        upgraded: upgraded.length,
        details: upgraded
      };
      
    } catch (error) {
      console.error('❌ Error in premium check:', error);
      throw error;
    }
  }
  
  // Get customers who spent > 2 Lakh
  private static async getHighSpendingCustomers() {
    const customersRef = collection(db, 'customers');
    
    // Query: Customers with totalSpent >= 200000
    const q = query(
      customersRef,
      where('totalSpent', '>=', 200000),
      where('customerType', 'in', ['regular', 'premium']),
      limit(500) // Process in batches for performance
    );
    
    const snapshot = await getDocs(q);
    const customers: Customer[] = [];
    
    snapshot.forEach(doc => {
      customers.push({
        id: doc.id,
        ...doc.data()
      } as Customer);
    });
    
    return customers;
  }
  
  // Analyze each customer for premium eligibility
  private static async analyzeCustomers(customers: Customer[]) {
    const candidates: {
      customer: Customer;
      metrics: PremiumMetrics;
      upgradeTo: 'premium' | 'vip';
      reason: string;
    }[] = [];
    
    for (const customer of customers) {
      // Get detailed metrics
      const metrics = await this.getCustomerMetrics(customer.id);
      
      // Calculate scores
      const score = this.calculatePremiumScore(customer, metrics);
      
      // Determine if qualifies for premium
      if (score >= 80 && customer.customerType === 'regular') {
        candidates.push({
          customer,
          metrics,
          upgradeTo: 'premium',
          reason: `Total spent ${customer.totalSpent} Tk, Average order ${metrics.averageOrderValue} Tk`
        });
      }
      
      // Check for VIP (3 Lakh+)
      if (customer.totalSpent >= 300000 && customer.customerType === 'premium') {
        candidates.push({
          customer,
          metrics,
          upgradeTo: 'vip',
          reason: `Exceptional spending: ${customer.totalSpent} Tk`
        });
      }
    }
    
    return candidates;
  }
  
  // Calculate premium score based on multiple factors
  private static calculatePremiumScore(customer: Customer, metrics: PremiumMetrics): number {
    let score = 0;
    
    // 1. Total spending (max 40 points)
    if (customer.totalSpent >= 200000) score += 30;
    if (customer.totalSpent >= 250000) score += 35;
    if (customer.totalSpent >= 300000) score += 40;
    
    // 2. Average order value (max 25 points)
    if (metrics.averageOrderValue >= 50000) score += 15;
    if (metrics.averageOrderValue >= 75000) score += 20;
    if (metrics.averageOrderValue >= 100000) score += 25;
    
    // 3. Order frequency (max 20 points)
    const daysSinceLastOrder = Math.floor(
      (Date.now() - metrics.lastOrderDate.toMillis()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastOrder <= 30) score += 15;
    if (daysSinceLastOrder <= 15) score += 20;
    
    // 4. Recent activity (max 15 points)
    if (metrics.totalSpentLast30Days > 50000) score += 10;
    if (metrics.totalSpentLast30Days > 100000) score += 15;
    
    return Math.min(score, 100); // Cap at 100
  }
  
  // Get detailed metrics for a customer
  private static async getCustomerMetrics(customerId: string): Promise<PremiumMetrics> {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('customerId', '==', customerId)
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data());
    
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);
    
    let totalSpentLast30Days = 0;
    let totalSpentLast90Days = 0;
    let totalSpentLastYear = 0;
    let maxOrderValue = 0;
    let totalOrders = orders.length;
    
    orders.forEach(order => {
      const orderDate = order.orderDate.toDate();
      const amount = order.total || 0;
      
      if (orderDate >= thirtyDaysAgo) totalSpentLast30Days += amount;
      if (orderDate >= ninetyDaysAgo) totalSpentLast90Days += amount;
      if (orderDate >= oneYearAgo) totalSpentLastYear += amount;
      
      if (amount > maxOrderValue) maxOrderValue = amount;
    });
    
    const averageOrderValue = totalOrders > 0 ? totalSpentLastYear / totalOrders : 0;
    
    // Calculate risk score based on payment history
    const riskScore = await this.calculateRiskScore(customerId);
    
    // Determine priority level
    let priorityLevel: 'high' | 'medium' | 'low' = 'medium';
    if (totalSpentLast30Days > 100000 && averageOrderValue > 75000) {
      priorityLevel = 'high';
    } else if (totalSpentLast30Days < 20000) {
      priorityLevel = 'low';
    }
    
    return {
      customerId,
      totalSpentLast30Days,
      totalSpentLast90Days,
      totalSpentLastYear,
      orderCount: totalOrders,
      averageOrderValue,
      maxOrderValue,
      lastOrderDate: orders.length > 0 ? orders[0].orderDate : serverTimestamp(),
      riskScore,
      priorityLevel
    };
  }
  
  // Calculate credit risk score
  private static async calculateRiskScore(customerId: string): Promise<number> {
    // Check for overdue payments
    const invoicesRef = collection(db, 'invoices');
    const q = query(
      invoicesRef,
      where('customerId', '==', customerId),
      where('status', '==', 'overdue')
    );
    
    const snapshot = await getDocs(q);
    const overdueCount = snapshot.size;
    
    // Check credit utilization
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    const customer = customerDoc.data() as Customer;
    const creditUtilization = customer.creditLimit > 0 
      ? (customer.balance / customer.creditLimit) * 100 
      : 0;
    
    // Calculate risk score (higher = higher risk)
    let riskScore = 0;
    riskScore += overdueCount * 15;
    riskScore += creditUtilization > 80 ? 20 : 0;
    riskScore += creditUtilization > 50 ? 10 : 0;
    
    return Math.min(riskScore, 100);
  }
  
  // Upgrade customers in batch
  private static async upgradeCustomers(candidates: any[]) {
    const upgraded: any[] = [];
    const batch = writeBatch(db);
    
    for (const candidate of candidates) {
      const customerRef = doc(db, 'customers', candidate.customer.id);
      
      // Update customer document
      batch.update(customerRef, {
        customerType: candidate.upgradeTo,
        isPremium: true,
        premiumSince: serverTimestamp(),
        tier: candidate.upgradeTo === 'vip' ? 'platinum' : 'gold',
        discountRate: candidate.upgradeTo === 'vip' ? 20 : 15,
        assignedAgent: await this.assignDedicatedAgent(candidate.customer.id),
        updatedAt: serverTimestamp()
      });
      
      // Log promotion
      const logRef = doc(collection(db, 'promotionLogs'));
      batch.set(logRef, {
        customerId: candidate.customer.id,
        promotedFrom: candidate.customer.customerType,
        promotedTo: candidate.upgradeTo,
        reason: candidate.reason,
        metrics: {
          totalSpent: candidate.customer.totalSpent,
          orderCount: candidate.metrics.orderCount,
          averageOrderValue: candidate.metrics.averageOrderValue
        },
        promotedBy: 'system',
        promotedAt: serverTimestamp(),
        notificationSent: false
      });
      
      upgraded.push({
        customerId: candidate.customer.id,
        name: candidate.customer.name,
        oldType: candidate.customer.customerType,
        newType: candidate.upgradeTo,
        reason: candidate.reason
      });
    }
    
    await batch.commit();
    return upgraded;
  }
  
  // Assign dedicated agent to premium customers
  private static async assignDedicatedAgent(customerId: string): Promise<string> {
    // Get available agents with least workload
    const agentsRef = collection(db, 'users');
    const q = query(
      agentsRef,
      where('role', '==', 'agent'),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    let bestAgent = '';
    let minCustomers = Infinity;
    
    // Count how many premium customers each agent has
    for (const doc of snapshot.docs) {
      const agentData = doc.data();
      const assignedCustomers = agentData.assignedCustomers || [];
      if (assignedCustomers.length < minCustomers) {
        minCustomers = assignedCustomers.length;
        bestAgent = doc.id;
      }
    }
    
    return bestAgent;
  }
  
  // Send notifications to upgraded customers
  private static async sendPremiumNotifications(upgraded: any[]) {
    for (const customer of upgraded) {
      // Send SMS
      await this.sendSMS(
        customer.phone,
        `🎉 Congratulations! You've been upgraded to ${customer.newType} status! 
         Enjoy ${customer.newType === 'vip' ? '20%' : '15%'} discount on all products.`
      );
      
      // Send Email
      await this.sendEmail(
        customer.email,
        'Premium Status Upgrade',
        `Dear ${customer.name},\n\nWe're pleased to inform you that you've been upgraded to ${customer.newType} customer status...`
      );
      
      // In-app notification
      await this.sendInAppNotification(
        customer.customerId,
        `🎉 Congrats! You're now a ${customer.newType} customer!`
      );
    }
  }
  
  // Helper: Send SMS (using Twilio or any SMS service)
  private static async sendSMS(phone: string, message: string) {
    // Implement SMS sending logic
    console.log(`📱 Sending SMS to ${phone}: ${message}`);
  }
  
  // Helper: Send Email (using SendGrid or Nodemailer)
  private static async sendEmail(email: string, subject: string, body: string) {
    console.log(`📧 Sending email to ${email}: ${subject}`);
  }
  
  // Helper: Send In-App Notification
  private static async sendInAppNotification(userId: string, message: string) {
    const notificationRef = collection(db, 'notifications');
    await addDoc(notificationRef, {
      userId,
      message,
      type: 'premium_upgrade',
      read: false,
      createdAt: serverTimestamp()
    });
  }

  private static async generatePremiumReport(upgraded: any[]) {
    await addDoc(collection(db, 'reports'), {
      type: 'premium-upgrade',
      count: upgraded.length,
      items: upgraded,
      createdAt: serverTimestamp()
    });
  }
}
