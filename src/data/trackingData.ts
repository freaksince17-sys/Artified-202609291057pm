import { TrackedOrderData, OrderDetails, OrderProductionPhase, TrackingMilestone } from '../types';

/**
 * Builds the 4 exact milestones requested:
 * 1. Order Confirmed & Paid
 * 2. Handcrafting & Packaging
 * 3. Out for Delivery
 * 4. Delivered
 */
export function buildMilestonesForPhase(
  phase: OrderProductionPhase,
  orderPlacedDate = 'Recently Placed',
  estimatedDeliveryDate = 'Within 1–2 days',
  location = 'Inside Ring Road (Kathmandu / Lalitpur)'
): TrackingMilestone[] {
  const isDelivered = phase === 'delivered';
  const isOut = phase === 'out_for_delivery' || isDelivered;
  const isCrafting = phase === 'handcrafting_and_packaging' || isOut;
  const isConfirmed = true;

  return [
    {
      stage: 'confirmed',
      label: 'Order Confirmed & Paid',
      description: 'Order confirmed and verified. Materials and pearls reserved at Chikamugal workshop.',
      timestamp: orderPlacedDate,
      location: 'Artified Workshop, Chikamugal',
      completed: phase !== 'confirmed' || isDelivered,
      current: phase === 'confirmed',
    },
    {
      stage: 'handcrafting_and_packaging',
      label: 'Handcrafting & Packaging',
      description: 'Handcrafted with precision by Sahina Shrestha & team, inspected for quality, and packaged in luxury dust pouch.',
      timestamp: isCrafting ? (phase === 'handcrafting_and_packaging' ? 'In Progress Now' : 'Completed') : 'Upcoming',
      location: 'Craft Bench, Chikamugal, Kathmandu',
      completed: (phase === 'out_for_delivery' || isDelivered),
      current: phase === 'handcrafting_and_packaging',
    },
    {
      stage: 'out_for_delivery',
      label: 'Out for Delivery',
      description: 'Handed over to express courier rider for safe doorstep transit.',
      timestamp: isOut ? (phase === 'out_for_delivery' ? 'On Route Today' : 'Completed') : `Estimated: ${estimatedDeliveryDate}`,
      location: 'Kathmandu Valley Logistics Hub',
      completed: isDelivered,
      current: phase === 'out_for_delivery',
    },
    {
      stage: 'delivered',
      label: 'Delivered',
      description: 'Safely delivered to customer with happiness, care card, and 48-hour check guarantee.',
      timestamp: isDelivered ? 'Handed Over' : `Expected ${estimatedDeliveryDate}`,
      location: location,
      completed: isDelivered,
      current: isDelivered,
    },
  ];
}

export function getProgressPercentage(phase: OrderProductionPhase): number {
  switch (phase) {
    case 'confirmed': return 25;
    case 'handcrafting_and_packaging': return 60;
    case 'out_for_delivery': return 85;
    case 'delivered': return 100;
    default: return 50;
  }
}

export const DEMO_TRACKED_ORDERS: Record<string, TrackedOrderData> = {
  'ART-2026-5526': {
    orderId: 'ART-2026-5526',
    customerName: 'Lamar Anzelov',
    phone: '9703726980',
    deliveryAddress: '175/25, Kathmandu Valley',
    deliveryZoneName: 'Inside Ring Road (Kathmandu / Lalitpur)',
    paymentMethodText: 'Direct Order / Cash on Delivery',
    paymentStatus: 'Paid & Verified',
    items: [
      {
        title: 'Caviar Pearl Bag',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        quantity: 1,
        price: 2499,
        customization: 'Handcrafted by Sahina Shrestha'
      }
    ],
    total: 2499,
    orderPlacedDate: 'Recent Order',
    estimatedDeliveryDate: '1-2 business days',
    currentPhase: 'confirmed',
    progressPercentage: 25,
    artisanName: 'Sahina Shrestha',
    artisanRole: 'Founder & Master Handcrafter',
    studioLocation: 'Artified Workshop, Chikamugal, Kathmandu',
    liveCraftNotes: 'Your order was received and confirmed! Sahina Shrestha has reserved the required luster pearls and high-strength threads. Handcrafting is scheduled at our Chikamugal workshop.',
    milestones: buildMilestonesForPhase('confirmed', 'Recent Order', '1-2 business days', '175/25, Inside Ring Road')
  }
};

