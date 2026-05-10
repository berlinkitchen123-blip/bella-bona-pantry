import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Order, CartEntry, DeliveryOption, PantryItem, Promotion, AdminNotification } from '../types';
import { DEMO_ORDERS } from '../data/mockData';
import { PANTRY_ITEMS } from '../data/mockData';

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

  // New: Notion Sync
  syncToNotion: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS.map(o => ({ ...o, notionSyncStatus: 'synced' })));
  
  const initialItems = [...PANTRY_ITEMS].map(i => {
    const base = { ...i, stockCount: (i.inStock ? 50 : 0) + (Math.floor(Math.random() * 20)), bestBefore: '2026-06-25' };
    if(base.category === 'dairy') return { ...base, dietary: 'lactose-free', allergens: ['Certified Lactose Free'] } as PantryItem;
    if(base.id === 'b7' || base.id === 's4') return { ...base, dietary: 'gluten-free', allergens: ['Gluten-Free Lab Verified'] } as PantryItem;
    return base;
  });

  const [catalog, setCatalog] = useState<PantryItem[]>(initialItems);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialItems.forEach(item => { map[item.id] = item.stockCount ?? 0; });
    return map;
  });

  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: 'p1', title: 'Summer Refresh Festival', subtitle: '30% Off All Cold Drinks', type: 'festival', active: true, color: '#004729', emoji: '☀️' },
    { id: 'p2', title: 'Fruit Week', subtitle: 'Free delivery on all local fruit boxes', type: 'seasonal', active: false, color: '#f59e0b', emoji: '🍎' }
  ]);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  // Simulation: Automated Restock Alerts
  useEffect(() => {
    const lowItems = catalog.filter(item => (stockCounts[item.id] ?? 0) < 10);
    if (lowItems.length > 0) {
      const newNotif: AdminNotification = {
        id: `inv-${Date.now()}`,
        type: 'inventory',
        title: 'Inventory Critical Level',
        message: `${lowItems.length} items are running low. Auto-restock suggested for ${lowItems[0].name}.`,
        status: 'unread',
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => {
         if (prev.some(p => p.title === newNotif.title)) return prev;
         return [newNotif, ...prev.slice(0, 9)];
      });
    }
  }, [stockCounts, catalog]);

  // Point: Notion Sync Simulation
  const syncToNotion = useCallback(async (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notionSyncStatus: 'pending' } : o));
    
    // Simulate API Call to Notion Webhook
    await new Promise(r => setTimeout(r, 2000));
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notionSyncStatus: 'synced' } : o));
    
    const notionNotif: AdminNotification = {
      id: `notion-${Date.now()}`,
      type: 'logistics',
      title: 'Notion Sync Success',
      message: `Order ${orderId} has been successfully reflected in the Global Logistics Board on Notion.`,
      status: 'unread',
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notionNotif, ...prev]);
  }, []);

  const addCatalogItem = useCallback((item: PantryItem) => {
    setCatalog(prev => [item, ...prev]);
    setStockCounts(prev => ({ ...prev, [item.id]: item.stockCount ?? 0 }));
  }, []);

  const removeCatalogItem = useCallback((itemId: string) => {
    setCatalog(prev => prev.filter(i => i.id !== itemId));
    setStockCounts(prev => {
      const { [itemId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const updateStockCount = useCallback((itemId: string, count: number) => {
    setStockCounts(prev => ({ ...prev, [itemId]: Math.max(0, count) }));
  }, []);

  const placeOrder = useCallback((items: CartEntry[], deliveryType: DeliveryOption, deliveryDate: string, deliveryTimeWindow: string, surcharge: number, companyName: string, companyEmail: string, companyAddress: string, customRequests: string): Order => {
    const order: Order = {
      id: `ORD-2026-${String(orders.length + 44).padStart(4, '0')}`,
      items,
      deliveryType,
      deliveryDate,
      deliveryTimeWindow: deliveryType === 'specific_time' ? deliveryTimeWindow : undefined,
      surcharge,
      placedAt: new Date().toISOString(),
      status: 'pending',
      companyName,
      companyEmail,
      companyAddress,
      customRequests: customRequests || undefined,
      notionSyncStatus: 'pending'
    };
    setOrders(prev => [order, ...prev]);
    
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
    setNotifications(prev => [logisticsNotif, ...prev]);

    return order;
  }, [orders.length, syncToNotion]);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // Sync status change to Notion
    syncToNotion(orderId);

    if (status === 'delivered') {
      const financeNotif: AdminNotification = {
        id: `fin-${Date.now()}`,
        type: 'finance',
        title: 'Invoice Generation Pending',
        message: `Order ${orderId} has been delivered. Please generate invoice for ${orders.find(o => o.id === orderId)?.companyName}.`,
        status: 'unread',
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [financeNotif, ...prev]);
    }
  }, [orders, syncToNotion]);

  const toggleHaccp = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, haccpChecked: !o.haccpChecked } : o));
  }, []);

  const setInvoiceTotal = useCallback((orderId: string, total: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoiceTotal: total, status: 'invoiced' as const } : o));
  }, []);

  const updatePromotion = useCallback((id: string, active: boolean) => {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, active } : p));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n));
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
