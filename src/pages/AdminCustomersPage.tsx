import { useState, useEffect } from 'react';
import { UserPlus, Search, Building2, Mail, MapPin, ShieldCheck, ShieldAlert, MoreVertical, CheckCircle2, Clock, X, ShoppingCart } from 'lucide-react';
import { ref, onValue, set, update } from 'firebase/database';
import { db } from '../firebase';
import { useOrders } from '../context/OrderContext';
import type { Customer } from '../types';

interface CustomerWithOrders extends Customer {
  ordersCount: number;
  lastOrderDate?: string;
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    companyName: '', contactPerson: '', email: '', address: '',
    tier: 'basic' as Customer['pantryTier']
  });

  const { orders } = useOrders();

  // Firebase users (role === 'customer')
  const [firebaseCustomers, setFirebaseCustomers] = useState<CustomerWithOrders[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'users'), (snapshot) => {
      const data = snapshot.val();
      if (!data) { setFirebaseCustomers([]); return; }
      const entries = Object.entries(data) as Array<[string, Record<string, unknown>]>;
      const list: CustomerWithOrders[] = entries
        .filter(([, u]) => u['role'] === 'customer')
        .map(([uid, u]) => ({
          id: uid,
          companyName: String(u['company'] || u['name'] || 'Unknown'),
          contactPerson: String(u['name'] || ''),
          email: String(u['email'] || ''),
          address: String(u['companyAddress'] || ''),
          status: String(u['status'] || 'active') as Customer['status'],
          pantryTier: String(u['pantryTier'] || 'basic') as Customer['pantryTier'],
          onboardedAt: String(u['onboardedAt'] || new Date().toISOString().split('T')[0]),
          lastLogin: u['lastLogin'] as string | undefined,
          allowSpecificTime: Boolean(u['allowSpecificTime'] ?? false),
          ordersCount: 0,
          lastOrderDate: undefined,
        }));
      setFirebaseCustomers(list);
    });
    return () => unsubscribe();
  }, []);

  // Build merged customer list from orders + Firebase users
  useEffect(() => {
    const safeOrders = orders || [];

    // Build map from orders keyed by email
    const orderMap: Record<string, { companyName: string; email: string; address: string; ordersCount: number; lastOrderDate: string }> = {};
    safeOrders.forEach(order => {
      const email = order.companyEmail || '';
      if (!email) return;
      if (!orderMap[email]) {
        orderMap[email] = {
          companyName: order.companyName || email,
          email,
          address: order.companyAddress || '',
          ordersCount: 0,
          lastOrderDate: order.placedAt || '',
        };
      }
      orderMap[email].ordersCount += 1;
      const d = order.placedAt || '';
      if (d > orderMap[email].lastOrderDate) {
        orderMap[email].lastOrderDate = d;
      }
    });

    // Firebase users take priority for same email — merge order counts in
    const fbEmails = new Set(firebaseCustomers.map(c => c.email));
    const fbMerged: CustomerWithOrders[] = firebaseCustomers.map(c => {
      const od = orderMap[c.email];
      return {
        ...c,
        ordersCount: od?.ordersCount ?? 0,
        lastOrderDate: od?.lastOrderDate,
      };
    });

    // Add order-only customers not in Firebase
    const orderOnlyCustomers: CustomerWithOrders[] = Object.values(orderMap)
      .filter(od => !fbEmails.has(od.email))
      .map(od => ({
        id: `order-${od.email}`,
        companyName: od.companyName,
        contactPerson: '',
        email: od.email,
        address: od.address,
        status: 'active' as Customer['status'],
        pantryTier: 'basic' as Customer['pantryTier'],
        onboardedAt: od.lastOrderDate?.split('T')[0] || '',
        lastLogin: undefined,
        allowSpecificTime: false,
        ordersCount: od.ordersCount,
        lastOrderDate: od.lastOrderDate,
      }));

    setCustomers([...fbMerged, ...orderOnlyCustomers]);
  }, [firebaseCustomers, orders]);

  const filteredCustomers = customers.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    if (id.startsWith('order-')) return;
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const next = c.status === 'active' ? 'suspended' : 'active';
    update(ref(db, `users/${id}`), { status: next });
  };

  const handleExportCSV = () => {
    const rows = ['Company,Email,Address,Tier,Status,Onboarded,Orders,Last Order'];
    filteredCustomers.forEach(c => {
      const lastDate = c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-GB') : '';
      rows.push(`${c.companyName},${c.email},${c.address},${c.pantryTier},${c.status},${c.onboardedAt},${c.ordersCount},${lastDate}`);
    });
    const csv = rows.join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'customers.csv';
    a.click();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `cust-${Date.now()}`;
    const record = {
      uid: id, role: 'customer',
      company: newCust.companyName, name: newCust.contactPerson,
      email: newCust.email, companyAddress: newCust.address,
      pantryTier: newCust.tier, status: 'pending',
      onboardedAt: new Date().toISOString().split('T')[0],
      allowSpecificTime: newCust.tier !== 'basic',
    };
    set(ref(db, `users/${id}`), record);
    setShowAddModal(false);
    setNewCust({ companyName: '', contactPerson: '', email: '', address: '', tier: 'basic' });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-2">Customer Management</h1>
          <p className="text-surface-500 font-medium tracking-wide">Onboard new accounts and manage portal access permissions.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <UserPlus className="w-5 h-5 mr-2" /> Onboard New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[24px] border border-surface-100 shadow-sm">
          <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em] mb-4">Total Partners</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-brand-900 leading-none">{customers.length}</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              {customers.filter(c => c.status === 'active').length} active
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-surface-100 shadow-sm">
          <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em] mb-4">Active Portals</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-brand-900 leading-none">
              {customers.filter(c => c.status === 'active').length}
            </h3>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">Live</span>
          </div>
        </div>
        <div className="bg-brand-900 p-6 rounded-[24px] shadow-lg">
          <p className="text-[10px] font-black text-brand-200 uppercase tracking-[0.15em] mb-4">Pending Approvals</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-white leading-none">
              {customers.filter(c => c.status === 'pending').length}
            </h3>
            <div className="animate-pulse w-2 h-2 rounded-full bg-brand-300" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-surface-100 shadow-panel overflow-hidden">
        <div className="px-8 py-6 border-b border-surface-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search companies, emails or contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-50 border-transparent focus:bg-white focus:border-brand-900 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold transition-all outline-none"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-black uppercase text-surface-400 hover:text-brand-900 border border-surface-100 rounded-xl transition-all"
          >
            Export CSV
          </button>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-surface-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold">No customers yet.</p>
            <p className="text-sm mt-1">Customers appear here once they sign up or place an order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Company</th>
                  <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Contact</th>
                  <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Orders</th>
                  <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Onboarded</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-brand-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-900">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-surface-900">{customer.companyName}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${
                            customer.pantryTier === 'enterprise' ? 'bg-brand-900 text-white' :
                            customer.pantryTier === 'premium' ? 'bg-brand-100 text-brand-900' :
                            'bg-surface-100 text-surface-600'
                          }`}>{customer.pantryTier}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                        <Mail className="w-3.5 h-3.5 text-surface-300" />
                        {customer.email}
                      </div>
                      {customer.address ? (
                        <div className="flex items-center gap-2 text-xs text-surface-400 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {customer.address}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-surface-300" />
                        <span className="text-sm font-black text-surface-900">{customer.ordersCount}</span>
                      </div>
                      {customer.lastOrderDate ? (
                        <p className="text-[10px] text-surface-400 mt-1">Last: {formatDate(customer.lastOrderDate)}</p>
                      ) : null}
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => toggleStatus(customer.id)}
                        disabled={customer.id.startsWith('order-')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                          customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                          customer.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        } disabled:cursor-default`}
                      >
                        {customer.status === 'active'
                          ? <ShieldCheck className="w-4 h-4" />
                          : <ShieldAlert className="w-4 h-4" />
                        }
                        <span className="text-[11px] font-black uppercase">{customer.status}</span>
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[11px] font-bold text-surface-900 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-surface-300" />
                        {customer.onboardedAt}
                      </p>
                      {customer.contactPerson
                        ? <p className="text-[10px] text-surface-400 mt-1">{customer.contactPerson}</p>
                        : null
                      }
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-surface-300 hover:text-brand-900 rounded-xl">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between px-10 py-8 border-b border-surface-50">
              <h3 className="text-2xl font-black text-brand-900">Customer Onboarding</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-surface-50 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Company Name</label>
                  <input
                    required
                    className="input-field"
                    value={newCust.companyName}
                    onChange={e => setNewCust({...newCust, companyName: e.target.value})}
                    placeholder="Acme GmbH"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Contact Person</label>
                  <input
                    required
                    className="input-field"
                    value={newCust.contactPerson}
                    onChange={e => setNewCust({...newCust, contactPerson: e.target.value})}
                    placeholder="Max Müller"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  required
                  type="email"
                  className="input-field"
                  value={newCust.email}
                  onChange={e => setNewCust({...newCust, email: e.target.value})}
                  placeholder="office@company.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Delivery Address</label>
                <input
                  required
                  className="input-field"
                  value={newCust.address}
                  onChange={e => setNewCust({...newCust, address: e.target.value})}
                  placeholder="Street, Number, City"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['basic', 'premium', 'enterprise'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewCust({...newCust, tier: t})}
                    className={`p-4 rounded-2xl border-2 text-left ${
                      newCust.tier === t
                        ? 'border-brand-900 bg-brand-50 text-brand-900'
                        : 'border-surface-100 text-surface-400'
                    }`}
                  >
                    {newCust.tier === t && <CheckCircle2 className="w-4 h-4 mb-1" />}
                    <span className="block text-xs font-black uppercase">{t}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-surface-400 font-black uppercase text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-[2] btn-primary py-4">
                  <CheckCircle2 className="w-4 h-4" /> Finalize Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
