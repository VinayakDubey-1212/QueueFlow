import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { OrgDiscoveryPage } from './pages/OrgDiscoveryPage';
import { OrgDetailPage } from './pages/OrgDetailPage';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { LiveQueuePage } from './pages/LiveQueuePage';
import { AccountPage } from './pages/AccountPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminBranchesPage } from './pages/AdminBranchesPage';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { AdminAuditPage } from './pages/AdminAuditPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/organizations" element={<OrgDiscoveryPage />} />
        <Route path="/organizations/:orgId" element={<OrgDetailPage />} />
        <Route path="/organizations/:orgId/book" element={<BookAppointmentPage />} />
        <Route path="/queue/:entryId" element={<LiveQueuePage />} />
        <Route path="/account" element={<AccountPage />} />

        <Route path="/staff" element={<StaffDashboardPage />} />

        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/branches" element={<AdminBranchesPage />} />
        <Route path="/admin/staff" element={<AdminStaffPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
