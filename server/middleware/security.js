import fs from 'fs';
import path from 'path';

// Magic byte definitions
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2D], // %PDF-
  png: [0x89, 0x50, 0x4E, 0x47],       // .PNG
  jpg: [0xFF, 0xD8, 0xFF],            // JPEG/JPG
};

/**
 * Validates magic bytes of uploaded file against expected type
 */
export function validateMagicBytes(expectedType) {
  return (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      try {
        const buffer = fs.readFileSync(file.path);
        if (buffer.length < 4) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ error: `File '${file.originalname}' is too small or corrupted.` });
        }

        if (expectedType === 'pdf') {
          const isPdf = MAGIC_BYTES.pdf.every((b, idx) => buffer[idx] === b);
          if (!isPdf) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
              error: `File '${file.originalname}' failed MIME/magic-byte security inspection. Expected a valid PDF document. Executables and spoofed extensions are strictly rejected.`
            });
          }
        } else if (expectedType === 'image') {
          const isPng = MAGIC_BYTES.png.every((b, idx) => buffer[idx] === b);
          const isJpg = MAGIC_BYTES.jpg.every((b, idx) => buffer[idx] === b);
          if (!isPng && !isJpg) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
              error: `File '${file.originalname}' failed MIME/magic-byte security inspection. Expected a valid JPG or PNG image.`
            });
          }
        }
      } catch (err) {
        return res.status(500).json({ error: `Error validating file: ${err.message}` });
      }
    }

    next();
  };
}

/**
 * Ensures anonymous session ID exists in cookie/header or generates a new one
 */
export function ensureSession(req, res, next) {
  let sessionId = req.cookies['x-session-id'] || req.headers['x-session-id'];
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.cookie('x-session-id', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
  req.sessionId = sessionId;
  next();
}
