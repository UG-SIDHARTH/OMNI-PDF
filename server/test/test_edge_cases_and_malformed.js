import fs from 'fs';
import http from 'http';
import assert from 'assert';

console.log('================================================================');
console.log('🧪 PART 1: SYSTEMATIC EDGE-CASE & MALFORMED REQUEST SUITE');
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

async function uploadRaw(buffer, filename, mimeType, sessionId = 'edge_session') {
  const boundary = '----WebKitFormBoundaryEdgeCase';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`;
  body += `Content-Type: ${mimeType}\r\n\r\n`;

  const headerBuf = Buffer.from(body, 'utf8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const fullBody = Buffer.concat([headerBuf, buffer, footerBuf]);

  return await makeRequest({
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
}

async function testEdgeCases() {
  console.log('--- 1. Testing Zero-Byte File Upload ---');
  const zeroRes = await uploadRaw(Buffer.alloc(0), 'empty.pdf', 'application/pdf');
  console.log(`  Zero-byte Upload: HTTP ${zeroRes.statusCode} (${zeroRes.json?.error || 'Accepted'})`);
  assert.strictEqual(zeroRes.statusCode, 400, 'Zero-byte upload must be rejected with 400 Bad Request');

  console.log('\n--- 2. Testing Corrupted / Truncated PDF File Upload ---');
  const corruptBuf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nCORRUPTED_TRUNCATED_STREAM', 'utf8');
  const corruptRes = await uploadRaw(corruptBuf, 'corrupted.pdf', 'application/pdf');
  console.log(`  Corrupted Upload Status: HTTP ${corruptRes.statusCode} (Uploaded: ${corruptRes.json?.files?.[0]?.fileId})`);
  
  // Now process corrupted file in a tool (e.g. merge / split)
  if (corruptRes.json?.files?.[0]?.fileId) {
    const procRes = await makeRequest({
      hostname: 'localhost', port: 8092, path: '/api/pdf/rotate', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session-id': 'edge_session' }
    }, JSON.stringify({ fileId: corruptRes.json.files[0].fileId, angle: 90 }));
    console.log(`  Processing Corrupted PDF in /api/pdf/rotate: HTTP ${procRes.statusCode} (Error: "${procRes.json?.error}")`);
    assert.strictEqual(procRes.statusCode, 500, 'Corrupted PDF should return clean 500 JSON error');
  }

  console.log('\n--- 3. Testing File with Wrong / Executable Extension (.exe spoofed as pdf) ---');
  const exeBuf = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF', 'binary');
  const exeRes = await uploadRaw(exeBuf, 'malware.exe', 'application/x-msdownload');
  console.log(`  EXE Upload Status: HTTP ${exeRes.statusCode} (${exeRes.json?.error || 'Rejected'})`);
  assert.strictEqual(exeRes.statusCode, 400, 'Executable must be rejected with 400 Bad Request');

  console.log('\n--- 4. Testing Oversized File (>50MB Limit) ---');
  // Send Content-Length > 52428800 without sending all data
  const overRes = await makeRequest({
    hostname: 'localhost',
    port: 8092,
    path: '/api/upload',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundaryEdgeCase',
      'Content-Length': 60 * 1024 * 1024,
      'x-session-id': 'edge_session'
    }
  });
  console.log(`  Oversized Header Status: HTTP ${overRes.statusCode} (${overRes.json?.error || overRes.body})`);

  console.log('\n--- 5. Testing Malformed Direct Endpoint Payloads ---');
  const endpoints = [
    { path: '/api/pdf/merge', payload: {} },
    { path: '/api/pdf/split', payload: { fileId: 'nonexistent-uuid-1234' } },
    { path: '/api/pdf/rotate', payload: 'INVALID_JSON_RAW_STRING' },
    { path: '/api/pdf/organize', payload: { fileId: 'fake-id', pageOrders: 'NOT_AN_ARRAY' } },
    { path: '/api/pdf/word-to-pdf', payload: { missingFileId: true } },
    { path: '/api/pdf/pdf-to-markdown', payload: { fileId: '00000000-0000-0000-0000-000000000000' } }
  ];

  for (const ep of endpoints) {
    const isString = typeof ep.payload === 'string';
    const postBody = isString ? ep.payload : JSON.stringify(ep.payload);
    const res = await makeRequest({
      hostname: 'localhost',
      port: 8092,
      path: ep.path,
      method: 'POST',
      headers: {
        'Content-Type': isString ? 'text/plain' : 'application/json',
        'x-session-id': 'edge_session'
      }
    }, postBody);
    console.log(`  Endpoint ${ep.path.padEnd(26)}: HTTP ${res.statusCode} | Response: ${JSON.stringify(res.json || res.body.slice(0, 60))}`);
    assert.ok(res.statusCode >= 400 && res.statusCode < 600, 'Malformed payload must return 4xx or 5xx JSON');
  }

  console.log('\n--- 6. Testing Rapid Double Submission (Race Condition) ---');
  // Upload a valid test PDF
  const validDoc = await (await import('pdf-lib')).PDFDocument.create();
  validDoc.addPage().drawText('Race Condition Test Page', { x: 50, y: 700 });
  const validBytes = Buffer.from(await validDoc.save());
  const vUp = await uploadRaw(validBytes, 'RaceTest.pdf', 'application/pdf');
  const validFileId = vUp.json?.files?.[0]?.fileId;

  if (validFileId) {
    const [call1, call2] = await Promise.all([
      makeRequest({
        hostname: 'localhost', port: 8092, path: '/api/pdf/rotate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'edge_session' }
      }, JSON.stringify({ fileId: validFileId, angle: 90 })),
      makeRequest({
        hostname: 'localhost', port: 8092, path: '/api/pdf/rotate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': 'edge_session' }
      }, JSON.stringify({ fileId: validFileId, angle: 180 }))
    ]);
    console.log(`  Concurrent Request 1: HTTP ${call1.statusCode} (${call1.json?.originalName})`);
    console.log(`  Concurrent Request 2: HTTP ${call2.statusCode} (${call2.json?.originalName})`);
    assert.strictEqual(call1.statusCode, 200, 'Call 1 succeeded');
    assert.strictEqual(call2.statusCode, 200, 'Call 2 succeeded');
  }

  console.log('\n--- 7. Health Check: Server Survived All Edge Tests ---');
  const healthRes = await makeRequest({ hostname: 'localhost', port: 8092, path: '/api/health', method: 'GET' });
  console.log(`  Server Health Status: HTTP ${healthRes.statusCode} | JSON: ${JSON.stringify(healthRes.json)}`);
  assert.strictEqual(healthRes.statusCode, 200, 'Server must remain 100% healthy');

  console.log('\n🎉 ALL EDGE-CASE AND MALFORMED REQUEST TESTS PASSED WITHOUT PROCESS CRASHES!');
}

testEdgeCases();
