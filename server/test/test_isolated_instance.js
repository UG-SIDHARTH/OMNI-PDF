import { spawn } from 'child_process';
import http from 'http';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

function checkHealth(port = 8092, retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (attempts < retries) {
          setTimeout(check, delay);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on('error', () => {
        if (attempts < retries) setTimeout(check, delay);
        else reject(new Error('Connection timeout'));
      });
      req.end();
    };
    check();
  });
}

async function runTest() {
  const targetAppDir = 'C:\\CleanOmniPDFTest\\OmniPDF';
  const exePath = `${targetAppDir}\\OmniPDF.exe`;

  console.log(`Starting isolated packaged binary: ${exePath}`);
  const child = spawn(exePath, [], {
    cwd: targetAppDir,
    stdio: 'ignore'
  });

  try {
    await checkHealth(8092, 20, 500);
    console.log('✅ Isolated packaged app is healthy on 127.0.0.1:8092!\n');

    console.log('--- RUNNING COMPLETE TOOL SUITE AGAINST ISOLATED PACKAGED APP ---');
    const { stdout: out1 } = await execPromise('node server/test/verify_complete_suite.js');
    console.log(out1);

    console.log('--- RUNNING AI TOOLS AGAINST ISOLATED PACKAGED APP ---');
    const { stdout: out2 } = await execPromise('node server/test/verify_ai_tools.js');
    console.log(out2);

    console.log('--- RUNNING HONEST PROTECT/UNLOCK CHECK ---');
    const { stdout: out3 } = await execPromise('node server/test/test_honest_protect.js');
    console.log(out3);

  } finally {
    console.log('Terminating isolated packaged app...');
    child.kill('SIGTERM');
  }
}

runTest().catch(console.error);
