import { SubtitleBlock, SubtitleWord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function isSignificantWord(wordText: string): boolean {
  if (!wordText) return false;
  const clean = wordText.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (!clean) return false;
  return clean.length > 2;
}

export function countSignificantWords(words: (string | { text: string })[]): number {
  return words.filter(w => isSignificantWord(typeof w === 'string' ? w : w.text)).length;
}

/**
 * Finds the optimal index to split a block of words into Line 1 and Line 2.
 * - If block has 3 or fewer words, keeps them all on Line 1.
 * - If block has 4 or more words, splits naturally at a comma or balanced middle.
 */
export function findOptimalSplitIndex(
  words: SubtitleWord[] | { text: string }[],
  targetWordsPerLine: number = 4
): number {
  if (!words || words.length <= 3) return words ? words.length : 0;

  const totalWords = words.length;

  // Look for natural punctuation (comma, semicolon) in the valid split range
  const commaIndices: number[] = [];
  words.forEach((w, idx) => {
    if (idx >= 1 && idx < totalWords - 1 && /[,;]$/.test(w.text.trim())) {
      commaIndices.push(idx + 1);
    }
  });

  // Prefer splitting right after a comma if neither line exceeds targetWordsPerLine + 1
  const maxAllowedPerLine = Math.max(3, targetWordsPerLine + 1);
  for (const splitIdx of commaIndices) {
    const l1Count = splitIdx;
    const l2Count = totalWords - splitIdx;
    if (l1Count <= maxAllowedPerLine && l2Count <= maxAllowedPerLine && l1Count >= 1 && l2Count >= 1) {
      return splitIdx;
    }
  }

  // Find the best split index that balances words & character count between L1 and L2
  let bestSplit = Math.max(1, Math.ceil(totalWords / 2));
  let bestScore = Infinity;

  for (let i = 1; i < totalWords; i++) {
    const l1Words = words.slice(0, i);
    const l2Words = words.slice(i);
    const l1Len = l1Words.map(w => w.text).join(' ').length;
    const l2Len = l2Words.map(w => w.text).join(' ').length;

    const wordDiff = Math.abs(l1Words.length - l2Words.length);
    const charDiff = Math.abs(l1Len - l2Len) / 10;

    // Strong penalty if either line exceeds targetWordsPerLine
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

/**
 * Intelligently recalculates SubtitleBlocks from user-edited full text,
 * strictly respecting terminal punctuation (. ? ! … : ;) to end blocks when breakOnPunctuation is true,
 * using commas (,) to cleanly end lines or blocks,
 * and grouping words by the chosen wordsPerLine and maxLines.
 */
export function recalculateBlocksFromFullText(
  fullText: string,
  existingBlocks: SubtitleBlock[],
  wordsPerLine: number = 4,
  maxLines: number = 2,
  breakOnPunctuation: boolean = true
): SubtitleBlock[] {
  const existingWords = existingBlocks.flatMap(b => b.words || []);
  if (existingWords.length === 0) return existingBlocks;

  const totalDuration = existingBlocks[existingBlocks.length - 1].end - existingBlocks[0].start;
  const globalStart = existingBlocks[0].start;

  // Extract all non-empty word strings
  const allWordStrings = fullText.trim().split(/\s+/).filter(Boolean);
  if (allWordStrings.length === 0) return existingBlocks;

  // Align new words to existing word timestamps
  const timedWords: SubtitleWord[] = [];
  const totalExisting = existingWords.length;
  const totalNew = allWordStrings.length;

  for (let i = 0; i < totalNew; i++) {
    const wordText = allWordStrings[i];
    let start: number;
    let end: number;

    if (totalNew === totalExisting) {
      // 1:1 exact mapping
      start = existingWords[i].start;
      end = existingWords[i].end;
    } else {
      // Proportional interpolation over original timeline
      const tStart = globalStart + (i / totalNew) * totalDuration;
      const tEnd = globalStart + ((i + 1) / totalNew) * totalDuration;
      start = Math.round(tStart * 1000) / 1000;
      end = Math.round(tEnd * 1000) / 1000;
    }

    timedWords.push({
      id: uuidv4(),
      text: wordText,
      start: Math.round(start * 1000) / 1000,
      end: Math.max(Math.round(start * 1000) / 1000 + 0.05, Math.round(end * 1000) / 1000)
    });
  }

  // Ensure strict non-overlapping sequential boundaries
  for (let i = 0; i < timedWords.length - 1; i++) {
    if (timedWords[i].end > timedWords[i + 1].start) {
      timedWords[i].end = timedWords[i + 1].start;
    }
  }

  // Maximum allowed words per block = wordsPerLine * maxLines
  const maxWordsPerBlock = wordsPerLine * maxLines;
  const maxCharsPerBlock = (maxLines === 1 ? Math.max(26, wordsPerLine * 7) : Math.max(52, wordsPerLine * 14));

  const newBlocks: SubtitleBlock[] = [];
  let currentBlockWords: SubtitleWord[] = [];

  for (let i = 0; i < timedWords.length; i++) {
    const w = timedWords[i];
    currentBlockWords.push({
      id: w.id,
      text: w.text,
      start: w.start,
      end: w.end
    });

    const isLast = i === timedWords.length - 1;
    const nextW = !isLast ? timedWords[i + 1] : null;

    const cleanWord = w.text.trim();
    // Strong terminal punctuation: . ? ! … : ; (Always ends the block immediately when enabled!)
    const hasTerminalPunct = breakOnPunctuation && /[.?!…:;]$/.test(cleanWord);
    // Comma punctuation: ,
    const hasComma = breakOnPunctuation && /[,]$/.test(cleanWord);
    // Pause between words > 0.45s
    const hasPause = nextW ? (nextW.start - w.end > 0.45) : false;

    const currentWordCount = currentBlockWords.length;
    const currentCharCount = currentBlockWords.map(bw => bw.text).join(' ').length;

    // Break conditions:
    // 1. Terminal punctuation (.?!…): ALWAYS finishes block immediately when enabled!
    // 2. Comma break:
    //    - In 1-line mode: breaks if currentWordCount >= 2
    //    - In 2-line mode: breaks if currentWordCount >= wordsPerLine (e.g. at 4, 5, 6, 7, 8 words, line 2 ended at comma!)
    // 3. Word count reached max allowed words per block
    // 4. Character count reached max safe chars
    // 5. Long audio pause or last word
    const shouldBreakOnComma = hasComma && (
      maxLines === 1 ? (currentWordCount >= 2) : (currentWordCount >= wordsPerLine)
    );
    const reachedMaxWords = currentWordCount >= maxWordsPerBlock;
    const reachedMaxChars = currentCharCount >= maxCharsPerBlock && currentWordCount >= (maxLines === 1 ? wordsPerLine : wordsPerLine * 2 - 1);

    if (hasTerminalPunct || shouldBreakOnComma || reachedMaxWords || reachedMaxChars || hasPause || isLast) {
      const bStart = currentBlockWords[0].start;
      const bEnd = currentBlockWords[currentBlockWords.length - 1].end;
      newBlocks.push({
        id: uuidv4(),
        start: bStart,
        end: Math.max(bStart + 0.1, bEnd),
        text: currentBlockWords.map(bw => bw.text).join(' '),
        words: [...currentBlockWords]
      });
      currentBlockWords = [];
    }
  }

  return newBlocks.length > 0 ? newBlocks : existingBlocks;
}
