import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { AuthService } from './services/auth.service';
import { subscribeToStorage, initializeStorage } from './lib/storage';

// Layout & Common
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { FDRListPage } from './pages/fdr/FDRListPage';
import { SubmitFDRPage } from './pages/fdr/SubmitFDRPage';
import { FDRDetailPage } from './pages/fdr/FDRDetailPage';
import { BankVerificationPage } from './pages/bank/BankVerificationPage';
import { RegulatoryReviewPage } from './pages/regulatory/RegulatoryReviewPage';
import { EscalationPage } from './pages/lifecycle/EscalationPage';
import { ReleaseReadinessPage } from './pages/lifecycle/ReleaseReadinessPage';
import { MaturityCalendarPage } from './pages/lifecycle/MaturityCalendarPage';
import { RenewalsPage } from './pages/lifecycle/RenewalsPage';
import { ReconciliationPage } from './pages/reconciliation/ReconciliationPage';
import { InterestAnalyticsPage } from './pages/analytics/InterestAnalyticsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditTrailPage } from './pages/audit/AuditTrailPage';
import { UsersPage } from './pages/admin/UsersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { RegistrationRequestsPage } from './pages/admin/RegistrationRequestsPage';
import { QRVerificationPage } from './pages/verification/QRVerificationPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(AuthService.getCurrentUser());

  useEffect(() => {
    initializeStorage();
    const update = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };
    update();
    const unsub = subscribeToStorage(update);
    return unsub;
  }, []);

  const handleUserChanged = (newUser?: User) => {
    if (newUser) {
      AuthService.switchUser(newUser);
      setCurrentUser(newUser);
    } else {
      setCurrentUser(AuthService.getCurrentUser());
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public QR Verification Certificate Route */}
        <Route path="/verify/:publicId" element={<QRVerificationPage />} />

        {/* Authentication Routes */}
        <Route
          path="/auth/login"
          element={<LoginPage onLoginSuccess={handleUserChanged} />}
        />
        <Route
          path="/auth/register"
          element={<RegisterPage onLoginSuccess={handleUserChanged} />}
        />

        {/* Protected Administrative Shell */}
        <Route
          element={
            <AppLayout
              currentUser={currentUser}
              onUserChanged={handleUserChanged}
            />
          }
        >
          <Route path="/" element={<DashboardPage currentUser={currentUser} />} />
          <Route path="/fdr" element={<FDRListPage currentUser={currentUser} />} />
          <Route path="/fdr/submit" element={<SubmitFDRPage currentUser={currentUser} />} />
          <Route path="/fdr/:id" element={<FDRDetailPage currentUser={currentUser} />} />

          {/* Verification & Review Workspaces */}
          <Route
            path="/bank/verify"
            element={<BankVerificationPage currentUser={currentUser} />}
          />
          <Route
            path="/regulatory/review"
            element={<RegulatoryReviewPage currentUser={currentUser} />}
          />

          {/* Lifecycle & Monitoring */}
          <Route
            path="/lifecycle/escalations"
            element={<EscalationPage currentUser={currentUser} />}
          />
          <Route
            path="/lifecycle/release-readiness"
            element={<ReleaseReadinessPage currentUser={currentUser} />}
          />
          <Route
            path="/lifecycle/maturity"
            element={<MaturityCalendarPage currentUser={currentUser} />}
          />
          <Route
            path="/lifecycle/renewals"
            element={<RenewalsPage currentUser={currentUser} />}
          />

          {/* Reconciliation & Analytics */}
          <Route
            path="/reconciliation"
            element={<ReconciliationPage currentUser={currentUser} />}
          />
          <Route path="/analytics/interest" element={<InterestAnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage currentUser={currentUser} />} />
          <Route path="/audit" element={<AuditTrailPage />} />

          {/* Administration */}
          <Route
            path="/admin/registration-requests"
            element={<RegistrationRequestsPage currentUser={currentUser} />}
          />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
