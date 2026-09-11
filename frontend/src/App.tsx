import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockLogsPage } from './pages/StockLogsPage';
import { ChallansPage } from './pages/ChallansPage';
import { ChallanCreatePage } from './pages/ChallanCreatePage';
import { ChallanDetailPage } from './pages/ChallanDetailPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/stock-logs" element={<StockLogsPage />} />
            <Route path="/challans" element={<ChallansPage />} />
            <Route path="/challans/new" element={<ChallanCreatePage />} />
            <Route path="/challans/:id" element={<ChallanDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
