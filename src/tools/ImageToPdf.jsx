import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import { downloadFile, apiFetch } from '../utils/apiClient';
import { PDFDocument } from 'pdf-lib';
import {
  Image as ImageIcon,
  Plus,
  ArrowRight,
  ArrowUpDown,
  Trash2,
  CheckCircle2,
  Download,
  RefreshCw,
  AlertCircle,
  FileText,
  Maximize2,
  Minimize2,
  Smartphone,
  Layout,
  Square
} from 'lucide-react';

export default function ImageToPdf() {
  const [images, setImages] = useState([]); // { id, file, name, size, previewUrl }
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [pageSize, setPageSize] = useState('a4'); // 'a4' | 'letter' | 'legal' | 'a3' | 'fit'
  const [margin, setMargin] = useState('small'); // 'none' | 'small' | 'big'
  const [mergeAll, setMergeAll] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState(null); // single file result or array
  const [errorMsg, setErrorMsg] = useState(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const fileInputRef = useRef(null);

  // Cleanup object URLs when images change or component unmounts
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [images]);

  const processFiles = (newFiles) => {
    setErrorMsg(null);
    const addedImages = Array.from(newFiles).map((file) => ({
      id: `${file.name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...addedImages]);
  };

  const handleFilesSelected = (files) => {
    processFiles(files);
  };

  const handleAddMoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleSortAZ = () => {
    setImages((prev) =>
      [...prev].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    );
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  // Drag & drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setImages((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dropIndex, 0, draggedItem);
      return updated;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // PDF Page Size Definitions (in points: 1 pt = 1/72 inch)
  const getPageDimensions = (sizeKey, isLandscape, imgWidth, imgHeight) => {
    let width = 595.28; // default A4
    let height = 841.89;

    switch (sizeKey) {
      case 'letter':
        width = 612;
        height = 792;
        break;
      case 'legal':
        width = 612;
        height = 1008;
        break;
      case 'a3':
        width = 841.89;
        height = 1190.55;
        break;
      case 'fit':
        width = imgWidth || 595.28;
        height = imgHeight || 841.89;
        break;
      case 'a4':
      default:
        width = 595.28;
        height = 841.89;
        break;
    }

    if (sizeKey !== 'fit' && isLandscape) {
      return { width: Math.max(width, height), height: Math.min(width, height) };
    }
    return { width, height };
  };

  const getMarginSize = (marginKey) => {
    switch (marginKey) {
      case 'small':
        return 20; // 20pt
      case 'big':
        return 50; // 50pt
      case 'none':
      default:
        return 0;
    }
  };

  // Helper canvas fallback for unsupported image formats
  const embedViaCanvas = (pdfDoc, imageObj) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const base64Data = dataUrl.split(',')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const embedded = await pdfDoc.embedJpg(bytes.buffer);
          resolve(embedded);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => reject(new Error(`Failed to load image '${imageObj.name}' for conversion.`));
      img.src = imageObj.previewUrl;
    });
  };

  // Convert image file buffer to embeddable pdf-lib image
  const embedImageInPdfDoc = async (pdfDoc, imageObj) => {
    const arrayBuffer = await imageObj.file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let embeddedImg = null;
    const isPng =
      imageObj.file.type === 'image/png' ||
      imageObj.name.toLowerCase().endsWith('.png') ||
      (uint8Array.length >= 4 &&
        uint8Array[0] === 0x89 &&
        uint8Array[1] === 0x50 &&
        uint8Array[2] === 0x4e &&
        uint8Array[3] === 0x47);

    if (isPng) {
      try {
        embeddedImg = await pdfDoc.embedPng(arrayBuffer);
      } catch (e) {
        embeddedImg = await embedViaCanvas(pdfDoc, imageObj);
      }
    } else {
      try {
        embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
      } catch (e) {
        embeddedImg = await embedViaCanvas(pdfDoc, imageObj);
      }
    }

    return embeddedImg;
  };

  // Trigger PDF Generation
  const handleConvert = async () => {
    if (images.length === 0) {
      setErrorMsg('Please upload at least one image.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const isLandscape = orientation === 'landscape';
      const marginPt = getMarginSize(margin);

      if (mergeAll) {
        // Create single PDF document with all images
        const pdfDoc = await PDFDocument.create();

        for (const imgObj of images) {
          const embeddedImg = await embedImageInPdfDoc(pdfDoc, imgObj);
          const pageDim = getPageDimensions(pageSize, isLandscape, embeddedImg.width, embeddedImg.height);
          const page = pdfDoc.addPage([pageDim.width, pageDim.height]);

          // Compute scaling to fit image inside page margin preserving aspect ratio
          const printableWidth = pageDim.width - 2 * marginPt;
          const printableHeight = pageDim.height - 2 * marginPt;

          const scale = Math.min(printableWidth / embeddedImg.width, printableHeight / embeddedImg.height, 1);
          const drawWidth = embeddedImg.width * scale;
          const drawHeight = embeddedImg.height * scale;

          const x = (pageDim.width - drawWidth) / 2;
          const y = (pageDim.height - drawHeight) / 2;

          page.drawImage(embeddedImg, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
          });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const outputFilename = `Images_Merged_${images.length}_Pages.pdf`;

        // Try backend upload for session persistence & countdown timer, fallback to local blob download
        try {
          const formData = new FormData();
          formData.append('files', new File([blob], outputFilename, { type: 'application/pdf' }));
          const uploadRes = await apiFetch('/api/upload', { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            const fileRec = uploadJson.files[0];
            setResultData({
              isMerged: true,
              fileId: fileRec.fileId,
              originalName: fileRec.originalName,
              size: fileRec.size,
              totalPages: images.length,
              expiresAt: fileRec.expiresAt,
              blobUrl: URL.createObjectURL(blob),
            });
            setIsProcessing(false);
            return;
          }
        } catch (e) {
          console.warn('Backend session storage offline, falling back to instant client download:', e);
        }

        // Direct client fallback
        setResultData({
          isMerged: true,
          originalName: outputFilename,
          size: pdfBytes.length,
          totalPages: images.length,
          blobUrl: URL.createObjectURL(blob),
        });
      } else {
        // Separate PDF per image
        const generatedResults = [];

        for (let i = 0; i < images.length; i++) {
          const imgObj = images[i];
          const pdfDoc = await PDFDocument.create();
          const embeddedImg = await embedImageInPdfDoc(pdfDoc, imgObj);
          const pageDim = getPageDimensions(pageSize, isLandscape, embeddedImg.width, embeddedImg.height);
          const page = pdfDoc.addPage([pageDim.width, pageDim.height]);

          const printableWidth = pageDim.width - 2 * marginPt;
          const printableHeight = pageDim.height - 2 * marginPt;
          const scale = Math.min(printableWidth / embeddedImg.width, printableHeight / embeddedImg.height, 1);
          const drawWidth = embeddedImg.width * scale;
          const drawHeight = embeddedImg.height * scale;

          page.drawImage(embeddedImg, {
            x: (pageDim.width - drawWidth) / 2,
            y: (pageDim.height - drawHeight) / 2,
            width: drawWidth,
            height: drawHeight,
          });

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const singleName = `${imgObj.name.replace(/\.[^/.]+$/, '')}.pdf`;

          generatedResults.push({
            name: singleName,
            size: pdfBytes.length,
            blobUrl: URL.createObjectURL(blob),
          });
        }

        setResultData({
          isMerged: false,
          items: generatedResults,
        });
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('Image to PDF conversion error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during PDF conversion.');
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (resObj) => {
    if (resObj.fileId) {
      downloadFile(resObj.fileId, resObj.originalName);
    } else if (resObj.blobUrl) {
      const link = document.createElement('a');
      link.href = resObj.blobUrl;
      link.download = resObj.originalName || 'converted.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetAll = () => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setResultData(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hidden File Input for Floating "+" Button */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/*"
        className="hidden"
      />

      {/* Screen Title Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
          <ImageIcon className="w-4 h-4" /> Instant Image to PDF Converter
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Image to PDF
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Convert JPG, PNG, and WebP images into high quality PDF documents with custom orientation, margins, and page sizes.
        </p>
      </div>

      {/* Main Workspace */}
      {!resultData ? (
        <div>
          {images.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              <FileUploader
                accept=".jpg,.jpeg,.png,.webp,image/*"
                multiple={true}
                onFilesSelected={handleFilesSelected}
                label="Drop image files here to convert to PDF"
                description="Supports JPG, PNG, and WebP images."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT SIDE: Image Queue Grid & Floating Controls */}
              <div className="lg:col-span-8 space-y-4 relative">
                {/* Header info */}
                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base font-bold text-white">
                      Queued Images ({images.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setImages([])}
                    className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
                  >
                    Clear All
                  </button>
                </div>

                {/* Floating Buttons in top-right of Grid Area */}
                <div className="absolute top-16 right-4 z-20 flex flex-col items-center gap-3">
                  {/* Floating Circular "+" Button with Counter Badge */}
                  <button
                    onClick={handleAddMoreClick}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 relative transition group"
                    title="Add more images"
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[11px] font-extrabold rounded-full h-5 px-1.5 flex items-center justify-center border-2 border-slate-950 shadow">
                      {images.length}
                    </span>
                  </button>

                  {/* Circular Sort A-Z Button */}
                  <button
                    onClick={handleSortAZ}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 shadow-md transition"
                    title="Sort A-Z by filename"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Thumbnail Cards Grid */}
                <div className="glass-panel p-6 rounded-3xl min-h-[340px]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                    <AnimatePresence>
                      {images.map((img, idx) => (
                        <motion.div
                          key={img.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`relative group bg-slate-900/90 border rounded-2xl p-3 flex flex-col items-center cursor-grab active:cursor-grabbing transition ${
                            dragOverIndex === idx
                              ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Image Index Badge */}
                          <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-slate-950/80 border border-slate-700 text-rose-400 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>

                          {/* Delete Single Image Button */}
                          <button
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-slate-950/80 hover:bg-rose-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition duration-200"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Thumbnail Image (Square ~200px container) */}
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-950/50 flex items-center justify-center mb-2.5 border border-slate-800/80">
                            <img
                              src={img.previewUrl}
                              alt={img.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Truncated Filename */}
                          <p className="text-xs font-semibold text-slate-200 truncate w-full text-center px-1">
                            {img.name}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {(img.size / 1024).toFixed(0)} KB
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Fixed Width Options Sidebar */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Image to PDF options
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure orientation, page size, margins, and output settings.
                  </p>
                </div>

                {/* Page Orientation */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                    Page Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition duration-200 ${
                        orientation === 'portrait'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-6 h-6" />
                      <span className="text-xs font-semibold">Portrait</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition duration-200 ${
                        orientation === 'landscape'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Layout className="w-6 h-6" />
                      <span className="text-xs font-semibold">Landscape</span>
                    </button>
                  </div>
                </div>

                {/* Page Size */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 transition font-medium"
                  >
                    <option value="a4">A4 (297x210 mm)</option>
                    <option value="letter">Letter (8.5x11 in)</option>
                    <option value="legal">Legal (8.5x14 in)</option>
                    <option value="a3">A3 (420x297 mm)</option>
                    <option value="fit">Fit to Image (Original dimensions)</option>
                  </select>
                </div>

                {/* Margin Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                    Margin
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMargin('none')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
                        margin === 'none'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Square className="w-5 h-5" />
                      <span className="text-[11px] font-semibold">No margin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMargin('small')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
                        margin === 'small'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Minimize2 className="w-5 h-5" />
                      <span className="text-[11px] font-semibold">Small</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMargin('big')}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
                        margin === 'big'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Maximize2 className="w-5 h-5" />
                      <span className="text-[11px] font-semibold">Big</span>
                    </button>
                  </div>
                </div>

                {/* Merge Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={mergeAll}
                      onChange={(e) => setMergeAll(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-950 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Merge all images in one PDF file
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Convert Button */}
                <div className="pt-2">
                  <button
                    onClick={handleConvert}
                    disabled={isProcessing || images.length === 0}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition transform active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Converting to PDF...
                      </>
                    ) : (
                      <>
                        <span>Convert to PDF</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* RESULTS VIEW */
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">
              Converted to PDF Successfully!
            </h2>
            {resultData.isMerged ? (
              <p className="text-sm text-slate-400">
                Combined {resultData.totalPages} image(s) into{' '}
                <strong className="text-white">{resultData.originalName}</strong> (
                {(resultData.size / (1024 * 1024)).toFixed(2)} MB).
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                Generated {resultData.items.length} individual PDF document(s).
              </p>
            )}
          </div>

          {resultData.expiresAt && (
            <div className="flex justify-center">
              <CountdownTimer expiresAt={resultData.expiresAt} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {resultData.isMerged ? (
              <button
                onClick={() => handleDownloadSingle(resultData)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-5 h-5" /> Download PDF
              </button>
            ) : (
              <div className="space-y-3 w-full">
                {resultData.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span className="text-xs text-white truncate font-medium">{item.name}</span>
                    </div>
                    <button
                      onClick={() => handleDownloadSingle(item)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Convert More Images
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
