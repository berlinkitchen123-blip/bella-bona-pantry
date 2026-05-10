import { useState } from 'react';
import { UserPlus, Search, Building2, Mail, MapPin, ShieldCheck, ShieldAlert, MoreVertical, CheckCircle2, Clock, X } from 'lucide-react';
import type { Customer } from '../types';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  
  // Mock initial data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'cust-1',
      companyName: 'TechFlow GmbH',
      contactPerson: 'Sarah Müller',
      email: 'office@techflow.de',
      address: 'Friedrichstraße 12, Berlin',
      status: 'active',
      pantryTier: 'premium',
      onboardedAt: '2026-01-15',
      lastLogin: '2026-05-09 14:22',
      allowSpecificTime: true
    },
    {
      id: 'cust-2',
      companyName: 'GreenLabs Berlin',
      contactPerson: 'Marc Schmidt',
      email: 'pantry@greenlabs.io',
      address: 'Am Park 4, Berlin',
      status: 'active',
      pantryTier: 'basic',
      onboardedAt: '2026-02-20',
      lastLogin: '2026-05-10 09:15',
      allowSpecificTime: false
    },
    {
      id: 'cust-3',
      companyName: 'SolarScale',
      contactPerson: 'Julia Wagner',
      email: 'hello@solarscale.com',
      address: 'Kantstraße 99, Berlin',
      status: 'pending',
      pantryTier: 'enterprise',
      onboardedAt: '2026-05-08',
      allowSpecificTime: true
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCust, setNewCust] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    address: '',
    tier: 'basic' as Customer['pantryTier']
  });

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus: Customer['status'] = c.status === 'active' ? 'suspended' : 'active';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      id: `cust-${Date.now()}`,
      companyName: newCust.companyName,
      contactPerson: newCust.contactPerson,
      email: newCust.email,
      address: newCust.address,
      status: 'pending',
      pantryTier: newCust.tier,
      onboardedAt: new Date().toISOString().split('T')[0],
      allowSpecificTime: newCust.tier !== 'basic'
    };
    setCustomers([customer, ...customers]);
    setShowAddModal(false);
    setNewCust({ companyName: '', contactPerson: '', email: '', address: '', tier: 'basic' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight mb-2">Customer Management</h1>
          <p className="text-surface-500 font-medium tracking-wide">Onboard new accounts and manage portal access permissions.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary shadow-brand-900/10 hover:shadow-brand-900/20"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Onboard New Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[24px] border border-surface-100 shadow-sm">
          <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em] mb-4">Total Partners</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-brand-900 leading-none">{customers.length}</h3>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+2 this month</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-surface-100 shadow-sm">
          <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.15em] mb-4">Active Portals</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-brand-900 leading-none">{customers.filter(c => c.status === 'active').length}</h3>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">94% Retention</span>
          </div>
        </div>
        <div className="bg-brand-900 p-6 rounded-[24px] shadow-lg shadow-brand-900/20">
          <p className="text-[10px] font-black text-brand-200 uppercase tracking-[0.15em] mb-4">Pending Approvals</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-white leading-none">{customers.filter(c => c.status === 'pending').length}</h3>
            <div className="animate-pulse w-2 h-2 rounded-full bg-brand-300" />
          </div>
        </div>
      </div>

      {/* Main Table Area */}
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
          <div className="flex items-center gap-2">
             <button className="px-4 py-2 text-xs font-black uppercase text-surface-400 hover:text-brand-900 border border-surface-100 rounded-xl transition-all">Export CVS</button>
             <button className="px-4 py-2 text-xs font-black uppercase text-surface-400 hover:text-brand-900 border border-surface-100 rounded-xl transition-all">Filters</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Company & Tier</th>
                <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Access Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Connectivity</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-brand-50/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-900 group-hover:scale-105 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-surface-900 text-base tracking-tight">{customer.companyName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            customer.pantryTier === 'enterprise' ? 'bg-brand-900 text-white' : 
                            customer.pantryTier === 'premium' ? 'bg-brand-100 text-brand-900' : 
                            'bg-surface-100 text-surface-600'
                          }`}>
                            {customer.pantryTier}
                          </span>
                          {customer.allowSpecificTime && (
                             <span className="text-[9px] font-black text-brand-600 uppercase border border-brand-200 px-2 py-0.5 rounded-md">Express Delivery</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                           <Mail className="w-3.5 h-3.5 text-surface-300" />
                           {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-surface-400">
                           <MapPin className="w-3.5 h-3.5" />
                           {customer.address}
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => toggleStatus(customer.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${
                        customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100 ring-4 ring-green-500/0 hover:ring-green-500/10' :
                        customer.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-sm' :
                        'bg-red-50 text-red-700 border-red-100 grayscale hover:grayscale-0'
                      }`}
                    >
                      {customer.status === 'active' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      <span className="text-[11px] font-black uppercase tracking-wider">{customer.status}</span>
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-bold text-surface-900 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-surface-300" /> 
                         {customer.lastLogin ? customer.lastLogin : 'Never'}
                      </p>
                      <p className="text-[10px] text-surface-400 font-medium">Onboarded {customer.onboardedAt}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-surface-300 hover:text-brand-900 hover:bg-surface-50 rounded-xl transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up relative">
            <div className="flex items-center justify-between px-10 py-8 border-b border-surface-50">
              <div>
                <h3 className="text-2xl font-black text-brand-900 tracking-tight mb-1">Customer Onboarding</h3>
                <p className="text-sm font-medium text-surface-400">Setup a new corporate portal access.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-12 h-12 flex items-center justify-center bg-surface-50 text-surface-400 hover:text-brand-900 rounded-full transition-all"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Company Name</label>
                  <input 
                    required
                    className="input-field"
                    value={newCust.companyName}
                    onChange={e => setNewCust({...newCust, companyName: e.target.value})}
                    placeholder="e.g. Acme Tech Ltd"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Contact Person</label>
                  <input 
                    required
                    className="input-field"
                    value={newCust.contactPerson}
                    onChange={e => setNewCust({...newCust, contactPerson: e.target.value})}
                    placeholder="First & Last Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Login Email Address</label>
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
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Delivery Address (Floor, Office)</label>
                <input 
                  required
                  className="input-field"
                  value={newCust.address}
                  onChange={e => setNewCust({...newCust, address: e.target.value})}
                  placeholder="Street, Number, Zip"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2">Pantry Service Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['basic', 'premium', 'enterprise'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewCust({...newCust, tier: t})}
                      className={`py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                        newCust.tier === t ? 'border-brand-900 bg-brand-50 text-brand-900 shadow-sm' : 'border-surface-100 text-surface-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">{t}</span>
                      <span className="text-[10px] font-bold opacity-70">
                        {t === 'basic' ? 'Standard' : t === 'premium' ? 'Express' : 'Dedicated'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  type="reset"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 font-black uppercase tracking-widest text-surface-400 hover:text-brand-900 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-[2] btn-primary py-5 h-full text-base"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Finalize Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
