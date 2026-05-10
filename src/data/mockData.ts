import type {  PantryItem, Order  } from '../types';

export const CATEGORIES = [
  { key: 'dairy',      label: 'Milk & Dairy',  icon: '🥛', color: '#dbeafe' },
  { key: 'bakery',     label: 'Bakery',        icon: '🥐', color: '#fef3c7' },
  { key: 'drinks',     label: 'Drinks',        icon: '🧃', color: '#d1fae5' },
  { key: 'snacks',     label: 'Snacks',        icon: '🍪', color: '#fce7f3' },
  { key: 'fruits',     label: 'Fruits & Veg',  icon: '🍎', color: '#dcfce7' },
  { key: 'essentials', label: 'Essentials',     icon: '📦', color: '#f3e8ff' },
] as const;

export const PANTRY_ITEMS: PantryItem[] = [
  // Dairy
  { id: 'd1', name: 'Full-Fat Milk',         category: 'dairy', unit: 'crate (6×1L)',   emoji: '🥛', inStock: true, nutriScore: 'C', calories: 64, protein: 3.3, sugar: 4.8, fiber: 0, votes: 5  },
  { id: 'd2', name: 'Semi-Skimmed Milk',     category: 'dairy', unit: 'crate (6×1L)',   emoji: '🥛', inStock: true, nutriScore: 'B', calories: 47, protein: 3.4, sugar: 4.7, fiber: 0, votes: 12 },
  { id: 'd3', name: 'Oat Milk Barista',      category: 'dairy', unit: 'pack (6×1L)',    emoji: '🌾', inStock: true, nutriScore: 'B', calories: 59, protein: 1.0, sugar: 3.0, fiber: 0.8, votes: 45, dietary: 'vegan' },
  { id: 'd4', name: 'Greek Yoghurt',         category: 'dairy', unit: 'tub (5kg)',      emoji: '🥣', inStock: true, nutriScore: 'A', calories: 96, protein: 9.0, sugar: 3.5, fiber: 0, votes: 18, dietary: 'vegetarian' },
  { id: 'd5', name: 'Butter Portions',       category: 'dairy', unit: 'box (100 pcs)',  emoji: '🧈', inStock: true, nutriScore: 'E', calories: 717, protein: 0.8, sugar: 0.1, fiber: 0, votes: 3, dietary: 'vegetarian' },
  { id: 'd6', name: 'Cream Cheese',          category: 'dairy', unit: 'pack (1kg)',     emoji: '🧀', inStock: false, nutriScore: 'D', calories: 342, protein: 6.0, sugar: 3.2, fiber: 0, votes: 8, dietary: 'vegetarian' },
  { id: 'd7', name: 'Shredded Mozzarella',   category: 'dairy', unit: 'bag (2kg)',      emoji: '🧀', inStock: true, nutriScore: 'D', calories: 280, protein: 25.0, sugar: 1.0, fiber: 0, votes: 14, dietary: 'vegetarian' },

  // Bakery
  { id: 'b1', name: 'Sourdough Loaf',        category: 'bakery', unit: 'loaf',           emoji: '🍞', inStock: true, nutriScore: 'A', calories: 230, protein: 8.0, sugar: 0.5, fiber: 2.4, votes: 22, dietary: 'vegan' },
  { id: 'b2', name: 'Multigrain Bread',      category: 'bakery', unit: 'loaf',           emoji: '🍞', inStock: true, nutriScore: 'A', calories: 250, protein: 10.0, sugar: 1.5, fiber: 6.0, votes: 31, dietary: 'vegan' },
  { id: 'b3', name: 'Croissants',            category: 'bakery', unit: 'box (12 pcs)',   emoji: '🥐', inStock: true, nutriScore: 'D', calories: 406, protein: 8.2, sugar: 11.2, fiber: 2.6, votes: 55, dietary: 'vegetarian' },
  { id: 'b4', name: 'Pain au Chocolat',      category: 'bakery', unit: 'box (12 pcs)',   emoji: '🥐', inStock: true, nutriScore: 'E', calories: 420, protein: 7.5, sugar: 16.0, fiber: 2.4, votes: 48, dietary: 'vegetarian' },
  { id: 'b7', name: 'Gluten-Free Rolls',     category: 'bakery', unit: 'pack (6 pcs)',   emoji: '🍞', inStock: true, nutriScore: 'B', calories: 210, protein: 4.0, sugar: 2.0, fiber: 4.5, votes: 9  },

  // Drinks
  { id: 'dr1', name: 'Still Water',          category: 'drinks', unit: 'crate (24×500ml)', emoji: '💧', inStock: true, nutriScore: 'A', calories: 0, votes: 80, dietary: 'vegan' },
  { id: 'dr3', name: 'Orange Juice',         category: 'drinks', unit: 'pack (12×330ml)',  emoji: '🍊', inStock: true, nutriScore: 'C', calories: 45, sugar: 9.0, fiber: 0.2, votes: 22, dietary: 'vegan' },
  { id: 'dr5', name: 'Coffee Beans (Arabica)', category: 'drinks', unit: 'bag (1kg)',       emoji: '☕', inStock: true, nutriScore: 'A', calories: 0, votes: 120, dietary: 'vegan' },
  { id: 'dr7', name: 'Coca-Cola',            category: 'drinks', unit: 'crate (24×330ml)', emoji: '🥤', inStock: true, nutriScore: 'E', calories: 42, sugar: 10.6, votes: 15, dietary: 'vegan' },

  // Snacks
  { id: 's1', name: 'Mixed Nuts',            category: 'snacks', unit: 'bag (1kg)',       emoji: '🥜', inStock: true, nutriScore: 'A', calories: 607, protein: 18.0, sugar: 4.0, fiber: 7.0, votes: 65, dietary: 'vegan' },
  { id: 's2', name: 'Granola Bars',          category: 'snacks', unit: 'box (24 pcs)',   emoji: '🍫', inStock: true, nutriScore: 'C', calories: 450, sugar: 12.0, fiber: 4.0, votes: 42, dietary: 'vegetarian' },
  { id: 's4', name: 'Rice Cakes',            category: 'snacks', unit: 'pack (12 pcs)',  emoji: '🍘', inStock: true, nutriScore: 'B', calories: 380, sugar: 1.0, fiber: 3.0, votes: 14, dietary: 'vegan' },
  { id: 's5', name: 'Trail Mix',             category: 'snacks', unit: 'bag (500g)',     emoji: '🥜', inStock: true, nutriScore: 'B', calories: 480, protein: 12.0, sugar: 15.0, fiber: 5.0, votes: 28, dietary: 'vegan', allergens: ['Peanuts', 'Tree Nuts'] },

  // Fruits & Veg
  { id: 'f1', name: 'Banana Box',            category: 'fruits', unit: 'box (≈40 pcs)',  emoji: '🍌', inStock: true, nutriScore: 'A', calories: 89, sugar: 12.0, fiber: 2.6, votes: 95, dietary: 'vegan' },
  { id: 'f2', name: 'Apple Assortment',      category: 'fruits', unit: 'crate (≈30 pcs)', emoji: '🍏', inStock: true, nutriScore: 'A', calories: 52, sugar: 10.0, fiber: 2.4, votes: 72, dietary: 'vegan' },
  { id: 'f3', name: 'Seasonal Fruit Bowl',   category: 'fruits', unit: 'bowl',           emoji: '🍇', inStock: true, nutriScore: 'A', votes: 88, dietary: 'vegan' },
  { id: 'f4', name: 'Cherry Tomatoes',       category: 'fruits', unit: 'box (2kg)',      emoji: '🍅', inStock: true, nutriScore: 'A', calories: 18, fiber: 1.2, votes: 16, dietary: 'vegan' },

  // Essentials
  { id: 'e1', name: 'Paper Towels',          category: 'essentials', unit: 'pack (6 rolls)',    emoji: '🧻', inStock: true, votes: 20 },
  { id: 'e3', name: 'Dish Soap',             category: 'essentials', unit: 'bottle (1L)',       emoji: '🧴', inStock: true, votes: 8  },
  { id: 'e6', name: 'Cling Film',            category: 'essentials', unit: 'roll',              emoji: '📦', inStock: true  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: 'ORD-2026-0041',
    items: [
      { item: PANTRY_ITEMS[0], quantity: 2 },
      { item: PANTRY_ITEMS[2], quantity: 1 },
      { item: PANTRY_ITEMS[8], quantity: 3 },
      { item: PANTRY_ITEMS[15], quantity: 1 },
      { item: PANTRY_ITEMS[30], quantity: 1 },
    ],
    deliveryType: 'standard',
    deliveryDate: '2026-04-15',
    companyAddress: '123 Business Rd, Berlin',
    surcharge: 0,
    placedAt: '2026-04-14T09:15:00Z',
    status: 'delivered',
    companyName: 'TechFlow GmbH',
    companyEmail: 'office@techflow.de',
    haccpChecked: true,
    invoiceTotal: 187.50,
  },
  {
    id: 'ORD-2026-0040',
    items: [
      { item: PANTRY_ITEMS[0], quantity: 3 },
      { item: PANTRY_ITEMS[3], quantity: 2 },
      { item: PANTRY_ITEMS[10], quantity: 2 },
      { item: PANTRY_ITEMS[17], quantity: 1 },
      { item: PANTRY_ITEMS[23], quantity: 2 },
      { item: PANTRY_ITEMS[36], quantity: 1 },
    ],
    deliveryType: 'specific_time',
    deliveryDate: '2026-04-16',
    deliveryTimeWindow: '08:00 - 09:00',
    companyAddress: '123 Business Rd, Berlin',
    surcharge: 89,
    placedAt: '2026-04-13T07:30:00Z',
    status: 'invoiced',
    companyName: 'TechFlow GmbH',
    companyEmail: 'office@techflow.de',
    haccpChecked: true,
    invoiceTotal: 312.40,
  },
  {
    id: 'ORD-2026-0039',
    items: [
      { item: PANTRY_ITEMS[1], quantity: 2 },
      { item: PANTRY_ITEMS[9], quantity: 4 },
      { item: PANTRY_ITEMS[15], quantity: 2 },
    ],
    deliveryType: 'standard',
    deliveryDate: '2026-04-17',
    companyAddress: '99 Leaf Ave, Munich',
    surcharge: 0,
    placedAt: '2026-04-11T10:00:00Z',
    status: 'delivered',
    companyName: 'GreenLeaf Consulting',
    companyEmail: 'pantry@greenleaf.eu',
    haccpChecked: true,
    invoiceTotal: 145.00,
  },
  {
    id: 'ORD-2026-0042',
    items: [
      { item: PANTRY_ITEMS[4], quantity: 1 },
      { item: PANTRY_ITEMS[16], quantity: 2 },
      { item: PANTRY_ITEMS[20], quantity: 1 },
      { item: PANTRY_ITEMS[24], quantity: 3 },
      { item: PANTRY_ITEMS[31], quantity: 1 },
    ],
    deliveryType: 'standard',
    deliveryDate: '2026-04-18',
    companyAddress: '42 Pixel St, Hamburg',
    surcharge: 0,
    placedAt: '2026-04-15T08:45:00Z',
    status: 'confirmed',
    companyName: 'PixelWorks AG',
    companyEmail: 'office@pixelworks.de',
  },
  {
    id: 'ORD-2026-0043',
    items: [
      { item: PANTRY_ITEMS[0], quantity: 4 },
      { item: PANTRY_ITEMS[2], quantity: 2 },
      { item: PANTRY_ITEMS[8], quantity: 5 },
      { item: PANTRY_ITEMS[10], quantity: 3 },
      { item: PANTRY_ITEMS[15], quantity: 2 },
      { item: PANTRY_ITEMS[19], quantity: 2 },
      { item: PANTRY_ITEMS[24], quantity: 1 },
      { item: PANTRY_ITEMS[30], quantity: 2 },
      { item: PANTRY_ITEMS[35], quantity: 1 },
    ],
    deliveryType: 'specific_time',
    deliveryDate: '2026-04-19',
    deliveryTimeWindow: '09:00 - 10:00',
    companyAddress: '123 Business Rd, Berlin',
    surcharge: 89,
    placedAt: '2026-04-15T06:20:00Z',
    status: 'pending',
    companyName: 'TechFlow GmbH',
    companyEmail: 'office@techflow.de',
  },
];

export const DEMO_COMPANIES = [
  { name: 'TechFlow GmbH',       email: 'office@techflow.de' },
  { name: 'GreenLeaf Consulting', email: 'pantry@greenleaf.eu' },
  { name: 'PixelWorks AG',        email: 'office@pixelworks.de' },
  { name: 'Momentum Ventures',    email: 'ops@momentum.vc' },
];
