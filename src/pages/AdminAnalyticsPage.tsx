import { useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { TrendingUp, ShoppingBag, CheckCircle, Truck, Clock, Package, DollarSign, BarChart2, AlertCircle } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function startOf(period: 'week' | 'month'): Date {
  const now = new Date();
  if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: '#d97706', bg: '#fef3c7', text: '#92400e', icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: 'Confirmed', color: '#2563eb', bg: '#dbeafe', text: '#1e3a8a', icon: <CheckCircle className="w-4 h-4" /> },
  packed:    { label: 'Packed',    color: '#7c3aed', bg: '#ede9fe', text: '#4c1d95', icon: <Package className="w-4 h-4" /> },
  dispatched:{ label: 'Dispatched',color: '#0891b2', bg: '#cffafe', text: '#164e63', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Delivered', color: '#16a34a', bg: '#dcfce7', text: '#14532d', icon: <CheckCircle className="w-4 h-4" /> },
  invoiced:  { label: 'Invoiced',  color: '#7c3aed', bg: '#ede9fe', text: '#4c1d95', icon: <DollarSign className="w-4 h-4" /> },
};

// ─── component ──────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { orders } = useOrders();
  const safeOrders = orders || [];

  const weekStart = startOf('week');
  const monthStart = startOf('month');

  // ── KPI counts ──────────────────────────────────────────────────────────
  const ordersThisWeek  = useMemo(() => safeOrders.filter(o => new Date(o.placedAt) >= weekStart).length,  [safeOrders]);
  const ordersThisMonth = useMemo(() => safeOrders.filter(o => new Date(o.placedAt) >= monthStart).length, [safeOrders]);

  // ── Total revenue ────────────────────────────────────────────────────────
  const totalRevenue = useMemo(() =>
    safeOrders.reduce((sum, o) => sum + (o.invoiceTotal ?? 0), 0),
    [safeOrders]
  );

  // ── Status breakdown ─────────────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    safeOrders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [safeOrders]);

  const totalOrders = safeOrders.length;

  // ── 4-card status highlights ─────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    safeOrders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1; });
    return m;
  }, [safeOrders]);

  // ── Top 10 items ─────────────────────────────────────────────────────────
  const topItems = useMemo(() => {
    const counts: Record<string, { name: string; emoji: string; qty: number }> = {};
    safeOrders.forEach(order => {
      (order.items || []).forEach(entry => {
        if (!entry.item) return;
        const id = entry.item.id;
        if (!counts[id]) counts[id] = { name: entry.item.name, emoji: entry.item.emoji || '📦', qty: 0 };
        counts[id].qty += entry.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [safeOrders]);

  const maxQty = topItems[0]?.qty || 1;

  // ── Recent 5 orders ───────────────────────────────────────────────────────
  const recentOrders = useMemo(() =>
    [...safeOrders]
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
      .slice(0, 5),
    [safeOrders]
  );

  // ── Status highlight card config ─────────────────────────────────────────
  const highlightCards = [
    {
      key: 'pending',
      label: 'Pending',
      color: 'amber',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-100',
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      color: 'blue',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-100',
      icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
    },
    {
      key: 'invoiced',
      label: 'Invoiced',
      color: 'violet',
      bgClass: 'bg-violet-50',
      textClass: 'text-violet-700',
      borderClass: 'border-violet-100',
      icon: <DollarSign className="w-5 h-5 text-violet-600" />,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      color: 'green',
      bgClass: 'bg-green-50',
      textClass: 'text-green-700',
      borderClass: 'border-green-100',
      icon: <Truck className="w-5 h-5 text-green-600" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-1">Analytics</h1>
        <p className="text-surface-500 font-medium">Order activity, top items, and revenue at a glance.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Orders This Week',  value: ordersThisWeek,  icon: <TrendingUp className="w-5 h-5 text-brand-900" />,   bg: 'bg-brand-50' },
          { label: 'Orders This Month', value: ordersThisMonth, icon: <ShoppingBag className="w-5 h-5 text-blue-700" />,   bg: 'bg-blue-50' },
          { label: 'Total Orders',      value: totalOrders,     icon: <BarChart2 className="w-5 h-5 text-violet-700" />,   bg: 'bg-violet-50' },
          {
            label: 'Total Revenue',
            value: totalRevenue > 0 ? `€${totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : '—',
            icon: <DollarSign className="w-5 h-5 text-emerald-700" />,
            bg: 'bg-emerald-50',
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-surface-100 p-5 shadow-sm flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-surface-400">{card.label}</p>
              <p className="text-2xl font-black text-surface-900 leading-tight mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status highlight row: Pending / Confirmed / Invoiced / Delivered */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {highlightCards.map(card => {
          const count = statusCounts[card.key] || 0;
          const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
          return (
            <div
              key={card.key}
              className={`rounded-2xl border p-5 flex flex-col gap-3 ${card.bgClass} ${card.borderClass}`}
            >
              <div className="flex items-center justify-between">
                {card.icon}
                <span className={`text-[10px] font-black uppercase ${card.textClass}`}>{card.label}</span>
              </div>
              <div>
                <p className={`text-3xl font-black leading-none ${card.textClass}`}>{count}</p>
                <p className={`text-xs font-semibold mt-1 ${card.textClass} opacity-70`}>{pct}% of total</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-3xl border border-surface-100 shadow-sm p-6 mb-8">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 mb-6 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-surface-400 font-medium text-sm">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="pb-3 text-[10px] font-black text-surface-400 uppercase tracking-widest pr-6">Order ID</th>
                  <th className="pb-3 text-[10px] font-black text-surface-400 uppercase tracking-widest pr-6">Company</th>
                  <th className="pb-3 text-[10px] font-black text-surface-400 uppercase tracking-widest pr-6">Order Date</th>
                  <th className="pb-3 text-[10px] font-black text-surface-400 uppercase tracking-widest pr-6">Delivery Date</th>
                  <th className="pb-3 text-[10px] font-black text-surface-400 uppercase tracking-widest pr-6">Status</th>
                  <th className="pb-3 text-[10px] font-black text-surface-400 uppercase tracking-widest text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {recentOrders.map(order => {
                  const cfg = STATUS_CONFIG[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-4 pr-6">
                        <span className="text-xs font-black text-brand-900 font-mono">
                          #{String(order.id).slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 pr-6">
                        <p className="text-sm font-bold text-surface-900 truncate max-w-[140px]">
                          {order.companyName || '—'}
                        </p>
                      </td>
                      <td className="py-4 pr-6">
                        <span className="text-xs font-semibold text-surface-600">{fmtDate(order.placedAt)}</span>
                      </td>
                      <td className="py-4 pr-6">
                        <span className="text-xs font-semibold text-surface-600">{fmtDate(order.deliveryDate)}</span>
                      </td>
                      <td className="py-4 pr-6">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase"
                          style={{ backgroundColor: cfg?.bg ?? '#f3f4f6', color: cfg?.text ?? '#374151' }}
                        >
                          {cfg?.icon}
                          {cfg?.label ?? order.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-xs font-black text-surface-900">
                          {order.invoiceTotal != null
                            ? `€${order.invoiceTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                            : '—'
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Top 10 items — takes 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-surface-100 shadow-sm p-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 mb-6 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Top 10 Most Ordered Items
          </h2>

          {topItems.length === 0 ? (
            <div className="py-12 text-center text-surface-400 font-medium text-sm">No order data yet.</div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-surface-300 w-4 text-right">{i + 1}</span>
                  <span className="text-xl w-8 text-center">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-surface-900 truncate">{item.name}</p>
                      <p className="text-xs font-black text-brand-900 ml-2 shrink-0">{item.qty}</p>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-900 rounded-full transition-all"
                        style={{ width: `${(item.qty / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown — takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-surface-100 shadow-sm p-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-surface-400 mb-6 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5" /> Order Status Breakdown
          </h2>

          {statusBreakdown.length === 0 ? (
            <div className="py-12 text-center text-surface-400 font-medium text-sm">No orders yet.</div>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="flex h-4 rounded-full overflow-hidden mb-6">
                {statusBreakdown.map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div
                      key={status}
                      className="h-full transition-all"
                      style={{
                        width: `${(count / totalOrders) * 100}%`,
                        backgroundColor: cfg?.color ?? '#9ca3af',
                      }}
                      title={`${cfg?.label ?? status}: ${count}`}
                    />
                  );
                })}
              </div>

              {/* Legend rows */}
              <div className="space-y-3">
                {statusBreakdown.map(([status, count]) => {
                  const cfg = STATUS_CONFIG[status];
                  const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cfg?.color ?? '#9ca3af' }}
                        />
                        <span className="text-xs font-bold text-surface-800">
                          {cfg?.label ?? status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-surface-900">{count}</span>
                        <span className="text-[10px] text-surface-400 font-semibold w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
