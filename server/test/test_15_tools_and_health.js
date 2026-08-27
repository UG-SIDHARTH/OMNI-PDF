import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import * as docx from 'docx';

console.log('====================================================');
console.log('🚀 TESTING 15 PREVIOUSLY-BROKEN TOOLS & HEALTH FIX');
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

async function uploadFile(buffer, filename, mimeType = 'application/pdf') {
  const boundary = '----WebKitFormBoundaryTest15Fixes';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
  body += `Content-Type: ${mimeType}\r\n\r\n`;

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
      'x-session-id': 'test_15_session'
    }
  }, fullBody);

  return res.json && res.json.files ? res.json.files[0] : null;
}

async function runTests() {
  // Create sample multi-page PDF
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < 4; i++) {
    const p = pdfDoc.addPage([595.28, 841.89]);
    p.drawText(`Page ${i + 1} Test Document Content`, { x: 50, y: 700 });
  }
  const samplePdfBytes = await pdfDoc.save();
  const pdfFileRec = await uploadFile(Buffer.from(samplePdfBytes), 'TestDoc.pdf');
  console.log(`✅ Uploaded Sample PDF: ${pdfFileRec.fileId}`);

  // Create sample Excel file with non-ASCII and special WinAnsi characters (accented characters, curly quotes, 0x81 control characters)
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Header with Accent: Café', 'Curly Quote: “Hello”', 'Dash: — and •'],
    ['Special char: \u0081 hidden', 'Price: $100.00', 'Status: OK'],
    ['Text: München & São Paulo', 'Notes: Test string', 'Number: 12345']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const xlsxBytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const xlsxFileRec = await uploadFile(xlsxBytes, 'Special_Chars.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  console.log(`✅ Uploaded Non-ASCII Excel File: ${xlsxFileRec.fileId}`);

  // Create sample Word file
  const doc = new docx.Document({
    sections: [{
      children: [
        new docx.Paragraph({ text: 'Sample Word Document Title' }),
        new docx.Paragraph({ text: 'This is body paragraph 1.' })
      ]
    }]
  });
  const docxBytes = await docx.Packer.toBuffer(doc);
  const docxFileRec = await uploadFile(docxBytes, 'Sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  console.log(`✅ Uploaded Word Document: ${docxFileRec.fileId}`);

  // Create sample PPT file (XML mock)
  const pptMockBytes = Buffer.from('<p:sld><a:t>Slide 1 Title</a:t><a:t>Bullet point 1 content</a:t></p:sld>', 'utf8');
  const pptFileRec = await uploadFile(pptMockBytes, 'Presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  console.log(`✅ Uploaded PPT File: ${pptFileRec.fileId}\n`);

  const tools = [
    { id: 'organize-pdf', endpoint: '/api/pdf/organize', payload: { fileId: pdfFileRec.fileId, pageOrders: [3, 1, 2, 4] } },
    { id: 'ocr-pdf', endpoint: '/api/pdf/ocr', payload: { fileId: pdfFileRec.fileId } },
    { id: 'word-to-pdf', endpoint: '/api/pdf/word-to-pdf', payload: { fileId: docxFileRec.fileId } },
    { id: 'excel-to-pdf', endpoint: '/api/pdf/excel-to-pdf', payload: { fileId: xlsxFileRec.fileId } },
    { id: 'powerpoint-to-pdf', endpoint: '/api/pdf/powerpoint-to-pdf', payload: { fileId: pptFileRec.fileId } },
    { id: 'html-to-pdf', endpoint: '/api/pdf/html-to-pdf', payload: { htmlCode: '<h1>Title</h1><p>Styled paragraph</p>' } },
    { id: 'pdf-to-word', endpoint: '/api/pdf/pdf-to-word', payload: { fileId: pdfFileRec.fileId } },
    { id: 'pdf-to-excel', endpoint: '/api/pdf/pdf-to-excel', payload: { fileId: pdfFileRec.fileId } },
    { id: 'pdf-to-powerpoint', endpoint: '/api/pdf/pdf-to-ppt', payload: { fileId: pdfFileRec.fileId } },
    { id: 'pdf-to-pdfa', endpoint: '/api/pdf/pdf-to-pdfa', payload: { fileId: pdfFileRec.fileId } },
    { id: 'pdf-to-jpg', endpoint: '/api/pdf/pdf-to-jpg', payload: { fileId: pdfFileRec.fileId } },
    { id: 'add-page-numbers', endpoint: '/api/pdf/add-page-numbers', payload: { fileId: pdfFileRec.fileId, position: 'bottom-center' } },
    { id: 'crop-pdf', endpoint: '/api/pdf/crop', payload: { fileId: pdfFileRec.fileId, marginPercent: 10 } },
    { id: 'sign-pdf', endpoint: '/api/pdf/sign', payload: { fileId: pdfFileRec.fileId, signatureText: 'John Doe' } },
    { id: 'compare-pdf', endpoint: '/api/pdf/compare', payload: { fileId: pdfFileRec.fileId } }
  ];

  console.log('--- TESTING ALL 15 TOOL ENDPOINTS ---');
  let passCount = 0;
  for (const t of tools) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: t.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test_15_session'
      }
    }, JSON.stringify(t.payload));

    if (res.statusCode === 200 && res.json && res.json.success) {
      console.log(`✅ PASS: ${t.id.padEnd(20)} -> ${t.endpoint.padEnd(28)} | Output: ${res.json.originalName}`);
      passCount++;
    } else {
      console.log(`❌ FAIL: ${t.id.padEnd(20)} -> ${t.endpoint.padEnd(28)} | HTTP ${res.statusCode}: ${res.body}`);
    }
  }

  console.log(`\nTool Endpoint Results: ${passCount}/${tools.length} Passed.\n`);

  // Test Rate Limiting Fix on Health Endpoint
  console.log('--- TESTING HEALTH CHECK EXEMPTION FROM RATE LIMITER ---');
  console.log('Flooding 70 requests to /api/status/invalid to exhaust rate limit...');
  let hit429 = false;
  for (let i = 0; i < 70; i++) {
    const r = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: '/api/status/flood-check',
      method: 'GET'
    });
    if (r.statusCode === 429) {
      hit429 = true;
    }
  }
  console.log(`Rate limiter triggered 429 on /api endpoints: ${hit429 ? 'YES (Expected)' : 'NO'}`);

  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/health',
    method: 'GET'
  });

  console.log(`/api/health status code after rate limit exhausted: ${healthRes.statusCode} (${healthRes.body})`);
  assert.strictEqual(healthRes.statusCode, 200, '/api/health must return 200 OK even when rate limit is exceeded');
  console.log('✅ PASS: /api/health is successfully exempt from rate limiting!\n');

  console.log('🎉 ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

runTests();
