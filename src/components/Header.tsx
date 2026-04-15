import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ClipboardList, LogOut, Package, ChefHat } from 'lucide-react';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname === `/${path}`
      ? 'text-brand-600 border-b-2 border-brand-500'
      : 'text-surface-500 hover:text-surface-800';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight tracking-tight text-surface-900">
                Bella & Bona
              </span>
              <span className="text-[10px] font-medium text-surface-400 leading-tight uppercase tracking-wider">
                {isAdmin ? 'Management' : 'Pantry'}
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden sm:flex items-center gap-1">
            {isAdmin ? (
              <>
                <Link
                  to="admin/fulfillment"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${isActive('admin/fulfillment')}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Fulfillment
                </Link>
                <Link
                  to="admin/inventory"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${isActive('admin/inventory')}`}
                >
                  <Package className="w-4 h-4" />
                  Inventory
                </Link>
                <Link
                  to="admin/invoices"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${isActive('admin/invoices')}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  Invoices
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="catalog"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${isActive('catalog')}`}
                >
                  <Package className="w-4 h-4" />
                  Catalog
                </Link>
                <Link
                  to="orders"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${isActive('orders')}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  My Orders
                </Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart badge (customer only) */}
            {!isAdmin && (
              <Link
                to="catalog"
                className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-surface-600" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-in shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-surface-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-surface-700 leading-tight">{user.name}</span>
                <span className="text-[10px] text-surface-400 leading-tight">{user.company}</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"
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
