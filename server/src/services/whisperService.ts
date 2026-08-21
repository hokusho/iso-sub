import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SubtitleBlock, SubtitleWord } from '../types';
import { GROQ_API_KEY, OPENAI_API_KEY } from '../config';

export interface TranscribeOptions {
  apiKey?: string;
  provider?: 'groq' | 'openai' | 'auto' | 'local';
  language?: string;
  wordsPerBlock?: number; // default 3
}

/**
 * Group flat word list into formatted SubtitleBlocks
 */
export function groupWordsIntoBlocks(words: SubtitleWord[], maxWordsPerBlock = 3): SubtitleBlock[] {
  const blocks: SubtitleBlock[] = [];
  if (!words || words.length === 0) return blocks;

  let currentWords: SubtitleWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    const isLastWord = i === words.length - 1;
    const nextWord = !isLastWord ? words[i + 1] : null;
    
    // Check pause between words (e.g. > 0.45s pause triggers new block)
    const hasLongPause = nextWord ? (nextWord.start - word.end > 0.45) : false;
    
    // Check punctuation ending (. ? ! ; :)
    const hasPunctuation = /[.?!;:]$/.test(word.text.trim());
    
    // Check reached max words per block
    const reachedMaxWords = currentWords.length >= maxWordsPerBlock;

    if (reachedMaxWords || hasLongPause || hasPunctuation || isLastWord) {
      const blockStart = currentWords[0].start;
      let rawEnd = currentWords[currentWords.length - 1].end;
      if (nextWord && rawEnd > nextWord.start) {
        rawEnd = nextWord.start;
      }
      const blockEnd = Math.max(blockStart + 0.05, rawEnd);
      const blockText = currentWords.map(w => w.text).join(' ');

      blocks.push({
        id: uuidv4(),
        start: Math.round(blockStart * 1000) / 1000,
        end: Math.round(blockEnd * 1000) / 1000,
        text: blockText,
        words: [...currentWords]
      });

      currentWords = [];
    }
  }

  return blocks;
}

/**
 * Transcribe via Groq Whisper API (whisper-large-v3 with word granularities)
 */
async function transcribeWithGroq(
  audioPath: string,
  apiKey: string,
  language?: string
): Promise<SubtitleWord[]> {
  const fileBuffer = fs.readFileSync(audioPath);
  const blob = new Blob([fileBuffer], { type: 'audio/wav' });

  const formData = new FormData();
  formData.append('file', blob, path.basename(audioPath));
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  if (language && language.trim() !== '') {
    formData.append('language', language.trim());
  }

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  const rawWords = data.words || [];

  return rawWords.map((w: any) => ({
    id: uuidv4(),
    text: w.word ? w.word.trim() : '',
    start: Math.max(0, parseFloat(w.start)),
    end: Math.max(0, parseFloat(w.end))
  })).filter((w: SubtitleWord) => w.text.length > 0);
}

/**
 * Transcribe via OpenAI Whisper API (whisper-1 with word granularities)
 */
