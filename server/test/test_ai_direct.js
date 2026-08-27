import fs from 'fs';
import http from 'http';
import { PDFDocument } from 'pdf-lib';

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
  const boundary = '----WebKitFormBoundaryAiTest';
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
      'x-session-id': 'ai_test_session'
    }
  }, fullBody);

  return res.json && res.json.files ? res.json.files[0] : null;
}

async function testAi() {
  const pDoc = await PDFDocument.create();
  pDoc.addPage().drawText('Artificial Intelligence and Machine Learning Research Paper 2026', { x: 50, y: 700 });
  const buf = Buffer.from(await pDoc.save());

  const u = await uploadFile(buf, 'AiDoc.pdf');
  console.log('Uploaded File:', u?.fileId);

  const sumRes = await makeRequest({
    hostname: 'localhost', port: 8092, path: '/api/pdf/ai-summarizer', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'ai_test_session' }
  }, JSON.stringify({ fileId: u.fileId }));
  console.log('AI Summarizer Status:', sumRes.statusCode, sumRes.json ? 'PASS' : sumRes.body);

  const transRes = await makeRequest({
    hostname: 'localhost', port: 8092, path: '/api/pdf/translate', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-session-id': 'ai_test_session' }
  }, JSON.stringify({ fileId: u.fileId, sourceLang: 'English', targetLang: 'Spanish' }));
  console.log('Translate PDF Status:', transRes.statusCode, transRes.json ? 'PASS' : transRes.body);
}

testAi();
