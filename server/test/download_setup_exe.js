import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function downloadFileWithRetry(url, destPath, maxRetries = 5) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attempt = () => {
      attempts++;
      console.log(`[Attempt ${attempts}/${maxRetries}] Downloading from ${url}...`);

      const handleReq = (currUrl) => {
        https.get(currUrl, { headers: { 'User-Agent': 'OmniPDF-Release-Tester' } }, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            return handleReq(res.headers.location);
          }
          if (res.statusCode !== 200) {
            if (attempts < maxRetries) {
              console.warn(`HTTP ${res.statusCode}. Retrying in 3s...`);
              return setTimeout(attempt, 3000);
            }
            return reject(new Error(`HTTP ${res.statusCode}`));
          }

          const fileStream = fs.createWriteStream(destPath);
          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              const size = fs.statSync(destPath).size;
              resolve(size);
            });
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            if (attempts < maxRetries) {
              console.warn(`File error: ${err.message}. Retrying in 3s...`);
              return setTimeout(attempt, 3000);
            }
            reject(err);
          });
        }).on('error', (err) => {
          fs.unlink(destPath, () => {});
          if (attempts < maxRetries) {
            console.warn(`Network error: ${err.message}. Retrying in 3s...`);
            return setTimeout(attempt, 3000);
          }
          reject(err);
        });
      };

      handleReq(url);
    };

    attempt();
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

async function main() {
  const destPath = path.join('scratch', 'release_test_v040', 'OmniPDF.Setup.0.4.0.exe');
  const url = 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.0/OmniPDF.Setup.0.4.0.exe';

  console.log('Downloading OmniPDF.Setup.0.4.0.exe...');
  const size = await downloadFileWithRetry(url, destPath);
  const sha256 = await calculateSha256(destPath);

  console.log(`✅ OmniPDF.Setup.0.4.0.exe`);
  console.log(`   Size  : ${(size / (1024 * 1024)).toFixed(2)} MB (${size.toLocaleString()} bytes)`);
  console.log(`   SHA256: ${sha256}`);
}

main().catch(err => {
  console.error('Setup download error:', err);
  process.exit(1);
});
