import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const APK_URL = 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.2/OmniPDF-app-debug.apk';

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

async function preparePhoneTestV042() {
  console.log('Preparing phone-test for v0.4.2...');
  const outDir = path.resolve('phone-test');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const apkPath = path.join(outDir, 'OmniPDF-app-debug.apk');
  console.log(`Downloading v0.4.2 APK from: ${APK_URL}...`);
  const apkSize = await downloadFile(APK_URL, apkPath);
  const apkSha = await calculateSha256(apkPath);
  console.log(`✅ Downloaded v0.4.2 APK: ${(apkSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   SHA256: ${apkSha}\n`);

  // QR code
  const qrPath = path.join(outDir, 'omnipdf-v0.4.2-qr.png');
  const encodedUrl = encodeURIComponent(APK_URL);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=20&data=${encodedUrl}`;
  await downloadFile(qrApiUrl, qrPath);
  console.log(`✅ QR Code saved to: ${qrPath}`);

  return { apkSha, apkSize };
}

preparePhoneTestV042().catch(console.error);
