import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import CoinsPage from './pages/admin/CoinsPage';
import ContentPage from './pages/admin/ContentPage';
import DashboardPage from './pages/admin/DashboardPage';
import LanguagesPage from './pages/admin/LanguagesPage';
import ReportsPage from './pages/admin/ReportsPage';
import RoleApprovalsPage from './pages/admin/RoleApprovalsPage';
import SettingsPage from './pages/admin/SettingsPage';
import TranslationsPage from './pages/admin/TranslationsPage';
import UsersPage from './pages/admin/UsersPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

export default function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<SignupPage />} path="/signup" />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<UsersPage />} path="/users" />
          <Route element={<RoleApprovalsPage />} path="/role-approvals" />
          <Route element={<ContentPage type="posts" />} path="/posts" />
          <Route element={<ContentPage type="reels" />} path="/reels" />
          <Route element={<ReportsPage />} path="/reports" />
          <Route element={<LanguagesPage />} path="/languages" />
          <Route element={<TranslationsPage />} path="/translations" />
          <Route element={<CoinsPage />} path="/coins" />
          <Route element={<SettingsPage />} path="/settings" />
        </Route>
      </Route>
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}