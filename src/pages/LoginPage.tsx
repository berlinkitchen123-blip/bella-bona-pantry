import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, User as UserIcon, Building2, MapPin } from 'lucide-react';

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || (err as { message?: string })?.message || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email. Try creating one instead.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.';
    case 'auth/popup-timeout':
      return 'Google sign-in took too long to respond. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C41.021 35.517 44 30.169 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const resetFormState = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetFormState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) { setError('Please fill in all required fields.'); return; }

    if (mode === 'signup') {
      if (!name || !company || !companyAddress) { setError('Please fill in all required fields.'); return; }
      if (password.length < 6) { setError('Password should be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signupWithEmail(email, password, { name, company, companyAddress });
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left panel: Brand Identity */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#004729] p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-brand-400/10 rounded-full blur-[60px]" />

        <div className="relative z-10">
          <div className="mb-16">
            <img
              src="./logo.png"
              alt="Bella & Bona Logo"
              className="h-10 w-auto invert brightness-0"
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

      {/* Right panel: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-surface-50">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl border border-surface-100 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img src="./logo.png" alt="Bella & Bona" className="h-8 w-auto" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-surface-900 tracking-tight mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-surface-500 font-medium tracking-wide">
              {mode === 'signin' ? 'Sign in to manage your office pantry' : 'Set up your company pantry portal'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex mb-8 p-1 bg-surface-50 rounded-2xl border border-surface-200">
            <button
              type="button"
              id="tab-signin"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'signin' ? 'bg-white text-brand-900 shadow-sm' : 'text-surface-400'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'signup' ? 'bg-white text-brand-900 shadow-sm' : 'text-surface-400'}`}
            >
              Sign Up
            </button>
          </div>

          <button
            type="button"
            id="google-auth-button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full mb-6 py-3.5 bg-white border-2 border-surface-100 rounded-2xl font-bold text-sm text-surface-700 transition-all hover:border-surface-200 hover:shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-surface-100" />
            <span className="text-[10px] font-black text-surface-300 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-surface-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="signup-name">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                      <UserIcon className="w-4 h-4 text-surface-300" />
                    </div>
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-12 pr-4 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="signup-company">
                    Company Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                      <Building2 className="w-4 h-4 text-surface-300" />
                    </div>
                    <input
                      id="signup-company"
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
                  <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="signup-address">
                    Company Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                      <MapPin className="w-4 h-4 text-surface-300" />
                    </div>
                    <input
                      id="signup-address"
                      type="text"
                      value={companyAddress}
                      onChange={e => setCompanyAddress(e.target.value)}
                      placeholder="123 Business Rd, Berlin"
                      className="w-full pl-12 pr-4 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                      autoComplete="street-address"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="login-email">
                Email
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
                Password
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
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-black text-surface-400 uppercase tracking-widest mb-2" htmlFor="signup-confirm-password">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-600">
                    <Lock className="w-4 h-4 text-surface-300" />
                  </div>
                  <input
                    id="signup-confirm-password"
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-surface-50 border-transparent focus:border-brand-600 focus:bg-white rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-surface-300"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold animate-shake">
                <span className="mr-2">✕</span> {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold transition-all hover:bg-brand-800 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 group shadow-brand-900/10 shadow-lg"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-10 pt-8 border-t border-surface-100 text-center">
             <p className="text-[11px] text-surface-400 font-medium leading-relaxed">
               Part of the Bella & Bona Corporate Network. <br/>
               By continuing, you agree to our <span className="text-brand-800 font-bold hover:underline cursor-pointer">Terms of Service</span>.
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
