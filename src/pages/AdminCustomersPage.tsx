üimport { useState, useEffect } from 'react';
import { UserPlus, Search, Building2, Mail, MapPin, ShieldCheck, ShieldAlert, MoreVertical, CheckCircle2, Clock, X } from 'lucide-react';
import { ref, onValue, set, update } from 'firebase/database';
import { db } from '../firebase';
import type { Customer } from '../types';

export default function AdminCustomersPage() {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCust, setNewCust] = useState({
          companyName: '', contactPerson: '', email: '', address: '',
          tier: 'basic' as Customer['pantryTier']
    });

  // Load real customers from Firebase /users
  useEffect(() => {
        const unsubscribe = onValue(ref(db, 'users'), (snapshot) => {
                const data = snapshot.val();
                if (!data) { setCustomers([]); return; }
                const list: Customer[] = Object.entries(data)
                  .filter(([, u]: [string, any]) => u.role === 'customer')
                  .map(([uid, u]: [string, any]) => ({
                              id: uid,
                              companyName: u.company || u.name || 'Unknown',
                              contactPerson: u.name || '',
                              email: u.email || '',
                              address: u.companyAddress || '',
                              status: u.status || 'active',
                              pantryTier: u.pantryTier || 'basic',
                              onboardedAt: u.onboardedAt || new Date().toISOString().split('T')[0],
                              lastLogin: u.lastLogin || undefined,
                              allowSpecificTime: u.allowSpecificTime ?? false,
                  }));
                setCustomers(list);
        });
        return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c =>
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
                                               );

  const toggleStatus = (id: string) => {
        const c = customers.find(x => x.id === id);
        if (!c) return;
        const next: Customer['status'] = c.status === 'active' ? 'suspended' : 'active';
        update(ref(db, `users/${id}`), { status: next });
  };

  const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const id = `cust-${Date.now()}`;
        const record = {
                uid: id, role: 'customer',
                company: newCust.companyName,
                name: newCust.contactPerson,
                email: newCust.email,
                companyAddress: newCust.address,
                pantryTier: newCust.tier,
                status: 'pending',
                onboardedAt: new Date().toISOString().split('T')[0],
                allowSpecificTime: newCust.tier !== 'basic',
        };
        set(ref(db, `users/${id}`), record);
        setShowAddModal(false);
        setNewCust({ companyName: '', contactPerson: '', email: '', address: '', tier: 'basic' });
  };

  return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
                      <div>
                                <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-2">Customer Management</h1>h1>
                                <p className="text-surface-500 font-medium tracking-wide">Onboard new accounts and manage portal access permissions.</p>p>
                      </div>div>
                      <button onClick={() => setShowAddModal(true)} className="btn-primary shadow-brand-900/10 hover:shadow-brand-900/20">
                                <UserPlus className="w-5 h-5 mr-2" />
                                Onboard New Customer
                      </button>button>
              </div>div>
        
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                      <div className="bg-white p-6 rounded-[24px] border border-surface-100 shadow-sm">
                                <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em] mb-4">Total Partners</p>p>
                                <div className="flex items-end justify-between">
                                            <h3 className="text-4xl font-black text-brand-900 leading-none">{customers.length}</h3>h3>
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{customers.filter(c => c.status === 'active').length} active</span>span>
                                </div>div>
                      </div>div>
                      <div className="bg-white p-6 rounded-[24px] border border-surface-100 shadow-sm">
                                <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em] mb-4">Active Portals</p>p>
                                <div className="flex items-end justify-between">
                                            <h3 className="text-4xl font-black text-brand-900 leading-none">{customers.filter(c => c.status === 'active').length}</h3>h3>
                                            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">Live</span>span>
                                </div>div>
                      </div>div>
                      <div className="bg-brand-900 p-6 rounded-[24px] shadow-lg shadow-brand-900/20">
                                <p className="text-[10px] font-black text-brand-200 uppercase tracking-[0.15em] mb-4">Pending Approvals</p>p>
                                <div className="flex items-end justify-between">
                                            <h3 className="text-4xl font-black text-white leading-none">{customers.filter(c => c.status === 'pending').length}</h3>h3>
                                            <div className="animate-pulse w-2 h-2 rounded-full bg-brand-300" />
                                </div>div>
                      </div>div>
              </div>div>
        
              <div className="bg-white rounded-[32px] border border-surface-100 shadow-panel overflow-hidden">
                      <div className="px-8 py-6 border-b border-surface-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="relative w-full md:w-96">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                                            <input type="text" placeholder="Search companies, emails or contacts..."
                                                            value={search} onChange={e => setSearch(e.target.value)}
                                                            className="w-full bg-surface-50 border-transparent focus:bg-white focus:border-brand-900 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold transition-all outline-none" />
                                </div>div>
                                <div className="flex items-center gap-2">
                                            <button onClick={() => {
                        const csv = ['Company,Email,Address,Tier,Status,Onboarded',
                                                     ...filteredCustomers.map(c => `${c.companyName},${c.email},${c.address},${c.pantryTier},${c.status},${c.onboardedAt}`)].join('\n');
                        const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
                        a.download = 'customers.csv'; a.click();
        }} className="px-4 py-2 text-xs font-black uppercase text-surface-400 hover:text-brand-900 border border-surface-100 rounded-xl transition-all">Export CSV</button>button>
                                </div>div>
                      </div>div>
              
                {filteredCustomers.length === 0 ? (
                    <div className="p-16 text-center text-surface-400">
                                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold">No customers yet.</p>p>
                                <p className="text-sm mt-1">Customers appear here once they sign up and complete their profile.</p>p>
                    </div>div>
                  ) : (
                    <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                              <thead><tr className="bg-surface-50/50">
                                                              <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Company & Tier</th>th>
                                                              <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Contact Info</th>th>
                                                              <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Access Status</th>th>
                                                              <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Onboarded</th>th>
                                                              <th className="px-8 py-4"></th>th>
                                              </tr>tr></thead>thead>
                                              <tbody className="divide-y divide-surface-100">
                                                {filteredCustomers.map(customer => (
                                        <tr key={customer.id} className="hover:bg-brand-50/20 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                                  <div className="flex items-center gap-4">
                                                                                                          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-900 group-hover:scale-105 transition-transform">
                                                                                                                                    <Building2 className="w-5 h-5" />
                                                                                                            </div>div>
                                                                                                          <div>
                                                                                                                                    <p className="font-bold text-surface-900 text-base tracking-tight">{customer.companyName}</p>p>
                                                                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                                                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                        customer.pantryTier === 'enterprise' ? 'bg-brand-900 text-white' :
                                                                        customer.pantryTier === 'premium' ? 'bg-brand-100 text-brand-900' :
                                                                        'bg-surface-100 text-surface-600'}`}>{customer.pantryTier}</span>span>
                                                                                                                                      {customer.allowSpecificTime && <span className="text-[9px] font-black text-brand-600 uppercase border border-brand-200 px-2 py-0.5 rounded-md">Express</span>span>}
                                                                                                                                      </div>div>
                                                                                                            </div>div>
                                                                                    </div>div>
                                                            </td>td>
                                                            <td className="px-8 py-6">
                                                                                  <div className="flex flex-col gap-1.5">
                                                                                                          <div className="flex items-center gap-2 text-sm font-semibold text-surface-700"><Mail className="w-3.5 h-3.5 text-surface-300" />{customer.email}</div>div>
                                                                                    {customer.address && <div className="flex items-center gap-2 text-xs font-medium text-surface-400"><MapPin className="w-3.5 h-3.5" />{customer.address}</div>div>}
                                                                                    </div>div>
                                                            </td>td>
                                                            <td className="px-8 py-6">
                                                                                  <button onClick={() => toggleStatus(customer.id)}
                                                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${
                                                                                                                                        customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                                                                                        customer.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                                                                                        'bg-red-50 text-red-700 border-red-100'}`}>
                                                                                    {customer.status === 'active' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                                                                                          <span className="text-[11px] font-black uppercase tracking-wider">{customer.status}</span>span>
                                                                                    </button>button>
                                                            </td>td>
                                                            <td className="px-8 py-6">
                                                                                  <p className="text-[11px] font-bold text-surface-900 flex items-center gap-1.5"><Clock className="w-3 h-3 text-surface-300" />{customer.onboardedAt}</p>p>
                                                              {customer.contactPerson && <p className="text-[10px] text-surface-400 font-medium mt-1">{customer.contactPerson}</p>p>}
                                                            </td>td>
                                                            <td className="px-8 py-6 text-right">
                                                                                  <button className="p-2 text-surface-300 hover:text-brand-900 hover:bg-surface-50 rounded-xl transition-all">
                                                                                                          <MoreVertical className="w-5 h-5" />
                                                                                    </button>button>
                                                            </td>td>
                                        </tr>tr>
                                      ))}
                                              </tbody>tbody>
                                </table>table>
                    </div>div>
                      )}
              </div>div>
        
          {showAddModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-md">
                            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up relative">
                                        <div className="flex items-center justify-between px-10 py-8 border-b border-surface-50">
                                                      <div>
                                                                      <h3 className="text-2xl font-black text-brand-900 tracking-tight mb-1">Customer Onboarding</h3>h3>
                                                                      <p className="text-sm font-medium text-surface-400">Setup a new corporate portal access.</p>p>
                                                      </div>div>
                                                      <button onClick={() => setShowAddModal(false)} className="w-12 h-12 flex items-center justify-center bg-surface-50 text-surface-400 hover:text-brand-900 rounded-full transition-all">
                                                                      <X className="w-7 h-7" />
                                                      </button>button>
                                        </div>div>
                                        <form onSubmit={handleAdd} className="p-10 space-y-6">
                                                      <div className="grid grid-cols-2 gap-6">
                                                                      <div>
                                                                                        <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Company Name</label>label>
                                                                                        <input required className="input-field" value={newCust.companyName} onChange={e => setNewCust({...newCust, companyName: e.target.value})} placeholder="e.g. Acme Tech Ltd" />
                                                                      </div>div>
                                                                      <div>
                                                                                        <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Contact Person</label>label>
                                                                                        <input required className="input-field" value={newCust.contactPerson} onChange={e => setNewCust({...newCust, contactPerson: e.target.value})} placeholder="First & Last Name" />
                                                                      </div>div>
                                                      </div>div>
                                                      <div>
                                                                      <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Login Email Address</label>label>
                                                                      <input required type="email" className="input-field" value={newCust.email} onChange={e => setNewCust({...newCust, email: e.target.value})} placeholder="office@company.com" />
                                                      </div>div>
                                                      <div>
                                                                      <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Delivery Address</label>label>
                                                                      <input required className="input-field" value={newCust.address} onChange={e => setNewCust({...newCust, address: e.target.value})} placeholder="Street, Number, Zip" />
                                                      </div>div>
                                                      <div>
                                                                      <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-3">Pantry Service Tier</label>label>
                                                                      <div className="grid grid-cols-3 gap-4">
                                                                        {(['basic', 'premium', 'enterprise'] as const).map(t => (
                                        <button key={t} type="button" onClick={() => setNewCust({...newCust, tier: t})}
                                                                className={`relative p-5 rounded-3xl border-2 text-left transition-all ${
                                                                                          newCust.tier === t ? 'border-brand-900 bg-brand-50/50 text-brand-900' : 'border-surface-100 text-surface-400 bg-white'}`}>
                                          {newCust.tier === t && <div className="absolute -top-1.5 -right-1.5 bg-brand-900 text-white rounded-full p-1"><CheckCircle2 className="w-3.5 h-3.5" /></div>div>}
                                                              <span className="block text-xs font-black uppercase tracking-widest mb-1">{t}</span>span>
                                        </button>button>
                                      ))}
                                                                      </div>div>
                                                      </div>div>
                                                      <div className="pt-4 flex items-center gap-4">
                                                                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-surface-400 hover:text-brand-900 transition-all">Discard</button>button>
                                                                      <button type="submit" className="flex-[2] btn-primary py-5 h-full text-base"><CheckCircle2 className="w-5 h-5" />Finalize Onboarding</button>button>
                                                      </div>div>
                                        </form>form>
                            </div>div>
                  </div>div>
              )}
        </div>div>
      );
}
</div>
