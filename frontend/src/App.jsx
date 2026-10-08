import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import DecisionsPage from './pages/DecisionsPage';
import CreateDecisionPage from './pages/CreateDecisionPage';
import DecisionResultPage from './pages/DecisionResultPage';
import DetailedAnalysisPage from './pages/DetailedAnalysisPage';
import WorkspacePage from './pages/WorkspacePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          <Routes>
          {/* Standalone Authentication & Onboarding Routes */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="onboarding" element={<OnboardingPage />} />

          {/* Authenticated Workspace with Persistent Sidebar & Top Header */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Protected Workspace Routes (12 Screen Ecosystem) */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="research" element={<Navigate to="/dashboard" replace />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="decisions" element={<DecisionsPage />} />
              <Route path="create-decision" element={<CreateDecisionPage />} />
              <Route path="decision/:id" element={<DecisionResultPage />} />
              <Route path="analysis" element={<DetailedAnalysisPage />} />
              <Route path="workspace" element={<WorkspacePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="help" element={<HelpPage />} />
            </Route>
          </Route>
        </Routes>
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
