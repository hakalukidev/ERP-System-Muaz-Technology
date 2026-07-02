import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import * as functions from 'firebase-functions/v1';

// Initialize Firebase Admin
admin.initializeApp();

// ==================== HELPER FUNCTIONS ====================

function calculateShippingCost(order: any): number {
  // Premium/VIP customers get free shipping
  if (order.customerType === 'premium' || order.customerType === 'vip') {
    return 0;
  }

  // Base shipping cost based on order total
  if (order.totalAmount < 100) return 10;
  if (order.totalAmount < 500) return 20;
  return 0; // Free shipping for orders over $500
}

// ==================== TEST FUNCTION ====================

export const helloWorld = functions.https.onRequest((req, res) => {
  logger.info("Hello from Firebase!");
  res.send("Hello from Firebase!");
});

// ==================== SHIPPING ALLOCATION ====================

export const autoAllocateShipping = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only run when order status changes to 'confirmed'
    if (before.status === 'confirmed' || after.status !== 'confirmed') {
      return;
    }

    const orderId = context.params.orderId;
    logger.info(`📦 Allocating shipping for order: ${orderId}`);

    try {
      const shippingCost = calculateShippingCost(after);

      // Update order
      await admin.firestore()
        .collection('orders')
        .doc(orderId)
        .update({
          shippingCost,
          shippingAllocatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'shipping_allocated'
        });

      // Log the allocation
      await admin.firestore()
        .collection('shipping_logs')
        .add({
          orderId,
          cost: shippingCost,
          method: 'auto_allocated',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

      logger.info(`✅ Shipping allocated: $${shippingCost} for order ${orderId}`);

    } catch (err: any) {
      logger.error(`❌ Failed: ${err.message}`);

      // Send alert
      await admin.firestore()
        .collection('alerts')
        .add({
          type: 'shipping_allocation_failed',
          orderId,
          error: err.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
  });

// ==================== PREMIUM METRICS (Daily at 2 AM) ====================

export const calculatePremiumShippingMetrics = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Dhaka')
  .onRun(async () => {
    logger.info('🔄 Calculating premium shipping metrics...');

    try {
      const snapshot = await admin.firestore()
        .collection('orders')
        .where('customerType', 'in', ['premium', 'vip'])
        .where('status', '==', 'delivered')
        .get();

      let totalCost = 0;
      let freeShippingCount = 0;

      snapshot.forEach(doc => {
        const order = doc.data();
        totalCost += order.shippingCost || 0;
        if (order.shippingCost === 0) freeShippingCount++;
      });

      const totalOrders = snapshot.size;
      const avgCost = totalOrders > 0 ? totalCost / totalOrders : 0;

      // Save metrics
      await admin.firestore()
        .collection('metrics')
        .doc('shipping')
        .set({
          totalOrders,
          totalShippingCost: totalCost,
          avgShippingCost: avgCost,
          freeShippingCount,
          calculatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      logger.info(`✅ Metrics saved: ${totalOrders} orders, avg $${avgCost.toFixed(2)}`);
      return null;

    } catch (err: any) {
      logger.error(`❌ Metrics failed: ${err.message}`);
      return null;
    }
  });