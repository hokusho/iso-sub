import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR, RENDERS_DIR, TEMP_DIR } from '../config';
import {
  probeVideo,
  extractAudioToWav,
  generateWaveformPeaks,
  renderMp4WithAss,
  renderProResWithAlpha,
  openInWindowsExplorer,
  convertToWebFriendlyMp4
} from '../services/ffmpegService';
import {
  transcribeAudio,
  groupWordsIntoBlocks,
  parseSubtitleFileContent,
  translateSubtitleBlocks
} from '../services/whisperService';
import {
  buildAssSubtitle,
  buildSrtSubtitle,
  buildVttSubtitle
} from '../services/assBuilder';
import { validateLicense, loadLicenses, saveLicenses } from '../services/licenseService';
import { SubtitleBlock, SubtitleStyle, RenderJobProgress, VideoMetadata } from '../types';

const router = express.Router();

// Memory store for render jobs
const renderJobs: Map<string, RenderJobProgress> = new Map();
// SSE client response callbacks
const sseClients: Map<string, Set<(data: RenderJobProgress) => void>> = new Map();

function broadcastProgress(jobId: string, progress: RenderJobProgress) {
  renderJobs.set(jobId, progress);
  const clients = sseClients.get(jobId);
  if (clients) {
    clients.forEach(send => send(progress));
  }
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 500 } // 500MB
});

/**
 * POST /api/upload
 * Handles media upload, metadata probe, audio extraction, waveform calculation
 */
router.post('/upload', upload.single('media'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;

    // 1. Probe video metadata
    let metadata = await probeVideo(filePath);
    let finalFileName = fileName;
    let finalFilePath = filePath;

    // Check if video needs web transcoding (e.g. .mov, HEVC, ProRes, MKV, AVI)
    const ext = path.extname(originalName).toLowerCase();
    const isNonWebCodec = metadata.videoCodec && metadata.videoCodec.toLowerCase() !== 'h264' && metadata.videoCodec.toLowerCase() !== 'vp8';
    const isNonWebContainer = ext === '.mov' || ext === '.mkv' || ext === '.avi' || ext === '.flv' || ext === '.wmv';

    if (isNonWebCodec || isNonWebContainer) {
      const tempConvertedPath = path.resolve(TEMP_DIR, `web_${path.parse(fileName).name}.mp4`);
      const finalMp4FileName = `${path.parse(fileName).name}.mp4`;
      const finalMp4Path = path.resolve(UPLOAD_DIR, finalMp4FileName);

      console.log(`Transcoding non-web video (${metadata.videoCodec || ext}) to web-compatible MP4...`);
      await convertToWebFriendlyMp4(filePath, tempConvertedPath);

      // Safely replace/move to final destination without in-place collision
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
      }

      fs.copyFileSync(tempConvertedPath, finalMp4Path);
      try { fs.unlinkSync(tempConvertedPath); } catch {}

      finalFileName = finalMp4FileName;
      finalFilePath = finalMp4Path;
      metadata = await probeVideo(finalFilePath);
    }

    // 2. Extract audio WAV (16kHz mono) for transcription
    const audioWavPath = path.resolve(TEMP_DIR, `${path.parse(finalFileName).name}.wav`);
    if (metadata.hasAudio) {
      await extractAudioToWav(finalFilePath, audioWavPath);
    }

    // 3. Generate waveform peaks
    const waveformPeaks = await generateWaveformPeaks(finalFilePath, 400);

    const fileUrl = `/storage/uploads/${finalFileName}`;

    res.json({
      fileId: finalFileName,
      fileName: finalFileName,
      originalName,
      fileUrl,
      metadata,
      waveformPeaks
    });
  } catch (err: any) {
    console.error('Upload processing failed:', err);
    res.status(500).json({ error: err.message || 'Failed to process media file' });
  }
});

/**
 * POST /api/transcribe
 * Run transcription with Groq, OpenAI, or Fallback
 */
router.post('/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId, provider, apiKey, language, wordsPerBlock = 3 } = req.body;

    if (!fileId) {
      res.status(400).json({ error: 'Missing fileId' });
      return;
    }

    const wavPath = path.resolve(TEMP_DIR, `${path.parse(fileId).name}.wav`);
    const originalPath = path.resolve(UPLOAD_DIR, fileId);
    const mediaPath = fs.existsSync(wavPath) ? wavPath : originalPath;

    if (!fs.existsSync(mediaPath)) {
      res.status(404).json({ error: 'Media file not found' });
      return;
    }

    let duration = 10;
    try {
      const meta = await probeVideo(originalPath);
      duration = meta.duration || 10;
    } catch {}

    const result = await transcribeAudio(
      mediaPath,
      { provider, apiKey, language, wordsPerBlock },
      duration
    );

    res.json(result);
  } catch (err: any) {
    console.error('Transcription failed:', err);
    res.status(500).json({ error: err.message || 'Transcription failed' });
  }
});

