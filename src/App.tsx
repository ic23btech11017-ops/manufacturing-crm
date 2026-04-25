/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Quotations from './pages/Quotations';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Procurement from './pages/Procurement';
import QualityControl from './pages/QualityControl';
import Warehouse from './pages/Warehouse';
import Reporting from './pages/Reporting';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={
              <ProtectedRoute allowedRoles={['admin','manager','production_lead','procurement_officer','warehouse_operator']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="clients" element={
              <ProtectedRoute allowedRoles={['admin','manager']}>
                <CRM />
              </ProtectedRoute>
            } />
            <Route path="procurement" element={
              <ProtectedRoute allowedRoles={['admin','procurement_officer']}>
                <Procurement />
              </ProtectedRoute>
            } />
            <Route path="quotations" element={
              <ProtectedRoute allowedRoles={['admin','manager']}>
                <Quotations />
              </ProtectedRoute>
            } />
            <Route path="orders" element={
              <ProtectedRoute allowedRoles={['admin','manager']}>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="production" element={
              <ProtectedRoute allowedRoles={['admin','production_lead']}>
                <Production />
              </ProtectedRoute>
            } />
            <Route path="quality" element={
              <ProtectedRoute allowedRoles={['admin','production_lead']}>
                <QualityControl />
              </ProtectedRoute>
            } />
            <Route path="inventory" element={
              <ProtectedRoute allowedRoles={['admin','production_lead','procurement_officer','warehouse_operator']}>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="warehouse" element={
              <ProtectedRoute allowedRoles={['admin','procurement_officer','warehouse_operator']}>
                <Warehouse />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['admin','manager']}>
                <Reporting />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
