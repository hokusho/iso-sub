const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
const SERVER_PORT = process.env.PORT || 4000;

function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => retry());
      req.end();
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error('Server start timed out'));
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

function startBackendServer() {
  try {
    const serverPath = path.resolve(__dirname, '../server/dist/index.js');
    require(serverPath);
    console.log('✅ Backend server module loaded successfully');
  } catch (err) {
    console.error('Failed to start backend server module:', err);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#eeeeee',
    autoHideMenuBar: true,
    title: 'ISO SUB | Editor e Renderizador de Legendas',
    icon: path.resolve(__dirname, '../client/public/app-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  try {
    await waitForServer(`http://localhost:${SERVER_PORT}/health`, 12000);
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  } catch (err) {
    console.warn('Fallback loading URL');
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackendServer();
  await createWindow();

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
