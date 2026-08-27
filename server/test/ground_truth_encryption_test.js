import fs from 'fs';
import http from 'http';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

function makeRequest(options, postData) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        const bodyStr = rawBuffer.toString('utf8');
        let json = null;
        try { json = JSON.parse(bodyStr); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, rawBuffer, body: bodyStr, json });
      });
    });
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message, rawBuffer: Buffer.alloc(0) }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function uploadFile(buffer, filename) {
  const boundary = '----WebKitFormBoundaryGroundTruth';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;

  const headerBuf = Buffer.from(body, 'utf8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([headerBuf, buffer, footerBuf]);

  const res = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length,
      'x-session-id': 'ground_truth_session'
    }
  }, fullBody);

  return res.json && res.json.files ? res.json.files[0] : null;
}

async function downloadFile(fileId) {
  return await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: `/api/download/${fileId}`,
    method: 'GET',
    headers: { 'x-session-id': 'ground_truth_session' }
  });
}

async function testGroundTruth() {
  console.log('================================================================');
  console.log('🔍 GROUND TRUTH VALIDATION: PDF ENCRYPTION SPEC COMPLIANCE');
  console.log('================================================================\n');

  // Create a clean PDF
  const pDoc = await PDFDocument.create();
  pDoc.addPage().drawText('Confidential Ground Truth Content 2026', { x: 50, y: 700 });
  const rawBytes = Buffer.from(await pDoc.save());

  const u = await uploadFile(rawBytes, 'GroundTruthDoc.pdf');
  console.log('Uploaded File:', u.fileId);

  // Call Protect PDF
  const protRes = await makeRequest({
    hostname: 'localhost', port: 8092, path: '/api/pdf/protect', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'ground_truth_session' }
  }, JSON.stringify({ fileId: u.fileId, password: 'Password123' }));

  console.log('Protect Response:', protRes.statusCode, protRes.body);
  const dl = await downloadFile(protRes.json.fileId);
  const protectedBytes = dl.rawBuffer;

  console.log(`Protected PDF Downloaded: ${protectedBytes.length} bytes`);

  // Test 1: pdf-lib without ignoreEncryption (Strict PDF Parser)
  console.log('\n--- Independent Test 1: pdf-lib (without ignoreEncryption) ---');
  try {
    const strictDoc = await PDFDocument.load(protectedBytes); // default throws EncryptedPDFError if recognized as encrypted
    console.log('pdf-lib opened without error (Encrypted flag ignored or unencrypted)');
  } catch (err) {
    console.log('pdf-lib threw expected error for encrypted PDF:', err.name, err.message);
  }

  // Test 2: Standard Mozilla PDF.js Engine (pdf-parse / PDF.js Parser)
  console.log('\n--- Independent Test 2: Mozilla PDF.js Engine ---');
  try {
    const parser = new PDFParse(new Uint8Array(protectedBytes));
    const extracted = await parser.getText();
    console.log('PDF.js parsed text:', `"${extracted.text.trim().replace(/\s+/g, ' ')}"`);
  } catch (err) {
    console.log('PDF.js threw error (Password required or corrupt stream):', err.message);
  }
}

testGroundTruth();
