import React from 'react';
import { Sparkles, Clock, ShieldCheck, ArrowLeft, Layers, CheckCircle2 } from 'lucide-react';
import FileUploader from '../components/FileUploader';

export default function ComingSoonTool({ tool, onBack, onSelectTool }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Tools Grid
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
          <Clock className="w-4 h-4" /> Planned Module - Coming Soon
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          {tool.name}
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          {tool.description}
        </p>
      </div>

      {/* Preview Container */}
      <div className="space-y-8">
        <div className="opacity-75 pointer-events-none">
          <FileUploader
            accept={tool.accept || '.pdf'}
            onFilesSelected={() => {}}
            label={`Upload file for ${tool.name}`}
            description="Up to 50MB per file with 3-hour automatic deletion."
          />
        </div>

        {/* Feature Notice Card */}
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              {tool.name} is currently under active refinement
            </h3>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Our high-speed processing engine for {tool.name} is being scheduled for full deployment. In the meantime, try our fully active tools below!
            </p>
          </div>

          {/* Active Tools Shortcuts */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-4">
              Try Active Fully Functional Tools
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => onSelectTool('background-remover')}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 text-left transition group"
              >
                <span className="text-xs font-bold text-rose-400 block mb-1">AI Tool</span>
                <span className="text-sm font-bold text-white group-hover:text-rose-400 transition">Background Remover</span>
              </button>

              <button
                onClick={() => onSelectTool('merge-pdf')}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 text-left transition group"
              >
                <span className="text-xs font-bold text-rose-400 block mb-1">PDF Tool</span>
                <span className="text-sm font-bold text-white group-hover:text-rose-400 transition">Merge PDF</span>
              </button>

              <button
                onClick={() => onSelectTool('compress-pdf')}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 text-left transition group"
              >
                <span className="text-xs font-bold text-rose-400 block mb-1">PDF Tool</span>
                <span className="text-sm font-bold text-white group-hover:text-rose-400 transition">Compress PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
