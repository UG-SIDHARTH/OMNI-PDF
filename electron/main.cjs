const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = 8092;

// Function to check if local server is responsive
function checkServerReady(port, retries = 30, delay = 500) {
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

// Start embedded background Node.js API server for 100% offline PDF processing
function startEmbeddedServer() {
  const serverScript = path.join(__dirname, '..', 'server', 'index.js');
  try {
    serverProcess = fork(serverScript, [], {
      env: {
        ...process.env,
        PORT: String(SERVER_PORT),
        NODE_ENV: app.isPackaged ? 'production' : 'development'
      },
      silent: true
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`[OmniPDF Server]: ${data}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[OmniPDF Server Error]: ${data}`);
    });

    serverProcess.on('exit', (code) => {
      console.log(`[OmniPDF Server] Exited with code ${code}`);
    });
  } catch (err) {
    console.error('Failed to spawn embedded OmniPDF server:', err);
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
      webSecurity: true
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load URL based on environment
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  startEmbeddedServer();
  await checkServerReady(SERVER_PORT, 20, 300);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});
