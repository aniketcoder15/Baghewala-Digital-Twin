import React, { useState } from 'react';

interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface EngineeringChartProps {
  data: DataPoint[];
  primaryColor?: string;
  secondaryColor?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  unit?: string;
  height?: number;
  showSecondary?: boolean;
}

export const EngineeringChart: React.FC<EngineeringChartProps> = ({
  data,
  primaryColor = '#F97316',
  secondaryColor = '#06B6D4',
  primaryLabel = 'Current',
  secondaryLabel = 'Simulated',
  unit = '',
  height = 180,
  showSecondary = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="flex items-center justify-center text-xs text-[#64748B] bg-[#FFFFFF] rounded-md border border-[#E2E8F0]"
      >
        No telemetry data available
      </div>
    );
  }

  // Calculate range
  const allValues = data.flatMap(d => [d.value, ...(showSecondary && d.secondaryValue !== undefined ? [d.secondaryValue] : [])]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = (rawMax - rawMin) * 0.12 || 5;
  const minY = Math.floor(rawMin - padding);
  const maxY = Math.ceil(rawMax + padding);
  const yRange = maxY - minY || 1;

  // Chart layout dimensions
  const paddingLeft = 45;
  const paddingRight = 16;
  const paddingTop = 14;
  const paddingBottom = 26;
  const chartWidth = 560; // SVG coordinate width
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => paddingLeft + (index / (data.length - 1 || 1)) * plotWidth;
  const getY = (val: number) => paddingTop + plotHeight - ((val - minY) / yRange) * plotHeight;

  // Generate SVG paths
  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const primaryAreaPath = `M ${getX(0)},${getY(data[0].value)} ` +
    data.map((d, i) => `L ${getX(i)},${getY(d.value)}`).join(' ') +
    ` L ${getX(data.length - 1)},${paddingTop + plotHeight} L ${getX(0)},${paddingTop + plotHeight} Z`;

  const secondaryPoints = showSecondary 
    ? data.map((d, i) => `${getX(i)},${getY(d.secondaryValue ?? d.value)}`).join(' ') 
    : '';

  // Horizontal grid lines
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minY + (i / gridSteps) * yRange;
    const yPos = getY(val);
    return { val: Math.round(val), yPos };
  });

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#475569] mb-2 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="font-medium text-[#1E293B]">{primaryLabel}</span>
          </div>
          {showSecondary && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span className="font-medium text-[#1E293B]">{secondaryLabel}</span>
            </div>
          )}
        </div>
        {unit && <span className="text-[#64748B] font-mono text-[10px]">[{unit}]</span>}
      </div>

      {/* SVG Container */}
      <div className="relative bg-[#FFFFFF] border border-[#E2E8F0] rounded-md p-1 overflow-hidden shadow-xs">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto block"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-primary-${primaryColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={gl.yPos}
                x2={chartWidth - paddingRight}
                y2={gl.yPos}
                stroke="#E2E8F0"
                strokeDasharray="2 3"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={gl.yPos + 3.5}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {gl.val}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path
            d={primaryAreaPath}
            fill={`url(#grad-primary-${primaryColor.replace('#', '')})`}
          />

          {/* Primary Line */}
          <polyline
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={primaryPoints}
          />

          {/* Secondary Line */}
          {showSecondary && (
            <polyline
              fill="none"
              stroke={secondaryColor}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={secondaryPoints}
            />
          )}

          {/* Data Points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(d.value)}
                r={hoverIndex === i ? 4.5 : 2.5}
                fill="#FFFFFF"
                stroke={primaryColor}
                strokeWidth={hoverIndex === i ? 2.5 : 1.5}
              />
              {showSecondary && d.secondaryValue !== undefined && (
                <circle
                  cx={getX(i)}
                  cy={getY(d.secondaryValue)}
                  r={hoverIndex === i ? 4.5 : 2.5}
                  fill="#FFFFFF"
                  stroke={secondaryColor}
                  strokeWidth={hoverIndex === i ? 2.5 : 1.5}
                />
              )}
            </g>
          ))}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            // Show all if <= 8 items, else show alternate
            const showLabel = data.length <= 8 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 8}
                fill="#64748B"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {d.label}
              </text>
            );
          })}

          {/* Hover Crosshair & Trigger Rectangles */}
          {data.map((d, i) => {
            const x = getX(i);
            const w = plotWidth / data.length;
            return (
              <rect
                key={i}
                x={x - w / 2}
                y={paddingTop}
                width={w}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {hoverIndex !== null && data[hoverIndex] && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={paddingTop + plotHeight}
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeDasharray="2 2"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute top-3 right-3 bg-[#FFFFFF] border border-[#E2E8F0] px-2.5 py-1.5 rounded shadow-md text-[11px] pointer-events-none z-10"
          >
            <div className="text-[#64748B] font-mono text-[10px] mb-0.5">{data[hoverIndex].label}</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="text-[#1E293B] font-semibold">{data[hoverIndex].value} {unit}</span>
            </div>
            {showSecondary && data[hoverIndex].secondaryValue !== undefined && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span className="text-[#0891B2] font-semibold">{data[hoverIndex].secondaryValue} {unit}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
