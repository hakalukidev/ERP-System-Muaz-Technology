import { admin } from '../firebase-admin';

export class ShippingAllocationService {
  static async allocateShippingCosts(order: any): Promise<void> {
    const shippingCost = this.calculateShippingCost(order);
    
    await admin.firestore()
      .collection('orders')
      .doc(order.id)
      .update({
        shippingCost: shippingCost,
        shippingAllocatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    await admin.firestore()
      .collection('shipping_logs')
      .add({
        orderId: order.id,
        cost: shippingCost,
        method: 'auto_allocated',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
  }
  
  private static calculateShippingCost(order: any): number {
    let cost = 0;
    
    if (order.totalAmount && order.totalAmount < 100) {
      cost = 10;
    } else if (order.totalAmount && order.totalAmount < 500) {
      cost = 20;
    } else {
      cost = 0;
    }
    
    if (order.customerType === 'premium' || order.customerType === 'vip') {
      cost = 0;
    }
    
    return cost;
  }
}
