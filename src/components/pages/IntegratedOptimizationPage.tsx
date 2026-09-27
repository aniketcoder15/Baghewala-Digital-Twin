import React, { useState, useMemo } from 'react';
import { 
  Workflow, 
  ArrowRight, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Sliders, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { computeWellState, calculateRisks, simulateIntegratedOptimization } from '../../services/simulationEngine';

// Supervisory operating limits for safety verification
const OPERATING_LIMITS = {
  steamVolume: { min: 1000, max: 2500, label: 'Steam Volume', unit: 'm³' },
  injectionPressure: { min: 15, max: 40, label: 'Injection Pressure', unit: 'bar' },
  soakTime: { min: 24, max: 144, label: 'Soak Time', unit: 'hr' },
  strokeLength: { min: 50, max: 110, label: 'Stroke Length', unit: 'in' },
  spm: { min: 3.0, max: 9.5, label: 'Pumping Speed', unit: 'SPM' },
  vfdFrequency: { min: 20, max: 60, label: 'VFD Frequency', unit: 'Hz' },
};

export const IntegratedOptimizationPage: React.FC = () => {
  const { 
    selectedWellId, 
    wellBaseline, 
    activeParameters, 
    updateActiveParameters, 
    resetToBaseline,
    wellState,
    calculatedState,
    isScenarioModified
  } = useWell();

  const { t } = useI18n();

  const [isWhyExpanded, setIsWhyExpanded] = useState<boolean>(true);
  const [applied, setApplied] = useState<boolean>(false);

  // Economic Assumptions (Demo Assumptions)
  const [steamCost, setSteamCost] = useState<number>(1200); // ₹/m³
  const [electricityCost, setElectricityCost] = useState<number>(7.50); // ₹/kWh
  const [maintenanceCost, setMaintenanceCost] = useState<number>(180); // ₹/bbl
  const [isEconomicsAssumptionsExpanded, setIsEconomicsAssumptionsExpanded] = useState<boolean>(false);

  // Run the true coupled Integrated Optimization simulation (CSS + SRP + Economics)
  // Evaluates: Reservoir temp -> Oil viscosity -> CSS thermal decision -> SRP kinematics -> Pump efficiency/rod loading -> Production, SOR, Energy & Economics
  const scenario = useMemo(() => {
    return simulateIntegratedOptimization(wellBaseline, activeParameters);
  }, [wellBaseline, activeParameters]);

  const recommendedStrategy = useMemo(() => ({
    css: {
      steamVolume: scenario.recommendedCSS.steamVolumeM3,
      injectionPressure: scenario.recommendedCSS.injectionPressureBar,
      soakTime: scenario.recommendedCSS.soakHours,
      cutoffBopd: scenario.recommendedCSS.cutoffBopd,
    },
    srp: {
      strokeLength: scenario.recommendedSRP.strokeLengthIn,
      spm: scenario.recommendedSRP.spm,
      vfdFrequency: scenario.recommendedSRP.vfdHz,
    },
  }), [scenario]);

  // Safety Verification: Ensure recommended values are strictly within safe supervisory envelopes
  const safetyViolations = useMemo(() => {
    const violations: string[] = [];
    const { css, srp } = recommendedStrategy;

    if (css.steamVolume < OPERATING_LIMITS.steamVolume.min || css.steamVolume > OPERATING_LIMITS.steamVolume.max) {
      violations.push(`Steam Volume (${css.steamVolume} m³) outside safe envelope [${OPERATING_LIMITS.steamVolume.min} - ${OPERATING_LIMITS.steamVolume.max}]`);
    }
    if (css.injectionPressure < OPERATING_LIMITS.injectionPressure.min || css.injectionPressure > OPERATING_LIMITS.injectionPressure.max) {
      violations.push(`Injection Pressure (${css.injectionPressure} bar) outside safe envelope [${OPERATING_LIMITS.injectionPressure.min} - ${OPERATING_LIMITS.injectionPressure.max}]`);
    }
    if (css.soakTime < OPERATING_LIMITS.soakTime.min || css.soakTime > OPERATING_LIMITS.soakTime.max) {
      violations.push(`Soak Time (${css.soakTime} hr) outside safe envelope [${OPERATING_LIMITS.soakTime.min} - ${OPERATING_LIMITS.soakTime.max}]`);
    }
    if (srp.strokeLength < OPERATING_LIMITS.strokeLength.min || srp.strokeLength > OPERATING_LIMITS.strokeLength.max) {
      violations.push(`Stroke Length (${srp.strokeLength}") outside safe envelope [${OPERATING_LIMITS.strokeLength.min} - ${OPERATING_LIMITS.strokeLength.max}]`);
    }
    if (srp.spm < OPERATING_LIMITS.spm.min || srp.spm > OPERATING_LIMITS.spm.max) {
      violations.push(`SPM (${srp.spm}) outside safe envelope [${OPERATING_LIMITS.spm.min} - ${OPERATING_LIMITS.spm.max}]`);
    }
    if (srp.vfdFrequency < OPERATING_LIMITS.vfdFrequency.min || srp.vfdFrequency > OPERATING_LIMITS.vfdFrequency.max) {
      violations.push(`VFD Frequency (${srp.vfdFrequency} Hz) outside safe envelope [${OPERATING_LIMITS.vfdFrequency.min} - ${OPERATING_LIMITS.vfdFrequency.max}]`);
    }

    return violations;
  }, [recommendedStrategy]);

  const isSafe = safetyViolations.length === 0;

  // Expected Result evaluated directly from the coupled physical model
  const expectedResult = useMemo(() => {
    const optRodFloatPct = scenario.expectedResult.rodFloatingRiskPct ?? 
      (scenario.expectedResult.viscosityCp > 4000 ? 55 : scenario.expectedResult.viscosityCp > 2500 ? 32 : 12);
    const optRodFloatLevel = scenario.expectedResult.rodFloatRiskLevel ?? 
      (optRodFloatPct > 60 ? 'HIGH' : optRodFloatPct > 30 ? 'MEDIUM' : 'LOW');

    return {
      oilProduction: scenario.expectedResult.productionBOPD,
      sor: scenario.expectedResult.sor,
      pumpEfficiency: scenario.expectedResult.pumpEfficiencyPct,
      energyConsumption: scenario.expectedResult.energyKWhPerBbl,
      rodFloatRiskPct: optRodFloatPct,
      rodFloatRiskLevel: optRodFloatLevel,
      reservoirTemperature: scenario.expectedResult.reservoirTempC,
      viscosityCp: scenario.expectedResult.viscosityCp,
    };
  }, [scenario]);

  // Economic Impact Calculations based on user-defined demo assumptions and simulation values
  const economics = useMemo(() => {
    const cycleDays = 75; // Standard CSS recovery cycle length
    const currentTotalOilBbl = Math.max(10, wellState.productionBOPD * cycleDays);
    const currentSteamPerBbl = activeParameters.steamVolume / currentTotalOilBbl;

    const optTotalOilBbl = Math.max(10, expectedResult.oilProduction * cycleDays);
    const optSteamPerBbl = recommendedStrategy.css.steamVolume / optTotalOilBbl;

    // Operating Cost (₹/bbl) = (Steam Consumption * Steam Cost) + (Energy Consumption * Electricity Cost) + Maintenance Cost
    const currentOpCost = (currentSteamPerBbl * steamCost) + (wellState.energyKWhPerBbl * electricityCost) + maintenanceCost;
    const optOpCost = (optSteamPerBbl * steamCost) + (expectedResult.energyConsumption * electricityCost) + maintenanceCost;

    // 1. Production Change = Optimized Production - Current Production
    const productionChange = expectedResult.oilProduction - wellState.productionBOPD;

    // 2. Cost Change = Current Cost/bbl - Optimized Cost/bbl
    const costChangePerBbl = currentOpCost - optOpCost;

    // 3. Daily Economic Impact = Cost Change × Optimized Daily Production
    const dailyEconomicImpact = costChangePerBbl * expectedResult.oilProduction;

    return {
      currentSteamPerBbl,
      optSteamPerBbl,
      currentOpCost,
      optOpCost,
      productionChange,
      costChangePerBbl,
      dailyEconomicImpact,
    };
  }, [
    activeParameters.steamVolume,
    wellState.productionBOPD,
    wellState.energyKWhPerBbl,
    recommendedStrategy.css.steamVolume,
    expectedResult.oilProduction,
    expectedResult.energyConsumption,
    steamCost,
    electricityCost,
    maintenanceCost,
  ]);

  const handleApplyStrategy = () => {
    if (!isSafe) return;
    const { css, srp } = recommendedStrategy;
    updateActiveParameters({
      steamVolume: css.steamVolume,
      injectionPressure: css.injectionPressure,
      soakTime: css.soakTime,
      productionCutoff: css.cutoffBopd,
      strokeLength: srp.strokeLength,
      spm: srp.spm,
      vfdFrequency: srp.vfdFrequency,
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  const handleResetToBaseline = () => {
    resetToBaseline();
    setApplied(false);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              Integrated Well-to-Surface Optimization
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] text-[#0D9488] border border-[#99F6E4] shadow-xs font-semibold">
              {selectedWellId} · {wellBaseline.name}
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            Joint CSS + SRP operating recommendation based on current well conditions.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {isScenarioModified && (
            <button
              onClick={handleResetToBaseline}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] hover:text-[#1E293B] transition-colors shadow-xs cursor-pointer"
              title="Reset parameters to well baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={handleApplyStrategy}
            disabled={!isSafe}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              applied
                ? 'bg-[#0D9488] text-white'
                : !isSafe
                ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                : 'bg-[#0D9488] hover:bg-[#0F766E] text-white'
            }`}
          >
            {applied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Strategy Applied</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Strategy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Warning if limits exceeded */}
      {!isSafe && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs text-[#991B1B] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Supervisory Operating Limit Warning</div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              {safetyViolations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
            <div className="text-[11px] text-[#7F1D1D] font-medium pt-1">
              Safety interlock active: Strategy cannot be applied until limits are cleared.
            </div>
          </div>
        </div>
      )}

      {/* 2. CURRENT WELL STATE */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0D9488]" />
            <h2 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
              Current Well State
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#64748B]">
            {selectedWellId} Telemetry
          </span>
        </div>

        {/* 8 Compact Values Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. Oil Production */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Oil Production</div>
            <div className="text-base font-mono font-semibold text-[#1E293B] tabular-nums">
              {wellState.productionBOPD} <span className="text-xs font-normal text-[#64748B]">BOPD</span>
            </div>
          </div>

          {/* 2. Reservoir Temperature */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Reservoir Temperature</div>
            <div className="text-base font-mono font-semibold text-[#F97316] tabular-nums">
              {wellState.reservoirTemperatureC} <span className="text-xs font-normal text-[#64748B]">°C</span>
            </div>
          </div>

          {/* 3. Reservoir Pressure */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Reservoir Pressure</div>
            <div className="text-base font-mono font-semibold text-[#1E293B] tabular-nums">
              {wellState.reservoirPressureBar} <span className="text-xs font-normal text-[#64748B]">bar</span>
            </div>
          </div>

          {/* 4. Viscosity */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Viscosity</div>
            <div className="text-base font-mono font-semibold text-[#8B5CF6] tabular-nums">
              {wellState.viscosityCp.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">cP</span>
            </div>
          </div>

          {/* 5. SOR */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">SOR</div>
            <div className="text-base font-mono font-semibold text-[#1E293B] tabular-nums">
              {wellState.sor}
            </div>
          </div>

          {/* 6. Pump Efficiency */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Pump Efficiency</div>
            <div className="text-base font-mono font-semibold text-[#0D9488] tabular-nums">
              {wellState.pumpEfficiencyPct}%
            </div>
          </div>

          {/* 7. Polished Rod Load */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Polished Rod Load</div>
            <div className="text-base font-mono font-semibold text-[#1E293B] tabular-nums">
              {wellState.rodLoadKN} <span className="text-xs font-normal text-[#64748B]">kN ({wellState.rodLoadPct}%)</span>
            </div>
          </div>

          {/* 8. Rod Float Risk */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">Rod Float Risk</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                calculatedState.rodFloatingRisk === 'HIGH'
                  ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                  : calculatedState.rodFloatingRisk === 'MEDIUM'
                  ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                  : 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
              }`}>
                {calculatedState.rodFloatingRisk} ({wellState.rodFloatingRiskPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 & 4. TWO-COLUMN COMPARISON: CURRENT OPERATING PARAMETERS vs AI RECOMMENDED STRATEGY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COLUMN 1: CURRENT OPERATING PARAMETERS */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#64748B]" />
                <h2 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                  Current Operating Parameters
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">Active Setpoints</span>
            </div>

            {/* CSS Sub-Group */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-2">
                <Flame className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Cyclic Steam Stimulation (CSS)</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Steam Volume:</span>
                  <span className="font-semibold text-[#1E293B]">{activeParameters.steamVolume.toLocaleString()} m³</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Injection Pressure:</span>
                  <span className="font-semibold text-[#1E293B]">{activeParameters.injectionPressure} bar</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Soak Time:</span>
                  <span className="font-semibold text-[#1E293B]">{activeParameters.soakTime} hr</span>
                </div>
              </div>
            </div>

            {/* SRP Sub-Group */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-2">
                <Sliders className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Sucker Rod Pump (SRP)</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Stroke Length:</span>
                  <span className="font-semibold text-[#1E293B]">{activeParameters.strokeLength} in</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">SPM:</span>
                  <span className="font-semibold text-[#1E293B]">{activeParameters.spm.toFixed(1)} SPM</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">VFD Frequency:</span>
                  <span className="font-semibold text-[#1E293B]">{activeParameters.vfdFrequency} Hz</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] text-[10px] text-[#64748B] font-mono">
            Uncoupled baseline operational point
          </div>
        </div>

        {/* COLUMN 2: AI RECOMMENDED OPERATING STRATEGY */}
        <div className="bg-[#FFFFFF] border border-[#99F6E4] rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
                <h2 className="text-xs font-semibold text-[#0D9488] uppercase tracking-wider font-mono">
                  AI Recommended Operating Strategy
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#0D9488] font-semibold bg-[#E6FFFA] px-1.5 py-0.5 rounded border border-[#99F6E4]">
                Optimal Joint Strategy
              </span>
            </div>

            {/* CSS Recommended */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-2">
                <Flame className="w-3.5 h-3.5 text-[#F97316]" />
                <span>CSS: Current → Recommended</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Steam Volume:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B]">{activeParameters.steamVolume.toLocaleString()}</span>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                    <span className="font-semibold text-[#F97316]">{recommendedStrategy.css.steamVolume.toLocaleString()} m³</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Injection Pressure:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B]">{activeParameters.injectionPressure}</span>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                    <span className="font-semibold text-[#1E293B]">{recommendedStrategy.css.injectionPressure} bar</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Soak Time:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B]">{activeParameters.soakTime}</span>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                    <span className="font-semibold text-[#1E293B]">{recommendedStrategy.css.soakTime} hr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SRP Recommended */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] mb-2">
                <Sliders className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>SRP: Current → Recommended</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Stroke Length:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B]">{activeParameters.strokeLength}"</span>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                    <span className="font-semibold text-[#0D9488]">{recommendedStrategy.srp.strokeLength}"</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">SPM:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B]">{activeParameters.spm.toFixed(1)}</span>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                    <span className="font-semibold text-[#0D9488]">{recommendedStrategy.srp.spm.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">VFD Frequency:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#64748B]">{activeParameters.vfdFrequency}</span>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                    <span className="font-semibold text-[#1E293B]">{recommendedStrategy.srp.vfdFrequency} Hz</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-[10px] text-[#0D9488] font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Safe Envelope</span>
            </span>
            <button
              onClick={handleApplyStrategy}
              disabled={!isSafe}
              className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] transition-colors cursor-pointer"
            >
              Apply now →
            </button>
          </div>
        </div>
      </div>

      {/* 5. EXPECTED RESULT (ONE COMPACT COMPARISON AREA) */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F97316]" />
            <h2 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
              Expected Result
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#64748B]">
            Calibrated Well Physics Model
          </span>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                <th className="py-2 px-3 font-medium uppercase text-[10px]">Parameter</th>
                <th className="py-2 px-3 font-medium uppercase text-[10px]">Current</th>
                <th className="py-2 px-3 font-medium uppercase text-[10px] text-[#0D9488]">Optimized</th>
                <th className="py-2 px-3 font-medium uppercase text-[10px] text-right">Delta / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {/* Row 1: Oil Production */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-3 font-sans font-medium text-[#1E293B]">Oil Production</td>
                <td className="py-2.5 px-3 text-[#475569]">{wellState.productionBOPD} BOPD</td>
                <td className="py-2.5 px-3 font-semibold text-[#0D9488]">{expectedResult.oilProduction} BOPD</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-[#0D9488] font-semibold">
                    {expectedResult.oilProduction >= wellState.productionBOPD ? '+' : ''}{expectedResult.oilProduction - wellState.productionBOPD} BOPD
                  </span>
                </td>
              </tr>

              {/* Row 2: SOR */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-3 font-sans font-medium text-[#1E293B]">SOR</td>
                <td className="py-2.5 px-3 text-[#475569]">{wellState.sor}</td>
                <td className="py-2.5 px-3 font-semibold text-[#0D9488]">{expectedResult.sor}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className={expectedResult.sor <= wellState.sor ? 'text-[#0D9488] font-semibold' : 'text-[#475569]'}>
                    {expectedResult.sor <= wellState.sor ? 'Improved Efficiency' : 'Maintained'}
                  </span>
                </td>
              </tr>

              {/* Row 3: Pump Efficiency */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-3 font-sans font-medium text-[#1E293B]">Pump Efficiency</td>
                <td className="py-2.5 px-3 text-[#475569]">{wellState.pumpEfficiencyPct}%</td>
                <td className="py-2.5 px-3 font-semibold text-[#0D9488]">{expectedResult.pumpEfficiency}%</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-[#0D9488] font-semibold">
                    {expectedResult.pumpEfficiency >= wellState.pumpEfficiencyPct ? '+' : ''}{(expectedResult.pumpEfficiency - wellState.pumpEfficiencyPct).toFixed(1)}%
                  </span>
                </td>
              </tr>

              {/* Row 4: Energy Consumption */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-3 font-sans font-medium text-[#1E293B]">Energy Consumption</td>
                <td className="py-2.5 px-3 text-[#475569]">{wellState.energyKWhPerBbl} kWh/bbl</td>
                <td className="py-2.5 px-3 font-semibold text-[#0D9488]">{expectedResult.energyConsumption} kWh/bbl</td>
                <td className="py-2.5 px-3 text-right">
                  <span className={expectedResult.energyConsumption <= wellState.energyKWhPerBbl ? 'text-[#0D9488] font-semibold' : 'text-[#475569]'}>
                    {expectedResult.energyConsumption - wellState.energyKWhPerBbl > 0 ? '+' : ''}{(expectedResult.energyConsumption - wellState.energyKWhPerBbl).toFixed(1)} kWh/bbl
                  </span>
                </td>
              </tr>

              {/* Row 5: Rod Float Risk */}
              <tr className="hover:bg-[#F8FAFC]">
                <td className="py-2.5 px-3 font-sans font-medium text-[#1E293B]">Rod Float Risk</td>
                <td className="py-2.5 px-3">
                  <span className="text-[#475569]">{calculatedState.rodFloatingRisk} ({wellState.rodFloatingRiskPct}%)</span>
                </td>
                <td className="py-2.5 px-3 font-semibold text-[#0D9488]">
                  {expectedResult.rodFloatRiskLevel} ({expectedResult.rodFloatRiskPct}%)
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    expectedResult.rodFloatRiskPct <= 30
                      ? 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                      : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                  }`}>
                    {expectedResult.rodFloatRiskPct < wellState.rodFloatingRiskPct ? 'Mitigated' : 'Controlled'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. ECONOMIC IMPACT */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0D9488]" />
            <h2 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
              Economic Impact
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-medium">
            Demo Assumptions
          </span>
        </div>

        {/* CURRENT vs OPTIMIZED OPERATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {/* Current Operation */}
          <div className="p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="text-[11px] font-sans font-semibold text-[#475569] uppercase tracking-wider pb-1 border-b border-[#E2E8F0]">
              Current Operation
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-sans text-xs">Oil Production (BOPD):</span>
                <span className="font-semibold text-[#1E293B]">{wellState.productionBOPD} BOPD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-sans text-xs">Energy Consumption (kWh/bbl):</span>
                <span className="font-semibold text-[#1E293B]">{wellState.energyKWhPerBbl} kWh/bbl</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-sans text-xs">Steam Consumption:</span>
                <span className="font-semibold text-[#1E293B]">{economics.currentSteamPerBbl.toFixed(3)} m³/bbl</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#E2E8F0]">
                <span className="text-[#1E293B] font-sans font-medium text-xs">Estimated Operating Cost (₹/bbl):</span>
                <span className="font-bold text-[#1E293B]">₹{economics.currentOpCost.toFixed(2)} / bbl</span>
              </div>
            </div>
          </div>

          {/* Optimized Operation */}
          <div className="p-3 rounded bg-[#F8FAFC] border border-[#99F6E4] space-y-2">
            <div className="text-[11px] font-sans font-semibold text-[#0D9488] uppercase tracking-wider pb-1 border-b border-[#99F6E4]">
              Optimized Operation
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-sans text-xs">Oil Production (BOPD):</span>
                <span className="font-semibold text-[#0D9488]">{expectedResult.oilProduction} BOPD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-sans text-xs">Energy Consumption (kWh/bbl):</span>
                <span className="font-semibold text-[#0D9488]">{expectedResult.energyConsumption} kWh/bbl</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] font-sans text-xs">Steam Consumption:</span>
                <span className="font-semibold text-[#0D9488]">{economics.optSteamPerBbl.toFixed(3)} m³/bbl</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#99F6E4]">
                <span className="text-[#0D9488] font-sans font-medium text-xs">Estimated Operating Cost (₹/bbl):</span>
                <span className="font-bold text-[#0D9488]">₹{economics.optOpCost.toFixed(2)} / bbl</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Small KPI Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* KPI 1: Production Change */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">
              {economics.productionChange < 0
                ? 'Production Loss'
                : economics.productionChange > 0
                ? 'Production Gain'
                : 'Production Change'}
            </div>
            <div className={`text-base font-mono font-bold tabular-nums ${
              economics.productionChange < 0
                ? 'text-[#DC2626]'
                : economics.productionChange > 0
                ? 'text-[#0D9488]'
                : 'text-[#1E293B]'
            }`}>
              {economics.productionChange < 0
                ? `${Math.abs(economics.productionChange)}`
                : economics.productionChange > 0
                ? `+${economics.productionChange}`
                : '0'}{' '}
              <span className="text-xs font-normal text-[#64748B]">BOPD</span>
            </div>
            <div className="text-[10px] font-sans text-[#64748B] mt-0.5">
              {economics.productionChange < 0
                ? `${((Math.abs(economics.productionChange) / Math.max(1, wellState.productionBOPD)) * 100).toFixed(1)}% reduction vs current rate`
                : economics.productionChange > 0
                ? `+${((economics.productionChange / Math.max(1, wellState.productionBOPD)) * 100).toFixed(1)}% incremental rate`
                : '0.0% variance vs current rate'}
            </div>
          </div>

          {/* KPI 2: Cost Change */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">
              {economics.costChangePerBbl >= 0 ? 'Cost Saving / bbl' : 'Additional Cost / bbl'}
            </div>
            <div className={`text-base font-mono font-bold tabular-nums ${
              economics.costChangePerBbl > 0
                ? 'text-[#0D9488]'
                : economics.costChangePerBbl < 0
                ? 'text-[#DC2626]'
                : 'text-[#1E293B]'
            }`}>
              ₹{Math.abs(economics.costChangePerBbl).toFixed(2)}{' '}
              <span className="text-xs font-normal text-[#64748B]">/ bbl</span>
            </div>
            <div className="text-[10px] font-sans text-[#64748B] mt-0.5">
              {economics.costChangePerBbl >= 0
                ? `${((economics.costChangePerBbl / Math.max(1, economics.currentOpCost)) * 100).toFixed(1)}% reduction per barrel`
                : `+${((Math.abs(economics.costChangePerBbl) / Math.max(1, economics.currentOpCost)) * 100).toFixed(1)}% increase per barrel`}
            </div>
          </div>

          {/* KPI 3: Daily Economic Impact */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5">
              {economics.dailyEconomicImpact >= 0 ? 'Estimated Daily Cost Saving' : 'Estimated Daily Additional Cost'}
            </div>
            <div className={`text-base font-mono font-bold tabular-nums ${
              economics.dailyEconomicImpact > 0
                ? 'text-[#0D9488]'
                : economics.dailyEconomicImpact < 0
                ? 'text-[#DC2626]'
                : 'text-[#1E293B]'
            }`}>
              ₹{Math.round(Math.abs(economics.dailyEconomicImpact)).toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-[#64748B]">/ day</span>
            </div>
            <div className="text-[10px] font-sans text-[#64748B] mt-0.5">
              ~₹{Math.round(Math.abs(economics.dailyEconomicImpact) * 30).toLocaleString('en-IN')} / month
            </div>
          </div>
        </div>

        {/* Small "Economic Assumptions" Expandable Section */}
        <div className="border border-[#E2E8F0] rounded overflow-hidden">
          <button
            onClick={() => setIsEconomicsAssumptionsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between p-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-xs font-medium text-[#1E293B]">
                Economic Assumptions
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                Demo Assumptions
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <span>{isEconomicsAssumptionsExpanded ? 'Hide' : 'Edit assumptions'}</span>
              {isEconomicsAssumptionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isEconomicsAssumptionsExpanded && (
            <div className="p-3 bg-[#FFFFFF] border-t border-[#E2E8F0] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-sans font-medium text-[#475569] mb-1">
                    Steam Cost (₹/m³)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="50"
                    value={steamCost}
                    onChange={(e) => setSteamCost(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs font-mono bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                  />
                  <span className="text-[9px] text-[#94A3B8] font-sans">Cold water equivalent</span>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-medium text-[#475569] mb-1">
                    Electricity Cost (₹/kWh)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.25"
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs font-mono bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                  />
                  <span className="text-[9px] text-[#94A3B8] font-sans">Grid / lift power tariff</span>
                </div>

                <div>
                  <label className="block text-[11px] font-sans font-medium text-[#475569] mb-1">
                    Maintenance Cost (₹/bbl)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={maintenanceCost}
                    onChange={(e) => setMaintenanceCost(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1 text-xs font-mono bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D9488] rounded text-[#1E293B] outline-none"
                  />
                  <span className="text-[9px] text-[#94A3B8] font-sans">Well servicing allocation</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Small Note */}
        <p className="text-[10px] text-[#64748B] italic">
          Estimated economic impact based on user-defined assumptions and Digital Twin simulation.
        </p>
      </div>

      {/* 7. WHY THIS RECOMMENDATION? (SMALL EXPANDABLE SECTION) */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        <button
          onClick={() => setIsWhyExpanded(prev => !prev)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
              Why this recommendation?
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="text-[11px] font-sans">{isWhyExpanded ? 'Collapse' : 'Expand explanation'}</span>
            {isWhyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isWhyExpanded && (
          <div className="p-3.5 pt-0 border-t border-[#E2E8F0] bg-[#FFFFFF] space-y-3 text-xs leading-relaxed">
            {/* Visual Causal Flow Sequence */}
            <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="font-semibold text-[#F97316]">Reservoir condition</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-semibold text-[#1E293B]">CSS decision</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-semibold text-[#0D9488]">SRP decision</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-semibold text-[#1E293B]">Production + efficiency + reliability</span>
            </div>

            {/* Plain Engineering Explanation Based on Selected Well Data */}
            <div className="space-y-2 text-[#475569]">
              <p>
                <strong className="text-[#1E293B]">1. Reservoir Temperature & Viscosity: </strong>
                Current reservoir conditions at {wellState.reservoirTemperatureC}°C yield an oil viscosity of {wellState.viscosityCp.toLocaleString()} cP. 
                {wellState.viscosityCp > 4000
                  ? ' High fluid viscosity significantly retards the rod string on the downstroke, causing excessive viscous drag and incomplete pump barrel fillage.'
                  : ' Viscosity is maintained at favorable mobility, but requires precise lift kinematics to avoid fluid pound and maintain high volumetric efficiency.'}
              </p>

              <p>
                <strong className="text-[#1E293B]">2. CSS Thermal Decision & SOR: </strong>
                The strategy establishes a steam cycle volume of {recommendedStrategy.css.steamVolume.toLocaleString()} m³ at {recommendedStrategy.css.injectionPressure} bar and {recommendedStrategy.css.soakTime} hr soak. This sustains the thermal chamber while preventing steam breakthrough, keeping the steam-oil ratio at an efficient {expectedResult.sor} (vs current {wellState.sor}).
              </p>

              <p>
                <strong className="text-[#1E293B]">3. SRP Kinematics & Rod Load: </strong>
                Operating SPM is optimized from {activeParameters.spm.toFixed(1)} to {recommendedStrategy.srp.spm.toFixed(1)} SPM with a {recommendedStrategy.srp.strokeLength}" stroke. {
                  recommendedStrategy.srp.spm < activeParameters.spm
                    ? `Trimming pumping speed allows the traveling valve to open cleanly and lets the rod string fall under gravity through viscous crude without buckling or floating (${wellState.rodFloatingRiskPct}% → ${expectedResult.rodFloatRiskPct}% risk).`
                    : recommendedStrategy.srp.spm > activeParameters.spm
                    ? `With reduced crude viscosity achieved by CSS thermal stimulation, pumping speed can be safely elevated to increase recovery while keeping rod floating risk contained (${wellState.rodFloatingRiskPct}% → ${expectedResult.rodFloatRiskPct}%).`
                    : `Pumping speed is balanced at the kinematic sweet spot, preventing downstroke rod floating (${expectedResult.rodFloatRiskPct}% risk) while sustaining optimal pump fillage.`
                }
              </p>

              <p>
                <strong className="text-[#1E293B]">4. Pump Efficiency & Energy Gain: </strong>
                With complete pump barrel fillage, volumetric pump efficiency reaches {expectedResult.pumpEfficiency}% (gain of {expectedResult.pumpEfficiency >= wellState.pumpEfficiencyPct ? '+' : ''}{(expectedResult.pumpEfficiency - wellState.pumpEfficiencyPct).toFixed(1)}%). Specific electrical lift energy is {expectedResult.energyConsumption <= wellState.energyKWhPerBbl ? 'reduced' : 'adjusted'} from {wellState.energyKWhPerBbl} to {expectedResult.energyConsumption} kWh/bbl, relieving cyclic tensile fatigue on the sucker rod string.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
