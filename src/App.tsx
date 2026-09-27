import React, { useState } from 'react';
import { NavPage } from './types';
import { WellProvider } from './context/WellContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';

// Pages
import { OverviewPage } from './components/pages/OverviewPage';
import { DigitalTwinPage } from './components/pages/DigitalTwinPage';
import { CSSOptimizationPage } from './components/pages/CSSOptimizationPage';
import { SRPOptimizationPage } from './components/pages/SRPOptimizationPage';
import { RiskMaintenancePage } from './components/pages/RiskMaintenancePage';
import { WhatIfAnalysisPage } from './components/pages/WhatIfAnalysisPage';
import { HistoricalDataPage } from './components/pages/HistoricalDataPage';
import { IntegratedOptimizationPage } from './components/pages/IntegratedOptimizationPage';
import { AIOperationsPage } from './components/pages/AIOperationsPage';
import { UserManagementPage } from './components/pages/UserManagementPage';
import { SystemSettingsPage } from './components/pages/SystemSettingsPage';
import { LoginPage } from './components/pages/LoginPage';

// Icons
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, currentUser, hasAccess } = useAuth();
  const { t } = useI18n();

  // If not authenticated, show professional login screen
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Check role-based permission for current route
  const isAuthorized = hasAccess(currentPage);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F5EE] text-[#1E293B]">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar with Language selector, Profile & Well selector */}
        <TopBar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onSelectPage={setCurrentPage}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col justify-between">
          <div className="max-w-7xl mx-auto w-full">
            {!isAuthorized ? (
              // Access Restricted Notice
              <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-8 max-w-xl mx-auto my-12 shadow-xs text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] mx-auto flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#1E293B]">{t('accessRestricted', 'Access Restricted')}</h2>
                  <p className="text-xs text-[#64748B]">
                    {t('accessRestrictedMsg', 'Your current operational role ({role}) does not have permission to view or execute actions in this module.', { role: currentUser?.role || '' })}
                  </p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs font-mono text-[#475569]">
                  Requested Route: <span className="font-semibold text-[#0F172A]">{currentPage.toUpperCase()}</span> · Assigned Access Tier: <span className="font-semibold text-[#0D9488]">{currentUser?.role}</span>
                </div>
                <div>
                  <button
                    onClick={() => setCurrentPage('overview')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    <span>{t('returnToDashboard', 'Return to Dashboard')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {currentPage === 'overview' && (
                  <OverviewPage
                    onNavigateToTwin={() => setCurrentPage('twin')}
                  />
                )}

                {currentPage === 'twin' && (
                  <DigitalTwinPage
                    onNavigateToSrp={() => setCurrentPage('srp')}
                    onNavigateToCss={() => setCurrentPage('css')}
                  />
                )}

                {currentPage === 'css' && (
                  <CSSOptimizationPage />
                )}

                {currentPage === 'srp' && (
                  <SRPOptimizationPage />
                )}

                {currentPage === 'integrated' && (
                  <IntegratedOptimizationPage />
                )}

                {currentPage === 'risk' && (
                  <RiskMaintenancePage />
                )}

                {currentPage === 'whatif' && (
                  <WhatIfAnalysisPage />
                )}

                {currentPage === 'history' && (
                  <HistoricalDataPage />
                )}

                {currentPage === 'ai' && (
                  <AIOperationsPage />
                )}

                {currentPage === 'users' && (
                  <UserManagementPage />
                )}

                {currentPage === 'settings' && (
                  <SystemSettingsPage />
                )}
              </>
            )}
          </div>

          {/* Safety / Engineering Note Footer */}
          <footer className="mt-8 pt-4 border-t border-[#E2E8F0] text-center max-w-7xl mx-auto w-full select-none">
            <p className="text-[11px] text-[#64748B] font-sans leading-normal">
              {t('footerSafetyNote', 'Decision-support estimates based on available operating data. Validate recommendations against field conditions and engineering procedures before implementation.')}
            </p>
            <div className="text-[9px] text-[#94A3B8] font-mono mt-1">
              BAGHEWALA DIGITAL TWIN // INDUSTRIAL PETROLEUM OPERATIONS PLATFORM // VERSION 4.2.1
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <WellProvider>
          <MainApp />
        </WellProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
