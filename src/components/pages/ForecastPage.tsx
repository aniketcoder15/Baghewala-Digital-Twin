import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Activity, 
  Droplets, 
  AlertCircle,
  Calendar,
  Layers,
  Gauge
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { simulateThermalForecast } from '../../services/simulationEngine';
import { EngineeringChart } from '../common/EngineeringChart';

export const ForecastPage: React.FC = () => {
  const { selectedWellId, wellBaseline, wellState } = useWell();
  const [horizon, setHorizon] = useState<7 | 14 | 30>(14);

  const forecastPoints = simulateThermalForecast(wellBaseline, wellState, horizon);

  // Chart data mappings
  const tempChartData = forecastPoints.map(p => ({
    label: p.date,
    value: p.tempC,
    secondaryValue: p.tempLower,
  }));

  const viscChartData = forecastPoints.map(p => ({
    label: p.date,
    value: p.viscosityCp,
  }));

  const prodChartData = forecastPoints.map(p => ({
    label: p.date,
    value: p.productionBopd,
    secondaryValue: p.prodLower,
  }));

  const effChartData = forecastPoints.map(p => ({
    label: p.date,
    value: p.efficiencyPct,
  }));

  const finalPoint = forecastPoints[forecastPoints.length - 1];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#24282E]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#F0F2F5] tracking-tight">Thermal & Production Forecast</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181D] text-[#8E95A0] border border-[#2B313A]">
              {selectedWellId} · {horizon}-Day Horizon
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#8E95A0]">Downhole Thermal Dissipation & Crude Mobility Decline Projection</p>
            <span className="text-[#636A74] text-xs">·</span>
            <span className="text-[10px] text-[#FF7600] font-mono font-medium">Model Forecast (Not Guaranteed Prediction)</span>
          </div>
        </div>

        {/* Time Horizon Selector */}
        <div className="flex items-center gap-1.5 bg-[#16181D] border border-[#2B313A] rounded p-1">
          <Calendar className="w-3.5 h-3.5 text-[#8E95A0] ml-1.5" />
          <span className="text-[11px] text-[#8E95A0] mr-1 hidden sm:inline">Horizon:</span>
          {[7, 14, 30].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h as 7 | 14 | 30)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                horizon === h
                  ? 'bg-[#FF7600] text-black font-semibold'
                  : 'text-[#8E95A0] hover:text-[#F0F2F5]'
              }`}
            >
              {h} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards of Projected State */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#14171A] border border-[#24282E] rounded p-3">
          <div className="text-[10px] font-mono text-[#8E95A0] uppercase mb-1 flex items-center justify-between">
            <span>Projected Temp</span>
            <span className="text-[#FF7600]">Day {horizon}</span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-[#FF7600]">{finalPoint.tempC} °C</span>
            <span className="text-[11px] text-[#E6A23C]">
              {Number((finalPoint.tempC - wellState.reservoirTemperatureC).toFixed(1))} °C
            </span>
          </div>
          <div className="text-[10px] text-[#737A84] mt-1">Dissipation gradient</div>
        </div>

        <div className="bg-[#14171A] border border-[#24282E] rounded p-3">
          <div className="text-[10px] font-mono text-[#8E95A0] uppercase mb-1 flex items-center justify-between">
            <span>Projected Viscosity</span>
            <span className="text-[#A78BFA]">Day {horizon}</span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-[#A78BFA]">{finalPoint.viscosityCp.toLocaleString()} cP</span>
            <span className="text-[11px] text-[#E05252]">
              +{Math.round(finalPoint.viscosityCp - wellState.viscosityCp).toLocaleString()} cP
            </span>
          </div>
          <div className="text-[10px] text-[#737A84] mt-1">Crude stiffening</div>
        </div>

        <div className="bg-[#14171A] border border-[#24282E] rounded p-3">
          <div className="text-[10px] font-mono text-[#8E95A0] uppercase mb-1 flex items-center justify-between">
            <span>Projected Flowrate</span>
            <span className="text-[#38BDF8]">Day {horizon}</span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-[#38BDF8]">{finalPoint.productionBopd} BOPD</span>
            <span className="text-[11px] text-[#E6A23C]">
              {finalPoint.productionBopd - wellState.productionBOPD} BOPD
            </span>
          </div>
          <div className="text-[10px] text-[#737A84] mt-1">Gross production</div>
        </div>

        <div className="bg-[#14171A] border border-[#24282E] rounded p-3">
          <div className="text-[10px] font-mono text-[#8E95A0] uppercase mb-1 flex items-center justify-between">
            <span>Cut-off Status</span>
            <span className="text-[#39B86A]">Economic Limit</span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className={`text-base font-bold ${
              finalPoint.productionBopd >= wellState.productionCutoffBOPD ? 'text-[#39B86A]' : 'text-[#E05252]'
            }`}>
              {finalPoint.productionBopd >= wellState.productionCutoffBOPD ? 'Above Cut-off' : 'Below Cut-off'}
            </span>
            <span className="text-[11px] text-[#737A84]">{wellState.productionCutoffBOPD} BOPD</span>
          </div>
          <div className="text-[10px] text-[#737A84] mt-1">Stimulation threshold</div>
        </div>
      </div>

      {/* Main Grid: Forecast Charts (Temperature, Viscosity, Production) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Chart 1: Reservoir Temperature Forecast */}
        <div className="bg-[#14171A] border border-[#24282E] rounded p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#FF7600]" />
              <span className="text-xs font-semibold text-[#F0F2F5]">Reservoir Temperature</span>
            </div>
            <span className="text-[10px] font-mono text-[#8E95A0]">Walther Decay</span>
          </div>
          <EngineeringChart 
            data={tempChartData}
            primaryColor="#FF7600"
            unit="°C"
            height={140}
          />
          <div className="mt-2 text-[10px] text-[#737A84] font-mono">
            Model forecast: Post-steam dissipation gradually cools the pay matrix toward background (~48°C).
          </div>
        </div>

        {/* Chart 2: Viscosity Forecast */}
        <div className="bg-[#14171A] border border-[#24282E] rounded p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-xs font-semibold text-[#F0F2F5]">Crude Viscosity Surge</span>
            </div>
            <span className="text-[10px] font-mono text-[#8E95A0]">Exponential</span>
          </div>
          <EngineeringChart 
            data={viscChartData}
            primaryColor="#A78BFA"
            unit="cP"
            height={140}
          />
          <div className="mt-2 text-[10px] text-[#737A84] font-mono">
            Model forecast: As heat dissipates, heavy oil viscosity surges, escalating downstroke rod drag.
          </div>
        </div>

        {/* Chart 3: Gross Production Forecast */}
        <div className="bg-[#14171A] border border-[#24282E] rounded p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-xs font-semibold text-[#F0F2F5]">Production Flowrate</span>
            </div>
            <span className="text-[10px] font-mono text-[#8E95A0]">BOPD</span>
          </div>
          <EngineeringChart 
            data={prodChartData}
            primaryColor="#38BDF8"
            unit="BOPD"
            height={140}
          />
          <div className="mt-2 text-[10px] text-[#737A84] font-mono">
            Model forecast: Reduced fluid mobility limits valve filling and drops net displacement toward cut-off.
          </div>
        </div>
      </div>

      {/* Projected Day-by-Day Forecast Table */}
      <div className="bg-[#14171A] border border-[#24282E] rounded p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#24282E]">
          <span className="text-xs font-semibold text-[#F0F2F5]">
            Day-by-Day Forecast Schedule ({horizon} Days)
          </span>
          <span className="text-[10px] font-mono text-[#737A84]">
            Engineering Estimate Interval
          </span>
        </div>

        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[#24282E] text-[#737A84] text-[10px] uppercase">
                <th className="text-left py-1.5">Day</th>
                <th className="text-left py-1.5">Date</th>
                <th className="text-right py-1.5">Temp (°C)</th>
                <th className="text-right py-1.5">Viscosity (cP)</th>
                <th className="text-right py-1.5">Mobility Index</th>
                <th className="text-right py-1.5">Pump Eff (%)</th>
                <th className="text-right py-1.5">Production (BOPD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2228]">
              {forecastPoints.map((pt) => (
                <tr key={pt.day} className="hover:bg-[#16181D]">
                  <td className="py-1 text-[#8E95A0]">Day {pt.day}</td>
                  <td className="py-1 text-[#F0F2F5]">{pt.date}</td>
                  <td className="py-1 text-right text-[#FF7600] font-medium">{pt.tempC} ±{(pt.day * 0.12).toFixed(1)}</td>
                  <td className="py-1 text-right text-[#A78BFA]">{pt.viscosityCp.toLocaleString()}</td>
                  <td className="py-1 text-right text-[#8E95A0]">{pt.mobilityIndex}</td>
                  <td className="py-1 text-right text-[#39B86A]">{pt.efficiencyPct}%</td>
                  <td className="py-1 text-right text-[#38BDF8] font-bold">{pt.productionBopd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
