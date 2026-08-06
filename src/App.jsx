import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ToolGrid from './components/ToolGrid';
import BackgroundRemover from './tools/BackgroundRemover';
import MergePdf from './tools/MergePdf';
import CompressPdf from './tools/CompressPdf';
import UniversalToolEngine from './tools/UniversalToolEngine';
import { TOOL_CATEGORIES } from './data/toolsData';
import { ShieldCheck, Heart, Lock, Clock, Zap, RefreshCw } from 'lucide-react';

// Error Boundary Component to guarantee no black screen ever occurs
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6 text-center">
          <div className="glass-panel p-8 rounded-3xl max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-rose-500">Something went wrong</h2>
            <p className="text-sm text-slate-300">
              An unexpected error occurred while rendering the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onReset) this.props.onReset();
                window.location.href = '/';
              }}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Return to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeToolId, setActiveToolId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find active tool metadata object
  const allTools = TOOL_CATEGORIES.flatMap(c => c.tools);
  const activeTool = allTools.find(t => t.id === activeToolId);

  const handleSelectTool = (toolId) => {
    setActiveToolId(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setActiveToolId(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary onReset={handleGoHome}>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white">
        {/* Navbar */}
        <Navbar
          onHome={handleGoHome}
          onSelectTool={handleSelectTool}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTool={activeToolId}
        />

        {/* Main Content Workspace */}
        <main className="flex-1">
          {!activeToolId ? (
            <ToolGrid
              searchQuery={searchQuery}
              onSelectTool={handleSelectTool}
            />
          ) : activeToolId === 'background-remover' ? (
            <BackgroundRemover />
          ) : activeToolId === 'merge-pdf' ? (
            <MergePdf />
          ) : activeToolId === 'compress-pdf' ? (
            <CompressPdf />
          ) : (
            <UniversalToolEngine
              tool={activeTool || { id: activeToolId, name: activeToolId, description: 'Process PDF file' }}
              onBack={handleGoHome}
            />
          )}
        </main>

        {/* Security Features Banner */}
        {!activeToolId && (
          <section className="border-t border-slate-800/80 bg-slate-900/50 py-12 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">3-Hour Auto Cleanup</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every uploaded file and output is permanently wiped after 3 hours via server worker tasks.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Strict User Isolation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Files are bound to unique HTTP-only session cookies and stored in random UUID paths.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Magic Byte Verification</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deep header buffer analysis prevents spoofed extensions or malicious file uploads.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 OmniPDF Suite. Privacy First PDF & Image Processing.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-white cursor-pointer" onClick={handleGoHome}>All Tools</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer" onClick={() => handleSelectTool('background-remover')}>Background Remover</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer" onClick={() => handleSelectTool('merge-pdf')}>Merge PDF</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer" onClick={() => handleSelectTool('compress-pdf')}>Compress PDF</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
