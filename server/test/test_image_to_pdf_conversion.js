import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { PDFDocument } from 'pdf-lib';
import { createPng } from './generate_pngs.js';

const portraitBuf = createPng(300, 450, [239, 68, 68]);   // Red 300x450 Portrait
const landscapeBuf = createPng(600, 337, [59, 130, 246]); // Blue 600x337 Landscape
const squareBuf = createPng(400, 400, [16, 185, 129]);   // Green 400x400 Square

function getPageDimensions(sizeKey, isLandscape, imgWidth, imgHeight) {
  let width = 595.28;
  let height = 841.89;

  switch (sizeKey) {
    case 'letter':
      width = 612;
      height = 792;
      break;
    case 'legal':
      width = 612;
      height = 1008;
      break;
    case 'a3':
      width = 841.89;
      height = 1190.55;
      break;
    case 'fit':
      width = imgWidth || 595.28;
      height = imgHeight || 841.89;
      break;
    case 'a4':
    default:
      width = 595.28;
      height = 841.89;
      break;
  }

  if (sizeKey !== 'fit' && isLandscape) {
    return { width: Math.max(width, height), height: Math.min(width, height) };
  }
  return { width, height };
}

function getMarginSize(marginKey) {
  switch (marginKey) {
    case 'small': return 20;
    case 'big': return 50;
    case 'none':
    default: return 0;
  }
}

async function convertImagesToPdf(imagesList, options) {
  const { orientation = 'portrait', pageSize = 'a4', margin = 'small', mergeAll = true } = options;
  const isLandscape = orientation === 'landscape';
  const marginPt = getMarginSize(margin);

  if (mergeAll) {
    const pdfDoc = await PDFDocument.create();
    for (const imgItem of imagesList) {
      const embeddedImg = await pdfDoc.embedPng(imgItem.buffer);
      const pageDim = getPageDimensions(pageSize, isLandscape, embeddedImg.width, embeddedImg.height);
      const page = pdfDoc.addPage([pageDim.width, pageDim.height]);

      const printableWidth = pageDim.width - 2 * marginPt;
      const printableHeight = pageDim.height - 2 * marginPt;
      const scale = Math.min(printableWidth / embeddedImg.width, printableHeight / embeddedImg.height, 1);
      const drawWidth = embeddedImg.width * scale;
      const drawHeight = embeddedImg.height * scale;

      const x = (pageDim.width - drawWidth) / 2;
      const y = (pageDim.height - drawHeight) / 2;

      page.drawImage(embeddedImg, { x, y, width: drawWidth, height: drawHeight });
    }
    const pdfBytes = await pdfDoc.save();
    return [{ name: 'Merged.pdf', bytes: pdfBytes }];
  } else {
    const results = [];
    for (let i = 0; i < imagesList.length; i++) {
      const imgItem = imagesList[i];
      const pdfDoc = await PDFDocument.create();
      const embeddedImg = await pdfDoc.embedPng(imgItem.buffer);
      const pageDim = getPageDimensions(pageSize, isLandscape, embeddedImg.width, embeddedImg.height);
      const page = pdfDoc.addPage([pageDim.width, pageDim.height]);

      const printableWidth = pageDim.width - 2 * marginPt;
      const printableHeight = pageDim.height - 2 * marginPt;
      const scale = Math.min(printableWidth / embeddedImg.width, printableHeight / embeddedImg.height, 1);
      const drawWidth = embeddedImg.width * scale;
      const drawHeight = embeddedImg.height * scale;

      const x = (pageDim.width - drawWidth) / 2;
      const y = (pageDim.height - drawHeight) / 2;

      page.drawImage(embeddedImg, { x, y, width: drawWidth, height: drawHeight });
      const pdfBytes = await pdfDoc.save();
      results.push({ name: `${imgItem.name}.pdf`, bytes: pdfBytes });
    }
    return results;
  }
}

