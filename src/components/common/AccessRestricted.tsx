import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface AccessRestrictedProps {
  onReturnToDashboard: () => void;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ onReturnToDashboard }) => {
  const { currentUser } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-[460px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-8 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#1E293B] tracking-tight">
            {t('accessRestricted', 'Access Restricted')}
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
            Your assigned role (<strong className="text-[#1E293B]">{currentUser?.role || 'Guest'}</strong>) does not have authorization to view or configure this engineering module.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] space-y-1 text-left">
          <div className="font-semibold text-[#1E293B] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Role-Based Security Policy</span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            To request elevated supervisory privileges for this wellhead section, submit an operational change request to your Field Administrator.
          </p>
        </div>

        <button
          onClick={onReturnToDashboard}
          className="w-full py-2.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Authorized Dashboard</span>
        </button>
      </div>
    </div>
  );
};
