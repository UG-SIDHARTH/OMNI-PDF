import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

function checkHealth(port = 8092, retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ ok: true, statusCode: 200, body });
          } else if (attempts < retries) {
            setTimeout(check, delay);
          } else {
            reject(new Error(`Server returned HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      req.on('error', (err) => {
        if (attempts < retries) {
          setTimeout(check, delay);
        } else {
          reject(new Error(`Server connection error: ${err.message}`));
        }
      });
      req.end();
    };
    check();
  });
}

async function runIsolatedTest() {
  console.log('================================================================');
  console.log('🧪 ISOLATED ENVIRONMENT TEST: C:\\CleanOmniPDFTest');
  console.log('================================================================\n');

  const isolatedRoot = 'C:\\CleanOmniPDFTest';
  const targetAppDir = path.join(isolatedRoot, 'OmniPDF');

  // Verify and prepare clean isolated directory
  if (fs.existsSync(isolatedRoot)) {
    fs.rmSync(isolatedRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(targetAppDir, { recursive: true });

  const srcDir = path.resolve('release', 'win-unpacked');
  console.log(`Copying packaged app from ${srcDir} to ${targetAppDir}...`);
  fs.cpSync(srcDir, targetAppDir, { recursive: true });
  console.log('✅ Copied packaged app to isolated directory.');

  // Confirm NO node_modules exists in parent hierarchy of C:\CleanOmniPDFTest
  const hasParentNodeModules = fs.existsSync('C:\\node_modules') || fs.existsSync('C:\\CleanOmniPDFTest\\node_modules');
  console.log(`Isolation verification: Parent node_modules present? ${hasParentNodeModules ? 'YES (NOT ISOLATED)' : 'NO (TRULY ISOLATED)'}`);

  const exePath = path.join(targetAppDir, 'OmniPDF.exe');
  console.log(`\nLaunching packaged binary: ${exePath}`);

  const child = spawn(exePath, [], {
    cwd: targetAppDir,
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_PATH: '' // verifiably empty
    }
  });

  child.stdout.on('data', d => console.log(`[OmniPDF.exe stdout]: ${d.toString().trim()}`));
  child.stderr.on('data', d => console.error(`[OmniPDF.exe stderr]: ${d.toString().trim()}`));

  console.log('Waiting for embedded Express server on 127.0.0.1:8092...');
  try {
    const health = await checkHealth(8092, 20, 500);
    console.log(`\n🎉 HEALTH CHECK SUCCESS: HTTP ${health.statusCode}`);
    console.log(`Response Body: ${health.body}`);
  } catch (err) {
    console.error('\n❌ HEALTH CHECK FAILED:', err.message);
  } finally {
    console.log('Terminating isolated test process...');
    child.kill('SIGTERM');
  }
}

runIsolatedTest().catch(console.error);
