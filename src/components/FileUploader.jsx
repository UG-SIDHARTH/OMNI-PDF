import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const MAX_SIZE_MB = 50;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function FileUploader({
  accept = '.pdf',
  multiple = false,
  onFilesSelected,
  label = 'Select file or drag & drop here',
  description = `Supports files up to ${MAX_SIZE_MB}MB`
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndPassFiles = (filesList) => {
    setErrorMsg(null);
    const validFiles = [];

    for (const file of filesList) {
      // 50MB size validation client-side
      if (file.size > MAX_BYTES) {
        setErrorMsg(`File '${file.name}' exceeds the ${MAX_SIZE_MB}MB maximum file size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }

      // Quick client extension check
      const acceptedExts = accept.split(',').map(ext => ext.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();

      // Wildcard image check or extension check
      const isImageWildcard = accept.includes('image/*') && file.type.startsWith('image/');
      const matchesExt = acceptedExts.includes(fileExt) || acceptedExts.includes(file.type);

      if (accept !== '*' && !isImageWildcard && !matchesExt) {
        setErrorMsg(`Invalid file type for '${file.name}'. Allowed types: ${accept}`);
        return;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      if (!multiple) {
        onFilesSelected([validFiles[0]]);
      } else {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-rose-500 bg-rose-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/50 hover:border-rose-500/50 hover:bg-slate-900/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 flex items-center justify-center text-rose-500 border border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-1">{label}</h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs text-slate-400">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              Max {MAX_SIZE_MB}MB
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> MIME Validated
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              3h Auto-Delete
            </span>
          </div>

          <button
            type="button"
            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm shadow-lg shadow-rose-600/25 transition"
          >
            Select Files
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-rose-100">Upload Error</strong>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
