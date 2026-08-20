import React, { useState, useRef, useEffect } from 'react';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import ModeTabs from '../components/shared/ModeTabs';
import SelectableCard from '../components/shared/SelectableCard';
import NumericStepper from '../components/shared/NumericStepper';
import AddItemButton from '../components/shared/AddItemButton';
import PrimaryActionButton from '../components/shared/PrimaryActionButton';
import FormCheckbox from '../components/shared/FormCheckbox';
import RangeContainer from '../components/shared/RangeContainer';
import { apiFetch, downloadFile } from '../utils/apiClient';
import { PDFDocument } from 'pdf-lib';
import {
  Scissors, FileX, FileSpreadsheet, LayoutGrid, Scan,
  Wrench, FileText, Image as ImageIcon, FileCode, Presentation,
  Table, Globe, FileImage, FileType, MonitorPlay,
  Grid, Archive, RotateCw, Hash, Stamp, Crop,
  Edit3, CheckSquare, Unlock, Lock, PenTool, EyeOff, Eye,
  Columns, Sparkles, Languages, FileCode2, Download,
  RefreshCw, AlertCircle, CheckCircle2, ArrowLeft,
  Copy, Check, MessageSquare, Layers, File, Sliders
} from 'lucide-react';

const ICON_MAP = {
  'split-pdf': Scissors,
  'remove-pages': FileX,
  'extract-pages': FileSpreadsheet,
  'organize-pdf': LayoutGrid,
  'scan-to-pdf': Scan,
  'repair-pdf': Wrench,
  'ocr-pdf': FileText,
  'jpg-to-pdf': ImageIcon,
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

export default function UniversalToolEngine({ tool, onBack }) {
  const toolId = tool?.id || 'tool';
  const toolName = tool?.name || 'PDF & Document Tool';
  const toolDescription = tool?.description || 'Fast, secure, privacy-first PDF and document processing.';
  const toolAccept = tool?.accept || '.pdf';

  const IconComponent = ICON_MAP[toolId] || Sparkles;

  const [files, setFiles] = useState([]);
  const [secondFile, setSecondFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Tool Controls State
  const [splitMode, setSplitMode] = useState('range');
  const [pageRange, setPageRange] = useState('1');
  const [fixedPageCount, setFixedPageCount] = useState(2);
  const [rangesList, setRangesList] = useState([{ id: 1, from: 1, to: 3 }]);
  const [mergeRanges, setMergeRanges] = useState(false);

  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // AI & Local Extractor Controls
  const [preserveHeadings, setPreserveHeadings] = useState(true);
  const [preserveTables, setPreserveTables] = useState(true);
  const [includeImageLinks, setIncludeImageLinks] = useState(true);

  const [summaryLength, setSummaryLength] = useState('medium'); // 'short' | 'medium' | 'detailed'
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [redactKeywords, setRedactKeywords] = useState('CONFIDENTIAL, INTERNAL');
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    setFiles([]);
    setSecondFile(null);
    setResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
  }, [toolId]);

  const handleFilesSelected = (selectedFiles) => {
    setErrorMsg(null);
    setFiles(selectedFiles);
  };

  const handleSecondFileSelected = (selectedFiles) => {
    if (selectedFiles.length > 0) {
      setSecondFile(selectedFiles[0]);
    }
  };

  const handleAddRange = () => {
    const lastTo = rangesList.length > 0 ? rangesList[rangesList.length - 1].to : 0;
    setRangesList((prev) => [
      ...prev,
      { id: Date.now(), from: lastTo + 1, to: lastTo + 3 }
    ]);
  };

  const handleRemoveRange = (id) => {
    setRangesList((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRange = (id, field, val) => {
    setRangesList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: Number(val) || 1 } : r))
    );
  };

  const handleCopyResultText = () => {
    if (!result?.previewText) return;
    navigator.clipboard.writeText(result.previewText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleProcess = async () => {
    if (files.length === 0 && toolId !== 'html-to-pdf') {
      setErrorMsg('Please select a file to process.');
      return;
    }

    if (toolId === 'protect-pdf') {
      if (!password) {
        setErrorMsg('Please enter a password to protect your PDF file.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please enter the exact same password in both fields.');
        return;
      }
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let uploadedFileId = null;

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        const upRes = await apiFetch('/api/upload', { method: 'POST', body: formData });
        if (!upRes.ok) {
          const upErr = await upRes.json();
          throw new Error(upErr.error || 'Failed to upload file.');
        }
        const upJson = await upRes.json();
        if (upJson.files && upJson.files.length > 0) {
          uploadedFileId = upJson.files[0].fileId;
        }
      }

      let apiEndpoint = null;
      let payload = { fileId: uploadedFileId };

      switch (toolId) {
        case 'split-pdf':
          apiEndpoint = '/api/pdf/split';
          payload.pageRange =
            splitMode === 'range' && rangesList.length > 0
              ? `${rangesList[0].from}-${rangesList[0].to}`
              : pageRange;
          break;
        case 'rotate-pdf':
          apiEndpoint = '/api/pdf/rotate';
          payload.angle = rotationAngle;
          break;
        case 'add-watermark':
          apiEndpoint = '/api/pdf/watermark';
          payload.text = watermarkText;
          payload.opacity = watermarkOpacity;
          break;
        case 'protect-pdf':
          apiEndpoint = '/api/pdf/protect';
          payload.password = password;
          break;
        case 'unlock-pdf':
          apiEndpoint = '/api/pdf/unlock';
          payload.password = password;
          break;
        case 'remove-pages':
          apiEndpoint = '/api/pdf/remove-pages';
          payload.pagesToRemove = pageRange;
          break;
        case 'extract-pages':
          apiEndpoint = '/api/pdf/extract-pages';
          payload.pageRange = pageRange;
          break;
        case 'pdf-to-markdown':
          apiEndpoint = '/api/pdf/pdf-to-markdown';
          payload.preserveHeadings = preserveHeadings;
          payload.preserveTables = preserveTables;
          payload.includeImageLinks = includeImageLinks;
          break;
        case 'ai-summarizer':
          apiEndpoint = '/api/pdf/ai-summarizer';
          payload.length = summaryLength;
          break;
        case 'translate-pdf':
          apiEndpoint = '/api/pdf/translate';
          payload.sourceLang = sourceLang;
          payload.targetLang = targetLang;
          break;
        case 'redact-pdf':
          apiEndpoint = '/api/pdf/redact';
          payload.keywords = redactKeywords;
          break;
        default:
          apiEndpoint = '/api/pdf/repair';
      }

      const processRes = await apiFetch(apiEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!processRes.ok) {
        const procErr = await processRes.json();
        throw new Error(procErr.error || `Failed to process ${toolName}.`);
      }

      const procJson = await processRes.json();
      let infoText = `${toolName} processed successfully.`;
      let previewText = procJson.markdownText || procJson.summaryText || procJson.translatedText || null;

      setResult({
        fileId: procJson.fileId,
        downloadUrl: `/api/download/${procJson.fileId}`,
        filename: procJson.originalName,
        infoText,
        expiresAt: procJson.expiresAt || Date.now() + 3 * 60 * 60 * 1000,
        previewText
      });

      setIsProcessing(false);
    } catch (err) {
      console.error(`Execution error [${toolId}]:`, err);
      setErrorMsg(err.message || `Failed to execute ${toolName}.`);
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setSecondFile(null);
    setResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Tools
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-4">
          <IconComponent className="w-4 h-4" /> {toolName}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          {toolName}
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          {toolDescription}
        </p>
      </div>

      {!result ? (
        <div>
          {files.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              <FileUploader
                accept={toolAccept}
                multiple={toolId === 'merge-pdf'}
                onFilesSelected={handleFilesSelected}
                label={`Drop your file here for ${toolName}`}
                description={`Supports ${toolAccept} up to 50MB.`}
              />
            </div>
          ) : (
            /* UNIFIED TWO-COLUMN LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Live Preview & Page/Range Thumbnail Cards */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-rose-400" />
                    <h3 className="text-base font-bold text-white">
                      Document Preview ({files.length} File{files.length > 1 ? 's' : ''})
                    </h3>
                  </div>
                  <button
                    onClick={resetAll}
                    className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
                  >
                    Change File
                  </button>
                </div>

                <div className="glass-panel p-6 rounded-3xl min-h-[340px] space-y-4">
                  {toolId === 'split-pdf' && splitMode === 'range' ? (
                    <div className="space-y-4">
                      {rangesList.map((rng, rIdx) => (
                        <RangeContainer
                          key={rng.id}
                          rangeIndex={rIdx}
                          title={`Custom Page Range (${rng.from} to ${rng.to})`}
                          onRemove={rangesList.length > 1 ? () => handleRemoveRange(rng.id) : null}
                          pageCountInfo={`${Math.max(1, rng.to - rng.from + 1)} Page(s)`}
                        >
                          {Array.from({ length: Math.min(4, Math.max(1, rng.to - rng.from + 1)) }).map((_, pIdx) => (
                            <div
                              key={pIdx}
                              className="aspect-[3/4] rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center p-3 text-center group hover:border-rose-500/50 transition relative"
                            >
                              <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center mb-2">
                                {rng.from + pIdx}
                              </span>
                              <FileText className="w-8 h-8 text-slate-500 mb-1" />
                              <span className="text-[10px] text-slate-400 font-semibold">Page {rng.from + pIdx}</span>
                            </div>
                          ))}
                        </RangeContainer>
                      ))}
                      <AddItemButton label="Add Range" onClick={handleAddRange} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="aspect-[3/4] rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-between p-4 text-center group hover:border-slate-700 transition"
                        >
                          <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center">
                            #{i + 1}
                          </span>
                          <IconComponent className="w-10 h-10 text-rose-400 my-2" />
                          <div className="w-full">
                            <p className="text-xs font-semibold text-white truncate">{f.name}</p>
                            <span className="text-[10px] text-slate-500">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Fixed Width Options Sidebar */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{toolName} Options</h3>
                  <p className="text-xs text-slate-400">Configure parameters for {toolName}.</p>
                </div>

                {/* Sub-modes for Split PDF */}
                {toolId === 'split-pdf' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                      Split Mode
                    </label>
                    <ModeTabs
                      tabs={[
                        { id: 'range', label: 'Custom Ranges', icon: Layers },
                        { id: 'fixed', label: 'Fixed Ranges', icon: File },
                        { id: 'pages', label: 'Extract Pages', icon: Scissors }
                      ]}
                      activeTab={splitMode}
                      onChange={setSplitMode}
                    />

                    {splitMode === 'range' && (
                      <div className="space-y-3 pt-2">
                        {rangesList.map((rng, i) => (
                          <div key={rng.id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                            <span className="text-xs font-bold text-rose-400">Range {i + 1} Bounds</span>
                            <div className="grid grid-cols-2 gap-2">
                              <NumericStepper
                                label="From Page"
                                value={rng.from}
                                onChange={(val) => handleUpdateRange(rng.id, 'from', val)}
                              />
                              <NumericStepper
                                label="To Page"
                                value={rng.to}
                                onChange={(val) => handleUpdateRange(rng.id, 'to', val)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {splitMode === 'fixed' && (
                      <div className="pt-2">
                        <NumericStepper
                          label="Split into chunks of (pages):"
                          value={fixedPageCount}
                          onChange={setFixedPageCount}
                          min={1}
                          max={50}
                        />
                      </div>
                    )}

                    {splitMode === 'pages' && (
                      <div className="pt-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-300">Pages to Extract (comma separated):</label>
                        <input
                          type="text"
                          value={pageRange}
                          onChange={(e) => setPageRange(e.target.value)}
                          placeholder="e.g. 1, 3, 5-8"
                          className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                        />
                      </div>
                    )}

                    <FormCheckbox
                      label="Merge all ranges into one output PDF"
                      checked={mergeRanges}
                      onChange={setMergeRanges}
                    />
                  </div>
                )}

                {/* PDF TO MARKDOWN OPTIONS */}
                {toolId === 'pdf-to-markdown' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block">
                      Extraction Options
                    </label>

                    <FormCheckbox
                      label="Preserve Headings"
                      checked={preserveHeadings}
                      onChange={setPreserveHeadings}
                      description="Formats section titles into Markdown # and ## headers."
                    />

                    <FormCheckbox
                      label="Preserve Tables"
                      checked={preserveTables}
                      onChange={setPreserveTables}
                      description="Formats multi-column layout data as Markdown GFM tables."
                    />

                    <FormCheckbox
                      label="Include Image Links"
                      checked={includeImageLinks}
                      onChange={setIncludeImageLinks}
                      description="Inserts image and figure anchor links."
                    />

                    <p className="text-[11px] text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      💡 Note: Table and heading detection is heuristic-based and formats layout structures automatically.
                    </p>
                  </div>
                )}

                {/* AI SUMMARIZER OPTIONS */}
                {toolId === 'ai-summarizer' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block">
                      Summary Length
                    </label>

                    <div className="space-y-2">
                      <SelectableCard
                        isSelected={summaryLength === 'short'}
                        onClick={() => setSummaryLength('short')}
                        title="Short Summary"
                        subtitle="Executive overview (~15% length)"
                        isAi={true}
                      />
                      <SelectableCard
                        isSelected={summaryLength === 'medium'}
                        onClick={() => setSummaryLength('medium')}
                        title="Medium Summary"
                        subtitle="Balanced key insights (~30% length)"
                        isAi={true}
                      />
                      <SelectableCard
                        isSelected={summaryLength === 'detailed'}
                        onClick={() => setSummaryLength('detailed')}
                        title="Detailed Summary"
                        subtitle="Comprehensive breakdown (~50% length)"
                        isAi={true}
                      />
                    </div>

                    <p className="text-[11px] text-purple-400 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                      ✨ Extractive AI summary: pulls key high-weight sentences directly from original text without hallucination.
                    </p>
                  </div>
                )}

                {/* TRANSLATE PDF OPTIONS */}
                {toolId === 'translate-pdf' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block">
                      Language Pair
                    </label>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Source Language</label>
                        <select
                          value={sourceLang}
                          onChange={(e) => setSourceLang(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                        >
                          <option value="English">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Target Language</label>
                        <select
                          value={targetLang}
                          onChange={(e) => setTargetLang(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                        >
                          <option value="Spanish">Spanish (Español)</option>
                          <option value="French">French (Français)</option>
                          <option value="German">German (Deutsch)</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      ⚠️ Basic word-for-word substitution — not a full translation, grammar will not be correct for most sentences.
                    </p>
                    <p className="text-[11px] text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      🔒 Local offline engine: processes document 100% locally with zero external API calls or billing risk.
                    </p>
                  </div>
                )}

                {/* Controls for Rotate PDF */}
                {toolId === 'rotate-pdf' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                      Rotation Angle
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <SelectableCard
                        isSelected={rotationAngle === 90}
                        onClick={() => setRotationAngle(90)}
                        title="90°"
                        subtitle="Right"
                        icon={RotateCw}
                      />
                      <SelectableCard
                        isSelected={rotationAngle === 180}
                        onClick={() => setRotationAngle(180)}
                        title="180°"
                        subtitle="Flip"
                        icon={RotateCw}
                      />
                      <SelectableCard
                        isSelected={rotationAngle === 270}
                        onClick={() => setRotationAngle(270)}
                        title="270°"
                        subtitle="Left"
                        icon={RotateCw}
                      />
                    </div>
                  </div>
                )}

                {/* Controls for Add Watermark */}
                {toolId === 'add-watermark' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block mb-1.5">
                        Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block mb-1.5">
                        Opacity: {Math.round(watermarkOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Controls for Protect PDF */}
                {toolId === 'protect-pdf' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block mb-1.5">
                        Encryption Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium mb-3"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Controls for Unlock PDF */}
                {toolId === 'unlock-pdf' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block mb-1.5">
                        Document Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Controls for Extract/Remove Pages */}
                {(toolId === 'remove-pages' || toolId === 'extract-pages') && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block mb-1.5">
                        {toolId === 'remove-pages' ? 'Pages to Delete' : 'Pages to Extract'}
                      </label>
                      <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder="e.g. 1, 3, 5-8"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Controls for Redact PDF */}
                {toolId === 'redact-pdf' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block mb-1.5">
                        Keywords to Redact
                      </label>
                      <input
                        type="text"
                        value={redactKeywords}
                        onChange={(e) => setRedactKeywords(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, SECRET"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      ⚠️ Visual redaction only — underlying text layer is covered with black blocks but is not destructively purged from vector streams.
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <PrimaryActionButton
                  label={`${toolName}`}
                  onClick={handleProcess}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white mb-2">{toolName} Completed!</h2>
            <p className="text-sm text-slate-400">{result.infoText}</p>
          </div>

          {result.previewText && (
            <div className="text-left space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">Output Preview</span>
                <button
                  onClick={handleCopyResultText}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-h-80 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {result.previewText}
              </div>
            </div>
          )}

          {result.expiresAt && (
            <div className="flex justify-center">
              <CountdownTimer expiresAt={result.expiresAt} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => downloadFile(result.fileId, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" /> Download Result ({result.filename.endsWith('.md') ? '.md' : '.txt'})
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Process Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
