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
 * Builds high-fidelity ASS subtitle file matching Canvas Preview 1:1 in video's native coordinate space
 */
/**
 * Estimates text width in pixels for standard bold sans-serif fonts (e.g. Montserrat, Inter, Roboto, Anton)
 */
function estimateTextWidth(text: string, fontSize: number, letterSpacing: number = 0): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === ' ') {
      width += fontSize * 0.32;
    } else if (/[WMwm@%#]/.test(char)) {
      width += fontSize * 0.88;
    } else if (/[Iil1!|jtrf,.:;']/.test(char)) {
      width += fontSize * 0.32;
    } else if (/[A-Z0-9]/.test(char)) {
      width += fontSize * 0.65;
    } else {
      width += fontSize * 0.54;
    }
    width += letterSpacing;
  }
  return width;
}

function isSignificantWord(wordText: string): boolean {
  if (!wordText) return false;
  const clean = wordText.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (!clean) return false;
  return clean.length > 2;
}

function countSignificantWords(words: { text: string }[]): number {
  return words.filter(w => isSignificantWord(w.text)).length;
}

function findOptimalSplitIndex(words: { text: string }[], targetWordsPerLine: number = 4): number {
  if (!words || words.length <= 3) return words ? words.length : 0;
  const totalWords = words.length;

  const commaIndices: number[] = [];
  words.forEach((w, idx) => {
    if (idx >= 1 && idx < totalWords - 1 && /[,;]$/.test(w.text.trim())) {
      commaIndices.push(idx + 1);
    }
  });

  const maxAllowedPerLine = Math.max(3, targetWordsPerLine + 1);
  for (const splitIdx of commaIndices) {
    const l1Count = splitIdx;
    const l2Count = totalWords - splitIdx;
    if (l1Count <= maxAllowedPerLine && l2Count <= maxAllowedPerLine && l1Count >= 1 && l2Count >= 1) {
      return splitIdx;
    }
  }

  let bestSplit = Math.max(1, Math.ceil(totalWords / 2));
  let bestScore = Infinity;

  for (let i = 1; i < totalWords; i++) {
    const l1Words = words.slice(0, i);
    const l2Words = words.slice(i);
    const l1Len = l1Words.map(w => w.text).join(' ').length;
    const l2Len = l2Words.map(w => w.text).join(' ').length;

    const wordDiff = Math.abs(l1Words.length - l2Words.length);
    const charDiff = Math.abs(l1Len - l2Len) / 10;

    const overflowPenalty = (l1Words.length > targetWordsPerLine ? (l1Words.length - targetWordsPerLine) * 50 : 0) +
                           (l2Words.length > targetWordsPerLine ? (l2Words.length - targetWordsPerLine) * 50 : 0);

    const score = wordDiff + charDiff + overflowPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestSplit = i;
    }
  }

  return Math.min(totalWords - 1, Math.max(1, bestSplit));
}

