import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { ShippingAllocationService } from './lib/services/ShippingAllocationService';
import type { Order } from './types/order';

admin.initializeApp();

// Auto-allocate shipping when order is confirmed
export const autoAllocateShipping = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only process when order status changes to 'confirmed'
    if (before.status !== 'confirmed' && after.status === 'confirmed') {
      console.log(`📦 Auto-allocating shipping for order: ${context.params.orderId}`);
      
      try {
        await ShippingAllocationService.allocateShippingCosts({
          id: context.params.orderId,
          ...after,
        } as Order);
        console.log(`✅ Shipping allocation completed for order: ${context.params.orderId}`);
      } catch (error: any) {
        console.error(`❌ Failed to allocate shipping: ${error}`);
        // Send admin alert
        await admin.firestore().collection('alerts').add({
          type: 'shipping_allocation_failed',
          orderId: context.params.orderId,
          error: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  });

// Calculate average shipping cost for premium customers
export const calculatePremiumShippingMetrics = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .onRun(async (context) => {
    const orders = await admin.firestore()
      .collection('orders')
      .where('customerType', 'in', ['premium', 'vip'])
      .where('status', '==', 'delivered')
      .get();
    
    const metrics = {
      totalOrders: orders.size,
      totalShippingCost: 0,
      avgShippingCost: 0,
      freeShippingCount: 0
    };
    
    orders.forEach(doc => {
      const order = doc.data();
      metrics.totalShippingCost += order.shippingCost || 0;
      if (order.shippingCost === 0) metrics.freeShippingCount++;
    });
    
    metrics.avgShippingCost = metrics.totalOrders > 0 
      ? metrics.totalShippingCost / metrics.totalOrders 
      : 0;
    
    // Store metrics
    await admin.firestore().collection('metrics').doc('shipping').set({
      ...metrics,
      calculatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return null;
  });
