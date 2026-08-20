import { SubtitleBlock, SubtitleStyle, SubtitleWord } from '../types';

/**
 * Converts Hex color string (#RRGGBB or #AARRGGBB or #RRGGBBAA) to ASS Color format (&HAABBGGRR&)
 * Note: In ASS, 00 is fully opaque, FF is fully transparent!
 */
export function hexToAssColor(hex: string, alpha = 0): string {
  if (!hex || hex === 'transparent') {
    return '&HFF000000&';
  }
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  
  let r = 'FF', g = 'FF', b = 'FF';
  if (clean.length >= 6) {
    r = clean.substring(0, 2);
    g = clean.substring(2, 4);
    b = clean.substring(4, 6);
  }

  const aHex = Math.max(0, Math.min(255, alpha)).toString(16).padStart(2, '0').toUpperCase();
  // ASS color order: &HAABBGGRR&
  return `&H${aHex}${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}&`;
}

/**
 * Formats seconds (e.g. 73.456) to ASS timestamp format: H:MM:SS.CC (centiseconds)
 */
export function formatAssTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = Math.floor(clamped % 60);
  const csecs = Math.floor(Math.round((clamped % 1) * 100));

  const hStr = hrs.toString();
  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');
  const csStr = Math.min(99, csecs).toString().padStart(2, '0');

  return `${hStr}:${mStr}:${sStr}.${csStr}`;
}

