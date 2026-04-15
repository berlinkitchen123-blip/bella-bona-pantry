import type {  Category  } from '../types';
import { CATEGORIES } from '../data/mockData';

interface Props {
  active: Category | 'all';
  onChange: (cat: Category | 'all') => void;
  itemCounts: Record<string, number>;
}

export default function CategoryTabs({ active, onChange, itemCounts }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All tab */}
      <button
        onClick={() => onChange('all')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
          ${active === 'all'
            ? 'bg-surface-900 text-white shadow-md'
            : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-200'
          }`}
      >
        <span className="text-base">📋</span>
        All
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === 'all' ? 'bg-white/20' : 'bg-surface-100'}`}>
          {Object.values(itemCounts).reduce((a, b) => a + b, 0)}
        </span>
      </button>

      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key as Category)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
            ${active === cat.key
              ? 'bg-surface-900 text-white shadow-md'
              : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-200'
            }`}
        >
          <span className="text-base">{cat.icon}</span>
          {cat.label}
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === cat.key ? 'bg-white/20' : 'bg-surface-100'}`}>
            {itemCounts[cat.key] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}
