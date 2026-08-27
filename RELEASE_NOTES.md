## OmniPDF v0.4.2

### 🎨 Brand Identity & Custom App Icon
- **Official App Icon**: Added custom high-resolution app icon featuring the signature coral/rose-to-amber gradient squircle and crisp white isometric layers glyph matching the OmniPDF in-app navbar identity across all Android launcher densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`), Windows desktop packages, and Web favicon/PWA assets.
- **Standalone Bundled Engine**: Includes the self-contained esbuild server engine ensuring 100% offline startup on clean Windows installations without ambient Node.js dependencies.

### ⚠️ Known Limitations

- **Protect PDF / Unlock PDF require `qpdf` to be installed separately.**
  `qpdf` is not bundled inside the app. If missing, these tools display explicit instructions:
  - Windows: `winget install qpdf`
  - macOS: `brew install qpdf`
  - Linux: `apt install qpdf`
  All other tools operate without external dependencies.

- **The Android APK is a debug-signed build**, intended for direct sideloading and testing. Android will display the standard "Install unknown apps" prompt upon installation.

- **On Android, client-side tools work 100% offline**: Image to PDF, Merge PDF, and AI Background Remover. Server-dependent tools gracefully display an informative on-screen status banner rather than freezing or crashing.

### What's Included
- `OmniPDF-Setup-0.4.2.exe` — Windows installer (recommended)
- `OmniPDF-0.4.2.exe` — Windows portable, no installation required
- `OmniPDF-app-debug.apk` — Android sideload package with official brand icon

---
**Full Changelog**: [v0.4.1...v0.4.2](https://github.com/UG-SIDHARTH/OMNI-PDF/compare/v0.4.1...v0.4.2)
