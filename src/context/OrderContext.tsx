import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Order, CartEntry, DeliveryOption, PantryItem, Promotion, AdminNotification } from '../types';
import { PANTRY_ITEMS } from '../data/mockData';
import { ref, onValue, set, update } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { readCache, writeCache } from '../lib/localCache';

interface OrderContextType {
orders: Order[];
catalog: PantryItem[];
addCatalogItem: (item: PantryItem) => void;
removeCatalogItem: (itemId: string) => void;
placeOrder: (items: CartEntry[], deliveryType: DeliveryOption, deliveryDate: string, deliveryTimeWindow: string, surcharge: number, companyName: string, companyEmail: string, companyAddress: string, customRequests: string) => Order;
updateOrderStatus: (orderId: string, status: Order['status']) => void;
toggleHaccp: (orderId: string) => void;
setInvoiceTotal: (orderId: string, total: number) => void;
stockCounts: Record<string, number>;
updateStockCount: (itemId: string, count: number) => void;

promotions: Promotion[];
updatePromotion: (id: string, active: boolean) => void;
notifications: AdminNotification[];
markNotificationRead: (id: string) => void;

// Notion Sync
syncToNotion: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
const { user } = useAuth();

// Lazy-init from localStorage so the UI paints instantly on reload instead of
// waiting on a fresh network round-trip; Firebase then streams in live updates.
const [orders, setOrders] = useState<Order[]>(() => readCache<Order[]>('orders') ?? []);
const [catalog, setCatalog] = useState<PantryItem[]>(() => readCache<PantryItem[]>('catalog') ?? []);
const [stockCounts, setStockCounts] = useState<Record<string, number>>(() => readCache<Record<string, number>>('stockCounts') ?? {});
const [promotions, setPromotions] = useState<Promotion[]>(() => readCache<Promotion[]>('promotions') ?? []);
const [notifications, setNotifications] = useState<AdminNotification[]>(() => readCache<AdminNotification[]>('notifications') ?? []);

const initialItems = [...PANTRY_ITEMS].map(i => {
const base = { ...i, stockCount: (i.inStock ? 50 : 0) + (Math.floor(Math.random() * 20)), bestBefore: '2026-06-25' };
if(base.category === 'dairy') return { ...base, dietary: 'lactose-free', allergens: ['Certified Lactose Free'] } as PantryItem;
if(base.id === 'b7' || base.id === 's4') return { ...base, dietary: 'gluten-free', allergens: ['Gluten-Free Lab Verified'] } as PantryItem;
return base;
});

// Listen to Firebase RTDB changes and seed if empty.
// Gated on `user`: the DB rules require auth, and a listener that gets
// permission-denied while logged out never retries on its own once a user
// signs in — it has to be attached fresh, which is what this dependency does.
const uid = user?.uid;
useEffect(() => {
if (!uid) return;

// 1. Catalog
const catalogRef = ref(db, 'catalog');
const unsubscribeCatalog = onValue(catalogRef, (snapshot) => {
const data = snapshot.val();
if (data) {
const items = (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) as PantryItem[];
writeCache('catalog', items);
setCatalog(items);
} else {
const seedCatalog: Record<string, PantryItem> = {};
initialItems.forEach(item => { seedCatalog[item.id] = item; });
set(catalogRef, seedCatalog);
}
});

// 2. Orders
const ordersRef = ref(db, 'orders');
const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
const data = snapshot.val();
if (data) {
const items = Array.isArray(data) ? data.filter(Boolean) : Object.values(data);
// Sort orders placedAt descending
const sorted = (items as Order[]).sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
writeCache('orders', sorted);
setOrders(sorted);
} else {
// No seeding — start with empty orders
writeCache('orders', []);
setOrders([]);
}
});

// 3. Stock Counts
const stockCountsRef = ref(db, 'stockCounts');
const unsubscribeStock = onValue(stockCountsRef, (snapshot) => {
const data = snapshot.val();
if (data) {
writeCache('stockCounts', data);
setStockCounts(data);
} else {
const map: Record<string, number> = {};
initialItems.forEach(item => { map[item.id] = item.stockCount ?? 0; });
set(stockCountsRef, map);
}
});

// 4. Promotions
const promotionsRef = ref(db, 'promotions');
const unsubscribePromotions = onValue(promotionsRef, (snapshot) => {
const data = snapshot.val();
if (data) {
const items = Array.isArray(data) ? data.filter(Boolean) : Object.values(data);
writeCache('promotions', items);
setPromotions(items as Promotion[]);
} else {
const seedPromotions: Record<string, Promotion> = {};
const defaultPromotions: Promotion[] = [
{ id: 'p1', title: 'Summer Refresh Festival', subtitle: '30% Off All Cold Drinks', type: 'festival', active: true, color: '#004729', emoji: '☀️' },
{ id: 'p2', title: 'Fruit Week', subtitle: 'Free delivery on all local fruit boxes', type: 'seasonal', active: false, color: '#f59e0b', emoji: '🍎' }
];
defaultPromotions.forEach(p => { seedPromotions[p.id] = p; });
set(promotionsRef, seedPromotions);
}
});

// 5. Notifications
const notificationsRef = ref(db, 'notifications');
const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
const data = snapshot.val();
if (data) {
const items = Array.isArray(data) ? data.filter(Boolean) : Object.values(data);
const sorted = (items as AdminNotification[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
writeCache('notifications', sorted);
setNotifications(sorted);
} else {
writeCache('notifications', []);
setNotifications([]);
}
});

return () => {
unsubscribeCatalog();
unsubscribeOrders();
unsubscribeStock();
unsubscribePromotions();
unsubscribeNotifications();
};
}, [uid]);

