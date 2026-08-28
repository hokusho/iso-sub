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

export function getAssFontName(fontFamily: string = 'Montserrat', fontWeight: number | string = 800): { fontName: string; isBold: boolean } {
  const fw = typeof fontWeight === 'string' ? parseInt(fontWeight, 10) || 800 : fontWeight || 800;
  const fam = (fontFamily || 'Montserrat').trim();

  if (fam.toLowerCase() === 'montserrat') {
    if (fw >= 900) return { fontName: 'Montserrat Black', isBold: false };
    if (fw >= 800) return { fontName: 'Montserrat ExtraBold', isBold: false };
    if (fw >= 600) return { fontName: 'Montserrat', isBold: true };
    return { fontName: 'Montserrat', isBold: false };
  }

  if (fam.toLowerCase() === 'poppins') {
    if (fw >= 900) return { fontName: 'Poppins Black', isBold: false };
    if (fw >= 800) return { fontName: 'Poppins ExtraBold', isBold: false };
    if (fw >= 600) return { fontName: 'Poppins', isBold: true };
    return { fontName: 'Poppins', isBold: false };
  }

  if (fam.toLowerCase() === 'inter') {
    if (fw >= 900) return { fontName: 'Inter-Black', isBold: false };
    if (fw >= 800) return { fontName: 'Inter-ExtraBold', isBold: false };
    if (fw >= 600) return { fontName: 'Inter-Bold', isBold: false };
    return { fontName: 'Inter', isBold: false };
  }

  if (fam.toLowerCase() === 'rubik') {
    if (fw >= 900) return { fontName: 'Rubik-Black', isBold: false };
    if (fw >= 800) return { fontName: 'Rubik-ExtraBold', isBold: false };
    if (fw >= 600) return { fontName: 'Rubik-Bold', isBold: false };
    return { fontName: 'Rubik', isBold: false };
  }

  if (fam.toLowerCase() === 'syne') {
    if (fw >= 800) return { fontName: 'Syne-ExtraBold', isBold: false };
    return { fontName: 'Syne-Bold', isBold: false };
  }

  if (fam.toLowerCase() === 'roboto') {
    if (fw >= 900) return { fontName: 'Roboto-Black', isBold: false };
    return { fontName: 'Roboto-Bold', isBold: false };
  }

  if (fam.toLowerCase() === 'oswald') {
    return { fontName: 'Oswald', isBold: true };
  }

  if (fam.toLowerCase() === 'anton') {
    return { fontName: 'Anton', isBold: false };
  }

  if (fam.toLowerCase() === 'bebas neue') {
    return { fontName: 'Bebas Neue', isBold: false };
  }

  if (fam.toLowerCase() === 'archivo black') {
    return { fontName: 'Archivo Black', isBold: false };
  }

  return { fontName: fam, isBold: fw >= 600 };
}

/**
 * Generates an ASS vector drawing path for a rounded rectangle using cubic Bézier curves
 */
function buildAssRoundedRect(w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, Math.floor(w / 2), Math.floor(h / 2)));
  if (r <= 1) {
    return `m 0 0 l ${w} 0 l ${w} ${h} l 0 ${h}`;
  }
  const k = +(r * 0.55228475).toFixed(1);
  const rRound = Math.round(r);
  const wRound = Math.round(w);
  const hRound = Math.round(h);

  const p1x = rRound;
  const p2x = wRound - rRound;
  const p3y = rRound;
  const p4y = hRound - rRound;

  return [
    `m ${p1x} 0`,
    `l ${p2x} 0`,
    `b ${(p2x + k).toFixed(1)} 0 ${wRound} ${(p3y - k).toFixed(1)} ${wRound} ${p3y}`,
    `l ${wRound} ${p4y}`,
    `b ${wRound} ${(p4y + k).toFixed(1)} ${(p2x + k).toFixed(1)} ${hRound} ${p2x} ${hRound}`,
    `l ${p1x} ${hRound}`,
    `b ${(p1x - k).toFixed(1)} ${hRound} 0 ${(p4y + k).toFixed(1)} 0 ${p4y}`,
    `l 0 ${p3y}`,
    `b 0 ${(p3y - k).toFixed(1)} ${(p1x - k).toFixed(1)} 0 ${p1x} 0`
  ].join(' ');
}

