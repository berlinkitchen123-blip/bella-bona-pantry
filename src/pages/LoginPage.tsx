import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const DEMO_ACCOUNTS = [
    { label: 'Customer — TechFlow GmbH', email: 'office@techflow.de', role: 'customer' },
    { label: 'Admin — Bella & Bona', email: 'chef@bellabona.com', role: 'admin' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network
    const ok = login(email, password);
    if (ok) {
      const isAdmin = email.toLowerCase().endsWith('@bellabona.com');
      navigate(isAdmin ? '/admin/fulfillment' : '/catalog');
    } else {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left panel: Brand Identity */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#004729] p-16 relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-brand-400/10 rounded-full blur-[60px]" />

        <div className="relative z-10">
          <div className="mb-16">
            <img 
              src="./logo.png" 
              alt="Bella & Bona Logo" 
              className="h-10 w-auto invert brightness-0" // White version of logo for dark background
            />
          </div>
          
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-8 font-sans tracking-tight">
            The future of <br/>
            <span className="text-brand-300">workplace wellness</span>
          </h1>
          
          <p className="text-brand-50/70 text-xl font-medium leading-relaxed max-w-md">
            Seamlessly restock your office pantry with locally sourced, healthy snacks and drinks.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
          <div>
            <p className="text-white font-bold text-lg mb-1">Weekly Stock</p>
            <p className="text-brand-100/60 text-sm">Curated selection of fresh essentials delivered directly.</p>
          </div>
          <div>
            <p className="text-white font-bold text-lg mb-1">Express Drops</p>
            <p className="text-brand-100/60 text-sm">Need it morning-fresh? Priority delivery before 11 AM.</p>
          </div>
        </div>
      </div>

      {/* Right panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-surface-50">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl border border-surface-100 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img src="./logo.png" alt="Bella & Bona" className="h-8 w-auto" />
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-surface-900 tracking-tight mb-2">Member Portal</h2>
            <p className="text-surface-500 font-medium tracking-wide">Sign in to manage your office pantry</p>
          </div>

          {/* Quick Demo Logins - Tabular style */}
          <div className="mb-8 p-4 bg-surface-50 rounded-2xl border border-surface-200">
            <p className="text-[10px] font-black text-brand-900 uppercase tracking-widest mb-3">Quick Access (Simulated)</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc.email)}
                  id={`demo-${acc.role}`}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-brand-900 hover:text-white rounded-xl shadow-sm border border-surface-100 transition-all duration-300 group"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold transition-colors">{acc.label}</p>
                    <p className="text-[10px] opacity-60 font-mono">{acc.email}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-surface-50 group-hover:bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="login-email">
                Corporate Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                  <Mail className="w-4 h-4 text-surface-300" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="login-password">
                Secure Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                  <Lock className="w-4 h-4 text-surface-300" />
                </div>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-300 hover:text-brand-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold animate-shake">
                <span className="mr-2">✕</span> {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold transition-all hover:bg-brand-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 group shadow-brand-900/10 shadow-lg"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-10 pt-8 border-t border-surface-100 text-center">
             <p className="text-[11px] text-surface-400 font-medium leading-relaxed">
               Part of the Bella & Bona Corporate Network. <br/>
               By signing in, you agree to our <span className="text-brand-800 font-bold hover:underline cursor-pointer">Terms of Service</span>.
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
