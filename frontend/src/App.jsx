// frontend/src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

import { AuthProvider, getRoleRedirect, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import TopBar from './components/Layout/TopBar.jsx';

import { sound } from './utils/sound.js';

// Pages
import HomePage        from './pages/HomePage.jsx';
import AuthPage        from './pages/AuthPage.jsx';
import POSShell        from './pages/POSShell.jsx';
import KitchenDisplay  from './pages/KitchenDisplay.jsx';
import CustomerDisplay from './pages/CustomerDisplay.jsx';
import Dashboard       from './pages/Dashboard.jsx';
import OrderScreen     from './pages/OrderScreen.jsx';
import CustomerOrderPage from './pages/CustomerOrderPage.jsx';

// Admin Pages
import AdminLayout     from './pages/admin/AdminLayout.jsx';
import AdminDashboard  from './pages/admin/AdminDashboard.jsx';
import Branches        from './pages/admin/Branches.jsx';
import AdminOrders     from './pages/admin/AdminOrders.jsx';
import AdminProducts   from './pages/admin/AdminProducts.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import FloorPlan       from './pages/admin/FloorPlan.jsx';
import AdminSettings   from './pages/admin/AdminSettings.jsx';

// Components
import FloorView from './components/POS/FloorView.jsx';

// ✅ Layout Wrapper
function POSLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

// Smart fallback: if logged in redirect to role home, else go to login
function SmartFallback() {
  const { user } = useAuth();
  if (user) return <Navigate to={getRoleRedirect(user.role)} replace />;
  return <Navigate to="/login" replace />;
}

// ✅ Animated Routes
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        {/* Root → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />

        {/* Kitchen — unprotected (kiosk mode) */}
        <Route path="/kitchen" element={<KitchenDisplay />} />

        {/* Customer display — smart (passive kiosk OR logged-in personal) */}
        <Route path="/customer" element={<CustomerDisplay />} />

        {/* Mobile ordering — public, no auth (link via QR at table) */}
        <Route path="/menu" element={<CustomerOrderPage />} />

        {/* POS Root → redirect */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'cashier']}>
              <POSShell />
            </ProtectedRoute>
          }
        />

        {/* Floor View */}
        <Route
          path="/pos/floor"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'cashier']}>
              <POSLayout>
                <FloorView />
              </POSLayout>
            </ProtectedRoute>
          }
        />

        {/* Order Screen — with table */}
        <Route
          path="/pos/order/:tableId"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'cashier']}>
              <POSLayout>
                <OrderScreen />
              </POSLayout>
            </ProtectedRoute>
          }
        />

        {/* Register — no table (for branches without floor plan) */}
        <Route
          path="/pos/register"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'cashier']}>
              <POSLayout>
                <OrderScreen />
              </POSLayout>
            </ProtectedRoute>
          }
        />

        {/* Legacy Dashboard (still accessible) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Panel ───────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"  element={<AdminDashboard />} />
          <Route path="branches"   element={<Branches />} />
          <Route path="orders"     element={<AdminOrders />} />
          <Route path="products"   element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="floor-plan" element={<FloorPlan />} />
          <Route path="settings"   element={<AdminSettings />} />
        </Route>

        {/* Smart Fallback */}
        <Route path="*" element={<SmartFallback />} />

      </Routes>
    </AnimatePresence>
  );
}

// ✅ Main App
export default function App() {
  useEffect(() => {
    const unlock = () => sound.unlock();
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '12px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              padding: '10px 14px',
            },
          }}
        />
        <AnimatedRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}