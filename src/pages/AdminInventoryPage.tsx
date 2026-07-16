import { useState, useMemo, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import CategoryTabs from '../components/CategoryTabs';
import type { Category, PantryItem } from '../types';
import { ref, set, update } from 'firebase/database';
import { db } from '../firebase';
import { Bot, Plus, X, UploadCloud, Loader2, Minus, Trash2, Save, RotateCcw, Euro, Pencil, Search } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormData = {
  name: string;
  brand: string;
  category: Category;
  unit: string;
  dietary: string;
  nutriScore: string;
  description: string;
  stockCount: string;
  imageUrl: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  brand: '',
  category: 'snacks',
  unit: '',
  dietary: 'none',
  nutriScore: 'B',
  description: '',
  stockCount: '0',
  imageUrl: '',
};

const CATEGORIES: Category[] = ['dairy', 'bakery', 'drinks', 'snacks', 'fruits', 'essentials'];
const DIETARY_OPTIONS = ['none', 'vegan', 'vegetarian', 'gluten-free', 'lactose-free'];
const NUTRI_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminInventoryPage() {
  const { stockCounts, updateStockCount, catalog, addCatalogItem, removeCatalogItem } = useOrders();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');

  // Local price state: { [itemId]: string } Ã¢ÂÂ editable string while typing
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});

  // AI Scan Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Edit states (inline stock count)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCount, setTempCount] = useState<string>('');

  // Bulk reset confirmation
  const [resetting, setResetting] = useState(false);

  // Add/Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null); // null = add mode
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const _baseItems = useMemo(() => {
    return catalog.filter(item => activeCat === 'all' || item.category === activeCat);
  }, [activeCat, catalog]);
  const filteredItems = !search.trim() ? _baseItems : _baseItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.brand || '').toLowerCase().includes(search.toLowerCase()));

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  // ---------------------------------------------------------------------------
  // Handlers Ã¢ÂÂ existing
  // ---------------------------------------------------------------------------

  const handlePriceBlur = (itemId: string) => {
    const raw = localPrices[itemId];
    if (raw === undefined) return;
    const parsed = parseFloat(raw);
    const price = isNaN(parsed) ? null : Math.max(0, parsed);
    update(ref(db, `catalog/${itemId}`), { price });
  };

  const handleResetAllStock = async () => {
    if (!window.confirm('Reset ALL stock counts to 50? This cannot be undone.')) return;
    setResetting(true);
    const batch: Record<string, number> = {};
    catalog.forEach(item => { batch[item.id] = 50; });
    await set(ref(db, 'stockCounts'), batch);
    setResetting(false);
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        name: 'Guacamole Dip (Fresh)',
        category: 'snacks',
        unit: 'pack (200g)',
        emoji: 'Ã°ÂÂ¥Â',
        dietary: 'vegan',
        allergens: ['Garlic', 'Onion'],
        stockCount: 20,
      });
    }, 2000);
  };

  const handleConfirmAdd = () => {
    if (!scanResult) return;
    addCatalogItem({
      id: `itm-${Date.now()}`,
      ...scanResult,
      inStock: true,
    });
    setShowAddModal(false);
    setScanResult(null);
  };

  const startEdit = (item: PantryItem) => {
    setEditingId(item.id);
    setTempCount(stockCounts[item.id]?.toString() || '0');
  };

  const saveEdit = (id: string) => {
    const val = parseInt(tempCount);
    if (!isNaN(val)) {
      updateStockCount(id, val);
    }
    setEditingId(null);
  };

  // ---------------------------------------------------------------------------
  // Handlers Ã¢ÂÂ Add/Edit Item Modal
  // ---------------------------------------------------------------------------

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setFormData(prev => ({ ...prev, imageUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleImageFile(item.getAsFile()!);
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setShowItemModal(true);
  };

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      brand: item.brand || '',
      category: item.category,
      unit: item.unit || '',
      dietary: item.dietary || 'none',
      nutriScore: item.nutriScore || 'B',
      description: item.description || '',
      stockCount: String(stockCounts[item.id] ?? 0),
      imageUrl: item.imageUrl || '',
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim()) return;
    setIsSavingItem(true);

    try {
      if (editingItem) {
        // Edit existing item
        const updates: Record<string, any> = {
          name: formData.name.trim(),
          brand: formData.brand.trim(),
          category: formData.category,
          unit: formData.unit.trim(),
          dietary: formData.dietary,
          nutriScore: formData.nutriScore,
          description: formData.description.trim(),
        };
        if (formData.imageUrl) updates.imageUrl = formData.imageUrl;
        await update(ref(db, `catalog/${editingItem.id}`), updates);
        const newCount = parseInt(formData.stockCount);
        if (!isNaN(newCount)) {
          await set(ref(db, `stockCounts/${editingItem.id}`), newCount);
        }
      } else {
        // Add new item
        const id = `${formData.brand.toLowerCase().replace(/\s+/g, '_')}_${formData.name.toLowerCase().replace(/\s+/g, '-')}`;
        const newItem = {
          id,
          name: formData.name.trim(),
          brand: formData.brand.trim(),
          category: formData.category,
          unit: formData.unit.trim(),
          dietary: formData.dietary,
          nutriScore: formData.nutriScore,
          description: formData.description.trim(),
          imageUrl: formData.imageUrl || '',
          inStock: true,
        };
        await set(ref(db, `catalog/${id}`), newItem);
        const newCount = parseInt(formData.stockCount);
        await set(ref(db, `stockCounts/${id}`), isNaN(newCount) ? 0 : newCount);
        addCatalogItem(newItem as any);
      }
      setShowItemModal(false);
    } finally {
      setIsSavingItem(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-2">Inventory Management</h1>
          <p className="text-surface-500 font-medium">Control stock levels, prices, and expand your catalog with AI.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk stock reset */}
          <button
            onClick={handleResetAllStock}
            disabled={resetting}
            className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            title="Set every item's stock to 50"
          >
            {resetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Reset All Stock to 50
          </button>

          {/* Add New Item button */}
          <button
            onClick={openAddModal}
            className="btn-primary bg-green-600 hover:bg-green-700 shadow-green-600/20 hover:shadow-green-600/30"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Item
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary shadow-brand-900/10 hover:shadow-brand-900/20"
          >
            <Bot className="w-5 h-5 mr-2" />
            AI Stock Scan
          </button>
        </div>
      </div>

      <div className="mb-8 p-1 bg-surface-100 rounded-2xl inline-block">
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or brandâ¦"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <CategoryTabs active={activeCat} onChange={setActiveCat} itemCounts={itemCounts} />
      </div>

      <div className="card border-none bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden rounded-[32px]">
        <div className="divide-y divide-surface-100">
          {filteredItems.length === 0 ? (
            <div className="p-24 text-center flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-surface-50 flex items-center justify-center text-4xl mb-6 grayscale opacity-40">Ã°ÂÂÂ¦</div>
              <p className="font-bold text-surface-900 text-lg">No items cataloged here.</p>
              <p className="text-sm text-surface-500 mt-2 max-w-xs leading-relaxed">Switch categories or use the AI Scanner above to add new products to your pantry.</p>
            </div>
          ) : filteredItems.map(item => {
            const count = stockCounts[item.id] || 0;
            const isEditing = editingId === item.id;
            const priceDisplay = localPrices[item.id] !== undefined
              ? localPrices[item.id]
              : ((item as any).price !== undefined && (item as any).price !== null ? String((item as any).price) : '');

            return (
              <div key={item.id} className={`flex items-center justify-between p-6 transition-all duration-300 ${count > 0 ? 'hover:bg-brand-50/30' : 'bg-red-50/20'}`}>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-surface-50 border border-surface-100 flex items-center justify-center text-3xl shadow-sm overflow-hidden">
                    {(item as any).imageUrl ? (
                      <img src={(item as any).imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      (item as any).emoji
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 tracking-tight">{item.name}</h3>
                    <p className="text-[11px] font-black text-brand-700 uppercase tracking-widest mt-1">
                      {item.category} Ã¢ÂÂ¢ {item.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Price field */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Price</span>
                    <div className="flex items-center gap-1 bg-white border border-surface-200 rounded-xl px-2.5 py-1.5 hover:border-brand-300 transition-colors shadow-sm">
                      <Euro className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={priceDisplay}
                        onChange={e => setLocalPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onBlur={() => handlePriceBlur(item.id)}
                        className="w-16 text-sm font-bold text-brand-900 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Stock Control */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Inventory Level</span>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 animate-scale-in">
                          <input
                            type="number"
                            value={tempCount}
                            onChange={(e) => setTempCount(e.target.value)}
                            className="w-24 px-4 py-2.5 border-2 border-brand-900 rounded-xl text-base font-black text-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                          />
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-2.5 bg-brand-900 text-white rounded-xl hover:bg-brand-800 transition-all shadow-md active:scale-90"
                            title="Save changes"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white px-2 py-2 rounded-2xl border border-surface-200 shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
                          <button
                            onClick={() => updateStockCount(item.id, count - 1)}
                            className="w-10 h-10 flex items-center justify-center bg-surface-100 text-surface-600 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                            title="Decrease stock"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <div
                            onClick={() => startEdit(item)}
                            className={`min-w-[64px] px-2 text-center text-xl font-black cursor-pointer hover:text-brand-900 transition-colors ${count === 0 ? 'text-red-500' : 'text-brand-900'}`}
                            title="Click to type number"
                          >
                            {count}
                          </div>
                          <button
                            onClick={() => updateStockCount(item.id, count + 1)}
                            className="w-10 h-10 flex items-center justify-center bg-brand-900 text-white rounded-xl hover:bg-brand-800 transition-all active:scale-90"
                            title="Increase stock"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-3 text-surface-400 hover:text-brand-900 hover:bg-brand-50 rounded-2xl transition-all active:scale-90"
                      title="Edit item"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] font-black text-surface-400 uppercase tracking-tighter">Edit</span>
                  </div>

                  {/* Remove */}
                  <div className="border-l border-surface-100 pl-6 flex flex-col items-center gap-1">
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${item.name} from global catalog?`)) {
                          removeCatalogItem(item.id);
                        }
                      }}
                      className="p-3 text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                      title="Delete product"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] font-black text-surface-400 uppercase tracking-tighter">Remove</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Add / Edit Item Modal                                                */}
      {/* ------------------------------------------------------------------- */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up relative text-left max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-surface-100 bg-white flex-shrink-0">
              <h3 className="text-xl font-black text-brand-900 tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  {editingItem ? <Pencil className="w-5 h-5 text-brand-900" /> : <Plus className="w-5 h-5 text-brand-900" />}
                </div>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-surface-50 text-surface-400 hover:text-brand-900 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto flex-1 space-y-5">

              {/* Image upload area */}
              <div>
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 block">
                  Product Image
                </label>
                <div
                  className="border-2 border-dashed border-surface-200 rounded-2xl p-6 text-center hover:border-brand-900 transition-colors cursor-pointer relative"
                  onPaste={handlePaste}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.imageUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-2xl border border-surface-100 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, imageUrl: '' })); }}
                        className="text-xs text-red-500 font-bold hover:underline"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-surface-400">
                      <UploadCloud className="w-8 h-8" />
                      <p className="text-sm font-semibold">Click to upload or paste image</p>
                      <p className="text-xs">PNG, JPG, WEBP Ã¢ÂÂ stored as base64</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                </div>
              </div>

              {/* Row: Name + Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Oat Milk"
                    className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Oatly"
                    className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row: Category + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Category }))}
                    className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g. 500ml, 100g, 1 pack"
                    className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row: Dietary + Nutri-Score */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Dietary</label>
                  <select
                    value={formData.dietary}
                    onChange={e => setFormData(prev => ({ ...prev, dietary: e.target.value }))}
                    className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors bg-white"
                  >
                    {DIETARY_OPTIONS.map(d => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Nutri-Score</label>
                  <select
                    value={formData.nutriScore}
                    onChange={e => setFormData(prev => ({ ...prev, nutriScore: e.target.value }))}
                    className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors bg-white"
                  >
                    {NUTRI_OPTIONS.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short product description..."
                  rows={3}
                  className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors resize-none"
                />
              </div>

              {/* Stock Count */}
              <div>
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5 block">Stock Count</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockCount}
                  onChange={e => setFormData(prev => ({ ...prev, stockCount: e.target.value }))}
                  className="w-full border-2 border-surface-100 focus:border-brand-900 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-surface-100 flex items-center justify-end gap-3 flex-shrink-0 bg-white">
              <button
                onClick={() => setShowItemModal(false)}
                className="btn-secondary py-2.5 px-5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={isSavingItem || !formData.name.trim()}
                className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingItem ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* AI Scan Modal                                                        */}
      {/* ------------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up relative text-left">
            <div className="flex items-center justify-between px-8 py-6 border-b border-surface-100 bg-white">
              <h3 className="text-xl font-black text-brand-900 tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-brand-900" />
                </div>
                AI Stock Pulse
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setScanResult(null); }}
                className="w-10 h-10 flex items-center justify-center bg-surface-50 text-surface-400 hover:text-brand-900 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {!scanResult ? (
                <div
                  className={`border-[3px] border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${isScanning ? 'border-brand-900 bg-brand-50 animate-pulse' : 'border-surface-200 hover:border-brand-900 hover:bg-surface-50'}`}
                  onClick={!isScanning ? handleSimulateScan : undefined}
                >
                  {isScanning ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-12 h-12 text-brand-900 animate-spin mb-4" />
                      <p className="text-sm font-black text-brand-900 uppercase tracking-widest">Vision AI Processing...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-12 h-12 text-brand-900/30 mb-4" />
                      <p className="text-base font-bold text-surface-900">Upload Package Frame</p>
                      <p className="text-xs text-surface-500 font-medium mt-1 leading-relaxed max-w-[200px]">AI auto-extracts weight, name, dietary tags & initial count.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="flex items-center gap-3 text-brand-900">
                    <div className="w-2 h-2 rounded-full bg-brand-900 animate-ping" />
                    <p className="text-xs font-black uppercase tracking-widest">Product Identified</p>
                  </div>
                  <div className="flex items-center gap-6 p-5 bg-surface-50 rounded-3xl border border-surface-100">
                    <div className="w-20 h-20 bg-white border border-surface-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                      {scanResult.emoji}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-brand-900 tracking-tight">{scanResult.name}</h4>
                      <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">{scanResult.category} Ã¢ÂÂ¢ {scanResult.unit}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmAdd}
                    className="w-full btn-primary py-5 flex justify-center mt-4 text-base"
                  >
                    Confirm & Catalog ({scanResult.stockCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
