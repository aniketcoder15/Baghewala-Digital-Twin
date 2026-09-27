import React, { useState, useEffect } from 'react';
import { Minus, Plus, Info } from 'lucide-react';

interface EngineeringInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (val: number) => void;
  tooltip?: string;
  description?: string;
  disabled?: boolean;
}

export const EngineeringInput: React.FC<EngineeringInputProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  tooltip,
  description,
  disabled = false,
}) => {
  // Local string state to allow natural typing without bouncing
  const [textVal, setTextVal] = useState<string>(value.toString());

  useEffect(() => {
    setTextVal(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextVal(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      // Clamped within range
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(textVal);
    if (isNaN(parsed) || parsed < min) {
      setTextVal(min.toString());
      onChange(min);
    } else if (parsed > max) {
      setTextVal(max.toString());
      onChange(max);
    } else {
      setTextVal(parsed.toString());
      onChange(parsed);
    }
  };

  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    const next = Math.max(min, Math.min(max, Number((value + delta).toFixed(2))));
    setTextVal(next.toString());
    onChange(next);
  };

  return (
    <div className="space-y-1.5 select-none">
      {/* Top Header: Label + Tooltip */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#475569]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#475569] font-medium">{label}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-[#64748B] hover:text-[#1E293B]">
              <Info className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-[#64748B]">
          Range: {min}–{max} {unit}
        </div>
      </div>

      {/* Engineering Numeric Box with [-] [+] buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleStep('down')}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label}`}
          className="w-8 h-8 rounded bg-[#FFFFFF] border border-[#CBD5E1] hover:border-[#F97316] active:bg-[#F8FAFC] text-[#475569] hover:text-[#F97316] disabled:opacity-40 disabled:hover:border-[#CBD5E1] flex items-center justify-center transition-colors shrink-0 shadow-xs"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Input box */}
        <div className="relative flex-1">
          <input
            type="number"
            value={textVal}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-label={`${label} in ${unit}`}
            className="w-full bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#F97316] rounded px-3 py-1 text-sm font-mono font-semibold text-[#1E293B] outline-none transition-colors pr-10 text-left tabular-nums shadow-xs"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#64748B] pointer-events-none">
            {unit}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleStep('up')}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 rounded bg-[#FFFFFF] border border-[#CBD5E1] hover:border-[#F97316] active:bg-[#F8FAFC] text-[#475569] hover:text-[#F97316] disabled:opacity-40 disabled:hover:border-[#CBD5E1] flex items-center justify-center transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Range Slider Underneath */}
      <div className="pt-0.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setTextVal(v.toString());
            onChange(v);
          }}
          aria-label={`${label} slider`}
          className="w-full accent-[#F97316] h-1.5 bg-[#E2E8F0] rounded appearance-none cursor-pointer border border-[#CBD5E1]/40"
        />
      </div>

      {description && (
        <div className="text-[10px] text-[#64748B] font-sans">
          {description}
        </div>
      )}
    </div>
  );
};
