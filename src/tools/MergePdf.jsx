import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import { apiFetch } from '../utils/apiClient';
import { Files, ArrowUp, ArrowDown, Trash2, Download, RefreshCw, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function MergePdf() {
  const [fileList, setFileList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFilesSelected = (newFiles) => {
    setErrorMsg(null);
    setFileList((prev) => [...prev, ...newFiles]);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setFileList((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index) => {
    if (index === fileList.length - 1) return;
    setFileList((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeFile = (index) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (fileList.length < 2) {
      setErrorMsg('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Step 1: Upload files to backend
      const formData = new FormData();
      fileList.forEach((file) => formData.append('files', file));

      const uploadRes = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json();
        throw new Error(errJson.error || 'Failed to upload PDF files.');
      }

      const uploadData = await uploadRes.json();
      const uploadedFileIds = uploadData.files.map((f) => f.fileId);

      // Step 2: Merge uploaded PDFs
      const mergeRes = await apiFetch('/api/pdf/merge', {
        method: 'POST',
        body: JSON.stringify({
          fileIds: uploadedFileIds,
          outputFilename: `Merged_${fileList.length}_PDFs.pdf`
        }),
      });

      if (!mergeRes.ok) {
        const errJson = await mergeRes.json();
        throw new Error(errJson.error || 'Failed to merge PDF files.');
      }

      const mergeResult = await mergeRes.json();
      setResultData(mergeResult);
      setIsProcessing(false);
    } catch (err) {
      console.error('Merge error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred while merging PDFs.');
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFileList([]);
    setResultData(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
          <Files className="w-4 h-4" /> Multi-Document PDF Combiner
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Merge PDF Files
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Combine multiple PDF documents into a single unified PDF file in your preferred order.
        </p>
      </div>

      {!resultData ? (
        <div className="space-y-6">
          <FileUploader
            accept=".pdf"
            multiple={true}
            onFilesSelected={handleFilesSelected}
            label={fileList.length > 0 ? "Add more PDF files" : "Drop PDF files here to merge"}
            description="Supports up to 50MB per PDF file."
          />

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected File List */}
          {fileList.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  PDF Queue ({fileList.length} files)
                </h3>
                <button
                  onClick={() => setFileList([])}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3">
                {fileList.map((file, idx) => (
                  <div
                    key={`${file.name}_${idx}`}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 group hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === fileList.length - 1}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition"
                        title="Remove File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Merge Action Trigger */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  onClick={handleMerge}
                  disabled={isProcessing || fileList.length < 2}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Merging PDFs...
                    </>
                  ) : (
                    <>
                      <Files className="w-5 h-5" />
                      Merge {fileList.length} PDFs Now
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
            <h2 className="text-2xl font-extrabold text-white mb-2">PDFs Merged Successfully!</h2>
            <p className="text-sm text-slate-400">
              Merged {fileList.length} files into <strong>{resultData.originalName}</strong> ({resultData.totalPages} total pages, {(resultData.size / (1024 * 1024)).toFixed(2)} MB).
            </p>
          </div>

          <div className="flex justify-center">
            <CountdownTimer expiresAt={resultData.expiresAt} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href={`/api/download/${resultData.fileId}`}
              download={resultData.originalName}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center gap-2 transition"
            >
              <Download className="w-5 h-5" /> Download Merged PDF
            </a>

            <button
              onClick={resetAll}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Merge Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
