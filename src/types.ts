export type Category = 'dairy' | 'bakery' | 'drinks' | 'snacks' | 'fruits' | 'essentials';

export interface PantryItem {
  id: string;
  name: string;
  category: Category;
  unit: string;       // e.g. "crate", "pack", "bottle", "box"
  emoji: string;       // visual representation
  inStock: boolean;
  stockCount?: number;  // inventory quantity
  minOrder?: number;
  maxOrder?: number;
  dietary?: 'vegan' | 'vegetarian' | 'meat' | 'none';
  allergens?: string[];
}

export interface CartEntry {
  item: PantryItem;
  quantity: number;
}

export type DeliveryOption = 'standard' | 'specific_time';
export interface Order {
  id: string;
  items: CartEntry[];
  deliveryDate: string;
  deliveryType: DeliveryOption;
  deliveryTimeWindow?: string;
  surcharge: number;
  placedAt: string;      // ISO date
  status: 'pending' | 'confirmed' | 'packed' | 'delivered' | 'invoiced';
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  haccpChecked?: boolean;
  invoiceTotal?: number;   // assigned by admin
  notes?: string;
  customRequests?: string;
}

export interface User {
  email: string;
  name: string;
  company: string;
  companyAddress: string;
  role: 'customer' | 'admin';
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
  pantryTier: 'basic' | 'premium' | 'enterprise';
  onboardedAt: string;
  lastLogin?: string;
  allowSpecificTime: boolean;
}

export const __TYPES_DUMMY__ = true;
