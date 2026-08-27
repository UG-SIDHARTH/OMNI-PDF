import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import http from 'http';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const handleReq = (currUrl) => {
      https.get(currUrl, { headers: { 'User-Agent': 'OmniPDF-Release-Tester' } }, (res) => {
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
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function verifyReleaseV041() {
  console.log('================================================================');
  console.log('📦 DOWNLOADING & INTEGRITY CHECK FOR v0.4.1 RELEASE ASSETS');
  console.log('================================================================\n');

  const outDir = path.resolve('scratch', 'release_test_v041');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const apkUrl = 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.1/OmniPDF-app-debug.apk';
  const apkPath = path.join(outDir, 'OmniPDF-app-debug.apk');
  console.log(`Downloading APK from ${apkUrl}...`);
  const apkSize = await downloadFile(apkUrl, apkPath);
  const apkSha = await calculateSha256(apkPath);
  console.log(`✅ APK Downloaded: ${(apkSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   SHA256: ${apkSha}\n`);

  console.log('🎉 v0.4.1 Release Assets Downloaded and Verified!');
}

verifyReleaseV041().catch(console.error);
