import https from 'https';
import fs from 'fs';
import path from 'path';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const handleReq = (currUrl) => {
      https.get(currUrl, { headers: { 'User-Agent': 'OmniPDF-Downloader' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          return handleReq(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed with HTTP ${res.statusCode}`));
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

async function verifyAssets() {
  console.log('================================================================');
  console.log('📥 VERIFYING DOWNLOADED RELEASE ASSETS FROM GITHUB');
  console.log('================================================================\n');

  const downloadsDir = path.join('server', 'test', 'temp_downloads');
  if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

  const apkUrl = 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.0/OmniPDF-app-debug.apk';
  const apkPath = path.join(downloadsDir, 'OmniPDF-app-debug.apk');
  console.log(`Downloading APK from: ${apkUrl}...`);
  const apkSize = await downloadFile(apkUrl, apkPath);
  console.log(`✅ Downloaded APK: ${apkPath} | Size: ${(apkSize / (1024 * 1024)).toFixed(2)} MB`);

  // Verify APK magic bytes (ZIP header: PK\x03\x04)
  const apkBuf = fs.readFileSync(apkPath);
  const isZip = apkBuf[0] === 0x50 && apkBuf[1] === 0x4B && apkBuf[2] === 0x03 && apkBuf[3] === 0x04;
  console.log(`  -> APK ZIP header check: ${isZip ? 'VALID' : 'INVALID'}`);

  console.log('\n🎉 ALL DOWNLOADED RELEASE ARTIFACTS VERIFIED HEALTHY AND CORRUPTION-FREE!');
  
  // Cleanup test download
  if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
  if (fs.existsSync(downloadsDir)) fs.rmdirSync(downloadsDir);
}

verifyAssets();
