import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const APK_URL = 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.1/OmniPDF-app-debug.apk';
const EXPECTED_SHA256 = '8b08f6ef376b52a9f4bab253417323587b0eb33874a3406f589e05932ba7de76';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const handleReq = (currUrl) => {
      https.get(currUrl, { headers: { 'User-Agent': 'OmniPDF-Phone-Test-Prep' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          return handleReq(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${currUrl}`));
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(() => resolve(fs.statSync(destPath).size));
        });
      }).on('error', reject);
    };
    handleReq(url);
  });
}

function calculateSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function preparePhoneTest() {
  console.log('================================================================');
  console.log('📱 PREPARING MANUAL PHONE TESTING ASSETS');
  console.log('================================================================\n');

  const outDir = path.resolve('phone-test');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Download APK
  const apkPath = path.join(outDir, 'OmniPDF-app-debug.apk');
  console.log(`Downloading APK from: ${APK_URL}...`);
  const apkSize = await downloadFile(APK_URL, apkPath);
  console.log(`✅ Downloaded APK: ${(apkSize / (1024 * 1024)).toFixed(2)} MB (${apkSize.toLocaleString()} bytes)`);

  // 2. Verify Checksum
  const calculatedSha = await calculateSha256(apkPath);
  console.log(`Calculated SHA256: ${calculatedSha}`);
  console.log(`Expected SHA256  : ${EXPECTED_SHA256}`);
  const match = calculatedSha === EXPECTED_SHA256;
  console.log(`Checksum Match   : ${match ? '🟢 100% MATCH' : '❌ MISMATCH'}\n`);

  if (!match) {
    throw new Error('Downloaded APK checksum does not match official release!');
  }

  // 3. Generate QR Code Image using standard QR Code API
  const qrPath = path.join(outDir, 'omnipdf-v0.4.1-qr.png');
  const encodedUrl = encodeURIComponent(APK_URL);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=20&data=${encodedUrl}`;
  console.log(`Fetching QR code image from QR generator...`);
  await downloadFile(qrApiUrl, qrPath);
  console.log(`✅ QR Code saved to: ${qrPath}\n`);

  console.log('🎉 Phone test directory ready with APK and QR code.');
}

preparePhoneTest().catch(err => {
  console.error('Error preparing phone test:', err);
  process.exit(1);
});
