import React, { useState } from 'react';
import { 
  Save, 
  Check, 
  Sliders, 
  Gauge
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

export const SystemSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [telemetryFrequency, setTelemetryFrequency] = useState('5s');
  const [maxSpmSafetyThreshold, setMaxSpmSafetyThreshold] = useState('9.5');
  const [maxRodLoadThreshold, setMaxRodLoadThreshold] = useState('80');
  const [reservoirCoolingAlarm, setReservoirCoolingAlarm] = useState('48');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'oilfield'>('oilfield');
  const [notificationsSound, setNotificationsSound] = useState(true);
  const [autoRunOptimization, setAutoRunOptimization] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('systemSettingsTitle', 'System Settings')}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-semibold">
              {currentUser?.role || t('adminRole', 'Administrator')}
            </span>
          </div>
          <p className="text-xs text-[#475569]">
            {t('systemSettingsSub', 'Configure telemetry polling parameters, supervisory safety limits, and field unit standards')}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? t('saved', 'Settings Saved') : t('saveChanges', 'Save Configuration')}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Card 1: Supervisory Limits */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Gauge className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-xs font-semibold text-[#1E293B] tracking-wide uppercase font-mono">
              {t('supervisoryLimits', 'Supervisory Safety Interlocks & Thresholds')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#475569] font-medium mb-1">
                {t('maxSpmLimit', 'Max SPM Safety Limit (Stroke/min)')}
              </label>
              <input
                type="number"
                step="0.1"
                min="5"
                max="12"
                value={maxSpmSafetyThreshold}
                onChange={(e) => setMaxSpmSafetyThreshold(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] font-mono outline-none"
              />
              <span className="text-[10px] text-[#64748B]">
                {t('spmInterlockDesc', 'Interlock prevents high viscous rod float beyond this rate')}
              </span>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                {t('maxRodLoadLimit', 'Max Polished Rod Load Threshold (%)')}
              </label>
              <input
                type="number"
                min="60"
                max="95"
                value={maxRodLoadThreshold}
                onChange={(e) => setMaxRodLoadThreshold(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] font-mono outline-none"
              />
              <span className="text-[10px] text-[#64748B]">
                {t('fatigueAlertDesc', 'Triggers critical Goodman diagram fatigue alert')}
              </span>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                {t('reservoirLowTempLimit', 'Reservoir Low Temp Warning (°C)')}
              </label>
              <input
                type="number"
                min="35"
                max="65"
                value={reservoirCoolingAlarm}
                onChange={(e) => setReservoirCoolingAlarm(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] font-mono outline-none"
              />
              <span className="text-[10px] text-[#64748B]">
                {t('cssReminderDesc', 'Triggers CSS cyclic steaming reminder recommendation')}
              </span>
            </div>

            <div>
              <label className="block text-[#475569] font-medium mb-1">
                {t('telemetryInterval', 'SCADA Telemetry Refresh Interval')}
              </label>
              <select
                value={telemetryFrequency}
                onChange={(e) => setTelemetryFrequency(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] font-medium outline-none cursor-pointer"
              >
                <option value="1s">1 second (High Resolution)</option>
                <option value="5s">5 seconds (Standard Industrial)</option>
                <option value="15s">15 seconds (Low Bandwidth)</option>
                <option value="manual">Manual Synchronous Refresh Only</option>
              </select>
              <span className="text-[10px] text-[#64748B]">
                {t('simulationTickDesc', 'Governs digital twin simulation tick speed')}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Units & Behavior */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
            <Sliders className="w-4 h-4 text-[#F97316]" />
            <h3 className="text-xs font-semibold text-[#1E293B] tracking-wide uppercase font-mono">
              {t('engineeringConventions', 'Engineering Unit Conventions & Behavior')}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-medium text-[#1E293B]">{t('oilfieldUnits', 'Oilfield Standard Units')}</div>
                <div className="text-[11px] text-[#64748B]">BOPD, in (stroke), SPM, bar (pressure), °C, cP (viscosity)</div>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setUnitSystem('oilfield')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${unitSystem === 'oilfield' ? 'bg-[#0D9488] text-white' : 'bg-[#E2E8F0] text-[#475569]'}`}
                >
                  Oilfield (BOPD/in)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${unitSystem === 'metric' ? 'bg-[#0D9488] text-white' : 'bg-[#E2E8F0] text-[#475569]'}`}
                >
                  Metric (m³/d)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-medium text-[#1E293B]">{t('continuousOptLoop', 'Continuous Physics Optimization Loop')}</div>
                <div className="text-[11px] text-[#64748B]">{t('continuousOptDesc', 'Automatically re-calculate kinematic recommendations on slider change')}</div>
              </div>
              <input
                type="checkbox"
                checked={autoRunOptimization}
                onChange={(e) => setAutoRunOptimization(e.target.checked)}
                className="w-4 h-4 text-[#0D9488] rounded border-[#CBD5E1]"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <div className="font-medium text-[#1E293B]">{t('audioAlarms', 'Operator Audio Alarms')}</div>
                <div className="text-[11px] text-[#64748B]">{t('audioAlarmsDesc', 'Audible chime on critical high rod float or equipment risk threshold breach')}</div>
              </div>
              <input
                type="checkbox"
                checked={notificationsSound}
                onChange={(e) => setNotificationsSound(e.target.checked)}
                className="w-4 h-4 text-[#0D9488] rounded border-[#CBD5E1]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
