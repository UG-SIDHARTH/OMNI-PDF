import React from 'react';
import { ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';

/**
 * NumericStepper — Bordered number input with up/down increment arrows,
 * reusable for page ranges, quality %, rotation degrees, etc.
 */
export default function NumericStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  label,
  suffix = ''
}) {
  const numVal = Number(value) || min;

  const handleIncrement = () => {
    if (numVal + step <= max) {
      onChange(numVal + step);
    }
  };

  const handleDecrement = () => {
    if (numVal - step >= min) {
      onChange(numVal - step);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-300">{label}</label>}
      <div className="flex items-center rounded-2xl bg-slate-900 border border-slate-800 p-1.5 focus-within:border-rose-500 transition">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={numVal <= min}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 text-slate-300 transition"
          title="Decrease"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-1 px-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-center bg-transparent text-white text-sm font-bold focus:outline-none"
          />
          {suffix && <span className="text-xs text-slate-400 font-semibold">{suffix}</span>}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={numVal >= max}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 text-slate-300 transition"
          title="Increase"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
