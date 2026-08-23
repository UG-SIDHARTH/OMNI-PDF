import React, { useState, useEffect } from 'react';
import {
  X, Monitor, Smartphone, Download, ShieldCheck, Zap,
  CheckCircle2, Sparkles, Laptop, Globe, ArrowRight, ExternalLink
} from 'lucide-react';

export default function DownloadAppModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('windows');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on your device, click the "Install" or "Add to Home screen" icon in your browser URL bar.');
    }
  };

  const GITHUB_RELEASE_URL = 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/latest';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Modal Box */}
      <div className="relative w-full max-w-3xl glass-panel bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Download OmniPDF Apps
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
                  v0.3.5 Pro
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                100% Offline Processing • Maximum Privacy • Zero Cloud Uploads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/70 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'windows'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows Desktop</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'android'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android App</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === 'pwa'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Web App (PWA)</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'windows' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">OmniPDF for Windows (x64)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Standalone .exe
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Includes embedded high-speed offline Node processing engine for all 30+ tools.
                  </p>
                </div>

                <a
                  href={GITHUB_RELEASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 hover:scale-[1.02] transition flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download for Windows (.exe)
                </a>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <Zap className="w-4 h-4" /> 100% Offline Engine
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Merge, compress, and convert gigabytes of documents locally with zero network latency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Zero File Uploads
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Your sensitive PDFs never leave your hard drive. Complete enterprise-grade air-gapped security.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Sparkles className="w-4 h-4" /> AI Acceleration
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Hardware-accelerated AI background removal and OCR running directly on your GPU.
                  </p>
                </div>
              </div>

              {/* System Specs */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>System Requirements: Windows 10 / 11 (64-bit)</span>
                <span className="font-semibold text-slate-300">Build: v0.3.0 Release</span>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/30 via-slate-900 to-slate-900 border border-sky-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">OmniPDF for Android</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      Capacitor Native APK
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Touch-optimized UI with camera scan-to-PDF, offline preview, and document management.
                  </p>
                </div>

                <a
                  href={GITHUB_RELEASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-sky-600/30 hover:scale-[1.02] transition flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download Android APK
                </a>
              </div>

              {/* Android Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold">
                    <Smartphone className="w-4 h-4" /> Native Camera Scanner
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Snap physical documents directly using your phone's camera and convert to searchable PDF immediately.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Zap className="w-4 h-4" /> Mobile Touch Gestures
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Reorder, rotate, and delete pages seamlessly with smooth drag-and-drop mobile touch controls.
                  </p>
                </div>
              </div>

              {/* Android Specs */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Requires: Android 7.0 (Nougat) or higher</span>
                <span className="font-semibold text-slate-300">Package: com.omnipdf.app</span>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">Instant Web App Installation</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      PWA Universal
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Install OmniPDF directly into your OS without downloading any heavy installation files.
                  </p>
                </div>

                <button
                  onClick={handleInstallPWA}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  {isInstalled ? 'Already Installed' : 'Install to Device'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs text-slate-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Compatible with all modern browsers:
                </h4>
                <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
                  <li><strong>Chrome / Edge / Brave:</strong> Click the install icon in the address bar or use the button above.</li>
                  <li><strong>Safari (iOS / macOS):</strong> Tap the "Share" button and select "Add to Home Screen".</li>
                  <li><strong>Android Browsers:</strong> Tap the browser menu (⋮) and select "Install app".</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Open Source & Free Forever</span>
          </div>

          <a
            href={GITHUB_RELEASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition"
          >
            View Latest GitHub Releases <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
