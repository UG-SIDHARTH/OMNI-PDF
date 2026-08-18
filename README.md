# OMNI-PDF

**OMNI-PDF** is a web-based PDF toolkit — upload a PDF (or image), run it through a set of processing tools, and download the result. Built with a React front end and a small Express API for server-side file handling.

🔗 **Live app:** [omnipdf.ugsidharth.in](https://omnipdf.ugsidharth.in)
📦 **Repo:** [UG-SIDHARTH/OMNI-PDF](https://github.com/UG-SIDHARTH/OMNI-PDF)

---

## ✨ Features

Based on the toolset baked into the project, OMNI-PDF supports:

- **PDF manipulation** — merge, split, and edit PDFs (via `pdf-lib`)
- **Image background removal** — strip backgrounds from images client-side (via `@imgly/background-removal`)
- **File uploads** — drag-and-drop / multi-file upload handling (via `multer`)
- **Rate-limited API** — protects the server from abuse (via `express-rate-limit`)
- **Smooth UI/UX** — animated transitions and a modern interface (via `framer-motion`, `lucide-react`, Tailwind CSS)

> Update this list with the exact tools exposed in the UI (e.g. Merge, Split, Compress, Watermark, Rotate, Convert) if it differs from the above.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| PDF processing | `pdf-lib` |
| Image processing | `@imgly/background-removal` |
| File uploads | `multer`, `uuid` |
| Deployment | Docker |

---

## 📁 Project Structure

```
OMNI-PDF/
├── src/                 # React frontend source
├── server/              # Express backend (API, upload handling)
├── storage/uploads/      # Uploaded/processed files (runtime storage)
├── dist/                 # Production build output
├── Dockerfile
├── docker-compose.yml
├── config.yml
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm

### Installation

```bash
git clone https://github.com/UG-SIDHARTH/OMNI-PDF.git
cd OMNI-PDF
npm install
```

### Development

Run the frontend (Vite) and backend (Express) together:

```bash
npm start
```

Or run them separately:

```bash
npm run dev      # Vite dev server (frontend)
npm run server   # Express server (backend)
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🐳 Run with Docker

The project ships with a `Dockerfile` and `docker-compose.yml` that build and serve the app on **port 8091**.

```bash
docker compose up --build
```

The app will be available at `http://localhost:8091`.

Environment variables used:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8091` | Port the Express server listens on |
| `NODE_ENV` | `production` | Node environment |

Uploaded/processed files persist in a Docker volume mounted at `/app/storage/uploads`.

---

## ⚙️ Configuration

Project-level settings live in `config.yml` — check this file for any tunable options (limits, storage paths, etc.) before deploying.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2026 SIDHARTH D

---

## 🙋 Author

**SIDHARTH D** — [@UG-SIDHARTH](https://github.com/UG-SIDHARTH)

---

## 🤝 Contributing

Issues and pull requests are welcome. If you're adding a new PDF/image tool, please keep it consistent with the existing UI patterns in `src/`.
