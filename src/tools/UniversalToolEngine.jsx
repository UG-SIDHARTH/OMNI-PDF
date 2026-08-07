import React, { useState, useRef, useEffect } from 'react';
import FileUploader from '../components/FileUploader';
import CountdownTimer from '../components/CountdownTimer';
import { apiFetch, downloadFile } from '../utils/apiClient';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  Scissors, FileX, FileSpreadsheet, LayoutGrid, Scan,
  Wrench, FileText, Image, FileCode, Presentation,
  Table, Globe, FileImage, FileType, MonitorPlay,
  Grid, Archive, RotateCw, Hash, Stamp, Crop,
  Edit3, CheckSquare, Unlock, Lock, PenTool, EyeOff, Eye,
  Columns, Sparkles, Languages, FileCode2, Download,
  RefreshCw, AlertCircle, CheckCircle2, ArrowLeft,
  Copy, Check, MessageSquare
} from 'lucide-react';

const ICON_MAP = {
  'split-pdf': Scissors,
  'remove-pages': FileX,
  'extract-pages': FileSpreadsheet,
  'organize-pdf': LayoutGrid,
  'scan-to-pdf': Scan,
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
  const [pageRange, setPageRange] = useState('1');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [numberPosition, setNumberPosition] = useState('bottom-right');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [htmlCode, setHtmlCode] = useState('<h1>Sample PDF Document</h1><p>Generated from HTML input.</p>');
  const [signatureText, setSignatureText] = useState('John Doe');
  const [copiedMd, setCopiedMd] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState([]);
  const [compressPreset, setCompressPreset] = useState('recommended');
  const [repairMode, setRepairMode] = useState('standard');
  const [ocrLang, setOcrLang] = useState('English');
  const [cropPercent, setCropPercent] = useState(10);
  const [annotationText, setAnnotationText] = useState('Approved Document');
  const [redactKeywords, setRedactKeywords] = useState('CONFIDENTIAL, INTERNAL');
  const [formName, setFormName] = useState('John Doe');
  const [formEmail, setFormEmail] = useState('john@example.com');

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

  const handleProcess = async () => {
    if (files.length === 0 && toolId !== 'html-to-pdf' && toolId !== 'scan-to-pdf') {
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
      let uploadedFileRec = null;

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        const upRes = await apiFetch('/api/upload', { method: 'POST', body: formData });
        if (!upRes.ok) {
          const upErr = await upRes.json();
          throw new Error(upErr.error || 'Failed to upload file.');
        }
        const upJson = await upRes.json();
        if (upJson.files && upJson.files.length > 0) {
          uploadedFileRec = upJson.files[0];
          uploadedFileId = uploadedFileRec.fileId;
        }
      }

      let apiEndpoint = null;
      let payload = { fileId: uploadedFileId };

      switch (toolId) {
        case 'rotate-pdf':
          apiEndpoint = '/api/pdf/rotate';
          payload.angle = rotationAngle;
          break;
        case 'split-pdf':
          apiEndpoint = '/api/pdf/split';
          payload.pageRange = pageRange;
          break;
        case 'remove-pages':
          apiEndpoint = '/api/pdf/remove-pages';
          payload.pagesToRemove = pageRange;
          break;
        case 'extract-pages':
          apiEndpoint = '/api/pdf/extract-pages';
          payload.pageRange = pageRange;
          break;
        case 'organize-pdf':
          apiEndpoint = '/api/pdf/organize';
          payload.pageOrder = [];
          break;
        case 'add-watermark':
          apiEndpoint = '/api/pdf/watermark';
          payload.text = watermarkText;
          payload.opacity = watermarkOpacity;
          break;
        case 'add-page-numbers':
          apiEndpoint = '/api/pdf/add-page-numbers';
          payload.position = numberPosition;
          break;
        case 'protect-pdf':
          apiEndpoint = '/api/pdf/protect';
          payload.password = password;
          break;
        case 'unlock-pdf':
          apiEndpoint = '/api/pdf/unlock';
          payload.password = password;
          break;
        case 'ai-summarizer':
          apiEndpoint = '/api/pdf/ai-summary';
          break;
        case 'jpg-to-pdf':
        case 'scan-to-pdf':
          apiEndpoint = '/api/pdf/jpg-to-pdf';
          break;
        case 'word-to-pdf':
          apiEndpoint = '/api/pdf/word-to-pdf';
          break;
        case 'powerpoint-to-pdf':
          apiEndpoint = '/api/pdf/ppt-to-pdf';
          break;
        case 'excel-to-pdf':
          apiEndpoint = '/api/pdf/excel-to-pdf';
          break;
        case 'html-to-pdf':
          apiEndpoint = '/api/pdf/html-to-pdf';
          payload.htmlCode = htmlCode;
          break;
        case 'compress-pdf':
          apiEndpoint = '/api/pdf/compress';
          payload.level = compressPreset;
          break;
        case 'crop-pdf':
          apiEndpoint = '/api/pdf/crop';
          payload.cropPercent = cropPercent;
          break;
        case 'edit-pdf':
        case 'pdf-forms':
          apiEndpoint = '/api/pdf/edit';
          payload.annotationText = toolId === 'pdf-forms' ? `Form Field: ${formName} (${formEmail})` : annotationText;
          break;
        case 'sign-pdf':
          apiEndpoint = '/api/pdf/sign';
          payload.signatureText = signatureText;
          break;
        case 'redact-pdf':
          apiEndpoint = '/api/pdf/redact';
          payload.keywords = redactKeywords;
          break;
        case 'translate-pdf':
          apiEndpoint = '/api/pdf/translate';
          payload.targetLang = targetLang;
          break;
        case 'pdf-to-markdown':
          apiEndpoint = '/api/pdf/pdf-to-markdown';
          break;
        case 'pdf-to-jpg':
          apiEndpoint = '/api/pdf/pdf-to-jpg';
          break;
        case 'pdf-to-word':
          apiEndpoint = '/api/pdf/pdf-to-word';
          break;
        case 'pdf-to-excel':
          apiEndpoint = '/api/pdf/pdf-to-excel';
          break;
        case 'pdf-to-powerpoint':
        case 'pdf-to-pdfa':
        case 'compare-pdf':
        case 'ocr-pdf':
        case 'repair-pdf':
          apiEndpoint = '/api/pdf/repair';
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
      let textPreview = procJson.markdownText || null;

      if (toolId === 'ai-summarizer' && procJson.summary) {
        infoText = procJson.summary.executiveSummary;
        textPreview = `✨ AI Document Insights:\n• ${procJson.summary.keyTakeaways.join('\n• ')}\n\n${procJson.summary.aiInsights}`;
      }

      setResult({
        fileId: procJson.fileId,
        downloadUrl: `/api/download/${procJson.fileId}`,
        filename: procJson.originalName,
        infoText,
        expiresAt: procJson.expiresAt || (Date.now() + 3 * 60 * 60 * 1000),
        textPreview
      });

      setIsProcessing(false);
    } catch (err) {
      console.error(`Execution error [${toolId}]:`, err);
      setErrorMsg(err.message || `Failed to execute ${toolName}.`);
      setIsProcessing(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (result?.textPreview) {
      navigator.clipboard.writeText(result.textPreview);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    }
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim() || !result?.fileId) return;
    const currentQ = aiQuestion;
    setAiQuestion('');
    try {
      const res = await apiFetch('/api/pdf/ai-qa', {
        method: 'POST',
        body: JSON.stringify({ fileId: result.fileId, question: currentQ })
      });
      if (res.ok) {
        const json = await res.json();
        setAiAnswers((prev) => [...prev, { question: json.question, answer: json.answer }]);
      } else {
        setAiAnswers((prev) => [...prev, { question: currentQ, answer: 'Could not analyze document question.' }]);
      }
    } catch (e) {
      setAiAnswers((prev) => [...prev, { question: currentQ, answer: 'Error analyzing question.' }]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Tools
      </button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-4">
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
        <div className="space-y-6">
          {toolId !== 'html-to-pdf' && (
            <FileUploader
              accept={toolAccept}
              multiple={toolId === 'jpg-to-pdf' || toolId === 'merge-pdf'}
              onFilesSelected={handleFilesSelected}
              label={files.length > 0 ? `Selected: ${files.map(f => f.name).join(', ')}` : `Drop your file here for ${toolName}`}
              description={`Supports ${toolAccept} up to 50MB.`}
            />
          )}

          {toolId === 'compare-pdf' && files.length > 0 && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">Second PDF File to Compare:</label>
              <FileUploader
                accept=".pdf"
                multiple={false}
                onFilesSelected={handleSecondFileSelected}
                label={secondFile ? `Second File: ${secondFile.name}` : "Drop second PDF to compare"}
                description="Upload second document for side-by-side analysis."
              />
            </div>
          )}

          {toolId === 'rotate-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Rotation Angle:</label>
              <div className="flex gap-4">
                {[90, 180, 270].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotationAngle(angle)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition ${
                      rotationAngle === angle
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Rotate {angle}° CW
                  </button>
                ))}
              </div>
            </div>
          )}

          {(toolId === 'split-pdf' || toolId === 'remove-pages' || toolId === 'extract-pages') && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                {toolId === 'split-pdf' ? 'Page Range to Split (e.g., 1-3 or 1,2,5):' :
                 toolId === 'remove-pages' ? 'Page Numbers to Delete (e.g., 2, 4):' :
                 'Page Numbers to Extract (e.g., 1, 3, 5):'}
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g. 1-3"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {toolId === 'add-watermark' && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Watermark Text:</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          )}

          {toolId === 'add-page-numbers' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Position on Page:</label>
              <select
                value={numberPosition}
                onChange={(e) => setNumberPosition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="top-right">Top Right</option>
              </select>
            </div>
          )}

          {toolId === 'protect-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Type a password to protect your PDF file:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Repeat password to protect your PDF file:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 pr-12"
                  />
                </div>
              </div>

              {password && confirmPassword && (
                <div className={`text-xs font-semibold flex items-center gap-1.5 ${password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Passwords match! PDF will be encrypted with 256-bit AES protection.
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" /> Passwords do not match.
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {toolId === 'unlock-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter current PDF password to unlock:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to unlock PDF"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {toolId === 'sign-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Signature Name / Text:</label>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Enter full name for signature"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {toolId === 'html-to-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">HTML Source Code:</label>
              <textarea
                rows={6}
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {toolId === 'compress-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Compression Preset:</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'recommended', label: 'Recommended', desc: 'Good quality, 50% smaller' },
                  { id: 'extreme', label: 'Extreme', desc: 'Max compression, 75% smaller' },
                  { id: 'low', label: 'Low', desc: 'Highest quality, 25% smaller' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCompressPreset(preset.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      compressPreset === preset.id
                        ? 'bg-rose-600/20 border-rose-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{preset.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {toolId === 'repair-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Repair Strategy:</label>
              <select
                value={repairMode}
                onChange={(e) => setRepairMode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="standard">Standard Stream Repair & XRef Rebuild</option>
                <option value="deep">Deep Header & Object Reconstruction</option>
              </select>
            </div>
          )}

          {toolId === 'ocr-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">OCR Language Recognition:</label>
              <select
                value={ocrLang}
                onChange={(e) => setOcrLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="English">English (eng)</option>
                <option value="Spanish">Spanish (spa)</option>
                <option value="French">French (fra)</option>
                <option value="German">German (deu)</option>
                <option value="Hindi">Hindi (hin)</option>
                <option value="Chinese">Chinese (chi_sim)</option>
              </select>
            </div>
          )}

          {toolId === 'crop-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Crop Margin Percentage: {cropPercent}%</label>
              <input
                type="range"
                min="5"
                max="25"
                step="5"
                value={cropPercent}
                onChange={(e) => setCropPercent(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          )}

          {toolId === 'edit-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Text Annotation to Add:</label>
              <input
                type="text"
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Enter text annotation"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {toolId === 'redact-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Keywords / Terms to Blackout (comma separated):</label>
              <input
                type="text"
                value={redactKeywords}
                onChange={(e) => setRedactKeywords(e.target.value)}
                placeholder="e.g. CONFIDENTIAL, SECRET, SSN"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {toolId === 'pdf-forms' && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name:</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address:</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {toolId === 'translate-pdf' && (
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Target Language:</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Chinese">Chinese (中文)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
              </select>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-base shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconComponent className="w-5 h-5" />
                  Run {toolName} Now
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">Processing Complete!</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">{result.infoText}</p>
          </div>

          {result.textPreview && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {result.textPreview}
            </div>
          )}

          {toolId === 'ai-summarizer' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> Ask AI About This Document
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask any question (e.g. What are the key conclusions?)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
                <button
                  onClick={handleAskAi}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Ask
                </button>
              </div>

              {aiAnswers.map((ans, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                  <p className="font-semibold text-rose-300">Q: {ans.question}</p>
                  <p className="text-slate-300 mt-1">{ans.answer}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <CountdownTimer expiresAt={result.expiresAt} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => downloadFile(result.fileId, result.filename)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center gap-2 transition"
            >
              <Download className="w-5 h-5" /> Download {result.filename}
            </button>

            {result.textPreview && (
              <button
                onClick={handleCopyMarkdown}
                className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition"
              >
                {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedMd ? 'Copied!' : 'Copy Text'}
              </button>
            )}

            <button
              onClick={() => setResult(null)}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" /> Process Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
