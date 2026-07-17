import { useState, useEffect } from 'react';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useOrders } from '../context/OrderContext';
import type { Order, PantryItem } from '../types';

interface PackingProgress {
  [itemId: string]: { packed: boolean; qty: number };
}

interface AllProgress {
  [orderId: string]: PackingProgress;
}

interface ReplacementState {
  itemId: string;
  search: string;
  selectedItem: PantryItem | null;
  qty: number;
}

export default function PackingStationPage() {
  const { orders, catalog, stockCounts, updateOrderStatus } = useOrders();
  const [progress, setProgress] = useState<AllProgress>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [savedNotes, setSavedNotes] = useState<{ [itemId: string]: string }>({});
  const [replacement, setReplacement] = useState<ReplacementState | null>(null);

  const packableOrders = orders.filter(o =>
    o.status === 'pending' || o.status === 'confirmed' || o.status === 'packed'
  );

  useEffect(() => {
    if (packableOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(packableOrders[0].id);
    }
  }, [packableOrders.length]);

  // Live Firebase listener for packing progress
  useEffect(() => {
    const progressRef = ref(db, 'packingProgress');
    const unsub = onValue(progressRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setProgress(data as AllProgress);
    });
    return () => unsub();
  }, []);

  // Sync saved notes from order
  useEffect(() => {
    if (!selectedOrderId) return;
    const order = orders.find(o => o.id === selectedOrderId);
    if (order?.packingNotes) {
      setSavedNotes({ ...(order.packingNotes as Record<string, string>) });
    } else {
      setSavedNotes({});
    }
  }, [selectedOrderId, orders]);

  const selectedOrder: Order | undefined = orders.find(o => o.id === selectedOrderId);

  const isPacked = (orderId: string, itemId: string) =>
    progress[orderId]?.[itemId]?.packed === true;

  const togglePacked = async (order: Order, itemId: string, qty: number) => {
    const current = isPacked(order.id, itemId);
    const newPacked = !current;

    // 1. Update local state immediately for instant visual feedback
    setProgress(prev => ({
      ...prev,
      [order.id]: {
        ...(prev[order.id] ?? {}),
        [itemId]: { packed: newPacked, qty },
      },
    }));

    // 2. Write to Firebase
    await update(ref(db, `packingProgress/${order.id}`), {
      [itemId]: { packed: newPacked, qty },
    });

    // 3. Auto-mark order as packed if all items done
    const updatedProgress = {
      ...(progress[order.id] ?? {}),
      [itemId]: { packed: newPacked, qty },
    };
    const allPacked = order.items.every(entry => {
      const id = entry.item?.id ?? '';
      return updatedProgress[id]?.packed === true;
    });
    if (allPacked && order.status !== 'packed') {
      updateOrderStatus(order.id, 'packed');
    }
  };

  // In-stock catalog items for replacement dropdown
  const inStockItems = catalog.filter(item => (stockCounts[item.id] ?? 0) > 0);

  const filteredReplacementItems = replacement
    ? inStockItems.filter(item =>
        item.name.toLowerCase().includes(replacement.search.toLowerCase())
      )
    : [];

  const openReplacement = (itemId: string, defaultQty: number) => {
    setReplacement({ itemId, search: '', selectedItem: null, qty: defaultQty });
  };

  const confirmReplacement = async () => {
    if (!replacement || !replacement.selectedItem || !selectedOrderId) return;
    const { itemId, selectedItem, qty } = replacement;
    const order = orders.find(o => o.id === selectedOrderId);
    const existingNotes = (order as any)?.packingNotes ?? {};
    const noteText = `Replaced with: ${selectedItem.name} x${qty}`;

    // Save replacement note to Firebase orders
    await update(ref(db, `orders/${selectedOrderId}`), {
      packingNotes: { ...existingNotes, [itemId]: noteText },
    });

    // Deduct stock
    const currentStock = stockCounts[selectedItem.id] ?? 0;
    await update(ref(db, 'stockCounts'), {
      [selectedItem.id]: Math.max(0, currentStock - qty),
    });

    // Update local saved notes
    setSavedNotes(prev => ({ ...prev, [itemId]: noteText }));

    // Move original item to packed side
    const entry = selectedOrder?.items.find(e => e.item?.id === itemId);
    if (entry && order) {
      await togglePacked(order, itemId, entry.quantity);
    }

    setReplacement(null);
  };

  if (packableOrders.length === 0) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-surface-700">No orders to pack</h2>
          <p className="text-surface-500 mt-2">All caught up! Check back when new orders arrive.</p>
        </div>
      </div>
    );
  }

  const toPackItems = selectedOrder?.items.filter(
    entry => !isPacked(selectedOrderId, entry.item?.id ?? '')
  ) ?? [];

  const packedItems = selectedOrder?.items.filter(
    entry => isPacked(selectedOrderId, entry.item?.id ?? '')
  ) ?? [];

  const totalItems = selectedOrder?.items.length ?? 0;
  const packedCount = packedItems.length;
  const progressPct = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-100 px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-black text-brand-900 uppercase tracking-wider">Packing Station</span>
          </div>

          <select
            value={selectedOrderId}
            onChange={e => setSelectedOrderId(e.target.value)}
            className="px-4 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm font-semibold text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-900"
          >
            {packableOrders.map(o => (
              <option key={o.id} value={o.id}>
                {o.companyName} — {o.id}
              </option>
            ))}
          </select>

          {selectedOrder && (
            <span className="ml-auto px-4 py-2 rounded-xl bg-brand-50 text-brand-900 text-sm font-bold border border-brand-100">
              {packedCount}/{totalItems} packed
            </span>
          )}

          {selectedOrder && (
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest
              ${selectedOrder.status === 'packed' ? 'bg-green-100 text-green-700' :
                selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'}`}>
              {selectedOrder.status}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {selectedOrder && totalItems > 0 && (
          <div className="max-w-5xl mx-auto mt-3">
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-surface-500 mt-1">{progressPct}% complete</p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      {selectedOrder && (
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT: TO PACK */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <h2 className="text-sm font-black uppercase tracking-widest text-surface-600">
                To Pack ({toPackItems.length})
              </h2>
            </div>
            <div className="space-y-3">
              {toPackItems.length === 0 ? (
                <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-center">
                  <span className="text-2xl">✅</span>
                  <p className="text-green-700 font-bold mt-2">All items packed!</p>
                </div>
              ) : (
                toPackItems.map(entry => {
                  const item = entry.item;
                  const itemId = item?.id ?? '';
                  const isReplacingThis = replacement?.itemId === itemId;
                  return (
                    <div key={itemId} className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 p-4">
                        {item?.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-surface-50 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-2xl flex-shrink-0">
                            {item?.emoji ?? '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-surface-900 truncate">{item?.name}</p>
                          <p className="text-sm text-surface-500">
                            Qty: <span className="font-black text-brand-900">{entry.quantity} {item?.unit}</span>
                          </p>
                          {savedNotes[itemId] && (
                            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1 border border-amber-100">
                              ⚠️ {savedNotes[itemId]}
                            </p>
                          )}
                        </div>
                        {/* Pack button — large green */}
                        <button
                          onClick={() => togglePacked(selectedOrder, itemId, entry.quantity)}
                          className="flex-shrink-0 px-4 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
                          title="Mark as packed"
                        >
                          ✓ Pack
                        </button>
                        {/* Replace button */}
                        <button
                          onClick={() => isReplacingThis ? setReplacement(null) : openReplacement(itemId, entry.quantity)}
                          className={`flex-shrink-0 w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${isReplacingThis ? 'bg-amber-200 text-amber-900' : 'bg-amber-50 hover:bg-amber-100 text-amber-600'}`}
                          title="Mark as out of stock / replace"
                        >
                          ⚠️
                        </button>
                      </div>

                      {/* Replacement panel — inline expansion */}
                      {isReplacingThis && (
                        <div className="border-t border-amber-100 bg-amber-50 p-4 space-y-3">
                          <p className="text-sm font-bold text-amber-900">Select replacement from stock:</p>
                          <input
                            type="text"
                            value={replacement.search}
                            onChange={e => setReplacement(prev => prev ? { ...prev, search: e.target.value, selectedItem: null } : prev)}
                            placeholder="Search catalog..."
                            className="w-full px-3 py-2 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            autoFocus
                          />
                          {filteredReplacementItems.length > 0 && (
                            <div className="max-h-40 overflow-y-auto rounded-xl border border-amber-200 bg-white divide-y divide-surface-50">
                              {filteredReplacementItems.map(ci => (
                                <button
                                  key={ci.id}
                                  onClick={() => setReplacement(prev => prev ? { ...prev, selectedItem: ci, search: ci.name } : prev)}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition-colors ${replacement.selectedItem?.id === ci.id ? 'bg-amber-100 font-bold' : ''}`}
                                >
                                  {ci.emoji ?? '📦'} {ci.name}
                                  <span className="ml-2 text-xs text-surface-400">(stock: {stockCounts[ci.id] ?? 0} {ci.unit})</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {replacement.search.length > 0 && filteredReplacementItems.length === 0 && (
                            <p className="text-xs text-surface-400">No in-stock items match.</p>
                          )}
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-amber-900 whitespace-nowrap">Qty to replace:</label>
                            <input
                              type="number"
                              min={1}
                              value={replacement.qty}
                              onChange={e => setReplacement(prev => prev ? { ...prev, qty: Math.max(1, parseInt(e.target.value) || 1) } : prev)}
                              className="w-20 px-3 py-2 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={confirmReplacement}
                              disabled={!replacement.selectedItem}
                              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all"
                            >
                              Confirm Replacement
                            </button>
                            <button
                              onClick={() => setReplacement(null)}
                              className="px-3 py-2 bg-surface-100 text-surface-600 text-sm font-bold rounded-xl hover:bg-surface-200 transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: PACKED */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <h2 className="text-sm font-black uppercase tracking-widest text-surface-600">
                Packed ✓ ({packedItems.length})
              </h2>
            </div>
            <div className="space-y-3">
              {packedItems.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-surface-200 p-8 text-center text-surface-400">
                  <p className="text-sm">Items will appear here once packed</p>
                </div>
              ) : (
                packedItems.map(entry => {
                  const item = entry.item;
                  const itemId = item?.id ?? '';
                  const note = savedNotes[itemId];
                  const isReplacement = note?.startsWith('Replaced with:');
                  return (
                    <div key={itemId} className="bg-green-50 rounded-2xl border border-green-100 p-4">
                      <div className="flex items-center gap-3">
                        {item?.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-green-100 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
                            {item?.emoji ?? '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-green-900 truncate line-through decoration-green-400">
                            {item?.name}
                          </p>
                          <p className="text-sm text-green-600">
                            Qty: <span className="font-black">{entry.quantity} {item?.unit}</span>
                          </p>
                          {isReplacement && (
                            <p className="text-xs font-bold text-amber-700 bg-amber-100 rounded-lg px-2 py-1 mt-1 border border-amber-200 inline-flex items-center gap-1">
                              ⚠️ {note}
                            </p>
                          )}
                          {note && !isReplacement && (
                            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1">
                              Note: {note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => togglePacked(selectedOrder, itemId, entry.quantity)}
                          className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center transition-all active:scale-95"
                          title="Undo pack"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