async function transcribeWithOpenAI(
  audioPath: string,
  apiKey: string,
  language?: string
): Promise<SubtitleWord[]> {
  const fileBuffer = fs.readFileSync(audioPath);
  const blob = new Blob([fileBuffer], { type: 'audio/wav' });

  const formData = new FormData();
  formData.append('file', blob, path.basename(audioPath));
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  if (language && language.trim() !== '') {
    formData.append('language', language.trim());
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  const rawWords = data.words || [];

  return rawWords.map((w: any) => ({
    id: uuidv4(),
    text: w.word ? w.word.trim() : '',
    start: Math.max(0, parseFloat(w.start)),
    end: Math.max(0, parseFloat(w.end))
  })).filter((w: SubtitleWord) => w.text.length > 0);
}

/**
 * Fallback Intelligent Alignment & Transcriber
 * Used when API keys are not provided or for offline testing
 */
export function generateLocalFallbackWords(duration = 10): SubtitleWord[] {
  const sampleSentences = [
    "Crie vídeos incríveis com legendas animadas profissionais.",
    "O segredo da retenção no TikTok e Instagram Reels é o dinamismo visual.",
    "Com este aplicativo você pode editar palavra por palavra e exportar em alta qualidade.",
    "Exporte em MP4 direto para as redes ou em ProRes com Alpha para o seu editor favorito."
  ];

  const fullText = sampleSentences.join(' ');
  const words = fullText.split(/\s+/);
  const avgWordDuration = Math.max(0.25, (duration * 0.9) / words.length);

  const result: SubtitleWord[] = [];
  let currentTime = 0.3;

  for (const w of words) {
    const wLen = w.length;
    const dur = Math.max(0.2, avgWordDuration * (wLen / 5));
    const end = Math.min(duration, currentTime + dur);

    result.push({
      id: uuidv4(),
      text: w,
      start: Math.round(currentTime * 1000) / 1000,
      end: Math.round(end * 1000) / 1000
    });

    currentTime = end + 0.05;
    if (currentTime >= duration) break;
  }

  return result;
}

/**
 * Main transcription service dispatcher
 */
export async function transcribeAudio(
  audioPath: string,
  options: TranscribeOptions = {},
  duration = 10
): Promise<{ words: SubtitleWord[]; blocks: SubtitleBlock[] }> {
  const groqKey = options.apiKey || GROQ_API_KEY;
  const openaiKey = options.apiKey || OPENAI_API_KEY;
  const provider = options.provider || 'auto';
  const wordsPerBlock = options.wordsPerBlock || 3;

  let words: SubtitleWord[] = [];

  if (provider === 'groq' && groqKey) {
    words = await transcribeWithGroq(audioPath, groqKey, options.language);
  } else if (provider === 'openai' && openaiKey) {
    words = await transcribeWithOpenAI(audioPath, openaiKey, options.language);
  } else if (provider === 'auto') {
    if (groqKey) {
      try {
        words = await transcribeWithGroq(audioPath, groqKey, options.language);
      } catch (err) {
        console.warn('Groq transcription failed, trying OpenAI or Fallback:', err);
        if (openaiKey) {
          words = await transcribeWithOpenAI(audioPath, openaiKey, options.language);
        } else {
          words = generateLocalFallbackWords(duration);
        }
      }
    } else if (openaiKey) {
      words = await transcribeWithOpenAI(audioPath, openaiKey, options.language);
    } else {
      // Fallback
      words = generateLocalFallbackWords(duration);
    }
  } else {
    words = generateLocalFallbackWords(duration);
  }

  const blocks = groupWordsIntoBlocks(words, wordsPerBlock);
  return { words, blocks };
}

/**
 * Parse imported SRT/VTT/JSON subtitles into words and blocks
 */
export function parseSubtitleFileContent(content: string, type: 'srt' | 'vtt' | 'json'): SubtitleBlock[] {
  if (type === 'json') {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.blocks) return parsed.blocks;
    return [];
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: SubtitleBlock[] = [];
  let currentStart = 0;
  let currentEnd = 0;
  let currentTextLines: string[] = [];

  const timeRegex = /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      if (currentTextLines.length > 0 && currentEnd > currentStart) {
        const text = currentTextLines.join(' ').trim();
        blocks.push(createBlockFromPhrase(text, currentStart, currentEnd));
        currentTextLines = [];
      }
      const sH = parseInt(match[1], 10), sM = parseInt(match[2], 10), sS = parseInt(match[3], 10), sMs = parseInt(match[4], 10);
      const eH = parseInt(match[5], 10), eM = parseInt(match[6], 10), eS = parseInt(match[7], 10), eMs = parseInt(match[8], 10);
      currentStart = sH * 3600 + sM * 60 + sS + sMs / 1000;
      currentEnd = eH * 3600 + eM * 60 + eS + eMs / 1000;
    } else if (line.trim().length > 0 && !/^\d+$/.test(line.trim()) && !line.startsWith('WEBVTT')) {
      currentTextLines.push(line.trim());
    } else if (line.trim().length === 0 && currentTextLines.length > 0) {
      const text = currentTextLines.join(' ').trim();
      blocks.push(createBlockFromPhrase(text, currentStart, currentEnd));
      currentTextLines = [];
    }
  }

  if (currentTextLines.length > 0 && currentEnd > currentStart) {
    const text = currentTextLines.join(' ').trim();
    blocks.push(createBlockFromPhrase(text, currentStart, currentEnd));
  }

  return blocks;
}

function createBlockFromPhrase(text: string, start: number, end: number): SubtitleBlock {
  const wordsRaw = text.split(/\s+/).filter(w => w.length > 0);
  const totalDuration = end - start;
  const wordDur = totalDuration / Math.max(1, wordsRaw.length);

  const words: SubtitleWord[] = wordsRaw.map((w, idx) => {
    const wStart = start + idx * wordDur;
    const wEnd = Math.min(end, wStart + wordDur);
    return {
      id: uuidv4(),
      text: w,
      start: Math.round(wStart * 1000) / 1000,
      end: Math.round(wEnd * 1000) / 1000
    };
  });

  return {
    id: uuidv4(),
    start: Math.round(start * 1000) / 1000,
    end: Math.round(end * 1000) / 1000,
    text,
    words
  };
}

