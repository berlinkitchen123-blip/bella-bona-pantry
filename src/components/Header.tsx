import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ClipboardList, LogOut, Package, Building2, Lock } from 'lucide-react';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname === `/${path}`
      ? 'text-brand-900 border-b-2 border-brand-900'
      : 'text-surface-500 hover:text-brand-800 transition-colors';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <img 
              src="./logo.png" 
              alt="Bella & Bona" 
              className="h-6 w-auto object-contain"
              onError={(e) => {
                // Fallback if logo fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col border-l border-brand-100 pl-3">
              <span className="text-[10px] font-bold text-brand-900 leading-tight uppercase tracking-[0.2em]">
                {isAdmin ? 'Management' : 'Pantry'}
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center gap-2">
            {isAdmin ? (
              <>
                <Link
                  to="admin/fulfillment"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all ${isActive('admin/fulfillment')}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Fulfillment
                </Link>
                <Link
                  to="admin/inventory"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all ${isActive('admin/inventory')}`}
                >
                  <Package className="w-4 h-4" />
                  Inventory
                </Link>
                <Link
                  to="admin/invoices"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all ${isActive('admin/invoices')}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Invoices
                </Link>
                <Link
                  to="admin/customers"
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-all ${isActive('admin/customers')}`}
                >
                  <Building2 className="w-4 h-4" />
                  Customers
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="catalog"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all ${isActive('catalog')}`}
                >
                  <Package className="w-4 h-4" />
                  Catalog
                </Link>
                <Link
                  to="orders"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all ${isActive('orders')}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  My Orders
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Cart badge (customer only) */}
            {!isAdmin && (
              <Link
                to="catalog"
                className="relative p-2.5 rounded-2xl bg-surface-50 hover:bg-brand-50 hover:text-brand-700 transition-all active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-brand-900 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* SSL Lock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-2xl hidden md:flex">
               <Lock className="w-3.5 h-3.5" />
               <span className="text-[10px] font-black uppercase tracking-widest">SSL Secure</span>
            </div>

            {/* User Profile */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-surface-100">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-surface-900 leading-tight">{user.name}</span>
                <span className="text-[10px] text-brand-700 font-bold leading-tight tracking-wide">{user.company}</span>
              </div>
              <div className="w-8 h-8 rounded-2xl bg-brand-900 flex items-center justify-center text-white shadow-sm ring-2 ring-brand-50">
                <span className="text-xs font-black">
                  {user.name.charAt(0)}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2.5 rounded-2xl text-surface-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
