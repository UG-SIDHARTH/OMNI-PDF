import React from 'react';
import { TOOL_CATEGORIES } from '../data/toolsData';
import * as Icons from 'lucide-react';

export default function ToolGrid({ searchQuery, onSelectTool }) {

  // Dynamic Lucide Icon Resolver
  const renderIcon = (iconName, className = "w-6 h-6") => {
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent className={className} />;
  };

  // Filter tools based on search query
  const filteredCategories = TOOL_CATEGORIES.map(category => {
    const matchingTools = category.tools.filter(tool => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        category.title.toLowerCase().includes(q)
      );
    });

    return {
      ...category,
      tools: matchingTools
    };
  }).filter(category => category.tools.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wide uppercase">
          <Icons.ShieldCheck className="w-4 h-4" /> Privacy-First PDF & Image Suite
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
          Every tool you need to work with <span className="bg-gradient-to-r from-rose-500 via-amber-400 to-rose-400 bg-clip-text text-transparent">PDFs & Images</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400">
          Fast, secure, and easy to use. Files are encrypted in transit and automatically deleted 3 hours after upload.
        </p>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center">
          <Icons.SearchX className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No tools matched "{searchQuery}"</h3>
          <p className="text-sm text-slate-400">Try searching for "Merge", "Compress", "Background", or "Convert".</p>
        </div>
      ) : (
        filteredCategories.map((category) => (
          <section key={category.id} className="space-y-4">
            
            {/* Category Title Header */}
            <div className="border-b border-slate-800/80 pb-3 flex items-baseline justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {category.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{category.description}</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                {category.tools.length} tools
              </span>
            </div>

            {/* Category Tool Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="glass-card p-5 rounded-2xl cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Glowing hover accent */}
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/25 transition-all" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:text-rose-300 transition-transform">
                        {renderIcon(tool.icon)}
                      </div>

                      {/* Status Badges */}
                      {tool.isWorking !== false ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          {tool.badge || 'Ready'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Coming Soon
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors flex items-center gap-2">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200 transition">
                    <span>{tool.isWorking !== false ? 'Launch Tool' : 'Preview Module'}</span>
                    <Icons.ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

          </section>
        ))
      )}
    </div>
  );
}
