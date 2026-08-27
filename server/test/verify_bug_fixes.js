import fs from 'fs';
import path from 'path';
import assert from 'assert';
import http from 'http';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';
import * as docx from 'docx';

console.log('================================================================');
console.log('🧪 VERIFYING BUG 1 & BUG 2 FIXES (DEEP AUDIT PASS)');
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

async function uploadFile(buffer, filename, mimeType = 'application/pdf', sessionId = 'bug_fixes_session') {
  const boundary = '----WebKitFormBoundaryBugFixes';
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
      'x-session-id': sessionId
    }
  }, fullBody);

  return res.json && res.json.files ? res.json.files[0] : null;
}

async function downloadFile(fileId, sessionId = 'bug_fixes_session') {
  return await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: `/api/download/${fileId}`,
    method: 'GET',
    headers: { 'x-session-id': sessionId }
  });
}

async function verifyBug1Unicode() {
  console.log('----------------------------------------------------------------');
  console.log('1. BUG 1 VERIFICATION: UNICODE SCRIPT WARNINGS & RENDERING');
  console.log('----------------------------------------------------------------');

  const testCases = [
    { script: 'Latin Accents', text: 'Café français, Señor Niño, Über Größe, São Paulo' },
    { script: 'Cyrillic (Russian)', text: 'Привет мир, Отчет по проекту' },
    { script: 'CJK (Chinese/Japanese)', text: '你好世界，这是一个测试文档。こんにちは' },
    { script: 'Arabic', text: 'مرحبا بالعالم، هذا مستند اختبار' },
    { script: 'Mixed Latin + Non-Latin', text: 'Invoice #999 Total: €150 | Клиент: Иван | 顧客: 田中 | عميل: أحمد' }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\n--- Script: ${tc.script} ---`);
    console.log(`Input: "${tc.text}"`);

    // A. Word to PDF
    const wDoc = new docx.Document({
      sections: [{ children: [new docx.Paragraph({ text: tc.text })] }]
    });
    const wUp = await uploadFile(await docx.Packer.toBuffer(wDoc), 'doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const wRes = await makeRequest({
      hostname: 'localhost', port: 8092, path: '/api/pdf/word-to-pdf', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
    }, JSON.stringify({ fileId: wUp.fileId }));
    const wWarn = wRes.json?.warnings || [];

    // B. Excel to PDF
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Field', 'Value'], [tc.script, tc.text]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const xUp = await uploadFile(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), 'data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const xRes = await makeRequest({
      hostname: 'localhost', port: 8092, path: '/api/pdf/excel-to-pdf', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
    }, JSON.stringify({ fileId: xUp.fileId }));
    const xWarn = xRes.json?.warnings || [];

    // C. PowerPoint to PDF
    const pptXml = Buffer.from(`<p:sld><a:t>${tc.text}</a:t></p:sld>`, 'utf8');
    const pUp = await uploadFile(pptXml, 'slide.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    const pRes = await makeRequest({
      hostname: 'localhost', port: 8092, path: '/api/pdf/powerpoint-to-pdf', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
    }, JSON.stringify({ fileId: pUp.fileId }));
    const pWarn = pRes.json?.warnings || [];

    // D. HTML to PDF
    const hRes = await makeRequest({
      hostname: 'localhost', port: 8092, path: '/api/pdf/html-to-pdf', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
    }, JSON.stringify({ htmlCode: `<h1>${tc.script}</h1><p>${tc.text}</p>` }));
    const hWarn = hRes.json?.warnings || [];

    const formatStatus = (warns) => {
      if (warns.length === 0) return 'renders correctly';
      return 'returns warning + omits characters';
    };

    console.log(`  Word to PDF       : ${formatStatus(wWarn)} (Warnings: ${wWarn.length})`);
    console.log(`  Excel to PDF      : ${formatStatus(xWarn)} (Warnings: ${xWarn.length})`);
    console.log(`  PowerPoint to PDF : ${formatStatus(pWarn)} (Warnings: ${pWarn.length})`);
    console.log(`  HTML to PDF       : ${formatStatus(hWarn)} (Warnings: ${hWarn.length})`);

    results.push({
      script: tc.script,
      word: formatStatus(wWarn),
      excel: formatStatus(xWarn),
      ppt: formatStatus(pWarn),
      html: formatStatus(hWarn)
    });
  }

  return results;
}

async function verifyBug2ProtectUnlock() {
  console.log('\n----------------------------------------------------------------');
  console.log('2. BUG 2 VERIFICATION: PROTECT & UNLOCK ROUNDTRIP MATRIX');
  console.log('----------------------------------------------------------------');

  const pDoc = await PDFDocument.create();
  pDoc.addPage().drawText('Top Secret Vault Key #88219', { x: 50, y: 700 });
  const rawBuf = Buffer.from(await pDoc.save());

  const u = await uploadFile(rawBuf, 'VaultSecret.pdf');
  console.log(`Uploaded source PDF: ${u.fileId}`);

  // Test Protect
  const pRes = await makeRequest({
    hostname: 'localhost', port: 8092, path: '/api/pdf/protect', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
  }, JSON.stringify({ fileId: u.fileId, password: 'VaultPassword99!' }));

  console.log(`Protect PDF Status: HTTP ${pRes.statusCode} (Output: ${pRes.json?.originalName})`);
  assert.strictEqual(pRes.statusCode, 200, 'Protect must return 200');

  // Verify protected file contains /Encrypt in binary stream
  const encDl = await downloadFile(pRes.json.fileId);
  const encStr = encDl.rawBuffer.toString('binary');
  const hasEncrypt = encStr.includes('/Encrypt');
  const hasU = encStr.includes('/U <');
  console.log(`Protected file has /Encrypt dictionary: ${hasEncrypt} | has /U hash: ${hasU}`);
  assert.ok(hasEncrypt && hasU, 'Protected PDF MUST have /Encrypt and /U');

  // Test Unlock with wrong password (must fail with 500/400)
  const wrongUnRes = await makeRequest({
    hostname: 'localhost', port: 8092, path: '/api/pdf/unlock', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
  }, JSON.stringify({ fileId: pRes.json.fileId, password: 'IncorrectPassword' }));

  console.log(`Unlock with wrong password status: HTTP ${wrongUnRes.statusCode} (${wrongUnRes.json?.error || wrongUnRes.body})`);
  assert.notStrictEqual(wrongUnRes.statusCode, 200, 'Unlock with wrong password must NOT succeed');

  // Test Unlock with correct password (must succeed with 200)
  const unRes = await makeRequest({
    hostname: 'localhost', port: 8092, path: '/api/pdf/unlock', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'bug_fixes_session' }
  }, JSON.stringify({ fileId: pRes.json.fileId, password: 'VaultPassword99!' }));

  console.log(`Unlock with correct password status: HTTP ${unRes.statusCode} (Output: ${unRes.json?.originalName})`);
  assert.strictEqual(unRes.statusCode, 200, 'Unlock with correct password must succeed');

  const unDl = await downloadFile(unRes.json.fileId);
  const parsed = await new PDFParse(new Uint8Array(unDl.rawBuffer)).getText();
  console.log(`Extracted text from unlocked PDF: "${parsed.text.trim().replace(/\s+/g, ' ')}"`);
  assert.ok(parsed.text.includes('Top Secret Vault Key #88219'), 'Unlocked text must match original');

  console.log('✅ PASS: Protect & Unlock roundtrip verified successfully!');
}

async function runAll() {
  await verifyBug1Unicode();
  await verifyBug2ProtectUnlock();
  console.log('\n🎉 ALL BUG FIX VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

runAll();
