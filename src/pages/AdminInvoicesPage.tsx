import { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { FileText, Save, CheckCircle } from 'lucide-react';
import type {  Order  } from '../types';

export default function AdminInvoicesPage() {
  const { orders, setInvoiceTotal } = useOrders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const deliverdOrInvoicedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'invoiced');

  const handleEdit = (order: Order) => {
    setEditingId(order.id);
    setTempValue(order.invoiceTotal?.toString() || '');
  };

  const handleSave = (orderId: string) => {
    const val = parseFloat(tempValue);
    if (!isNaN(val)) {
      setInvoiceTotal(orderId, val);
    }
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 mb-1">Invoicing</h1>
          <p className="text-surface-500 text-sm">Assign financial values to completed orders for final billing.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {deliverdOrInvoicedOrders.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            No delivered orders pending invoice.
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
             {deliverdOrInvoicedOrders.map(order => (
               <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <h3 className="font-bold text-surface-900">{order.id}</h3>
                     {order.status === 'invoiced' ? (
                       <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                         <CheckCircle className="w-3 h-3 mr-1" /> Invoiced
                       </span>
                     ) : (
                       <span className="badge-success">Delivered</span>
                     )}
                   </div>
                   <p className="text-sm font-semibold text-surface-700">{order.companyName}</p>
                   <p className="text-xs text-surface-500">
                     {order.items.length} unique items • {order.items.reduce((s, e) => s + e.quantity, 0)} total units
                     {order.surcharge > 0 && ` • +€${order.surcharge} Express`}
                   </p>
                 </div>

                 <div className="flex items-center gap-2">
                   {editingId === order.id ? (
                     <>
                       <div className="relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">€</span>
                         <input
                           type="number"
                           step="0.01"
                           value={tempValue}
                           onChange={e => setTempValue(e.target.value)}
                           className="input-field pl-7 w-32 py-1.5 text-sm"
                           placeholder="0.00"
                           autoFocus
                         />
                       </div>
                       <button
                         onClick={() => handleSave(order.id)}
                         className="btn-primary py-1.5 px-3 rounded-lg text-sm"
                       >
                         <Save className="w-4 h-4" /> Save
                       </button>
                     </>
                   ) : (
                     <>
                       <div className="text-right tabular-nums mr-2">
                         {order.invoiceTotal !== undefined ? (
                           <span className="text-lg font-bold text-brand-600">€{order.invoiceTotal.toFixed(2)}</span>
                         ) : (
                           <span className="text-sm text-amber-600 font-semibold italic">Awaiting Value</span>
                         )}
                       </div>
                       <button
                         onClick={() => handleEdit(order)}
                         className="btn-secondary py-1.5 px-3 rounded-lg text-sm"
                       >
                         {order.invoiceTotal !== undefined ? 'Edit' : 'Assign'}
                       </button>
                     </>
                   )}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
