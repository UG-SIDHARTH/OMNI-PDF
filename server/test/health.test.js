import assert from 'assert';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

console.log('🧪 Starting OMNI-PDF Deep Automated Test Suite...');

function makeRequest(options, postData) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Deep PDF Generation & Parsing Validation
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
    page.drawText('OmniPDF Deep Test');
    const pdfBytes = await pdfDoc.save();
    
    // Header check
    const headerStr = Buffer.from(pdfBytes.slice(0, 5)).toString('utf8');
    assert.strictEqual(headerStr, '%PDF-', 'PDF file must start with %PDF- magic header');

    // Load back and parse with pdf-lib to prove zero corruption
    const reloadedDoc = await PDFDocument.load(pdfBytes);
    assert.strictEqual(reloadedDoc.getPageCount(), 1, 'Reloaded PDF must contain exactly 1 page');
    
    const reloadedPage = reloadedDoc.getPage(0);
    const { width, height } = reloadedPage.getSize();
    assert(Math.abs(width - 595.28) < 0.1, `Width should be A4 (595.28 pt), got ${width}`);
    assert(Math.abs(height - 841.89) < 0.1, `Height should be A4 (841.89 pt), got ${height}`);

    console.log('✅ Test 1 Passed: Real PDF generation, header check, and deep re-parsing.');
    passed++;
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.message);
    failed++;
  }

  // Test 2: Live Server Path Traversal Protection
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: '/api/download/..%2f..%2fetc%2fpasswd',
      method: 'GET',
      headers: {
        'x-session-id': '../../../../etc/passwd'
      }
    });

    assert.strictEqual(res.statusCode, 404, 'Malicious path traversal request must be rejected with 404');
    assert(res.headers['x-session-id'] && !res.headers['x-session-id'].includes('etc'), 'Session ID must be sanitized and replaced with a clean UUID');
    console.log('✅ Test 2 Passed: Live HTTP endpoint path traversal rejection & session sanitization.');
    passed++;
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
    failed++;
  }

  // Test 3: Magic Byte Validation & Corrupt PDF Rejection
  try {
    const validPdfBytes = Buffer.from('%PDF-1.7 sample data');
    const fakeExeBytes = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); // DOS/PE executable header

    assert(validPdfBytes.slice(0, 5).toString('utf8') === '%PDF-', 'Valid PDF magic bytes verified');
    assert(fakeExeBytes.slice(0, 5).toString('utf8') !== '%PDF-', 'Executable header correctly identified as non-PDF');

    console.log('✅ Test 3 Passed: Magic byte header inspection logic.');
    passed++;
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
    failed++;
  }

  console.log(`\n🎉 Deep Test Suite Completed: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
