import { PDFDocument } from 'pdf-lib';

async function testPdfLibSave() {
  const doc = await PDFDocument.create();
  doc.addPage().drawText('Hello World', { x: 50, y: 700 });

  const noObjStreamsBytes = await doc.save({ useObjectStreams: false });
  const str = Buffer.from(noObjStreamsBytes).toString('utf8');
  console.log('Has trailer:', str.includes('trailer'));
  console.log('Trailer section:\n', str.slice(str.lastIndexOf('trailer')));
}

testPdfLibSave();