// Simulation: Automated Restock Alerts
useEffect(() => {
const lowItems = catalog.filter(item => (stockCounts[item.id] ?? 0) < 10);
if (lowItems.length === 0) return;

// Guard 1: 24-hour cooldown via localStorage
const COOLDOWN_KEY = 'lastInventoryAlert';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const lastAlert = localStorage.getItem(COOLDOWN_KEY);
const now = Date.now();
if (lastAlert && now - parseInt(lastAlert, 10) < TWENTY_FOUR_HOURS) return;

// Guard 2: no existing UNREAD inventory notification from today
const todayPrefix = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
const alreadyNotifiedToday = notifications.some(
n => n.type === 'inventory' && n.status === 'unread' && n.timestamp.startsWith(todayPrefix)
);
if (alreadyNotifiedToday) return;

// All guards passed — fire the notification and stamp the cooldown
const newNotif: AdminNotification = {
id: `inv-${now}`,
type: 'inventory',
title: 'Inventory Critical Level',
message: `${lowItems.length} items are running low. Auto-restock suggested for ${lowItems[0].name}.`,
status: 'unread',
timestamp: new Date().toISOString()
};
localStorage.setItem(COOLDOWN_KEY, String(now));
set(ref(db, `notifications/${newNotif.id}`), newNotif);
}, [stockCounts, catalog]); // intentionally omit `notifications` to avoid re-triggering on every notification write

// Notion Sync
const syncToNotion = useCallback(async (orderId: string) => {
update(ref(db, `orders/${orderId}`), { notionSyncStatus: 'pending' });

// Simulate API Call to Notion Webhook
await new Promise(r => setTimeout(r, 2000));

update(ref(db, `orders/${orderId}`), { notionSyncStatus: 'synced' });

const notionNotif: AdminNotification = {
id: `notion-${Date.now()}`,
type: 'logistics',
title: 'Notion Sync Success',
message: `Order ${orderId} has been successfully reflected in the Global Logistics Board on Notion.`,
status: 'unread',
timestamp: new Date().toISOString()
};
set(ref(db, `notifications/${notionNotif.id}`), notionNotif);
}, []);

const addCatalogItem = useCallback((item: PantryItem) => {
set(ref(db, `catalog/${item.id}`), item);
set(ref(db, `stockCounts/${item.id}`), item.stockCount ?? 0);
}, []);

const removeCatalogItem = useCallback((itemId: string) => {
set(ref(db, `catalog/${itemId}`), null);
set(ref(db, `stockCounts/${itemId}`), null);
}, []);

