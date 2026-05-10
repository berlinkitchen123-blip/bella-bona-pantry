import { useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { PackageOpen, Thermometer, ShieldCheck, MapPin, CalendarClock, MessageSquare, Bell, CreditCard, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CartEntry } from '../types';

export default function AdminFulfillmentPage() {
  const { orders, toggleHaccp, updateOrderStatus, notifications, markNotificationRead } = useOrders();

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'packed');
  const unreadNotifications = notifications.filter(n => n.status === 'unread');

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
    return Object.values(list).sort((a, b) => a.item.category.localeCompare(b.item.category));
  }, [activeOrders]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* Point: Automation Notification Hub */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
         <div className="md:col-span-3">
            <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-1">Operational Control</h1>
            <p className="text-surface-500 font-medium tracking-wide">Automated alerts for Logistics, Finance, and Kitchen teams.</p>
         </div>
         <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center relative">
                  <Bell className="w-5 h-5 text-brand-900" />
                  {unreadNotifications.length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />}
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-surface-400">Total Alerts</p>
                  <p className="text-lg font-black text-brand-900 leading-tight">{notifications.length}</p>
               </div>
            </div>
            <button className="text-[10px] font-black text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">SYSTEM LOG</button>
         </div>
      </div>

      {notifications.length > 0 && (
         <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Departmental Urgent Tasks
               </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto no-scrollbar">
               {notifications.slice(0, 3).map(notif => (
                  <div key={notif.id} className={`p-5 rounded-[24px] border transition-all ${
                     notif.status === 'unread' ? 'bg-white shadow-xl shadow-brand-900/5 border-brand-100 ring-1 ring-brand-900/5 translate-y-[-2px]' : 'bg-surface-50 border-surface-100 opacity-60'
                  }`}>
                     <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-xl border ${
                           notif.type === 'logistics' ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                           notif.type === 'finance' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                           'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                           {notif.type === 'logistics' ? <Truck className="w-4 h-4" /> : 
                            notif.type === 'finance' ? <CreditCard className="w-4 h-4" /> : 
                            <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <p className="text-[9px] font-black text-surface-300 uppercase">{notif.type} • {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                     <h3 className="font-bold text-surface-900 text-sm mb-1">{notif.title}</h3>
                     <p className="text-xs text-surface-500 font-medium leading-relaxed mb-4">{notif.message}</p>
                     
                     {notif.status === 'unread' && (
                        <button 
                           onClick={() => markNotificationRead(notif.id)}
                           className="w-full py-2 bg-surface-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-900 transition-colors flex items-center justify-center gap-2"
                        >
                           <CheckCircle className="w-3 h-3" /> Mark as Processed
                        </button>
                     )}
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Existing Fulfillment UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 flex items-center gap-2 px-2">
            <PackageOpen className="w-4 h-4" /> Master Picking List
          </h2>
          <div className="bg-white rounded-3xl border border-surface-100 shadow-panel overflow-hidden">
            {picklist.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                 <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center text-2xl mb-4 grayscale opacity-40">📦</div>
                 <p className="text-sm font-bold text-surface-400">Inventory Ready</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 max-h-[700px] overflow-y-auto">
                {picklist.map((pick, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-brand-50/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-surface-50 rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                        {pick.item.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-surface-900 tracking-tight">{pick.item.name}</p>
                        <p className="text-[10px] text-brand-700 font-black uppercase tracking-widest mt-0.5">
                          {pick.item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-brand-900 text-white font-black text-sm rounded-xl shadow-md border-2 border-white">
                      {pick.totalQty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 flex items-center gap-2 px-2">
            🚚 Logistics & Dispatch Station
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map(order => {
              const hasDairy = order.items.some(e => e.item.category === 'dairy');

              return (
                <div key={order.id} className="bg-white rounded-3xl border border-surface-100 shadow-sm flex flex-col group overflow-hidden transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-brand-100">
                  <div className="p-6 border-b border-surface-50 bg-surface-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-black text-brand-900 tracking-tighter">{order.id}</h3>
                        <p className="text-xs font-black text-surface-400 uppercase tracking-widest">{order.companyName}</p>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                        className={`text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none border cursor-pointer active:scale-95 transition-all shadow-sm ${
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

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-surface-700">
                        <MapPin className="w-3.5 h-3.5 text-surface-300" />
                        {order.companyAddress}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-surface-700">
                        <CalendarClock className="w-3.5 h-3.5 text-brand-900" />
                        {order.deliveryDate}
                        {order.deliveryType === 'specific_time' && (
                           <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-md border border-amber-200">PRIORITY: {order.deliveryTimeWindow}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-3 flex-1 overflow-y-auto max-h-60 custom-scrollbar">
                    {order.items.map(entry => (
                      <div key={entry.item.id} className="flex items-center justify-between text-sm py-2 border-b border-surface-50 last:border-0 hover:bg-brand-50/50 rounded-xl px-2 transition-colors group/item">
                        <span className="flex items-center gap-3">
                          <span className="text-xl group-hover/item:scale-110 transition-transform">{entry.item.emoji}</span>
                          <div>
                            <p className="font-bold text-surface-900 break-words max-w-[150px]">{entry.item.name}</p>
                            <p className="text-[9px] font-black text-brand-700 uppercase tracking-tighter">{entry.item.dietary !== 'none' ? entry.item.dietary : ''}</p>
                          </div>
                        </span>
                        <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center font-black text-surface-900 shadow-inner">
                           {entry.quantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.customRequests && (
                    <div className="px-6 pb-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-1">Kitchen Instruction</p>
                          <p className="text-xs text-blue-900 font-medium leading-relaxed italic">"{order.customRequests}"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasDairy && (
                    <div className="px-6 pb-6 mt-auto">
                      <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer shadow-sm ${order.haccpChecked ? 'bg-green-50 border-green-200 shadow-green-900/5' : 'bg-red-50 border-red-200 shadow-red-900/5'}`}
                        onClick={() => toggleHaccp(order.id)}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${order.haccpChecked ? 'bg-green-500 text-white shadow-lg shadow-green-500/20 rotate-[360deg]' : 'bg-white text-red-400 border border-red-200'}`}>
                           <ShieldCheck className="w-5 h-5" />
                         </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${order.haccpChecked ? 'text-green-800' : 'text-red-800'}`}>HACCP Validation</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${order.haccpChecked ? 'text-green-600' : 'text-red-600'}`}>
                            Verified Temp & Pack Integrity
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
   return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
   )
}
