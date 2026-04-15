import { useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { PackageOpen, Thermometer, ShieldCheck, MapPin, CalendarClock, MessageSquare } from 'lucide-react';
import type { CartEntry } from '../types';

export default function AdminFulfillmentPage() {
  const { orders, toggleHaccp, updateOrderStatus } = useOrders();

  // Filter out invoiced and delivered orders for the active packing list
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'packed');

  // Generate aggregate picklist for the kitchen staff
  const picklist = useMemo(() => {
    const list: Record<string, { item: CartEntry['item'], totalQty: number }> = {};
    activeOrders.forEach(order => {
      order.items.forEach(entry => {
        if (!list[entry.item.id]) {
          list[entry.item.id] = { item: entry.item, totalQty: 0 };
        }
        list[entry.item.id].totalQty += entry.quantity;
      });
    });
    // Convert to array and sort by category
    return Object.values(list).sort((a, b) => a.item.category.localeCompare(b.item.category));
  }, [activeOrders]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 mb-1">Kitchen Fulfillment</h1>
          <p className="text-surface-500 text-sm">Aggregated picking list and detailed routing sheet.</p>
        </div>
        <div className="flex gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-surface-900 leading-none">{activeOrders.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Active Orders</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Aggregate Picklist */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-surface-800 flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-brand-500" />
            Master Picking List
          </h2>
          <div className="card p-0 overflow-hidden">
            {picklist.length === 0 ? (
              <div className="p-8 text-center text-surface-400 text-sm">No items to pick.</div>
            ) : (
              <div className="divide-y divide-surface-100 max-h-[700px] overflow-y-auto bg-white">
                {picklist.map((pick, i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">{pick.item.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{pick.item.name}</p>
                        <p className="text-[10px] text-surface-400 font-medium capitalize flex items-center gap-1">
                          {pick.item.category} • {pick.item.unit}
                          {pick.item.dietary !== 'none' && <span className="text-brand-600 font-bold">• {pick.item.dietary}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-surface-900 text-white font-bold text-sm rounded-lg shadow-sm border border-surface-800 min-w-[36px] text-center">
                      {pick.totalQty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Individual Order Packing & Logistics */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-surface-800 flex items-center gap-2">
            🚚 Logistics & Packing Station
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map(order => {
              const hasDairy = order.items.some(e => e.item.category === 'dairy');

              return (
                <div key={order.id} className="card flex flex-col group border-surface-200">
                  {/* Header Row */}
                  <div className="p-4 border-b border-surface-100 bg-surface-50 rounded-t-2xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-surface-900 tracking-tight">{order.id}</h3>
                        <p className="text-sm font-semibold text-brand-700">{order.companyName}</p>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none border cursor-pointer active:scale-95 transition-transform ${
                          order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          order.status === 'packed' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {/* Address */}
                      <p className="text-xs text-surface-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-surface-400 flex-shrink-0" />
                        <span className="font-medium">{order.companyAddress}</span>
                      </p>
                      {/* Date & Time */}
                      <p className="text-xs text-surface-600 flex items-start gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 mt-0.5 text-brand-500 flex-shrink-0" />
                        <span className="font-medium">
                          {order.deliveryDate}
                          {order.deliveryType === 'specific_time' ? (
                            <span className="ml-1 text-amber-600 font-bold bg-amber-100 px-1 py-0.5 rounded border border-amber-200">Specific Slot: {order.deliveryTimeWindow}</span>
                          ) : (
                            <span className="ml-1 text-green-700 font-bold bg-green-100 px-1 py-0.5 rounded border border-green-200">Standard Lunch Drop</span>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="p-4 space-y-2 flex-1">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Packing List</p>
                    {order.items.map(entry => (
                      <div key={entry.item.id} className="flex items-center justify-between text-sm py-1 border-b border-surface-50 last:border-0 hover:bg-surface-50 rounded px-1 transition-colors">
                        <span className="text-surface-700 flex items-center gap-2">
                          <span className="w-6 text-center">{entry.item.emoji}</span>
                          <span className="truncate max-w-[140px] font-medium">{entry.item.name}</span>
                        </span>
                        <span className="font-bold text-surface-900 tabular-nums">x{entry.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Custom Requests / Notes (if any) */}
                  {order.customRequests && (
                    <div className="px-4 pb-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Special Requests / Notes</p>
                          <p className="text-xs text-blue-900 font-medium whitespace-pre-wrap leading-tight">{order.customRequests}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HACCP Compliance Block */}
                  {hasDairy && (
                    <div className="px-4 pb-4 mt-auto">
                      <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer active:scale-[0.98] ${order.haccpChecked ? 'bg-green-50 border-green-200/60 shadow-sm' : 'bg-red-50 border-red-200/60 shadow-sm'}`}
                        onClick={() => toggleHaccp(order.id)}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors border-2 ${order.haccpChecked ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-red-400'}`}
                        >
                          {order.haccpChecked && <ShieldCheck className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold flex items-center gap-1.5 ${order.haccpChecked ? 'text-green-800' : 'text-red-800'}`}>
                            <Thermometer className="w-3.5 h-3.5" />
                            HACCP Validation Required
                          </p>
                          <p className={`text-[10px] leading-tight mt-0.5 font-medium ${order.haccpChecked ? 'text-green-600' : 'text-red-600'}`}>
                            Contains Dairy. Check fridge ➔ courier temp transfer.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {activeOrders.length === 0 && (
              <div className="col-span-full card p-12 text-center text-surface-400 flex flex-col items-center">
                <PackageOpen className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium text-surface-600">All caught up!</p>
                <p className="text-sm">No active orders left to pack right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