export interface AssBuilderOptions {
  width: number;
  height: number;
  blocks: SubtitleBlock[];
  style: SubtitleStyle;
  isTransparentProRes?: boolean;
}

/**
 * Sanitizes block and word timestamps to prevent overlapping dialogue events in ASS
 */
function sanitizeBlocksForAss(rawBlocks: SubtitleBlock[]): SubtitleBlock[] {
  if (!rawBlocks || rawBlocks.length === 0) return [];

  const sorted = [...rawBlocks].sort((a, b) => a.start - b.start);
  const cleanBlocks: SubtitleBlock[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = { ...sorted[i] };
    const next = sorted[i + 1];

    let bStart = Math.max(0, current.start);
    let bEnd = Math.max(bStart + 0.05, current.end);

    if (next) {
      const nextStart = Math.max(0, next.start);
      if (bEnd >= nextStart) {
        bEnd = Math.max(bStart + 0.02, nextStart - 0.01);
      }
    }

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
    }

    const textWords = (current.text || '').trim().split(/\s+/).filter(Boolean);
    if (textWords.length > 0) {
      if (textWords.length === cleanWords.length) {
        cleanWords = cleanWords.map((w, idx) => ({
          ...w,
          text: textWords[idx]
        }));
      } else {
        const totalDur = Math.max(0.1, bEnd - bStart);
        const wDur = totalDur / textWords.length;
        cleanWords = textWords.map((tw, idx) => {
          const ws = bStart + idx * wDur;
          const we = idx === textWords.length - 1 ? bEnd : ws + wDur;
          return {
            id: cleanWords[idx]?.id || `w_${idx}`,
            text: tw,
            start: Math.round(ws * 1000) / 1000,
            end: Math.round(we * 1000) / 1000
          };
        });
      }
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
 * Exact proportional character width table for bold sans-serif fonts (calibrated for libass / FreeType)
 */
const LIBASS_FONT_SCALE = 0.638;

const CHAR_ADVANCE_TABLE: Record<string, number> = {
  'A': 0.786, 'B': 0.769, 'C': 0.730, 'D': 0.826, 'E': 0.672, 'F': 0.642, 'G': 0.770, 'H': 0.806,
  'I': 0.339, 'J': 0.557, 'K': 0.752, 'L': 0.610, 'M': 0.954, 'N': 0.806, 'O': 0.846, 'P': 0.737,
  'Q': 0.846, 'R': 0.740, 'S': 0.647, 'T': 0.635, 'U': 0.786, 'V': 0.766, 'W': 1.184, 'X': 0.737,
  'Y': 0.693, 'Z': 0.679, 'a': 0.628, 'b': 0.695, 'c': 0.603, 'd': 0.698, 'e': 0.642, 'f': 0.406,
  'g': 0.705, 'h': 0.696, 'i': 0.313, 'j': 0.320, 'k': 0.677, 'l': 0.313, 'm': 1.045, 'n': 0.696,
  'o': 0.666, 'p': 0.695, 'q': 0.695, 'r': 0.443, 's': 0.547, 't': 0.447, 'u': 0.692, 'v': 0.620,
  'w': 0.956, 'x': 0.619, 'y': 0.620, 'z': 0.556, '0': 0.685, '1': 0.405, '2': 0.599, '3': 0.603,
  '4': 0.700, '5': 0.607, '6': 0.649, '7': 0.632, '8': 0.669, '9': 0.649, ' ': 0.291, '!': 0.301,
  '?': 0.597, '.': 0.283, ',': 0.283, '-': 0.388, ':': 0.283, ';': 0.283, '\'': 0.250, '"': 0.400,
  'Á': 0.786, 'À': 0.786, 'Ã': 0.786, 'Â': 0.786, 'É': 0.672, 'Ê': 0.672, 'Í': 0.339, 'Ó': 0.846,
  'Ô': 0.846, 'Õ': 0.846, 'Ú': 0.786, 'Ç': 0.730, 'á': 0.628, 'à': 0.628, 'ã': 0.628, 'â': 0.628,
  'é': 0.642, 'ê': 0.642, 'í': 0.313, 'ó': 0.666, 'ô': 0.666, 'õ': 0.666, 'ú': 0.692, 'ç': 0.603
};

/**
 * Estimates text width in pixels matching canvas measureText & libass FreeType output
 */
function estimateTextWidth(text: string, fontSize: number, letterSpacing: number = 0): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const adv = CHAR_ADVANCE_TABLE[char] || 0.65;
    width += fontSize * adv * LIBASS_FONT_SCALE;
  }
  return Math.round(width + (text.length > 1 ? (text.length - 1) * letterSpacing : 0));
}

