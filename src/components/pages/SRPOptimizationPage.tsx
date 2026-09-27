import React, { useState } from 'react';
import { 
  Sliders, 
  ArrowRight, 
  Check, 
  RotateCcw, 
  RotateCw,
  Save, 
  Sparkles,
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { runSRPOptimization } from '../../services/simulationEngine';
import { EngineeringInput } from '../common/EngineeringInput';
import { DynamometerCard } from '../common/DynamometerCard';

export const SRPOptimizationPage: React.FC = () => {
  const { 
    selectedWellId, 
    wellBaseline, 
    activeParameters, 
    updateActiveParameters, 
    resetToBaseline,
    saveScenario,
    calculatedState,
    isScenarioModified
  } = useWell();
  const { t } = useI18n();

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [recommendedSettings, setRecommendedSettings] = useState(() => 
    runSRPOptimization(wellBaseline, activeParameters, calculatedState.oilViscosity)
  );
  const [appliedSaved, setAppliedSaved] = useState(false);

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setAppliedSaved(false);

    setTimeout(() => {
      const rec = runSRPOptimization(wellBaseline, activeParameters, calculatedState.oilViscosity);
      setRecommendedSettings(rec);
      setIsOptimizing(false);
    }, 300);
  };

  const handleApplyRecommended = () => {
    updateActiveParameters({
      strokeLength: recommendedSettings.strokeLengthIn,
      spm: recommendedSettings.spm,
      vfdFrequency: recommendedSettings.vfdHz,
    });
    setAppliedSaved(false);
  };

  const handleSaveScenario = () => {
    saveScenario();
    setAppliedSaved(true);
  };

  const handleReset = () => {
    resetToBaseline();
    setAppliedSaved(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('srpOptimization', 'SRP Optimization')}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-[#F97316] border border-[#FED7AA] shadow-xs font-semibold">
              {selectedWellId} {isScenarioModified ? `· ${t('modified', 'MODIFIED SCENARIO')}` : `· ${t('baseline', 'BASELINE')}`}
            </span>
          </div>
          <p className="text-xs text-[#475569]">Optimize artificial lift performance</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] hover:text-[#1E293B] transition-colors shadow-xs cursor-pointer"
            title="Reset parameters to well baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('reset', 'RESET')}</span>
          </button>
        </div>
      </div>

      {/* Top Value Cards (5 Live Parameters) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">{t('strokeLength', 'Stroke Length')}</div>
          <div className="text-xl font-mono font-semibold text-[#1E293B] tabular-nums">
            {activeParameters.strokeLength} <span className="text-xs font-normal text-[#64748B]">in</span>
          </div>
          <div className="text-[9px] text-[#94A3B8] mt-0.5">Polished rod travel</div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">{t('pumpingSpeed', 'Speed (SPM)')}</div>
          <div className="text-xl font-mono font-semibold text-[#1E293B] tabular-nums">
            {activeParameters.spm.toFixed(1)} <span className="text-xs font-normal text-[#64748B]">spm</span>
          </div>
          <div className="text-[9px] text-[#94A3B8] mt-0.5">Strokes per minute</div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">{t('vfdFrequency', 'VFD Frequency')}</div>
          <div className="text-xl font-mono font-semibold text-[#1E293B] tabular-nums">
            {activeParameters.vfdFrequency} <span className="text-xs font-normal text-[#64748B]">Hz</span>
          </div>
          <div className="text-[9px] text-[#94A3B8] mt-0.5">Variable speed drive</div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">{t('pumpEfficiency', 'Pump Efficiency')}</div>
          <div className="text-xl font-mono font-semibold text-[#F97316] tabular-nums">
            {calculatedState.pumpEfficiency}%
          </div>
          <div className="text-[9px] text-[#94A3B8] mt-0.5">{t('volumetricFillageIndex', 'Hydraulic fillage')}</div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">{t('polishedRodLoad', 'Polished Rod Load')}</div>
          <div className={`text-xl font-mono font-semibold tabular-nums ${
            calculatedState.rodLoad > 78 ? 'text-[#EF4444]' :
            calculatedState.rodLoad > 70 ? 'text-[#F59E0B]' : 'text-[#0D9488]'
          }`}>
            {calculatedState.rodLoad}%
          </div>
          <div className="text-[9px] text-[#94A3B8] mt-0.5">Peak tension rating</div>
        </div>
      </div>

      {/* Main Grid: Left Editable Controls vs Right Real-Time Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: ADJUST PARAMETERS (col-span-6) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F97316]" />
              <span className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
                {t('currentOperatingState', 'ADJUST PARAMETERS')}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#F97316] px-1.5 py-0.5 rounded bg-[#FFF7ED] border border-[#FED7AA] font-semibold">
              {t('current', 'CURRENT')}
            </span>
          </div>

          {/* Stroke Length (50 - 110 in) */}
          <EngineeringInput
            label={t('strokeLength', 'Stroke Length')}
            value={activeParameters.strokeLength}
            min={50}
            max={110}
            step={2}
            unit="in"
            onChange={(val) => {
              updateActiveParameters({ strokeLength: val });
              setAppliedSaved(false);
            }}
            tooltip="Length of polished rod stroke determined by crank pin setting"
            description="Longer strokes improve volumetric efficiency in viscous crude"
          />

          {/* SPM (3.0 - 10.0) */}
          <EngineeringInput
            label={t('pumpingSpeed', 'Pumping Speed (SPM)')}
            value={activeParameters.spm}
            min={3.0}
            max={10.0}
            step={0.1}
            unit="spm"
            onChange={(val) => {
              updateActiveParameters({ spm: val });
              setAppliedSaved(false);
            }}
            tooltip="Surface beam oscillations per minute"
            description="High SPM in high viscosity increases downstroke drag & rod floating"
          />

          {/* VFD Frequency (20 - 60 Hz) */}
          <EngineeringInput
            label={t('vfdFrequency', 'VFD Frequency')}
            value={activeParameters.vfdFrequency}
            min={20}
            max={60}
            step={1}
            unit="Hz"
            onChange={(val) => {
              updateActiveParameters({ vfdFrequency: val });
              setAppliedSaved(false);
            }}
            tooltip="Variable frequency drive motor speed"
            description="Controls electric motor RPM and mechanical power consumption"
          />

          {/* Immediate Live Results Notice */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] space-y-1">
            <div className="text-[10px] font-mono uppercase text-[#0D9488] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
              <span>LIVE RECALCULATION ACTIVE</span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Moving sliders or typing exact values updates production, pump efficiency, rod loading, and rod floating risk across the whole application instantly.
            </p>
          </div>
        </div>

        {/* Right: CURRENT SETTINGS vs RECOMMENDED SETTINGS (col-span-6) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
                  {t('recommended', 'CURRENT SETTINGS VS RECOMMENDED SETTINGS')}
                </span>
                <span className="text-[9px] font-mono text-[#06B6D4] px-1.5 py-0.5 rounded bg-[#ECFEFF] border border-[#A5F3FC] font-semibold">
                  {t('recommended', 'RECOMMENDED')}
                </span>
              </div>
              <span className="text-[10px] text-[#06B6D4] font-mono font-semibold">KINEMATIC SOLVER</span>
            </div>

            <div className="space-y-2">
              {/* Pump Efficiency */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('pumpEfficiency', 'Pump Efficiency')}</div>
                  <div className="text-[10px] text-[#64748B]">{t('volumetricFillageIndex', 'Volumetric fillage')}</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#475569] tabular-nums">{calculatedState.pumpEfficiency}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold text-sm tabular-nums">
                    {recommendedSettings.pumpEfficiencyPct}%
                  </span>
                </div>
              </div>

              {/* Rod Load */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('polishedRodLoad', 'Rod Load')}</div>
                  <div className="text-[10px] text-[#64748B]">Peak tensile stress ratio</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className={`tabular-nums ${calculatedState.rodLoad > 72 ? 'text-[#F59E0B]' : 'text-[#475569]'}`}>
                    {calculatedState.rodLoad}%
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#0D9488] font-semibold text-sm tabular-nums">
                    {recommendedSettings.rodLoadPct}%
                  </span>
                </div>
              </div>

              {/* Production */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('oilProduction', 'Production')}</div>
                  <div className="text-[10px] text-[#64748B]">Net fluid delivery</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#475569] tabular-nums">{calculatedState.production} BOPD</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold text-sm tabular-nums">
                    {recommendedSettings.productionBopd} BOPD
                  </span>
                </div>
              </div>

              {/* Rod Floating Risk */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('rodFloatRisk', 'Rod Floating Risk')}</div>
                  <div className="text-[10px] text-[#64748B]">Viscous downstroke drag</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className={`font-semibold ${
                    calculatedState.rodFloatingRisk === 'HIGH' ? 'text-[#EF4444]' :
                    calculatedState.rodFloatingRisk === 'MEDIUM' ? 'text-[#F59E0B]' : 'text-[#0D9488]'
                  }`}>
                    {calculatedState.rodFloatingRisk === 'HIGH' ? t('high', 'HIGH') :
                     calculatedState.rodFloatingRisk === 'MEDIUM' ? t('medium', 'MEDIUM') : t('low', 'LOW')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#0D9488] font-semibold text-sm">
                    {recommendedSettings.rodFloatingRisk === 'HIGH' ? t('high', 'HIGH') :
                     recommendedSettings.rodFloatingRisk === 'MEDIUM' ? t('medium', 'MEDIUM') : t('low', 'LOW')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569]">
              Optimal configuration: <strong className="text-[#1E293B] font-mono">{recommendedSettings.strokeLengthIn}"</strong> stroke @ <strong className="text-[#1E293B] font-mono">{recommendedSettings.spm} SPM</strong> with <strong className="text-[#1E293B] font-mono">{recommendedSettings.vfdHz} Hz</strong> VFD.
            </div>
          </div>

          {/* Action Buttons: RUN OPTIMIZATION & APPLY / SAVE */}
          <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2.5">
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs rounded transition-colors shadow-xs cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('solving', 'Evaluating Kinematics...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('runOptimization', 'RUN OPTIMIZATION')}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyRecommended}
                className="px-3 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] border border-[#CBD5E1] rounded text-xs text-[#0891B2] font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {t('apply', 'Apply Recommended')}
              </button>

              <button
                onClick={handleSaveScenario}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                  appliedSaved
                    ? 'bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]'
                    : 'bg-[#F97316] hover:bg-[#EA580C] text-white'
                }`}
              >
                {appliedSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('saved', 'Scenario Saved')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('applyScenario', 'APPLY / SAVE SCENARIO')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamometer Visualizer Card reflecting active parameters */}
      <DynamometerCard
        strokeLengthIn={activeParameters.strokeLength}
        rodLoadPct={calculatedState.rodLoad}
        viscosityCp={calculatedState.oilViscosity}
        spm={activeParameters.spm}
      />
    </div>
  );
};
