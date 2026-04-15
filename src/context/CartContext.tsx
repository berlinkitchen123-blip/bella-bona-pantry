import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type {  CartEntry, PantryItem, DeliveryOption  } from '../types';

interface CartContextType {
  cart: CartEntry[];
  deliveryType: DeliveryOption;
  setDeliveryType: (d: DeliveryOption) => void;
  deliveryDate: string;
  setDeliveryDate: (d: string) => void;
  deliveryTimeWindow: string;
  setDeliveryTimeWindow: (w: string) => void;
  customRequests: string;
  setCustomRequests: (r: string) => void;
  addItem: (item: PantryItem) => void;
  removeItem: (itemId: string) => void;
  setQuantity: (itemId: string, qty: number) => void;
  getQuantity: (itemId: string) => number;
  clearCart: () => void;
  totalItems: number;
  surcharge: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryOption>('standard');
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0] // default to today
  );
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState<string>('09:00 - 10:00');
  const [customRequests, setCustomRequests] = useState<string>('');

  const surcharge = deliveryType === 'specific_time' ? 89 : 0;

  const addItem = useCallback((item: PantryItem) => {
    setCart(prev => {
      const existing = prev.find(e => e.item.id === item.id);
      if (existing) {
        return prev.map(e => e.item.id === item.id ? { ...e, quantity: e.quantity + 1 } : e);
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart(prev => {
      const existing = prev.find(e => e.item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(e => e.item.id !== itemId);
      return prev.map(e => e.item.id === itemId ? { ...e, quantity: e.quantity - 1 } : e);
    });
  }, []);

  const setQuantity = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(e => e.item.id !== itemId));
    } else {
      setCart(prev => prev.map(e => e.item.id === itemId ? { ...e, quantity: qty } : e));
    }
  }, []);

  const getQuantity = useCallback((itemId: string): number => {
    return cart.find(e => e.item.id === itemId)?.quantity || 0;
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setDeliveryType('standard');
    setCustomRequests('');
  }, []);

  const totalItems = cart.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, deliveryType, setDeliveryType,
      deliveryDate, setDeliveryDate,
      deliveryTimeWindow, setDeliveryTimeWindow,
      customRequests, setCustomRequests,
      addItem, removeItem, setQuantity, getQuantity,
      clearCart, totalItems, surcharge,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
