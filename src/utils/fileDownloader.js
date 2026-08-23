import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Converts a Blob or File object to a Base64 string and data URL
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : '';
      resolve({ base64, dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Universal platform-aware document and media file saver
 * Supports:
 * 1. Electron Desktop (.exe): Uses IPC save dialog & native file write
 * 2. Capacitor Android (.apk): Uses Capacitor Filesystem & Share sheet
 * 3. Web / PWA: Uses standard Blob <a download> click
 */
export async function saveFileUniversal({ blob, blobUrl, filename = 'document.pdf', mimeType = 'application/pdf' }) {
  try {
    let finalBlob = blob;
    if (!finalBlob && blobUrl) {
      const resp = await fetch(blobUrl);
      finalBlob = await resp.blob();
    }

    if (!finalBlob) {
      throw new Error('No file data available to download.');
    }

    // 1. Electron Desktop Environment
    if (typeof window !== 'undefined' && window.omniDesktop?.saveFile) {
      const { base64 } = await blobToBase64(finalBlob);
      const result = await window.omniDesktop.saveFile({
        filename,
        base64Data: base64,
        mimeType: finalBlob.type || mimeType
      });
      if (result?.canceled) return;
      if (result?.error) throw new Error(result.error);
      return;
    }

    // 2. Capacitor Native Android / iOS Environment
    if (
      typeof window !== 'undefined' &&
      window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === 'function' &&
      window.Capacitor.isNativePlatform()
    ) {
      const { base64 } = await blobToBase64(finalBlob);
      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      const writeResult = await Filesystem.writeFile({
        path: cleanFilename,
        data: base64,
        directory: Directory.Cache,
        recursive: true
      });

      await Share.share({
        title: filename,
        text: `OmniPDF Document: ${filename}`,
        url: writeResult.uri,
        dialogTitle: `Save or Share ${filename}`
      });
      return;
    }

    // 3. Web / PWA Browser Environment
    const activeUrl = blobUrl || URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = activeUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!blobUrl) {
      setTimeout(() => URL.revokeObjectURL(activeUrl), 15000);
    }
  } catch (err) {
    console.error('Universal save error:', err);
    // Safe browser fallback
    try {
      const activeUrl = blobUrl || (blob ? URL.createObjectURL(blob) : null);
      if (activeUrl) {
        const link = document.createElement('a');
        link.href = activeUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (fallbackErr) {
      alert(`Failed to save file: ${err.message}`);
    }
  }
}
