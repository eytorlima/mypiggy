import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { AppLayout } from '../components/layout/AppLayout';

import { WelcomePage } from '../pages/Welcome/WelcomePage';
import { LoginOptionsPage } from '../pages/Login/LoginOptionsPage';
import { LoginPage } from '../pages/Login/LoginPage';
import { RegisterPage } from '../pages/Register/RegisterPage';
import { PrivacyPage } from '../pages/Privacy/PrivacyPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';

import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { TransactionsPage } from '../pages/Transactions/TransactionsPage';
import { GoalsPage } from '../pages/Goals/GoalsPage';
import { ActionsPage } from '../pages/Actions/ActionsPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login-options" element={<LoginOptionsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Rotas privadas — todas filhas do AppLayout */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/actions" element={<ActionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}