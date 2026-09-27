import React from 'react';

interface DynamometerCardProps {
  strokeLengthIn: number;
  rodLoadPct: number;
  viscosityCp: number;
  spm: number;
}

export const DynamometerCard: React.FC<DynamometerCardProps> = ({
  strokeLengthIn,
  rodLoadPct,
  viscosityCp,
  spm,
}) => {
  // Peak polished rod load (lbs) scaled from % rating (standard API 456 unit rated for ~26,000 lbs)
  const maxRatedLoad = 26000;
  const peakLoadLbs = Math.round((rodLoadPct / 100) * maxRatedLoad);
  const minLoadLbs = Math.round(peakLoadLbs * 0.38 - (viscosityCp / 8000) * 1200);

  // Surface dyno loop points: simulates heavy oil viscous drag loop
  // Position from 0 to strokeLengthIn
  // Downstroke has viscous compression resistance; upstroke has fluid load + viscous friction
  const pointsCount = 20;
  const surfacePoints: { x: number; y: number }[] = [];
  
  // Upstroke (left to right, high load)
  for (let i = 0; i <= pointsCount; i++) {
    const frac = i / pointsCount;
    const pos = frac * strokeLengthIn;
    // Load curve rises rapidly then levels off, with viscous hump
    const dynamicHump = Math.sin(frac * Math.PI) * (spm * 250);
    const load = minLoadLbs + (peakLoadLbs - minLoadLbs) * Math.pow(frac, 0.25) + dynamicHump;
    surfacePoints.push({ x: pos, y: load });
  }

  // Downstroke (right to left, lower load, delayed valve opening)
  for (let i = pointsCount; i >= 0; i--) {
    const frac = i / pointsCount;
    const pos = frac * strokeLengthIn;
    // In high viscosity, traveling valve closes late, causing rounded lower left corner
    const viscousLag = Math.sin((1 - frac) * Math.PI) * (viscosityCp / 10);
    const load = minLoadLbs + viscousLag;
    surfacePoints.push({ x: pos, y: load });
  }

  // Chart coordinates
  const svgWidth = 400;
  const svgHeight = 160;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const yMax = 28000;
  const yMin = 4000;

  const getX = (pos: number) => padLeft + (pos / strokeLengthIn) * plotW;
  const getY = (load: number) => padTop + plotH - ((load - yMin) / (yMax - yMin)) * plotH;

  const polyPoints = surfacePoints.map(p => `${getX(p.x)},${getY(p.y)}`).join(' ');

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-md p-3 shadow-xs">
      <div className="flex items-center justify-between text-[11px] mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[#1E293B] font-semibold">Polished Rod Dynamometer Card</span>
          <span className="text-[#64748B] font-mono text-[10px]">API Spec 11L</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-[#475569]">
          <span>Peak: <strong className="text-[#EA580C] font-semibold">{peakLoadLbs.toLocaleString()} lbs</strong></span>
          <span>Min: <strong className="text-[#1E293B] font-medium">{Math.max(2000, minLoadLbs).toLocaleString()} lbs</strong></span>
        </div>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block select-none">
        {/* Horizontal gridlines */}
        {[8000, 14000, 20000, 26000].map((val, idx) => (
          <g key={idx}>
            <line
              x1={padLeft}
              y1={getY(val)}
              x2={svgWidth - padRight}
              y2={getY(val)}
              stroke="#CBD5E1"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
            <text
              x={padLeft - 6}
              y={getY(val) + 3}
              fill="#64748B"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              {(val / 1000).toFixed(0)}k
            </text>
          </g>
        ))}

        {/* Vertical stroke gridlines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
          const pos = frac * strokeLengthIn;
          return (
            <g key={idx}>
              <line
                x1={getX(pos)}
                y1={padTop}
                x2={getX(pos)}
                y2={padTop + plotH}
                stroke="#CBD5E1"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <text
                x={getX(pos)}
                y={svgHeight - 6}
                fill="#64748B"
                fontSize="9"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {Math.round(pos)}"
              </text>
            </g>
          );
        })}

        {/* Dynamometer closed loop */}
        <polygon
          points={polyPoints}
          fill="rgba(249, 115, 22, 0.16)"
          stroke="#EA580C"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Directional markers */}
        <text
          x={getX(strokeLengthIn * 0.5)}
          y={getY(peakLoadLbs) - 5}
          fill="#EA580C"
          fontSize="9"
          textAnchor="middle"
          fontFamily="monospace"
          fontWeight="bold"
        >
          UPSTROKE →
        </text>
        <text
          x={getX(strokeLengthIn * 0.5)}
          y={getY(minLoadLbs) + 12}
          fill="#64748B"
          fontSize="9"
          textAnchor="middle"
          fontFamily="monospace"
        >
          ← DOWNSTROKE
        </text>
      </svg>
    </div>
  );
};
