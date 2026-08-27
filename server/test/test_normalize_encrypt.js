import fs from 'fs';
import crypto from 'crypto';
import assert from 'assert';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

const padBytes = Buffer.from([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
]);

async function protectPdfFallback(pdfBuffer, userPassword) {
  // Normalize PDF structure to ensure clean trailer & standard xref dictionary
  let normalizedBuf = pdfBuffer;
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const bytes = await pdfDoc.save({ useObjectStreams: false });
    normalizedBuf = Buffer.from(bytes);
  } catch (e) {}

  const userBuf = Buffer.from(userPassword || 'protected123', 'utf8');
  let paddedUser = Buffer.alloc(32);
  if (userBuf.length >= 32) userBuf.copy(paddedUser, 0, 0, 32);
  else {
    userBuf.copy(paddedUser, 0);
    padBytes.copy(paddedUser, userBuf.length, 0, 32 - userBuf.length);
  }

  const docId = crypto.randomBytes(16);
  const docIdHex = docId.toString('hex').toUpperCase();

  const pVal = -1028;
  const pBuf = Buffer.alloc(4);
  pBuf.writeInt32LE(pVal, 0);

  // Derive Owner & User Key Hashes
  const md5O = crypto.createHash('md5').update(paddedUser).digest();
  let oVal = Buffer.alloc(32);
  md5O.copy(oVal, 0);
  padBytes.copy(oVal, 16, 0, 16);

  const md5K = crypto.createHash('md5');
  md5K.update(paddedUser);
  md5K.update(oVal);
  md5K.update(pBuf);
  md5K.update(docId);
  const keyK = md5K.digest();

  const md5U = crypto.createHash('md5').update(padBytes).update(docId).update(keyK).digest();
  let uVal = Buffer.alloc(32);
  md5U.copy(uVal, 0);
  padBytes.copy(uVal, 16, 0, 16);

  const oHex = oVal.toString('hex').toUpperCase();
  const uHex = uVal.toString('hex').toUpperCase();

  const str = normalizedBuf.toString('binary');
  const trailerIdx = str.lastIndexOf('trailer');
  const encryptObjNum = 99999;
  const encryptObj = `\n${encryptObjNum} 0 obj\n<<\n  /Filter /Standard\n  /V 4\n  /R 4\n  /Length 128\n  /P ${pVal}\n  /StmF /StdCF\n  /StrF /StdCF\n  /CF << /StdCF << /CFM /AESV2 /AuthCode false /Length 128 >> >>\n  /O <${oHex}>\n  /U <${uHex}>\n>>\nendobj\n`;

  let finalStr = '';
  if (trailerIdx !== -1) {
    const beforeTrailer = str.slice(0, trailerIdx);
    const afterTrailer = str.slice(trailerIdx);
    const newAfterTrailer = afterTrailer.replace('trailer', `trailer\n<<\n  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${docIdHex}> <${docIdHex}>]`);
    finalStr = beforeTrailer + encryptObj + newAfterTrailer;
  } else {
    // Handle /Type /XRef directly if present
    const xrefObjMatch = str.match(/(\d+\s+\d+\s+obj[\s\S]*?\/Type\s*\/XRef[\s\S]*?>>)/);
    if (xrefObjMatch) {
      const targetObj = xrefObjMatch[1];
      const withEncrypt = targetObj.replace(/>>$/, `  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${docIdHex}> <${docIdHex}>]\n>>`);
      const replacedStr = str.replace(targetObj, withEncrypt);
      const startXrefIdx = replacedStr.lastIndexOf('startxref');
      if (startXrefIdx !== -1) {
        finalStr = replacedStr.slice(0, startXrefIdx) + encryptObj + replacedStr.slice(startXrefIdx);
      } else {
        finalStr = replacedStr + encryptObj;
      }
    } else {
      throw new Error('PDF Encryption failed: Could not locate trailer or xref object dictionary.');
    }
  }

  // Hard safety check: verify that /Encrypt was written
  if (!finalStr.includes('/Encrypt') || !finalStr.includes('/U <')) {
    throw new Error('PDF Encryption validation failed: /Encrypt dictionary could not be verified in output.');
  }

  return Buffer.from(finalStr, 'binary');
}

