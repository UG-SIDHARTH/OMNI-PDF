import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

async function bundleServer() {
  console.log('[Build Server]: Compiling self-contained server bundle with esbuild...');
  const outDir = path.resolve('dist-server');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const bannerJs = `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
if (typeof DOMMatrix === 'undefined') globalThis.DOMMatrix = class DOMMatrix {};
if (typeof ImageData === 'undefined') globalThis.ImageData = class ImageData {};
if (typeof Path2D === 'undefined') globalThis.Path2D = class Path2D {};
`;

  await build({
    entryPoints: ['server/index.js'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    banner: { js: bannerJs },
    outfile: path.join(outDir, 'index.mjs')
  });

  console.log('[Build Server]: Bundled dist-server/index.mjs successfully.');

  // Locate and copy pdf.worker.mjs next to index.mjs
  const workerSrcCandidates = [
    path.resolve('node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs'),
    path.resolve('node_modules', 'pdf-parse', 'dist', 'worker', 'pdf.worker.mjs'),
    path.resolve('node_modules', 'pdf-parse', 'dist', 'pdf-parse', 'esm', 'pdf.worker.mjs')
  ];

  let copied = false;
  for (const src of workerSrcCandidates) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outDir, 'pdf.worker.mjs'));
      console.log(`[Build Server]: Copied pdf.worker.mjs from ${src}`);
      copied = true;
      break;
    }
  }

  if (!copied) {
    console.warn('[Build Server Warning]: Could not find pdf.worker.mjs source in node_modules.');
  }

  console.log('[Build Server]: Server bundling complete!');
}

bundleServer().catch(err => {
  console.error('[Build Server Error]:', err);
  process.exit(1);
});
