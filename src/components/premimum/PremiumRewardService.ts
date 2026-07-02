// lib/services/PremiumRewardService.ts
import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Customer } from '@/types/customer';

export class PremiumRewardService {
  
  // Calculate reward points for premium customers
  static async calculateRewards(customerId: string, orderAmount: number) {
    const customer = await this.getCustomer(customerId);
    
    let points = 0;
    
    // Base points: 1 point per 100 Taka
    points += Math.floor(orderAmount / 100);
    
    // Bonus for premium customers
    if (customer.customerType === 'premium') {
      points *= 1.5; // 50% bonus
    } else if (customer.customerType === 'vip') {
      points *= 2; // 100% bonus
    }
    
    // Additional bonus for frequent purchases
    const orderCount = await this.getOrderCount(customerId, 30); // Last 30 days
    if (orderCount >= 5) points *= 1.2;
    if (orderCount >= 10) points *= 1.5;
    
    // Store points
    await this.updateCustomerPoints(customerId, points);
    
    return points;
  }
  
  // Provide exclusive offers to premium customers
  static async getExclusiveOffers(customerId: string) {
    const customer = await this.getCustomer(customerId);
    const offers = [];
    
    // Birthday offer
    if (this.isBirthdayMonth(customer)) {
      offers.push({
        title: '🎂 Birthday Special',
        discount: 25,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    // Anniversary offer (premium anniversary)
    if (customer.premiumSince) {
      const months = this.getMonthsSince(customer.premiumSince.toDate());
      if (months >= 12) {
        offers.push({
          title: `🎉 ${Math.floor(months/12)} Year Premium Anniversary`,
          discount: 20,
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    // Tier-based offers
    if (customer.tier === 'platinum') {
      offers.push({
        title: '💎 Platinum Exclusive',
        discount: 30,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }
    
    return offers;
  }

  private static async getCustomer(customerId: string): Promise<Customer> {
    const snapshot = await getDoc(doc(db, 'customers', customerId));
    return { id: snapshot.id, ...snapshot.data() } as Customer;
  }

  private static async getOrderCount(_customerId: string, _days: number): Promise<number> {
    return 0;
  }

  private static async updateCustomerPoints(customerId: string, points: number) {
    await updateDoc(doc(db, 'customers', customerId), {
      rewardPoints: increment(points)
    });
  }

  private static isBirthdayMonth(_customer: Customer): boolean {
    return false;
  }

  private static getMonthsSince(date: Date): number {
    const now = new Date();
    return (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
  }
}
