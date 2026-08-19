import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';

/**
 * PrimaryActionButton — Full-width red button with a right-arrow icon,
 * label matching the tool's action (e.g. "Split PDF", "Merge PDF", "Compress PDF").
 */
export default function PrimaryActionButton({
  label,
  onClick,
  isProcessing = false,
  disabled = false,
  icon: IconComponent = ArrowRight,
  className = ''
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-98 cursor-pointer disabled:cursor-not-allowed ${className}`}
    >
      {isProcessing ? (
        <>
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          {IconComponent && <IconComponent className="w-5 h-5" />}
        </>
      )}
    </button>
  );
}
