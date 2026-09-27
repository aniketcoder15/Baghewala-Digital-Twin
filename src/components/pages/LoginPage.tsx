import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Info, 
  X,
  KeyRound,
  Globe,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, languages, t } = useI18n();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your operational username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = login(username, password, rememberMe);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please verify credentials.');
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F7F5EE] text-[#1E293B] flex flex-col justify-between selection:bg-[#FFEDD5] selection:text-[#F97316]">
      {/* Top Banner */}
      <header className="h-16 px-6 sm:px-10 border-b border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#FFFFFF] border border-[#CBD5E1] flex items-center justify-center shadow-xs">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
              <path d="M5 21L10 3h4l5 18" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 16h10M8.5 10h7" stroke="#0D9488" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M12 2v2M9.5 2c0-1 1-1.5 1-2M14.5 2c0-1-1-1.5-1-2" stroke="#F97316" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-xs tracking-wider text-[#1E293B]">
              {t('appName', 'BAGHEWALA DIGITAL TWIN')}
            </div>
            <div className="text-[10px] text-[#64748B] font-mono">
              {t('basin', 'Bikaner-Nagaur Heavy Oil Operations')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector on Login Header */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Select language"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded text-xs font-medium text-[#1E293B] transition-colors cursor-pointer shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#0D9488]" />
              <span className="font-mono text-[11px] font-semibold">{language.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

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
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Branding and Operational Context */}
          <div className="md:col-span-6 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6FFFA] border border-[#99F6E4] text-[#0D9488] text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('authorizedAccess', 'Authorized Operations Access')}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E293B] leading-tight font-sans">
                {t('appName', 'BAGHEWALA DIGITAL TWIN')}
              </h1>
              <p className="text-sm font-medium text-[#F97316]">
                {t('tagline', 'Heavy Oil Well-to-Surface Optimization')}
              </p>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Industrial supervisory control and physics-informed digital twin for cyclic steam stimulation (CSS), sucker rod pumping (SRP), and subsurface thermodynamic management.
            </p>

            <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-2 text-xs">
              <div className="font-semibold text-[#1E293B] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{t('quickFillRoles', 'Available Operator Roles & Credentials')}</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Click any role to load designated operational credentials:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'admin123')}
                  className="px-2.5 py-1.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] text-left text-[#1E293B] hover:text-[#0D9488] font-medium transition-colors cursor-pointer"
                >
                  <div className="font-semibold">{t('adminRole', 'Administrator')}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">admin / admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('field.engineer', 'field123')}
                  className="px-2.5 py-1.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] text-left text-[#1E293B] hover:text-[#0D9488] font-medium transition-colors cursor-pointer"
                >
                  <div className="font-semibold">{t('fieldEngRole', 'Field Engineer')}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">field.engineer / field123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('production.engineer', 'production123')}
                  className="px-2.5 py-1.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] text-left text-[#1E293B] hover:text-[#0D9488] font-medium transition-colors cursor-pointer"
                >
                  <div className="font-semibold">{t('prodEngRole', 'Production Engineer')}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">production.engineer / production123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('maintenance.engineer', 'maintenance123')}
                  className="px-2.5 py-1.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] text-left text-[#1E293B] hover:text-[#0D9488] font-medium transition-colors cursor-pointer"
                >
                  <div className="font-semibold">{t('maintEngRole', 'Maintenance Engineer')}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">maintenance.engineer / maintenance123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('viewer', 'viewer123')}
                  className="col-span-2 px-2.5 py-1.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] text-left text-[#1E293B] hover:text-[#0D9488] font-medium transition-colors cursor-pointer"
                >
                  <div className="font-semibold">{t('viewerRole', 'Operations Viewer')}</div>
                  <div className="text-[10px] text-[#64748B] font-mono">viewer / viewer123</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="md:col-span-6">
            <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#1E293B] tracking-tight">
                  {t('login', 'Sign In')}
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Enter your assigned credentials to access wellhead controls
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#DC2626]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1.5">
                    {t('usernameLabel', 'Operational Username')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin or field.engineer"
                      required
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded-md text-xs text-[#1E293B] placeholder:text-[#94A3B8] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1.5">
                    {t('passwordLabel', 'Password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0D9488] rounded-md text-xs text-[#1E293B] placeholder:text-[#94A3B8] outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options: Remember me & Forgot password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-[#475569] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#0D9488] focus:ring-0 cursor-pointer"
                    />
                    <span>{t('rememberMe', 'Remember my active operational session')}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[#0D9488] hover:text-[#0F766E] font-medium cursor-pointer"
                  >
                    {t('forgotCredentials', 'Forgot credentials?')}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{t('signInBtn', 'Sign In to Operations Console')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Credentials Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-semibold text-[#1E293B]">
                  Operational Credential Recovery
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#475569] space-y-2.5 leading-relaxed">
              <p>
                In accordance with Baghewala field security protocols, automatic password resets are routed through your assigned SCADA Administrator.
              </p>
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 font-mono text-[11px]">
                <div className="text-[#1E293B] font-semibold">Bikaner Operations Dispatch:</div>
                <div className="text-[#64748B]">Internal Ext: 4102 / 4108</div>
                <div className="text-[#64748B]">Dispatch Radio: Channel 6 (Heavy Oil Group)</div>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Default administrator credentials for supervisory login are: <strong className="text-[#1E293B]">admin</strong> / <strong className="text-[#1E293B]">admin123</strong>.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer"
              >
                {t('close', 'Acknowledge')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-3 px-6 border-t border-[#E2E8F0] bg-[#FFFFFF] text-center text-[10px] text-[#64748B] font-mono">
        BAGHEWALA DIGITAL TWIN // SUPERVISORY ACCESS PORTAL // WESTERN RAJASTHAN
      </footer>
    </div>
  );
};
