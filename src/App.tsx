import type { ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

import Header from './components/Header';
import CartSidebar from './components/CartSidebar';

import LoginPage from './pages/LoginPage';
import CatalogPage from './pages/CatalogPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import AdminFulfillmentPage from './pages/AdminFulfillmentPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import AdminInvoicesPage from './pages/AdminInvoicesPage';

// Protectors
function ProtectedRoute({ children, reqAdmin = false }: { children: ReactNode, reqAdmin?: boolean }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (reqAdmin && !isAdmin) return <Navigate to="/catalog" replace />;
  if (!reqAdmin && isAdmin) return <Navigate to="/admin/fulfillment" replace />;
  return children;
}

// Sub-app with hooks loaded
function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <>
      <Header />

      {!isAdmin && user && (
        <CartSidebar onOrderPlaced={(id) => alert(`Order ${id} placed successfully!`)} />
      )}

      <main className={user ? "bg-surface-50 min-h-[calc(100vh-64px)]" : ""}>
        <Routes>
          <Route path="/" element={user ? <Navigate to={isAdmin ? "/admin/fulfillment" : "/catalog"} /> : <LoginPage />} />

          {/* Customer */}
          <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><CustomerOrdersPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/fulfillment" element={<ProtectedRoute reqAdmin><AdminFulfillmentPage /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute reqAdmin><AdminInventoryPage /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute reqAdmin><AdminInvoicesPage /></ProtectedRoute>} />
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
