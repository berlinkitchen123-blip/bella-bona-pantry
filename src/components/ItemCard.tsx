import type {  PantryItem  } from '../types';
import { useCart } from '../context/CartContext';
import { Minus, Plus, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

interface Props {
  item: PantryItem;
  stockCount: number;
}

export default function ItemCard({ item, stockCount }: Props) {
  const inStock = stockCount > 0;

  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);
  const catInfo = CATEGORIES.find(c => c.key === item.category);
  const bgColor = catInfo?.color || '#f5f5f5';

  return (
    <div
      className={`bg-white rounded-3xl border border-surface-100 shadow-sm transition-all duration-500 overflow-hidden group ${
        !inStock ? 'opacity-60 grayscale-[0.5] pointer-events-none' : 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1'
      } ${quantity > 0 ? 'ring-2 ring-brand-900 ring-offset-4' : ''}`}
    >
      {/* Out of stock label */}
      {!inStock && (
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-red-50 text-red-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-red-100">Sold Out</span>
        </div>
      )}

      {/* Visual Area */}
      <div
        className="relative h-32 flex items-center justify-center transition-all duration-700 bg-surface-50 group-hover:bg-opacity-50"
        style={{ backgroundColor: inStock ? `${bgColor}15` : '#f5f5f5' }}
      >
        <span className="text-6xl filter drop-shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ease-out">
          {item.emoji}
        </span>

        {/* Selected quantity floating badge */}
        {quantity > 0 && (
          <div className="absolute -bottom-3 right-4 h-8 px-3 bg-brand-900 text-white text-xs font-black rounded-xl flex items-center justify-center shadow-lg animate-bounce-in border-2 border-white">
            {quantity} in basket
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
          <p className="text-[11px] font-bold text-surface-400">{item.unit}</p>
        </div>

        {/* Badges/Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5 min-h-[22px]">
          {item.dietary === 'vegan' && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider">Vegan</span>}
          {item.dietary === 'vegetarian' && <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider">Veg</span>}
          {item.dietary === 'meat' && <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-wider">Meat</span>}
          
          {stockCount > 0 && stockCount < 10 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider animate-pulse border border-amber-100">
               <AlertCircle className="w-2.5 h-2.5" /> {stockCount} left
            </span>
          )}
        </div>

        {/* Dynamic Controls */}
        <div className="relative h-11 overflow-hidden rounded-2xl">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="w-full h-full bg-surface-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-900 transition-all flex items-center justify-center gap-2 group/btn"
              id={`add-${item.id}`}
            >
              <Plus className="w-4 h-4 transition-transform group-hover/btn:scale-125" />
              Add to Basket
            </button>
          ) : (
            <div className="flex items-center justify-between w-full h-full bg-brand-50 rounded-2xl px-1 border border-brand-100">
              <button
                onClick={() => removeItem(item.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-white text-brand-900 shadow-sm hover:shadow transition-all active:scale-90"
                id={`minus-${item.id}`}
              >
                <Minus className="w-4 h-4 stroke-[3px]" />
              </button>
              
              <span className="text-sm font-black text-brand-900 tabular-nums">{quantity}</span>
              
              <button
                onClick={() => addItem(item)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm hover:shadow-lg transition-all active:scale-95"
                id={`plus-${item.id}`}
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
              </button>
            </div>
          )}
        </div>

        {/* Nutritional Warning Footer */}
        {item.allergens && item.allergens.length > 0 && (
          <p className="mt-3 text-[9px] font-bold text-surface-400 italic">
            Contains: {item.allergens.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
