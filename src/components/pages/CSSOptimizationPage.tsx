import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ArrowRight, 
  Check, 
  RotateCcw, 
  RotateCw,
  Sparkles,
  Clock,
  Calendar,
  Activity,
  TrendingDown,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { runCSSOptimization } from '../../services/simulationEngine';
import { EngineeringInput } from '../common/EngineeringInput';
import { EngineeringChart } from '../common/EngineeringChart';

export const CSSOptimizationPage: React.FC = () => {
  const { 
    selectedWellId, 
    wellBaseline, 
    activeParameters, 
    updateActiveParameters, 
    wellState,
  } = useWell();
  const { t } = useI18n();

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optRecommendation, setOptRecommendation] = useState(() => 
    runCSSOptimization(wellBaseline, activeParameters)
  );
  const [applied, setApplied] = useState(false);

  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setApplied(false);

    setTimeout(() => {
      const rec = runCSSOptimization(wellBaseline, activeParameters);
      setOptRecommendation(rec);
      setIsOptimizing(false);
    }, 300);
  };

  const handleApplyRecommended = () => {
    updateActiveParameters({
      steamVolume: optRecommendation.recommended.steamVolumeM3,
      injectionPressure: optRecommendation.recommended.injectionPressureBar,
      soakTime: optRecommendation.recommended.soakHours,
      productionCutoff: optRecommendation.recommended.cutoffBopd,
    });
    setApplied(true);
  };

  const handleResetCSS = () => {
    updateActiveParameters({
      steamVolume: wellBaseline.css.steamVolumeM3,
      injectionPressure: wellBaseline.css.injectionPressureBar,
      soakTime: wellBaseline.css.soakHours,
      productionCutoff: wellBaseline.css.cutoffBopd,
    });
    setApplied(false);
  };

  // Thermal dissipation projection: Current vs Recommended
  const dissipationChartData = [
    { label: 'Start (Soak)', value: wellState.reservoirTemperatureC + 16, secondaryValue: optRecommendation.recommended.steamVolumeM3 > activeParameters.steamVolume ? wellState.reservoirTemperatureC + 19 : wellState.reservoirTemperatureC + 16 },
    { label: 'Day 10', value: wellState.reservoirTemperatureC + 10, secondaryValue: wellState.reservoirTemperatureC + 13 },
    { label: 'Day 20', value: wellState.reservoirTemperatureC + 5, secondaryValue: wellState.reservoirTemperatureC + 9 },
    { label: 'Day 35', value: wellState.reservoirTemperatureC + 2, secondaryValue: wellState.reservoirTemperatureC + 5 },
    { label: 'Day 50', value: wellState.reservoirTemperatureC, secondaryValue: wellState.reservoirTemperatureC + 3 },
    { label: 'Day 75', value: wellState.reservoirTemperatureC - 3, secondaryValue: wellState.reservoirTemperatureC },
  ];

  // Next CSS Cycle Prediction & Temperature Forecast
  const nextCyclePrediction = useMemo(() => {
    const currentTemp = wellState.reservoirTemperatureC;
    const currentProd = wellState.productionBOPD;
    const cutoff = activeParameters.productionCutoff || wellBaseline.css.cutoffBopd;
    const coolingRate = Math.abs(wellBaseline.reservoir.coolingRateCPerDay || 0.2); // °C / day
    const triggerTemp = 50.0; // °C supervisory restimulation threshold

    // Days until temperature drops to trigger point
    const daysToTempTrigger = Math.max(2, Math.round((currentTemp - triggerTemp) / coolingRate));

    // Days until production drops to cutoff threshold (assuming average ~0.85 BOPD/day decline in mature production)
    const prodDeficit = currentProd - cutoff;
    const daysToProdCutoff = prodDeficit <= 0 ? 2 : Math.max(2, Math.round(prodDeficit / 0.85));

    // The governing constraint is the sooner of thermal decay and economic cutoff
    const daysUntilNextCSS = Math.min(daysToTempTrigger, daysToProdCutoff);

    // Determine current phase in cycle: Injection → Soak → Heating → Production → Cooling → Next CSS
    const phases: Array<'Injection' | 'Soak' | 'Heating' | 'Production' | 'Cooling' | 'Next CSS'> = [
      'Injection',
      'Soak',
      'Heating',
      'Production',
      'Cooling',
      'Next CSS',
    ];

    let currentPhase: 'Injection' | 'Soak' | 'Heating' | 'Production' | 'Cooling' | 'Next CSS' = 'Production';
    if (wellBaseline.css.phase === 'Injection') {
      currentPhase = 'Injection';
    } else if (wellBaseline.css.phase === 'Soaking') {
      currentPhase = 'Soak';
    } else if (daysUntilNextCSS <= 3 || currentProd <= cutoff) {
      currentPhase = 'Next CSS';
    } else if (currentTemp < 60 || daysUntilNextCSS < 15) {
      currentPhase = 'Cooling';
    } else if (currentTemp >= 70) {
      currentPhase = 'Production';
    } else {
      currentPhase = 'Cooling';
    }

    // Why Now? Factors
    const reasons: string[] = [];
    if (coolingRate >= 0.2 || currentTemp < 62) {
      reasons.push(`Reservoir cooling at ${coolingRate}°C/day is reducing thermal energy in the drainage zone (currently ${currentTemp}°C vs ${triggerTemp}°C trigger threshold).`);
    }
    if (wellState.viscosityCp > 2500) {
      reasons.push(`Elevated crude viscosity (${wellState.viscosityCp.toLocaleString()} cP) restricts formation fluid mobility and increases downstroke rod string drag.`);
    }
    if (currentProd - cutoff <= 15) {
      reasons.push(`Wellhead production rate (${currentProd} BOPD) is approaching the economic cut-off threshold of ${cutoff} BOPD.`);
    }
    if (wellState.sor >= 3.3) {
      reasons.push(`Steam-oil ratio is at ${wellState.sor}, indicating diminishing returns from Cycle #${wellBaseline.css.cycleNumber}.`);
    }
    if (reasons.length === 0) {
      reasons.push(`Operating conditions are steady at ${currentProd} BOPD and ${currentTemp}°C; next cycle scheduled prophylactically before thermal breakthrough.`);
    }

    // Temperature Forecast Chart Data (Days 0, 10, 20, 30, 45, 60)
    const forecastChartData = [
      { label: 'Today', value: currentTemp, secondaryValue: triggerTemp },
      { label: '+10d', value: Number((currentTemp - coolingRate * 10).toFixed(1)), secondaryValue: triggerTemp },
      { label: '+20d', value: Number((currentTemp - coolingRate * 20).toFixed(1)), secondaryValue: triggerTemp },
      { label: '+30d', value: Number((currentTemp - coolingRate * 30).toFixed(1)), secondaryValue: triggerTemp },
      { label: '+45d', value: Number((currentTemp - coolingRate * 45).toFixed(1)), secondaryValue: triggerTemp },
      { label: '+60d', value: Number((currentTemp - coolingRate * 60).toFixed(1)), secondaryValue: triggerTemp },
    ];

    return {
      daysUntilNextCSS,
      currentPhase,
      phases,
      reasons,
      forecastChartData,
      triggerTemp,
    };
  }, [wellState, activeParameters, wellBaseline]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('cssOptimization', 'CSS optimization')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] text-[#475569] border border-[#E2E8F0] shadow-xs font-semibold">
              {selectedWellId} · Cycle #{wellBaseline.css.cycleNumber} ({wellBaseline.css.phase})
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#475569]">Cyclic steam stimulation thermal planning</p>
            <span className="text-[#CBD5E1] text-xs">·</span>
            <span className="text-[10px] text-[#64748B] font-mono">{t('decisionSupport', 'Decision support')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCSS}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] hover:text-[#1E293B] transition-colors shadow-xs cursor-pointer"
            title="Reset parameters to well baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('reset', 'Reset')}</span>
          </button>
        </div>
      </div>

      {/* Cycle Status Sub-Header Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono shadow-xs">
        <div>
          <span className="text-[#64748B] text-[10px] block uppercase font-sans">CSS Cycle</span>
          <span className="text-[#1E293B] font-semibold">Cycle #{wellBaseline.css.cycleNumber}</span>
        </div>
        <div>
          <span className="text-[#64748B] text-[10px] block uppercase font-sans">{t('steamVolume', 'Cycle Steam Volume')}</span>
          <span className="text-[#F97316] font-semibold">{activeParameters.steamVolume.toLocaleString()} m³</span>
        </div>
        <div>
          <span className="text-[#64748B] text-[10px] block uppercase font-sans">{t('statusCol', 'Current Phase')}</span>
          <span className="text-[#0D9488] font-semibold">{wellBaseline.css.phase}</span>
        </div>
        <div>
          <span className="text-[#64748B] text-[10px] block uppercase font-sans">Steam & Soak Status</span>
          <span className="text-[#475569]">{wellBaseline.css.injectionStatus} · {wellBaseline.css.soakStatus}</span>
        </div>
      </div>

      {/* Main Grid: Left Editable Parameter Controls vs Right Scenario Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Editable Parameter Controls (col-span-5) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#F97316]" />
              <span className="text-xs font-semibold text-[#1E293B] tracking-wide">
                {t('currentOperatingState', 'Current operating scenario')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">
              {t('current', 'Current')}
            </span>
          </div>

          {/* Steam Volume (1000 - 2500 m³) */}
          <EngineeringInput
            label={t('steamVolume', 'Steam volume')}
            value={activeParameters.steamVolume}
            min={1000}
            max={2500}
            step={50}
            unit="m³"
            onChange={(val) => {
              updateActiveParameters({ steamVolume: val });
              setApplied(false);
            }}
            tooltip="Injected steam volume per cycle (Cold Water Equivalent)"
            description="Increases radial heating chamber; excessive steam degrades SOR"
          />

          {/* Injection Pressure (15 - 40 bar) */}
          <EngineeringInput
            label={t('injectionPressure', 'Injection pressure')}
            value={activeParameters.injectionPressure}
            min={15}
            max={40}
            step={1}
            unit="bar"
            onChange={(val) => {
              updateActiveParameters({ injectionPressure: val });
              setApplied(false);
            }}
            tooltip="Wellhead injection pressure during active steaming period"
            description="Controls steam saturation enthalpy and formation entry velocity"
          />

          {/* Soak Time (24 - 144 hr) */}
          <EngineeringInput
            label={t('soakPeriod', 'Soak time')}
            value={activeParameters.soakTime}
            min={24}
            max={144}
            step={6}
            unit="hr"
            onChange={(val) => {
              updateActiveParameters({ soakTime: val });
              setApplied(false);
            }}
            tooltip="Shut-in period post-injection for heat conduction into rock matrix"
            description="Optimal thermal window between 72–96 hrs to avoid heat loss"
          />

          {/* Production Cut-off (50 - 120 BOPD) */}
          <EngineeringInput
            label="Production cut-off"
            value={activeParameters.productionCutoff}
            min={50}
            max={120}
            step={2}
            unit="BOPD"
            onChange={(val) => {
              updateActiveParameters({ productionCutoff: val });
              setApplied(false);
            }}
            tooltip="Economic flowrate threshold triggering next steam stimulation"
            description="End-of-cycle switchover rate before thermal depletion"
          />

          {/* Live Calculated Thermal Status */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
            <div className="flex justify-between text-[#475569]">
              <span>{t('reservoirTemperature', 'Predicted reservoir temp')}:</span>
              <span className="font-mono font-semibold text-[#F97316] tabular-nums">{wellState.reservoirTemperatureC} °C</span>
            </div>
            <div className="flex justify-between text-[#475569]">
              <span>{t('viscosity', 'Predicted crude viscosity')}:</span>
              <span className="font-mono font-semibold text-[#B45309] tabular-nums">{wellState.viscosityCp.toLocaleString()} cP</span>
            </div>
            <div className="flex justify-between text-[#475569]">
              <span>{t('sorShort', 'Operating SOR')}:</span>
              <span className="font-mono font-semibold text-[#06B6D4] tabular-nums">{wellState.sor}</span>
            </div>
          </div>
        </div>

        {/* Right: RECOMMENDED OPERATING SCENARIO (col-span-7) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#1E293B] tracking-wide">
                  {t('recommended', 'Model recommendation')}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {t('recommended', 'Recommended scenario')}
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono">Local decision solver</span>
            </div>

            {/* Current vs Recommended Table */}
            <div className="space-y-2">
              {/* Steam Volume */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('steamVolume', 'Cycle steam volume')}</div>
                  <div className="text-[10px] text-[#64748B]">Cold water equivalent</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#475569] tabular-nums">{activeParameters.steamVolume.toLocaleString()} m³</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold text-sm tabular-nums">
                    {optRecommendation.recommended.steamVolumeM3.toLocaleString()} m³
                  </span>
                </div>
              </div>

              {/* Injection Pressure */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('injectionPressure', 'Injection pressure')}</div>
                  <div className="text-[10px] text-[#64748B]">Wellhead delivery pressure</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#475569] tabular-nums">{activeParameters.injectionPressure} bar</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold text-sm tabular-nums">
                    {optRecommendation.recommended.injectionPressureBar} bar
                  </span>
                </div>
              </div>

              {/* Soak Time */}
              <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#1E293B]">{t('soakPeriod', 'Soak time')}</div>
                  <div className="text-[10px] text-[#64748B]">Subsurface heat diffusion</div>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#475569] tabular-nums">{activeParameters.soakTime} hr</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="text-[#06B6D4] font-semibold text-sm tabular-nums">
                    {optRecommendation.recommended.soakHours} hr
                  </span>
                </div>
              </div>
            </div>

            {/* Predicted Impact */}
            <div className="mt-3.5 pt-2.5 border-t border-[#E2E8F0]">
              <div className="text-[10px] font-mono tracking-wider text-[#06B6D4] mb-2 flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Forecast / Model estimate</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 text-center">
                  <div className="text-[10px] text-[#64748B] mb-0.5">{t('oilProduction', 'Production')}</div>
                  <div className="text-lg font-mono font-semibold text-[#0D9488] tabular-nums">
                    {optRecommendation.predicted.productionPct}
                  </div>
                  <div className="text-[9px] text-[#64748B] font-mono">
                    {optRecommendation.current.productionBOPD} → {optRecommendation.recommended.productionBOPD} BOPD
                  </div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 text-center">
                  <div className="text-[10px] text-[#64748B] mb-0.5">{t('sorShort', 'SOR')}</div>
                  <div className="text-lg font-mono font-semibold text-[#06B6D4] tabular-nums">
                    {optRecommendation.predicted.sorPct}
                  </div>
                  <div className="text-[9px] text-[#64748B] font-mono">
                    {optRecommendation.current.sor} → {optRecommendation.recommended.sor}
                  </div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 text-center">
                  <div className="text-[10px] text-[#64748B] mb-0.5">{t('energy', 'Energy')}</div>
                  <div className="text-lg font-mono font-semibold text-[#F97316] tabular-nums">
                    {optRecommendation.predicted.energyPct}
                  </div>
                  <div className="text-[9px] text-[#64748B] font-mono">
                    {optRecommendation.current.energyKWhPerBbl} → {optRecommendation.recommended.energyKWhPerBbl} kWh/bbl
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569] leading-relaxed">
              {optRecommendation.rationale}
            </div>
          </div>

          {/* Action Buttons: Run optimization & Apply */}
          <div className="mt-3.5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-xs rounded transition-colors shadow-xs cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('solving', 'Solving thermal grid...')}</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5" />
                  <span>{t('runOptimization', 'Run optimization')}</span>
                </>
              )}
            </button>

            <button
              onClick={handleApplyRecommended}
              disabled={applied}
              className={`px-3.5 py-2 border rounded text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${
                applied 
                  ? 'bg-[#D1FAE5] border-[#A7F3D0] text-[#047857]' 
                  : 'bg-[#E2E8F0] hover:bg-[#CBD5E1] border-[#CBD5E1] text-[#334155]'
              }`}
            >
              {applied ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{applied ? t('saved', 'Scenario applied') : t('applyScenario', 'Apply scenario')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: NEXT CSS CYCLE RECOMMENDATION */}
      <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Header with Title, Question, and Digital Twin Simulation Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F97316]" />
              <h2 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                NEXT CSS CYCLE RECOMMENDATION
              </h2>
            </div>
            <div className="text-[11px] text-[#475569] mt-0.5 font-medium">
              When should the next CSS cycle be started?
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-semibold self-start sm:self-auto">
            Digital Twin Simulation
          </span>
        </div>

        {/* 1. CURRENT WELL CONDITIONS: 7 Key Telemetry Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* 1. Current Reservoir Temperature */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Reservoir Temp</div>
            <div className="text-base font-mono font-bold text-[#F97316] tabular-nums">
              {wellState.reservoirTemperatureC} <span className="text-xs font-normal text-[#64748B]">°C</span>
            </div>
          </div>

          {/* 2. Temperature Trend */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Temp Trend</div>
            <div className="text-base font-mono font-bold text-[#DC2626] tabular-nums">
              {wellBaseline.reservoir.coolingRateCPerDay} <span className="text-xs font-normal text-[#64748B]">°C/d</span>
            </div>
          </div>

          {/* 3. Current Oil Production */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Oil Production</div>
            <div className="text-base font-mono font-bold text-[#1E293B] tabular-nums">
              {wellState.productionBOPD} <span className="text-xs font-normal text-[#64748B]">BOPD</span>
            </div>
          </div>

          {/* 4. Production Trend */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Production Trend</div>
            <div className={`text-base font-mono font-bold tabular-nums ${wellState.productionTrend >= 0 ? 'text-[#0D9488]' : 'text-[#DC2626]'}`}>
              {wellState.productionTrend > 0 ? '+' : ''}{wellState.productionTrend}%
            </div>
          </div>

          {/* 5. Current Viscosity */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Viscosity</div>
            <div className="text-base font-mono font-bold text-[#8B5CF6] tabular-nums">
              {wellState.viscosityCp.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">cP</span>
            </div>
          </div>

          {/* 6. Current SOR */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Current SOR</div>
            <div className="text-base font-mono font-bold text-[#1E293B] tabular-nums">
              {wellState.sor}
            </div>
          </div>

          {/* 7. Current CSS Cycle / Production Phase */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">CSS Cycle / Phase</div>
            <div className="text-xs font-mono font-bold text-[#0D9488] truncate mt-1">
              Cycle #{wellBaseline.css.cycleNumber}
            </div>
            <div className="text-[10px] font-mono text-[#64748B] truncate">
              {wellBaseline.css.phase}
            </div>
          </div>
        </div>

        {/* 2. RECOMMENDED CSS START & PARAMETERS */}
        <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Recommended CSS Start */}
          <div className="md:col-span-1 p-3 rounded bg-[#FFFFFF] border border-[#FED7AA] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#F97316] font-semibold block">
              Recommended CSS Start
            </span>
            <div className="text-xl font-mono font-bold text-[#F97316] tabular-nums">
              In ~{nextCyclePrediction.daysUntilNextCSS} days
            </div>
            <div className="text-[10px] text-[#64748B]">
              Thermal restimulation window
            </div>
          </div>

          {/* Recommended Steam Volume */}
          <div className="p-3 rounded bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block">
              Recommended Steam Volume
            </span>
            <div className="text-lg font-mono font-bold text-[#1E293B] tabular-nums">
              {optRecommendation.recommended.steamVolumeM3.toLocaleString()} <span className="text-xs font-normal text-[#64748B]">m³</span>
            </div>
            <div className="text-[10px] text-[#0D9488] font-mono">
              Cold water equivalent
            </div>
          </div>

          {/* Recommended Injection Pressure */}
          <div className="p-3 rounded bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block">
              Recommended Injection Pressure
            </span>
            <div className="text-lg font-mono font-bold text-[#1E293B] tabular-nums">
              {optRecommendation.recommended.injectionPressureBar} <span className="text-xs font-normal text-[#64748B]">bar</span>
            </div>
            <div className="text-[10px] text-[#64748B] font-mono">
              Wellhead injection ceiling
            </div>
          </div>

          {/* Recommended Soak Time */}
          <div className="p-3 rounded bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block">
              Recommended Soak Time
            </span>
            <div className="text-lg font-mono font-bold text-[#1E293B] tabular-nums">
              {optRecommendation.recommended.soakHours} <span className="text-xs font-normal text-[#64748B]">hr</span>
            </div>
            <div className="text-[10px] text-[#64748B] font-mono">
              Matrix thermal diffusion
            </div>
          </div>
        </div>

        {/* 3. CSS CYCLE STATUS STEPPER */}
        <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#64748B] flex items-center justify-between">
            <span>CSS Cycle Status (Phase Progression)</span>
            <span className="text-[10px] font-mono text-[#0D9488] font-semibold">Active: {nextCyclePrediction.currentPhase}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 overflow-x-auto pt-1 font-mono text-xs">
            {nextCyclePrediction.phases.map((phaseName, idx) => {
              const isActive = phaseName === nextCyclePrediction.currentPhase;
              return (
                <React.Fragment key={phaseName}>
                  <div className={`flex-1 min-w-[95px] p-2 rounded text-center border transition-all ${
                    isActive
                      ? 'bg-[#E6FFFA] border-[#0D9488] text-[#0D9488] font-bold shadow-xs'
                      : 'bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] font-medium'
                  }`}>
                    <div className="flex items-center justify-center gap-1">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />}
                      <span>{phaseName}</span>
                    </div>
                  </div>
                  {idx < nextCyclePrediction.phases.length - 1 && (
                    <div className="hidden sm:flex items-center justify-center text-[#CBD5E1] shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 4. WHY NOW? */}
        <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
          <div className="text-xs font-semibold text-[#1E293B] font-mono flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Why is the next CSS cycle recommended?</span>
          </div>
          <ul className="space-y-1 text-[#475569] text-[11px] pt-1">
            {nextCyclePrediction.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] shrink-0 mt-1" />
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. SIMPLE FORECAST: Reservoir Temperature Forecast */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <div className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                Reservoir Temperature Forecast
              </div>
              <div className="text-[11px] text-[#64748B]">
                Predicted thermal dissipation trajectory vs CSS trigger recommendation limit ({nextCyclePrediction.triggerTemp}°C)
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#F97316] font-semibold">
              CSS Trigger Point: {nextCyclePrediction.triggerTemp}°C
            </span>
          </div>

          <EngineeringChart
            data={nextCyclePrediction.forecastChartData}
            primaryColor="#F97316"
            secondaryColor="#EF4444"
            primaryLabel="Forecast Reservoir Temp (°C)"
            secondaryLabel="CSS Restimulation Trigger (50°C)"
            unit="°C"
            height={165}
            showSecondary={true}
          />
        </div>
      </div>

      {/* Bottom Chart: Thermal Trajectory Profile */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-[#1E293B]">{t('reservoirTemperature', 'Reservoir temperature profile')}</div>
            <div className="text-[11px] text-[#64748B]">Post-steam soak dissipation: Current (orange) vs Recommended (cyan)</div>
          </div>
          <span className="text-[10px] font-mono text-[#64748B]">75-day dissipation model</span>
        </div>

        <EngineeringChart
          data={dissipationChartData}
          primaryColor="#F97316"
          secondaryColor="#06B6D4"
          primaryLabel={t('currentBaseline', 'Current parameters')}
          secondaryLabel={t('recommended', 'Recommended CSS')}
          unit="°C"
          height={165}
          showSecondary={true}
        />
      </div>
    </div>
  );
};
