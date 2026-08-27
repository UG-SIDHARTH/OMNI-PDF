## OmniPDF v0.4.1

### 🚨 Critical Fix
- **Windows desktop app (.exe) failed to start on any machine without the developer's local Node.js dependencies present.** The embedded backend server threw `ERR_MODULE_NOT_FOUND: Cannot find package 'express'` on a clean install — meaning v0.4.0 did not actually work for real users. Root cause: the server was extracted outside the app's packaged archive while its dependencies stayed inside it, so Node's module resolver couldn't find them at runtime.
  - **Fix**: the backend server and all its dependencies are now bundled into a single self-contained file at build time (via esbuild), removing any runtime dependency resolution. Verified working on a fully isolated clean machine with zero relation to the build environment.
  - **If you downloaded v0.4.0 and it wouldn't launch or its tools failed to run, this release fixes that. Please upgrade.**

### ⚠️ Known Limitations (please read before downloading)

- **Protect PDF / Unlock PDF require `qpdf` to be installed separately.**
  `qpdf` is not bundled inside the app. If it's missing, these two tools will fail with a clear error message telling you how to install it:
  - Windows: `winget install qpdf`
  - macOS: `brew install qpdf`
  - Linux: `apt install qpdf`
  All other tools work without qpdf.

- **The Android APK is a debug-signed build**, intended for direct sideloading/testing rather than production distribution. Android will show an "unknown app source" warning on install — this is expected for a debug build, not a sign of tampering.

- **On Android, only client-side tools currently work fully offline**: Image to PDF, Merge PDF, and AI Background Remover. The remaining PDF tools (OCR, format conversion, page editing, security tools, etc.) require the desktop app's backend server, which doesn't run on mobile. These tools fail with a clear on-screen error on Android rather than hanging — but they don't currently work on mobile. Support for these on Android is on the roadmap.

### What's Included
- `OmniPDF-Setup-0.4.1.exe` — Windows installer (recommended)
- `OmniPDF-0.4.1.exe` — Windows portable, no install required
- `OmniPDF-app-debug.apk` — Android sideload build (client-side tools only; see limitations above)

---
**Full Changelog**: [v0.4.0...v0.4.1](https://github.com/UG-SIDHARTH/OMNI-PDF/compare/v0.4.0...v0.4.1)
