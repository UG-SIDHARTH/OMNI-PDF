<div align="center">

# 📄 OmniPDF Pro Suite

**The Ultimate All-in-One, Privacy-First PDF & Media Processing Toolkit**

[![Release](https://img.shields.io/github/v/release/UG-SIDHARTH/OMNI-PDF?color=rose&label=Release&style=flat-square)](https://github.com/UG-SIDHARTH/OMNI-PDF/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20Android-emerald?style=flat-square)](#-downloads--platforms)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Offline%20First-purple?style=flat-square)](#-privacy--security)

[**🌐 Launch Web App**](https://omnipdf.ugsidharth.in) • [**📥 Download Desktop & Mobile Apps**](https://github.com/UG-SIDHARTH/OMNI-PDF/releases/latest) • [**Report Bug**](https://github.com/UG-SIDHARTH/OMNI-PDF/issues)

</div>

---

## 🌟 Overview

**OmniPDF** is a comprehensive, production-grade PDF and media manipulation suite. Engineered with an **offline-first, zero-knowledge** architecture, OmniPDF processes your sensitive documents directly in your browser or local device without uploading files to third-party cloud servers.

Available as a **High-Performance Web App (PWA)**, **Native Windows Desktop App (.exe)**, and **Android Mobile Package (.apk)**.

---

## 📥 Downloads & Platforms

| Platform | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **Windows Desktop** | `.exe` (Installer) | Full Windows Setup with desktop & start menu shortcuts | [Download .exe](https://github.com/UG-SIDHARTH/OMNI-PDF/releases/latest) |
| **Windows Portable** | `.exe` (Standalone) | Portable single-file executable, zero installation needed | [Download Portable](https://github.com/UG-SIDHARTH/OMNI-PDF/releases/latest) |
| **Android Mobile** | `.apk` (Capacitor) | Native Android package with camera document scanner | [Download .apk](https://github.com/UG-SIDHARTH/OMNI-PDF/releases/latest) |
| **Web App / PWA** | Web / PWA | Instant browser experience, installable to Home Screen | [Launch Web App](https://omnipdf.ugsidharth.in) |

---

## 🛠️ Complete Toolset (30+ Tools)

OmniPDF provides a complete suite of modular document and media processing tools:

### 📁 1. Organize PDF
- **Merge PDF** — Combine multiple PDFs into a single unified document in seconds.
- **Split PDF** — Extract specific page ranges or split into independent PDF files.
- **Remove Pages** — Delete unwanted pages visually with single-click precision.
- **Extract Pages** — Pick individual pages and create a new custom document.
- **Organize PDF** — Drag-and-drop page reordering, rotation, and custom arrangement.
- **Scan to PDF** — Capture camera scans directly into searchable PDF documents.

### ⚡ 2. Optimize PDF
- **Compress PDF** — Multi-level PDF compression (Low, Medium, High) retaining visual fidelity.
- **Repair PDF** — Reconstruct damaged PDF cross-reference tables and recover readable streams.
- **OCR PDF** — Extract selectable, searchable text from scanned PDFs using client-side Tesseract OCR.

### 🔄 3. Convert to PDF
- **JPG / PNG / WebP to PDF** — Multi-image to PDF with custom margins, orientation, and layout grids.
- **WORD to PDF** — Convert `.docx` documents to PDF.
- **POWERPOINT to PDF** — Convert `.pptx` presentations into PDF slides.
- **EXCEL to PDF** — Convert `.xlsx` spreadsheets to tabular PDF sheets.
- **HTML to PDF** — Render web pages and HTML source directly to PDF format.

### 🔄 4. Convert from PDF
- **PDF to JPG / PNG** — High-resolution rasterization of PDF pages to image formats.
- **PDF to WORD (.docx)** — Extract structured content into editable Microsoft Word documents.
- **PDF to POWERPOINT (.pptx)** — Export PDF pages as slide decks.
- **PDF to EXCEL (.xlsx)** — Parse tabular data from PDFs into spreadsheet workbooks.
- **PDF to PDF/A** — Archive-compliant standardization for long-term document preservation.
- **PDF to Text** — Fast raw text extraction from document layers.

### ✏️ 5. Edit & Security
- **Rotate PDF** — 90°, 180°, and 270° orientation corrections.
- **Page Numbers** — Customizable page numbering (headers, footers, formats, margins).
- **Watermark** — Text and image watermarking with custom opacity, rotation, and layer positioning.
- **Edit & Annotate PDF** — Draw, highlight, insert shapes, and add signatures.
- **Protect PDF** — Enterprise-grade password encryption.
- **Unlock PDF** — Remove password security from authorized documents.
- **Crop PDF** — Trim margins and define custom document dimensions.
- **Compare PDF** — Side-by-side visual difference comparison across versions.
- **Redact PDF** — Blackout sensitive text, numbers, and private data.
- **Sign PDF** — Draw, type, or upload digital signatures to legal agreements.

### 🪄 6. AI & Media Processing
- **AI Background Remover** — 100% on-device AI background removal powered by ONNX Runtime and WebAssembly (`@imgly/background-removal` & Transformers.js).

---

## 🔒 Privacy & Security

- **Zero Cloud Uploads**: Client-side and desktop engines process documents locally in memory or local storage.
- **Air-Gapped Operation**: Run the desktop app or PWA completely offline without an active internet connection.
- **Safe In-Memory Processing**: File buffers are cleared immediately upon task completion.

---

## 🏗️ Architecture & Tech Stack

```
OMNI-PDF/
├── src/                      # React 19 Frontend (Vite, Tailwind CSS, Lucide Icons)
│   ├── components/           # UI Components (Navbar, ToolGrid, Modals, Shared Controls)
│   ├── tools/                # Specialized Tool Engines (UniversalEngine, BgRemover, etc.)
│   └── data/                 # Tool Metadata & Categories
├── server/                   # Optional Local Node/Express Microservice Engine
│   ├── routes/               # API Tool Endpoints
│   ├── middleware/           # Rate limiting & Security Headers
│   └── test/                 # Comprehensive Tool Validation Test Suites
├── electron/                 # Electron Desktop Wrapper & Offline Bridge
├── android/                  # Android Capacitor Native App Project
├── public/                   # Static Icons, PWA Manifest, WASM Binaries
├── dist/                     # Optimized Frontend Build Output
└── release/                  # Packaged Windows Executables (.exe)
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Desktop Wrapper** | Electron 43, Electron Builder (NSIS & Portable) |
| **Mobile Runtime** | Capacitor 8 (Android Native Bridge) |
| **PDF Engines** | `pdf-lib`, `pdf-parse`, `docx`, `xlsx`, `pptxgenjs` |
| **AI / OCR Engines** | `@imgly/background-removal`, `@xenova/transformers`, `tesseract.js` |
| **Local API Engine** | Node.js, Express, Multer |
| **CI / CD Pipeline** | GitHub Actions (Multi-platform automated binary releases) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or v22 LTS recommended)
- `npm` (v10+)

### 1. Clone & Install

```bash
git clone https://github.com/UG-SIDHARTH/OMNI-PDF.git
cd OMNI-PDF
npm install
```

### 2. Run Development Server

```bash
# Runs Vite frontend and local Express server concurrently
npm start
```

Or run services individually:
```bash
npm run dev      # Frontend dev server (http://localhost:5173)
npm run server   # Local Express engine (http://localhost:8091)
```

---

## 📦 Building Desktop & Mobile Binaries

### 🖥️ Windows Desktop Executable (`.exe`)
Builds both the NSIS installer and the standalone portable `.exe` into [`release/`](./release):
```bash
npm run electron:build:win
```

### 📱 Android Native Package (`.apk`)
Sync the web bundle into the native Android Capacitor project:
```bash
npm run cap:sync
```
To open in Android Studio:
```bash
npm run cap:open:android
```
Or build the APK via Gradle:
```bash
cd android
./gradlew assembleDebug
```

---

## 🐳 Docker Deployment

OmniPDF includes a production-ready `Dockerfile` and `docker-compose.yml`:

```bash
docker compose up --build -d
```

The containerized app will be live at `http://localhost:8091`.

---

## 🧪 Testing

Run backend engine and tool verification test suites:

```bash
npm test
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

Copyright (c) 2026 **SIDHARTH D**

---

## 👨‍💻 Author

**SIDHARTH D**
- GitHub: [@UG-SIDHARTH](https://github.com/UG-SIDHARTH)
- Website: [ugsidharth.in](https://ugsidharth.in)
- Project App: [omnipdf.ugsidharth.in](https://omnipdf.ugsidharth.in)
