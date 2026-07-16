import { useState, useMemo } from 'react';
import type { Category } from '../types';
import { useOrders } from '../context/OrderContext';
import CategoryTabs from '../components/CategoryTabs';
import ItemCard from '../components/ItemCard';
import { Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
// @ts-ignore
import Fuse from 'fuse.js';

// ---------------------------------------------------------------------------
// Dietary filter config
// ---------------------------------------------------------------------------

type DietaryFilter = 'all' | 'vegan' | 'vegetarian' | 'gluten-free' | 'lactose-free';

const DIETARY_PILLS: { value: DietaryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'vegan', label: 'ð± Vegan' },
  { value: 'vegetarian', label: 'ð¿ Vegetarian' },
  { value: 'gluten-free', label: 'ð« Gluten-Free' },
  { value: 'lactose-free', label: 'ð¥ Lactose-Free' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CatalogPage() {
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>('all');
  const { stockCounts, catalog, promotions } = useOrders();
  const { totalItems, openCart } = useCart();

  const activePromo = promotions.find(p => p.active);

  // Fuse.js instance â keys cover name, brand and description with threshold 0.3
  const fuse = useMemo(
    () =>
      new Fuse(catalog, {
        keys: ['name', 'brand', 'description'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [catalog]
  );

  const filteredItems = useMemo(() => {
    // Use Fuse for fuzzy search when query is >1 char; otherwise use full catalog
    let base = catalog;
    if (search.trim().length > 1) {
      base = fuse.search(search.trim()).map((r: any) => r.item);
    } else if (search.trim().length === 1) {
      base = catalog.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return base.filter(item => {
      const matchCat = activeCat === 'all' || item.category === activeCat;
      const matchDietary = dietaryFilter === 'all' || item.dietary === dietaryFilter;
      const inStock = (stockCounts[item.id] ?? 0) > 0;
      return matchCat && matchDietary && inStock;
    });
  }, [activeCat, search, dietaryFilter, catalog, fuse, stockCounts]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.forEach(item => {
      if ((stockCounts[item.id] ?? 0) > 0) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [catalog, stockCounts]);

  const handleOpenCart = () => {
    // Prefer the CartContext's openCart if available; also fire a custom event
    // so CartSidebar can listen independently on mobile.
    if (typeof openCart === 'function') {
      openCart();
    } else {
      document.dispatchEvent(new CustomEvent('openCart'));
    }
  };

  const isSearchActive = search.trim().length > 0 || dietaryFilter !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">

      {/* Promotion Banner */}
      {activePromo && (
        <div
          className="mb-10 p-6 rounded-[32px] text-white flex items-center justify-between shadow-lg animate-scale-in relative overflow-hidden"
          style={{ backgroundColor: activePromo.color }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
              {activePromo.emoji}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                {activePromo.type} SPECIAL
              </p>
              <h2 className="text-2xl font-black tracking-tight">{activePromo.title}</h2>
              <p className="text-sm font-medium opacity-90">{activePromo.subtitle}</p>
            </div>
          </div>
          <button className="px-8 py-3 bg-white text-brand-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
            Claim Offer
          </button>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl font-black text-brand-900 tracking-tight mb-2">
            Office Essentials
          </h1>
          <p className="text-surface-500 font-medium max-w-lg leading-relaxed">
            Curated pantry solutions for TechFlow GmbH. High-quality items to keep your team energized.
          </p>
        </div>

      </div>

      {/* Dietary Quick-Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {DIETARY_PILLS.map(pill => (
          <button
            key={pill.value}
            onClick={() => setDietaryFilter(pill.value)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              dietaryFilter === pill.value
                ? 'bg-brand-900 text-white border-brand-900 shadow-sm'
                : 'bg-surface-50 text-surface-600 border-surface-100 hover:border-brand-200 hover:text-brand-800'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Result Count */}
      {isSearchActive && (
        <p className="text-xs font-semibold text-surface-500 mb-8">
          Showing{' '}
          <span className="text-brand-900 font-black">{filteredItems.length}</span>{' '}
          of{' '}
          <span className="font-black">{catalog.length}</span>{' '}
          items
        </p>
      )}

      {!isSearchActive && <div className="mb-8" />}

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          placeholder="Search products, brands..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-surface-200 rounded-2xl pl-12 pr-4 py-3 text-base font-medium outline-none shadow-sm focus:border-brand-900 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 sticky top-16 z-30 bg-[#fafafa]/90 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <CategoryTabs active={activeCat} onChange={setActiveCat} itemCounts={itemCounts} />
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border border-surface-200 border-dashed">
          <div className="text-6xl mb-6 grayscale opacity-20">ð</div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">No items found</h3>
          <p className="text-surface-500 font-medium">
            Try adjusting your filters or searching for something else.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              stockCount={stockCounts[item.id] ?? 0}
            />
          ))}
        </div>
      )}

      {/* Mobile Cart FAB â only shown below sm breakpoint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 sm:hidden">
        <button
          onClick={handleOpenCart}
          className="flex items-center gap-3 bg-brand-900 text-white px-6 py-4 rounded-full shadow-2xl font-black text-sm active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 ? `${totalItems} items Â· View Cart` : 'Cart'}
        </button>
      </div>

    </div>
  );
}
