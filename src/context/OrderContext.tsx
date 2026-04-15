import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Order, CartEntry, DeliveryOption, PantryItem } from '../types';
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
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  
  // Enriched initial data with dietary tags and default stock
  const initialItems = [...PANTRY_ITEMS].map(i => {
    const base = { ...i, stockCount: i.inStock ? 50 : 0 };
    if(base.category === 'dairy') return { ...base, dietary: 'vegetarian', allergens: ['Milk'] } as PantryItem;
    if(base.category === 'bakery') return { ...base, dietary: 'vegan', allergens: ['Gluten'] } as PantryItem;
    if(base.category === 'snacks' && base.name.includes('Nuts')) return { ...base, dietary: 'vegan', allergens: ['Nuts'] } as PantryItem;
    if(base.id === 'b6') return { ...base, dietary: 'meat', allergens: ['Milk', 'Gluten', 'Pork'] } as PantryItem; 
    return { ...base, dietary: 'vegan', allergens: [] } as PantryItem;
  });

  const [catalog, setCatalog] = useState<PantryItem[]>(initialItems);

  const [stockCounts, setStockCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialItems.forEach(item => { map[item.id] = item.stockCount; });
    return map;
  });

  const addCatalogItem = useCallback((item: PantryItem) => {
    setCatalog(prev => [item, ...prev]);
    setStockCounts(prev => ({ ...prev, [item.id]: item.stockCount }));
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

  const placeOrder = useCallback((
    items: CartEntry[],
    deliveryType: DeliveryOption,
    deliveryDate: string,
    deliveryTimeWindow: string,
    surcharge: number,
    companyName: string,
    companyEmail: string,
    companyAddress: string,
    customRequests: string
  ): Order => {
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
      customRequests: customRequests || undefined
    };
    setOrders(prev => [order, ...prev]);
    return order;
  }, [orders.length]);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  }, []);

  const toggleHaccp = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, haccpChecked: !o.haccpChecked } : o));
  }, []);

  const setInvoiceTotal = useCallback((orderId: string, total: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoiceTotal: total, status: 'invoiced' as const } : o));
  }, []);



  return (
    <OrderContext.Provider value={{
      orders, catalog, addCatalogItem, removeCatalogItem, placeOrder, updateOrderStatus, toggleHaccp, setInvoiceTotal,
      stockCounts, updateStockCount,
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
