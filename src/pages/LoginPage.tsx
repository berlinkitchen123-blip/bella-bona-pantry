import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChefHat, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex bg-gradient-to-br from-surface-50 via-white to-brand-50">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-900 to-surface-800 p-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Bella & Bona</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your office pantry,<br />
            <span className="text-gradient">restocked effortlessly.</span>
          </h1>
          <p className="text-surface-400 text-lg leading-relaxed">
            Order fresh dairy, bakery, snacks & drinks for your team — delivered daily with your lunch.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative space-y-4">
          {[
            { icon: '🥛', text: 'Fresh pantry items stocked weekly' },
            { icon: '🚚', text: 'Free delivery with your daily lunch order' },
            { icon: '⚡', text: 'Express morning delivery before 11:00 AM' },
            { icon: '📋', text: 'No price decisions — we handle invoicing' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-surface-300 text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-surface-900">Bella & Bona</span>
          </div>

          <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
          <p className="text-surface-500 text-sm mb-8">Sign in to manage your pantry orders</p>

          {/* Demo quick-login buttons */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Quick Demo Logins</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc.email)}
                  id={`demo-${acc.role}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-all duration-200 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-700">{acc.label}</p>
                    <p className="text-xs text-surface-400">{acc.email}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400" />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5" htmlFor="login-email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-600 mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-surface-400">
            Admin staff: use your <span className="font-semibold text-surface-600">@bellabona.com</span> email to access the management dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
