import { PDFParse } from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';

async function testPdfParse() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  page.drawText('Sample Header Title\nThis is paragraph one with text.\nThis is paragraph two with bullet points.\n- Item 1\n- Item 2\n\nTable Header A   Table Header B\nData 100         Data 200', { x: 50, y: 750, size: 14 });
  const bytes = await pdfDoc.save();

  try {
    const parser = new PDFParse(new Uint8Array(bytes));
    const result = await parser.getText();
    console.log('PDFParse getText():\n-------------------');
    console.log(result.text);
    console.log('-------------------');
  } catch (err) {
    console.error('PDFParse error:', err);
  }
}

testPdfParse();
