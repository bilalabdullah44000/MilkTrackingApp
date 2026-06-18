import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { OwnerRoute } from './routes/OwnerRoute';
import { OwnerLayout } from './layouts/OwnerLayout';
import { WorkerLayout } from './layouts/WorkerLayout';
import LoginPage from './pages/auth/LoginPage';
import OwnerDashboard from './pages/dashboard/OwnerDashboard';
import VendorsPage from './pages/vendors/VendorsPage';
import CustomersPage from './pages/customers/CustomersPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import DeliveriesPage from './pages/deliveries/DeliveriesPage';
import BulkDeliveryPage from './pages/deliveries/BulkDeliveryPage';
import BillingPage from './pages/billing/BillingPage';
import UsersPage from './pages/users/UsersPage';
import { Role } from './types';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute />}>
        {user?.role === Role.OWNER ? (
          <Route element={<OwnerLayout />}>
            <Route path="/" element={<OwnerDashboard />} />
            <Route element={<OwnerRoute />}>
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/deliveries/bulk-add" element={<BulkDeliveryPage />} />
          </Route>
        ) : (
          <Route element={<WorkerLayout />}>
            <Route path="/" element={<Navigate to="/deliveries" replace />} />
            <Route path="/deliveries" element={<DeliveriesPage />} />
            <Route path="/deliveries/bulk-add" element={<BulkDeliveryPage />} />
          </Route>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
