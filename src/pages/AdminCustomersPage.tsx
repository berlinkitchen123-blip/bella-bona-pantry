import { useState, useEffect, useRef } from 'react';
import { UserPlus, Search, Building2, Mail, MapPin, ShieldCheck, ShieldAlert, MoreVertical, CheckCircle2, Clock, X, ShoppingCart } from 'lucide-react';
import { ref, onValue, set, update } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth, createAuthAccount } from '../firebase';
import { useOrders } from '../context/OrderContext';
import type { Customer } from '../types';

interface CustomerWithOrders extends Customer {
  ordersCount: number;
  lastOrderDate?: string;
  notes?: string;
  vatNumber?: string;
  iban?: string;
  billingAddress?: string;
  paymentTerms?: string;
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCust, setNewCust] = useState({
    companyName: '', contactPerson: '', email: '', address: '',
    tier: 'basic' as Customer['pantryTier']
  });

  // Edit modal state
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithOrders | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '', contactPerson: '', email: '', address: '',
    tier: 'basic' as Customer['pantryTier'], notes: '',
    vatNumber: '', iban: '', billingAddress: '', paymentTerms: '30 days',
  });

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { orders } = useOrders();

  // Firebase users (role === 'customer')
  const [firebaseCustomers, setFirebaseCustomers] = useState<CustomerWithOrders[]>([]);

  // customerStatus overrides from Firebase (keyed by sanitizedEmail)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: string; updatedAt: string }>>({});

  // customerDetails overrides from Firebase (keyed by sanitizedEmail)
  const [detailsOverrides, setDetailsOverrides] = useState<Record<string, Partial<CustomerWithOrders>>>({});

  const sanitizeEmail = (email: string) => email.replace(/[@.]/g, '_');

  // Load customerStatus on mount
  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'customerStatus'), (snapshot) => {
      const data = snapshot.val();
      if (!data) { setStatusOverrides({}); return; }
      setStatusOverrides(data as Record<string, { status: string; updatedAt: string }>);
    });
    return () => unsubscribe();
  }, []);

  // Load customerDetails on mount
  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'customerDetails'), (snapshot) => {
      const data = snapshot.val();
      if (!data) { setDetailsOverrides({}); return; }
      setDetailsOverrides(data as Record<string, Partial<CustomerWithOrders>>);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      const key = sanitizeEmail(c.email);
      const statusOverride = statusOverrides[key];
      const detailOverride = detailsOverrides[key];
      return {
        ...c,
        ...(detailOverride || {}),
        ordersCount: od?.ordersCount ?? 0,
        lastOrderDate: od?.lastOrderDate,
        status: (statusOverride?.status as Customer['status']) || c.status,
      };
    });

    // Add order-only customers not in Firebase
    const orderOnlyCustomers: CustomerWithOrders[] = Object.values(orderMap)
      .filter(od => !fbEmails.has(od.email))
      .map(od => {
        const key = sanitizeEmail(od.email);
        const statusOverride = statusOverrides[key];
        const detailOverride = detailsOverrides[key];
        return {
          id: `order-${od.email}`,
          companyName: od.companyName,
          contactPerson: '',
          email: od.email,
          address: od.address,
          status: ((statusOverride?.status as Customer['status']) || 'active') as Customer['status'],
          pantryTier: 'basic' as Customer['pantryTier'],
          onboardedAt: od.lastOrderDate?.split('T')[0] || '',
          lastLogin: undefined,
          allowSpecificTime: false,
          ordersCount: od.ordersCount,
          lastOrderDate: od.lastOrderDate,
          ...(detailOverride || {}),
        };
      });

    setCustomers([...fbMerged, ...orderOnlyCustomers]);
  }, [firebaseCustomers, orders, statusOverrides, detailsOverrides]);

  const filteredCustomers = customers.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const next = c.status === 'active' ? 'suspended' : 'active';

    if (id.startsWith('order-')) {
      // Order-extracted customer: store status in /customerStatus/{sanitizedEmail}
      const key = sanitizeEmail(c.email);
      update(ref(db, `customerStatus/${key}`), { status: next, updatedAt: new Date().toISOString() });
    } else {
      // Firebase user: update directly in /users/{id}
      update(ref(db, `users/${id}`), { status: next });
      // Also store in /customerStatus for consistency
      if (c.email) {
        const key = sanitizeEmail(c.email);
        update(ref(db, `customerStatus/${key}`), { status: next, updatedAt: new Date().toISOString() });
      }
    }
  };

  const handlePasswordReset = async (customer: CustomerWithOrders) => {
    if (!customer.email) return;
    try {
      await sendPasswordResetEmail(auth, customer.email);
      alert(`Password reset email sent to ${customer.email}`);
    } catch (err) {
      console.error('Password reset failed:', err);
      alert('Failed to send password reset email. Please try again.');
    }
    setOpenMenuId(null);
  };

  const openEditModal = (customer: CustomerWithOrders) => {
    setEditingCustomer(customer);
    setEditForm({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson || '',
      email: customer.email,
      address: customer.address || '',
      tier: customer.pantryTier,
      notes: customer.notes || '',
      vatNumber: customer.vatNumber || '',
      iban: customer.iban || '',
      billingAddress: customer.billingAddress || '',
      paymentTerms: customer.paymentTerms || '30 days',
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const key = sanitizeEmail(editingCustomer.email);
    update(ref(db, `customerDetails/${key}`), {
      companyName: editForm.companyName,
      contactPerson: editForm.contactPerson,
      email: editForm.email,
      address: editForm.address,
      pantryTier: editForm.tier,
      notes: editForm.notes,
      vatNumber: editForm.vatNumber,
      iban: editForm.iban,
      billingAddress: editForm.billingAddress,
      paymentTerms: editForm.paymentTerms,
      updatedAt: new Date().toISOString(),
    });
    setShowEditModal(false);
    setEditingCustomer(null);
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tempPassword = `BB_${Date.now()}_temp`;
      const uid = await createAuthAccount(newCust.email, tempPassword);
      // Send password setup email
      await sendPasswordResetEmail(auth, newCust.email);
      // Save to Firebase DB with the real UID
      const record = {
        uid, role: 'customer',
        company: newCust.companyName,
        name: newCust.contactPerson,
        email: newCust.email,
        companyAddress: newCust.address,
        pantryTier: newCust.tier,
        status: 'active',
        onboardedAt: new Date().toISOString().split('T')[0],
        allowSpecificTime: newCust.tier !== 'basic',
      };
      await set(ref(db, `users/${uid}`), record);
      alert(`✓ Account created! Password setup email sent to ${newCust.email}`);
      setShowAddModal(false);
      setNewCust({ companyName: '', contactPerson: '', email: '', address: '', tier: 'basic' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                          customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                          customer.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}
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
                    <td className="px-8 py-6 text-right relative">
                      <button
                        className="p-2 text-surface-300 hover:text-brand-900 rounded-xl"
                        onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === customer.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-8 top-full mt-1 z-20 bg-white border border-surface-100 rounded-2xl shadow-lg overflow-hidden min-w-[160px]"
                        >
                          <button
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-surface-700 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                            onClick={() => openEditModal(customer)}
                          >
                            Edit Details
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-surface-700 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                            onClick={() => { toggleStatus(customer.id); setOpenMenuId(null); }}
                          >
                            Toggle Status
                          </button>
                          <button
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-surface-700 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                            onClick={() => handlePasswordReset(customer)}
                          >
                            Reset Password
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between px-10 py-8 border-b border-surface-50">
              <h3 className="text-2xl font-black text-brand-900">Edit Customer</h3>
              <button
                onClick={() => { setShowEditModal(false); setEditingCustomer(null); }}
                className="w-10 h-10 flex items-center justify-center bg-surface-50 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-10 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Company Name</label>
                  <input
                    required
                    className="input-field"
                    value={editForm.companyName}
                    onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                    placeholder="Acme GmbH"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Contact Person</label>
                  <input
                    className="input-field"
                    value={editForm.contactPerson}
                    onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })}
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
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="office@company.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Delivery Address</label>
                <input
                  className="input-field"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Street, Number, City"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">VAT Number (Umsatzsteuer-ID)</label>
                <input
                  className="input-field"
                  value={editForm.vatNumber}
                  onChange={e => setEditForm({ ...editForm, vatNumber: e.target.value })}
                  placeholder="DE123456789"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">IBAN</label>
                <input
                  className="input-field"
                  value={editForm.iban}
                  onChange={e => setEditForm({ ...editForm, iban: e.target.value })}
                  placeholder="DE89 3704 0044 0532 0130 00"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Billing Address (if different)</label>
                <input
                  className="input-field"
                  value={editForm.billingAddress}
                  onChange={e => setEditForm({ ...editForm, billingAddress: e.target.value })}
                  placeholder="Billing Street, Number, City"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Payment Terms</label>
                <select
                  className="input-field"
                  value={editForm.paymentTerms}
                  onChange={e => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                >
                  <option value="30 days">30 days</option>
                  <option value="14 days">14 days</option>
                  <option value="immediate">Immediate</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Pantry Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['basic', 'premium', 'enterprise'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, tier: t })}
                      className={`p-4 rounded-2xl border-2 text-left ${
                        editForm.tier === t
                          ? 'border-brand-900 bg-brand-50 text-brand-900'
                          : 'border-surface-100 text-surface-400'
                      }`}
                    >
                      {editForm.tier === t && <CheckCircle2 className="w-4 h-4 mb-1" />}
                      <span className="block text-xs font-black uppercase">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Notes</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Internal notes about this customer..."
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingCustomer(null); }}
                  className="flex-1 py-3 text-surface-400 font-black uppercase text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-[2] btn-primary py-4">
                  <CheckCircle2 className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
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
              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 font-semibold">
                📧 Customer will receive an email to set their password and can then log in.
              </div>
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
                <button type="submit" disabled={saving} className="flex-[2] btn-primary py-4 disabled:opacity-60">
                  <CheckCircle2 className="w-4 h-4" /> {saving ? 'Creating account...' : 'Finalize Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
