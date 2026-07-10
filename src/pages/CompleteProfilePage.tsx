import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, MapPin, ArrowRight } from 'lucide-react';

export default function CompleteProfilePage() {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !companyAddress) { setError('Please fill in both fields.'); return; }
    setError('');
    setLoading(true);
    try {
      await completeProfile({ name: user?.name || '', company, companyAddress });
      navigate('/catalog', { replace: true });
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
      <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl border border-surface-100">
        <h2 className="text-3xl font-black text-surface-900 tracking-tight mb-2">One more step</h2>
        <p className="text-surface-500 font-medium tracking-wide mb-8">
          Tell us about your company so we can set up deliveries for {user?.name}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="profile-company">
              Company Name
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                <Building2 className="w-4 h-4 text-surface-300" />
              </div>
              <input
                id="profile-company"
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="TechFlow GmbH"
                className="w-full pl-12 pr-4 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                autoComplete="organization"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="profile-address">
              Company Address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                <MapPin className="w-4 h-4 text-surface-300" />
              </div>
              <input
                id="profile-address"
                type="text"
                value={companyAddress}
                onChange={e => setCompanyAddress(e.target.value)}
                placeholder="123 Business Rd, Berlin"
                className="w-full pl-12 pr-4 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                autoComplete="street-address"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold">
              <span className="mr-2">✕</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold transition-all hover:bg-brand-800 hover:shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
