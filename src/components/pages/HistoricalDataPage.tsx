import React, { useState, useMemo } from 'react';
import { 
  Download, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  Thermometer,
  Flame
} from 'lucide-react';
import { WellId } from '../../types';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';
import { EngineeringChart } from '../common/EngineeringChart';

export const HistoricalDataPage: React.FC = () => {
  const { selectedWellId, setSelectedWellId, wellBaseline } = useWell();
  const { t } = useI18n();
  const [dateRange, setDateRange] = useState<'7d' | '10d' | 'all'>('10d');

  const allRecords = wellBaseline.historical;
  const filteredRecords = useMemo(() => {
    if (dateRange === '7d') return allRecords.slice(-7);
    if (dateRange === '10d') return allRecords.slice(-10);
    return allRecords;
  }, [allRecords, dateRange]);

  // Calculate trends over the selected historical window
  const trends = useMemo(() => {
    if (filteredRecords.length < 2) return { prodDelta: 0, tempDelta: 0, sorDelta: 0 };
    const first = filteredRecords[0];
    const last = filteredRecords[filteredRecords.length - 1];

    const prodDelta = Number((((last.productionBopd - first.productionBopd) / first.productionBopd) * 100).toFixed(1));
    const tempDelta = Number((last.reservoirTempC - first.reservoirTempC).toFixed(1));
    const sorDelta = Number((last.sor - first.sor).toFixed(1));

    return { prodDelta, tempDelta, sorDelta };
  }, [filteredRecords]);

  // Chart 1: Production trend
  const prodChartData = filteredRecords.map(r => ({
    label: r.date,
    value: r.productionBopd,
  }));

  // Chart 2: Reservoir temperature trend
  const tempChartData = filteredRecords.map(r => ({
    label: r.date,
    value: r.reservoirTempC,
  }));

  const handleExportCSV = () => {
    const headers = 'Date,Production_BOPD,Reservoir_Temp_C,Steam_Volume_M3,SPM,Pump_Efficiency_Pct,SOR,Rod_Load_Pct,Viscosity_cP\n';
    const rows = filteredRecords.map(r => 
      `${r.date},${r.productionBopd},${r.reservoirTempC},${r.steamVolumeM3},${r.spm},${r.pumpEfficiencyPct},${r.sor},${r.rodLoadPct},${r.viscosityCp}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedWellId}_historical_performance_log.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header with Well selector & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('historicalData', 'Historical Data')}
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-[#64748B] border border-[#E2E8F0] shadow-xs font-semibold">
              HISTORICAL ARCHIVE
            </span>
          </div>
          <p className="text-xs text-[#475569]">Deterministic multi-cycle production telemetry</p>
        </div>

        {/* Controls: Well Selector + Date Range + Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Well Selector */}
          <div className="relative">
            <select
              value={selectedWellId}
              onChange={(e) => setSelectedWellId(e.target.value as WellId)}
              aria-label="Filter historical data by well"
              className="bg-[#FFFFFF] border border-[#CBD5E1] rounded px-2.5 py-1 text-xs font-semibold text-[#F97316] appearance-none pr-7 cursor-pointer focus:outline-none focus:border-[#F97316] transition-colors shadow-xs"
            >
              <option value="BW-17">Well BW-17</option>
              <option value="BW-21">Well BW-21</option>
              <option value="BW-24">Well BW-24</option>
              <option value="BW-31">Well BW-31</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-[#FFFFFF] border border-[#CBD5E1] rounded p-0.5 text-xs shadow-xs">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                dateRange === '7d' ? 'bg-[#F97316] text-white font-semibold shadow-xs' : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('10d')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                dateRange === '10d' ? 'bg-[#F97316] text-white font-semibold shadow-xs' : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              10 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
                dateRange === 'all' ? 'bg-[#F97316] text-white font-semibold shadow-xs' : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              All Records
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] hover:text-[#1E293B] transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Historical Trend Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#64748B]">{t('productionTrend', 'Production Trend')}</div>
            <div className="text-sm font-mono font-semibold text-[#1E293B] mt-0.5">
              {trends.prodDelta >= 0 ? `+${trends.prodDelta}%` : `${trends.prodDelta}%`}
            </div>
          </div>
          {trends.prodDelta >= 0 ? (
            <TrendingUp className="w-4 h-4 text-[#0D9488]" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#F59E0B]" />
          )}
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#64748B]">{t('reservoirTemperature', 'Temperature Dissipation')}</div>
            <div className="text-sm font-mono font-semibold text-[#F97316] mt-0.5">
              {trends.tempDelta >= 0 ? `+${trends.tempDelta} °C` : `${trends.tempDelta} °C`}
            </div>
          </div>
          <Thermometer className="w-4 h-4 text-[#F97316]" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-2.5 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#64748B]">{t('sorShort', 'Steam-Oil Ratio Delta')}</div>
            <div className="text-sm font-mono font-semibold text-[#06B6D4] mt-0.5">
              {trends.sorDelta >= 0 ? `+${trends.sorDelta}` : `${trends.sorDelta}`}
            </div>
          </div>
          <Flame className="w-4 h-4 text-[#06B6D4]" />
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg overflow-hidden shadow-xs">
        <div className="px-3.5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1E293B] tracking-wider uppercase font-mono">
              LOGGED TELEMETRY: {selectedWellId}
            </span>
            <span className="text-[9px] font-mono text-[#64748B] px-1.5 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
              HISTORICAL
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] font-mono">{filteredRecords.length} LOGGED CYCLES</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] uppercase font-mono text-[#64748B]">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">{t('oilProduction', 'Production')}</th>
                <th className="py-2 px-3">{t('reservoirTemperature', 'Reservoir Temp')}</th>
                <th className="py-2 px-3">{t('steamVolume', 'Steam Volume')}</th>
                <th className="py-2 px-3">{t('pumpingSpeed', 'SPM')}</th>
                <th className="py-2 px-3">{t('pumpEfficiency', 'Pump Efficiency')}</th>
                <th className="py-2 px-3">{t('sorShort', 'SOR')}</th>
                <th className="py-2 px-3">{t('viscosity', 'Viscosity')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-xs font-mono">
              {filteredRecords.map((r, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2 px-3 text-[#1E293B] font-sans font-medium">{r.date}</td>
                  <td className="py-2 px-3 text-[#F97316] font-semibold tabular-nums">{r.productionBopd} BOPD</td>
                  <td className="py-2 px-3 text-[#1E293B] tabular-nums">{r.reservoirTempC} °C</td>
                  <td className="py-2 px-3 text-[#475569] tabular-nums">{r.steamVolumeM3.toLocaleString()} m³</td>
                  <td className="py-2 px-3 text-[#475569] tabular-nums">{r.spm}</td>
                  <td className="py-2 px-3 text-[#1E293B] tabular-nums">{r.pumpEfficiencyPct}%</td>
                  <td className="py-2 px-3 text-[#06B6D4] font-semibold tabular-nums">{r.sor}</td>
                  <td className="py-2 px-3 text-[#B45309] tabular-nums">{r.viscosityCp.toLocaleString()} cP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section: Production Trend & Reservoir Temperature Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chart 1: Production Trend */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">{t('productionTrend', 'Production Trend')}</div>
              <div className="text-[11px] text-[#64748B]">Historical daily delivery progression</div>
            </div>
            <span className="text-[10px] font-mono text-[#F97316]">{selectedWellId} HISTORICAL</span>
          </div>

          <EngineeringChart
            data={prodChartData}
            primaryColor="#F97316"
            primaryLabel={t('oilProduction', 'Historical Production')}
            unit="BOPD"
            height={165}
          />
        </div>

        {/* Chart 2: Reservoir Temperature Trend */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-[#1E293B]">{t('reservoirTemperature', 'Reservoir Temperature Trend')}</div>
              <div className="text-[11px] text-[#64748B]">Thermal dissipation post-steam soak (°C)</div>
            </div>
            <span className="text-[10px] font-mono text-[#F59E0B]">DOWNHOLE SENSORS</span>
          </div>

          <EngineeringChart
            data={tempChartData}
            primaryColor="#F59E0B"
            primaryLabel={t('reservoirTemperature', 'Downhole Temperature')}
            unit="°C"
            height={165}
          />
        </div>
      </div>
    </div>
  );
};
