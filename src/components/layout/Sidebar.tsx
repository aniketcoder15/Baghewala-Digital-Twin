import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Flame, 
  Sliders, 
  ShieldAlert, 
  GitBranch, 
  History, 
  Cpu, 
  Users, 
  Settings, 
  LogOut,
  Workflow 
} from 'lucide-react';
import { NavPage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  id: NavPage;
  translationKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', translationKey: 'dashboard', defaultLabel: 'Dashboard', icon: LayoutDashboard },
  { id: 'twin', translationKey: 'wellOverview', defaultLabel: 'Well Overview', icon: Layers },
  { id: 'css', translationKey: 'cssOptimization', defaultLabel: 'CSS Optimization', icon: Flame },
  { id: 'srp', translationKey: 'srpOptimization', defaultLabel: 'SRP Optimization', icon: Sliders },
  { id: 'integrated', translationKey: 'integratedOptimization', defaultLabel: 'Integrated Optimization', icon: Workflow },
  { id: 'risk', translationKey: 'riskMaintenance', defaultLabel: 'Risk & Maintenance', icon: ShieldAlert },
  { id: 'whatif', translationKey: 'whatIfAnalysis', defaultLabel: 'What-If Analysis', icon: GitBranch },
  { id: 'history', translationKey: 'historicalData', defaultLabel: 'Historical Data', icon: History },
  { id: 'ai', translationKey: 'aiOperations', defaultLabel: 'AI Operations', icon: Cpu },
  { id: 'users', translationKey: 'userManagement', defaultLabel: 'User Management', icon: Users, adminOnly: true },
  { id: 'settings', translationKey: 'systemSettings', defaultLabel: 'System Settings', icon: Settings, adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, logout, hasAccess } = useAuth();
  const { t } = useI18n();

  // Filter items according to the current user's role permissions
  const authorizedItems = ALL_NAV_ITEMS.filter(item => hasAccess(item.id));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-60 bg-[#EFECE3] border-r border-[#E2E8F0]
        flex flex-col justify-between
        transition-transform duration-200 ease-in-out select-none
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top: Branding + Nav */}
        <div className="flex-1 overflow-y-auto">
          {/* Branding Header */}
          <div className="p-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              {/* Custom Well Derrick + Thermal Steam Plume Icon */}
              <div className="w-8 h-8 rounded bg-[#FFFFFF] border border-[#CBD5E1] flex items-center justify-center shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
                  <path d="M5 21L10 3h4l5 18" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 16h10M8.5 10h7" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M12 2v2M9.5 2c0-1 1-1.5 1-2M14.5 2c0-1-1-1.5-1-2" stroke="#F97316" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="font-semibold text-xs tracking-wider text-[#1E293B] leading-tight">
                  BAGHEWALA
                </div>
                <div className="text-[11px] font-semibold text-[#0D9488] tracking-wide">
                  DIGITAL TWIN
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] tracking-wider uppercase text-[#64748B] font-mono">
              {t('tagline', 'Heavy Oil Well-to-Surface')}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5">
            {authorizedItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const label = t(item.translationKey, item.defaultLabel);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectPage(item.id);
                    onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors text-left cursor-pointer
                    ${isActive 
                      ? 'bg-[#FFFFFF] text-[#0D9488] font-semibold border-l-2 border-[#0D9488] shadow-xs' 
                      : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#E5E1D6]'}
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0D9488]' : 'text-[#64748B]'}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Profile, Role & Logout (Well selector removed per Requirement 5 & 17) */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#EAE6DC] space-y-2.5 shrink-0">
          {/* System status */}
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="text-[#64748B] font-mono uppercase tracking-wider text-[10px]">
              {t('systemStatus', 'System status')}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
              <span className="text-[10px] font-semibold">{t('online', 'Online')}</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E6FFFA] border border-[#99F6E4] text-[#0D9488] font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser?.avatarInitials || 'OP'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-[#1E293B] truncate leading-tight">
                  {currentUser?.name || t('operator', 'Operator')}
                </div>
                <div className="text-[10px] font-mono text-[#0D9488] font-semibold truncate">
                  {currentUser?.role === 'Administrator' ? t('adminRole', 'Administrator') :
                   currentUser?.role === 'Field Engineer' ? t('fieldEngRole', 'Field Engineer') :
                   currentUser?.role === 'Production Engineer' ? t('prodEngRole', 'Production Engineer') :
                   currentUser?.role === 'Maintenance Engineer' ? t('maintEngRole', 'Maintenance Engineer') :
                   currentUser?.role === 'Viewer' ? t('viewerRole', 'Viewer') :
                   currentUser?.role || t('operator', 'Operator')}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-[#F8FAFC] hover:bg-[#FEE2E2] border border-[#E2E8F0] hover:border-[#FECACA] text-[#64748B] hover:text-[#DC2626] text-[11px] font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logout', 'Logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
