import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import SettingsModal from '../components/common/SettingsModal';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <div className="h-screen w-screen flex bg-page text-vera-primary font-sans antialiased overflow-hidden selection:bg-vera-accent-soft selection:text-vera-primary">
      {/* Desktop Persistent Left Sidebar (240px) */}
      <Sidebar
        className="hidden lg:flex h-full shrink-0"
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Mobile / Tablet Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-vera-primary/30 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Off-canvas sidebar */}
          <div className="relative z-50 h-full flex">
            <Sidebar
              className="h-full shadow-vera-lg"
              onOpenSettings={() => setSettingsOpen(true)}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className={`flex-1 min-w-0 ${isDashboard ? 'h-full overflow-hidden flex flex-col' : 'overflow-y-auto flex flex-col'}`}>
          <Outlet />

          {/* Footer (Hidden on Dashboard workspace to prevent page scrolling) */}
          {!isDashboard && (
            <footer className="border-t border-vera-border bg-surface/70 py-4 px-6 text-center text-xs text-vera-muted shrink-0">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex items-center gap-2 font-medium text-vera-secondary">
                  <span className="font-semibold text-vera-primary">VERA</span>
                  <span>—</span>
                  <span>Verified Evidence & Research Assistant</span>
                </div>
                <p className="text-[11px] text-vera-muted">
                  Decision Intelligence • Deterministic Scoring Engine + Gemini Qualitative Synthesis
                </p>
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* Clean Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
