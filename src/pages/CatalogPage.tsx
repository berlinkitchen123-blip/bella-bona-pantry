import { useState, useMemo } from 'react';
import type {  Category  } from '../types';

import { useOrders } from '../context/OrderContext';
import CategoryTabs from '../components/CategoryTabs';
import ItemCard from '../components/ItemCard';
import { Search } from 'lucide-react';

export default function CatalogPage() {
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const { inventory, catalog } = useOrders();

  const filteredItems = useMemo(() => {
    return catalog.filter(item => {
      const matchCat = activeCat === 'all' || item.category === activeCat;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCat, search, catalog]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 mb-1">Company Pantry</h1>
          <p className="text-surface-500 text-sm">Select items to stock up for next week.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 bg-white"
          />
        </div>
      </div>

      <div className="mb-6 sticky top-16 z-30 bg-[#fafafa]/90 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <CategoryTabs active={activeCat} onChange={setActiveCat} itemCounts={itemCounts} />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-surface-200 border-dashed">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-semibold text-surface-800 mb-1">No items found</h3>
          <p className="text-sm text-surface-500">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              inStock={inventory[item.id] !== false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
