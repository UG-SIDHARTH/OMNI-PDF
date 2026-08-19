import React from 'react';
import { Plus } from 'lucide-react';

/**
 * AddItemButton — Red-outline, red-text "+ Add X" button for tools that support adding
 * multiple items (ranges, watermark layers, pages, images).
 */
export default function AddItemButton({ label = 'Add Item', onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-2xl border border-dashed border-rose-500/60 bg-rose-500/5 hover:bg-rose-500/10 active:scale-98 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition group ${className}`}
    >
      <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
      <span>{label}</span>
    </button>
  );
}
