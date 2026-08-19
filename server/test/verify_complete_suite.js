import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { PDFDocument } from 'pdf-lib';

console.log('====================================================');
console.log('🚀 COMPLETE 7-CATEGORY TOOL SUITE VERIFICATION');
console.log('====================================================\n');

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
    req.on('error', (err) => resolve({ statusCode: 500, error: err.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

async function createSamplePdf(pageCount = 3) {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText(`Sample Document Page ${i + 1} Content`, { x: 50, y: 750, size: 18 });
  }
  return await pdfDoc.save();
}

async function uploadPdf(pdfBytes, filename = 'sample.pdf') {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;

  const headerBuf = Buffer.from(body, 'utf8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([headerBuf, Buffer.from(pdfBytes), footerBuf]);

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        'x-session-id': 'test_suite_session'
      }
    }, fullBody);

    if (res.json && res.json.files && res.json.files.length > 0) {
      return res.json.files[0];
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

async function runCompleteSuite() {
  const samplePdfBytes = await createSamplePdf(4);
  const sampleFile = await uploadPdf(samplePdfBytes);

  console.log(`✅ Uploaded Sample PDF: ${sampleFile.fileId} (${sampleFile.size} bytes)\n`);

  const tests = [
    { name: '1. Organize PDF', path: '/api/pdf/organize', payload: { fileId: sampleFile.fileId, pageOrders: [3, 1, 2, 4] } },
    { name: '2. Add Page Numbers', path: '/api/pdf/add-page-numbers', payload: { fileId: sampleFile.fileId, position: 'bottom-center' } },
    { name: '3. Crop PDF', path: '/api/pdf/crop', payload: { fileId: sampleFile.fileId, marginPercent: 10 } },
    { name: '4. Sign PDF', path: '/api/pdf/sign', payload: { fileId: sampleFile.fileId, signatureText: 'John Doe' } },
    { name: '5. Compare PDF', path: '/api/pdf/compare', payload: { fileId: sampleFile.fileId } },
    { name: '6. OCR PDF', path: '/api/pdf/ocr', payload: { fileId: sampleFile.fileId } },
    { name: '7. Repair PDF', path: '/api/pdf/repair', payload: { fileId: sampleFile.fileId } },
    { name: '8. PDF to Word (.docx)', path: '/api/pdf/pdf-to-word', payload: { fileId: sampleFile.fileId } },
    { name: '9. PDF to Excel (.xlsx)', path: '/api/pdf/pdf-to-excel', payload: { fileId: sampleFile.fileId } },
    { name: '10. PDF to PPT (.pptx)', path: '/api/pdf/pdf-to-ppt', payload: { fileId: sampleFile.fileId } },
    { name: '11. PDF to PDF/A', path: '/api/pdf/pdf-to-pdfa', payload: { fileId: sampleFile.fileId } },
    { name: '12. Word to PDF', path: '/api/pdf/word-to-pdf', payload: { fileId: sampleFile.fileId } },
    { name: '13. Excel to PDF', path: '/api/pdf/excel-to-pdf', payload: { fileId: sampleFile.fileId } }
  ];

  let passed = 0;
  for (const t of tests) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: t.path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': 'test_suite_session' }
    }, JSON.stringify(t.payload));

    if (res.statusCode === 200 && res.json && res.json.success) {
      console.log(`✅ PASS: ${t.name} -> HTTP 200 (Output: ${res.json.originalName})`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${t.name} -> HTTP ${res.statusCode} (${res.body})`);
    }
  }

  console.log(`\n🎉 SUITE VERIFICATION COMPLETE: ${passed}/${tests.length} PASS`);
}

runCompleteSuite();
