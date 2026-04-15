import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Package, Truck, Copy } from 'lucide-react';
import type {  Order  } from '../types';

export default function CustomerOrdersPage() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();

  // Filter orders for the current user's company
  const myOrders = orders.filter(o => o.companyName === user?.company);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'confirmed': return <span className="badge-info"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</span>;
      case 'packed': return <span className="badge-info bg-purple-50 text-purple-700 border-purple-200"><Package className="w-3 h-3 mr-1" /> Packed</span>;
      case 'delivered': return <span className="badge-success"><Truck className="w-3 h-3 mr-1" /> Delivered</span>;
      case 'invoiced': return <span className="badge bg-slate-100 text-slate-700 border-slate-200"><CheckCircle className="w-3 h-3 mr-1" /> Invoiced</span>;
    }
  };

  const handleReorder = (order: Order) => {
    clearCart();
    order.items.forEach(entry => {
      // simulate adding to cart
      for(let i=0; i<entry.quantity; i++){
        addItem(entry.item);
      }
    });
    navigate('/catalog');
    // We let the CartSidebar handle the rest by popping open (the user can manually open it or see the badge jump)
    // You could trigger the sidebar here if you exposed a method, but showing a notification is sufficient.
    alert('Items from the previous order have been added to your cart.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Order History</h1>
        <p className="text-surface-500 text-sm">Review your past deliveries and quickly reorder.</p>
      </div>

      {myOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
          <Clock className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <h3 className="font-semibold text-surface-800 mb-1">No orders yet</h3>
          <p className="text-sm text-surface-500">Your order history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map(order => (
            <div key={order.id} className="card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-surface-100">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-surface-900">{order.id}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-surface-500">
                    Placed on {new Date(order.placedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${order.deliveryType === 'specific_time' ? 'bg-amber-50 text-amber-700' : 'bg-surface-100 text-surface-600'}`}>
                    {order.deliveryType === 'specific_time' ? `⚡ ${order.deliveryTimeWindow || 'Specific Time'}` : '🚚 Standard'}
                  </span>
                  <span className="text-xs text-surface-500 font-medium">{order.deliveryDate}</span>
                  <button
                    onClick={() => handleReorder(order)}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Reorder List
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {order.items.map(entry => (
                  <div key={entry.item.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-50 border border-surface-100">
                    <span className="text-xl">{entry.item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-surface-800 line-clamp-1">{entry.item.name}</p>
                      <p className="text-[10px] text-surface-500">Qty: {entry.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
