import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { EngineeringChart } from '../common/EngineeringChart';

interface OverviewPageProps {
  onNavigateToTwin: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateToTwin }) => {
  const { wellBaseline, wellState, selectedWellId, isScenarioModified } = useWell();
  const { t } = useI18n();

  // Create 7-day trend combining historical with current live calculated state
  const prodTrendData = wellBaseline.historical.slice(-7).map((h, idx, arr) => {
    const isLatest = idx === arr.length - 1;
    return {
      label: h.date,
      value: isLatest ? wellState.productionBOPD : h.productionBopd,
    };
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('fieldOverview', 'Field Overview')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] text-[#475569] border border-[#E2E8F0] shadow-xs font-semibold">
              {selectedWellId} {isScenarioModified ? `· ${t('scenarioChanges', 'Scenario changes')}` : `· ${t('currentOperatingState', 'Current operating state')}`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#475569]">{t('wellToSurfaceCond', 'Well-to-surface operating condition')}</p>
            <span className="text-[#CBD5E1] text-xs">·</span>
            <span className="text-[10px] text-[#64748B] font-mono">{wellState.dataSource}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToTwin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('openDigitalTwin', 'Open digital twin')}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Oil Production */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 hover:border-[#CBD5E1] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#475569] font-medium">{t('oilProduction', 'Oil production')}</span>
            <span className="text-[10px] text-[#64748B] font-mono">{t('current', 'Current')}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-[#1E293B] font-mono tracking-tight tabular-nums">
              {wellState.productionBOPD} <span className="text-xs font-normal text-[#64748B]">BOPD</span>
            </div>
            <div className="flex items-center text-[11px] text-[#0D9488] font-mono font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              <span>{wellState.productionTrend >= 0 ? `+${wellState.productionTrend}%` : `${wellState.productionTrend}%`}</span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-[#64748B]">{t('grossWellheadFlowrate', 'Gross wellhead flowrate')}</div>
        </div>

        {/* KPI 2: Reservoir Temperature */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 hover:border-[#CBD5E1] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#475569] font-medium">{t('reservoirTemperature', 'Reservoir temperature')}</span>
            <span className="text-[10px] text-[#64748B] font-mono">{t('current', 'Current')}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-[#F97316] font-mono tracking-tight tabular-nums">
              {wellState.reservoirTemperatureC} <span className="text-xs font-normal text-[#64748B]">°C</span>
            </div>
            <div className="flex items-center text-[11px] text-[#F59E0B] font-mono font-semibold">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              <span>{wellState.temperatureTrend} °C/d</span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-[#64748B]">{t('thermalDrainageZone', 'Thermal drainage zone')}</div>
        </div>

        {/* KPI 3: Pump Efficiency */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 hover:border-[#CBD5E1] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#475569] font-medium">{t('pumpEfficiency', 'Pump efficiency')}</span>
            <span className="text-[10px] text-[#64748B] font-mono">{t('current', 'Current')}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-[#1E293B] font-mono tracking-tight tabular-nums">
              {wellState.pumpEfficiencyPct} <span className="text-xs font-normal text-[#64748B]">%</span>
            </div>
            <div className="flex items-center text-[11px] text-[#0D9488] font-mono font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              <span>+0.2%</span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-[#64748B]">{t('volumetricFillageIndex', 'Volumetric fillage index')}</div>
        </div>

        {/* KPI 4: Steam-Oil Ratio */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 hover:border-[#CBD5E1] shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#475569] font-medium">{t('steamOilRatio', 'Steam-oil ratio')}</span>
            <span className="text-[10px] text-[#64748B] font-mono">{t('current', 'Current')}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-semibold text-[#06B6D4] font-mono tracking-tight tabular-nums">
              {wellState.sor} <span className="text-xs font-normal text-[#64748B]">SOR</span>
            </div>
            <div className="flex items-center text-[11px] text-[#0D9488] font-mono font-semibold">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              <span>-0.1</span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-[#64748B]">{t('cumulativeCycleRecovery', 'Cumulative cycle recovery')}</div>
        </div>
      </div>

      {/* Middle Row: Production Trend + Well Condition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Production Trend (7-day line chart) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">{t('productionTrend', 'Production trend')}</div>
              <div className="text-[11px] text-[#64748B]">{t('sevenDayTracking', '7-day wellhead liquid rate tracking')}</div>
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">{selectedWellId} {t('recentTelemetry', 'recent telemetry')}</span>
          </div>

          <div className="mt-1">
            <EngineeringChart
              data={prodTrendData}
              primaryColor="#F97316"
              primaryLabel={t('grossWellheadFlowrate', 'Wellhead gross rate')}
              unit="BOPD"
              height={175}
            />
          </div>
        </div>

        {/* Right: Well Condition */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#E2E8F0]">
              <div>
                <div className="text-sm font-semibold text-[#1E293B]">{t('wellCondition', 'Well condition')}</div>
                <div className="text-[11px] text-[#64748B]">{t('instantaneousOperatingProfile', 'Mechanical & hydraulic load status')}</div>
              </div>
              <Activity className="w-4 h-4 text-[#0D9488]" />
            </div>

            <div className="space-y-3 mt-2.5">
              {/* Pump Efficiency */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#475569]">{t('pumpEfficiency', 'Pump efficiency')}</span>
                  <span className="font-mono text-[#1E293B] font-semibold tabular-nums">{wellState.pumpEfficiencyPct}%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div 
                    className="h-full bg-[#F97316] rounded-full transition-all duration-300"
                    style={{ width: `${wellState.pumpEfficiencyPct}%` }}
                  />
                </div>
              </div>

              {/* Rod Load */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#475569]">{t('polishedRodLoad', 'Polished rod load')}</span>
                  <span className={`font-mono font-semibold tabular-nums ${wellState.rodLoadPct > 78 ? 'text-[#EF4444]' : wellState.rodLoadPct > 70 ? 'text-[#F59E0B]' : 'text-[#0D9488]'}`}>
                    {wellState.rodLoadKN} kN ({wellState.rodLoadPct}%)
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${wellState.rodLoadPct > 78 ? 'bg-[#EF4444]' : wellState.rodLoadPct > 70 ? 'bg-[#F59E0B]' : 'bg-[#0D9488]'}`}
                    style={{ width: `${wellState.rodLoadPct}%` }}
                  />
                </div>
              </div>

              {/* Pump Fillage */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#475569]">{t('pumpBarrelFillage', 'Pump barrel fillage')}</span>
                  <span className="font-mono text-[#1E293B] font-semibold tabular-nums">{wellState.pumpFillagePct}%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div 
                    className="h-full bg-[#0D9488] rounded-full transition-all duration-300"
                    style={{ width: `${wellState.pumpFillagePct}%` }}
                  />
                </div>
              </div>

              {/* Equipment Health */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#475569]">{t('equipmentHealthIndex', 'Equipment health index')}</span>
                  <span className="font-mono text-[#0D9488] font-semibold tabular-nums">92%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div 
                    className="h-full bg-[#0D9488] rounded-full"
                    style={{ width: `92%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#64748B] font-mono flex items-center justify-between border-t border-[#E2E8F0] mt-3">
            <span>Surface unit: API 456-256-120</span>
            <span className="text-[#0D9488] font-semibold">● {t('stable', 'Stable')}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Reservoir Condition & Active Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Reservoir Condition */}
        <div className="md:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#1E293B] tracking-wide">{t('reservoirCondition', 'Reservoir condition')}</div>
            <span className="text-[10px] text-[#64748B] font-mono">Pay zone: {wellBaseline.reservoir.depthM}m TVD</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 text-center">
              <div className="text-[10px] text-[#64748B] mb-0.5">{t('temperature', 'Temperature')}</div>
              <div className="text-lg font-mono font-semibold text-[#F97316] tabular-nums">{wellState.reservoirTemperatureC} °C</div>
              <div className="text-[9px] text-[#64748B] mt-0.5">{wellState.temperatureTrend} °C/day</div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 text-center">
              <div className="text-[10px] text-[#64748B] mb-0.5">{t('pressure', 'Pressure')}</div>
              <div className="text-lg font-mono font-semibold text-[#1E293B] tabular-nums">{wellState.reservoirPressureBar} bar</div>
              <div className="text-[9px] text-[#64748B] mt-0.5">{t('pressure', 'Pore pressure')}</div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 text-center">
              <div className="text-[10px] text-[#64748B] mb-0.5">{t('viscosity', 'Viscosity')}</div>
              <div className="text-lg font-mono font-semibold text-[#B45309] tabular-nums">{wellState.viscosityCp.toLocaleString()} cP</div>
              <div className="text-[9px] text-[#64748B] mt-0.5">{t('viscosity', 'Heavy crude')}</div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="md:col-span-6 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#1E293B] tracking-wide">{t('activeAlerts', 'Active alerts')}</div>
            <span className="text-[10px] text-[#64748B] font-mono">{wellState.alerts.length} {t('active', 'flagged')}</span>
          </div>

          <div className="space-y-2">
            {wellState.alerts.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#64748B]">
                {t('allParametersNormal', 'All monitored parameters are within safe operating limits')}
              </div>
            ) : (
              wellState.alerts.map(alt => (
                <div 
                  key={alt.id}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${alt.severity === 'High' ? 'text-[#EF4444]' : alt.severity === 'Medium' ? 'text-[#F59E0B]' : 'text-[#06B6D4]'}`} />
                    <div>
                      <div className="text-xs font-semibold text-[#1E293B]">{alt.title}</div>
                      <div className="text-[10px] text-[#64748B]">{alt.parameter} — {alt.value}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-mono font-semibold ${alt.severity === 'High' ? 'text-[#EF4444]' : alt.severity === 'Medium' ? 'text-[#F59E0B]' : 'text-[#64748B]'}`}>
                      {alt.severity}
                    </span>
                    <div className="text-[9px] text-[#94A3B8] font-mono">{alt.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
