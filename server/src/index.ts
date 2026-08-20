import express from 'express';
import cors from 'cors';
import path from 'path';
import { PORT, HOST, STORAGE_DIR } from './config';
import apiRouter from './routes/api';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import fs from 'fs';

// Custom middleware to serve web-compatible MP4 when MOV/non-web file is requested
app.use('/storage/uploads/:filename', (req, res, next) => {
  const reqFile = req.params.filename;
  const ext = path.extname(reqFile).toLowerCase();
  if (ext === '.mov' || ext === '.mkv' || ext === '.avi' || ext === '.flv') {
    const mp4Name = `${path.parse(reqFile).name}.mp4`;
    const mp4Path = path.resolve(STORAGE_DIR, 'uploads', mp4Name);
    if (fs.existsSync(mp4Path)) {
      return res.sendFile(mp4Path);
    }
  }
  next();
});

// Serve static storage files (uploaded media, rendered videos)
app.use('/storage', express.static(STORAGE_DIR));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Animated Subtitles Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Media storage path: ${STORAGE_DIR}`);
});
