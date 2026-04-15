import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { X, Truck, Zap, ShoppingBag, Minus, Plus, CheckCircle, CalendarDays, Clock, HelpCircle } from 'lucide-react';

interface Props {
  onOrderPlaced: (orderId: string) => void;
}

export default function CartSidebar({ onOrderPlaced }: Props) {
  const { user } = useAuth();
  const { 
    cart, 
    addItem, removeItem, clearCart, totalItems,
    deliveryType, setDeliveryType,
    deliveryDate, setDeliveryDate,
    deliveryTimeWindow, setDeliveryTimeWindow,
    surcharge,
    customRequests, setCustomRequests
  } = useCart();
  
  const { placeOrder } = useOrders();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(''); // Just standard order notes
  
  const totalQty = cart.reduce((sum, e) => sum + e.quantity, 0);

  const handleSubmit = () => {
    if (!user || cart.length === 0) return;
    const finalNotes = notes.trim() ? `Order Notes: ${notes}` : '';
    const mergedRequests = [finalNotes, customRequests].filter(Boolean).join('\n\n');

    const order = placeOrder(
      cart, 
      deliveryType, 
      deliveryDate,
      deliveryTimeWindow,
      surcharge, 
      user.company, 
      user.email,
      user.companyAddress,
      mergedRequests
    );
    
    clearCart();
    setNotes('');
    setIsOpen(false);
    onOrderPlaced(order.id);
  };

  return (
    <>
      {/* Floating checkout button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-slide-up">
          <button
            onClick={() => setIsOpen(true)}
            id="open-cart"
            className="flex items-center gap-3 px-5 py-3.5 bg-surface-900 text-white rounded-2xl shadow-xl hover:bg-surface-800 active:scale-95 transition-all duration-200"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-semibold">Review Order</span>
            <span className="ml-1 px-2 py-0.5 bg-brand-400 text-surface-900 text-sm font-bold rounded-lg">
              {totalQty} items
            </span>
          </button>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 bg-surface-50">
          <div>
            <h2 className="font-bold text-lg text-surface-900">Your Order</h2>
            <p className="text-xs text-surface-500">{user?.company} • {user?.companyAddress}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-surface-200 transition-colors">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto bg-surface-50 p-6">
          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-surface-200 text-surface-400">
                <ShoppingBag className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">Your order is empty</p>
              </div>
            ) : (
              cart.map(entry => (
                <div key={entry.item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-surface-100 shadow-sm">
                  <span className="text-3xl w-12 text-center bg-surface-50 rounded-xl py-1">{entry.item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{entry.item.name}</p>
                    <p className="text-xs text-surface-400 capitalize">{entry.item.category} • {entry.item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-50 rounded-xl p-1 border border-surface-100">
                    <button
                      onClick={() => removeItem(entry.item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-surface-200 hover:bg-surface-100 transition-colors text-surface-600 shadow-sm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-surface-900 tabular-nums">{entry.quantity}</span>
                    <button
                      onClick={() => addItem(entry.item)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors text-white shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="mt-6 space-y-4">
              {/* Delivery Scheduler */}
              <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" /> Delivery Schedule
                </h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-medium text-surface-700 mb-1.5">Select Date</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${deliveryType === 'standard' ? 'border-brand-400 bg-brand-50' : 'border-surface-100 hover:border-surface-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="standard"
                      checked={deliveryType === 'standard'}
                      onChange={() => setDeliveryType('standard')}
                      className="hidden"
                    />
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${deliveryType === 'standard' ? 'border-brand-500' : 'border-surface-300'}`}>
                      {deliveryType === 'standard' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                           <Truck className="w-4 h-4 text-surface-500" /> Standard
                        </p>
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">Free</span>
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">Delivered alongside your daily lunch order.</p>
                    </div>
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border-2 transition-colors ${deliveryType === 'specific_time' ? 'border-brand-400 bg-brand-50' : 'border-surface-100 hover:border-surface-200 bg-white cursor-pointer'}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="specific_time"
                        checked={deliveryType === 'specific_time'}
                        onChange={() => setDeliveryType('specific_time')}
                        className="hidden"
                      />
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${deliveryType === 'specific_time' ? 'border-brand-500' : 'border-surface-300'}`}>
                        {deliveryType === 'specific_time' && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-500" /> Specific Time
                          </p>
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">+€89.00</span>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">Need it before 11:00 AM? Pick a specific slot.</p>
                      </div>
                    </div>

                    {deliveryType === 'specific_time' && (
                      <div className="mt-3 ml-7 animate-slide-up">
                        <label className="block text-xs font-medium text-surface-700 mb-1.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Time Window
                        </label>
                        <select 
                          value={deliveryTimeWindow}
                          onChange={(e) => setDeliveryTimeWindow(e.target.value)}
                          className="input-field py-1.5 text-sm"
                        >
                          <option value="08:00 - 09:00">08:00 - 09:00 AM</option>
                          <option value="09:00 - 10:00">09:00 - 10:00 AM</option>
                          <option value="10:00 - 11:00">10:00 - 11:00 AM</option>
                          <option value="15:00 - 16:00">15:00 - 16:00 PM</option>
                        </select>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Special Requests */}
              <div className="bg-white rounded-2xl p-4 border border-surface-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500 mb-3 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Anything missing?
                </h3>
                <p className="text-xs text-surface-500 mb-2">Can't find a specific snack, milk alternative, or brand? Request it here and we'll source it for you.</p>
                <textarea
                  value={customRequests}
                  onChange={e => setCustomRequests(e.target.value)}
                  rows={2}
                  placeholder="e.g., We'd love to have Oatly Barista Edition next time..."
                  className="input-field resize-none text-sm bg-surface-50"
                />
              </div>

              {/* Order Notes */}
              <div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={1}
                  placeholder="Any logistics or delivery notes?"
                  className="input-field resize-none text-sm text-surface-600 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Submit */}
        <div className="border-t border-surface-200 p-6 bg-white shrink-0">
          {surcharge > 0 && cart.length > 0 && (
            <div className="flex items-center justify-between text-sm mb-4 px-2">
              <span className="text-surface-600 font-medium">Specific Time Surcharge</span>
              <span className="font-bold text-amber-600">+€{surcharge.toFixed(2)}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={cart.length === 0}
            className="w-full btn-primary py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm Booking
          </button>
          <p className="text-center text-xs text-surface-400 mt-3 font-medium">
            B2B Workflow: No payment required at checkout.<br/>Invoicing is processed post-delivery.
          </p>
        </div>
      </div>
    </>
  );
}
