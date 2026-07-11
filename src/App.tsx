import type { ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

import Header from './components/Header';
import CartSidebar from './components/CartSidebar';
import AIChatbot from './components/AIChatbot';

import LoginPage from './pages/LoginPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import CatalogPage from './pages/CatalogPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import AdminFulfillmentPage from './pages/AdminFulfillmentPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import AdminInvoicesPage from './pages/AdminInvoicesPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

// Protectors
function ProtectedRoute({ children, reqAdmin = false }: { children: ReactNode, reqAdmin?: boolean }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (reqAdmin && !isAdmin) return <Navigate to="/catalog" replace />;
  if (!reqAdmin && !isAdmin && !user.company) return <Navigate to="/complete-profile" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <svg className="w-8 h-8 animate-spin text-brand-900" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );
}

function AppRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const homeRedirect = isAdmin ? 'admin/fulfillment' : (user?.company ? 'catalog' : 'complete-profile');

  return (
    <>
      <Header />

      {!isAdmin && user && (
        <CartSidebar onOrderPlaced={(id) => alert(`Order ${id} placed successfully!`)} />
      )}

      {user && <AIChatbot />}

      <main className={user ? "bg-surface-50 min-h-[calc(100vh-64px)]" : ""}>
        <Routes>
          <Route path="/" element={user ? <Navigate to={homeRedirect} replace /> : <LoginPage />} />

          {/* Customer */}
          <Route path="complete-profile" element={user ? <CompleteProfilePage /> : <Navigate to="/" replace />} />
          <Route path="catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><CustomerOrdersPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="admin/fulfillment" element={<ProtectedRoute reqAdmin><AdminFulfillmentPage /></ProtectedRoute>} />
          <Route path="admin/inventory" element={<ProtectedRoute reqAdmin><AdminInventoryPage /></ProtectedRoute>} />
          <Route path="admin/invoices" element={<ProtectedRoute reqAdmin><AdminInvoicesPage /></ProtectedRoute>} />
          <Route path="admin/customers" element={<ProtectedRoute reqAdmin><AdminCustomersPage /></ProtectedRoute>} />
          <Route path="admin/analytics" element={<ProtectedRoute reqAdmin><AdminAnalyticsPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
}
