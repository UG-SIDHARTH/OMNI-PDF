import fs from 'fs';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

function encryptPdfAES128(pdfBuffer, userPassword) {
  const padBytes = Buffer.from([
    0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
    0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
  ]);

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

  const md5U = crypto.createHash('md5').update(padBytes).update(docId).digest();
  let uVal = Buffer.alloc(32);
  md5U.copy(uVal, 0);
  padBytes.copy(uVal, 16, 0, 16);

  const oHex = oVal.toString('hex').toUpperCase();
  const uHex = uVal.toString('hex').toUpperCase();

  const str = pdfBuffer.toString('binary');
  const trailerIdx = str.lastIndexOf('trailer');
  if (trailerIdx === -1) return pdfBuffer;

  const encryptObjNum = 99999;
  const encryptObj = `\n${encryptObjNum} 0 obj\n<<\n  /Filter /Standard\n  /V 4\n  /R 4\n  /Length 128\n  /P ${pVal}\n  /StmF /StdCF\n  /StrF /StdCF\n  /CF << /StdCF << /CFM /AESV2 /AuthCode false /Length 128 >> >>\n  /O <${oHex}>\n  /U <${uHex}>\n>>\nendobj\n`;

  const updatedStr = str.replace(/(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g, (match, objNumStr, genNumStr, body) => {
    const objNum = parseInt(objNumStr, 10);
    const genNum = parseInt(genNumStr, 10);

    if (objNum === encryptObjNum) return match;

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

  const newTrailerIdx = updatedStr.lastIndexOf('trailer');
  const beforeTrailer = updatedStr.slice(0, newTrailerIdx);
  const afterTrailer = updatedStr.slice(newTrailerIdx);

  const newAfterTrailer = afterTrailer.replace('trailer', `trailer\n<<\n  /Encrypt ${encryptObjNum} 0 R\n  /ID [<${docIdHex}> <${docIdHex}>]`);

  const finalStr = beforeTrailer + encryptObj + newAfterTrailer;
  return Buffer.from(finalStr, 'binary');
}

async function test() {
  const pDoc = await PDFDocument.create();
  pDoc.addPage().drawText('Hello', { x: 50, y: 700 });
  const rawBytes = Buffer.from(await pDoc.save());

  const enc = encryptPdfAES128(rawBytes, 'mypass');
  const encStr = enc.toString('binary');

  console.log('encStr tail (last 500 chars):\n', encStr.slice(-500));

  const uMatch = encStr.match(/\/U\s*<([0-9A-Fa-f]{64})>/);
  const oMatch = encStr.match(/\/O\s*<([0-9A-Fa-f]{64})>/);
  const idMatch = encStr.match(/\/ID\s*\[<([0-9A-Fa-f]{32})>/);

  console.log('uMatch:', Boolean(uMatch));
  console.log('oMatch:', Boolean(oMatch));
  console.log('idMatch:', Boolean(idMatch));
}

test();
