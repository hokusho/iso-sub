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
 * Finds the linear index to split a block of words into Line 1 and Line 2.
 * - Line 1 fills up to targetWordsPerLine.
 * - If any word within Line 1 ends with punctuation (, . ! ? … : ; -), Line 1 cleanly breaks at that word.
 */
export function findOptimalSplitIndex(
  words: SubtitleWord[] | { text: string }[],
  targetWordsPerLine: number = 4
): number {
  if (!words || words.length <= 1) return words ? words.length : 0;

  const totalWords = words.length;

  for (let i = 0; i < Math.min(totalWords - 1, targetWordsPerLine); i++) {
    const item = words[i];
    const wText = (typeof item === 'string' ? (item as string) : item?.text || '').trim();
    if (/[.,?!…:;-]$/.test(wText)) {
      return i + 1;
    }
  }

  // Otherwise, split linearly at targetWordsPerLine
  return Math.min(totalWords - 1, Math.max(1, targetWordsPerLine));
}

/**
 * Fatiador Linear Sequencial de Legendas:
 * 1. Unificação Inicial: Considera todo o texto como sequência linear única de palavras.
 * 2. Buffer / Balde Acumulador: Adiciona as palavras da esquerda para a direita.
 * 3. Condições Estritas de Corte:
 *    - Gatilho 1: O balde atingiu exatamente o limite máximo de palavras (X = maxWordsPerBlock).
 *    - Gatilho 2: A última palavra colocada no balde termina com sinal de pontuação (., ,, !, ?, …, :, ;, -).
 *    - Final do Texto.
 */
export function recalculateBlocksFromFullText(
  fullText: string,
  existingBlocks: SubtitleBlock[],
  wordsPerLine: number = 4,
  maxLines: number = 1,
  breakOnPunctuation: boolean = true
): SubtitleBlock[] {
  const existingWords = existingBlocks.flatMap(b => b.words || []);
  if (existingWords.length === 0) return existingBlocks;

  const totalDuration = existingBlocks[existingBlocks.length - 1].end - existingBlocks[0].start;
  const globalStart = existingBlocks[0].start;

  // Unificação Inicial
  const allWordStrings = fullText.trim().split(/\s+/).filter(Boolean);
  if (allWordStrings.length === 0) return existingBlocks;

  // Mapeamento proporcional de tempo para cada palavra
  const timedWords: SubtitleWord[] = [];
  const totalExisting = existingWords.length;
  const totalNew = allWordStrings.length;

  for (let i = 0; i < totalNew; i++) {
    const wordText = allWordStrings[i];
    let start: number;
    let end: number;

    if (totalNew === totalExisting) {
      start = existingWords[i].start;
      end = existingWords[i].end;
    } else {
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

  // Limites temporais estritamente sequenciais
  for (let i = 0; i < timedWords.length - 1; i++) {
    if (timedWords[i].end > timedWords[i + 1].start) {
      timedWords[i].end = timedWords[i + 1].start;
    }
  }

  // Limite máximo de palavras por tela (X)
  const maxWordsPerBlock = maxLines === 1 ? wordsPerLine : wordsPerLine * maxLines;

  const newBlocks: SubtitleBlock[] = [];
  let bucket: SubtitleWord[] = [];

  for (let i = 0; i < timedWords.length; i++) {
    const w = timedWords[i];
    bucket.push({
      id: w.id,
      text: w.text,
      start: w.start,
      end: w.end
    });

    const isLast = i === timedWords.length - 1;
    const cleanWord = w.text.trim();

    // Gatilho 2: Pontuação forçando a quebra imediata
    const hasPunctuation = breakOnPunctuation && /[.,?!…:;-]$/.test(cleanWord);

    // Gatilho 1: Limite máximo de palavras atingido (X)
    const reachedWordLimit = bucket.length >= maxWordsPerBlock;

    // Esvazia o balde e cria nova tela
    if (hasPunctuation || reachedWordLimit || isLast) {
      const bStart = bucket[0].start;
      const bEnd = bucket[bucket.length - 1].end;
      newBlocks.push({
        id: uuidv4(),
        start: bStart,
        end: Math.max(bStart + 0.1, bEnd),
        text: bucket.map(bw => bw.text).join(' '),
        words: [...bucket]
      });
      bucket = [];
    }
  }

  return newBlocks.length > 0 ? newBlocks : existingBlocks;
}
