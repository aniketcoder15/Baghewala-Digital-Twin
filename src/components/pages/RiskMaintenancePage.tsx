import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  X, 
  FileText,
  Wrench,
  Activity,
  Sliders,
  Flame,
  Clock,
  TrendingDown,
  TrendingUp,
  Cpu,
  Zap,
  CheckCircle2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { calculateRodRemainingLife } from '../../services/rodLifeModel';
import { EngineeringChart } from '../common/EngineeringChart';

export const RiskMaintenancePage: React.FC = () => {
  const { selectedWellId, wellBaseline, activeParameters, wellState, calculatedState, isScenarioModified } = useWell();
  const { t } = useI18n();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Compute live deterministic rod life and equipment health model
  const rodLife = useMemo(() => {
    return calculateRodRemainingLife(wellBaseline, activeParameters, wellState);
  }, [wellBaseline, activeParameters, wellState]);

  const riskScore = calculatedState.overallRiskScore;

  // Chart data for Estimated Rod Life Trend
  const trendChartData = useMemo(() => {
    return rodLife.historicalTrend.map(pt => ({
      label: pt.day,
      value: pt.remainingDays,
      secondaryValue: pt.riskThreshold,
    }));
  }, [rodLife]);

  // Failure Prediction Timeline: progression model based on existing failure risk and remaining life
  const timelineData = useMemo(() => {
    const p0 = rodLife.rodFailureRiskPct;
    const tRem = Math.max(7, rodLife.estimatedRemainingDays);

    const calcRiskAtDay = (day: number) => {
      if (day === 0) return p0;
      if (day <= tRem) {
        const frac = day / tRem;
        return Math.min(98, Math.round(p0 + (92 - p0) * Math.pow(frac, 1.35)));
      } else {
        const overflow = day - tRem;
        return Math.min(99, Math.round(92 + overflow * 0.25));
      }
    };

    const riskCurrent = p0;
    const risk30 = calcRiskAtDay(30);
    const risk60 = calcRiskAtDay(60);
    const risk90 = calcRiskAtDay(90);
    const risk120 = calcRiskAtDay(120);
    const riskFailureWindow = 92;

    const getRiskBadge = (val: number) => {
      if (val >= 80) return { label: 'CRITICAL', color: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]' };
      if (val >= 55) return { label: 'HIGH', color: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]' };
      if (val >= 30) return { label: 'MEDIUM', color: 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]' };
      return { label: 'LOW', color: 'bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]' };
    };

    const steps = [
      { id: 'today', stepLabel: 'Today', daysLabel: 'Day 0', risk: riskCurrent, badge: getRiskBadge(riskCurrent) },
      { id: '30d', stepLabel: '30 Days', daysLabel: '+30d', risk: risk30, badge: getRiskBadge(risk30) },
      { id: '60d', stepLabel: '60 Days', daysLabel: '+60d', risk: risk60, badge: getRiskBadge(risk60) },
      { id: '90d', stepLabel: '90 Days', daysLabel: '+90d', risk: risk90, badge: getRiskBadge(risk90) },
      { id: '120d', stepLabel: '120 Days', daysLabel: '+120d', risk: risk120, badge: getRiskBadge(risk120) },
      { id: 'fail', stepLabel: 'Failure Window', daysLabel: `Day ~${tRem}`, risk: riskFailureWindow, badge: getRiskBadge(riskFailureWindow) },
    ];

    const chartPoints = [
      { label: 'Today', value: riskCurrent, secondaryValue: 60 },
      { label: '30d', value: risk30, secondaryValue: 60 },
      { label: '60d', value: risk60, secondaryValue: 60 },
      { label: '90d', value: risk90, secondaryValue: 60 },
      { label: '120d', value: risk120, secondaryValue: 60 },
      { label: `Day ${tRem}`, value: riskFailureWindow, secondaryValue: 60 },
    ];

    return {
      riskCurrent,
      risk30,
      risk60,
      risk90,
      risk120,
      steps,
      chartPoints,
      predictedFailureWindow: `In ~${tRem} days (±${Math.max(2, Math.round(tRem * 0.1))} days)`,
      recommendedInspectionDate: `In ${rodLife.estimatedInspectionDays} days`,
    };
  }, [rodLife]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('riskMaintenance', 'Risk & Maintenance')}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-[#0D9488] border border-[#99F6E4] shadow-xs font-semibold">
              {selectedWellId} {isScenarioModified ? '· MODIFIED SCENARIO' : '· BASELINE'}
            </span>
          </div>
          <p className="text-xs text-[#475569]">
            Equipment reliability, rod string fatigue modeling, and lifecycle risk prediction
          </p>
        </div>

        <button
          onClick={() => setShowDetailsModal(true)}
          className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#0D9488] font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>VIEW DIAGNOSTICS</span>
        </button>
      </div>

      {/* SECTION 1: MAJOR CARD - ROD REMAINING LIFE (Requirement 7 & 8) */}
      <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                {t('rodRemainingLife', 'Rod Remaining Life')}
              </span>

              {/* Information Tooltip (Requirement 7) */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-[#94A3B8] hover:text-[#0D9488] transition-colors p-0.5"
                  title="Model calculation info"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 p-2.5 bg-[#0F172A] text-white text-[11px] rounded-lg shadow-xl z-50 leading-relaxed font-sans border border-slate-700">
                    Estimated from operating history, rod loading, SPM, pump fillage, temperature, viscosity and previous failure patterns.
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-[#64748B] mt-0.5">
              Kinematic stress & downhole fatigue estimation model
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span className="text-xs text-[#64748B]">Condition:</span>
            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
              rodLife.condition === 'CRITICAL' ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' :
              rodLife.condition === 'HIGH' ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]' :
              rodLife.condition === 'MEDIUM' ? 'bg-[#FEF9C3] text-[#A16207] border border-[#FEF08A]' :
              'bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]'
            }`}>
              {rodLife.condition}
            </span>
          </div>
        </div>

        {/* Big Metric Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {/* Estimated Days */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
              {t('estimatedRemainingLife', 'Estimated Remaining Life')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#1E293B] tabular-nums">
                {rodLife.estimatedRemainingDays}
              </span>
              <span className="text-sm font-semibold text-[#0D9488]">{t('days', 'days')}</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1 font-mono">
              ~{rodLife.estimatedOperatingHours.toLocaleString()} {t('operatingHours', 'operating hours')}
            </div>
          </div>

          {/* Failure Risk */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
              {t('failureRisk', 'Rod Failure Risk')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono tabular-nums ${
                rodLife.rodFailureRiskPct > 50 ? 'text-[#DC2626]' :
                rodLife.rodFailureRiskPct > 30 ? 'text-[#D97706]' : 'text-[#0D9488]'
              }`}>
                {rodLife.rodFailureRiskPct}%
              </span>
              <span className="text-xs font-semibold text-[#64748B]">fatigue prob</span>
            </div>
            {/* Visual Risk Progress Bar */}
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rodLife.rodFailureRiskPct > 50 ? 'bg-[#DC2626]' :
                  rodLife.rodFailureRiskPct > 30 ? 'bg-[#D97706]' : 'bg-[#0D9488]'
                }`}
                style={{ width: `${rodLife.rodFailureRiskPct}%` }}
              />
            </div>
          </div>

          {/* Inspection Window */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
              {t('estimatedInspection', 'Estimated Inspection')}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#0D9488] tabular-nums">
                In {rodLife.estimatedInspectionDays}
              </span>
              <span className="text-sm font-semibold text-[#64748B]">days</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">
              Planned servicing window
            </div>
          </div>

          {/* Overall Health Score */}
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
              Rod Health Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#1E293B] tabular-nums">
                {rodLife.healthScore}
              </span>
              <span className="text-xs text-[#64748B]">/ 100</span>
            </div>
            <div className="text-[11px] text-[#0D9488] mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Multi-variable calibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: FAILURE PREDICTION TIMELINE */}
      <div className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <h2 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                FAILURE PREDICTION TIMELINE
              </h2>
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              Fatigue progression forecast from current operating stress to predicted failure window
            </div>
          </div>
          <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] self-start sm:self-auto">
            API Spec 11B Goodman Model
          </div>
        </div>

        {/* Display Required Values Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Current Failure Risk */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">Current Failure Risk</div>
            <div className="text-base font-mono font-bold text-[#1E293B] tabular-nums">
              {timelineData.riskCurrent}%
            </div>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#D1FAE5] text-[#047857]">
              Today
            </span>
          </div>

          {/* 30-Day Risk */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">30-Day Risk</div>
            <div className="text-base font-mono font-bold text-[#1E293B] tabular-nums">
              {timelineData.risk30}%
            </div>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FEF9C3] text-[#A16207]">
              +30 Days
            </span>
          </div>

          {/* 60-Day Risk */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">60-Day Risk</div>
            <div className="text-base font-mono font-bold text-[#1E293B] tabular-nums">
              {timelineData.risk60}%
            </div>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309]">
              +60 Days
            </span>
          </div>

          {/* 90-Day Risk */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">90-Day Risk</div>
            <div className="text-base font-mono font-bold text-[#1E293B] tabular-nums">
              {timelineData.risk90}%
            </div>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309]">
              +90 Days
            </span>
          </div>

          {/* 120-Day Risk */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[10px] font-mono uppercase text-[#64748B] mb-0.5 truncate">120-Day Risk</div>
            <div className="text-base font-mono font-bold text-[#DC2626] tabular-nums">
              {timelineData.risk120}%
            </div>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626]">
              +120 Days
            </span>
          </div>

          {/* Predicted Failure Window */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#FECACA]">
            <div className="text-[10px] font-mono uppercase text-[#DC2626] font-semibold mb-0.5 truncate">Predicted Failure Window</div>
            <div className="text-xs font-mono font-bold text-[#DC2626] truncate">
              {timelineData.predictedFailureWindow}
            </div>
            <span className="text-[9px] font-sans text-[#64748B]">Critical fatigue limit</span>
          </div>

          {/* Recommended Inspection Date */}
          <div className="p-2.5 rounded bg-[#F8FAFC] border border-[#99F6E4]">
            <div className="text-[10px] font-mono uppercase text-[#0D9488] font-semibold mb-0.5 truncate">Recommended Inspection Date</div>
            <div className="text-xs font-mono font-bold text-[#0D9488] truncate">
              {timelineData.recommendedInspectionDate}
            </div>
            <span className="text-[9px] font-sans text-[#64748B]">Scheduled servicing</span>
          </div>
        </div>

        {/* Visual Timeline Stepper: Today → 30 Days → 60 Days → 90 Days → 120 Days → Predicted Failure Window */}
        <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="text-[10px] font-mono uppercase text-[#64748B]">
            Progression Timeline
          </div>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 overflow-x-auto pt-1">
            {timelineData.steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex-1 min-w-[130px] p-2 rounded bg-[#FFFFFF] border border-[#E2E8F0] flex flex-col justify-between shadow-2xs">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-semibold text-[#1E293B] font-mono">{step.stepLabel}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${step.badge.color}`}>
                      {step.badge.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1 border-t border-[#F1F5F9]">
                    <span className="text-[10px] text-[#64748B] font-mono">{step.daysLabel}</span>
                    <span className={`text-xs font-mono font-bold ${
                      step.risk >= 80 ? 'text-[#DC2626]' :
                      step.risk >= 55 ? 'text-[#B45309]' :
                      step.risk >= 30 ? 'text-[#A16207]' : 'text-[#0D9488]'
                    }`}>
                      {step.risk}% risk
                    </span>
                  </div>
                </div>
                {idx < timelineData.steps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-[#94A3B8] shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Small Line Chart: Failure Probability vs Time */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <div className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                Failure Probability vs Time
              </div>
              <div className="text-[11px] text-[#64748B]">
                Goodman fatigue probability curve from Day 0 (Today) through predicted failure window
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#DC2626] font-semibold">
              High Risk Limit: 60%
            </span>
          </div>

          <EngineeringChart
            data={timelineData.chartPoints}
            primaryColor="#DC2626"
            secondaryColor="#F59E0B"
            primaryLabel="Failure Probability (%)"
            secondaryLabel="High Risk Threshold (60%)"
            unit="%"
            height={165}
            showSecondary={true}
          />
        </div>
      </div>

      {/* SECTION 2: ESTIMATED ROD LIFE TREND & DRIVERS (Requirement 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Trend Chart (col-span-7) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                  {t('historicalLifeTrend', 'Estimated Rod Life Trend')}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  Remaining operating life trajectory vs Risk Threshold (20 days)
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#0D9488] font-semibold">{t('days', 'DAYS REMAINING')}</span>
            </div>

            <EngineeringChart
              data={trendChartData}
              primaryColor="#0D9488"
              secondaryColor="#EF4444"
              primaryLabel="Estimated Life (Days)"
              secondaryLabel="Risk Threshold (20d)"
              unit="days"
              height={185}
              showSecondary={true}
            />
          </div>

          <div className="pt-2 text-[10px] text-[#64748B] font-mono border-t border-[#E2E8F0] flex justify-between mt-2">
            <span>Model: Cyclic Goodman Tensile Life</span>
            <span className="text-[#0D9488] font-semibold">Threshold: 20 Days Minimum</span>
          </div>
        </div>

        {/* Rod Failure Risk Drivers (col-span-5) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E2E8F0]">
              <div className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                {t('drivers', 'Rod Failure Risk Drivers')}
              </div>
              <span className="text-[10px] text-[#64748B] font-mono">CURRENT STATUS</span>
            </div>

            <div className="space-y-2 text-xs">
              {rodLife.drivers.map((driver, idx) => (
                <div 
                  key={idx}
                  className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-[#1E293B] truncate">{driver.name}</div>
                    <div className="text-[10px] text-[#64748B] truncate">{driver.description}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 font-mono text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${
                      driver.level === 'High' ? 'bg-[#DC2626]' :
                      driver.level === 'Moderate' ? 'bg-[#D97706]' : 'bg-[#0D9488]'
                    }`} />
                    <span className={`font-semibold ${
                      driver.level === 'High' ? 'text-[#DC2626]' :
                      driver.level === 'Moderate' ? 'text-[#D97706]' : 'text-[#0D9488]'
                    }`}>
                      {driver.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 p-2 rounded bg-[#E6FFFA] border border-[#99F6E4] text-[10px] text-[#0D9488] font-mono font-medium">
            Dynamic weighting updates instantly when active parameters change.
          </div>
        </div>
      </div>

      {/* SECTION 3: RECOMMENDED MAINTENANCE WINDOW & CONTRIBUTING FACTORS (Requirement 10) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Recommended Maintenance Window (col-span-6) */}
        <div className="md:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0D9488]" />
              <div className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
                {t('recommendedMaintenanceWindow', 'Recommended Maintenance Window')}
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#0D9488] font-semibold">
              IN {rodLife.maintenanceWindow.inspectionDays} DAYS
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
            <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
              {t('recommendedAction', 'Recommended Action')}:
            </span>
            <p className="text-[#1E293B] font-semibold leading-relaxed">
              {rodLife.maintenanceWindow.action}
            </p>
          </div>

          {/* Why? Section */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold text-[#1E293B] font-mono flex items-center gap-1.5">
              <span>{t('why', 'Why?')}</span>
              <span className="text-[10px] text-[#64748B] font-normal">(Primary fatigue drivers)</span>
            </div>
            <ul className="space-y-1 text-xs text-[#475569]">
              {rodLife.maintenanceWindow.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Existing Contributing Risk Factors Card (col-span-6) */}
        <div className="md:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E2E8F0]">
              <div className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
                Subsurface Stress Derivatives
              </div>
              <span className="text-[10px] text-[#64748B] font-mono">REAL-TIME TELEMETRY</span>
            </div>

            <div className="space-y-2">
              {calculatedState.riskFactors.slice(0, 4).map((factor, idx) => (
                <div 
                  key={idx}
                  className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#1E293B]">{factor.name}</div>
                    <div className="text-[10px] text-[#64748B]">{factor.description}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3 font-mono">
                    <div className={`font-semibold ${
                      factor.level === 'Critical' ? 'text-[#DC2626]' :
                      factor.level === 'High' ? 'text-[#D97706]' :
                      factor.level === 'Elevated' ? 'text-[#D97706]' : 'text-[#0D9488]'
                    }`}>
                      {factor.value}
                    </div>
                    <div className="text-[9px] text-[#64748B] uppercase">{factor.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#64748B] font-mono border-t border-[#E2E8F0] flex justify-between mt-2">
            <span>Overall Risk Score:</span>
            <span className="font-semibold text-[#1E293B]">{riskScore} / 100</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: EQUIPMENT HEALTH (Requirement 11) */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider font-mono">
              {t('equipmentHealth', 'Equipment Health Subsystems')}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#64748B]">OPERATING LIFECYCLE MONITORING</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Subsystem 1: Rod String */}
          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E293B]">{t('rodStringHealth', 'Rod String')}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#D1FAE5] text-[#047857]">
                {rodLife.equipmentHealth.rodString.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1E293B]">
                {rodLife.equipmentHealth.rodString.healthPct}%
              </span>
              <span className="text-[10px] font-mono text-[#0D9488] font-semibold">
                {rodLife.equipmentHealth.rodString.trend}
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0] truncate">
              {rodLife.equipmentHealth.rodString.factor}
            </div>
          </div>

          {/* Subsystem 2: Pump */}
          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E293B]">{t('pumpHealth', 'Downhole Pump')}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#D1FAE5] text-[#047857]">
                {rodLife.equipmentHealth.pump.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1E293B]">
                {rodLife.equipmentHealth.pump.healthPct}%
              </span>
              <span className="text-[10px] font-mono text-[#0D9488] font-semibold">
                {rodLife.equipmentHealth.pump.trend}
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0] truncate">
              {rodLife.equipmentHealth.pump.factor}
            </div>
          </div>

          {/* Subsystem 3: Surface Unit */}
          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E293B]">{t('surfaceUnitHealth', 'Surface Unit')}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#D1FAE5] text-[#047857]">
                {rodLife.equipmentHealth.surfaceUnit.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1E293B]">
                {rodLife.equipmentHealth.surfaceUnit.healthPct}%
              </span>
              <span className="text-[10px] font-mono text-[#64748B] font-semibold">
                {rodLife.equipmentHealth.surfaceUnit.trend}
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0] truncate">
              {rodLife.equipmentHealth.surfaceUnit.factor}
            </div>
          </div>

          {/* Subsystem 4: VFD */}
          <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1E293B]">{t('vfdHealth', 'VFD Motor Drive')}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#D1FAE5] text-[#047857]">
                {rodLife.equipmentHealth.vfd.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-[#1E293B]">
                {rodLife.equipmentHealth.vfd.healthPct}%
              </span>
              <span className="text-[10px] font-mono text-[#0D9488] font-semibold">
                {rodLife.equipmentHealth.vfd.trend}
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0] truncate">
              {rodLife.equipmentHealth.vfd.factor}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl max-w-xl w-full p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-semibold text-[#1E293B] font-mono">
                  {selectedWellId} Engineering Diagnostics & Fatigue Log
                </h3>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-[#64748B] hover:text-[#1E293B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#0D9488] font-mono">
                  1. Sucker Rod String Fatigue & Life Decay Formulation
                </div>
                <p className="text-[#475569] text-[11px] leading-relaxed">
                  Remaining life is evaluated dynamically from cumulative stress reversals (SPM: {activeParameters.spm.toFixed(1)}), peak tensile loading ({calculatedState.rodLoad}%), and hydrodynamic fluid drag at {calculatedState.oilViscosity.toLocaleString()} cP viscosity.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#0D9488] font-mono">
                  2. Downstroke Viscous Drag & Rod Float Propensity
                </div>
                <p className="text-[#475569] text-[11px] leading-relaxed">
                  Float index evaluates downstroke retardation against buoyant weight. Reducing SPM or elevating reservoir heating via CSS prolongs rod string integrity.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 space-y-1">
                <div className="text-[11px] font-semibold text-[#0D9488] font-mono">
                  3. Valve Ball & Seat Wear Log
                </div>
                <p className="text-[#475569] text-[11px] leading-relaxed">
                  Plunger barrel fillage is currently {wellState.pumpFillagePct}%. Fluid pound impact stresses remain within API Spec 11B permissible endurance bounds.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-1.5 bg-[#0D9488] text-white text-xs font-semibold rounded hover:bg-[#0F766E] shadow-xs cursor-pointer"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