async function runRealOutputTests() {
  console.log('====================================================');
  console.log('📄 IMAGE TO PDF REAL OUTPUT VERIFICATION');
  console.log('====================================================\n');

  // SECTION 3: SINGLE IMAGE TESTS
  console.log('--- SECTION 3: SINGLE IMAGE COMBINATIONS ---');
  
  // 3.1: Portrait + A4 + No margin
  const res3_1 = await convertImagesToPdf([{ name: 'portrait', buffer: portraitBuf }], { orientation: 'portrait', pageSize: 'a4', margin: 'none', mergeAll: true });
  const doc3_1 = await PDFDocument.load(res3_1[0].bytes);
  const p3_1 = doc3_1.getPage(0);
  console.log(`[3.1 Portrait + A4 + No margin]`);
  console.log(`  Page count: ${doc3_1.getPageCount()}`);
  console.log(`  Dimensions: ${p3_1.getWidth().toFixed(2)} x ${p3_1.getHeight().toFixed(2)} pt (Expected: 595.28 x 841.89)`);
  assert.strictEqual(doc3_1.getPageCount(), 1);
  assert(Math.abs(p3_1.getWidth() - 595.28) < 0.1);
  assert(Math.abs(p3_1.getHeight() - 841.89) < 0.1);
  console.log(`  Result: PASS\n`);

  // 3.2: Landscape + A4 + Small margin
  const res3_2 = await convertImagesToPdf([{ name: 'portrait', buffer: portraitBuf }], { orientation: 'landscape', pageSize: 'a4', margin: 'small', mergeAll: true });
  const doc3_2 = await PDFDocument.load(res3_2[0].bytes);
  const p3_2 = doc3_2.getPage(0);
  console.log(`[3.2 Landscape + A4 + Small margin]`);
  console.log(`  Page count: ${doc3_2.getPageCount()}`);
  console.log(`  Dimensions: ${p3_2.getWidth().toFixed(2)} x ${p3_2.getHeight().toFixed(2)} pt (Expected: 841.89 x 595.28)`);
  assert.strictEqual(doc3_2.getPageCount(), 1);
  assert(Math.abs(p3_2.getWidth() - 841.89) < 0.1);
  assert(Math.abs(p3_2.getHeight() - 595.28) < 0.1);
  console.log(`  Result: PASS\n`);

  // 3.3: Portrait + Letter + Big margin
  const res3_3 = await convertImagesToPdf([{ name: 'portrait', buffer: portraitBuf }], { orientation: 'portrait', pageSize: 'letter', margin: 'big', mergeAll: true });
  const doc3_3 = await PDFDocument.load(res3_3[0].bytes);
  const p3_3 = doc3_3.getPage(0);
  console.log(`[3.3 Portrait + Letter + Big margin]`);
  console.log(`  Page count: ${doc3_3.getPageCount()}`);
  console.log(`  Dimensions: ${p3_3.getWidth().toFixed(2)} x ${p3_3.getHeight().toFixed(2)} pt (Expected: 612.00 x 792.00)`);
  assert.strictEqual(doc3_3.getPageCount(), 1);
  assert(Math.abs(p3_3.getWidth() - 612.0) < 0.1);
  assert(Math.abs(p3_3.getHeight() - 792.0) < 0.1);
  console.log(`  Result: PASS\n`);

  // 3.4: Portrait + Fit to Image
  const res3_4 = await convertImagesToPdf([{ name: 'portrait', buffer: portraitBuf }], { orientation: 'portrait', pageSize: 'fit', margin: 'none', mergeAll: true });
  const doc3_4 = await PDFDocument.load(res3_4[0].bytes);
  const p3_4 = doc3_4.getPage(0);
  console.log(`[3.4 Portrait + Fit to Image]`);
  console.log(`  Page count: ${doc3_4.getPageCount()}`);
  console.log(`  Dimensions: ${p3_4.getWidth().toFixed(2)} x ${p3_4.getHeight().toFixed(2)} pt (Expected: 300.00 x 450.00)`);
  assert.strictEqual(doc3_4.getPageCount(), 1);
  assert(Math.abs(p3_4.getWidth() - 300.0) < 0.1);
  assert(Math.abs(p3_4.getHeight() - 450.0) < 0.1);
  console.log(`  Result: PASS\n`);

  // SECTION 4: MULTIPLE IMAGES TESTS
  console.log('--- SECTION 4: MULTIPLE IMAGES COMBINATIONS ---');
  const multiImages = [
    { name: 'portrait_photo', buffer: portraitBuf },
    { name: 'landscape_photo', buffer: landscapeBuf },
    { name: 'square_photo', buffer: squareBuf }
  ];

  // 4.1: Merge ON
  const res4_1 = await convertImagesToPdf(multiImages, { orientation: 'portrait', pageSize: 'a4', margin: 'small', mergeAll: true });
  const doc4_1 = await PDFDocument.load(res4_1[0].bytes);
  console.log(`[4.1 Merge ON]`);
  console.log(`  Generated file count: ${res4_1.length}`);
  console.log(`  Page count in merged PDF: ${doc4_1.getPageCount()}`);
  assert.strictEqual(res4_1.length, 1);
  assert.strictEqual(doc4_1.getPageCount(), 3);
  console.log(`  Result: PASS\n`);

  // 4.2: Merge OFF
  const res4_2 = await convertImagesToPdf(multiImages, { orientation: 'portrait', pageSize: 'a4', margin: 'small', mergeAll: false });
  console.log(`[4.2 Merge OFF]`);
  console.log(`  Generated file count: ${res4_2.length}`);
  for (let i = 0; i < res4_2.length; i++) {
    const singleDoc = await PDFDocument.load(res4_2[i].bytes);
    console.log(`  File ${i+1}: ${res4_2[i].name} (Page count: ${singleDoc.getPageCount()})`);
    assert.strictEqual(singleDoc.getPageCount(), 1);
  }
  assert.strictEqual(res4_2.length, 3);
  console.log(`  Result: PASS\n`);

  // 4.3: Drag and drop reordering before conversion
  const reorderedImages = [multiImages[2], multiImages[0], multiImages[1]]; // [square, portrait, landscape]
  const res4_3 = await convertImagesToPdf(reorderedImages, { orientation: 'portrait', pageSize: 'a4', margin: 'small', mergeAll: true });
  const doc4_3 = await PDFDocument.load(res4_3[0].bytes);
  console.log(`[4.3 Drag-and-drop reordered sequence]`);
  console.log(`  Page count: ${doc4_3.getPageCount()}`);
  assert.strictEqual(doc4_3.getPageCount(), 3);
  console.log(`  Result: PASS\n`);

  // 4.4: Removal from queue before conversion
  const reducedImages = multiImages.filter(img => img.name !== 'landscape_photo'); // remove landscape
  const res4_4 = await convertImagesToPdf(reducedImages, { orientation: 'portrait', pageSize: 'a4', margin: 'small', mergeAll: true });
  const doc4_4 = await PDFDocument.load(res4_4[0].bytes);
  console.log(`[4.4 Removal from queue]`);
  console.log(`  Page count: ${doc4_4.getPageCount()} (Expected: 2)`);
  assert.strictEqual(doc4_4.getPageCount(), 2);
  console.log(`  Result: PASS\n`);
}

runRealOutputTests();
