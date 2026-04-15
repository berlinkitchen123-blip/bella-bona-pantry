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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 mb-1">Inventory Management</h1>
          <p className="text-surface-500 text-sm">Manage numerical stock levels and add/remove items.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-sm shadow-md"
        >
          <Bot className="w-5 h-5 mr-1.5" />
          Add Item via AI Scan
        </button>
      </div>

      <div className="mb-6">
        <CategoryTabs active={activeCat} onChange={setActiveCat} itemCounts={itemCounts} />
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-surface-100">
          {filteredItems.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center animate-fade-in">
               <div className="text-4xl mb-4 opacity-50">🔍</div>
               <p className="font-bold text-surface-900">No items found in this category.</p>
               <p className="text-sm text-surface-500 mt-1">Try switching tabs or searching for something else.</p>
            </div>
          ) : filteredItems.map(item => {
            const count = stockCounts[item.id] || 0;
            const isEditing = editingId === item.id;

            return (
              <div key={item.id} className={`flex items-center justify-between p-4 transition-colors ${count > 0 ? 'hover:bg-surface-50' : 'bg-red-50/10'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-surface-900">{item.name}</h3>
                    <p className="text-xs text-surface-500 capitalize mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                      {item.category} • {item.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stock Control Unit */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight mr-1">Current Stock</span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1 animate-scale-in">
                          <input
                            type="number"
                            value={tempCount}
                            onChange={(e) => setTempCount(e.target.value)}
                            className="w-20 px-3 py-2 border-2 border-brand-500 rounded-xl text-base font-bold text-surface-900 focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(item.id)}
                          />
                          <button 
                            onClick={() => saveEdit(item.id)}
                            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md active:scale-95 flex items-center justify-center font-bold"
                            title="Save changes"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-2xl border-2 border-surface-200 shadow-sm hover:border-brand-200 transition-all group-hover:shadow-md">
                          <button 
                            onClick={() => updateStockCount(item.id, count - 1)}
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                            title="Decrease stock"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          
                          <div 
                            onClick={() => startEdit(item)}
                            className={`min-w-[60px] px-2 text-center text-xl font-black cursor-pointer hover:text-brand-600 transition-colors ${count === 0 ? 'text-red-500' : 'text-surface-900'}`}
                            title="Click to type number"
                          >
                            {count}
                          </div>

                          <button 
                            onClick={() => updateStockCount(item.id, count + 1)}
                            className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-90"
                            title="Increase stock"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Removal Action */}
                  <div className="flex flex-col items-center gap-1 pt-4">
                     <button
                        onClick={() => {
                          if(window.confirm(`Are you sure you want to remove ${item.name} from the catalog?`)) {
                            removeCatalogItem(item.id);
                          }
                        }}
                        className="p-3 text-surface-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 group/trash shadow-sm hover:shadow-md"
                        title="Delete this product"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <span className="text-[9px] font-bold text-surface-400 group-hover:text-red-400 transition-colors uppercase">Delete</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Scan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up relative text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50">
              <h3 className="font-bold text-surface-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-brand-500" /> AI Product Scanner
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setScanResult(null); }}
                className="text-surface-400 hover:text-surface-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {!scanResult ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isScanning ? 'border-brand-400 bg-brand-50' : 'border-surface-300 hover:border-brand-300 hover:bg-surface-50'}`}
                  onClick={!isScanning ? handleSimulateScan : undefined}
                >
                  {isScanning ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
                      <p className="text-sm font-bold text-brand-700">AI is analyzing image...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-10 h-10 text-surface-400 mb-3" />
                      <p className="text-sm font-bold text-surface-700">Click to Upload Package Photo</p>
                      <p className="text-xs text-surface-500 mt-1">AI will automatically create the item & starting stock</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b pb-4">
                     <p className="text-sm font-semibold text-green-600">✅ Scan Complete</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-surface-100 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                      {scanResult.emoji}
                    </div>
                    <div>
                      <h4 className="font-bold text-surface-900">{scanResult.name}</h4>
                      <p className="text-xs text-surface-500 capitalize">{scanResult.category} • {scanResult.unit}</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleConfirmAdd}
                    className="w-full btn-primary py-3 flex justify-center mt-4 text-base"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    Confirm & Stock Up (20)
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
