import React from 'react';
import { Trash2 } from 'lucide-react';

/**
 * RangeContainer — Dashed-border container labeled "Range 1", "Range 2", etc.
 * wrapping relevant thumbnail cards for range-based PDF grouping tools (Split PDF).
 */
export default function RangeContainer({ rangeIndex, title, onRemove, children, pageCountInfo }) {
  return (
    <div className="p-4 rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 space-y-3 relative group hover:border-slate-600 transition">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
            Range {rangeIndex + 1}
          </span>
          {title && <span className="text-xs font-semibold text-slate-300">{title}</span>}
        </div>

        <div className="flex items-center gap-3">
          {pageCountInfo && <span className="text-xs text-slate-400 font-medium">{pageCountInfo}</span>}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-lg hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition"
              title="Remove Range"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}
