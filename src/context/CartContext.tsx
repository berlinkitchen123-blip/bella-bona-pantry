import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { CartEntry, PantryItem, DeliveryOption } from '../types';
import { useAuth } from './AuthContext';
import { readCache, writeCache } from '../lib/localCache';

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
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

interface PersistedCart {
  cart: CartEntry[];
  deliveryType: DeliveryOption;
  deliveryDate: string;
  deliveryTimeWindow: string;
  customRequests: string;
}

const CartContext = createContext<CartContextType | null>(null);

const todayISO = () => new Date().toISOString().split('T')[0];

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryOption>('standard');
  const [deliveryDate, setDeliveryDate] = useState<string>(todayISO());
  const [deliveryTimeWindow, setDeliveryTimeWindow] = useState<string>('09:00 - 10:00');
  const [customRequests, setCustomRequests] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cacheKey = user ? `cart:${user.uid}` : null;

  // Guards the save-effect below from firing with stale (pre-hydration) state on the
  // same render pass the load-effect just kicked off a setCart() for — otherwise it
  // would immediately overwrite the just-restored cart with the old empty one.
  const skipNextSaveRef = useRef(true);

  // Load this user's saved cart the moment they're known (login, or returning session).
  useEffect(() => {
    skipNextSaveRef.current = true;
    if (!cacheKey) {
      setCart([]);
      return;
    }
    const saved = readCache<PersistedCart>(cacheKey);
    setCart(saved?.cart ?? []);
    setDeliveryType(saved?.deliveryType ?? 'standard');
    setDeliveryDate(saved?.deliveryDate ?? todayISO());
    setDeliveryTimeWindow(saved?.deliveryTimeWindow ?? '09:00 - 10:00');
    setCustomRequests(saved?.customRequests ?? '');
  }, [cacheKey]);

  // Save on every change so nothing is lost on refresh, tab close, or dropped connection.
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (!cacheKey) return;
    writeCache(cacheKey, { cart, deliveryType, deliveryDate, deliveryTimeWindow, customRequests });
  }, [cacheKey, cart, deliveryType, deliveryDate, deliveryTimeWindow, customRequests]);

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
      isCartOpen, openCart: () => setIsCartOpen(true), closeCart: () => setIsCartOpen(false),
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
