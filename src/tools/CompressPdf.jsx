import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import { apiFetch, downloadFile } from '../utils/apiClient';
import { Minimize2, Download, RefreshCw, AlertCircle, CheckCircle2, Sliders, TrendingDown } from 'lucide-react';

export default function CompressPdf() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    setSelectedFile(files[0]);
    setResultData(null);
    setErrorMsg(null);
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append('files', selectedFile);

      const uploadRes = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json();
        throw new Error(errJson.error || 'Failed to upload PDF file.');
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData.files[0].fileId;

      // Step 2: Compress PDF
      const compressRes = await apiFetch('/api/pdf/compress', {
        method: 'POST',
        body: JSON.stringify({ fileId, level: compressionLevel }),
      });

      if (!compressRes.ok) {
        const errJson = await compressRes.json();
        throw new Error(errJson.error || 'Failed to compress PDF file.');
      }

      const compressResult = await compressRes.json();
      setResultData(compressResult);
      setIsProcessing(false);
    } catch (err) {
      console.error('Compress error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during compression.');
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setResultData(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
          <Minimize2 className="w-4 h-4" /> Smart File Compression
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Compress PDF File
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Reduce PDF file size while keeping visual quality high for easy sharing and email attachments.
        </p>
      </div>

      {!resultData ? (
        <div className="space-y-6">
          {!selectedFile ? (
            <FileUploader
              accept=".pdf"
              onFilesSelected={handleFileSelect}
              label="Drop PDF file to compress"
              description="Supports files up to 50MB."
            />
          ) : (
            <div className="glass-panel p-6 rounded-3xl space-y-6">
              {/* Selected File Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">Original Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={resetAll}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                >
                  Change File
                </button>
              </div>

              {/* Compression Level Selector */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-rose-400" /> Select Compression Level
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'recommended',
                      title: 'Recommended',
                      desc: 'Good quality, strong compression',
                      badge: 'Popular'
                    },
                    {
                      id: 'extreme',
                      title: 'Extreme Compression',
                      desc: 'Less quality, high compression',
                      badge: 'Smallest File'
                    },
                    {
                      id: 'less',
                      title: 'Less Compression',
                      desc: 'High quality, lower compression',
                      badge: 'Highest Quality'
                    }
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCompressionLevel(level.id)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                        compressionLevel === level.id
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-semibold text-rose-400 block mb-1">{level.badge}</span>
                        <h4 className="text-sm font-bold text-white mb-1">{level.title}</h4>
                        <p className="text-xs text-slate-400">{level.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Compress Action Trigger */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Compressing PDF...
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-5 h-5" />
                      Compress PDF Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">PDF Compressed Successfully!</h2>
            <p className="text-sm text-slate-400">
              Your PDF is now ready for download with reduced file size.
            </p>
          </div>

          {/* Size Savings Metric Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-md mx-auto grid grid-cols-2 gap-4 items-center">
            <div className="text-left border-r border-slate-800 pr-4">
              <span className="text-xs text-slate-400 block mb-1">Original Size</span>
              <span className="text-lg font-bold text-slate-300 line-through">
                {(resultData.originalSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="text-left pl-2">
              <span className="text-xs text-slate-400 block mb-1">Compressed Size</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {(resultData.compressedSize / (1024 * 1024)).toFixed(2)} MB
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -{resultData.savingsPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <CountdownTimer expiresAt={resultData.expiresAt} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => downloadFile(resultData.fileId, resultData.originalName)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center gap-2 transition"
            >
              <Download className="w-5 h-5" /> Download Compressed PDF
            </button>

            <button
              onClick={resetAll}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Compress Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
