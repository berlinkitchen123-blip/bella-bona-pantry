import type {  PantryItem  } from '../types';
import { useCart } from '../context/CartContext';
import { Minus, Plus } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

interface Props {
  item: PantryItem;
  inStock: boolean;
}

export default function ItemCard({ item, inStock }: Props) {
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);
  const catInfo = CATEGORIES.find(c => c.key === item.category);
  const bgColor = catInfo?.color || '#f5f5f5';

  return (
    <div
      className={`card group relative overflow-hidden transition-all duration-300 ${
        !inStock ? 'opacity-50 grayscale pointer-events-none' : 'hover:shadow-card-hover hover:-translate-y-0.5'
      } ${quantity > 0 ? 'ring-2 ring-brand-400 ring-offset-2' : ''}`}
    >
      {/* Out of stock overlay */}
      {!inStock && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-2xl">
          <span className="badge-danger text-sm px-3 py-1">Out of Stock</span>
        </div>
      )}

      {/* Emoji hero area */}
      <div
        className="relative h-28 flex items-center justify-center rounded-t-2xl transition-colors duration-300"
        style={{ backgroundColor: bgColor }}
      >
        <span className="text-5xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
          {item.emoji}
        </span>

        {/* Quantity badge on card */}
        {quantity > 0 && (
          <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-bounce-in">
            {quantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-surface-800 leading-snug mb-1 line-clamp-2">
          {item.name}
        </h3>
        <p className="text-xs text-surface-400 mb-2 flex flex-col gap-1">
          <span>{item.unit}</span>
          <span className="flex items-center gap-1.5 flex-wrap">
            {item.dietary === 'vegan' && <span className="inline-block px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-[9px] font-bold text-green-700 uppercase">Vegan</span>}
            {item.dietary === 'vegetarian' && <span className="inline-block px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-[9px] font-bold text-green-700 uppercase">Veg</span>}
            {item.dietary === 'meat' && <span className="inline-block px-1.5 py-0.5 rounded border border-red-200 bg-red-50 text-[9px] font-bold text-red-700 uppercase">Meat</span>}
            {/* Allergens warning */}
            {item.allergens && item.allergens.length > 0 && (
              <span className="inline-block px-1.5 py-0.5 rounded border border-orange-200 bg-orange-50 text-[9px] font-bold text-orange-700 uppercase">
                ⚠️ {item.allergens.join(', ')}
              </span>
            )}
          </span>
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          {quantity === 0 ? (
            <button
              onClick={() => addItem(item)}
              className="w-full btn-primary text-xs py-2"
              id={`add-${item.id}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-1 w-full">
              <button
                onClick={() => removeItem(item.id)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-600 transition-colors"
                id={`minus-${item.id}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-lg font-bold text-brand-600">{quantity}</span>
              </div>
              <button
                onClick={() => addItem(item)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors"
                id={`plus-${item.id}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
