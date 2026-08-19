import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';

/**
 * ModeTabs — Square card tabs with icon + label for tools that have multiple sub-modes.
 * Selected tab gets a green checkmark badge (top-left) + bold label; unselected are grayed out.
 * Supports an optional crown icon (top-right) for premium/locked features.
 */
export default function ModeTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'border-emerald-500/80 bg-slate-900 text-white font-extrabold shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 font-medium hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {/* Green Checkmark Badge (top-left) */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </motion.div>
            )}

            {/* Optional Crown Icon (top-right) */}
            {tab.isPremium && (
              <div className="absolute top-2 right-2 text-amber-400" title="Premium Feature">
                <Crown className="w-4 h-4 fill-amber-400/20" />
              </div>
            )}

            {/* Tab Icon */}
            {IconComponent && (
              <IconComponent
                className={`w-6 h-6 mb-1 ${
                  isSelected ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
            )}

            {/* Tab Title */}
            <span className="text-xs tracking-tight">{tab.label}</span>

            {/* Optional Subtitle */}
            {tab.subtitle && (
              <span className="text-[10px] text-slate-500 font-normal">{tab.subtitle}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