/**
 * Normalizes input order id (e.g. "#art-2026-8842" -> "ART-2026-8842")
 */
export function normalizeOrderId(id: string): string {
  return id.replace(/[#\s]/g, '').toUpperCase();
}

/**
 * Persists an updated tracked order to browser storage.
 */
export function saveTrackedOrder(order: TrackedOrderData): void {
  try {
    const raw = localStorage.getItem('artified_tracked_orders');
    const map: Record<string, TrackedOrderData> = raw ? JSON.parse(raw) : {};
    const norm = normalizeOrderId(order.orderId);
    map[norm] = order;
    localStorage.setItem('artified_tracked_orders', JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('artified_order_updated', { detail: order }));
  } catch (e) {
    console.warn('Failed to save tracked order to localStorage', e);
  }
}

/**
 * Updates an order's progress phase and optional craft notes/courier info.
 */
export function updateOrderPhase(
  orderIdInput: string,
  phase: OrderProductionPhase,
  updates?: {
    liveCraftNotes?: string;
    courierPartner?: string;
    consignmentCode?: string;
    estimatedDeliveryDate?: string;
  }
): TrackedOrderData {
  const current = getTrackedOrder(orderIdInput) || generateDynamicTrackedOrder(orderIdInput);
  const updated: TrackedOrderData = {
    ...current,
    currentPhase: phase,
    progressPercentage: getProgressPercentage(phase),
    liveCraftNotes: updates?.liveCraftNotes ?? current.liveCraftNotes,
    courierPartner: updates?.courierPartner ?? current.courierPartner,
    consignmentCode: updates?.consignmentCode ?? current.consignmentCode,
    estimatedDeliveryDate: updates?.estimatedDeliveryDate ?? current.estimatedDeliveryDate,
    milestones: buildMilestonesForPhase(
      phase,
      current.orderPlacedDate,
      updates?.estimatedDeliveryDate ?? current.estimatedDeliveryDate,
      current.deliveryAddress || current.deliveryZoneName
    )
  };

  saveTrackedOrder(updated);
  return updated;
}

/**
 * Fetches order tracking data from updated local storage records,
 * pre-configured demo records, or locally placed orders.
 */
export function getTrackedOrder(orderIdInput: string): TrackedOrderData | null {
  if (!orderIdInput.trim()) return null;

  const normalized = normalizeOrderId(orderIdInput);

  // 1. Check seller-saved / modified tracking records first
  try {
    const raw = localStorage.getItem('artified_tracked_orders');
    if (raw) {
      const map: Record<string, TrackedOrderData> = JSON.parse(raw);
      if (map[normalized]) {
        return map[normalized];
      }
    }
  } catch {
    // ignore
  }

  // 2. Check pre-configured demo orders
  if (DEMO_TRACKED_ORDERS[normalized]) {
    return DEMO_TRACKED_ORDERS[normalized];
  }

  // 3. Check locally placed orders in browser storage
  try {
    const savedOrdersRaw = localStorage.getItem('artified_orders');
    if (savedOrdersRaw) {
      const orders: OrderDetails[] = JSON.parse(savedOrdersRaw);
      const matched = orders.find((o) => normalizeOrderId(o.orderId) === normalized);
      if (matched) {
        return buildTrackedOrderFromOrderDetails(matched);
      }
    }
  } catch {
    // ignore parsing errors
  }

  // 4. If user entered a realistic ART- format, generate realistic tracking
  if (normalized.startsWith('ART-') || normalized.startsWith('ART')) {
    return generateDynamicTrackedOrder(normalized);
  }

  return null;
}

/**
 * Returns all active orders for the seller to manage in one central place:
 * Merges demo orders, customer placed orders, and seller-created orders.
 */
export function getAllOrdersForSeller(): TrackedOrderData[] {
  const result: Record<string, TrackedOrderData> = {};
  const legacyDefaultIds = ['ART-2026-8842', 'ART-2026-5521', 'ART-2026-3190'];

  // 1. Add demo orders (only ART-2026-5526)
  Object.values(DEMO_TRACKED_ORDERS).forEach((order) => {
    result[normalizeOrderId(order.orderId)] = order;
  });

  // 2. Add customer checkout orders from localStorage
  try {
    const raw = localStorage.getItem('artified_orders');
    if (raw) {
      const customerOrders: OrderDetails[] = JSON.parse(raw);
      customerOrders.forEach((o) => {
        const norm = normalizeOrderId(o.orderId);
        if (!legacyDefaultIds.includes(norm) && !result[norm]) {
          result[norm] = buildTrackedOrderFromOrderDetails(o);
        }
      });
    }
  } catch (e) {
    console.warn('Error reading customer orders for seller', e);
  }

  // 3. Overlay any seller-updated tracked orders
  try {
    const rawTracked = localStorage.getItem('artified_tracked_orders');
    if (rawTracked) {
      const trackedMap: Record<string, TrackedOrderData> = JSON.parse(rawTracked);
      // Clean legacy defaults from localStorage
      let hasLegacy = false;
      legacyDefaultIds.forEach((id) => {
        if (trackedMap[id]) {
          delete trackedMap[id];
          hasLegacy = true;
        }
      });
      if (hasLegacy) {
        localStorage.setItem('artified_tracked_orders', JSON.stringify(trackedMap));
      }

      Object.entries(trackedMap).forEach(([norm, order]) => {
        if (!legacyDefaultIds.includes(norm)) {
          result[norm] = order;
        }
      });
    }
  } catch (e) {
    console.warn('Error reading tracked orders overlay', e);
  }

  return Object.values(result);
}

function buildTrackedOrderFromOrderDetails(order: OrderDetails): TrackedOrderData {
  const phase: OrderProductionPhase = 'confirmed';
  return {
    orderId: order.orderId,
    customerName: order.customerName,
    phone: order.phone,
    deliveryAddress: `${order.address}${order.landmark ? ` (Near ${order.landmark})` : ''}`,
    deliveryZoneName: order.deliveryZone.name,
    paymentMethodText: 
      order.paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : order.paymentMethod === 'esewa'
        ? `eSewa (Txn: ${order.transactionId || 'Pending'})`
        : `Khalti (Txn: ${order.transactionId || 'Pending'})`,
    paymentStatus: order.paymentMethod === 'cod' ? 'Pay on Delivery' : 'Paid & Verified',
    items: order.items.map((i) => ({
      title: i.product.title,
      image: i.product.images[0],
      quantity: i.quantity,
      price: i.product.price,
      customization: i.customizationNote,
    })),
    total: order.total,
    orderPlacedDate: order.createdAt || 'Just now',
    estimatedDeliveryDate: order.deliveryZone.estimatedDays,
    currentPhase: phase,
    progressPercentage: getProgressPercentage(phase),
    artisanName: 'Sahina Shrestha',
    artisanRole: 'Founder & Master Handcrafter',
    studioLocation: 'Artified Workshop, Chikamugal, Kathmandu',
    liveCraftNotes: `Your order was received and confirmed! Sahina Shrestha has reserved the required luster pearls and high-strength threads. Handcrafting is scheduled at our Chikamugal workshop.`,
    milestones: buildMilestonesForPhase(
      phase,
      order.createdAt || 'Today',
      order.deliveryZone.estimatedDays,
      order.deliveryZone.name
    )
  };
}

function generateDynamicTrackedOrder(orderId: string): TrackedOrderData {
  const phase: OrderProductionPhase = 'handcrafting_and_packaging';
  return {
    orderId: orderId.startsWith('#') ? orderId : `#${orderId}`,
    customerName: 'Valued Artified Customer',
    phone: '98XXXXXXXX',
    deliveryAddress: 'Kathmandu Valley, Nepal',
    deliveryZoneName: 'Inside Ring Road (Kathmandu / Lalitpur)',
    paymentMethodText: 'Verified Order Booking',
    paymentStatus: 'Confirmed & Paid',
    items: [
      {
        title: 'Handcrafted Pearl Creation',
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
        quantity: 1,
        price: 4200,
        customization: 'Handmade slow-fashion piece'
      }
    ],
    total: 4300,
    orderPlacedDate: 'Recently Placed',
    estimatedDeliveryDate: '2–3 business days',
    currentPhase: phase,
    progressPercentage: getProgressPercentage(phase),
    artisanName: 'Sahina Shrestha',
    artisanRole: 'Founder & Master Handcrafter',
    studioLocation: 'Artified Workshop, Chikamugal, Kathmandu',
    liveCraftNotes: 'Handcrafting underway in Chikamugal workshop by Sahina Shrestha. Each bead is manually anchored to ensure structural longevity.',
    milestones: buildMilestonesForPhase(phase, 'Recently Placed', '2–3 business days', 'Kathmandu Valley')
  };
}
