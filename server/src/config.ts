import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export const PORT = parseInt(process.env.PORT || '4000', 10);
export const HOST = process.env.HOST || '127.0.0.1';

export const ROOT_DIR = path.resolve(__dirname, '..');
export const STORAGE_DIR = path.resolve(ROOT_DIR, 'storage');
export const UPLOAD_DIR = path.resolve(STORAGE_DIR, 'uploads');
export const RENDERS_DIR = path.resolve(STORAGE_DIR, 'renders');
export const TEMP_DIR = path.resolve(STORAGE_DIR, 'temp');
export const FONTS_DIR = path.resolve(STORAGE_DIR, 'fonts');

// Ensure directories exist
[STORAGE_DIR, UPLOAD_DIR, RENDERS_DIR, TEMP_DIR, FONTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// API keys configuration
export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
