import React, { useState, useRef, useEffect } from 'react';
import { TOOL_CATEGORIES } from '../data/toolsData';
import {
  Heart, ChevronDown, ChevronUp, Menu, X, Search,
  Files, Scissors, FileX, FileSpreadsheet, LayoutGrid, Scan,
  Minimize2, Wrench, FileText, Image, FileCode, Presentation,
  Table, Globe, FileImage, FileType, MonitorPlay, Grid,
  Archive, RotateCw, Hash, Stamp, Crop, Edit3,
  CheckSquare, Unlock, Lock, PenTool, EyeOff, Columns,
  Sparkles, Languages, FileCode2
} from 'lucide-react';

const ICON_MAP = {
  'merge-pdf': Files,
  'split-pdf': Scissors,
  'remove-pages': FileX,
  'extract-pages': FileSpreadsheet,
  'organize-pdf': LayoutGrid,
  'scan-to-pdf': Scan,
  'compress-pdf': Minimize2,
  'repair-pdf': Wrench,
  'ocr-pdf': FileText,
  'jpg-to-pdf': Image,
  'word-to-pdf': FileCode,
  'powerpoint-to-pdf': Presentation,
  'excel-to-pdf': Table,
  'html-to-pdf': Globe,
  'pdf-to-jpg': FileImage,
  'pdf-to-word': FileType,
  'pdf-to-powerpoint': MonitorPlay,
  'pdf-to-excel': Grid,
  'pdf-to-pdfa': Archive,
  'rotate-pdf': RotateCw,
  'add-page-numbers': Hash,
  'add-watermark': Stamp,
  'crop-pdf': Crop,
  'edit-pdf': Edit3,
  'pdf-forms': CheckSquare,
  'unlock-pdf': Unlock,
  'protect-pdf': Lock,
  'sign-pdf': PenTool,
  'redact-pdf': EyeOff,
  'compare-pdf': Columns,
  'ai-summarizer': Sparkles,
  'translate-pdf': Languages,
  'pdf-to-markdown': FileCode2,
};

const CATEGORY_ICON_COLORS = {
  organize: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  optimize: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'convert-to': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'convert-from': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  edit: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  security: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  intelligence: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  image: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function Navbar({ onHome, onSelectTool, searchQuery, setSearchQuery, activeTool }) {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [convertMenuOpen, setConvertMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMegaMenuOpen(false);
        setConvertMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolClick = (toolId) => {
    setMegaMenuOpen(false);
    setConvertMenuOpen(false);
    setMobileMenuOpen(false);
    if (onSelectTool) {
      onSelectTool(toolId);
    }
  };

  const getToolIcon = (toolId) => {
    const IconComp = ICON_MAP[toolId] || FileText;
    return <IconComp className="w-4 h-4" />;
  };

  const convertToCategory = TOOL_CATEGORIES.find(c => c.id === 'convert-to');
  const convertFromCategory = TOOL_CATEGORIES.find(c => c.id === 'convert-from');

  return (
    <header ref={navRef} className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo - I ❤️ PDF Style */}
          <div
            onClick={onHome}
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
          >
            <span className="text-2xl font-black text-white tracking-tighter">I</span>
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-md shadow-rose-600/40 group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">PDF</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 font-bold text-xs uppercase tracking-wider text-slate-300">
            <button
              onClick={() => handleToolClick('merge-pdf')}
              className="px-3.5 py-2 rounded-lg hover:text-rose-400 hover:bg-slate-900 transition"
            >
              MERGE PDF
            </button>

            <button
              onClick={() => handleToolClick('split-pdf')}
              className="px-3.5 py-2 rounded-lg hover:text-rose-400 hover:bg-slate-900 transition"
            >
              SPLIT PDF
            </button>

            <button
              onClick={() => handleToolClick('compress-pdf')}
              className="px-3.5 py-2 rounded-lg hover:text-rose-400 hover:bg-slate-900 transition"
            >
              COMPRESS PDF
            </button>

            {/* Convert PDF Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setConvertMenuOpen(!convertMenuOpen);
                  setMegaMenuOpen(false);
                }}
                className={`px-3.5 py-2 rounded-lg hover:text-rose-400 hover:bg-slate-900 transition flex items-center gap-1 ${
                  convertMenuOpen ? 'text-rose-400 bg-slate-900' : ''
                }`}
              >
                CONVERT PDF <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {convertMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 z-50">
                  {convertToCategory && (
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-400 uppercase mb-2">CONVERT TO PDF</h4>
                      <div className="space-y-1">
                        {convertToCategory.tools.map(tool => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-rose-400 transition"
                          >
                            <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {getToolIcon(tool.id)}
                            </span>
                            {tool.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {convertFromCategory && (
                    <div className="border-t border-slate-800 pt-3">
                      <h4 className="text-[11px] font-extrabold text-slate-400 uppercase mb-2">CONVERT FROM PDF</h4>
                      <div className="space-y-1">
                        {convertFromCategory.tools.map(tool => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-sky-400 transition"
                          >
                            <span className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {getToolIcon(tool.id)}
                            </span>
                            {tool.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ALL PDF TOOLS Mega Menu Button */}
            <button
              onClick={() => {
                setMegaMenuOpen(!megaMenuOpen);
                setConvertMenuOpen(false);
              }}
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1 font-extrabold ${
                megaMenuOpen
                  ? 'text-rose-500 bg-rose-500/10 border border-rose-500/30'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
            >
              ALL PDF TOOLS {megaMenuOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </nav>

          {/* Right Action Area (No Login / Register buttons) */}
          <div className="flex items-center gap-3">
            {!activeTool && (
              <div className="relative hidden sm:block w-48 xl:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* ALL PDF TOOLS MEGA MENU OVERLAY (7 COLUMNS MATCHING REFERENCE SCREENSHOT) */}
      {megaMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl py-8 px-4 sm:px-6 lg:px-8 max-h-[85vh] overflow-y-auto z-50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {TOOL_CATEGORIES.map((category) => {
              const categoryColor = CATEGORY_ICON_COLORS[category.id] || 'bg-slate-800 text-slate-300 border-slate-700';
              return (
                <div key={category.id} className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    {category.title}
                  </h3>
                  <ul className="space-y-2">
                    {category.tools.map((tool) => (
                      <li key={tool.id}>
                        <button
                          onClick={() => handleToolClick(tool.id)}
                          className="w-full text-left flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white group transition"
                        >
                          <span className={`p-1.5 rounded-lg border flex-shrink-0 group-hover:scale-110 transition-transform ${categoryColor}`}>
                            {getToolIcon(tool.id)}
                          </span>
                          <span className="truncate group-hover:text-rose-400 transition-colors">
                            {tool.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex gap-2">
            <button
              onClick={() => handleToolClick('merge-pdf')}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs text-center"
            >
              Merge PDF
            </button>
            <button
              onClick={() => handleToolClick('split-pdf')}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs text-center"
            >
              Split PDF
            </button>
            <button
              onClick={() => handleToolClick('compress-pdf')}
              className="flex-1 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs text-center"
            >
              Compress PDF
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {TOOL_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-2">
                <h4 className="text-xs font-bold text-rose-400 uppercase">{category.title}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {category.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-left text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
                    >
                      {getToolIcon(tool.id)}
                      <span className="truncate">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