const updateStockCount = useCallback((itemId: string, count: number) => {
set(ref(db, `stockCounts/${itemId}`), Math.max(0, count));
}, []);

const placeOrder = useCallback((items: CartEntry[], deliveryType: DeliveryOption, deliveryDate: string, deliveryTimeWindow: string, surcharge: number, companyName: string, companyEmail: string, companyAddress: string, customRequests: string): Order => {
const nextNum = Math.max(...orders.map(o => {
const match = o.id.match(/ORD-2026-(\d+)/);
return match ? parseInt(match[1], 10) : 0;
}), 43) + 1;
const orderId = `ORD-2026-${String(nextNum).padStart(4, '0')}`;

const order: Order = {
id: orderId,
items: items.map(e => ({ ...e, item: e.item ? { ...e.item, imageBase64: '' } : e.item })),
deliveryType,
deliveryDate,
deliveryTimeWindow: deliveryType === 'specific_time' ? deliveryTimeWindow : '',
surcharge,
placedAt: new Date().toISOString(),
status: 'pending',
companyName: companyName || '',
companyEmail: companyEmail || '',
companyAddress: companyAddress || '',
customRequests: customRequests || '',
notionSyncStatus: 'pending'
};

set(ref(db, `orders/${order.id}`), order);

// Deduct stock for each ordered item
const stockUpdates: Record<string, number> = {};
for (const entry of items) {
  if (entry.item?.id) {
    const current = stockCounts[entry.item.id] ?? 0;
    stockUpdates[entry.item.id] = Math.max(0, current - entry.quantity);
  }
}
if (Object.keys(stockUpdates).length > 0) {
  update(ref(db, 'stockCounts'), stockUpdates);
}

// Auto-trigger Notion Sync
setTimeout(() => syncToNotion(order.id), 500);

const logisticsNotif: AdminNotification = {
id: `log-${Date.now()}`,
type: 'logistics',
title: 'New Dispatch Required',
message: `Order ${order.id} for ${companyName} requires scheduling for ${deliveryDate}.`,
status: 'unread',
timestamp: new Date().toISOString()
};
set(ref(db, `notifications/${logisticsNotif.id}`), logisticsNotif);

return order;
}, [orders, stockCounts, syncToNotion]);

const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
update(ref(db, `orders/${orderId}`), { status });

// Sync status change to Notion
syncToNotion(orderId);

if (status === 'delivered') {
const order = orders.find(o => o.id === orderId);
const companyName = order?.companyName || 'Customer';
const financeNotif: AdminNotification = {
id: `fin-${Date.now()}`,
type: 'finance',
title: 'Invoice Generation Pending',
message: `Order ${orderId} has been delivered. Please generate invoice for ${companyName}.`,
status: 'unread',
timestamp: new Date().toISOString()
};
set(ref(db, `notifications/${financeNotif.id}`), financeNotif);
}
}, [orders, syncToNotion]);

const toggleHaccp = useCallback((orderId: string) => {
const order = orders.find(o => o.id === orderId);
if (order) {
update(ref(db, `orders/${orderId}`), { haccpChecked: !order.haccpChecked });
}
}, [orders]);

const setInvoiceTotal = useCallback((orderId: string, total: number) => {
update(ref(db, `orders/${orderId}`), { invoiceTotal: total, status: 'invoiced' as const });
}, []);

const updatePromotion = useCallback((id: string, active: boolean) => {
update(ref(db, `promotions/${id}`), { active });
}, []);

const markNotificationRead = useCallback((id: string) => {
update(ref(db, `notifications/${id}`), { status: 'read' as const });
}, []);

return (
<OrderContext.Provider value={{
orders, catalog, addCatalogItem, removeCatalogItem, placeOrder, updateOrderStatus, toggleHaccp, setInvoiceTotal,
stockCounts, updateStockCount,
promotions, updatePromotion,
notifications, markNotificationRead,
syncToNotion
}}>
{children}
</OrderContext.Provider>
);
}

export function useOrders() {
const ctx = useContext(OrderContext);
if (!ctx) throw new Error('useOrders must be used within OrderProvider');
return ctx;
}
