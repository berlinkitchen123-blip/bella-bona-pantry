import { useState } from 'react';
import type { PantryItem } from '../types';
import { useCart } from '../context/CartContext';
import { Minus, Plus, AlertCircle, Info, ThumbsUp, X, Activity, Leaf, Heart, Wheat, Droplets, Calendar } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { thumbnailUrl } from '../lib/imageProxy';

interface Props {
  item: PantryItem;
  stockCount: number;
}

export default function ItemCard({ item, stockCount }: Props) {
  const inStock = stockCount > 0;
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);
  const [showInfo, setShowInfo] = useState(false);
  const [voted, setVoted] = useState(false);

  const catInfo = CATEGORIES.find(c => c.key === item.category);
  const bgColor = catInfo?.color || '#f5f5f5';

  const nutriColors: Record<string, string> = {
    'A': 'bg-green-600',
    'B': 'bg-lime-500',
    'C': 'bg-yellow-400',
    'D': 'bg-orange-500',
    'E': 'bg-red-600'
  };

  return (
    <>
      <div
        className={`bg-white rounded-3xl border border-surface-100 shadow-sm transition-all duration-500 overflow-hidden group relative ${
          !inStock ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1'
        } ${quantity > 0 ? 'ring-2 ring-brand-900 ring-offset-4' : ''}`}
      >
        {/* Nutri-Score & Info Trigger */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          {item.nutriScore && (
            <div className={`${nutriColors[item.nutriScore]} text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-sm border border-white/20`}>
              {item.nutriScore}
            </div>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm text-surface-400 hover:text-brand-900 rounded-lg flex items-center justify-center shadow-sm transition-colors border border-surface-100"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Area */}
        <div
          className="relative h-32 flex items-center justify-center transition-all duration-700 bg-surface-50"
          style={{ backgroundColor: inStock ? `${bgColor}15` : '#f5f5f5' }}
        >
          {item.imageUrl ? (
            <img
              src={thumbnailUrl(item.imageUrl)}
              alt={item.name}
              loading="lazy"
              decoding="async"
              width={128}
              height={128}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <span className="text-6xl filter drop-shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ease-out">
              {item.emoji}
            </span>
          )}

          {quantity > 0 && (
            <div className="absolute -bottom-3 right-4 h-7 px-3 bg-brand-900 text-white text-[10px] font-black rounded-xl flex items-center justify-center shadow-lg animate-bounce-in border-2 border-white">
              {quantity} SELECTED
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5">
          <div className="mb-3">
            <p className="text-[10px] font-black text-brand-700 uppercase tracking-widest mb-1 opacity-60">{item.category}</p>
            <h3 className="font-bold text-surface-900 leading-tight mb-1 h-10 line-clamp-2 font-sans tracking-tight">
              {item.name}
            </h3>
            <div className="flex items-center justify-between">
               <p className="text-[11px] font-bold text-surface-400">{item.unit}</p>
               {item.calories !== undefined && (
                 <span className="text-[10px] font-black text-surface-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> {item.calories} kcal
                 </span>
               )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-5 min-h-[22px]">
            {item.dietary === 'vegan' && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Leaf className="w-2.5 h-2.5" /> Vegan</span>}
            {item.dietary === 'gluten-free' && <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Wheat className="w-2.5 h-2.5" /> GF</span>}
            {item.dietary === 'lactose-free' && <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1"><Droplets className="w-2.5 h-2.5" /> LF</span>}
            
            {stockCount > 0 && stockCount < 10 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider border border-amber-100">
                 <AlertCircle className="w-2.5 h-2.5" /> Low Stock
              </span>
            )}

            {voted ? (
               <span className="px-2 py-0.5 rounded-md bg-brand-900 text-white text-[9px] font-black uppercase tracking-wider animate-scale-in flex items-center gap-1">
                 <Heart className="w-2.5 h-2.5 fill-current" /> Voted!
               </span>
            ) : (
              <button 
                onClick={() => setVoted(true)}
                className="px-2 py-0.5 rounded-md bg-surface-50 text-surface-400 hover:text-brand-900 hover:bg-brand-50 text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 group/vote"
              >
                <ThumbsUp className="w-2.5 h-2.5 group-hover/vote:scale-125 transition-transform" /> {item.votes || 0}
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="relative h-11 overflow-hidden rounded-2xl">
            {!inStock ? (
               <div className="w-full h-full bg-surface-50 text-surface-400 text-[10px] font-black uppercase flex items-center justify-center border-2 border-dashed border-surface-200 bg-diagonal-stripes">
                  Temporarily Sold Out
               </div>
            ) : quantity === 0 ? (
              <button
                onClick={() => addItem(item)}
                className="w-full h-full bg-surface-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-900 transition-all flex items-center justify-center gap-2 group/btn"
              >
                <Plus className="w-4 h-4 transition-transform group-hover/btn:scale-125" />
                Quick Add
              </button>
            ) : (
              <div className="flex items-center justify-between w-full h-full bg-brand-50 rounded-2xl px-1 border border-brand-100">
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-brand-900 shadow-sm hover:shadow active:scale-90"
                >
                  <Minus className="w-4 h-4 stroke-[3px]" />
                </button>
                <span className="text-sm font-black text-brand-900 tabular-nums">{quantity}</span>
                <button
                  onClick={() => addItem(item)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm hover:shadow active:scale-90"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wellness Detail Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-md animate-fade-in" onClick={() => setShowInfo(false)}>
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up relative" onClick={e => e.stopPropagation()}>
            <div 
              className="h-32 flex items-center justify-center text-7xl"
              style={{ backgroundColor: `${bgColor}25` }}
            >
              {item.emoji}
            </div>
            
            <button 
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-surface-400 hover:text-brand-900 transition-colors shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-brand-900 tracking-tight leading-none mb-2">{item.name}</h3>
                  <div className="flex items-center gap-3">
                     <p className="text-sm font-bold text-surface-400 uppercase tracking-widest">{item.category} • {item.unit}</p>
                     {item.bestBefore && (
                       <span className="flex items-center gap-1.5 text-[10px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5" /> Best Before: {item.bestBefore}
                       </span>
                     )}
                  </div>
                </div>
                {item.nutriScore && (
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-surface-300 uppercase mb-1">Nutri-Score</span>
                     <div className={`${nutriColors[item.nutriScore]} text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white`}>
                        {item.nutriScore}
                     </div>
                  </div>
                )}
              </div>

              {/* Nutrition Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 transition-colors hover:bg-white hover:border-brand-200">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Energy / cals</p>
                    <p className="text-lg font-black text-brand-900">{item.calories || 0} kcal</p>
                 </div>
                 <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 transition-colors hover:bg-white hover:border-brand-200">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Protein</p>
                    <p className="text-lg font-black text-brand-900">{item.protein || 0}g</p>
                 </div>
                 <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 transition-colors hover:bg-white hover:border-brand-200">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Carbs / Sugars</p>
                    <p className="text-lg font-black text-brand-900">{item.sugar || 0}g <span className="text-xs opacity-50">Sugar</span></p>
                 </div>
                 <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 transition-colors hover:bg-white hover:border-brand-200">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Fiber</p>
                    <p className="text-lg font-black text-brand-900">{item.fiber || 0}g</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-brand-50 p-6 rounded-3xl border border-brand-100">
                    <h4 className="text-[10px] font-black text-brand-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <ShieldCheckIcon className="w-4 h-4" /> Allergen Checklist
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {item.allergens && item.allergens.length > 0 ? (
                         item.allergens.map(a => (
                           <span key={a} className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 border border-red-100 shadow-sm flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {a}
                           </span>
                         ))
                       ) : (
                         <span className="text-xs font-bold text-green-700 bg-white px-3 py-2 rounded-xl border border-green-100 flex items-center gap-1.5">
                            <CheckCircleIcon className="w-4 h-4" /> No mapped allergens
                         </span>
                       )}
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                       {item.dietary === 'vegan' && <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">100% Vegan</span>}
                       {item.dietary === 'gluten-free' && <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Gluten-Free</span>}
                       {item.dietary === 'lactose-free' && <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Lactose-Free</span>}
                    </div>
                    <button 
                      onClick={() => setShowInfo(false)}
                      className="btn-primary py-3 px-8 text-sm"
                    >
                      Got it
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
         <path d="m9 12 2 2 4-4" />
      </svg>
   )
}

function CheckCircleIcon({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
         <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
   )
}
