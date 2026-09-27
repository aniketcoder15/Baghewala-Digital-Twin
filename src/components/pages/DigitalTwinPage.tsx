import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Info, 
  Flame, 
  Layers, 
  Sliders
} from 'lucide-react';
import { useWell } from '../../context/WellContext';
import { useI18n } from '../../context/I18nContext';

interface DigitalTwinPageProps {
  onNavigateToSrp: () => void;
  onNavigateToCss: () => void;
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({
  onNavigateToSrp,
  onNavigateToCss,
}) => {
  const { selectedWellId, wellBaseline, activeParameters, wellState, isScenarioModified } = useWell();
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'lift' | 'steam'>('lift');

  // Thermal glow intensity calculation based on live reservoir temperature (35°C to 80°C range)
  const tempRatio = Math.max(0.18, Math.min(0.85, (wellState.reservoirTemperatureC - 35) / 45));
  const thermalOpacity = (0.18 + tempRatio * 0.40).toFixed(2);
  const thermalRadius = Math.round(140 + tempRatio * 100);

  // Stroke duration in seconds based on live active SPM
  const strokeCycleSec = Number((60 / Math.max(3, activeParameters.spm)).toFixed(2));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#1E293B] tracking-tight">
              {t('digitalTwin', 'Digital twin')}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] text-[#475569] border border-[#E2E8F0] shadow-xs font-semibold">
              {selectedWellId} {isScenarioModified ? `· ${t('scenarioChanges', 'Scenario changes')}` : `· ${t('currentOperatingState', 'Current operating state')}`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#475569]">{t('wellToSurfaceCond', 'Well-to-surface operating state')}</p>
            <span className="text-[#CBD5E1] text-xs">·</span>
            <span className="text-[10px] text-[#64748B] font-mono">{wellState.dataSource}</span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#FFFFFF] border border-[#CBD5E1] rounded p-0.5 text-xs shadow-xs">
            <button
              onClick={() => setViewMode('lift')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold cursor-pointer ${
                viewMode === 'lift' 
                  ? 'bg-[#F97316] text-white shadow-xs' 
                  : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              {t('artificialLiftWellbore', 'SRP lift cycle')}
            </button>
            <button
              onClick={() => setViewMode('steam')}
              className={`px-2.5 py-1 rounded transition-colors font-semibold flex items-center gap-1 cursor-pointer ${
                viewMode === 'steam' 
                  ? 'bg-[#F97316] text-white shadow-xs' 
                  : 'text-[#475569] hover:text-[#1E293B]'
              }`}
            >
              <Flame className="w-3 h-3" />
              {t('thermalSteamFront', 'Steam chamber')}
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded text-xs text-[#475569] hover:text-[#1E293B] shadow-xs cursor-pointer"
            title={isPlaying ? t('pause', 'Pause telemetry animation') : t('animate', 'Resume telemetry animation')}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#F97316]" /> : <Play className="w-3.5 h-3.5 text-[#0D9488]" />}
            <span className="font-mono text-[11px] font-semibold">{isPlaying ? t('online', 'Active') : t('pause', 'Paused')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2D Wellbore Schematic + Right Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: 2D Engineering Well Visualization (col-span-8) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3 relative flex flex-col overflow-hidden shadow-xs">
          {/* Top Bar inside diagram */}
          <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[#E2E8F0] mb-2 z-10 bg-[#FFFFFF]">
            <div className="flex items-center gap-3">
              <span className="text-[#1E293B] font-semibold font-mono text-[11px]">
                {t('wellboreSchematic', 'Wellbore cross-section schematic')}
              </span>
              <span className="text-[#64748B] font-mono text-[10px]">TVD: {wellBaseline.reservoir.depthM}m | SPM: {activeParameters.spm.toFixed(1)} | Stroke: {activeParameters.strokeLength}"</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#64748B] font-mono">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-0.5 bg-[#F97316]" /> {t('thermalDrainageZone', 'Thermal zone')} ({wellState.reservoirTemperatureC}°C)
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-0.5 bg-[#0D9488]" /> Fluid inflow
              </span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="relative w-full h-[540px] bg-[#F8FAFC] rounded border border-[#CBD5E1] overflow-hidden flex items-center justify-center">
            {/* Ambient thermal glow in reservoir depth scaling dynamically with live temperature */}
            <div 
              className="absolute bottom-2 left-0 right-0 h-44 pointer-events-none transition-all duration-700"
              style={{
                opacity: thermalOpacity,
                background: `radial-gradient(ellipse at 50% 80%, #F97316 0%, transparent 70%)`,
              }}
            />

            <svg 
              viewBox="0 0 760 620" 
              className="w-full h-full select-none"
            >
              <defs>
                {/* Geological Rock Pattern */}
                <pattern id="overburden-rock" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M0 10 L20 10 M10 0 L10 20" stroke="#E2E8F0" strokeWidth="0.8" />
                </pattern>
                
                {/* Reservoir Pay Zone Pattern */}
                <pattern id="sandstone-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1.2" fill="#F97316" opacity="0.35" />
                  <circle cx="12" cy="12" r="1.2" fill="#F59E0B" opacity="0.30" />
                </pattern>

                {/* Tubing Fluid Gradient */}
                <linearGradient id="crude-gradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#92400E" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                {/* Dynamic thermal steam gradient */}
                <radialGradient id="steam-heat-cloud" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity={thermalOpacity} />
                  <stop offset="60%" stopColor="#F97316" stopOpacity={Number(thermalOpacity) * 0.35} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0.0} />
                </radialGradient>
              </defs>

              {/* SECTION 1: GEOLOGICAL LAYERS */}
              {/* Surface Terrain */}
              <rect x="0" y="100" width="760" height="20" fill="#EFECE3" />
              <line x1="0" y1="100" x2="760" y2="100" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="24" y="94" fill="#64748B" fontSize="10" fontFamily="monospace">Surface elevation 0.0m</text>

              {/* Overburden Formations (Shale / Siltstone) */}
              <rect x="0" y="120" width="760" height="340" fill="url(#overburden-rock)" />
              <text x="24" y="240" fill="#64748B" fontSize="10" fontFamily="sans-serif">Overburden shale & carbonate</text>
              <text x="24" y="254" fill="#94A3B8" fontSize="9" fontFamily="monospace">TVD: 400m - 900m</text>

              {/* Reservoir Cap Rock Seal */}
              <rect x="0" y="460" width="760" height="15" fill="#E2E8F0" />
              <line x1="0" y1="460" x2="760" y2="460" stroke="#F97316" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
              <text x="24" y="472" fill="#0891B2" fontSize="9" fontFamily="monospace">Impermeable cap rock (1,120m)</text>

              {/* RESERVOIR PAY ZONE LAYER (Sandstone with Thermal Steam Chamber) */}
              <rect x="0" y="475" width="760" height="145" fill="#FFFBEB" />
              <rect x="0" y="475" width="760" height="145" fill="url(#sandstone-pattern)" />
              
              {/* Thermal heated bubble around wellbore */}
              <ellipse 
                cx="380" 
                cy="545" 
                rx={viewMode === 'steam' ? thermalRadius + 40 : thermalRadius} 
                ry="65" 
                fill="url(#steam-heat-cloud)" 
                className={isPlaying ? 'animate-pulse' : ''}
              />

              <text x="24" y="525" fill="#EA580C" fontSize="11" fontWeight="600" fontFamily="sans-serif">Baghewala sandstone pay zone</text>
              <text x="24" y="540" fill="#475569" fontSize="10" fontFamily="monospace">Temp: {wellState.reservoirTemperatureC}°C | Visc: {wellState.viscosityCp.toLocaleString()} cP</text>
              <text x="24" y="555" fill="#64748B" fontSize="9" fontFamily="monospace">Gross rate: {wellState.productionBOPD} BOPD</text>

              {/* SECTION 2: SURFACE PUMPING UNIT (API Beam Pumping Unit) */}
              <g transform="translate(240, 10)">
                <path d="M 120 90 L 140 38 L 145 38 L 165 90 Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.2" />
                <line x1="126" y1="65" x2="158" y2="65" stroke="#94A3B8" strokeWidth="1" />

                <circle cx="85" cy="72" r="16" fill="#FFFFFF" stroke="#F97316" strokeWidth="1.5" />
                <rect x="75" y="65" width="20" height="18" rx="2" fill="#F97316" opacity="0.9" />
                <line 
                  x1="85" 
                  y1="72" 
                  x2="115" 
                  y2="38" 
                  stroke="#475569" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />

                {/* Walking Beam */}
                <g 
                  className={isPlaying ? 'origin-[142px_38px] transition-transform' : ''}
                  style={{ 
                    transform: isPlaying ? 'rotate(-2.5deg)' : 'none',
                    transitionDuration: `${strokeCycleSec * 0.5}s`
                  }}
                >
                  <polygon points="50,34 210,34 205,42 55,42" fill="#334155" stroke="#F97316" strokeWidth="1" />
                  <circle cx="142" cy="38" r="4" fill="#F97316" />
                  
                  <path d="M 210 30 Q 235 38 232 68 L 222 68 Q 224 44 205 38 Z" fill="#F97316" />
                  <line x1="230" y1="68" x2="230" y2="92" stroke="#334155" strokeWidth="1.8" />
                </g>

                {/* Wellhead / Stuffing Box */}
                <g transform="translate(220, 75)">
                  <rect x="0" y="15" width="20" height="12" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                  <rect x="5" y="8" width="10" height="8" fill="#F97316" />
                  <rect x="3" y="1" width="14" height="4" fill="#334155" />
                  <path d="M 20 20 L 45 20 L 45 25" stroke="#64748B" strokeWidth="2.5" fill="none" />
                  <text x="50" y="22" fill="#0D9488" fontSize="9" fontFamily="monospace" fontWeight="600">To flowline ({wellState.productionBOPD} BOPD)</text>
                </g>
              </g>

              {/* SECTION 3: DOWNHOLE CASING & WELLBORE */}
              <rect x="360" y="100" width="40" height="480" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="360" y1="100" x2="360" y2="580" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="400" y1="100" x2="400" y2="580" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Inner Production Tubing */}
              <rect x="370" y="100" width="20" height="420" fill="url(#crude-gradient)" stroke="#64748B" strokeWidth="1" />

              {/* Crude oil movement dashes */}
              {isPlaying && (
                <g stroke="#0D9488" strokeWidth="1.5" strokeDasharray="5 10" opacity="0.9">
                  <line x1="375" y1="510" x2="375" y2="105" className="animate-pulse" />
                  <line x1="385" y1="510" x2="385" y2="105" className="animate-pulse" />
                </g>
              )}

              {/* Sucker Rod String */}
              <line 
                x1="380" 
                y1="90" 
                x2="380" 
                y2="505" 
                stroke="#0F172A" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
              />

              {/* Centralizers */}
              {[200, 310, 420].map((yGuide, idx) => (
                <g key={idx} transform={`translate(372, ${yGuide})`}>
                  <rect x="0" y="0" width="16" height="6" rx="2" fill="#F59E0B" opacity="0.95" />
                  <text x="24" y="5" fill="#64748B" fontSize="8" fontFamily="monospace">Guide #{idx + 1}</text>
                </g>
              ))}

              {/* SECTION 4: DOWNHOLE INSERT PUMP */}
              <g transform="translate(366, 500)">
                <rect x="0" y="0" width="28" height="35" rx="2" fill="#FFFFFF" stroke="#F97316" strokeWidth="1.5" />
                <circle cx="14" cy="12" r="3.5" fill="#F97316" />
                <path d="M 9 16 L 19 16" stroke="#334155" strokeWidth="1" />
                <circle cx="14" cy="26" r="3" fill="#0D9488" />
                <path d="M 9 30 L 19 30" stroke="#334155" strokeWidth="1" />

                <circle cx="14" cy="17" r="18" fill="none" stroke="#F97316" strokeWidth="0.8" strokeDasharray="2 2" />
                <text x="36" y="16" fill="#1E293B" fontSize="9" fontWeight="600" fontFamily="sans-serif">{t('downholePump', 'SRP insert pump')}</text>
                <text x="36" y="27" fill="#64748B" fontSize="8" fontFamily="monospace">Eff: {wellState.pumpEfficiencyPct}%</text>
              </g>

              {/* SECTION 5: CASING PERFORATIONS & INFLOW */}
              {[540, 550, 560, 570].map((yPerf, idx) => (
                <g key={idx}>
                  <line x1="360" y1={yPerf} x2="330" y2={yPerf + (idx % 2 === 0 ? -3 : 3)} stroke="#F97316" strokeWidth="1.5" />
                  <circle cx="330" cy={yPerf + (idx % 2 === 0 ? -3 : 3)} r="2" fill="#F97316" />
                  <line x1="400" y1={yPerf} x2="430" y2={yPerf + (idx % 2 === 0 ? 3 : -3)} stroke="#F97316" strokeWidth="1.5" />
                  <circle cx="430" cy={yPerf + (idx % 2 === 0 ? 3 : -3)} r="2" fill="#F97316" />

                  <polygon 
                    points={`345,${yPerf - 3} 355,${yPerf} 345,${yPerf + 3}`} 
                    fill="#0D9488" 
                    className={isPlaying ? 'animate-pulse' : ''} 
                  />
                  <polygon 
                    points={`415,${yPerf - 3} 405,${yPerf} 415,${yPerf + 3}`} 
                    fill="#0D9488" 
                    className={isPlaying ? 'animate-pulse' : ''} 
                  />
                </g>
              ))}

              {/* STEAM INJECTION PARTICLES / ARROWS */}
              <g opacity={viewMode === 'steam' ? 0.95 : 0.6}>
                <path d="M 370 545 Q 310 520 260 535" fill="none" stroke="#F97316" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 390 545 Q 450 520 500 535" fill="none" stroke="#F97316" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 370 560 Q 300 580 240 565" fill="none" stroke="#EA580C" strokeWidth="1.2" strokeDasharray="3 3" />
                <path d="M 390 560 Q 460 580 520 565" fill="none" stroke="#EA580C" strokeWidth="1.2" strokeDasharray="3 3" />

                <circle cx="280" cy="530" r="4" fill="#F97316" opacity="0.8" />
                <circle cx="480" cy="530" r="4" fill="#F97316" opacity="0.8" />
              </g>

              {/* DEPTH RULER */}
              <g transform="translate(680, 0)">
                <line x1="0" y1="100" x2="0" y2="580" stroke="#CBD5E1" strokeWidth="1" />
                {[
                  { y: 100, text: '0m' },
                  { y: 220, text: '400m' },
                  { y: 340, text: '800m' },
                  { y: 460, text: '1,120m' },
                  { y: 545, text: `${wellBaseline.reservoir.depthM}m Pay` },
                ].map((marker, idx) => (
                  <g key={idx}>
                    <line x1="-5" y1={marker.y} x2="5" y2={marker.y} stroke="#94A3B8" strokeWidth="1" />
                    <text x="10" y={marker.y + 3} fill="#64748B" fontSize="9" fontFamily="monospace">{marker.text}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* Bottom schematic quick legend */}
          <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-[#475569] pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <span>● {t('surfacePumpingUnit', 'Surface unit')}: API 456</span>
              <span>● {t('strokeLength', 'Stroke')}: {activeParameters.strokeLength}"</span>
              <span>● {t('pumpingSpeed', 'Speed')}: {activeParameters.spm.toFixed(1)} SPM</span>
              <span>● Tubing: 2-7/8" J-55</span>
            </div>
            <span className="text-[10px] text-[#64748B] font-mono">{t('currentOperatingState', 'Current operating state')}</span>
          </div>
        </div>

        {/* Right Side: CURRENT WELL STATE & TWIN INSIGHT (col-span-4) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-between">
          {/* Current well state card */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="text-xs font-semibold text-[#1E293B] tracking-wide">{t('currentOperatingState', 'Current well state')}</div>
                <div className="text-[10px] text-[#64748B] font-mono">{selectedWellId} {t('recentTelemetry', 'telemetry')}</div>
              </div>
              <div className="flex items-center gap-1.5 text-[#0D9488] text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                <span>{t('stable', 'Stable')}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('reservoirTemperature', 'Reservoir temperature')}</span>
                <span className="font-mono text-sm font-semibold text-[#F97316] tabular-nums">{wellState.reservoirTemperatureC} °C</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('pressure', 'Pressure')}</span>
                <span className="font-mono text-sm font-semibold text-[#1E293B] tabular-nums">{wellState.reservoirPressureBar} bar</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('viscosity', 'Oil viscosity')}</span>
                <span className="font-mono text-sm font-semibold text-[#B45309] tabular-nums">{wellState.viscosityCp.toLocaleString()} cP</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('pumpEfficiency', 'Pump efficiency')}</span>
                <span className="font-mono text-sm font-semibold text-[#1E293B] tabular-nums">{wellState.pumpEfficiencyPct} %</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('polishedRodLoad', 'Polished rod load')}</span>
                <span className="font-mono text-sm font-semibold text-[#F97316] tabular-nums">{wellState.rodLoadKN} kN ({wellState.rodLoadPct}%)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('oilProduction', 'Gross oil production')}</span>
                <span className="font-mono text-sm font-semibold text-[#0D9488] tabular-nums">{wellState.productionBOPD} BOPD</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-xs text-[#475569]">{t('statusCol', 'Status')}</span>
                <div className="flex items-center gap-1.5 text-[#0D9488] text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                  <span>{t('stable', 'Stable')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWIN INSIGHT CARD */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#E2E8F0]">
              <Info className="w-4 h-4 text-[#06B6D4]" />
              <div className="text-xs font-semibold text-[#1E293B] tracking-wide">{t('twinInsight', 'Twin insight')}</div>
            </div>
            
            <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded">
              {wellState.twinInsight}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={onNavigateToCss}
                className="px-2.5 py-1.5 bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] rounded text-[11px] text-[#F97316] font-semibold transition-colors text-center shadow-xs cursor-pointer"
              >
                {t('openCssOptimizer', 'CSS thermal plan')} →
              </button>
              <button
                onClick={onNavigateToSrp}
                className="px-2.5 py-1.5 bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] rounded text-[11px] text-[#0D9488] font-semibold transition-colors text-center shadow-xs cursor-pointer"
              >
                {t('openSrpOptimizer', 'SRP lift config')} →
              </button>
            </div>
          </div>

          {/* Downhole Hydraulic Balance Badge */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2.5 text-[11px] text-[#64748B] font-mono flex items-center justify-between">
            <span>Cycle duration: {strokeCycleSec}s / stroke</span>
            <span className="text-[#0D9488] font-semibold">● {t('stable', 'Balanced')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
