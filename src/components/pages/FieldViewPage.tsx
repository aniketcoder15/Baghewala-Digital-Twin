import React from 'react';
import { 
  MapPin, 
  Flame, 
  Droplets, 
  Activity, 
  Layers, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { WellId } from '../../types';
import { useWell } from '../../context/WellContext';
import { WELL_LOCATIONS } from '../../data/wellsData';

export const FieldViewPage: React.FC = () => {
  const { selectedWellId, setSelectedWellId, allWells, wellState } = useWell();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#24282E]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#F0F2F5] tracking-tight">Baghewala Field Map</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16181D] text-[#8E95A0] border border-[#2B313A]">
              Selected: {selectedWellId}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#8E95A0]">Bikaner-Nagaur Basin, Western Rajasthan · Active Field Well Locations</p>
            <span className="text-[#636A74] text-xs">·</span>
            <span className="text-[10px] text-[#737A84] font-mono">Baghewala Field — Active Well Coordinates</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono text-[#8E95A0]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7600]" /> Active Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" /> Production Well
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#2B313A]" /> Central Battery
          </span>
        </div>
      </div>

      {/* GIS Map & Selected Well Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Interactive Schematic GIS Map (col-span-8) */}
        <div className="lg:col-span-8 bg-[#14171A] border border-[#24282E] rounded p-3 relative flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#24282E] text-xs font-mono text-[#8E95A0]">
            <span>Field Area: 4.8 km² Grid</span>
            <span className="text-[10px] text-[#737A84]">Click well marker to activate throughout application</span>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-[380px] bg-[#0E1012] border border-[#24282E] rounded overflow-hidden select-none">
            <svg viewBox="0 0 800 500" className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A1D23" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Background Grid & Contour Lines */}
              <rect width="800" height="500" fill="#0E1012" />
              <rect width="800" height="500" fill="url(#grid)" />

              {/* Desert Topography Contours */}
              <path d="M 50 120 Q 250 80 450 140 T 750 90" fill="none" stroke="#181B21" strokeWidth="1.5" />
              <path d="M 30 280 Q 200 320 400 270 T 770 310" fill="none" stroke="#181B21" strokeWidth="1.5" />
              <path d="M 60 420 Q 300 460 550 410 T 780 440" fill="none" stroke="#181B21" strokeWidth="1.5" />

              {/* Central Steam Boiler Pad & Tank Battery (CTB) */}
              <g transform="translate(380, 230)">
                <rect x="-30" y="-20" width="60" height="40" rx="4" fill="#1C212B" stroke="#4F5866" strokeWidth="1.5" />
                <text x="0" y="-26" textAnchor="middle" fill="#8E95A0" fontSize="10" fontFamily="monospace" fontWeight="bold">Central Tank Battery (CTB)</text>
                <text x="0" y="5" textAnchor="middle" fill="#FF7600" fontSize="9" fontFamily="monospace">Steam Pad #1</text>
              </g>

              {/* Surface Gathering Lines (Pipelines from Wells to CTB) */}
              {WELL_LOCATIONS.map((loc) => {
                const wx = (loc.xPct / 100) * 800;
                const wy = (loc.yPct / 100) * 500;
                return (
                  <g key={`pipe-${loc.id}`}>
                    {/* Heated Oil Gathering Line */}
                    <line 
                      x1={wx} 
                      y1={wy} 
                      x2={380} 
                      y2={230} 
                      stroke="#2B313A" 
                      strokeWidth="2" 
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              })}

              {/* Interactive Well Markers */}
              {WELL_LOCATIONS.map((loc) => {
                const isSelected = selectedWellId === loc.id;
                const wx = (loc.xPct / 100) * 800;
                const wy = (loc.yPct / 100) * 500;
                const baseline = allWells[loc.id];

                return (
                  <g 
                    key={loc.id} 
                    transform={`translate(${wx}, ${wy})`}
                    onClick={() => setSelectedWellId(loc.id)}
                    className="cursor-pointer group"
                  >
                    {/* Selected Halo Pulse */}
                    {isSelected && (
                      <circle cx="0" cy="0" r="24" fill="#FF7600" opacity="0.15" />
                    )}

                    {/* Outer Circle */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r={isSelected ? '14' : '10'} 
                      fill={isSelected ? '#FF7600' : '#181B20'} 
                      stroke={isSelected ? '#F0F2F5' : '#38BDF8'} 
                      strokeWidth={isSelected ? '2' : '1.5'} 
                      className="transition-all duration-150"
                    />

                    {/* Wellhead Center Dot */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="3.5" 
                      fill={isSelected ? '#000000' : '#38BDF8'} 
                    />

                    {/* Well Name Tag */}
                    <rect 
                      x="-32" 
                      y={isSelected ? '-32' : '-26'} 
                      width="64" 
                      height="16" 
                      rx="3" 
                      fill="#111316" 
                      stroke={isSelected ? '#FF7600' : '#2B313A'} 
                      strokeWidth="1" 
                    />
                    <text 
                      x="0" 
                      y={isSelected ? '-20' : '-14'} 
                      textAnchor="middle" 
                      fill={isSelected ? '#FF7600' : '#F0F2F5'} 
                      fontSize="9" 
                      fontFamily="monospace" 
                      fontWeight="bold"
                    >
                      {loc.id}
                    </text>

                    {/* Production Rate Pill */}
                    <text 
                      x="0" 
                      y="26" 
                      textAnchor="middle" 
                      fill="#8E95A0" 
                      fontSize="8" 
                      fontFamily="monospace"
                    >
                      {baseline ? `${baseline.historical[baseline.historical.length - 1].productionBopd} BOPD` : ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-[#737A84] font-mono pt-1 border-t border-[#24282E]">
            <span>Coordinate System: UTM Zone 43N (Illustrative relative grid)</span>
            <span className="text-[#39B86A]">All 4 wells connected to central SCADA model</span>
          </div>
        </div>

        {/* Well Cards Summary (col-span-4) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-semibold text-[#F0F2F5] pb-1 border-b border-[#24282E] flex items-center justify-between">
            <span>Well Telemetry Cards</span>
            <span className="text-[10px] text-[#737A84] font-mono">Click card to select</span>
          </div>

          {WELL_LOCATIONS.map((loc) => {
            const isSelected = selectedWellId === loc.id;
            const well = allWells[loc.id];
            const latest = well ? well.historical[well.historical.length - 1] : null;

            return (
              <div
                key={loc.id}
                onClick={() => setSelectedWellId(loc.id)}
                className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-[#181B20] border-[#FF7600] shadow-md' 
                    : 'bg-[#14171A] border-[#24282E] hover:border-[#333842]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#F0F2F5] font-mono">{loc.id}</span>
                    <span className="text-[10px] text-[#8E95A0]">({loc.name})</span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FF7600] text-black font-semibold">
                      Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-[#8E95A0] mt-1">
                  <div>
                    <span className="text-[9px] block text-[#636A74]">Production</span>
                    <span className="text-[#38BDF8] font-bold">{latest ? latest.productionBopd : '--'} BOPD</span>
                  </div>
                  <div>
                    <span className="text-[9px] block text-[#636A74]">Temp</span>
                    <span className="text-[#FF7600] font-bold">{latest ? latest.reservoirTempC : '--'} °C</span>
                  </div>
                  <div>
                    <span className="text-[9px] block text-[#636A74]">Viscosity</span>
                    <span className="text-[#A78BFA] font-bold">{latest ? `${latest.viscosityCp.toLocaleString()} cP` : '--'}</span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#1E2228] text-[10px] text-[#737A84] font-mono flex justify-between">
                  <span>Cycle #{loc.cssCycle}</span>
                  <span className="truncate max-w-[150px]">{loc.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
