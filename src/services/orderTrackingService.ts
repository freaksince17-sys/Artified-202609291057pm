import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { TrackedOrderData, OrderProductionPhase, OrderDetails } from '../types';
import { 
  DEMO_TRACKED_ORDERS, 
  buildMilestonesForPhase, 
  getProgressPercentage, 
  normalizeOrderId,
  sanitizeOrderItems,
  getTrackedOrder
} from '../data/trackingData';
import { CAVIAR_PEARL_BAG_IMAGE } from '../utils/productImages';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

const TRACKED_ORDERS_COLLECTION = 'tracked_orders';

/**
 * Normalizes Order ID for Firestore doc key (e.g. #ART-2026-5526 -> ART-2026-5526)
 */
export function getOrderDocId(rawId: string): string {
  return normalizeOrderId(rawId).replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
}

/**
 * Saves a tracked order to Firestore.
 */
export async function saveOrderToFirestore(order: TrackedOrderData): Promise<void> {
  const docId = getOrderDocId(order.orderId);
  if (!docId) return;

  const payload = {
    ...order,
    orderId: order.orderId.startsWith('#') ? order.orderId : `#${order.orderId}`,
    docId,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, TRACKED_ORDERS_COLLECTION, docId);
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn('Notice: Firestore save error, saving locally:', error);
  }

  // Also maintain local storage for instant offline recovery
  try {
    const raw = localStorage.getItem('artified_tracked_orders');
    const map: Record<string, TrackedOrderData> = raw ? JSON.parse(raw) : {};
    map[normalizeOrderId(order.orderId)] = order;
    localStorage.setItem('artified_tracked_orders', JSON.stringify(map));
  } catch {}

  // Sync to server disk
  try {
    fetch('/api/tracked-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    }).catch(() => {});
  } catch {}
}

/**
 * Subscribes to real-time status updates of an order from Firestore via onSnapshot.
 * Also seeds default orders or local orders if not yet present in Firestore.
 */
export function subscribeToTrackedOrder(
  orderIdInput: string,
  onUpdate: (order: TrackedOrderData | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const normalizedId = normalizeOrderId(orderIdInput);
  const docId = getOrderDocId(orderIdInput);

  if (!docId) {
    onUpdate(null);
    return () => {};
  }

  // 1. Immediately provide current local order so UI renders the updated phase with ZERO delay
  let immediateOrder: TrackedOrderData | null = null;
  try {
    const raw = localStorage.getItem('artified_tracked_orders');
    if (raw) {
      const map = JSON.parse(raw);
      if (map[normalizedId]) immediateOrder = sanitizeOrderItems(map[normalizedId]);
    }
  } catch {}

  if (!immediateOrder) {
    immediateOrder = getTrackedOrder(orderIdInput);
  }

  if (immediateOrder) {
    onUpdate(sanitizeOrderItems(immediateOrder));
  }

  const docRef = doc(db, TRACKED_ORDERS_COLLECTION, docId);

  // Set up real-time listener on Firestore document
  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TrackedOrderData;
        const sanitized = sanitizeOrderItems(data);

        // Check if local storage has a newer or more updated seller phase
        let localCandidate: TrackedOrderData | null = null;
        try {
          const raw = localStorage.getItem('artified_tracked_orders');
          if (raw) {
            const map = JSON.parse(raw);
            if (map[normalizedId]) localCandidate = map[normalizedId];
          }
        } catch {}

        const phaseWeights: Record<string, number> = {
          confirmed: 1,
          handcrafting_and_packaging: 2,
          beading_in_progress: 2,
          quality_and_packaging: 2,
          out_for_delivery: 3,
          delivered: 4
        };

        const localWeight = localCandidate ? (phaseWeights[localCandidate.currentPhase] || 0) : 0;
        const remoteWeight = phaseWeights[sanitized.currentPhase] || 0;

        // If seller updated locally to e.g. dispatch (out_for_delivery) and remote is still confirmed, keep local
        if (localCandidate && localWeight > remoteWeight) {
          onUpdate(sanitizeOrderItems(localCandidate));
          saveOrderToFirestore(localCandidate).catch(() => {});
        } else {
          onUpdate(sanitized);
        }

        // If the Firestore document had an old unsplash or placeholder image, self-heal it
        const hadBadImage = (data.items || []).some(
          (it) => !it.image || it.image.includes('unsplash.com') || it.image.includes('photo-1584917865442')
        );
        if (hadBadImage) {
          saveOrderToFirestore(sanitized).catch(() => {});
        }
      } else {
        // Document not found in Firestore yet: check local storage FIRST, then demo orders
        let initialOrder: TrackedOrderData | null = null;
        try {
          const raw = localStorage.getItem('artified_tracked_orders');
          if (raw) {
            const map = JSON.parse(raw);
            if (map[normalizedId]) initialOrder = sanitizeOrderItems(map[normalizedId]);
          }
        } catch {}

        if (!initialOrder) {
          initialOrder = getTrackedOrder(orderIdInput);
        }

        if (!initialOrder && DEMO_TRACKED_ORDERS[normalizedId]) {
          initialOrder = sanitizeOrderItems(DEMO_TRACKED_ORDERS[normalizedId]);
        }

        if (initialOrder) {
          const sanitized = sanitizeOrderItems(initialOrder);
          onUpdate(sanitized);
          // Seed to Firestore in background so future updates are real-time
          saveOrderToFirestore(sanitized).catch(() => {});
        } else {
          onUpdate(null);
        }
      }
    },
    (error) => {
      console.warn('Firestore onSnapshot notice for order tracking:', error);
      if (onError) onError(error);
      
      // Graceful fallback: check local storage and getTrackedOrder FIRST!
      let fallbackOrder: TrackedOrderData | null = null;
      try {
        const raw = localStorage.getItem('artified_tracked_orders');
        if (raw) {
          const map = JSON.parse(raw);
          if (map[normalizedId]) fallbackOrder = sanitizeOrderItems(map[normalizedId]);
        }
      } catch {}

      if (!fallbackOrder) {
        fallbackOrder = getTrackedOrder(orderIdInput);
      }

      if (fallbackOrder) {
        onUpdate(sanitizeOrderItems(fallbackOrder));
      } else if (DEMO_TRACKED_ORDERS[normalizedId]) {
        onUpdate(sanitizeOrderItems(DEMO_TRACKED_ORDERS[normalizedId]));
      }
    }
  );

  return unsubscribe;
}