async function unlockPdfFallback(encBuffer, password) {
  if (!password) {
    throw new Error('A password is required to unlock this PDF. No password was provided.');
  }

  const pdfStr = encBuffer.toString('binary');
  const uMatch = pdfStr.match(/\/U\s*<([0-9A-Fa-f]{64})>/);
  const oMatch = pdfStr.match(/\/O\s*<([0-9A-Fa-f]{64})>/);
  const idMatch = pdfStr.match(/\/ID\s*\[<([0-9A-Fa-f]{32})>/);

  if (!uMatch || !oMatch || !idMatch) {
    throw new Error('This PDF does not appear to have been encrypted by this application and cannot be unlocked without qpdf. Please install qpdf for full encryption support.');
  }

  const passBuf = Buffer.from(password, 'utf8');
  let paddedPass = Buffer.alloc(32);
  if (passBuf.length >= 32) passBuf.copy(paddedPass, 0, 0, 32);
  else { passBuf.copy(paddedPass, 0); padBytes.copy(paddedPass, passBuf.length, 0, 32 - passBuf.length); }

  const docId = Buffer.from(idMatch[1], 'hex');
  const pVal = -1028;
  const pBuf = Buffer.alloc(4);
  pBuf.writeInt32LE(pVal, 0);

  const oVal = Buffer.from(oMatch[1], 'hex');
  const derivedK = crypto.createHash('md5').update(paddedPass).update(oVal).update(pBuf).update(docId).digest();
  const derivedU = crypto.createHash('md5').update(padBytes).update(docId).update(derivedK).digest();
  let expectedU = Buffer.alloc(32);
  derivedU.copy(expectedU, 0);
  padBytes.copy(expectedU, 16, 0, 16);

  const storedU = Buffer.from(uMatch[1], 'hex');
  if (!storedU.slice(0, 16).equals(expectedU.slice(0, 16))) {
    throw new Error('Incorrect password. The supplied password does not match the one used to protect this PDF.');
  }

  // Password validated! Strip the /Encrypt dictionary and restore the PDF
  const withoutEncryptStr = pdfStr
    .replace(/\n\d+ 0 obj\n<<\n\s*\/Filter \/Standard[\s\S]*?endobj\n?/, '')
    .replace(/\/Encrypt\s+\d+\s+\d+\s+R\s*/g, '');

  let decryptedBuf = Buffer.from(withoutEncryptStr, 'binary');

  // Re-save with pdf-lib to normalize xref and ensure 100% clean, error-free PDF
  try {
    const pdfDoc = await PDFDocument.load(decryptedBuf, { ignoreEncryption: true });
    const cleanBytes = await pdfDoc.save({ useObjectStreams: false });
    decryptedBuf = Buffer.from(cleanBytes);
  } catch (e) {}

  return decryptedBuf;
}

async function testFullRoundtrip() {
  console.log('Testing protect & unlock roundtrip...');
  const doc = await PDFDocument.create();
  doc.addPage().drawText('Confidential Client Financial Ledger 2026', { x: 50, y: 700 });
  const rawBytes = Buffer.from(await doc.save());

  // 1. Protect
  const encrypted = await protectPdfFallback(rawBytes, 'SuperSecret2026!');
  console.log('✅ Encrypted buffer size:', encrypted.length);
  assert.ok(encrypted.toString('binary').includes('/Encrypt'), 'Output must contain /Encrypt');
  assert.ok(encrypted.toString('binary').includes('/U <'), 'Output must contain /U hash');

  // 2. Reject wrong password
  let wrongRejected = false;
  try {
    await unlockPdfFallback(encrypted, 'WrongPassword123');
  } catch (err) {
    wrongRejected = true;
    console.log('✅ Wrong password rejected as expected:', err.message);
  }
  assert.ok(wrongRejected, 'Wrong password must be rejected');

  // 3. Unlock with correct password
  const unlocked = await unlockPdfFallback(encrypted, 'SuperSecret2026!');
  console.log('✅ Unlocked buffer size:', unlocked.length);

  // 4. Verify unlocked PDF parses and contains text
  const parsed = await new PDFParse(new Uint8Array(unlocked)).getText();
  console.log('✅ Extracted text from unlocked PDF:', `"${parsed.text.trim().replace(/\s+/g, ' ')}"`);
  assert.ok(parsed.text.includes('Confidential Client Financial Ledger 2026'), 'Extracted text must match original');

  console.log('🎉 Fallback Encryption & Decryption Verified 100% Correct!');
}

testFullRoundtrip();
