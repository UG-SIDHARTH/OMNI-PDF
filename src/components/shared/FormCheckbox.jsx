import React from 'react';

/**
 * FormCheckbox — Standard checkbox pattern for binary settings
 * (e.g. "Merge all ranges/files into one output").
 */
export default function FormCheckbox({ label, checked, onChange, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-950 cursor-pointer"
      />
      <div className="flex-1">
        <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
          {label}
        </span>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}
