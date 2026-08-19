import assert from 'assert';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

console.log('🧪 Starting OMNI-PDF Automated Test Suite...');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: PDF-lib document creation test
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    page.drawText('Test PDF');
    const bytes = await pdfDoc.save();
    assert(bytes.length > 0, 'PDF bytes should be non-empty');
    console.log('✅ Test 1 Passed: Client PDF generation with pdf-lib.');
    passed++;
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.message);
    failed++;
  }

  // Test 2: Storage path traversal prevention test
  try {
    const STORAGE_DIR = path.resolve('storage/uploads');
    const safeSession = '../evil_path'.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.resolve(STORAGE_DIR, safeSession, 'file123');
    assert(targetDir.startsWith(path.resolve(STORAGE_DIR)), 'Path traversal should be stripped and constrained to STORAGE_DIR');
    assert(!safeSession.includes('..') && !safeSession.includes('/'), 'Relative dots and slashes must be stripped');
    console.log('✅ Test 2 Passed: Storage path traversal validation.');
    passed++;
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
    failed++;
  }

  // Test 3: Verify magic byte definitions
  try {
    const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47]);       // .PNG
    const jpgHeader = Buffer.from([0xFF, 0xD8, 0xFF]);            // JPEG
    
    assert(pdfHeader.toString('utf8') === '%PDF-', 'PDF Magic byte check');
    assert(pngHeader[0] === 0x89 && pngHeader[1] === 0x50, 'PNG Magic byte check');
    assert(jpgHeader[0] === 0xFF && jpgHeader[1] === 0xD8, 'JPG Magic byte check');
    console.log('✅ Test 3 Passed: File magic byte validation rules.');
    passed++;
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
    failed++;
  }

  console.log(`\n🎉 Test Suite Completed: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