/**
 * POST /api/rechunk
 * Reorganize words into blocks with different wordsPerBlock count
 */
router.post('/rechunk', (req: Request, res: Response): void => {
  try {
    const { words, wordsPerBlock = 3 } = req.body;
    if (!Array.isArray(words)) {
      res.status(400).json({ error: 'Invalid words array' });
      return;
    }
    const blocks = groupWordsIntoBlocks(words, wordsPerBlock);
    res.json({ blocks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/render/mp4
 * Start MP4 render job with burned-in subtitles
 */
router.post('/render/mp4', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileId, blocks, style, customFileName }: { fileId: string; blocks: SubtitleBlock[]; style: SubtitleStyle; customFileName?: string } = req.body;

    if (!fileId || !blocks || !style) {
      res.status(400).json({ error: 'Missing required parameters (fileId, blocks, style)' });
      return;
    }

    const inputVideoPath = path.resolve(UPLOAD_DIR, fileId);
    if (!fs.existsSync(inputVideoPath)) {
      res.status(404).json({ error: 'Source video file not found' });
      return;
    }

    const metadata = await probeVideo(inputVideoPath);
    const jobId = uuidv4();
    
    // Generate clean output filename
    let outputFileName = `render-${jobId.substring(0, 8)}.mp4`;
    if (customFileName && customFileName.trim().length > 0) {
      const sanitized = customFileName.trim().replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
      outputFileName = sanitized.toLowerCase().endsWith('.mp4') ? sanitized : `${sanitized}.mp4`;
    }

    const outputPath = path.resolve(RENDERS_DIR, outputFileName);
    const assPath = path.resolve(TEMP_DIR, `sub-${jobId}.ass`);

    // Generate ASS file
    const assContent = buildAssSubtitle({
      width: metadata.width,
      height: metadata.height,
      blocks,
      style
    });
    fs.writeFileSync(assPath, assContent, 'utf-8');

    // Initial Job State
    const initialJob: RenderJobProgress = {
      jobId,
      status: 'processing',
      progressPercent: 0,
      outputFileName,
      outputFilePath: outputPath
    };
    renderJobs.set(jobId, initialJob);

    // Run render asynchronously
    renderMp4WithAss(
      inputVideoPath,
      assPath,
      outputPath,
      metadata.duration,
      (p) => {
        broadcastProgress(jobId, {
          jobId,
          status: 'processing',
          progressPercent: p.percent,
          fps: p.fps,
          outputFileName,
          outputFilePath: outputPath
        });
      }
    )
      .then((out) => {
        const stats = fs.statSync(out);
        broadcastProgress(jobId, {
          jobId,
          status: 'completed',
          progressPercent: 100,
          outputFileName,
          outputFilePath: outputPath,
          outputFileSize: stats.size
        });
      })
      .catch((err) => {
        console.error(`Render job ${jobId} failed:`, err);
        broadcastProgress(jobId, {
          jobId,
          status: 'error',
          progressPercent: 0,
          error: err.message
        });
      });

    res.json({ jobId, outputFileName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/render/prores
 * Render ProRes 4444 with Alpha transparency (Only animated subtitles)
 */
router.post('/render/prores', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      blocks,
      style,
      duration = 10,
      width = 1080,
      height = 1920,
      fps = 30,
      customFileName
    }: {
      blocks: SubtitleBlock[];
      style: SubtitleStyle;
      duration?: number;
      width?: number;
      height?: number;
      fps?: number;
      customFileName?: string;
    } = req.body;

    const jobId = uuidv4();
    let outputFileName = `alpha-${jobId.substring(0, 8)}.mov`;
    if (customFileName && customFileName.trim().length > 0) {
      const sanitized = customFileName.trim().replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
      outputFileName = sanitized.toLowerCase().endsWith('.mov') ? sanitized : `${sanitized}.mov`;
    }

    const outputPath = path.resolve(RENDERS_DIR, outputFileName);
    const assPath = path.resolve(TEMP_DIR, `sub-alpha-${jobId}.ass`);

    const assContent = buildAssSubtitle({
      width,
      height,
      blocks,
      style,
      isTransparentProRes: true
    });
    fs.writeFileSync(assPath, assContent, 'utf-8');

    const initialJob: RenderJobProgress = {
      jobId,
      status: 'processing',
      progressPercent: 0,
      outputFileName,
      outputFilePath: outputPath
    };
    renderJobs.set(jobId, initialJob);

    renderProResWithAlpha(
      assPath,
      duration,
      width,
      height,
      fps,
      outputPath,
      (p) => {
        broadcastProgress(jobId, {
          jobId,
          status: 'processing',
          progressPercent: p.percent,
          fps: p.fps,
          outputFileName,
          outputFilePath: outputPath
        });
      }
    )
      .then((out) => {
        const stats = fs.statSync(out);
        broadcastProgress(jobId, {
          jobId,
          status: 'completed',
          progressPercent: 100,
          outputFileName,
          outputFilePath: outputPath,
          outputFileSize: stats.size
        });
      })
      .catch((err) => {
        console.error(`ProRes render ${jobId} failed:`, err);
        broadcastProgress(jobId, {
          jobId,
          status: 'error',
          progressPercent: 0,
          error: err.message
        });
      });

    res.json({ jobId, outputFileName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/progress/:jobId
 * Server-Sent Events (SSE) stream for real-time render progress
 */
router.get('/progress/:jobId', (req: Request, res: Response): void => {
  const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendProgress = (data: RenderJobProgress) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send current state if exists
  const current = renderJobs.get(jobId);
  if (current) {
    sendProgress(current);
  }

  if (!sseClients.has(jobId)) {
    sseClients.set(jobId, new Set());
  }
  sseClients.get(jobId)!.add(sendProgress);

  req.on('close', () => {
    const clients = sseClients.get(jobId);
    if (clients) {
      clients.delete(sendProgress);
      if (clients.size === 0) sseClients.delete(jobId);
    }
  });
});

/**
 * POST /api/open-folder
 * Opens Windows Explorer targeting the render directory or specific rendered file
 */
router.post('/open-folder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetPath, jobId } = req.body;
    let pathToOpen = RENDERS_DIR;

    if (jobId && renderJobs.has(jobId)) {
      const job = renderJobs.get(jobId)!;
      if (job.outputFilePath && fs.existsSync(job.outputFilePath)) {
        pathToOpen = job.outputFilePath;
      }
    } else if (targetPath && fs.existsSync(targetPath)) {
      pathToOpen = targetPath;
    }

    await openInWindowsExplorer(pathToOpen);
    res.json({ success: true, openedPath: pathToOpen });
  } catch (err: any) {
    console.error('Failed to open Windows Explorer:', err);
    res.status(500).json({ error: err.message || 'Failed to open Windows Explorer' });
  }
});

/**
 * POST /api/export/subtitles
 * Exports ASS, SRT, VTT or JSON file text
 */
router.post('/export/subtitles', (req: Request, res: Response): void => {
  try {
    const { blocks, style, format = 'ass', width = 1080, height = 1920 } = req.body;

    if (!blocks || !Array.isArray(blocks)) {
      res.status(400).json({ error: 'Missing blocks' });
      return;
    }

    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'ass') {
      content = buildAssSubtitle({ width, height, blocks, style });
      mimeType = 'text/x-ssa';
      ext = 'ass';
    } else if (format === 'srt') {
      content = buildSrtSubtitle(blocks);
      mimeType = 'application/x-subrip';
      ext = 'srt';
    } else if (format === 'vtt') {
      content = buildVttSubtitle(blocks);
      mimeType = 'text/vtt';
      ext = 'vtt';
    } else if (format === 'json') {
      content = JSON.stringify({ blocks, style }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="captions.${ext}"`);
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/parse-subtitles
 * Parse uploaded subtitle file (.srt, .vtt, .json)
 */
router.post('/parse-subtitles', upload.single('subtitleFile'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const type = ext === 'vtt' ? 'vtt' : ext === 'json' ? 'json' : 'srt';

    const blocks = parseSubtitleFileContent(content, type);
    res.json({ blocks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * GET /api/cache-info
 * Returns size and file count of temporary and cached files
 */
router.get('/cache-info', (req: Request, res: Response): void => {
  try {
    const currentFileId = typeof req.query.currentFileId === 'string' ? req.query.currentFileId : undefined;

    let tempBytes = 0;
    let tempCount = 0;
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      for (const f of files) {
        const p = path.join(TEMP_DIR, f);
        try {
          const stat = fs.statSync(p);
          if (stat.isFile()) {
            tempBytes += stat.size;
            tempCount++;
          }
        } catch {}
      }
    }

    let uploadBytes = 0;
    let uploadCount = 0;
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const f of files) {
        if (currentFileId && f === currentFileId) continue;
        const p = path.join(UPLOAD_DIR, f);
        try {
          const stat = fs.statSync(p);
          if (stat.isFile()) {
            uploadBytes += stat.size;
            uploadCount++;
          }
        } catch {}
      }
    }

    const totalBytes = tempBytes + uploadBytes;

    res.json({
      tempBytes,
      tempCount,
      uploadBytes,
      uploadCount,
      totalBytes,
      totalFormatted: formatBytes(totalBytes)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/clear-cache
 * Deletes ONLY unnecessary cache and temp files (preserves current active file and user renders)
 */
router.post('/clear-cache', (req: Request, res: Response): void => {
  try {
    const { currentFileId } = req.body;
    let freedBytes = 0;
    let deletedCount = 0;

    // 1. Delete temp files (.wav, .ass, etc.)
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      for (const f of files) {
        const p = path.join(TEMP_DIR, f);
        try {
          const stat = fs.statSync(p);
          if (stat.isFile()) {
            freedBytes += stat.size;
            fs.unlinkSync(p);
            deletedCount++;
          }
        } catch {}
      }
    }

    // 2. Delete old uploads except the active one
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const f of files) {
        if (currentFileId && f === currentFileId) continue;
        const p = path.join(UPLOAD_DIR, f);
        try {
          const stat = fs.statSync(p);
          if (stat.isFile()) {
            freedBytes += stat.size;
            fs.unlinkSync(p);
            deletedCount++;
          }
        } catch {}
      }
    }

    res.json({
      success: true,
      freedBytes,
      freedFormatted: formatBytes(freedBytes),
      deletedCount
    });
  } catch (err: any) {
    console.error('Clear cache error:', err);
    res.status(500).json({ error: err.message || 'Failed to clear cache' });
  }
});

/**
 * POST /api/translate
 * Translates subtitle blocks into requested language
 */
router.post('/translate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { blocks, targetLanguage = 'en', apiKey } = req.body;
    if (!blocks || !Array.isArray(blocks)) {
      res.status(400).json({ error: 'Missing blocks array' });
      return;
    }

    const translatedBlocks = await translateSubtitleBlocks(blocks, targetLanguage, apiKey);
    res.json({ success: true, blocks: translatedBlocks, targetLanguage });
  } catch (err: any) {
    console.error('Translation route error:', err);
    res.status(500).json({ error: err.message || 'Failed to translate subtitles' });
  }
});

/**
 * POST /api/license/validate
 * Validates serial key and binds deviceId
 */
router.post('/license/validate', (req: Request, res: Response): void => {
  try {
    const { serial, deviceId } = req.body;
    const result = validateLicense(serial, deviceId);
    res.json(result);
  } catch (err: any) {
    console.error('License validation error:', err);
    res.status(500).json({ valid: false, message: 'Erro ao validar licença no servidor.' });
  }
});

/**
 * GET /api/license/list
 * Retrieves licenses list for local admin panel sync
 */
router.get('/license/list', (req: Request, res: Response): void => {
  try {
    const licenses = loadLicenses();
    res.json({ success: true, licenses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/license/save
 * Saves licenses list from local admin panel
 */
router.post('/license/save', (req: Request, res: Response): void => {
  try {
    const { licenses } = req.body;
    if (!Array.isArray(licenses)) {
      res.status(400).json({ success: false, error: 'Expected licenses array' });
      return;
    }
    saveLicenses(licenses);
    res.json({ success: true, count: licenses.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/updates/apply
 * Downloads and extracts an OTA bundle into client/dist directory
 */
router.post('/updates/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bundleUrl } = req.body;
    if (!bundleUrl || typeof bundleUrl !== 'string') {
      res.status(400).json({ success: false, message: 'URL do pacote inválida.' });
      return;
    }

    const distDir = path.resolve(__dirname, '../../../client/dist');
    const tempZipPath = path.resolve(TEMP_DIR, `update-${Date.now()}.zip`);

    // Download the zip archive
    const response = await fetch(bundleUrl);
    if (!response.ok) {
      res.status(400).json({ success: false, message: `Falha ao baixar pacote: ${response.statusText}` });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempZipPath, buffer);

    // Extract using Windows native tar / PowerShell
    const { exec } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      exec(`tar -xf "${tempZipPath}" -C "${distDir}"`, (error) => {
        if (error) {
          exec(`powershell -Command "Expand-Archive -Path '${tempZipPath}' -DestinationPath '${distDir}' -Force"`, (psError) => {
            if (psError) reject(psError);
            else resolve();
          });
        } else {
          resolve();
        }
      });
    });

    // Cleanup temp zip
    try { fs.unlinkSync(tempZipPath); } catch {}

    res.json({ success: true, message: 'Atualização aplicada com sucesso!' });
  } catch (err: any) {
    console.error('Update apply error:', err);
    res.status(500).json({ success: false, message: err.message || 'Erro ao aplicar atualização.' });
  }
});

export default router;
