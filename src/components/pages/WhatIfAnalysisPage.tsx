import React, { useState, useMemo } from 'react';
import { 
  GitBranch, 
  ArrowRight, 
  RotateCcw, 
  Sliders, 
  BarChart3, 
  Sparkles,
  RotateCw
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { runWhatIfSimulation } from '../../services/simulationEngine';
import { EngineeringInput } from '../common/EngineeringInput';
import { EngineeringChart } from '../common/EngineeringChart';
import { WhatIfInputs } from '../../types';

export const WhatIfAnalysisPage: React.FC = () => {
  const { selectedWellId, wellBaseline, activeParameters, calculatedState } = useWell();
  const { t } = useI18n();

  // Initialize what-if scenario with current active parameters
  const [whatIfInputs, setWhatIfInputs] = useState<WhatIfInputs>({
    steamVolumeM3: activeParameters.steamVolume,
    injectionPressureBar: activeParameters.injectionPressure,
    soakHours: activeParameters.soakTime,
    strokeLengthIn: activeParameters.strokeLength,
    spm: activeParameters.spm,
    vfdHz: activeParameters.vfdFrequency,
  });

  // Calculate live comparison using the same physics engine
  const simulationResult = useMemo(() => {
    return runWhatIfSimulation(wellBaseline, calculatedState, whatIfInputs);
  }, [wellBaseline, calculatedState, whatIfInputs]);

  const handleResetScenario = () => {
    setWhatIfInputs({
      steamVolumeM3: activeParameters.steamVolume,
      injectionPressureBar: activeParameters.injectionPressure,
      soakHours: activeParameters.soakTime,
      strokeLengthIn: activeParameters.strokeLength,
      spm: activeParameters.spm,
      vfdHz: activeParameters.vfdFrequency,
    });
  };

  const trajectoryChartData = simulationResult.trajectory.map(item => ({
    label: item.day,
    value: item.current,
    secondaryValue: item.simulated,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('whatIfAnalysis', 'What-If Analysis')}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-[#06B6D4] border border-[#A5F3FC] shadow-xs font-semibold">
              {selectedWellId} · {t('recommended', 'SANDBOX SCENARIO')}
            </span>
          </div>
          <p className="text-xs text-[#475569]">
            {t('whatIfSub', 'Compare operating scenarios without changing live well parameters')}
          </p>
        </div>

        <button
          onClick={handleResetScenario}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] hover:text-[#1E293B] transition-colors shadow-xs cursor-pointer"
          title="Reset sandbox to current well parameters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('reset', 'RESET SCENARIO')}</span>
        </button>
      </div>

      {/* Main Grid: Left Controls (Col 5) vs Right Simulation Result (Col 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Side: ADJUST PARAMETERS */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F97316]" />
              <span className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
                {t('currentOperatingState', 'SANDBOX INPUTS')}
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#06B6D4] px-1.5 py-0.5 rounded bg-[#ECFEFF] border border-[#A5F3FC] font-semibold">
              {t('recommended', 'SIMULATED')}
            </span>
          </div>

          <div className="space-y-3">
            {/* Steam Volume */}
            <EngineeringInput
              label={t('steamVolume', 'Steam Volume')}
              value={whatIfInputs.steamVolumeM3}
              min={1000}
              max={2500}
              step={50}
              unit="m³"
              onChange={(val) => setWhatIfInputs(prev => ({ ...prev, steamVolumeM3: val }))}
              tooltip="Injected steam volume per cycle"
            />

            {/* Injection Pressure */}
            <EngineeringInput
              label={t('injectionPressure', 'Injection Pressure')}
              value={whatIfInputs.injectionPressureBar}
              min={15}
              max={40}
              step={1}
              unit="bar"
              onChange={(val) => setWhatIfInputs(prev => ({ ...prev, injectionPressureBar: val }))}
              tooltip="Wellhead delivery pressure"
            />

            {/* Soak Time */}
            <EngineeringInput
              label={t('soakPeriod', 'Soak Time')}
              value={whatIfInputs.soakHours}
              min={24}
              max={144}
              step={6}
              unit="hr"
              onChange={(val) => setWhatIfInputs(prev => ({ ...prev, soakHours: val }))}
              tooltip="Thermal soak duration"
            />

            {/* Stroke Length */}
            <EngineeringInput
              label={t('strokeLength', 'Stroke Length')}
              value={whatIfInputs.strokeLengthIn}
              min={50}
              max={110}
              step={2}
              unit="in"
              onChange={(val) => setWhatIfInputs(prev => ({ ...prev, strokeLengthIn: val }))}
              tooltip="Polished rod stroke travel"
            />

            {/* SPM */}
            <EngineeringInput
              label={t('pumpingSpeed', 'Pumping Speed (SPM)')}
              value={whatIfInputs.spm}
              min={3.0}
              max={10.0}
              step={0.1}
              unit="spm"
              onChange={(val) => setWhatIfInputs(prev => ({ ...prev, spm: val }))}
              tooltip="Surface beam strokes per minute"
            />

            {/* VFD Frequency */}
            <EngineeringInput
              label={t('vfdFrequency', 'VFD Frequency')}
              value={whatIfInputs.vfdHz}
              min={20}
              max={60}
              step={1}
              unit="Hz"
              onChange={(val) => setWhatIfInputs(prev => ({ ...prev, vfdHz: val }))}
              tooltip="Electric drive motor frequency"
            />
          </div>
        </div>

        {/* Right Side: SIMULATION RESULT (Current vs Simulated) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
                  {t('recommended', 'SIMULATION RESULT')}
                </div>
                <div className="text-[10px] text-[#64748B] font-mono">Current Model State vs Simulated Sandbox</div>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono font-medium">
                <span className="flex items-center gap-1.5 text-[#F97316]">
                  <span className="w-2 h-0.5 bg-[#F97316]" /> {t('current', 'CURRENT')}
                </span>
                <span className="flex items-center gap-1.5 text-[#06B6D4]">
                  <span className="w-2 h-0.5 bg-[#06B6D4]" /> {t('recommended', 'SIMULATED')}
                </span>
              </div>
            </div>

            {/* Current vs Simulated Table */}
            <div className="space-y-2">
              {/* Oil Production */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('oilProduction', 'Oil Production')}</div>
                  <div className="text-[10px] text-[#64748B]">{t('grossWellheadFlowrate', 'Gross daily rate')}</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-[#475569] tabular-nums">{simulationResult.currentProduction} BOPD</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold tabular-nums">{simulationResult.simulatedProduction} BOPD</span>
                </div>
              </div>

              {/* Steam-Oil Ratio (SOR) */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('sorShort', 'Steam-Oil Ratio (SOR)')}</div>
                  <div className="text-[10px] text-[#64748B]">{t('volumetricFillageIndex', 'Cycle thermal efficiency')}</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-[#475569] tabular-nums">{simulationResult.currentSor}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold tabular-nums">{simulationResult.simulatedSor}</span>
                </div>
              </div>

              {/* Pump Efficiency */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('pumpEfficiency', 'Pump Efficiency')}</div>
                  <div className="text-[10px] text-[#64748B]">{t('volumetricFillageIndex', 'Volumetric fillage')}</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-[#475569] tabular-nums">{simulationResult.currentEfficiency}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold tabular-nums">{simulationResult.simulatedEfficiency}%</span>
                </div>
              </div>

              {/* Energy Consumption */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('energy', 'Energy Consumption')}</div>
                  <div className="text-[10px] text-[#64748B]">Motor lifting consumption</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-[#475569] tabular-nums">{simulationResult.currentEnergy} kWh/bbl</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold tabular-nums">{simulationResult.simulatedEnergy} kWh/bbl</span>
                </div>
              </div>

              {/* Rod Load */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('polishedRodLoad', 'Rod Load')}</div>
                  <div className="text-[10px] text-[#64748B]">Peak tensile stress ratio</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-[#475569] tabular-nums">{simulationResult.currentRodLoad}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold tabular-nums">{simulationResult.simulatedRodLoad}%</span>
                </div>
              </div>

              {/* Failure Risk */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('failureRisk', 'Failure Risk')}</div>
                  <div className="text-[10px] text-[#64748B]">Equipment fatigue probability</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-sm">
                  <span className="text-[#F59E0B] font-medium">{simulationResult.currentFailureRisk}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#0D9488] font-semibold">{simulationResult.simulatedFailureRisk}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#64748B] font-mono border-t border-[#E2E8F0] flex justify-between mt-3">
            <span>Model Solver: Multivariable Thermal-Lift</span>
            <span className="text-[#06B6D4] font-semibold">
              Net Impact: {simulationResult.simulatedProduction >= simulationResult.currentProduction ? '+' : ''}
              {simulationResult.simulatedProduction - simulationResult.currentProduction} BOPD
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Chart: Production Comparison (Line Chart) */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-[#1E293B]">{t('productionTrend', 'Production Comparison')}</div>
            <div className="text-[11px] text-[#64748B]">14-day production trajectory: Current (orange) vs Simulated (cyan)</div>
          </div>
          <span className="text-[10px] font-mono text-[#06B6D4] font-semibold">14-DAY FORWARD SIMULATION</span>
        </div>

        <EngineeringChart
          data={trajectoryChartData}
          primaryColor="#F97316"
          secondaryColor="#06B6D4"
          primaryLabel={t('currentBaseline', 'Current Baseline State')}
          secondaryLabel={t('recommended', 'Simulated Scenario Trajectory')}
          unit="BOPD"
          height={190}
          showSecondary={true}
        />
      </div>
    </div>
  );
};
