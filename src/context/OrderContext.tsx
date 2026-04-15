import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Order, CartEntry, DeliveryOption, PantryItem } from '../types';
import { DEMO_ORDERS } from '../data/mockData';
import { PANTRY_ITEMS } from '../data/mockData';

interface OrderContextType {
  orders: Order[];
  catalog: PantryItem[];
  addCatalogItem: (item: PantryItem) => void;
  placeOrder: (items: CartEntry[], deliveryType: DeliveryOption, deliveryDate: string, deliveryTimeWindow: string, surcharge: number, companyName: string, companyEmail: string, companyAddress: string, customRequests: string) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  toggleHaccp: (orderId: string) => void;
  setInvoiceTotal: (orderId: string, total: number) => void;
  inventory: Record<string, boolean>;
  toggleStock: (itemId: string) => void;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  
  // Enriched initial data with dietary tags
  const initialItems = [...PANTRY_ITEMS].map(i => {
    if(i.category === 'dairy') return { ...i, dietary: 'vegetarian', allergens: ['Milk'] } as PantryItem;
    if(i.category === 'bakery') return { ...i, dietary: 'vegan', allergens: ['Gluten'] } as PantryItem;
    if(i.category === 'snacks' && i.name.includes('Nuts')) return { ...i, dietary: 'vegan', allergens: ['Nuts'] } as PantryItem;
    if(i.id === 'b6') return { ...i, dietary: 'meat', allergens: ['Milk', 'Gluten', 'Pork'] } as PantryItem; // example edge case
    return { ...i, dietary: 'vegan', allergens: [] } as PantryItem;
  });

  const [catalog, setCatalog] = useState<PantryItem[]>(initialItems);

  const [inventory, setInventory] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialItems.forEach(item => { map[item.id] = item.inStock; });
    return map;
  });

  const addCatalogItem = useCallback((item: PantryItem) => {
    setCatalog(prev => [item, ...prev]);
    setInventory(prev => ({ ...prev, [item.id]: item.inStock }));
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

  const toggleStock = useCallback((itemId: string) => {
    setInventory(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  return (
    <OrderContext.Provider value={{
      orders, catalog, addCatalogItem, placeOrder, updateOrderStatus, toggleHaccp, setInvoiceTotal,
      inventory, toggleStock,
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
