const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const http = require('http');

let mainWindow = null;
const SERVER_PORT = 8092;

// Function to check if local server is responsive
function checkServerReady(port, retries = 30, delay = 250) {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (attempts < retries) {
          setTimeout(check, delay);
        } else {
          resolve(false);
        }
      });
      req.on('error', () => {
        if (attempts < retries) {
          setTimeout(check, delay);
        } else {
          resolve(false);
        }
      });
      req.end();
    };
    check();
  });
}

// Start embedded Node.js backend inside the main Electron process for 100% offline PDF processing
async function startEmbeddedServer() {
  const userDataPath = app.getPath('userData');
  const storageDir = path.join(userDataPath, 'storage', 'uploads');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  process.env.STORAGE_DIR = storageDir;
  process.env.PORT = String(SERVER_PORT);
  process.env.NODE_ENV = app.isPackaged ? 'production' : 'development';

  try {
    // Resolve server file whether packaged or in development
    let serverScript = path.join(__dirname, '..', 'server', 'index.js');
    const unpackedServerScript = path.join(process.resourcesPath || '', 'app.asar.unpacked', 'server', 'index.js');
    
    if (app.isPackaged && fs.existsSync(unpackedServerScript)) {
      serverScript = unpackedServerScript;
    }

    const fileUrl = url.pathToFileURL(serverScript).href;
    await import(fileUrl);
    console.log(`[OmniPDF Embedded Server]: Active on http://127.0.0.1:${SERVER_PORT}`);
  } catch (err) {
    console.error('[OmniPDF Embedded Server Error]: Failed to start in-process server:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#020617',
    title: 'OmniPDF Pro Suite - Desktop Edition',
    icon: path.join(__dirname, '..', 'public', 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false // Enables local fetch to embedded http://127.0.0.1:8092 from file:// protocol
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
      shell.openExternal(targetUrl);
    }
    return { action: 'deny' };
  });

  // Load URL based on environment
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'development' && process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Native Desktop Save File Dialog handler
ipcMain.handle('save-file', async (event, { filename, base64Data, mimeType }) => {
  try {
    const ext = path.extname(filename || '').toLowerCase() || '.pdf';
    const filters = [];
    if (ext === '.pdf') {
      filters.push({ name: 'PDF Documents', extensions: ['pdf'] });
    } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      filters.push({ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] });
    }
    filters.push({ name: 'All Files', extensions: ['*'] });

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Document',
      defaultPath: filename || 'document.pdf',
      filters
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);
    return { success: true, filePath };
  } catch (err) {
    console.error('[OmniPDF Desktop Save Error]:', err);
    return { success: false, error: err.message };
  }
});

// App lifecycle
app.whenReady().then(async () => {
  await startEmbeddedServer();
  await checkServerReady(SERVER_PORT, 20, 200);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
