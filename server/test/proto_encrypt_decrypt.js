import fs from 'fs';
import crypto from 'crypto';
import assert from 'assert';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

const padBytes = Buffer.from([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
]);

function encryptPdfAES128(pdfBuffer, userPassword) {
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

  const str = pdfBuffer.toString('binary');
  const encryptObjNum = 99999;
  const encryptObj = `\n${encryptObjNum} 0 obj\n<<\n  /Filter /Standard\n  /V 4\n  /R 4\n  /Length 128\n  /P ${pVal}\n  /StmF /StdCF\n  /StrF /StdCF\n  /CF << /StdCF << /CFM /AESV2 /AuthCode false /Length 128 >> >>\n  /O <${oHex}>\n  /U <${uHex}>\n>>\nendobj\n`;

  // Encrypt streams inside objects using AES-128-CBC
  const updatedStr = str.replace(/(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g, (match, objNumStr, genNumStr, body) => {
    const objNum = parseInt(objNumStr, 10);
    const genNum = parseInt(genNumStr, 10);

    if (objNum === encryptObjNum) return match;
    // Don't encrypt XRef streams or ObjStm streams directly in fallback to maintain parser structure
    if (body.includes('/Type /XRef') || body.includes('/Type/XRef')) return match;

    const objKeyBuf = Buffer.alloc(9);
    objKeyBuf.writeUInt32LE(objNum, 0);
    objKeyBuf.writeUInt16LE(genNum, 4);
    objKeyBuf[6] = 0x73; // 's'
    objKeyBuf[7] = 0x41; // 'A'
    objKeyBuf[8] = 0x6C; // 'l'

    const objHash = crypto.createHash('md5').update(keyK).update(objKeyBuf).digest();
    const objKey = objHash.slice(0, 16);

    const encryptedBody = body.replace(/(stream\r?\n)([\s\S]*?)(\r?\nendstream)/g, (sMatch, streamHead, streamData, streamTail) => {
      const dataBuf = Buffer.from(streamData, 'binary');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-128-cbc', objKey, iv);
      const encData = Buffer.concat([iv, cipher.update(dataBuf), cipher.final()]);
      return streamHead + encData.toString('binary') + streamTail;
    });

    return `${objNum} ${genNum} obj${encryptedBody}endobj`;
  });

  const trailerIdx = updatedStr.lastIndexOf('trailer');
  let finalStr = '';

  if (trailerIdx !== -1) {
    // Case 1: Classic trailer
    const beforeTrailer = updatedStr.slice(0, trailerIdx);
    const afterTrailer = updatedStr.slice(trailerIdx);
    const newAfterTrailer = afterTrailer.replace('trailer', `trailer\n<<\n  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${docIdHex}> <${docIdHex}>]`);
    finalStr = beforeTrailer + encryptObj + newAfterTrailer;
  } else {
    // Case 2: PDF 1.5+ Cross-Reference Stream (/Type /XRef)
    const xrefObjMatch = updatedStr.match(/(\d+\s+\d+\s+obj[\s\S]*?\/Type\s*\/XRef[\s\S]*?>>)/);
    if (xrefObjMatch) {
      const targetObj = xrefObjMatch[1];
      const withEncrypt = targetObj.replace(/>>$/, `  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${docIdHex}> <${docIdHex}>]\n>>`);
      const replacedStr = updatedStr.replace(targetObj, withEncrypt);
      // Place encryptObj before startxref or at EOF
      const startXrefIdx = replacedStr.lastIndexOf('startxref');
      if (startXrefIdx !== -1) {
        finalStr = replacedStr.slice(0, startXrefIdx) + encryptObj + replacedStr.slice(startXrefIdx);
      } else {
        finalStr = replacedStr + encryptObj;
      }
    } else {
      // Cannot identify structure
      throw new Error('Unable to identify PDF structure (neither classic trailer nor /Type /XRef found).');
    }
  }

  // Safety check: verify /Encrypt and /U exist in output
  if (!finalStr.includes('/Encrypt') || !finalStr.includes('/U <')) {
    throw new Error('PDF Encryption validation failed: /Encrypt dictionary could not be committed.');
  }

  return Buffer.from(finalStr, 'binary');
}

function decryptPdfAES128(encBuffer, password) {
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

  // Password valid! Decrypt streams inside objects
  const decryptedStr = pdfStr.replace(/(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g, (match, objNumStr, genNumStr, body) => {
    const objNum = parseInt(objNumStr, 10);
    const genNum = parseInt(genNumStr, 10);

    if (objNum === 99999) return ''; // Strip encrypt object
    if (body.includes('/Type /XRef') || body.includes('/Type/XRef')) return match;

    const objKeyBuf = Buffer.alloc(9);
    objKeyBuf.writeUInt32LE(objNum, 0);
    objKeyBuf.writeUInt16LE(genNum, 4);
    objKeyBuf[6] = 0x73;
    objKeyBuf[7] = 0x41;
    objKeyBuf[8] = 0x6C;

    const objHash = crypto.createHash('md5').update(derivedK).update(objKeyBuf).digest();
    const objKey = objHash.slice(0, 16);

    const decryptedBody = body.replace(/(stream\r?\n)([\s\S]*?)(\r?\nendstream)/g, (sMatch, streamHead, streamData, streamTail) => {
      try {
        const rawBuf = Buffer.from(streamData, 'binary');
        if (rawBuf.length < 16) return sMatch;
        const iv = rawBuf.slice(0, 16);
        const encData = rawBuf.slice(16);
        const decipher = crypto.createDecipheriv('aes-128-cbc', objKey, iv);
        const decData = Buffer.concat([decipher.update(encData), decipher.final()]);
        return streamHead + decData.toString('binary') + streamTail;
      } catch (err) {
        return sMatch;
      }
    });

    return `${objNum} ${genNum} obj${decryptedBody}endobj`;
  });

  const withoutEncrypt = decryptedStr
    .replace(/\n\d+ 0 obj\n<<\n\s*\/Filter \/Standard[\s\S]*?endobj\n?/, '')
    .replace(/\/Encrypt\s+\d+\s+\d+\s+R\s*/g, '');

  return Buffer.from(withoutEncrypt, 'binary');
}

async function testRoundtrip() {
  console.log('Testing protect & unlock roundtrip on PDF 1.5+ XRef format...');
  const doc = await PDFDocument.create();
  doc.addPage().drawText('Secret Confidentially Protected Document Content', { x: 50, y: 700 });
  const rawBytes = Buffer.from(await doc.save());

  // 1. Encrypt with password
  const encrypted = encryptPdfAES128(rawBytes, 'MySecretPassword123');
  console.log('✅ Encrypted Buffer size:', encrypted.length);
  assert.ok(encrypted.toString('binary').includes('/Encrypt'), 'Output must contain /Encrypt');
  assert.ok(encrypted.toString('binary').includes('/U <'), 'Output must contain /U hash');

  // 2. Try decrypting with wrong password (must fail)
  let wrongPassFailed = false;
  try {
    decryptPdfAES128(encrypted, 'WrongPassword');
  } catch (err) {
    wrongPassFailed = true;
    console.log('✅ Wrong password rejected:', err.message);
  }
  assert.ok(wrongPassFailed, 'Wrong password must be rejected');

  // 3. Decrypt with correct password
  const decrypted = decryptPdfAES128(encrypted, 'MySecretPassword123');
  console.log('✅ Decrypted Buffer size:', decrypted.length);

  // 4. Verify decrypted PDF can be parsed
  const parsed = await new PDFParse(new Uint8Array(decrypted)).getText();
  console.log('✅ Extracted text from unlocked PDF:', `"${parsed.text.trim()}"`);
  assert.ok(parsed.text.includes('Secret Confidentially Protected Document Content'), 'Text must match original');

  console.log('🎉 Roundtrip Passed Perfectly!');
}

testRoundtrip();
