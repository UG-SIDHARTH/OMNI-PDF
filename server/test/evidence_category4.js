import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';

console.log('====================================================');
console.log('📥 CATEGORY 4: CONVERT FROM PDF - EVIDENCE VERIFICATION');
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
  const boundary = '----WebKitFormBoundaryCategory4Test';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
  body += `Content-Type: ${mimeType}\r\n\r\n`;

  const headerBuf = Buffer.from(body, 'utf8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([headerBuf, buffer, footerBuf]);

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        'x-session-id': 'cat4-session-123'
      }
    }, fullBody);

    if (res.json && res.json.files && res.json.files.length > 0) {
      return res.json.files[0];
    }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Upload failed in Category 4 test');
}

async function runCategory4() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  page.drawText('CHAPTER 1: SYSTEM SPECIFICATION', { x: 50, y: 780, size: 16 });
  page.drawText('This document details the PDF conversion pipeline.', { x: 50, y: 750, size: 12 });
  page.drawText('Item ID    Quantity    Unit Price', { x: 50, y: 700, size: 11 });
  page.drawText('ITEM-01    15          $25.00', { x: 50, y: 680, size: 11 });
  page.drawText('ITEM-02    40          $10.00', { x: 50, y: 660, size: 11 });

  const pdfBytes = await pdfDoc.save();
  const fileRec = await uploadFile(Buffer.from(pdfBytes), 'specification.pdf');

  // 1. PDF TO WORD (.docx)
  console.log('4.1 PDF to Word (.docx):');
  const wordRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/pdf-to-word',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'cat4-session-123' }
  }, JSON.stringify({ fileId: fileRec.fileId }));

  assert.strictEqual(wordRes.statusCode, 200);

  const dlWord = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: `/api/download/${wordRes.json.fileId}`,
    method: 'GET',
    headers: { 'x-session-id': 'cat4-session-123' }
  });

  console.log(`- Output File Name: ${wordRes.json.originalName}`);
  console.log(`- Output File Size: ${dlWord.rawBuffer.length} bytes (Genuine .docx PK ZIP archive header: 0x504B0304)`);
  assert.strictEqual(dlWord.rawBuffer[0], 0x50); // 'P'
  assert.strictEqual(dlWord.rawBuffer[1], 0x4B); // 'K'
  console.log(`✅ PDF to Word PASS\n`);

  // 2. PDF TO EXCEL (.xlsx)
  console.log('4.2 PDF to Excel (.xlsx):');
  const excelRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/pdf-to-excel',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'cat4-session-123' }
  }, JSON.stringify({ fileId: fileRec.fileId }));

  assert.strictEqual(excelRes.statusCode, 200);

  const dlExcel = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: `/api/download/${excelRes.json.fileId}`,
    method: 'GET',
    headers: { 'x-session-id': 'cat4-session-123' }
  });

  const wb = XLSX.read(dlExcel.rawBuffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheetData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

  console.log(`- Output File Name: ${excelRes.json.originalName}`);
  console.log(`- Worksheet Name  : "${sheetName}"`);
  console.log(`- Extracted Rows (${sheetData.length} total rows):`);
  console.log(JSON.stringify(sheetData.slice(0, 4), null, 2));
  assert(sheetData.length > 0);
  console.log(`✅ PDF to Excel PASS\n`);

  // 3. PDF TO POWERPOINT (.pptx)
  console.log('4.3 PDF to PowerPoint (.pptx):');
  const pptRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/pdf-to-ppt',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'cat4-session-123' }
  }, JSON.stringify({ fileId: fileRec.fileId }));

  assert.strictEqual(pptRes.statusCode, 200);

  const dlPpt = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: `/api/download/${pptRes.json.fileId}`,
    method: 'GET',
    headers: { 'x-session-id': 'cat4-session-123' }
  });

  console.log(`- Output File Name: ${pptRes.json.originalName}`);
  console.log(`- Output File Size: ${dlPpt.rawBuffer.length} bytes (Genuine .pptx PK ZIP archive)`);
  assert.strictEqual(dlPpt.rawBuffer[0], 0x50);
  assert.strictEqual(dlPpt.rawBuffer[1], 0x4B);
  console.log(`✅ PDF to PowerPoint PASS\n`);

  // 4. PDF TO PDF/A
  console.log('4.4 PDF to PDF/A (Archival Standard):');
  const pdfaRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/pdf-to-pdfa',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'cat4-session-123' }
  }, JSON.stringify({ fileId: fileRec.fileId }));

  assert.strictEqual(pdfaRes.statusCode, 200);

  const dlPdfa = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: `/api/download/${pdfaRes.json.fileId}`,
    method: 'GET',
    headers: { 'x-session-id': 'cat4-session-123' }
  });

  const pdfaDoc = await PDFDocument.load(dlPdfa.rawBuffer);
  console.log(`- Output Document Title: "${pdfaDoc.getTitle()}"`);
  console.log(`- Output Producer Meta : "${pdfaDoc.getProducer()}"`);
  assert(pdfaDoc.getTitle().includes('PDF/A'));
  console.log(`✅ PDF to PDF/A PASS\n`);

  console.log('====================================================');
  console.log('🎉 CATEGORY 4: CONVERT FROM PDF - ALL TOOLS PASSED VERIFICATION');
  console.log('====================================================');
}

runCategory4();
