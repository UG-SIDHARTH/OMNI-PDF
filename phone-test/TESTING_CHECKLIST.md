# 📱 OmniPDF Android APK (v0.4.2) Manual Testing Checklist

**Target**: `OmniPDF-app-debug.apk` (v0.4.2)  
**Published SHA-256 Checksum**: `b56c575476b7db8e8158ef5af2831692dc3e7c00c18fed32da651f94896aac36`  
**Direct Download URL**: [https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.2/OmniPDF-app-debug.apk](https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.2/OmniPDF-app-debug.apk)  
**QR Code for Phone Camera**: `phone-test/omnipdf-v0.4.2-qr.png`

---

## 📥 1. Installation & OS Prompts

| Step | Expected Behavior | Result (PASS / FAIL) | Notes |
| :--- | :--- | :---: | :--- |
| **Download APK** | Downloads ~11.9 MB APK via browser or QR scan | [ ] | |
| **OS Security Prompt** | Android prompts: *"Install unknown apps"* / *"Unrecognized developer"*. *(Expected for debug-signed build)* | [ ] | |
| **Complete Install** | App installs in < 3 seconds with name **OmniPDF** | [ ] | |
| **Brand App Icon** | Home screen shows official coral-amber gradient squircle icon with white layers | [ ] | |
| **Initial Launch** | App opens immediately into dark theme without white screen/flash | [ ] | |

---

## 🟢 2. Offline Client-Side Tools (Expected: 100% PASS Fully Offline)

These tools run completely in-memory inside the mobile WebView engine via JavaScript/WASM and do not require any backend server.

| Tool Name | Tool ID | Expected Action & Result | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Image to PDF (JPG to PDF)** | `jpg-to-pdf` | Pick image(s) from phone gallery -> assemble PDF -> triggers Android native share/save sheet | [ ] | |
| **Merge PDF (Client-side)** | `merge-pdf` | Pick multiple PDF files -> merge pages in memory -> download merged PDF | [ ] | |
| **AI Background Remover** | `background-remover` | Pick a portrait/object photo -> AI segments background via WebAssembly -> export PNG | [ ] | *(Note: takes 3-10s depending on device RAM/CPU)* |

---

## ⚠️ 3. Server-Dependent Tools (Expected: Clear On-Screen Error Notice, NO Crash/Hang)

These tools rely on the desktop/backend Express engine. When run on mobile without a reachable backend server, they **MUST NOT freeze, spin forever, or crash the app**. They must immediately catch the network refusal and display a red error banner (`Failed to fetch` or `Failed to execute [ToolName]`).

### Category: Organize PDF
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Split PDF** | `split-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Remove Pages** | `remove-pages` | Shows red error banner on submit; spinner stops | [ ] | |
| **Extract Pages** | `extract-pages` | Shows red error banner on submit; spinner stops | [ ] | |
| **Organize PDF** | `organize-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Scan to PDF** | `scan-to-pdf` | Shows red error banner on submit; spinner stops | [ ] | |

### Category: Optimize PDF
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Compress PDF** | `compress-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Repair PDF** | `repair-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **OCR PDF** | `ocr-pdf` | Shows red error banner on submit; spinner stops | [ ] | |

### Category: Convert to PDF
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Word to PDF** | `word-to-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **PowerPoint to PDF** | `powerpoint-to-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Excel to PDF** | `excel-to-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **HTML to PDF** | `html-to-pdf` | Shows red error banner on submit; spinner stops | [ ] | |

### Category: Convert from PDF
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **PDF to JPG** | `pdf-to-jpg` | Shows red error banner on submit; spinner stops | [ ] | |
| **PDF to Word** | `pdf-to-word` | Shows red error banner on submit; spinner stops | [ ] | |
| **PDF to PowerPoint** | `pdf-to-powerpoint` | Shows red error banner on submit; spinner stops | [ ] | |
| **PDF to Excel** | `pdf-to-excel` | Shows red error banner on submit; spinner stops | [ ] | |
| **PDF to PDF/A** | `pdf-to-pdfa` | Shows red error banner on submit; spinner stops | [ ] | |

### Category: Edit PDF
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Rotate PDF** | `rotate-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Add Page Numbers** | `add-page-numbers` | Shows red error banner on submit; spinner stops | [ ] | |
| **Add Watermark** | `add-watermark` | Shows red error banner on submit; spinner stops | [ ] | |
| **Crop PDF** | `crop-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Edit PDF** | `edit-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **PDF Forms** | `pdf-forms` | Shows red error banner on submit; spinner stops | [ ] | |

### Category: PDF Security
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Unlock PDF** | `unlock-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Protect PDF** | `protect-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Sign PDF** | `sign-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Redact PDF** | `redact-pdf` | Shows red error banner on submit; spinner stops | [ ] | |
| **Compare PDF** | `compare-pdf` | Shows red error banner on submit; spinner stops | [ ] | |

### Category: PDF Intelligence (AI)
| Tool Name | Tool ID | Expected Behavior on Phone | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **AI Summarizer** | `ai-summarizer` | Shows red error banner or 'Coming Soon' notice | [ ] | |
| **Translate PDF** | `translate-pdf` | Shows red error banner or 'Coming Soon' notice | [ ] | |
| **PDF to Markdown** | `pdf-to-markdown` | Shows red error banner or 'Coming Soon' notice | [ ] | |

---

## 🔄 4. Basic Android Lifecycle & Stability

| Action | Steps | Expected Result | Result (PASS / FAIL) | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Background & Resume** | Press Home button -> reopen app from Recent Apps | App state persists, no crash or reload loop | [ ] | |
| **Screen Rotation** | Rotate phone between Portrait and Landscape | Responsive layout adapts cleanly without crash | [ ] | |
| **Force-Close & Relaunch** | Swipe away from Recent Apps -> launch fresh | Reopens cleanly to main grid | [ ] | |
