import { useState, useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import CategoryTabs from '../components/CategoryTabs';
import type { Category, PantryItem } from '../types';
import { Bot, Plus, X, UploadCloud, Loader2, Minus, Trash2, Save } from 'lucide-react';

export default function AdminInventoryPage() {
  const { stockCounts, updateStockCount, catalog, addCatalogItem, removeCatalogItem } = useOrders();
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCount, setTempCount] = useState<string>('');

  const filteredItems = useMemo(() => {
    return catalog.filter(item => activeCat === 'all' || item.category === activeCat);
  }, [activeCat, catalog]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [catalog]);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        name: 'Guacamole Dip (Fresh)',
        category: 'snacks',
        unit: 'pack (200g)',
        emoji: '🥑',
        dietary: 'vegan',
        allergens: ['Garlic', 'Onion'],
        stockCount: 20
      });
    }, 2000);
  };

  const handleConfirmAdd = () => {
    if(!scanResult) return;
    addCatalogItem({
      id: `itm-${Date.now()}`,
      ...scanResult,
      inStock: true
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-2">Inventory Management</h1>
          <p className="text-surface-500 font-medium">Control stock levels and expand your catalog with AI.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary shadow-brand-900/10 hover:shadow-brand-900/20"
        >
          <Bot className="w-5 h-5 mr-2" />
          AI Stock Scan
        </button>
      </div>

      <div className="mb-8 p-1 bg-surface-100 rounded-2xl inline-block">
        <CategoryTabs active={activeCat} onChange={setActiveCat} itemCounts={itemCounts} />
      </div>

      <div className="card border-none bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden rounded-[32px]">
        <div className="divide-y divide-surface-100">
          {filteredItems.length === 0 ? (
            <div className="p-24 text-center flex flex-col items-center animate-fade-in">
               <div className="w-20 h-20 rounded-full bg-surface-50 flex items-center justify-center text-4xl mb-6 grayscale opacity-40">📦</div>
               <p className="font-bold text-surface-900 text-lg">No items cataloged here.</p>
               <p className="text-sm text-surface-500 mt-2 max-w-xs leading-relaxed">Switch categories or use the AI Scanner above to add new products to your pantry.</p>
            </div>
          ) : filteredItems.map(item => {
            const count = stockCounts[item.id] || 0;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={`flex items-center justify-between p-6 transition-all duration-300 ${count > 0 ? 'hover:bg-brand-50/30' : 'bg-red-50/20'}`}>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-surface-50 border border-surface-100 flex items-center justify-center text-3xl shadow-sm group-hover:scale-105 transition-transform">
                    {item.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 tracking-tight">{item.name}</h3>
                    <p className="text-[11px] font-black text-brand-700 uppercase tracking-widest mt-1">
                      {item.category} • {item.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {/* Stock Control Unit */}
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
                        <div className="flex items-center gap-2 bg-white px-2 py-2 rounded-2xl border border-surface-200 shadow-sm transition-all hover:border-brand-300 hover:shadow-md group">
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

                  {/* Removal Action */}
                  <div className="border-l border-surface-100 pl-6 flex flex-col items-center gap-1">
                     <button
                        onClick={() => {
                          if(window.confirm(`Remove ${item.name} from global catalog?`)) {
                            removeCatalogItem(item.id);
                          }
                        }}
                        className="p-3 text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90 group/trash"
                        title="Delete product"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <span className="text-[9px] font-black text-surface-400 group-hover:text-red-500 transition-colors uppercase tracking-tighter">Remove</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Scan Modal */}
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
                    <div className="w-20 h-20 bg-white border border-surface-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">
                      {scanResult.emoji}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-brand-900 tracking-tight">{scanResult.name}</h4>
                      <p className="text-xs font-bold text-brand-700 uppercase tracking-wider">{scanResult.category} • {scanResult.unit}</p>
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
