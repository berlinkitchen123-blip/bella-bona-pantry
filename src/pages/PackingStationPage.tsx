import { useState, useEffect } from 'react';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useOrders } from '../context/OrderContext';
import type { Order } from '../types';

interface PackingProgress {
  [itemId: string]: { packed: boolean; qty: number };
}

interface AllProgress {
  [orderId: string]: PackingProgress;
}

export default function PackingStationPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [progress, setProgress] = useState<AllProgress>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [noteInput, setNoteInput] = useState<{ [itemId: string]: string }>({});
  const [noteOpen, setNoteOpen] = useState<{ [itemId: string]: boolean }>({});
  const [savedNotes, setSavedNotes] = useState<{ [itemId: string]: string }>({});

  // Filter orders relevant to packing
  const packableOrders = orders.filter(o =>
    o.status === 'pending' || o.status === 'confirmed' || o.status === 'packed'
  );

  // Auto-select first order
  useEffect(() => {
    if (packableOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(packableOrders[0].id);
    }
  }, [packableOrders.length]);

  // Load packing progress from Firebase
  useEffect(() => {
    const progressRef = ref(db, 'packingProgress');
    const unsub = onValue(progressRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setProgress(data as AllProgress);
    });
    return () => unsub();
  }, []);

  // Sync saved notes when order or orders change
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

  const getItemProgress = (orderId: string, itemId: string) =>
    progress[orderId]?.[itemId] ?? { packed: false, qty: 0 };

  const togglePacked = async (order: Order, itemId: string, qty: number) => {
    const current = getItemProgress(order.id, itemId);
    const newPacked = !current.packed;

    await update(ref(db, `packingProgress/${order.id}`), {
      [itemId]: { packed: newPacked, qty },
    });

    // Optimistically check if all items will be packed after this toggle
    const allPacked = order.items.every(entry => {
      const id = entry.item?.id ?? '';
      if (id === itemId) return newPacked;
      return getItemProgress(order.id, id).packed;
    });

    if (allPacked && order.status !== 'packed') {
      updateOrderStatus(order.id, 'packed');
    }
  };

  const saveNote = async (orderId: string, itemId: string) => {
    const text = noteInput[itemId] ?? '';
    const order = orders.find(o => o.id === orderId);
    const existingNotes = (order as any)?.packingNotes ?? {};
    await update(ref(db, `orders/${orderId}`), {
      packingNotes: { ...existingNotes, [itemId]: text },
    });
    setSavedNotes(prev => ({ ...prev, [itemId]: text }));
    setNoteOpen(prev => ({ ...prev, [itemId]: false }));
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
    entry => !getItemProgress(selectedOrderId, entry.item?.id ?? '').packed
  ) ?? [];

  const packedItems = selectedOrder?.items.filter(
    entry => getItemProgress(selectedOrderId, entry.item?.id ?? '').packed
  ) ?? [];

  const totalItems = selectedOrder?.items.length ?? 0;
  const packedCount = packedItems.length;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header bar */}
      <div className="bg-white border-b border-surface-100 px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-black text-brand-900 uppercase tracking-wider">Packing Station</span>
          </div>

          {/* Order selector */}
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
              {packedCount}/{totalItems} items packed
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
      </div>

      {/* Two-column layout */}
      {selectedOrder && (
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* TO PACK column */}
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
                  return (
                    <div key={itemId} className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm">
                      <div className="flex items-center gap-3">
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
                              Note: {savedNotes[itemId]}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => togglePacked(selectedOrder, itemId, entry.quantity)}
                          className="flex-shrink-0 w-14 h-14 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white font-black text-xl flex items-center justify-center transition-all active:scale-95 shadow"
                          title="Mark as packed"
                        >
                          ✓
                        </button>
                      </div>
                      {/* Note section */}
                      <div className="mt-3 border-t border-surface-50 pt-3">
                        {noteOpen[itemId] ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={noteInput[itemId] ?? savedNotes[itemId] ?? ''}
                              onChange={e => setNoteInput(prev => ({ ...prev, [itemId]: e.target.value }))}
                              placeholder="Replacement or packing note..."
                              className="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-900"
                              autoFocus
                            />
                            <button
                              onClick={() => saveNote(selectedOrderId, itemId)}
                              className="px-4 py-2 bg-brand-900 text-white text-sm font-bold rounded-xl hover:bg-brand-800 transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setNoteOpen(prev => ({ ...prev, [itemId]: false }))}
                              className="px-3 py-2 bg-surface-100 text-surface-600 text-sm font-bold rounded-xl hover:bg-surface-200 transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setNoteOpen(prev => ({ ...prev, [itemId]: true }))}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                          >
                            ⚠️ {savedNotes[itemId] ? 'Edit note' : 'Add replacement note'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PACKED column */}
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
                  return (
                    <div key={itemId} className="bg-green-50 rounded-2xl border border-green-100 p-4 opacity-80">
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
                          {savedNotes[itemId] && (
                            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1">
                              Note: {savedNotes[itemId]}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => togglePacked(selectedOrder, itemId, entry.quantity)}
                          className="flex-shrink-0 w-14 h-14 rounded-2xl bg-green-600 hover:bg-red-500 text-white font-black text-xl flex items-center justify-center transition-all active:scale-95"
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
