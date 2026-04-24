/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<CRM />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="orders" element={<Orders />} />
          <Route path="production" element={<Production />} />
          <Route path="quality" element={<QualityControl />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="warehouse" element={<Warehouse />} />
          <Route path="reports" element={<Reporting />} />
        </Route>
      </Routes>
    </Router>
  );
}