/**
 * Updates an order phase and details in Firestore in real-time.
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newPhase: OrderProductionPhase,
  updates?: {
    liveCraftNotes?: string;
    courierPartner?: string;
    consignmentCode?: string;
    estimatedDeliveryDate?: string;
    riderName?: string;
    riderPhone?: string;
  }
): Promise<TrackedOrderData> {
  const docId = getOrderDocId(orderId);
  const docRef = doc(db, TRACKED_ORDERS_COLLECTION, docId);

  let existing: TrackedOrderData | null = null;

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      existing = snap.data() as TrackedOrderData;
    }
  } catch {}

  if (!existing && DEMO_TRACKED_ORDERS[normalizeOrderId(orderId)]) {
    existing = DEMO_TRACKED_ORDERS[normalizeOrderId(orderId)];
  }

  const baseOrder: TrackedOrderData = existing || {
    orderId: orderId.startsWith('#') ? orderId : `#${orderId}`,
    customerName: 'Valued Artified Patron',
    phone: '98XXXXXXXX',
    deliveryAddress: 'Kathmandu Valley, Nepal',
    deliveryZoneName: 'Inside Ring Road (Kathmandu / Lalitpur)',
    paymentMethodText: 'Verified Order Booking',
    paymentStatus: 'Paid & Verified',
    items: [
      {
        title: 'Caviar Pearl Bag',
        image: CAVIAR_PEARL_BAG_IMAGE,
        quantity: 1,
        price: 2499,
        customization: 'Handmade slow-fashion piece'
      }
    ],
    total: 2499,
    orderPlacedDate: 'Recent Order',
    estimatedDeliveryDate: updates?.estimatedDeliveryDate || '1–2 business days',
    currentPhase: newPhase,
    progressPercentage: getProgressPercentage(newPhase),
    artisanName: 'Sahina Shrestha',
    artisanRole: 'Founder & Master Handcrafter',
    studioLocation: 'Artified Workshop, Chikamugal, Kathmandu',
    liveCraftNotes: updates?.liveCraftNotes || 'Handcrafting progress updated at Chikamugal atelier.',
    milestones: buildMilestonesForPhase(newPhase, 'Recent Order', '1–2 business days', 'Kathmandu Valley')
  };

  const updated: TrackedOrderData = {
    ...baseOrder,
    currentPhase: newPhase,
    progressPercentage: getProgressPercentage(newPhase),
    liveCraftNotes: updates?.liveCraftNotes ?? baseOrder.liveCraftNotes,
    courierPartner: updates?.courierPartner ?? baseOrder.courierPartner,
    consignmentCode: updates?.consignmentCode ?? baseOrder.consignmentCode,
    estimatedDeliveryDate: updates?.estimatedDeliveryDate ?? baseOrder.estimatedDeliveryDate,
    riderName: updates?.riderName ?? baseOrder.riderName,
    riderPhone: updates?.riderPhone ?? baseOrder.riderPhone,
    milestones: buildMilestonesForPhase(
      newPhase,
      baseOrder.orderPlacedDate,
      updates?.estimatedDeliveryDate ?? baseOrder.estimatedDeliveryDate,
      baseOrder.deliveryAddress || baseOrder.deliveryZoneName
    )
  };

  await saveOrderToFirestore(updated);
  return updated;
}

/**
 * Initializes and seeds standard demo orders into Firestore so that
 * all users can immediately test real-time tracking out of the box.
 */
export async function seedDemoOrdersToFirestore(): Promise<void> {
  try {
    for (const order of Object.values(DEMO_TRACKED_ORDERS)) {
      const docId = getOrderDocId(order.orderId);
      const docRef = doc(db, TRACKED_ORDERS_COLLECTION, docId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, { ...order, docId, updatedAt: new Date().toISOString() });
      }
    }
  } catch (e) {
    console.warn('Notice: Firestore demo orders seeding:', e);
  }
}
