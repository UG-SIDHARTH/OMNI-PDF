import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

/**
 * SelectableCard — For binary or multi-choice options (orientation, range mode, presets).
 * Selected = red border + red text/icon; unselected = gray border.
 * Supports an optional sparkle icon for AI-assisted modes.
 */
export default function SelectableCard({
  isSelected,
  onClick,
  title,
  subtitle,
  icon: IconComponent,
  isAi = false,
  className = ''
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
          : 'border-slate-800 bg-slate-900/60 text-slate-400 font-medium hover:border-slate-700 hover:text-slate-200'
      } ${className}`}
    >
      {/* Optional Sparkle Icon for AI modes */}
      {isAi && (
        <div className="absolute top-2 right-2 text-amber-400 animate-pulse" title="AI-Assisted">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Card Icon */}
      {IconComponent && <IconComponent className={`w-5 h-5 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />}

      {/* Card Title */}
      <span className="text-xs font-semibold">{title}</span>

      {/* Optional Subtitle */}
      {subtitle && <span className="text-[10px] text-slate-500">{subtitle}</span>}
    </button>
  );
}
