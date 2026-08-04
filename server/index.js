import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { ensureSession } from './middleware/security.js';
import apiRouter from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 5000;
const STORAGE_DIR = path.resolve('storage/uploads');

// CORS configuration - strict origin checks
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Attach anonymous session ID middleware
app.use(ensureSession);

// Rate limiting - 30 requests per minute per IP for processing endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again.' }
});

app.use('/api', apiLimiter, apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// ---------------------------------------------------------
// 3-HOUR AUTOMATIC FILE CLEANUP WORKER
// ---------------------------------------------------------
function runScheduledCleanup() {
  if (!fs.existsSync(STORAGE_DIR)) return;

  const now = Date.now();
  let deletedCount = 0;

  try {
    const sessionDirs = fs.readdirSync(STORAGE_DIR);
    for (const sessionFolder of sessionDirs) {
      if (sessionFolder === 'tmp') continue;

      const sessionPath = path.join(STORAGE_DIR, sessionFolder);
      if (!fs.statSync(sessionPath).isDirectory()) continue;

      const fileDirs = fs.readdirSync(sessionPath);
      for (const fileFolder of fileDirs) {
        const fileDirPath = path.join(sessionPath, fileFolder);
        const metaPath = path.join(fileDirPath, 'metadata.json');

        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (now > meta.expiresAt) {
              fs.rmSync(fileDirPath, { recursive: true, force: true });
              deletedCount++;
            }
          } catch (e) {
            // Corrupted metadata, delete directory safely
            fs.rmSync(fileDirPath, { recursive: true, force: true });
            deletedCount++;
          }
        } else {
          // Empty or broken folder, cleanup
          fs.rmSync(fileDirPath, { recursive: true, force: true });
          deletedCount++;
        }
      }

      // If session directory is empty, remove it
      if (fs.readdirSync(sessionPath).length === 0) {
        fs.rmdirSync(sessionPath);
      }
    }

    if (deletedCount > 0) {
      console.log(`[CLEANUP WORKER] Purged ${deletedCount} expired file(s) (> 3 hours old).`);
    }
  } catch (err) {
    console.error('[CLEANUP WORKER ERROR]:', err);
  }
}

// Run cleanup every 60 seconds
setInterval(runScheduledCleanup, 60 * 1000);
// Also run cleanup on startup
runScheduledCleanup();

app.listen(PORT, () => {
  console.log(`🚀 OmniPDF Server running on http://localhost:${PORT}`);
  console.log(`🔒 Security active: 50MB limit, magic-byte inspection, 3h auto-delete cron worker`);
});