export function buildAssSubtitle(options: AssBuilderOptions): string {
  const { blocks: rawBlocks, style, width = 1080, height = 1920 } = options;
  const blocks = sanitizeBlocksForAss(rawBlocks);

  // Dynamic Canvas coordinate space matching the actual video resolution (e.g. 1920x1080 horizontal or 1080x1920 vertical)
  const virtualWidth = width || 1080;
  const virtualHeight = height || (virtualWidth === 1920 ? 1080 : 1920);

  const primaryColorAss = hexToAssColor(style.textColor || '#FFFFFF', 0);
  const highlightColorAss = hexToAssColor(style.highlightColor || '#FFE600', 0);
  const wordBoxColorAss = hexToAssColor(style.wordHighlightBoxColor || '#A855F7', 0);
  
  const hasStroke = (style.strokeWidth && style.strokeWidth > 0);
  const outlineColorAss = hasStroke
    ? hexToAssColor(style.strokeColor || '#000000', 0)
    : '&HFF000000&';

  const hasShadow = (style.shadowDistance && style.shadowDistance > 0) || (style.shadowBlur && style.shadowBlur > 0);
  const shadowColorAss = hasShadow
    ? hexToAssColor(style.shadowColor || '#000000', 0)
    : '&HFF000000&';

  // Dynamic scale factor matching CanvasPreview.tsx
  const scaleFactor = (virtualHeight / 1920) * 2;
  const strokeAss = hasStroke ? Math.round((style.strokeWidth || 8) * (scaleFactor * 0.75)) : 0;
  const shadowDistAss = Math.max(1, Math.round((style.shadowDistance ?? 4) * (scaleFactor * 0.75)));
  
  // Calculate target positions
  const posX = Math.round(((style.positionX ?? 50) / 100) * virtualWidth);
  const posY = Math.round(((style.positionY ?? 72) / 100) * virtualHeight);

  // Safe blur bound between 0 and 12px
  const safeBlur = Math.min(12, Math.max(0, style.shadowBlur ?? 0));
  const blurAssVal = safeBlur > 0 ? (safeBlur * 0.6).toFixed(1) : '0';
  const shadowPosY = posY + shadowDistAss;

  // Font Size scaled 1:1 with Canvas Preview
  const fontSizeAss = Math.round((style.fontSize || 44) * scaleFactor);

  // Font Family & Bold setting
  const fontName = style.fontFamily || 'Montserrat';
  const isBold = typeof style.fontWeight === 'number' 
    ? style.fontWeight >= 600 
    : (style.fontWeight === 'bold' || style.fontWeight === 'extrabold' || style.fontWeight === 'black' || !style.fontWeight);
  const boldVal = isBold ? -1 : 0;

  // Alignment: \an5 = Center middle
  const anCode = 5;

  // Build ASS Header with PlayRes matching Canvas Preview coordinate space
  // 2-Layer Subtitle Architecture: Layer 0 for customizable soft shadow, Layer 1 for crystal-sharp text
  const header = `[Script Info]
; Script generated by ISO SUB Engine (2-Layer Subtitle Architecture with Per-Word Static Anchors)
Title: Animated Captions Full HD
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${virtualWidth}
PlayResY: ${virtualHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSizeAss},${primaryColorAss},${highlightColorAss},${outlineColorAss},${shadowColorAss},${boldVal},0,0,0,100,100,${style.letterSpacing || 1},0,1,${strokeAss},0,${anCode},40,40,40,1
Style: ShadowStyle,${fontName},${fontSizeAss},${shadowColorAss},${shadowColorAss},${shadowColorAss},${shadowColorAss},${boldVal},0,0,0,100,100,${style.letterSpacing || 1},0,1,${strokeAss},0,${anCode},40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogueLines: string[] = [];

  for (const block of blocks) {
    if (!block.words || block.words.length === 0) {
      // Fallback for block without words
      const text = transformTextCase(block.text, style.caseTransform);
      const start = formatAssTime(block.start);
      const end = formatAssTime(block.end);
      
      if (hasShadow) {
        dialogueLines.push(`Dialogue: 0,${start},${end},ShadowStyle,,0,0,0,,{\\pos(${posX},${shadowPosY})\\blur${blurAssVal}\\1c${shadowColorAss}\\3c${shadowColorAss}}${text}`);
      }
      dialogueLines.push(`Dialogue: 1,${start},${end},Default,,0,0,0,,{\\pos(${posX},${posY})}${text}`);
      continue;
    }

    // Format and measure words to establish static pixel anchors
    const formattedWords = block.words.map((w, idx) => {
      const display = transformTextCase(w.text, style.caseTransform);
      const width = estimateTextWidth(display, fontSizeAss, style.letterSpacing || 1);
      return {
        ...w,
        index: idx,
        display,
        width,
        centerX: 0,
        y: 0,
        shadowY: 0
      };
    });

    const spaceWidth = estimateTextWidth(' ', fontSizeAss, style.letterSpacing || 1);
    const lineSpacing = Math.round(fontSizeAss * (style.lineHeight || 1.25));

    // Determine 1-line vs 2-line layout
    const targetWordsPerLine = style.wordsPerLine || 3;
    const isMultiline = (style.maxLines === 2 && formattedWords.length > 1) || (formattedWords.length >= 6);
    const splitIndex = isMultiline ? findOptimalSplitIndex(formattedWords, targetWordsPerLine) : formattedWords.length;

    const line1Words = formattedWords.slice(0, splitIndex);
    const line2Words = isMultiline ? formattedWords.slice(splitIndex) : [];

    const line1Width = line1Words.reduce((sum, w) => sum + w.width, 0) + Math.max(0, line1Words.length - 1) * spaceWidth;
    const line2Width = line2Words.reduce((sum, w) => sum + w.width, 0) + Math.max(0, line2Words.length - 1) * spaceWidth;

    const line1Y = isMultiline ? posY - Math.round(lineSpacing / 2) : posY;
    const line2Y = isMultiline ? posY + Math.round(lineSpacing / 2) : posY;

    // Calculate static center coordinate for each word in Line 1
    let curX1 = posX - line1Width / 2;
    line1Words.forEach((w) => {
      w.centerX = Math.round(curX1 + w.width / 2);
      w.y = line1Y;
      w.shadowY = line1Y + shadowDistAss;
      curX1 += w.width + spaceWidth;
    });

    // Calculate static center coordinate for each word in Line 2
    let curX2 = posX - line2Width / 2;
    line2Words.forEach((w) => {
      w.centerX = Math.round(curX2 + w.width / 2);
      w.y = line2Y;
      w.shadowY = line2Y + shadowDistAss;
      curX2 += w.width + spaceWidth;
    });

    const isLine1Hidden = block.hidden || block.hiddenLines?.includes(1);
    const isLine2Hidden = block.hidden || (isMultiline && block.hiddenLines?.includes(2));

    const visibleWords = formattedWords.filter((w) => {
      const isL1 = w.index < splitIndex;
      if (isL1 && isLine1Hidden) return false;
      if (!isL1 && isLine2Hidden) return false;
      return true;
    });

    if (visibleWords.length === 0) continue;

    const isHighlightEnabled = style.useHighlight !== false;

    if (!isHighlightEnabled || (style.animationType === 'none' && !style.useWordHighlightBox)) {
      // Static block without highlight animations
      const start = formatAssTime(block.start);
      const end = formatAssTime(block.end);
      
      for (const w of visibleWords) {
        if (hasShadow) {
          dialogueLines.push(`Dialogue: 0,${start},${end},ShadowStyle,,0,0,0,,{\\pos(${w.centerX},${w.shadowY})\\blur${blurAssVal}\\1c${shadowColorAss}\\3c${shadowColorAss}}${w.display}`);
        }
        dialogueLines.push(`Dialogue: 1,${start},${end},Default,,0,0,0,,{\\pos(${w.centerX},${w.y})\\1c${primaryColorAss}\\3c${outlineColorAss}}${w.display}`);
      }
      continue;
    }

    // Word-by-word animations (Pop, Bounce, Karaoke, Color Change, Word Box)
    const wordBoxColorAss = hexToAssColor(style.wordHighlightBoxColor || '#A855F7');
    const wordBoxTextColorAss = hexToAssColor(style.wordHighlightBoxTextColor || '#FFFFFF');

    for (let i = 0; i < formattedWords.length; i++) {
      const activeWord = formattedWords[i];
      const nextWord = formattedWords[i + 1];

      const wordStart = activeWord.start;
      const wordEnd = nextWord ? Math.min(block.end, nextWord.start) : block.end;

      if (wordEnd <= wordStart) continue;

      const startStr = formatAssTime(wordStart);
      const endStr = formatAssTime(wordEnd);

      const isKaraoke = style.animationType === 'karaoke';
      const isPop = style.animationType === 'pop' || style.animationType === 'bounce';
      const safeScale = Math.min(1.25, Math.max(1.05, style.animationScale || 1.18));
      const scaleMax = Math.round(safeScale * 100);
      const dur = Math.min(150, Math.round((wordEnd - wordStart) * 500));

      for (const w of visibleWords) {
        const isWordActive = (w.index === i);
        const isWordHighlighted = isKaraoke ? (w.index <= i) : isWordActive;

        // Pass 0: Word Highlight Box (Caixa Destaque)
        if (isWordActive && style.useWordHighlightBox) {
          const halfW = Math.round(w.width / 2 + 10);
          const halfH = Math.round(fontSizeAss * 0.65 + 4);
          dialogueLines.push(`Dialogue: 1,${startStr},${endStr},Default,,0,0,0,,{\\an5\\pos(${w.centerX},${w.y})\\bord0\\shad0\\1c${wordBoxColorAss}\\p1}m -${halfW} -${halfH} l ${halfW} -${halfH} l ${halfW} ${halfH} l -${halfW} ${halfH}{\\p0}`);
        }

        // Layer 0: Soft Drop Shadow (scales only for active word, skip if word box is active)
        if (hasShadow && !(isWordActive && style.useWordHighlightBox)) {
          if (isWordActive && isPop) {
            dialogueLines.push(`Dialogue: 0,${startStr},${endStr},ShadowStyle,,0,0,0,,{\\pos(${w.centerX},${w.shadowY})\\blur${blurAssVal}\\1c${shadowColorAss}\\3c${shadowColorAss}\\t(0,${dur},\\fscx${scaleMax}\\fscy${scaleMax})\\t(${dur},${dur * 2},\\fscx100\\fscy100)}${w.display}`);
          } else {
            dialogueLines.push(`Dialogue: 0,${startStr},${endStr},ShadowStyle,,0,0,0,,{\\pos(${w.centerX},${w.shadowY})\\blur${blurAssVal}\\1c${shadowColorAss}\\3c${shadowColorAss}}${w.display}`);
          }
        }

        // Layer 2: Foreground Text
        const textColor = isWordActive
          ? highlightColorAss
          : isWordHighlighted
          ? highlightColorAss
          : primaryColorAss;

        const outlineColor = (isWordActive && style.useWordHighlightBox && (style.strokeWidth ?? 0) <= 4)
          ? wordBoxColorAss
          : outlineColorAss;

        if (isWordActive && isPop) {
          dialogueLines.push(`Dialogue: 2,${startStr},${endStr},Default,,0,0,0,,{\\pos(${w.centerX},${w.y})\\1c${textColor}\\3c${outlineColor}\\t(0,${dur},\\fscx${scaleMax}\\fscy${scaleMax})\\t(${dur},${dur * 2},\\fscx100\\fscy100)}${w.display}`);
        } else {
          dialogueLines.push(`Dialogue: 2,${startStr},${endStr},Default,,0,0,0,,{\\pos(${w.centerX},${w.y})\\1c${textColor}\\3c${outlineColor}}${w.display}`);
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
