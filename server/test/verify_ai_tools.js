import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { PDFDocument } from 'pdf-lib';

console.log('====================================================');
console.log('🚀 DEEP LOCAL AI & TEXT EXTRACTION VERIFICATION');
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

// Generate rich text-heavy PDF document with headers, bullet points, and tabular content
async function createRichTextPdf() {
  const pdfDoc = await PDFDocument.create();

  // Page 1
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  page1.drawText('CHAPTER 1: INTRODUCTION TO DOCUMENT AUTOMATION', { x: 50, y: 780, size: 16 });
  page1.drawText('This document provides an overview of automated PDF processing systems.', { x: 50, y: 750, size: 12 });
  page1.drawText('Document security and local offline processing ensure complete data privacy.', { x: 50, y: 730, size: 12 });
  page1.drawText('Key features include PDF merging, splitting, background removal, and extraction.', { x: 50, y: 710, size: 12 });
  
  page1.drawText('SECTION 2: SYSTEM CAPABILITIES', { x: 50, y: 660, size: 14 });
  page1.drawText('- High speed text extraction and layout preservation.', { x: 50, y: 630, size: 12 });
  page1.drawText('- Extractive summarization using TF-IDF sentence scoring algorithms.', { x: 50, y: 610, size: 12 });
  page1.drawText('- Offline translation without external API billing risk.', { x: 50, y: 590, size: 12 });

  page1.drawText('Product Name   Performance Metric   Security Level', { x: 50, y: 530, size: 11 });
  page1.drawText('OMNI-PDF       100 MB/s             Enterprise AES', { x: 50, y: 510, size: 11 });
  page1.drawText('Core-Engine    75 MB/s              Standard TLS', { x: 50, y: 490, size: 11 });

  // Page 2
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  page2.drawText('CHAPTER 3: ARCHITECTURE & PRIVACY GUARANTEES', { x: 50, y: 780, size: 16 });
  page2.drawText('Every uploaded file is stored in a temporary session directory.', { x: 50, y: 750, size: 12 });
  page2.drawText('Automatic background worker tasks remove stored files after 3 hours.', { x: 50, y: 730, size: 12 });
  page2.drawText('Figure 1: System Data Flow Diagram', { x: 50, y: 690, size: 12 });

  return await pdfDoc.save();
}

async function uploadPdf(pdfBytes, filename = 'RichTextDoc.pdf') {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
  body += `Content-Type: application/pdf\r\n\r\n`;

  const headerBuf = Buffer.from(body, 'utf8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([headerBuf, Buffer.from(pdfBytes), footerBuf]);

  const res = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length,
      'x-session-id': 'test_ai_session'
    }
  }, fullBody);

  return res.json && res.json.files ? res.json.files[0] : null;
}

async function runAiVerifications() {
  const pdfBytes = await createRichTextPdf();
  const fileRec = await uploadPdf(pdfBytes);

  console.log(`✅ Uploaded Rich Sample PDF: ${fileRec.originalName} (${fileRec.size} bytes)\n`);

  // 1. VERIFY PDF TO MARKDOWN
  console.log('====================================================');
  console.log('📄 1. PDF TO MARKDOWN LOCAL EXTRACTION');
  console.log('====================================================');

  const mdRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/pdf-to-markdown',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'test_ai_session' }
  }, JSON.stringify({
    fileId: fileRec.fileId,
    preserveHeadings: true,
    preserveTables: true,
    includeImageLinks: true
  }));

  console.log(`HTTP Status: ${mdRes.statusCode}`);
  assert.strictEqual(mdRes.statusCode, 200);
  assert(mdRes.json.markdownText);
  console.log('\n--- ACTUAL MARKDOWN OUTPUT PREVIEW ---');
  console.log(mdRes.json.markdownText);
  console.log('-------------------------------------\n');

  // 2. VERIFY AI SUMMARIZER
  console.log('====================================================');
  console.log('🧠 2. AI SUMMARIZER (EXTRACTIVE TF-IDF SCORING)');
  console.log('====================================================');

  const sumResMedium = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/ai-summarizer',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'test_ai_session' }
  }, JSON.stringify({ fileId: fileRec.fileId, length: 'medium' }));

  console.log(`HTTP Status: ${sumResMedium.statusCode}`);
  assert.strictEqual(sumResMedium.statusCode, 200);
  assert(sumResMedium.json.summaryText);
  console.log('\n--- ACTUAL MEDIUM SUMMARY OUTPUT PREVIEW ---');
  console.log(sumResMedium.json.summaryText);
  console.log('-------------------------------------\n');

  // 3. VERIFY TRANSLATE PDF
  console.log('====================================================');
  console.log('🌐 3. TRANSLATE PDF (LOCAL OFFLINE TRANSLATION)');
  console.log('====================================================');

  const transResSpanish = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/pdf/translate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'test_ai_session' }
  }, JSON.stringify({ fileId: fileRec.fileId, sourceLang: 'English', targetLang: 'Spanish' }));

  console.log(`HTTP Status: ${transResSpanish.statusCode}`);
  assert.strictEqual(transResSpanish.statusCode, 200);
  assert(transResSpanish.json.translatedText);
  console.log('\n--- ACTUAL SPANISH TRANSLATION PREVIEW ---');
  console.log(transResSpanish.json.translatedText);
  console.log('-------------------------------------\n');

  console.log('🎉 ALL 3 LOCAL FEATURES VERIFIED SUCCESSFULLY WITH REAL OUTPUT!');
}

runAiVerifications();
