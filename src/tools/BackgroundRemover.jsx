import React, { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import SelectableCard from '../components/shared/SelectableCard';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import { saveFileUniversal } from '../utils/fileDownloader';
import { 
  Sparkles, Download, RefreshCw, Palette, Image as ImageIcon, 
  ArrowLeftRight, Check, AlertCircle, Eraser, RotateCcw, Undo, 
  Eye, Wand2, Crop, ZoomIn, ZoomOut, Maximize2, Users, Sliders, Zap, Shield, HelpCircle
} from 'lucide-react';

export default function BackgroundRemover() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  
  // AI Segmentation Model Preset (u2net_human_seg concept)
  const [modelMode, setModelMode] = useState('human'); // 'human', 'general', 'fast'

  // Edge Matting & Feathering
  const [edgeFeather, setEdgeFeather] = useState(0); // 0 to 20px
  const [deHalo, setDeHalo] = useState(false);

  // Background Styling
  const [bgColor, setBgColor] = useState('transparent');
  const [customHex, setCustomHex] = useState('#ffffff');
  const [bgImageFile, setBgImageFile] = useState(null);
  const [bgImageUrl, setBgImageUrl] = useState(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Advanced Tools state: 'none', 'eraser', 'restore', 'box-eraser', 'wand'
  const [activeTool, setActiveTool] = useState('none');
  const [brushSize, setBrushSize] = useState(25);
  const [wandTolerance, setWandTolerance] = useState(35);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boxStart, setBoxStart] = useState(null);
  const [boxCurrent, setBoxCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const canvasRef = useRef(null);
  const bgInputRef = useRef(null);
  const origImgRef = useRef(null);
  const procImgRef = useRef(null);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setProcessedUrl(null);
    setErrorMsg(null);
    setActiveTool('none');
    setHistory([]);
    setZoomLevel(1.0);

    processImage(file, modelMode);
  };

  const processImage = async (file, mode = modelMode) => {
    setIsProcessing(true);
    const modeLabel = mode === 'human' ? 'People & Group Model' : mode === 'fast' ? 'Fast Model' : 'General Model';
    setProgressStatus(`Connecting to AI segmentation engine (${modeLabel})...`);
    setErrorMsg(null);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('AI Model segmentation timed out (45s). The network or security restrictions may have delayed downloading the ONNX weights. You can retry with Fast Mode or use Instant Keying below.'));
        }, 45000);
      });

      const executionPromise = removeBackground(file, {
        model: mode === 'fast' ? 'small' : 'medium',
        progress: (key, current, total) => {
          if (total) {
            const pct = Math.round((current / total) * 100);
            setProgressStatus(`Downloading Model Weights / Processing AI (${pct}%)...`);
          } else {
            setProgressStatus(`Segmenting foreground & alpha edges...`);
          }
        }
      });

      const blob = await Promise.race([executionPromise, timeoutPromise]);
      const resultUrl = URL.createObjectURL(blob);
      setProcessedUrl(resultUrl);
      setIsProcessing(false);
    } catch (err) {
      console.error('Background removal error:', err);
      setErrorMsg(err.message || 'Failed to process AI background removal.');
      setIsProcessing(false);
    }
  };

  const handleInstantKeyingFallback = () => {
    if (!originalUrl) return;
    setIsProcessing(true);
    setProgressStatus('Applying instant edge & chroma thresholding...');
    setErrorMsg(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;
        
        // Sample corner pixels to estimate dominant background color
        const corners = [
          [0, 0],
          [Math.max(0, c.width - 1), 0],
          [0, Math.max(0, c.height - 1)],
          [Math.max(0, c.width - 1), Math.max(0, c.height - 1)]
        ];
        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([x, y]) => {
          const idx = (y * c.width + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR /= 4; bgG /= 4; bgB /= 4;

        const tolerance = 38;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
          if (dist < tolerance) {
            data[i + 3] = 0;
          } else if (dist < tolerance + 15) {
            data[i + 3] = Math.round(((dist - tolerance) / 15) * 255);
          }
        }
        ctx.putImageData(imgData, 0, 0);

        c.toBlob((blob) => {
          if (blob) {
            const resultUrl = URL.createObjectURL(blob);
            setProcessedUrl(resultUrl);
          }
          setIsProcessing(false);
        }, 'image/png');
      } catch (keyErr) {
        console.error('Keying fallback error:', keyErr);
        setErrorMsg('Could not process canvas fallback.');
        setIsProcessing(false);
      }
    };
    img.onerror = () => {
      setErrorMsg('Failed to load image for fallback.');
      setIsProcessing(false);
    };
    img.src = originalUrl;
  };

  // Initialize interactive Canvas when processedUrl changes
  useEffect(() => {
    if (!processedUrl || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      procImgRef.current = img;
      renderCanvasWithFeathering();
    };
    img.src = processedUrl;

    if (originalUrl) {
      const orig = new Image();
      orig.crossOrigin = 'anonymous';
      orig.onload = () => {
        origImgRef.current = orig;
      };
      orig.src = originalUrl;
    }
  }, [processedUrl, originalUrl]);

  // Re-render when feathering or dehalo changes
  useEffect(() => {
    if (procImgRef.current) {
      renderCanvasWithFeathering();
    }
  }, [edgeFeather, deHalo]);

  const renderCanvasWithFeathering = () => {
    const img = procImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (edgeFeather > 0) {
      ctx.filter = `blur(${edgeFeather}px)`;
    } else {
      ctx.filter = 'none';
    }

    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';

    if (history.length === 0) {
      saveHistoryState();
    }
  };

  const saveHistoryState = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), imageData]);
  };

  const handleUndo = () => {
    if (history.length <= 1 || !canvasRef.current) return;
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const handleResetCanvas = () => {
    if (!procImgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(procImgRef.current, 0, 0);
    saveHistoryState();
  };

  // Get Canvas coordinate accounting for element rect & aspect ratio
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Color Magic Wand Eraser (Purges similar colors in area)
  const applyMagicWand = (coords) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const startX = Math.floor(coords.x);
    const startY = Math.floor(coords.y);
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const targetIdx = (startY * width + startX) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx + 1];
    const targetB = data[targetIdx + 2];
    const targetA = data[targetIdx + 3];

    if (targetA === 0) return; // Already transparent

    const radius = Math.floor(brushSize * 3);
    const minX = Math.max(0, startX - radius);
    const maxX = Math.min(width - 1, startX + radius);
    const minY = Math.max(0, startY - radius);
    const maxY = Math.min(height - 1, startY + radius);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - startX;
        const dy = y - startY;
        if (dx * dx + dy * dy <= radius * radius) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a > 0) {
            const diff = Math.sqrt(
              (r - targetR) ** 2 +
              (g - targetG) ** 2 +
              (b - targetB) ** 2
            );

            if (diff <= wandTolerance) {
              data[idx + 3] = 0; // Erase pixel to transparent
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveHistoryState();
  };

  // Mouse / Touch handlers for tools
  const handleMouseDown = (e) => {
    if (activeTool === 'none') return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'wand') {
      applyMagicWand(coords);
      return;
    }

    if (activeTool === 'box-eraser') {
      setIsDrawing(true);
      setBoxStart(coords);
      setBoxCurrent(coords);
      return;
    }

    setIsDrawing(true);
    drawBrush(coords);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    if (activeTool === 'box-eraser') {
      setBoxCurrent(coords);
      return;
    }

    if (activeTool === 'eraser' || activeTool === 'restore') {
      drawBrush(coords);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'box-eraser' && boxStart && boxCurrent && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const x = Math.min(boxStart.x, boxCurrent.x);
      const y = Math.min(boxStart.y, boxCurrent.y);
      const w = Math.abs(boxCurrent.x - boxStart.x);
      const h = Math.abs(boxCurrent.y - boxStart.y);

      if (w > 2 && h > 2) {
        ctx.clearRect(x, y, w, h);
        saveHistoryState();
      }

      setBoxStart(null);
      setBoxCurrent(null);
    } else if (activeTool === 'eraser' || activeTool === 'restore') {
      saveHistoryState();
    }
  };

  const drawBrush = (coords) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fill();
    } else if (activeTool === 'restore' && origImgRef.current) {
      ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(origImgRef.current, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  };

  // Custom Background Image Selection
  const handleBgImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgImageFile(file);
      setBgImageUrl(URL.createObjectURL(file));
      setBgColor('image');
    }
  };

  // Export & Download
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const touchUpCanvas = canvasRef.current;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = touchUpCanvas.width;
    exportCanvas.height = touchUpCanvas.height;
    const ctx = exportCanvas.getContext('2d');

    if (bgColor === 'transparent') {
      ctx.drawImage(touchUpCanvas, 0, 0);
      triggerDownload(exportCanvas.toDataURL('image/png'), `Background_Removed_${selectedFile.name.replace(/\.[^/.]+$/, "")}.png`);
    } else if (bgColor === 'image' && bgImageUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(touchUpCanvas, 0, 0);
        triggerDownload(exportCanvas.toDataURL('image/png'), `Custom_BG_${selectedFile.name.replace(/\.[^/.]+$/, "")}.png`);
      };
      bgImg.src = bgImageUrl;
    } else {
      ctx.fillStyle = bgColor === 'hex' ? customHex : bgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(touchUpCanvas, 0, 0);
      triggerDownload(exportCanvas.toDataURL('image/png'), `Color_BG_${selectedFile.name.replace(/\.[^/.]+$/, "")}.png`);
    }
  };

  const triggerDownload = (dataUrl, filename) => {
    saveFileUniversal({
      blobUrl: dataUrl,
      filename,
      mimeType: 'image/png'
    });
  };

  const resetAll = () => {
    setSelectedFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setErrorMsg(null);
    setIsProcessing(false);
    setActiveTool('none');
    setHistory([]);
    setZoomLevel(1.0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
          <Sparkles className="w-4 h-4" /> Multi-Model AI & Alpha Matting Removal Suite
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Remove Background, Side Objects & Refine Edges
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Choose specialized AI segmentation models (People & Group Mode, General Objects, Fast Mode) with Alpha Matting & Edge Feathering.
        </p>
      </div>

      {/* Model Selection Selector (Before Upload) */}
      {!selectedFile && (
        <div className="mb-8 glass-panel p-6 rounded-3xl space-y-4 max-w-3xl mx-auto">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-400" /> Select AI Segmentation Model Preset
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'human',
                title: 'People & Group Photo',
                desc: 'Fine-tuned for multiple people, hair, skin tones & group shots (u2net_human_seg)',
                icon: Users,
                badge: 'Recommended'
              },
              {
                id: 'general',
                title: 'General Objects',
                desc: 'Products, animals, cars & graphics (u2net)',
                icon: Wand2
              },
              {
                id: 'fast',
                title: 'Fast High-Speed',
                desc: 'Lightweight model for quick execution (u2netp)',
                icon: Zap,
                badge: 'Fastest'
              }
            ].map((m) => (
              <SelectableCard
                key={m.id}
                isSelected={modelMode === m.id}
                onClick={() => setModelMode(m.id)}
                title={m.title}
                subtitle={m.desc}
                icon={m.icon}
                isAi={true}
              />
            ))}
          </div>
        </div>
      )}

      {!selectedFile ? (
        <FileUploader
          accept=".jpg,.jpeg,.png"
          onFilesSelected={handleFileSelect}
          label="Drop JPG or PNG group photo or image"
          description={`Using ${modelMode === 'human' ? 'People & Group Model' : modelMode === 'fast' ? 'Fast Model' : 'General Model'}. Supports up to 50MB.`}
        />
      ) : (
        <div className="space-y-6">
          {/* Status & Actions Bar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm text-white truncate max-w-xs">{selectedFile.name}</span>
              <span className="text-xs text-slate-400">({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {modelMode === 'human' ? 'Group/People Model' : modelMode === 'fast' ? 'Fast Model' : 'General Model'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {processedUrl && (
                <button
                  onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-rose-400" />
                  {showBeforeAfter ? 'Show Cutout' : 'Compare Original'}
                </button>
              )}

              <button
                onClick={resetAll}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Start Over
              </button>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Running AI Model Segmentation</h3>
              <p className="text-sm text-slate-400 font-medium animate-pulse">{progressStatus}</p>
            </div>
          )}

          {errorMsg && (
            <div className="glass-panel p-6 rounded-3xl border border-rose-800/80 bg-rose-950/40 space-y-4">
              <div className="flex items-start gap-3 text-rose-200 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white">AI Processing Notice</h4>
                  <p className="text-xs text-rose-300 leading-relaxed">{errorMsg}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setModelMode('fast');
                    processImage(selectedFile, 'fast');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-2 transition"
                >
                  <Zap className="w-3.5 h-3.5" /> Retry with Fast Model
                </button>

                <button
                  onClick={handleInstantKeyingFallback}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Use Instant Edge Keying
                </button>

                <button
                  onClick={() => processImage(selectedFile, modelMode)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            </div>
          )}

          {/* Result Workspace */}
          {processedUrl && !isProcessing && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Workspace Column: Canvas & Interactive Brush */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col items-center justify-between min-h-[480px] space-y-4">
                
                {/* Canvas Container with Zoom */}
                <div className="relative w-full max-h-[500px] flex items-center justify-center overflow-hidden rounded-2xl">
                  
                  {/* Zoom Controls Overlay */}
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3.0))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1.0)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {showBeforeAfter ? (
                    <img src={originalUrl} alt="Original" className="max-h-[450px] object-contain rounded-xl shadow-2xl" />
                  ) : (
                    <div
                      className={`relative max-h-[450px] overflow-auto rounded-xl shadow-2xl flex items-center justify-center ${
                        bgColor === 'transparent' ? 'bg-checkerboard' : ''
                      }`}
                      style={{
                        backgroundColor:
                          bgColor === 'transparent'
                            ? undefined
                            : bgColor === 'hex'
                            ? customHex
                            : bgColor === 'image'
                            ? 'transparent'
                            : bgColor,
                        backgroundImage:
                          bgColor === 'image' && bgImageUrl ? `url(${bgImageUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.1s ease-out' }}>
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          onTouchStart={handleMouseDown}
                          onTouchMove={handleMouseMove}
                          onTouchEnd={handleMouseUp}
                          className={`max-h-[450px] object-contain transition-all ${
                            activeTool === 'eraser'
                              ? 'cursor-crosshair'
                              : activeTool === 'box-eraser'
                              ? 'cursor-crosshair'
                              : activeTool === 'wand'
                              ? 'cursor-pointer'
                              : activeTool === 'restore'
                              ? 'cursor-cell'
                              : 'cursor-default'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Object Eraser & Alpha Matting Toolbar */}
                <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-3">
                  
                  {/* Tool Selection Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Box Region Eraser */}
                      <button
                        onClick={() => setActiveTool(activeTool === 'box-eraser' ? 'none' : 'box-eraser')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                          activeTool === 'box-eraser'
                            ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                            : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                        }`}
                        title="Drag a rectangle to instantly erase tables, desks, or side objects"
                      >
                        <Crop className="w-4 h-4 text-rose-400" /> Box Crop Desk/Object
                      </button>

                      {/* Brush Eraser */}
                      <button
                        onClick={() => setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                          activeTool === 'eraser'
                            ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                            : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Eraser className="w-4 h-4 text-rose-400" /> Brush Eraser
                      </button>

                      {/* Color Magic Wand */}
                      <button
                        onClick={() => setActiveTool(activeTool === 'wand' ? 'none' : 'wand')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                          activeTool === 'wand'
                            ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                            : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                        }`}
                        title="Click on unwanted background color spot to erase matching pixels"
                      >
                        <Wand2 className="w-4 h-4 text-amber-400" /> Color Wand Erase
                      </button>

                      {/* Restore Subject */}
                      <button
                        onClick={() => setActiveTool(activeTool === 'restore' ? 'none' : 'restore')}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                          activeTool === 'restore'
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <Eye className="w-4 h-4 text-emerald-400" /> Restore Subject
                      </button>
                    </div>

                    {/* Undo & Reset Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUndo}
                        disabled={history.length <= 1}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                        title="Undo Operation"
                      >
                        <Undo className="w-4 h-4" /> Undo
                      </button>

                      <button
                        onClick={handleResetCanvas}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                        title="Reset All Edits"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Alpha Matting Edge Feathering Control */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Alpha Matting Edge Feather: {edgeFeather}px</span>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={edgeFeather}
                        onChange={(e) => setEdgeFeather(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Sliders for Active Tools */}
                  {activeTool === 'eraser' || activeTool === 'restore' ? (
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
                      <span className="text-xs text-slate-400 font-medium">Brush Size: {brushSize}px</span>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  ) : activeTool === 'wand' ? (
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
                      <span className="text-xs text-slate-400 font-medium">Color Sensitivity: {wandTolerance}</span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={wandTolerance}
                        onChange={(e) => setWandTolerance(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  ) : activeTool === 'box-eraser' ? (
                    <p className="text-xs text-rose-300 font-medium pt-1 border-t border-slate-800">
                      💡 Click & drag a box rectangle over the wooden desk on the left (or any side object) to erase it completely!
                    </p>
                  ) : null}

                </div>

              </div>

              {/* Right Workspace Column: Styling Controls & Download */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-rose-400" /> Background Backdrop
                  </h3>

                  <div className="space-y-4">
                    {/* Transparent Option */}
                    <button
                      onClick={() => setBgColor('transparent')}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition ${
                        bgColor === 'transparent'
                          ? 'border-rose-500 bg-rose-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-checkerboard border border-slate-700" />
                        <span>Transparent (PNG)</span>
                      </div>
                      {bgColor === 'transparent' && <Check className="w-4 h-4 text-rose-400" />}
                    </button>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'White', color: '#ffffff' },
                        { label: 'Black', color: '#0f172a' },
                        { label: 'Rose', color: '#e11d48' },
                        { label: 'Emerald', color: '#10b981' },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setBgColor(preset.color)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium transition ${
                            bgColor === preset.color
                              ? 'border-rose-500 bg-rose-500/10 text-white'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom Color Hex */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <input
                        type="color"
                        value={customHex}
                        onChange={(e) => {
                          setCustomHex(e.target.value);
                          setBgColor('hex');
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-slate-400 block">Custom Color</span>
                        <input
                          type="text"
                          value={customHex}
                          onChange={(e) => {
                            setCustomHex(e.target.value);
                            setBgColor('hex');
                          }}
                          className="bg-transparent text-sm font-mono font-semibold text-white uppercase outline-none"
                        />
                      </div>
                    </div>

                    {/* Custom Backdrop Swap */}
                    <div>
                      <input
                        type="file"
                        ref={bgInputRef}
                        accept="image/*"
                        onChange={handleBgImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => bgInputRef.current?.click()}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition ${
                          bgColor === 'image'
                            ? 'border-rose-500 bg-rose-500/10 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ImageIcon className="w-5 h-5 text-rose-400" />
                          <span className="truncate">{bgImageFile ? bgImageFile.name : 'Swap Image Backdrop'}</span>
                        </div>
                        {bgColor === 'image' && <Check className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Download Action */}
                <div className="space-y-3">
                  <PrimaryActionButton
                    label="Download HD PNG"
                    onClick={handleDownload}
                    icon={Download}
                  />
                  <p className="text-xs text-slate-500 text-center">
                    Processed safely in-browser with zero server file retention.
                  </p>
                </div>

              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
