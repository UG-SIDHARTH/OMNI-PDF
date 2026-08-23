import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import FormCheckbox from '../components/shared/FormCheckbox';
import { apiFetch, downloadFile } from '../utils/apiClient';
import { saveFileUniversal } from '../utils/fileDownloader';
import { PDFDocument } from 'pdf-lib';
import { Files, ArrowUp, ArrowDown, Trash2, Download, RefreshCw, AlertCircle, FileText, CheckCircle2, Plus } from 'lucide-react';

export default function MergePdf() {
  const [fileList, setFileList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [outlineBookmarks, setOutlineBookmarks] = useState(true);

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
      // 1. Client-Side High-Speed PDF Merge via pdf-lib
      const mergedPdf = await PDFDocument.create();

      for (const file of fileList) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const outputFilename = `Merged_${fileList.length}_PDFs.pdf`;
      const blobUrl = URL.createObjectURL(blob);

      const localResult = {
        blob,
        blobUrl,
        originalName: outputFilename,
        size: mergedPdfBytes.length,
        totalPages: mergedPdf.getPageCount(),
        expiresAt: null
      };

      // 2. Optional background upload for server session persistence (non-blocking)
      try {
        const formData = new FormData();
        formData.append('files', new File([blob], outputFilename, { type: 'application/pdf' }));
        const uploadRes = await apiFetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          if (uploadJson.files && uploadJson.files[0]) {
            localResult.fileId = uploadJson.files[0].fileId;
            localResult.expiresAt = uploadJson.files[0].expiresAt;
          }
        }
      } catch (uploadErr) {
        console.warn('Backend server offline, continuing with 100% offline client merge:', uploadErr);
      }

      setResultData(localResult);
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

  const handleDownload = () => {
    if (!resultData) return;
    if (resultData.blob || resultData.blobUrl) {
      saveFileUniversal({
        blob: resultData.blob,
        blobUrl: resultData.blobUrl,
        filename: resultData.originalName || 'Merged_Documents.pdf',
        mimeType: 'application/pdf'
      });
    } else if (resultData.fileId) {
      downloadFile(resultData.fileId, resultData.originalName);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
        <div>
          {fileList.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              <FileUploader
                accept=".pdf"
                multiple={true}
                onFilesSelected={handleFilesSelected}
                label="Drop PDF files here to merge"
                description="Supports up to 50MB per PDF file."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT SIDE: Live Preview & File Queue Grid */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base font-bold text-white">
                      PDF Queue ({fileList.length} files)
                    </h3>
                  </div>
                  <button
                    onClick={() => setFileList([])}
                    className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
                  >
                    Clear All
                  </button>
                </div>

                <div className="glass-panel p-6 rounded-3xl space-y-3">
                  {fileList.map((file, idx) => (
                    <div
                      key={`${file.name}_${idx}`}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 group hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === fileList.length - 1}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDE: Fixed Width Options Sidebar */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Merge PDF Options</h3>
                  <p className="text-xs text-slate-400">
                    Reorder files on the left and combine into a single document.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-white block mb-1">Total Queue</span>
                    {fileList.length} files queued ({(fileList.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB)
                  </div>

                  <FormCheckbox
                    label="Generate Table of Contents"
                    checked={outlineBookmarks}
                    onChange={setOutlineBookmarks}
                    description="Include document outline bookmarks for merged files."
                  />
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <PrimaryActionButton
                  label={`Merge ${fileList.length} PDFs`}
                  onClick={handleMerge}
                  isProcessing={isProcessing}
                  disabled={fileList.length < 2}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-2xl mx-auto">
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" /> Download Merged PDF
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Merge Another PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