function findOptimalSplitIndex(words: { text: string }[], targetWordsPerLine: number = 4): number {
  if (!words || words.length <= 1) return words ? words.length : 0;

  const totalWords = words.length;

  for (let i = 0; i < Math.min(totalWords - 1, targetWordsPerLine); i++) {
    const wText = (words[i]?.text || '').trim();
    if (/[.,?!…:;-]$/.test(wText)) {
      return i + 1;
    }
  }

  return Math.min(totalWords - 1, Math.max(1, targetWordsPerLine));
}

export function buildAssSubtitle(options: AssBuilderOptions): string {
  const { blocks: rawBlocks, style, width = 1080, height = 1920 } = options;
  const blocks = sanitizeBlocksForAss(rawBlocks);

  // Dynamic Canvas coordinate space matching the actual video resolution
  const virtualWidth = width || 1080;
  const virtualHeight = height || (virtualWidth === 1920 ? 1080 : 1920);

  const primaryColorAss = hexToAssColor(style.textColor || '#FFFFFF', 0);
  const highlightColorAss = hexToAssColor(style.highlightColor || '#FFE600', 0);
  const wordBoxColorAss = hexToAssColor(style.wordHighlightBoxColor || style.highlightColor || '#A855F7', 0);
  const wordBoxTextColorAss = hexToAssColor(style.wordHighlightBoxTextColor || style.textColor || '#FFFFFF', 0);
  
  const hasStroke = (style.strokeWidth && style.strokeWidth > 0);
  const outlineColorAss = hasStroke
    ? hexToAssColor(style.strokeColor || '#000000', 0)
    : '&HFF000000&';

  const hasShadow = (style.shadowDistance && style.shadowDistance > 0) || (style.shadowBlur && style.shadowBlur > 0);
  const shadowColorAss = hasShadow
    ? hexToAssColor(style.shadowColor || '#000000', 0)
    : '&HFF000000&';

  // Dynamic scale factor matching CanvasPreview.tsx: (baseHeight / 1920) * 2
  const scaleFactor = (virtualHeight / 1920) * 2;
  const strokeAss = hasStroke ? Math.round((style.strokeWidth || 8) * (scaleFactor * 0.75)) : 0;
  const shadowDistAss = Math.max(1, Math.round((style.shadowDistance ?? 4) * (scaleFactor * 0.75)));
  
  // Calculate target positions
  const posX = Math.round(((style.positionX ?? 50) / 100) * virtualWidth);
  const posY = Math.round(((style.positionY ?? 74) / 100) * virtualHeight);

  // Safe blur bound between 0 and 12px
  const safeBlur = Math.min(12, Math.max(0, style.shadowBlur ?? 0));
  const blurAssVal = safeBlur > 0 ? (safeBlur * 0.6).toFixed(1) : '0';

  // Font Size scaled 1:1 with Canvas Preview
  const fontSizeAss = Math.round((style.fontSize || 44) * scaleFactor);

  // Font Family & Bold setting from static bundled TTF resolver
  const fontResolution = getAssFontName(style.fontFamily || 'Montserrat', style.fontWeight || 800);
  const fontName = fontResolution.fontName;
  const boldVal = fontResolution.isBold ? -1 : 0;

  // Alignment: \an5 = Center middle
  const anCode = 5;

  // Build ASS Header with PlayRes matching Canvas Preview coordinate space
  const header = `[Script Info]
; Script generated by ISO SUB Engine (Pixel-Perfect 1:1 Match with Canvas Preview)
Title: Animated Captions Full HD
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${virtualWidth}
PlayResY: ${virtualHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSizeAss},${primaryColorAss},${highlightColorAss},${outlineColorAss},${shadowColorAss},${boldVal},0,0,0,100,100,0,0,1,${strokeAss},0,${anCode},40,40,40,1
Style: ShadowStyle,${fontName},${fontSizeAss},${shadowColorAss},${shadowColorAss},${shadowColorAss},${shadowColorAss},${boldVal},0,0,0,100,100,0,0,1,${strokeAss},0,${anCode},40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogueLines: string[] = [];

  for (const block of blocks) {
    const blockStartStr = formatAssTime(block.start);
    const blockEndStr = formatAssTime(block.end);

    if (!block.words || block.words.length === 0) {
      const text = transformTextCase(block.text, style.caseTransform);
      if (hasShadow) {
        dialogueLines.push(`Dialogue: 1,${blockStartStr},${blockEndStr},ShadowStyle,,0,0,0,,{\\pos(${posX},${posY + shadowDistAss})\\blur${blurAssVal}\\1c${shadowColorAss}\\3c${shadowColorAss}}${text}`);
      }
      dialogueLines.push(`Dialogue: 2,${blockStartStr},${blockEndStr},Default,,0,0,0,,{\\pos(${posX},${posY})}${text}`);
      continue;
    }

    // Format and measure words to establish layout
    const formattedWords = block.words.map((w, idx) => {
      const display = transformTextCase((w.text || '').trim(), style.caseTransform);
      const width = estimateTextWidth(display, fontSizeAss, 0);
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

    // Determine 1-line vs 2-line layout exactly matching CanvasPreview.tsx
    const targetWordsPerLine = style.wordsPerLine || 4;
    const splitIndex = style.maxLines === 2 ? findOptimalSplitIndex(formattedWords, targetWordsPerLine) : formattedWords.length;
    const isMultiline = style.maxLines === 2 && splitIndex < formattedWords.length;

    const line1Words = formattedWords.slice(0, splitIndex);
    const line2Words = isMultiline ? formattedWords.slice(splitIndex) : [];

    const line1FullText = line1Words.map(w => w.display).join(' ');
    const line2FullText = line2Words.map(w => w.display).join(' ');

    const line1Width = estimateTextWidth(line1FullText, fontSizeAss, 0);
    const line2Width = isMultiline ? estimateTextWidth(line2FullText, fontSizeAss, 0) : 0;
    const maxLineWidth = Math.max(line1Width, line2Width);

    const lineSpacing = Math.round(fontSizeAss * (style.lineHeight || 1.25));
    const line1Y = isMultiline ? posY - Math.round(lineSpacing / 2) : posY;
    const line2Y = isMultiline ? posY + Math.round(lineSpacing / 2) : posY;

    const isLine1Hidden = block.hidden || block.hiddenLines?.includes(1);
    const isLine2Hidden = block.hidden || (isMultiline && block.hiddenLines?.includes(2));

    // 1. Pass 0: Full Block Background Box (Caixa de Fundo do Bloco)
    if (style.useBackgroundBox) {
      const padX = Math.round((style.boxPaddingX || 16) * scaleFactor);
      const padY = Math.round((style.boxPaddingY || 8) * scaleFactor);
      const boxW = Math.round(maxLineWidth + padX * 2);
      const totalTextHeight = isMultiline ? lineSpacing + fontSizeAss : fontSizeAss;
      const boxH = Math.round(totalTextHeight + padY * 2);
      const boxX = Math.round(posX - boxW / 2);
      const boxY = Math.round(posY - boxH / 2);
      const boxAlpha = Math.round((1 - (style.boxOpacity ?? 0.8)) * 255);
      const bgBoxColorAss = hexToAssColor(style.boxColor || '#000000', boxAlpha);
      const bgRadius = Math.round((style.boxRadius || 12) * scaleFactor);
      const bgPath = buildAssRoundedRect(boxW, boxH, bgRadius);

      dialogueLines.push(`Dialogue: 0,${blockStartStr},${blockEndStr},Default,,0,0,0,,{\\an7\\pos(${boxX},${boxY})\\bord0\\shad0\\1c${bgBoxColorAss}\\p1}${bgPath}{\\p0}`);
    }

    const isHighlightEnabled = style.useHighlight !== false;
    const isKaraoke = style.animationType === 'karaoke';

    // Word-by-word active time slices
    for (let i = 0; i < formattedWords.length; i++) {
      const activeWord = formattedWords[i];
      const nextWord = formattedWords[i + 1];

      const wordStart = activeWord.start;
      const wordEnd = nextWord ? Math.min(block.end, nextWord.start) : block.end;

      if (wordEnd <= wordStart) continue;

      const startStr = formatAssTime(wordStart);
      const endStr = formatAssTime(wordEnd);

      const isLine1Active = i < splitIndex;
      const targetLineWords = isLine1Active ? line1Words : line2Words;
      const targetLineY = isLine1Active ? line1Y : line2Y;
      const targetLineWidth = isLine1Active ? line1Width : line2Width;
      const activeIdxInLine = targetLineWords.findIndex(w => w.index === i);

      // Pop / Bounce animation parameters
      const isPop = (style.animationType === 'pop' || style.animationType === 'bounce');
      const durMs = Math.min(220, Math.max(120, Math.round((wordEnd - wordStart) * 1000 * 0.6)));
      const halfDurMs = Math.round(durMs / 2);
      const scalePercent = Math.round(Math.min(1.30, Math.max(1.08, style.animationScale || 1.18)) * 100);

      // Layer 1: Word Highlight Box (Caixa Destaque na Palavra Ativa com Pop)
      if (style.useWordHighlightBox && activeIdxInLine >= 0) {
        const textBefore = targetLineWords.slice(0, activeIdxInLine).map(w => w.display).join(' ') + (activeIdxInLine > 0 ? ' ' : '');
        const widthBefore = estimateTextWidth(textBefore, fontSizeAss, 0);
        const wordWidth = estimateTextWidth(activeWord.display, fontSizeAss, 0);
        const lineStartX = posX - targetLineWidth / 2;
        const wordCenterX = Math.round(lineStartX + widthBefore + wordWidth / 2);

        const padX = Math.max(4, Math.round((style.wordHighlightBoxPaddingX ?? 4) * (scaleFactor * 0.7)));
        const padY = Math.max(2, Math.round((style.wordHighlightBoxPaddingY ?? 1) * (scaleFactor * 0.7)));
        const boxW = Math.round(wordWidth + padX * 2);
        const boxH = Math.round(fontSizeAss * 0.95 + padY * 2);
        const boxX = Math.round(wordCenterX - boxW / 2);
        const boxY = Math.round(targetLineY - boxH / 2);
        const wordRadius = Math.min(Math.floor(boxH / 2), Math.round((style.wordHighlightBoxRadius ?? 6) * scaleFactor));
        const wordBoxPath = buildAssRoundedRect(boxW, boxH, wordRadius);

        const boxAnimTag = isPop
          ? `\\org(${wordCenterX},${targetLineY})\\t(0,${halfDurMs},\\fscx${scalePercent}\\fscy${scalePercent})\\t(${halfDurMs},${durMs},\\fscx100\\fscy100)`
          : '';

        dialogueLines.push(`Dialogue: 1,${startStr},${endStr},Default,,0,0,0,,{\\an7\\pos(${boxX},${boxY})${boxAnimTag}\\bord0\\shad0\\1c${wordBoxColorAss}\\p1}${wordBoxPath}{\\p0}`);
      }

      // Helper to build unbroken continuous line text with native FreeType spacing
      const formatUnbrokenLine = (lineWords: typeof formattedWords) => {
        return lineWords.map((w) => {
          const isWordActive = (w.index === i);
          const isWordHighlighted = isKaraoke ? (w.index <= i) : isWordActive;

          if (isWordActive && isPop) {
            // Invisible placeholder so line spacing is 100% natural, active word popped on Layer 3
            return `{\\alpha&HFF&}${w.display}{\\alpha&H00&}`;
          }

          let color = primaryColorAss;
          if (isHighlightEnabled) {
            if (isWordActive) {
              color = style.useWordHighlightBox ? wordBoxTextColorAss : highlightColorAss;
            } else if (isWordHighlighted) {
              color = highlightColorAss;
            }
          }
          return `{\\1c${color}}${w.display}`;
        }).join(' ');
      };

      // Helper to render the active pop word on Layer 3
      const renderActivePopWord = () => {
        if (!isPop || activeIdxInLine < 0) return;
        const textBefore = targetLineWords.slice(0, activeIdxInLine).map(w => w.display).join(' ') + (activeIdxInLine > 0 ? ' ' : '');
        const widthBefore = estimateTextWidth(textBefore, fontSizeAss, 0);
        const wordWidth = estimateTextWidth(activeWord.display, fontSizeAss, 0);
        const lineStartX = posX - targetLineWidth / 2;
        const wordCenterX = Math.round(lineStartX + widthBefore + wordWidth / 2);
        const activeColor = style.useWordHighlightBox ? wordBoxTextColorAss : highlightColorAss;

        dialogueLines.push(`Dialogue: 3,${startStr},${endStr},Default,,0,0,0,,{\\an5\\pos(${wordCenterX},${targetLineY})\\org(${wordCenterX},${targetLineY})\\1c${activeColor}\\t(0,${halfDurMs},\\fscx${scalePercent}\\fscy${scalePercent})\\t(${halfDurMs},${durMs},\\fscx100\\fscy100)}${activeWord.display}`);
      };

      // Helper to build unbroken shadow text
      const formatUnbrokenShadowLine = (lineWords: typeof formattedWords) => {
        return lineWords.map((w) => `{\\1c${shadowColorAss}\\3c${shadowColorAss}}${w.display}`).join(' ');
      };

      // Render Line 1 (Unbroken continuous string with 100% natural spacing)
      if (!isLine1Hidden && line1Words.length > 0) {
        if (hasShadow && !style.useWordHighlightBox) {
          const shadowLineText = formatUnbrokenShadowLine(line1Words);
          dialogueLines.push(`Dialogue: 1,${startStr},${endStr},ShadowStyle,,0,0,0,,{\\pos(${posX},${line1Y + shadowDistAss})\\an5\\blur${blurAssVal}}${shadowLineText}`);
        }
        const lineText = formatUnbrokenLine(line1Words);
        dialogueLines.push(`Dialogue: 2,${startStr},${endStr},Default,,0,0,0,,{\\pos(${posX},${line1Y})\\an5}${lineText}`);
        if (isLine1Active) {
          renderActivePopWord();
        }
      }

      // Render Line 2 (Unbroken continuous string with 100% natural spacing)
      if (isMultiline && !isLine2Hidden && line2Words.length > 0) {
        if (hasShadow && !style.useWordHighlightBox) {
          const shadowLineText = formatUnbrokenShadowLine(line2Words);
          dialogueLines.push(`Dialogue: 1,${startStr},${endStr},ShadowStyle,,0,0,0,,{\\pos(${posX},${line2Y + shadowDistAss})\\an5\\blur${blurAssVal}}${shadowLineText}`);
        }
        const lineText = formatUnbrokenLine(line2Words);
        dialogueLines.push(`Dialogue: 2,${startStr},${endStr},Default,,0,0,0,,{\\pos(${posX},${line2Y})\\an5}${lineText}`);
        if (!isLine1Active) {
          renderActivePopWord();
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
