import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PantryItem } from '../types';
import { useCart } from '../context/CartContext';
import { Minus, Plus, AlertCircle, Info, ThumbsUp, X, Activity, Leaf, Heart, Wheat, Droplets, Calendar } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { thumbnailUrl } from '../lib/imageProxy';

interface Props {
  item: PantryItem;
  stockCount: number;
  index?: number;
}

export default function ItemCard({ item, stockCount, index = 0 }: Props) {
  const inStock = stockCount > 0;
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);
  const [showInfo, setShowInfo] = useState(false);
  const [voted, setVoted] = useState(false);

  const catInfo = CATEGORIES.find(c => c.key === item.category);
  const bgColor = catInfo?.color || '#f5f5f5';

  const nutriColors: Record<string, string> = {
    'A': 'bg-green-600', 'B': 'bg-lime-500', 'C': 'bg-yellow-400',
    'D': 'bg-orange-500', 'E': 'bg-red-600'
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
        whileHover={inStock ? { y: -4, transition: { duration: 0.2 } } : {}}
        className={`bg-white rounded-3xl border border-surface-100 shadow-sm transition-shadow duration-300 overflow-hidden group relative ${
          !inStock ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]'
        } ${quantity > 0 ? 'ring-2 ring-brand-900 ring-offset-4' : ''}`}
      >
        {/* Nutri-Score & Info */}
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

        {/* Image */}
        <div
          className="relative h-32 flex items-center justify-center bg-surface-50"
          style={{ backgroundColor: inStock ? `${bgColor}15` : '#f5f5f5' }}
        >
          {item.imageUrl ? (
            <motion.img
              src={thumbnailUrl(item.imageUrl)}
              alt={item.name}
              loading="lazy"
              decoding="async"
              width={128}
              height={128}
              className="w-full h-full object-cover rounded-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <motion.span
              className="text-6xl filter drop-shadow-xl"
              whileHover={{ scale: 1.15, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {item.emoji}
            </motion.span>
          )}

          <AnimatePresence>
            {quantity > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute -bottom-3 right-4 h-7 px-3 bg-brand-900 text-white text-[10px] font-black rounded-xl flex items-center justify-center shadow-lg border-2 border-white"
              >
                {quantity} SELECTED
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
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
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="px-2 py-0.5 rounded-md bg-brand-900 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
              >
                <Heart className="w-2.5 h-2.5 fill-current" /> Voted!
              </motion.span>
            ) : (
              <button
                onClick={() => setVoted(true)}
                className="px-2 py-0.5 rounded-md bg-surface-50 text-surface-400 hover:text-brand-900 hover:bg-brand-50 text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
              >
                <ThumbsUp className="w-2.5 h-2.5" /> {item.votes || 0}
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="relative h-11 overflow-hidden rounded-2xl">
            {!inStock ? (
              <div className="w-full h-full bg-surface-50 text-surface-400 text-[10px] font-black uppercase flex items-center justify-center border-2 border-dashed border-surface-200">
                Temporarily Sold Out
              </div>
            ) : quantity === 0 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => addItem(item)}
                className="w-full h-full bg-surface-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-900 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Quick Add
              </motion.button>
            ) : (
              <div className="flex items-center justify-between w-full h-full bg-brand-50 rounded-2xl px-1 border border-brand-100">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => removeItem(item.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-brand-900 shadow-sm"
                >
                  <Minus className="w-4 h-4 stroke-[3px]" />
                </motion.button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-sm font-black text-brand-900 tabular-nums"
                >
                  {quantity}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => addItem(item)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-md"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-32 flex items-center justify-center text-7xl" style={{ backgroundColor: `${bgColor}25` }}>
                {item.emoji}
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-surface-400 hover:text-brand-900 transition-colors shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-8">
                <h3 className="text-2xl font-black text-brand-900 tracking-tight leading-none mb-2">{item.name}</h3>
                <p className="text-sm font-bold text-surface-400 uppercase tracking-widest mb-6">{item.category} · {item.unit}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Energy', value: `${item.calories || 0} kcal` },
                    { label: 'Protein', value: `${item.protein || 0}g` },
                    { label: 'Carbs', value: `${item.sugar || 0}g sugar` },
                    { label: 'Fiber', value: `${item.fiber || 0}g` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface-50 p-4 rounded-2xl border border-surface-100">
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-lg font-black text-brand-900">{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowInfo(false)} className="btn-primary w-full py-3">Got it</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