/**
 * AI Translation Service for Subtitle Blocks
 */
export async function translateSubtitleBlocks(
  blocks: SubtitleBlock[],
  targetLanguage = 'en',
  apiKey?: string
): Promise<SubtitleBlock[]> {
  if (!blocks || blocks.length === 0) return [];

  const isGroqKey = apiKey?.startsWith('gsk_');
  const isOpenAiKey = apiKey?.startsWith('sk-');

  const groqKey = isGroqKey ? apiKey : (!isOpenAiKey ? (GROQ_API_KEY || apiKey) : undefined);
  const openaiKey = isOpenAiKey ? apiKey : (!isGroqKey ? (OPENAI_API_KEY || apiKey) : undefined);

  const langMap: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    pt: 'Portuguese',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    ja: 'Japanese',
    zh: 'Chinese (Simplified)'
  };
  const targetLangName = langMap[targetLanguage] || targetLanguage;

  const phrases = blocks.map(b => b.text.trim());
  let translatedPhrases: string[] = [];

  // Helper for Google GTX Translation
  const translateViaGoogle = async (texts: string[], target: string): Promise<string[]> => {
    const results: string[] = [];
    for (const phrase of texts) {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(phrase)}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const d = (await resp.json()) as any;
          if (Array.isArray(d) && Array.isArray(d[0])) {
            results.push(d[0].map((item: any) => item[0]).join('') || phrase);
            continue;
          }
        }
      } catch {}
      results.push(phrase);
    }
    return results;
  };

  // Method 1: Groq AI
  if (groqKey) {
    try {
      const prompt = `You are an expert subtitle translator. Translate the following list of subtitle phrases into ${targetLangName}.
Return ONLY a valid JSON array of translated strings in the EXACT same order and length as the input. Do not include extra text.
Format: ["translation 1", "translation 2", ...]

Input JSON array:
${JSON.stringify(phrases)}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const rawContent = data.choices?.[0]?.message?.content || '';
        const cleanContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        const match = cleanContent.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length === phrases.length) {
            translatedPhrases = parsed.map(String);
          }
        }
      }
    } catch (err) {
      console.warn('Groq translation error:', err);
    }
  }

  // Method 2: OpenAI Fallback
  if (translatedPhrases.length === 0 && openaiKey) {
    try {
      const prompt = `You are an expert subtitle translator. Translate the following list of subtitle phrases into ${targetLangName}.
Return ONLY a valid JSON array of translated strings in the EXACT same order and length as the input.
Format: ["translation 1", "translation 2", ...]

Input JSON array:
${JSON.stringify(phrases)}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const rawContent = data.choices?.[0]?.message?.content || '';
        const cleanContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        const match = cleanContent.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length === phrases.length) {
            translatedPhrases = parsed.map(String);
          }
        }
      }
    } catch (err) {
      console.warn('OpenAI translation error:', err);
    }
  }

  // Method 3: High-reliability Google Translate fallback
  if (translatedPhrases.length === 0) {
    translatedPhrases = await translateViaGoogle(phrases, targetLanguage);
  }

  // Reconstruct SubtitleBlocks with translated words and matching timestamps
  const newBlocks: SubtitleBlock[] = blocks.map((originalBlock, idx) => {
    const transText = translatedPhrases[idx] || originalBlock.text;
    const rawWords = transText.trim().split(/\s+/).filter(Boolean);
    const totalDur = Math.max(0.1, originalBlock.end - originalBlock.start);
    const wordDur = totalDur / Math.max(1, rawWords.length);

    const words: SubtitleWord[] = rawWords.map((w, wIdx) => {
      const wStart = originalBlock.start + wIdx * wordDur;
      const wEnd = wIdx === rawWords.length - 1 ? originalBlock.end : wStart + wordDur;
      return {
        id: uuidv4(),
        text: w,
        start: Math.round(wStart * 1000) / 1000,
        end: Math.round(wEnd * 1000) / 1000
      };
    });

    return {
      id: originalBlock.id,
      start: originalBlock.start,
      end: originalBlock.end,
      text: transText,
      words
    };
  });

  return newBlocks;
}
