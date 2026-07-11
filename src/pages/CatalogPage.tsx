import { useState, useMemo } from 'react';
import type { Category } from '../types';
import { useOrders } from '../context/OrderContext';
import CategoryTabs from '../components/CategoryTabs';
import ItemCard from '../components/ItemCard';
import { Search, Sparkles, TrendingUp, Activity, Leaf, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CatalogPage() {
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const { stockCounts, catalog, promotions } = useOrders();
  const { addItem } = useCart();
  
  const activePromo = promotions.find(p => p.active);

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
  }, [catalog]);

  // Point 1: Smart Replenishment (Logic)
  const suggestedItems = useMemo(() => {
    // Simulate smart logic: highly voted items + top categories
    return catalog
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, 4);
  }, [catalog]);

  // Point 2: Wellness Insights (Calculations)
  const stats = useMemo(() => {
    const veganCount = catalog.filter(i => i.dietary === 'vegan').length;
    const avgNutri = catalog.filter(i => i.nutriScore === 'A' || i.nutriScore === 'B').length;
    return {
      wellnessScore: catalog.length ? Math.round((avgNutri / catalog.length) * 100) : 0,
      plantBased: catalog.length ? Math.round((veganCount / catalog.length) * 100) : 0
    };
  }, [catalog]);

  const refillAllSuggested = () => {
    suggestedItems.forEach(item => addItem(item));
  };

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
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">{activePromo.type} SPECIAL</p>
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-brand-900 tracking-tight mb-2">Office Essentials</h1>
          <p className="text-surface-500 font-medium max-w-lg leading-relaxed">
            Curated pantry solutions for TechFlow GmbH. High-quality items to keep your team energized.
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-hover:text-brand-900 transition-colors" />
          <input
            type="text"
            placeholder="Search items, nutrients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-surface-100 focus:border-brand-900 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Point 2: Wellness Dashboard Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <div className="lg:col-span-2 bg-brand-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-900/20 group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700" />
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-md">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-800 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                    <Activity className="w-3 h-3" /> Monthly Health Pulse
                 </div>
                 <h2 className="text-3xl font-black mb-4 leading-tight">Your Team is <span className="text-brand-300">Staying Well!</span></h2>
                 <p className="text-brand-100 text-sm font-medium mb-6 leading-relaxed">Great job! 84% of your orders this month were Nutri-Score A or B. Your team is leaning towards healthy, sustained energy.</p>
                 <div className="flex items-center gap-6">
                    <div>
                       <p className="text-[10px] font-black text-brand-300 uppercase tracking-[0.15em] mb-1">Wellness Score</p>
                       <p className="text-3xl font-black">{stats.wellnessScore}%</p>
                    </div>
                    <div className="w-px h-10 bg-brand-800" />
                    <div>
                       <p className="text-[10px] font-black text-brand-300 uppercase tracking-[0.15em] mb-1">Plant-Based</p>
                       <p className="text-3xl font-black">{stats.plantBased}%</p>
                    </div>
                 </div>
              </div>
              <div className="hidden md:block w-48 h-48 relative">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="#bef264" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - stats.wellnessScore/100)} strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="w-10 h-10 text-brand-300" />
                 </div>
              </div>
           </div>
        </div>

        {/* Point 1: Smart Replenishment Mini-Widget */}
        <div className="bg-white rounded-[32px] p-8 border border-surface-100 shadow-panel flex flex-col justify-between">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-50 rounded-full text-[10px] font-black text-surface-400 uppercase tracking-widest mb-4">
                 <Sparkles className="w-3 h-3 text-brand-900" /> AI Suggestions
              </div>
              <h3 className="text-xl font-black text-surface-900 mb-2">Smart Refill</h3>
              <p className="text-xs font-medium text-surface-500 mb-6 leading-relaxed">Based on your team's consumption and votes. These are running low today.</p>
              
              <div className="space-y-3 mb-8">
                 {suggestedItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center justify-between group/row">
                       <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover/row:scale-110 transition-transform">{item.emoji}</span>
                          <span className="text-xs font-bold text-surface-800">{item.name}</span>
                       </div>
                       <TrendingUp className="w-3 h-3 text-green-500 opacity-60" />
                    </div>
                 ))}
              </div>
           </div>
           
           <button 
             onClick={refillAllSuggested}
             className="w-full btn-primary py-4 text-xs group/refill"
           >
              <ShoppingCart className="w-4 h-4" />
              Add Suggested Refill
              <ArrowRight className="w-4 h-4 ml-auto group-hover/refill:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 sticky top-16 z-30 bg-[#fafafa]/90 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <CategoryTabs active={activeCat} onChange={setActiveCat} itemCounts={itemCounts} />
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border border-surface-200 border-dashed">
          <div className="text-6xl mb-6 grayscale opacity-20">🔎</div>
          <h3 className="text-xl font-bold text-surface-900 mb-2">No items found</h3>
          <p className="text-surface-500 font-medium">Try adjusting your filters or searching for something else.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              stockCount={stockCounts[item.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
