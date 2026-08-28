import express from 'express';
import cors from 'cors';
import path from 'path';
import { PORT, HOST, STORAGE_DIR } from './config';
import apiRouter from './routes/api';

const app = express();

import fs from 'fs';

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost'
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile/desktop apps, curl, or same-origin)
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));

// Prevent DNS rebinding attacks
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const hostname = host.split(':')[0].toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || !hostname) {
    return next();
  }
  return res.status(403).json({ error: 'Access forbidden: Invalid host header' });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Custom middleware to serve web-compatible MP4 when MOV/non-web file is requested
app.use('/storage/uploads/:filename', (req, res, next) => {
  const safeFilename = path.basename(req.params.filename);
  const ext = path.extname(safeFilename).toLowerCase();
  if (['.mov', '.mkv', '.avi', '.flv', '.wmv'].includes(ext)) {
    const mp4Name = `${path.parse(safeFilename).name}.mp4`;
    const uploadsDir = path.resolve(STORAGE_DIR, 'uploads');
    const mp4Path = path.resolve(uploadsDir, mp4Name);
    // Ensure the resolved path is strictly inside uploadsDir
    if (mp4Path.startsWith(uploadsDir) && fs.existsSync(mp4Path)) {
      return res.sendFile(mp4Path);
    }
  }
  next();
});

// Serve only safe media subdirectories statically (protecting user_settings.json from direct exposure)
app.use('/storage/uploads', express.static(path.resolve(STORAGE_DIR, 'uploads')));
app.use('/storage/renders', express.static(path.resolve(STORAGE_DIR, 'renders')));
app.use('/storage/temp', express.static(path.resolve(STORAGE_DIR, 'temp')));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend client/dist if built (for desktop/production dynamic hot updates)
const getClientDistDir = (): string => {
  const customDist = path.resolve(STORAGE_DIR, 'dist');
  if (fs.existsSync(path.resolve(customDist, 'index.html'))) {
    return customDist;
  }
  const defaultDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(path.resolve(defaultDist, 'index.html'))) {
    return defaultDist;
  }
  return customDist;
};

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static(getClientDistDir()));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/storage')) {
    const distDir = getClientDistDir();
    const indexFile = path.resolve(distDir, 'index.html');
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
  }
  next();
});

import { ensureFontsDownloaded } from './services/fontService';

app.listen(PORT, HOST, async () => {
  console.log(`🚀 Animated Subtitles Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Media storage path: ${STORAGE_DIR}`);
  try {
    await ensureFontsDownloaded();
  } catch (err: any) {
    console.warn('Font download warning on startup:', err.message);
  }
});
