import path from 'path';
import fs from 'fs';
import { spawn, exec } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { VideoMetadata, RenderJobProgress } from '../types';
import { TEMP_DIR, RENDERS_DIR } from '../config';

import { FONTS_DIR, ensureFontsDownloaded } from './fontService';

const FFMPEG_PATH = typeof ffmpegStatic === 'string' ? ffmpegStatic : (ffmpegStatic as any).default || 'ffmpeg';
const FFPROBE_PATH = (ffprobeStatic as any).path || 'ffprobe';

/**
 * Normalizes a file path for use in FFmpeg filters (e.g. ass=filename='C\:/path/to/file.ass':fontsdir='C\:/path/to/fonts')
 * On Windows, colons and backslashes must be escaped or converted to forward slashes.
 */
export function escapeFilterPath(rawPath: string): string {
  const normalized = path.resolve(rawPath).replace(/\\/g, '/');
  return normalized.replace(/:/g, '\\:');
}

/**
 * Probes media file to get comprehensive video & audio metadata
 */
export function probeVideo(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration,size:stream=codec_type,width,height,r_frame_rate,duration,codec_name',
      '-of', 'json',
      filePath
    ];

    const probe = spawn(FFPROBE_PATH, args);
    let output = '';
    let errorOutput = '';

    probe.on('error', (err) => {
      reject(new Error(`ffprobe process error: ${err.message}`));
    });

    probe.stdout.on('data', (data) => { output += data.toString(); });
    probe.stderr.on('data', (data) => { errorOutput += data.toString(); });

    probe.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe exited with code ${code}: ${errorOutput}`));
      }

      try {
        const json = JSON.parse(output);
        const videoStream = json.streams?.find((s: any) => s.codec_type === 'video');
        const audioStream = json.streams?.find((s: any) => s.codec_type === 'audio');
        const format = json.format || {};

        let width = videoStream?.width || 1080;
        let height = videoStream?.height || 1920;

        // Check for smartphone / mobile rotation tags (e.g. 90deg or 270deg Display Matrix)
        let rotation = 0;
        if (videoStream?.tags?.rotate) {
          rotation = Math.abs(parseInt(videoStream.tags.rotate, 10));
        } else if (format?.tags?.rotate) {
          rotation = Math.abs(parseInt(format.tags.rotate, 10));
        } else if (Array.isArray(videoStream?.side_data_list)) {
          const displayMatrix = videoStream.side_data_list.find((s: any) => typeof s.rotation === 'number');
          if (displayMatrix) {
            rotation = Math.abs(Math.round(displayMatrix.rotation));
          }
        }

        if (rotation === 90 || rotation === 270) {
          const temp = width;
          width = height;
          height = temp;
        }

        let duration = parseFloat(videoStream?.duration || format.duration || '0');
        let sizeBytes = parseInt(format.size || '0', 10);

        let fps = 30;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2 && parseInt(parts[1], 10) > 0) {
            fps = Math.round((parseInt(parts[0], 10) / parseInt(parts[1], 10)) * 100) / 100;
          }
        }

        let aspectRatio = '9:16';
        const ratio = width / height;
        if (Math.abs(ratio - 9 / 16) < 0.15 || ratio < 0.75) aspectRatio = '9:16';
        else if (Math.abs(ratio - 16 / 9) < 0.15 || ratio > 1.35) aspectRatio = '16:9';
        else if (Math.abs(ratio - 1) < 0.12) aspectRatio = '1:1';
        else if (Math.abs(ratio - 4 / 5) < 0.12) aspectRatio = '4:5';
        else aspectRatio = height > width ? '9:16' : '16:9';

        resolve({
          duration,
          width,
          height,
          fps,
          aspectRatio: aspectRatio as any,
          hasAudio: !!audioStream,
          format: format.format_name || 'mp4',
          videoCodec: videoStream?.codec_name,
          sizeBytes
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });
  });
}

/**
 * Converts non-web-friendly video (such as HEVC/H.265 in .mov, ProRes, etc.)
 * to an ultrafast H.264 + AAC MP4 with faststart for seamless HTML5 browser playback.
 */
export function convertToWebFriendlyMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputPath
    ];

    const proc = spawn(FFMPEG_PATH, args);
    let errOutput = '';

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg web conversion process error: ${err.message}`));
    });

    proc.stderr.on('data', (data) => { errOutput += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg web conversion failed with code ${code}: ${errOutput}`));
    });
  });
}

/**
 * Extracts 16kHz mono WAV from video for transcription
 */
export function extractAudioToWav(videoPath: string, outputWavPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      outputWavPath
    ];

    const proc = spawn(FFMPEG_PATH, args);
    let errOutput = '';

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg audio extract process error: ${err.message}`));
    });

    proc.stderr.on('data', (data) => { errOutput += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg audio extract failed with code ${code}: ${errOutput}`));
    });
  });
}

export const extractAudioForWhisper = extractAudioToWav;

/**
 * Extracts fast waveform audio peaks (100-600 data points) for smooth interactive UI rendering
 */
export function generateWaveformPeaks(audioOrVideoPath: string, numPeaks = 600): Promise<number[]> {
  return new Promise((resolve) => {
    // Extract raw 8-bit unsigned PCM at a low sample rate to read amplitudes directly
    const sampleRate = 8000;
    const args = [
      '-i', audioOrVideoPath,
      '-vn',
      '-ac', '1',
      '-ar', sampleRate.toString(),
      '-f', 'u8',
      '-'
    ];

    const proc = spawn(FFMPEG_PATH, args);
    const chunks: Buffer[] = [];

    proc.on('error', () => {
      resolve(Array.from({ length: numPeaks }, () => 0.1));
    });

    // Drain stderr to prevent process deadlock on long media
    proc.stderr.on('data', () => {});

    proc.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });

    proc.on('close', (code) => {
      if (code !== 0 && chunks.length === 0) {
        return resolve(Array.from({ length: numPeaks }, () => 0.1));
      }

      const totalBuffer = Buffer.concat(chunks);
      if (totalBuffer.length === 0) {
        return resolve(Array.from({ length: numPeaks }, () => 0.1));
      }

      const blockSize = Math.max(1, Math.floor(totalBuffer.length / numPeaks));
      const peaks: number[] = [];

      for (let i = 0; i < numPeaks; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, totalBuffer.length);
        let maxVal = 0;

        for (let j = start; j < end; j++) {
          const val = Math.abs(totalBuffer[j] - 128) / 128;
          if (val > maxVal) maxVal = val;
        }

        peaks.push(Math.min(1.0, Math.max(0.05, maxVal)));
      }

      resolve(peaks);
    });
  });
}

export const extractWaveformPeaks = generateWaveformPeaks;

/**
 * Parses time string HH:MM:SS.ms to seconds
 */
function parseTimeString(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return 0;
}

/**
 * Options for MP4 render jobs
 */
export interface RenderMp4Options {
  presetPlatform?: 'instagram' | 'tiktok' | 'youtube' | 'custom';
  optimize50MB?: boolean;
}

/**
 * Renders MP4 with burned-in ASS subtitles (Preserving original resolution & aspect ratio)
 */
export function renderMp4WithAss(
  inputVideoPath: string,
  assPath: string,
  outputPath: string,
  duration: number,
  options: RenderMp4Options = {},
  onProgress?: (progress: { percent: number; currentSec: number; fps: number }) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureFontsDownloaded();
    } catch (e) {
      console.warn('[renderMp4WithAss] Font download check skipped/failed:', e);
    }

    const escapedAss = escapeFilterPath(assPath);
    const escapedFontsDir = escapeFilterPath(FONTS_DIR);
    // Direct subtitle burn-in with bundled fonts directory (Montserrat, Anton, Poppins, etc.)
    const filterChain = `ass=filename='${escapedAss}':fontsdir='${escapedFontsDir}'`;

    const args = [
      '-y',
      '-i', inputVideoPath,
      '-vf', filterChain,
      '-c:v', 'libx264',
      '-preset', 'fast'
    ];

    // Optional 50MB compression mode (for Instagram / TikTok without compression penalty)
    if (options.optimize50MB) {
      const targetMaxKbits = 45 * 8 * 1024; // 45 Megabytes in Kilobits
      const safeBitrateKbps = duration > 0 ? Math.min(15000, Math.max(2500, Math.floor(targetMaxKbits / duration))) : 12000;
      args.push(
        '-b:v', `${safeBitrateKbps}k`,
        '-maxrate', `${Math.round(safeBitrateKbps * 1.15)}k`,
        '-bufsize', `${safeBitrateKbps * 2}k`
      );
    } else {
      // Mastering grade high quality (CRF 17)
      args.push('-crf', '17');
    }

    // Universal social standards (BT.709 color tags to prevent gamma shift + 48kHz 320k AAC + faststart)
    args.push(
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'high',
      '-level', '4.2',
      '-colorspace', 'bt709',
      '-color_primaries', 'bt709',
      '-color_trc', 'bt709',
      '-c:a', 'aac',
      '-b:a', '320k',
      '-ar', '48000',
      '-movflags', '+faststart',
      outputPath
    );

    const proc = spawn(FFMPEG_PATH, args);
    let stderr = '';

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg MP4 render process error: ${err.message}`));
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;

      // Parse FFmpeg progress from stderr (e.g. time=00:00:15.24 fps=45.2)
      const timeMatch = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d+)/);
      const fpsMatch = text.match(/fps=\s*([\d.]+)/);

      if (timeMatch && onProgress) {
        const currentSec = parseTimeString(timeMatch[1]);
        const fps = fpsMatch ? parseFloat(fpsMatch[1]) : 30;
        const percent = duration > 0 ? Math.min(99, Math.round((currentSec / duration) * 100)) : 50;
        onProgress({ percent, currentSec, fps });
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        if (onProgress) onProgress({ percent: 100, currentSec: duration, fps: 0 });
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg MP4 render failed with code ${code}:\n${stderr}`));
      }
    });
  });
}

/**
 * Renders ProRes 4444 with Alpha (Transparency) containing ONLY the animated subtitles
 */
export function renderProResWithAlpha(
  assPath: string,
  duration: number,
  width: number,
  height: number,
  fps: number,
  outputPath: string,
  onProgress?: (progress: { percent: number; currentSec: number; fps: number }) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureFontsDownloaded();
    } catch (e) {
      console.warn('[renderProResWithAlpha] Font download check skipped/failed:', e);
    }

    const escapedAss = escapeFilterPath(assPath);
    const escapedFontsDir = escapeFilterPath(FONTS_DIR);
    // Create completely transparent video canvas using lavfi color=color=black@0.0 and apply ASS subtitle
    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=color=black@0.0:size=${width}x${height}:rate=${fps}:duration=${duration},format=rgba`,
      '-vf', `ass=filename='${escapedAss}':fontsdir='${escapedFontsDir}'`,
      '-c:v', 'prores_ks',
      '-profile:v', '4', // ProRes 4444 with alpha
      '-pix_fmt', 'yuva444p10le',
      outputPath
    ];

    const proc = spawn(FFMPEG_PATH, args);
    let stderr = '';

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg ProRes render process error: ${err.message}`));
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;

      const timeMatch = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d+)/);
      const fpsMatch = text.match(/fps=\s*([\d.]+)/);

      if (timeMatch && onProgress) {
        const currentSec = parseTimeString(timeMatch[1]);
        const fpsVal = fpsMatch ? parseFloat(fpsMatch[1]) : 30;
        const percent = duration > 0 ? Math.min(99, Math.round((currentSec / duration) * 100)) : 50;
        onProgress({ percent, currentSec, fps: fpsVal });
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        if (onProgress) onProgress({ percent: 100, currentSec: duration, fps: 0 });
        resolve(outputPath);
      } else {
        // Fallback: If prores_ks with alpha isn't supported on some ffmpeg build, try QuickTime PNG / Animation
        console.warn(`ProRes 4444 failed, trying QuickTime Animation (qtrle) fallback: ${stderr}`);
        const fallbackArgs = [
          '-y',
          '-f', 'lavfi',
          '-i', `color=color=black@0.0:size=${width}x${height}:rate=${fps}:duration=${duration},format=rgba`,
          '-vf', `ass='${escapedAss}'`,
          '-c:v', 'qtrle',
          outputPath
        ];
        const fallbackProc = spawn(FFMPEG_PATH, fallbackArgs);
        fallbackProc.on('error', (err) => {
          reject(new Error(`FFmpeg fallback transparent render process error: ${err.message}`));
        });
        fallbackProc.on('close', (fbCode) => {
          if (fbCode === 0) {
            if (onProgress) onProgress({ percent: 100, currentSec: duration, fps: 0 });
            resolve(outputPath);
          } else {
            reject(new Error(`Transparent render failed: ${stderr}`));
          }
        });
      }
    });
  });
}

/**
 * Opens a file or folder in Windows Explorer
 */
export function openInWindowsExplorer(targetPath: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const resolved = path.resolve(targetPath);
      const isDir = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
      const command = isDir ? `explorer.exe "${resolved}"` : `explorer.exe /select,"${resolved}"`;

      exec(command, () => {
        // Windows explorer may return non-zero exit code when called from child_process even on success
        resolve();
      });
    } catch {
      resolve();
    }
  });
}
