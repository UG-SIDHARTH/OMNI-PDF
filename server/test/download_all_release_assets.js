import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ASSETS = [
  {
    name: 'OmniPDF-app-debug.apk',
    url: 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.0/OmniPDF-app-debug.apk'
  },
  {
    name: 'OmniPDF.0.4.0.exe',
    url: 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.0/OmniPDF.0.4.0.exe'
  },
  {
    name: 'OmniPDF.Setup.0.4.0.exe',
    url: 'https://github.com/UG-SIDHARTH/OMNI-PDF/releases/download/v0.4.0/OmniPDF.Setup.0.4.0.exe'
  }
];

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

async function main() {
  console.log('================================================================');
  console.log('📦 PART 1: DOWNLOADING & INTEGRITY-CHECKING RELEASE ASSETS');
  console.log('================================================================\n');

  const outDir = path.join('scratch', 'release_test_v040');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = [];

  for (const asset of ASSETS) {
    const dest = path.join(outDir, asset.name);
    console.log(`Downloading ${asset.name} from: ${asset.url}...`);
    const startTime = Date.now();
    const size = await downloadFile(asset.url, dest);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const sha256 = await calculateSha256(dest);

    console.log(`✅ ${asset.name}`);
    console.log(`   Size  : ${(size / (1024 * 1024)).toFixed(2)} MB (${size.toLocaleString()} bytes) in ${elapsed}s`);
    console.log(`   SHA256: ${sha256}\n`);

    results.push({ name: asset.name, size, sha256, path: dest });
  }

  fs.writeFileSync(path.join(outDir, 'checksums.json'), JSON.stringify(results, null, 2));
  console.log('Checksums saved to scratch/release_test_v040/checksums.json');
}

main().catch(err => {
  console.error('Download Error:', err);
  process.exit(1);
});
