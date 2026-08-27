import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';
import * as docx from 'docx';

console.log('================================================================');
console.log('🔬 TEST 2: DEEP UNICODE & SANITIZATION BEHAVIOR AUDIT');
console.log('================================================================\n');

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

async function uploadFile(buffer, filename, mimeType = 'application/pdf') {
  const boundary = '----WebKitFormBoundaryUnicodeAudit';
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
      'x-session-id': 'unicode_session'
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
    headers: { 'x-session-id': 'unicode_session' }
  });
}

async function runUnicodeAudit() {
  const testCases = [
    {
      category: 'a) Latin Accents (French, Spanish, German, Portuguese)',
      text: 'Café français, Señor Niño, Über Größe, São Paulo'
    },
    {
      category: 'b) Cyrillic (Russian)',
      text: 'Привет мир, Отчет по проекту'
    },
    {
      category: 'c) CJK (Chinese / Japanese)',
      text: '你好世界，这是一个测试文档。こんにちは'
    },
    {
      category: 'd) Arabic',
      text: 'مرحبا بالعالم، هذا مستند اختبار'
    },
    {
      category: 'e) Mixed Latin + Non-Latin',
      text: 'Invoice #999 Total: €150 | Клиент: Иван | 顧客: 田中 | عميل: أحمد'
    }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`================================================================`);
    console.log(`SCRIPT: ${tc.category}`);
    console.log(`INPUT STRING: "${tc.text}"`);
    console.log(`================================================================`);

    // 1. Excel to PDF
    let excelObs = '';
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['Field Name', 'Field Value'], ['Test Data', tc.text]]);
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const up = await uploadFile(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), 'data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const res = await makeRequest({
        hostname: 'localhost', port: 8092, path: '/api/pdf/excel-to-pdf', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'unicode_session' }
      }, JSON.stringify({ fileId: up.fileId }));
      const dl = await downloadFile(res.json.fileId);
      const parsed = await new PDFParse(new Uint8Array(dl.rawBuffer)).getText();
      excelObs = parsed.text.trim().replace(/\s+/g, ' ');
    } catch (e) { excelObs = `ERROR: ${e.message}`; }

    // 2. Word to PDF
    let wordObs = '';
    try {
      const doc = new docx.Document({
        sections: [{ children: [new docx.Paragraph({ text: `Header: ${tc.text}` })] }]
      });
      const up = await uploadFile(await docx.Packer.toBuffer(doc), 'doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const res = await makeRequest({
        hostname: 'localhost', port: 8092, path: '/api/pdf/word-to-pdf', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'unicode_session' }
      }, JSON.stringify({ fileId: up.fileId }));
      const dl = await downloadFile(res.json.fileId);
      const parsed = await new PDFParse(new Uint8Array(dl.rawBuffer)).getText();
      wordObs = parsed.text.trim().replace(/\s+/g, ' ');
    } catch (e) { wordObs = `ERROR: ${e.message}`; }

    // 3. PowerPoint to PDF
    let pptObs = '';
    try {
      const pptXml = Buffer.from(`<p:sld><a:t>${tc.text}</a:t></p:sld>`, 'utf8');
      const up = await uploadFile(pptXml, 'slide.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      const res = await makeRequest({
        hostname: 'localhost', port: 8092, path: '/api/pdf/powerpoint-to-pdf', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'unicode_session' }
      }, JSON.stringify({ fileId: up.fileId }));
      const dl = await downloadFile(res.json.fileId);
      const parsed = await new PDFParse(new Uint8Array(dl.rawBuffer)).getText();
      pptObs = parsed.text.trim().replace(/\s+/g, ' ');
    } catch (e) { pptObs = `ERROR: ${e.message}`; }

    // 4. HTML to PDF
    let htmlObs = '';
    try {
      const res = await makeRequest({
        hostname: 'localhost', port: 8092, path: '/api/pdf/html-to-pdf', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'unicode_session' }
      }, JSON.stringify({ htmlCode: `<h1>Title</h1><p>${tc.text}</p>` }));
      const dl = await downloadFile(res.json.fileId);
      const parsed = await new PDFParse(new Uint8Array(dl.rawBuffer)).getText();
      htmlObs = parsed.text.trim().replace(/\s+/g, ' ');
    } catch (e) { htmlObs = `ERROR: ${e.message}`; }

    console.log(`📊 EXCEL TO PDF OUTPUT: "${excelObs}"`);
    console.log(`📄 WORD TO PDF OUTPUT : "${wordObs}"`);
    console.log(`🖥️ PPT TO PDF OUTPUT  : "${pptObs}"`);
    console.log(`🌐 HTML TO PDF OUTPUT : "${htmlObs}"\n`);

    results.push({
      category: tc.category,
      input: tc.text,
      excel: excelObs,
      word: wordObs,
      ppt: pptObs,
      html: htmlObs
    });
  }

  fs.writeFileSync('server/test/unicode_audit_results.json', JSON.stringify(results, null, 2));
}

runUnicodeAudit();