export function transformTextCase(text: string, caseTransform: SubtitleStyle['caseTransform']): string {
  if (!text) return '';
  if (caseTransform === 'uppercase') return text.toUpperCase();
  if (caseTransform === 'lowercase') return text.toLowerCase();
  if (caseTransform === 'capitalize') {
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text;
}

export interface AssBuilderOptions {
  width: number;
  height: number;
  blocks: SubtitleBlock[];
  style: SubtitleStyle;
  isTransparentProRes?: boolean;
}

/**
 * Sanitizes block and word timestamps to prevent ANY overlapping dialogue events in ASS
 */
function sanitizeBlocksForAss(rawBlocks: SubtitleBlock[]): SubtitleBlock[] {
  if (!rawBlocks || rawBlocks.length === 0) return [];

  // Sort blocks strictly by start time
  const sorted = [...rawBlocks].sort((a, b) => a.start - b.start);
  const cleanBlocks: SubtitleBlock[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = { ...sorted[i] };
    const next = sorted[i + 1];

    let bStart = Math.max(0, current.start);
    let bEnd = Math.max(bStart + 0.05, current.end);

    // Prevent overlap with next block (leave at least 0.01s boundary)
    if (next) {
      const nextStart = Math.max(0, next.start);
      if (bEnd >= nextStart) {
        bEnd = Math.max(bStart + 0.02, nextStart - 0.01);
      }
    }

    // Clean and clamp words inside block
    let cleanWords: SubtitleWord[] = [];
    if (current.words && current.words.length > 0) {
      const sortedWords = [...current.words].sort((a, b) => a.start - b.start);
      for (let j = 0; j < sortedWords.length; j++) {
        const w = sortedWords[j];
        const nextW = sortedWords[j + 1];

        let wStart = Math.max(bStart, w.start);
        let wEnd = nextW
          ? Math.min(bEnd, Math.max(wStart + 0.02, nextW.start))
          : Math.min(bEnd, Math.max(wStart + 0.02, w.end));

        if (wEnd <= wStart) {
          wEnd = wStart + 0.03;
        }

        cleanWords.push({
          id: w.id,
          text: w.text,
          start: Math.round(wStart * 1000) / 1000,
          end: Math.round(wEnd * 1000) / 1000
        });
      }
    } else {
      cleanWords = [{
        id: current.id,
        text: current.text,
        start: bStart,
        end: bEnd
      }];
    }

    cleanBlocks.push({
      id: current.id,
      text: current.text,
      start: Math.round(bStart * 1000) / 1000,
      end: Math.round(bEnd * 1000) / 1000,
      words: cleanWords
    });
  }

  return cleanBlocks;
}

/**
 * Builds high-fidelity ASS subtitle file matching Canvas Preview 1:1 in Full HD 1080x1920 space
 */
export function buildAssSubtitle(options: AssBuilderOptions): string {
  const { blocks: rawBlocks, style } = options;
  const blocks = sanitizeBlocksForAss(rawBlocks);

  // Fixed 1080x1920 Full HD Canvas coordinate space (matching CanvasPreview.tsx 1:1)
  const virtualWidth = 1080;
  const virtualHeight = 1920;

  const primaryColorAss = hexToAssColor(style.textColor || '#FFFFFF', 0);
  const highlightColorAss = hexToAssColor(style.highlightColor || '#FFE600', 0);
  
  const hasStroke = (style.strokeWidth && style.strokeWidth > 0);
  const outlineColorAss = hasStroke
    ? hexToAssColor(style.strokeColor || '#000000', 0)
    : '&HFF000000&';

  const hasShadow = (style.shadowDistance && style.shadowDistance > 0) || (style.shadowBlur && style.shadowBlur > 0);
  const shadowColorAss = hasShadow
    ? hexToAssColor(style.shadowColor || '#000000', 0)
    : '&HFF000000&';

  const strokeAss = hasStroke ? Math.round((style.strokeWidth || 8) * 1.5) : 0;
  const shadowAss = hasShadow ? Math.max(1, Math.round((style.shadowDistance || 3) * 1.5)) : 0;
  const blurAss = (style.shadowBlur && style.shadowBlur > 0) ? Math.min(6, Math.round(style.shadowBlur)) : 0;
  
  // Font Size scaled 1:1 with Canvas Preview (base 1080p x 2)
  const fontSizeAss = Math.round((style.fontSize || 54) * 2);

  // Calculate target positions
  const posX = Math.round(((style.positionX ?? 50) / 100) * virtualWidth);
  const posY = Math.round(((style.positionY ?? 72) / 100) * virtualHeight);

  // Font Family & Bold setting
  const fontName = style.fontFamily || 'Montserrat';
  const isBold = typeof style.fontWeight === 'number' 
    ? style.fontWeight >= 600 
    : (style.fontWeight === 'bold' || style.fontWeight === 'extrabold' || style.fontWeight === 'black' || !style.fontWeight);
  const boldVal = isBold ? -1 : 0;

  // Alignment: \an5 = Center middle, \an4 = Left middle, \an6 = Right middle
  let anCode = 5;
  if (style.alignment === 'left') anCode = 4;
  if (style.alignment === 'right') anCode = 6;

  // Build ASS Header with PlayRes matching Canvas Preview coordinate space
  const header = `[Script Info]
; Script generated by ISO SUB Engine
Title: Animated Captions Full HD
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${virtualWidth}
PlayResY: ${virtualHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSizeAss},${primaryColorAss},${highlightColorAss},${outlineColorAss},${shadowColorAss},${boldVal},0,0,0,100,100,${style.letterSpacing || 1},0,1,${strokeAss},${shadowAss},${anCode},40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogueLines: string[] = [];
  const baseEffectsTag = blurAss > 0 ? `\\blur${blurAss}` : '';

  for (const block of blocks) {
    if (!block.words || block.words.length === 0) {
      // Fallback for block without words
      const text = transformTextCase(block.text, style.caseTransform);
      const start = formatAssTime(block.start);
      const end = formatAssTime(block.end);
      const line = `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\pos(${posX},${posY})${baseEffectsTag}}${text}`;
      dialogueLines.push(line);
      continue;
    }

    // Determine 1-line vs 2-line layout:
    // Only wrap to 2 lines if total words strictly EXCEED wordsPerLine (e.g. 4+ words for 3 words/line)
    const targetWordsPerLine = style.wordsPerLine || 3;
    const isMultiline = (style.maxLines === 2 && block.words.length > targetWordsPerLine) || (block.words.length >= 6);

    const isLine1Hidden = block.hidden || block.hiddenLines?.includes(1);
    const isLine2Hidden = block.hidden || (isMultiline && block.hiddenLines?.includes(2));

    if (isLine1Hidden && (!isMultiline || isLine2Hidden)) {
      continue; // entire block hidden
    }
    
    let splitIndex = targetWordsPerLine;
    if (isMultiline && block.words.length > targetWordsPerLine) {
      if (block.words.length === 4 && targetWordsPerLine === 3) {
        splitIndex = 2;
      }
      const punctIdx = block.words.findIndex((w, idx) => idx >= 0 && idx < block.words.length - 1 && /[,.?!…:;]$/.test(w.text.trim()));
      if (punctIdx !== -1 && punctIdx + 1 <= targetWordsPerLine) {
        splitIndex = punctIdx + 1;
      }
    }
    splitIndex = isMultiline ? Math.min(block.words.length - 1, Math.max(1, splitIndex)) : -1;

    const isHighlightEnabled = style.useHighlight !== false;

    if (!isHighlightEnabled || style.animationType === 'none') {
      // Plain text without word-by-word highlights
      const start = formatAssTime(block.start);
      const end = formatAssTime(block.end);
      let wordsText = '';
      for (let j = 0; j < block.words.length; j++) {
        const isWordInL1 = splitIndex !== -1 ? j < splitIndex : true;
        const isWordInL2 = splitIndex !== -1 ? j >= splitIndex : false;
        if ((isWordInL1 && isLine1Hidden) || (isWordInL2 && isLine2Hidden)) continue;

        if (j === splitIndex && !isLine1Hidden && !isLine2Hidden) {
          wordsText = wordsText.trim() + '\\N';
        }
        wordsText += transformTextCase(block.words[j].text, style.caseTransform) + ' ';
      }
      if (wordsText.trim()) {
        dialogueLines.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,{\\pos(${posX},${posY})${baseEffectsTag}}${wordsText.trim()}`);
      }
      continue;
    }

    if (style.animationType === 'karaoke') {
      // Progressive Karaoke fill: spoken words stay highlighted
      for (let i = 0; i < block.words.length; i++) {
        const isWordInL1 = splitIndex !== -1 ? i < splitIndex : true;
        const isWordInL2 = splitIndex !== -1 ? i >= splitIndex : false;
        if ((isWordInL1 && isLine1Hidden) || (isWordInL2 && isLine2Hidden)) continue;

        const activeWord = block.words[i];
        const nextWord = block.words[i + 1];

        const wordStart = activeWord.start;
        const wordEnd = nextWord ? Math.min(block.end, nextWord.start) : block.end;

        if (wordEnd <= wordStart) continue;

        const startStr = formatAssTime(wordStart);
        const endStr = formatAssTime(wordEnd);

        let lineText = `{\\pos(${posX},${posY})${baseEffectsTag}}`;

        for (let j = 0; j < block.words.length; j++) {
          const isJL1 = splitIndex !== -1 ? j < splitIndex : true;
          const isJL2 = splitIndex !== -1 ? j >= splitIndex : false;
          if ((isJL1 && isLine1Hidden) || (isJL2 && isLine2Hidden)) continue;

          const w = block.words[j];
          const wText = transformTextCase(w.text, style.caseTransform);

          if (j === splitIndex && !isLine1Hidden && !isLine2Hidden) {
            lineText = lineText.trim() + '\\N';
          }

          if (j <= i) {
            // Spoken words stay in highlight color
            lineText += `{\\1c${highlightColorAss}\\3c${outlineColorAss}}${wText} `;
          } else {
            // Future words remain in primary base text color
            lineText += `{\\1c${primaryColorAss}\\3c${outlineColorAss}}${wText} `;
          }
        }

        if (lineText.trim()) {
          dialogueLines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${lineText.trim()}`);
        }
      }
    } else {
      // Word-by-word highlight (Pop, Bounce, Color Change)
      for (let i = 0; i < block.words.length; i++) {
        const isWordInL1 = splitIndex !== -1 ? i < splitIndex : true;
        const isWordInL2 = splitIndex !== -1 ? i >= splitIndex : false;
        if ((isWordInL1 && isLine1Hidden) || (isWordInL2 && isLine2Hidden)) continue;

        const activeWord = block.words[i];
        const nextWord = block.words[i + 1];

        const wordStart = activeWord.start;
        // Strictly bound by nextWord.start and block.end to avoid any overlap
        const wordEnd = nextWord ? Math.min(block.end, nextWord.start) : block.end;

        if (wordEnd <= wordStart) continue;

        const startStr = formatAssTime(wordStart);
        const endStr = formatAssTime(wordEnd);

        let lineText = `{\\pos(${posX},${posY})${baseEffectsTag}}`;

        for (let j = 0; j < block.words.length; j++) {
          const isJL1 = splitIndex !== -1 ? j < splitIndex : true;
          const isJL2 = splitIndex !== -1 ? j >= splitIndex : false;
          if ((isJL1 && isLine1Hidden) || (isJL2 && isLine2Hidden)) continue;

          const w = block.words[j];
          const wText = transformTextCase(w.text, style.caseTransform);

          if (j === splitIndex && !isLine1Hidden && !isLine2Hidden) {
            lineText = lineText.trim() + '\\N';
          }

          if (j === i) {
            // Active word
            if (style.animationType === 'pop' || style.animationType === 'bounce') {
              const scaleMax = Math.round((style.animationScale || 1.22) * 100);
              const dur = Math.min(150, Math.round((wordEnd - wordStart) * 500));
              lineText += `{\\1c${highlightColorAss}\\3c${outlineColorAss}\\t(0,${dur},\\fscx${scaleMax}\\fscy${scaleMax})\\t(${dur},${dur * 2},\\fscx100\\fscy100)}${wText} `;
            } else {
              // Color highlight without scale jump
              lineText += `{\\1c${highlightColorAss}\\3c${outlineColorAss}}${wText} `;
            }
          } else {
            // Inactive word
            lineText += `{\\1c${primaryColorAss}\\3c${outlineColorAss}}${wText} `;
          }
        }

        if (lineText.trim()) {
          dialogueLines.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${lineText.trim()}`);
        }
      }
    }
  }

  return header + dialogueLines.join('\n') + '\n';
}

/**
 * Builds standard SRT format from blocks
 */
export function buildSrtSubtitle(blocks: SubtitleBlock[]): string {
  const cleanBlocks = sanitizeBlocksForAss(blocks);
  let srt = '';
  let index = 1;

  for (const block of cleanBlocks) {
    const start = formatSrtTime(block.start);
    const end = formatSrtTime(block.end);
    srt += `${index}\n${start} --> ${end}\n${block.text.trim()}\n\n`;
    index++;
  }

  return srt;
}

/**
 * Builds standard WebVTT format from blocks
 */
export function buildVttSubtitle(blocks: SubtitleBlock[]): string {
  const cleanBlocks = sanitizeBlocksForAss(blocks);
  let vtt = 'WEBVTT\n\n';

  for (const block of cleanBlocks) {
    const start = formatVttTime(block.start);
    const end = formatVttTime(block.end);
    vtt += `${start} --> ${end}\n${block.text.trim()}\n\n`;
  }

  return vtt;
}

function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor(Math.round((seconds % 1) * 1000));
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVttTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor(Math.round((seconds % 1) * 1000));
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
