import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Menu, 
  ChevronDown, 
  AlertTriangle, 
  X,
  User, 
  Globe, 
  LogOut, 
  ShieldCheck, 
  Settings, 
  Users,
  Check
} from 'lucide-react';
import { NavPage, WellId } from '../../types';
import { useWell } from '../../context/WellContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onSelectPage?: (page: NavPage) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  onSelectPage,
}) => {
  const { 
    selectedWellId, 
    setSelectedWellId, 
    wellBaseline, 
    wellState, 
    isScenarioModified, 
  } = useWell();

  const { currentUser, logout } = useAuth();
  const { language, setLanguage, languages, t } = useI18n();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const activeAlerts = wellBaseline.alerts;

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccessLevelDescription = (role?: string) => {
    switch (role) {
      case 'Administrator':
        return t('adminDesc', 'Full Supervisory Control & Administration');
      case 'Field Engineer':
        return t('fieldEngDesc', 'Field Telemetry & Lift Optimization');
      case 'Production Engineer':
        return t('prodEngDesc', 'Thermal Stimulation & Flow Analysis');
      case 'Maintenance Engineer':
        return t('maintEngDesc', 'Mechanical Health & SRP Kinematics');
      case 'Viewer':
        return t('viewerDesc', 'Read-Only Supervisory Monitoring');
      default:
        return t('standardDesc', 'Standard Station Access');
    }
  };

  const getTranslatedRole = (role?: string) => {
    switch (role) {
      case 'Administrator':
        return t('adminRole', 'Administrator');
      case 'Field Engineer':
        return t('fieldEngRole', 'Field Engineer');
      case 'Production Engineer':
        return t('prodEngRole', 'Production Engineer');
      case 'Maintenance Engineer':
        return t('maintEngRole', 'Maintenance Engineer');
      case 'Viewer':
        return t('viewerRole', 'Viewer');
      default:
        return role || t('operator', 'Operator');
    }
  };

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Left: Mobile trigger & Field/Well Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="p-1.5 rounded hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden sm:block">
            <span className="text-xs font-semibold text-[#1E293B] tracking-tight">
              {t('baghewalaField', 'Baghewala Field')}
            </span>
            <span className="text-[#CBD5E1] mx-1.5">/</span>
          </div>

          {/* Active Well Selector Dropdown */}
          <div className="relative flex items-center">
            <span className="text-xs text-[#64748B] mr-1 hidden xs:inline">{t('currentWell', 'Well')}:</span>
            <div className="relative">
              <select
                value={selectedWellId}
                onChange={(e) => setSelectedWellId(e.target.value as WellId)}
                aria-label="Current active well"
                className="bg-[#FFFFFF] border border-[#CBD5E1] rounded px-2 py-1 text-xs font-semibold text-[#0D9488] appearance-none pr-5 cursor-pointer focus:outline-none focus:border-[#0D9488] transition-colors"
              >
                <option value="BW-17">BW-17 (Post-CSS cooling)</option>
                <option value="BW-21">BW-21 (Mid cycle)</option>
                <option value="BW-24">BW-24 (Cooling high-visc)</option>
                <option value="BW-31">BW-31 (Cycle 4 production)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Scenario Changes Indicator (Reset & Save buttons removed per Requirement 1) */}
          {isScenarioModified && (
            <div className="hidden lg:flex items-center gap-1.5 ml-1">
              <span className="text-[11px] text-[#B45309] px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                <span>{t('modified', 'Modified')}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Search, Language Selector, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search button */}
        <button
          onClick={() => setShowSearchModal(true)}
          className="flex items-center gap-1.5 px-2 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded text-xs text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
          title="Search telemetry and parameters"
        >
          <Search className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="hidden xl:inline font-normal">{t('search', 'Search parameters...')}</span>
        </button>

        {/* 🌐 Multilingual Language Selector (Primary Header Selector) */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            aria-label="Select language"
            className="flex items-center gap-1 px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded text-xs font-medium text-[#1E293B] transition-colors cursor-pointer shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#0D9488]" />
            <span className="font-mono text-[11px] font-semibold">{language.toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 text-[#64748B]" />
          </button>

          {/* Language Dropdown */}
          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg shadow-xl p-1.5 z-50 animate-in fade-in-50 duration-100">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#64748B] border-b border-[#E2E8F0] mb-1 font-semibold">
                Language / भाषा
              </div>
              <div className="space-y-0.5">
                {languages.map((l) => {
                  const isSelected = l.code === language;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[#E6FFFA] text-[#0D9488] font-semibold' 
                          : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{l.nativeLabel}</span>
                        {l.code !== 'en' && <span className="text-[10px] text-[#94A3B8]">({l.label})</span>}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0D9488]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications button with popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="relative p-1.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#F97316] text-[9px] font-semibold text-white flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#1E293B]">{t('wellAlarms', 'Well Alarms')} ({selectedWellId})</span>
                  <span className="text-[10px] text-[#64748B] font-mono">({activeAlerts.length})</span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#64748B] hover:text-[#1E293B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {activeAlerts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#64748B]">
                    {t('noActiveAlerts', 'All parameters within normal operating limits')}
                  </div>
                ) : (
                  activeAlerts.map(alt => (
                    <div 
                      key={alt.id} 
                      className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className={`w-3.5 h-3.5 ${
                            alt.severity === 'High' ? 'text-[#EF4444]' :
                            alt.severity === 'Medium' ? 'text-[#F59E0B]' : 'text-[#06B6D4]'
                          }`} />
                          <span className="font-semibold text-[#1E293B]">{alt.title}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-semibold ${
                          alt.severity === 'High' ? 'text-[#EF4444]' :
                          alt.severity === 'Medium' ? 'text-[#F59E0B]' : 'text-[#64748B]'
                        }`}>
                          {alt.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#475569]">{alt.parameter}: <span className="text-[#1E293B] font-mono font-medium">{alt.value}</span></div>
                      <div className="text-[10px] text-[#64748B] mt-1 font-mono">{alt.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown Menu */}
        <div className="relative pl-1 sm:pl-2 border-l border-[#E2E8F0]" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-[#E6FFFA] border border-[#99F6E4] text-[#0D9488] font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser?.avatarInitials || 'OP'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-[11px] font-semibold text-[#1E293B] leading-tight">
                {currentUser?.name?.split(' ')[0] || t('operator', 'Operator')}
              </div>
              <div className="text-[9px] text-[#0D9488] font-mono font-medium">
                {getTranslatedRole(currentUser?.role)}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#64748B] hidden sm:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-xl p-3 z-50 space-y-3">
              {/* User Header */}
              <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#E2E8F0]">
                <div className="w-9 h-9 rounded-full bg-[#E6FFFA] border border-[#99F6E4] text-[#0D9488] font-bold text-sm flex items-center justify-center shrink-0">
                  {currentUser?.avatarInitials || 'OP'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-[#1E293B] truncate">
                    {currentUser?.name || t('operator', 'Operator')}
                  </div>
                  <div className="text-[11px] text-[#64748B] font-mono truncate">
                    @{currentUser?.username || 'user'}
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6FFFA] text-[#0D9488] border border-[#99F6E4] font-mono">
                    {getTranslatedRole(currentUser?.role)}
                  </div>
                </div>
              </div>

              {/* Access Level Badge */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <div className="text-[10px] font-mono uppercase text-[#64748B] flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>{t('accessLevel', 'Access Level')}</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-snug">
                  {getAccessLevelDescription(currentUser?.role)}
                </p>
              </div>

              {/* Admin Shortcuts if Administrator */}
              {currentUser?.role === 'Administrator' && onSelectPage && (
                <div className="space-y-1 pt-1 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => {
                      onSelectPage('users');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#F8FAFC] text-xs text-[#475569] hover:text-[#1E293B] transition-colors cursor-pointer text-left"
                  >
                    <Users className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>{t('userManagement', 'User Management')}</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectPage('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#F8FAFC] text-xs text-[#475569] hover:text-[#1E293B] transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>{t('systemSettings', 'System Settings')}</span>
                  </button>
                </div>
              )}

              {/* Logout Button */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#FEE2E2] hover:bg-[#FECACA] border border-[#FCA5A5] text-[#DC2626] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout', 'Logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search Dialog */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 z-50 px-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-[#E2E8F0] flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                autoFocus
                placeholder={t('searchPlaceholder', 'Search telemetry and parameters...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-xs text-[#1E293B] focus:outline-none placeholder:text-[#94A3B8]"
              />
              <button 
                onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
                className="text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 text-xs space-y-1.5 max-h-64 overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-[#64748B] mb-1 font-semibold">{t('recentTelemetry', 'Active Telemetry')}: {selectedWellId}</div>
              {[
                { name: t('reservoirTemperature', 'Reservoir temperature'), val: `${wellState.reservoirTemperatureC} °C` },
                { name: t('viscosity', 'Crude viscosity'), val: `${wellState.viscosityCp.toLocaleString()} cP` },
                { name: t('oilProduction', 'Oil production'), val: `${wellState.productionBOPD} BOPD` },
                { name: t('pumpEfficiency', 'Pump efficiency'), val: `${wellState.pumpEfficiencyPct}%` },
                { name: t('polishedRodLoad', 'Polished rod load'), val: `${wellState.rodLoadKN} kN (${wellState.rodLoadPct}%)` },
                { name: t('sorShort', 'Steam-oil ratio (SOR)'), val: `${wellState.sor}` },
                { name: t('energy', 'Energy index'), val: `${wellState.energyKWhPerBbl} kWh/bbl` },
                { name: t('rodFloatRisk', 'Rod floating risk'), val: `${wellState.rodFloatingRiskPct}%` },
              ].filter(item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2 rounded hover:bg-[#F8FAFC] text-[#475569] cursor-pointer"
                  onClick={() => setShowSearchModal(false)}
                >
                  <span className="text-[#1E293B]">{item.name}</span>
                  <span className="font-mono text-[#0D9488] font-semibold">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
