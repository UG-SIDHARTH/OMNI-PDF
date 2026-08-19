import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { PDFDocument } from 'pdf-lib';

const outDir = path.resolve('scratch/images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let k = n;
    for (let m = 0; m < 8; m++) {
      if (k & 1) k = 0xedb88320 ^ (k >>> 1);
      else k = k >>> 1;
    }
    table[n] = k;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const typeAndData = Buffer.alloc(4 + len);
  typeAndData.write(type, 0, 4, 'ascii');
  data.copy(typeAndData, 4);

  const crc = crc32(typeAndData);
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeAndData.copy(chunk, 4);
  chunk.writeUInt32BE(crc, 4 + 4 + len);
  return chunk;
}

export function createPng(width, height, colorRgb) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8 bit
  ihdrData[9] = 2;  // RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const scanlines = Buffer.alloc(height * (1 + width * 3));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    scanlines[pos++] = 0; // null filter
    for (let x = 0; x < width; x++) {
      scanlines[pos++] = colorRgb[0];
      scanlines[pos++] = colorRgb[1];
      scanlines[pos++] = colorRgb[2];
    }
  }

  const compressed = zlib.deflateSync(scanlines);

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const portraitPng = createPng(300, 450, [239, 68, 68]);   // Red 300x450
const landscapePng = createPng(600, 337, [59, 130, 246]); // Blue 600x337
const squarePng = createPng(400, 400, [16, 185, 129]);   // Green 400x400

fs.writeFileSync(path.join(outDir, 'portrait_photo.png'), portraitPng);
fs.writeFileSync(path.join(outDir, 'landscape_photo.png'), landscapePng);
fs.writeFileSync(path.join(outDir, 'square_photo.png'), squarePng);

async function verify() {
  const pdfDoc = await PDFDocument.create();
  const img = await pdfDoc.embedPng(portraitPng);
  console.log(`✅ Validated PNG generation with pdf-lib: Embedded dimensions ${img.width}x${img.height}`);
}
verify();
