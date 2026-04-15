import { useState, useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import CategoryTabs from '../components/CategoryTabs';
import type { Category } from '../types';
import { Bot, Plus, X, UploadCloud, Loader2 } from 'lucide-react';

export default function AdminInventoryPage() {
  const { inventory, toggleStock, catalog, addCatalogItem } = useOrders();
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

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
    // Simulate AI scanning from uploaded image of a "Guacamole Dip"
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        name: 'Guacamole Dip (Fresh)',
        category: 'snacks',
        unit: 'pack (200g)',
        emoji: '🥑',
        dietary: 'vegan',
        allergens: ['Garlic', 'Onion'],
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 mb-1">Inventory Management</h1>
          <p className="text-surface-500 text-sm">Manage stock and auto-add new items via AI.</p>
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
          {filteredItems.map(item => {
            const inStock = inventory[item.id] !== false;
            return (
              <div key={item.id} className={`flex items-center justify-between p-4 transition-colors ${inStock ? 'hover:bg-surface-50' : 'bg-red-50/20'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center">{item.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-surface-900">{item.name}</h3>
                    <p className="text-xs text-surface-500 capitalize mt-0.5">
                      {item.category} • {item.unit}
                      {item.dietary && item.dietary !== 'none' && (
                        <span className="font-semibold text-surface-700"> • {item.dietary}</span>
                      )}
                    </p>
                    {item.allergens && item.allergens.length > 0 && (
                      <p className="text-[10px] text-red-600 font-semibold mt-1 bg-red-50 inline-block px-1.5 py-0.5 rounded border border-red-100">
                        Allergens: {item.allergens.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleStock(item.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${inStock ? 'bg-green-500' : 'bg-surface-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${inStock ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Scan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up relative">
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
                      <p className="text-xs text-brand-600 mt-1">Extracting dietary & allergen tags</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-10 h-10 text-surface-400 mb-3" />
                      <p className="text-sm font-bold text-surface-700">Click to Upload Package Photo</p>
                      <p className="text-xs text-surface-500 mt-1">AI will automatically read ingredients</p>
                      <p className="text-[10px] text-surface-400 mt-2 font-mono bg-surface-100 px-2 py-0.5 rounded">(Simulates scanning an Avocado Dip)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
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

                  <div className="bg-surface-50 p-4 rounded-xl text-sm border border-surface-200">
                    <div className="flex justify-between mb-3 border-b border-surface-200 pb-2">
                      <span className="text-surface-600">Dietary Profile:</span>
                      <span className="font-bold capitalize">{scanResult.dietary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-600">Allergens Detected:</span>
                      <span className="font-bold text-red-600">{scanResult.allergens.join(', ')}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleConfirmAdd}
                    className="w-full btn-primary py-3 flex justify-center mt-4 text-base"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    Confirm & Add to Catalog
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
