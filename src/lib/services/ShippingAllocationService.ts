// lib/services/ShippingAllocationService.ts
import { db } from '@/lib/firebase/config';
import {
    doc,
    increment,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';
import type { Order, OrderItem, ShippingCostBreakdown } from '@/types/order';

export class ShippingAllocationService {
  
  // Main allocation function
  static async allocateShippingCosts(order: Order): Promise<ShippingCostBreakdown> {
    console.log('📦 Calculating shipping allocation for order:', order.id);
    
    // 1. Calculate total weight & volume
    const totalWeight = order.items.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalVolume = order.items.reduce((sum, item) => sum + (item.volume || 0), 0);
    const totalValue = order.subtotal;
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // 2. Determine allocation method based on item characteristics
    const allocationMethod = this.determineAllocationMethod(order.items);
    
    // 3. Allocate shipping cost
    const allocatedShipping = this.allocateCostByMethod(
      order.shippingCost,
      order.items,
      allocationMethod,
      { totalWeight, totalVolume, totalValue, totalQuantity }
    );
    
    // 4. Allocate other costs
    const allocatedInsurance = this.allocateCostByValue(order.insuranceCost, order.items, totalValue);
    const allocatedDuty = this.allocateCostByValue(order.dutyTaxCost, order.items, totalValue);
    const allocatedHandling = this.allocateCostByQuantity(order.handlingCost, order.items, totalQuantity);
    const allocatedPackaging = this.allocateCostByQuantity(order.packagingCost, order.items, totalQuantity);
    const allocatedVAT = this.allocateCostByValue(order.vat, order.items, totalValue);
    
    // 5. Calculate final prices
    const itemsWithAllocation = order.items.map((item, index) => {
      const shipping = allocatedShipping[index] || 0;
      const insurance = allocatedInsurance[index] || 0;
      const duty = allocatedDuty[index] || 0;
      const handling = allocatedHandling[index] || 0;
      const vat = allocatedVAT[index] || 0;
      const packaging = allocatedPackaging[index] || 0;
      
      const totalAllocatedCost = shipping + insurance + duty + handling + vat + packaging;
      const finalPrice = item.unitPrice + (totalAllocatedCost / item.quantity);
      
      return {
        ...item,
        allocatedShipping: shipping,
        allocatedInsurance: insurance,
        allocatedDuty: duty,
        allocatedHandling: handling,
        allocatedVAT: vat,
        allocatedPackaging: packaging,
        finalUnitPrice: finalPrice,
        finalTotalPrice: finalPrice * item.quantity
      };
    });
    
    // 6. Create breakdown report
    const breakdown: ShippingCostBreakdown = {
      totalShipping: order.shippingCost,
      perItemBreakdown: itemsWithAllocation.map((item, index) => ({
        itemId: item.productId,
        cost: allocatedShipping[index] || 0,
        percentage: ((allocatedShipping[index] || 0) / order.shippingCost) * 100,
        method: allocationMethod
      })),
      insurance: order.insuranceCost,
      duty: order.dutyTaxCost,
      handling: order.handlingCost,
      packaging: order.packagingCost,
      vat: order.vat,
      grandTotal: order.total
    };
    
    // 7. Update order with allocated costs
    await this.updateOrderWithAllocation(order.id, itemsWithAllocation, breakdown);
    
    return breakdown;
  }
  
  // Determine the best allocation method
  private static determineAllocationMethod(items: OrderItem[]): 'weight' | 'volume' | 'value' | 'quantity' {
    // Check if weight is available for most items
    const hasWeight = items.filter(item => item.weight > 0).length / items.length > 0.8;
    if (hasWeight) return 'weight';
    
    // Check if volume is available
    const hasVolume = items.filter(item => item.volume > 0).length / items.length > 0.8;
    if (hasVolume) return 'volume';
    
    // If all items have similar prices, use quantity
    const prices = items.map(item => item.unitPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const priceDeviation = prices.reduce((a, b) => a + Math.abs(b - avgPrice), 0) / prices.length;
    
    if (priceDeviation / avgPrice < 0.3) return 'quantity';
    
    // Default to value-based allocation
    return 'value';
  }
  
  // Allocate cost by different methods
  private static allocateCostByMethod(
    totalCost: number,
    items: OrderItem[],
    method: 'weight' | 'volume' | 'value' | 'quantity',
    totals: { totalWeight: number; totalVolume: number; totalValue: number; totalQuantity: number }
  ): number[] {
    let allocations: number[] = [];
    
    switch (method) {
      case 'weight':
        allocations = items.map(item => 
          (totalCost * (item.weight || 0)) / (totals.totalWeight || 1)
        );
        break;
        
      case 'volume':
        allocations = items.map(item => 
          (totalCost * (item.volume || 0)) / (totals.totalVolume || 1)
        );
        break;
        
      case 'value':
        allocations = items.map(item => 
          (totalCost * (item.totalPrice || 0)) / (totals.totalValue || 1)
        );
        break;
        
      case 'quantity':
        allocations = items.map(item => 
          (totalCost * item.quantity) / (totals.totalQuantity || 1)
        );
        break;
    }
    
    return allocations;
  }
  
  // Allocate cost by value (for insurance, duty, VAT)
  private static allocateCostByValue(
    totalCost: number,
    items: OrderItem[],
    totalValue: number
  ): number[] {
    if (totalCost === 0 || totalValue === 0) {
      return items.map(() => 0);
    }
    
    return items.map(item => 
      (totalCost * item.totalPrice) / totalValue
    );
  }
  
  // Allocate cost by quantity (for handling, packaging)
  private static allocateCostByQuantity(
    totalCost: number,
    items: OrderItem[],
    totalQuantity: number
  ): number[] {
    if (totalCost === 0 || totalQuantity === 0) {
      return items.map(() => 0);
    }
    
    return items.map(item => 
      (totalCost * item.quantity) / totalQuantity
    );
  }
  
  // Update order with allocated costs
  private static async updateOrderWithAllocation(
    orderId: string,
    itemsWithAllocation: OrderItem[],
    breakdown: ShippingCostBreakdown
  ) {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      transaction.update(orderRef, {
        items: itemsWithAllocation,
        allocatedShipping: breakdown.totalShipping,
        allocatedInsurance: breakdown.insurance,
        allocatedDuty: breakdown.duty,
        allocatedHandling: breakdown.handling,
        allocatedPackaging: breakdown.packaging,
        allocatedVAT: breakdown.vat,
        costBreakdown: breakdown,
        updatedAt: serverTimestamp()
      });
      
      // Update customer's total spent (only for paid orders)
      const order = orderDoc.data() as Order;
      if (order.status === 'confirmed' || order.status === 'delivered') {
        const customerRef = doc(db, 'customers', order.customerId);
        transaction.update(customerRef, {
          totalSpent: increment(order.total),
          orderCount: increment(1),
          averageOrderValue: 0 // Will be recalculated by cloud function
        });
      }
    });
  }
  
  // Premium customer shipping discount (Free shipping for VIP)
  static calculateShippingDiscount(order: Order): number {
    const customer = order.customerType;
    let discount = 0;
    
    // VIP customers get free shipping
    if (customer === 'vip') {
      discount = order.shippingCost;
    }
    // Premium customers get 50% shipping discount
    else if (customer === 'premium') {
      discount = order.shippingCost * 0.5;
    }
    // 100+ orders get free shipping regardless
    else if (order.subtotal >= 100) {
      discount = order.shippingCost;
    }
    
    return discount;
  }
  
  // Calculate per-kg shipping rate based on destination
  static calculateShippingRate(
    weight: number,
    destination: string,
    shippingMethod: 'air' | 'sea' | 'land'
  ): number {
    // Base rates per kg
    const rates = {
      air: {
        local: 2.5,
        international: 5.0,
        premium: 8.0
      },
      sea: {
        local: 1.0,
        international: 2.0,
        premium: 3.0
      },
      land: {
        local: 0.8,
        international: 1.5,
        premium: 2.5
      }
    };
    
    // Determine destination tier
    let tier = 'local';
    if (destination === 'international') tier = 'international';
    if (destination === 'premium') tier = 'premium';
    
    return weight * rates[shippingMethod][tier];
  }
}
