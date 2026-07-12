import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Package, Truck, Copy, FileText } from 'lucide-react';
import type { Order } from '../types';

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', icon: <Clock className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed', icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  dispatched: { label: 'Dispatched', icon: <Truck className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  delivered: { label: 'Delivered', icon: <Package className="w-4 h-4" />, color: 'text-green-600 bg-green-50 border-green-200' },
  packed: { label: 'Packed', icon: <Package className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  invoiced: { label: 'Invoiced', icon: <FileText className="w-4 h-4" />, color: 'text-slate-600 bg-slate-100 border-slate-200' },
};

// Map each status to a 0-3 timeline step
const STATUS_TO_STEP: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  dispatched: 2,
  packed: 2,
  delivered: 3,
  invoiced: 3,
};

function formatOrderedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} at ${timePart.toUpperCase()}`;
  } catch {
    return iso;
  }
}

function formatDeliveryDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function StatusPill({ status }: { status: Order['status'] }) {
  const meta = STATUS_META[status] ?? STATUS_META['pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function StatusTimeline({ status }: { status: Order['status'] }) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;
  const steps = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" /> },
    { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { key: 'dispatched', label: 'Dispatched', icon: <Truck className="w-3.5 h-3.5" /> },
    { key: 'delivered', label: 'Delivered', icon: <Package className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-start w-full mt-4">
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Node + label */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDone ? 'bg-brand-900 border-brand-900 text-white' : ''}
                  ${isCurrent ? 'bg-white border-brand-900 text-brand-900 shadow-md ring-2 ring-brand-900/10' : ''}
                  ${!isDone && !isCurrent ? 'bg-surface-100 border-surface-200 text-surface-400' : ''}`}
              >
                {step.icon}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap
                  ${isCurrent ? 'text-brand-900 font-bold' : isDone ? 'text-brand-700' : 'text-surface-400'}`}
              >
                {step.label}
                {isCurrent && <span className="ml-0.5">●</span>}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all ${i < currentStep ? 'bg-brand-900' : 'bg-surface-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CustomerOrdersPage() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();

  // Filter to current user's orders by companyEmail or companyName
  const myOrders = orders.filter(o =>
    (user?.email && o.companyEmail === user.email) ||
    (user?.company && o.companyName === user.company)
  );

  const handleReorder = (order: Order) => {
    clearCart();
    order.items.forEach(entry => {
      for (let i = 0; i < entry.quantity; i++) {
        addItem(entry.item);
      }
    });
    navigate('/catalog');
    alert('Items from the previous order have been added to your cart.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Order History</h1>
        <p className="text-surface-500 text-sm">Track your deliveries and quickly reorder past items.</p>
      </div>

      {myOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
          <Clock className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <h3 className="font-semibold text-surface-800 mb-1">No orders yet</h3>
          <p className="text-sm text-surface-500">Your order history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {myOrders.map(order => {
            const itemCount = order.items.reduce((sum, e) => sum + e.quantity, 0);
            const totalItems = order.items.length;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-surface-100">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-surface-900 text-sm">{order.id}</span>
                    <StatusPill status={order.status} />
                    <span className="text-xs text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                      {totalItems} product{totalItems !== 1 ? 's' : ''} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => handleReorder(order)}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Reorder
                  </button>
                </div>

                {/* Date & delivery info */}
                <div className="px-5 pt-4 pb-2 space-y-2">
                  {/* Ordered on */}
                  <div className="flex items-center gap-2 text-sm text-surface-700">
                    <span className="text-surface-400">🗓</span>
                    <span>
                      <span className="font-semibold text-surface-500">Ordered on:</span>{' '}
                      <span className="font-bold text-surface-900">{formatOrderedAt(order.placedAt)}</span>
                    </span>
                  </div>

                  {/* Delivery date */}
                  {order.deliveryDate && (
                    <div className="flex items-center gap-2 text-sm text-surface-700">
                      <span className="text-surface-400">🚚</span>
                      <span>
                        <span className="font-semibold text-surface-500">Delivery:</span>{' '}
                        <span className="font-bold text-surface-900">{formatDeliveryDate(order.deliveryDate)}</span>
                      </span>
                      {order.deliveryType === 'specific_time' && order.deliveryTimeWindow && (
                        <span className="ml-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          ⏰ Delivery time: {order.deliveryTimeWindow.replace(' - ', ' – ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status timeline */}
                <div className="px-5 pb-2 pt-1">
                  <StatusTimeline status={order.status} />
                </div>

                {/* Items grid */}
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {order.items.map(entry => (
                      <div
                        key={entry.item.id}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-50 border border-surface-100"
                      >
                        <span className="text-xl">{entry.item.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-surface-800 line-clamp-1">{entry.item.name}</p>
                          <p className="text-[10px] text-surface-500">Qty: {entry.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
