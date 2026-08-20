import React, { useState } from 'react';
import { SubtitleStyle, SubtitleBlock, SubtitleWord } from '../../types';
import { MoveVertical, MoveHorizontal, LayoutGrid, Sparkles, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PositionControlsProps {
  style: SubtitleStyle;
  blocks?: SubtitleBlock[];
  onChange: (updated: Partial<SubtitleStyle>) => void;
  onApplyRechunk?: (rechunkedBlocks: SubtitleBlock[]) => void;
}

export const PositionControls: React.FC<PositionControlsProps> = ({
  style,
  blocks = [],
  onChange,
  onApplyRechunk
}) => {
  const currentY = style.positionY ?? 72;
  const currentX = style.positionX ?? 50;
  const currentLines = style.maxLines ?? 1;
  const currentWordsPerLine = style.wordsPerLine || 2;

  const [selectedWordsPerLine, setSelectedWordsPerLine] = useState<number>(currentWordsPerLine);
  const [breakOnPunctuation, setBreakOnPunctuation] = useState<boolean>(true);

  // Robust words extraction from all blocks
  const allWords: SubtitleWord[] = blocks.flatMap((b) => {
    if (b.words && b.words.length > 0) return b.words;
    const wordsText = (b.text || '').trim().split(/\s+/).filter(Boolean);
    if (wordsText.length === 0) return [];
    const dur = Math.max(0.1, b.end - b.start) / wordsText.length;
    return wordsText.map((t, i) => ({
      id: uuidv4(),
      text: t,
      start: b.start + i * dur,
      end: b.start + (i + 1) * dur
    }));
  });

  const handleRechunk = (
    wordsPerLine: number,
    lines: number = currentLines,
    usePunctuationBreak: boolean = breakOnPunctuation
  ) => {
    setSelectedWordsPerLine(wordsPerLine);
    onChange({ wordsPerLine, maxLines: lines });

    if (!onApplyRechunk || allWords.length === 0) return;

    // Total target words in the block = wordsPerLine * lines
    const totalWordsPerBlock = wordsPerLine * lines;

    const newBlocks: SubtitleBlock[] = [];
    let currentWords: SubtitleWord[] = [];

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      currentWords.push(word);

      const isLast = i === allWords.length - 1;
      const nextWord = !isLast ? allWords[i + 1] : null;
      const hasLongPause = nextWord ? (nextWord.start - word.end > 0.45) : false;

      // Smart punctuation detection (. , ? ! … : ;)
      const cleanWord = word.text.trim();
      const hasStrongPunctuation = /[.?!…:;]$/.test(cleanWord);
      const hasComma = /[,]$/.test(cleanWord);

      // Punctuation rule:
      // - Strong punctuation (.?!…): always finishes the sentence block immediately!
      // - Comma (,): breaks cleanly if we already have enough words or in 2-line mode
      const shouldBreakOnPunctuation = usePunctuationBreak && (
        hasStrongPunctuation ||
        (hasComma && currentWords.length >= (lines === 2 ? wordsPerLine : 1))
      );

      const reachedMax = currentWords.length >= totalWordsPerBlock;

      if (reachedMax || shouldBreakOnPunctuation || hasLongPause || isLast) {
        newBlocks.push({
          id: uuidv4(),
          start: Math.round(currentWords[0].start * 1000) / 1000,
          end: Math.round(currentWords[currentWords.length - 1].end * 1000) / 1000,
          text: currentWords.map((w) => w.text).join(' '),
          words: [...currentWords]
        });
        currentWords = [];
      }
    }

    onApplyRechunk(newBlocks);
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2.5">
        <div className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-neutral-900">
          <MoveVertical className="w-5 h-5 text-neutral-800" />
          <span>Posição & Layout da Legenda</span>
        </div>
        <span className="text-xs text-neutral-900 bg-neutral-200 px-2.5 py-0.5 rounded-lg font-mono font-black border border-neutral-300">
          Y: {currentY}% • X: {currentX}%
        </span>
      </div>

      {/* Grid de 2 Colunas: Altura (Y) e Posição Horizontal (X) Lado a Lado */}
      <div className="grid grid-cols-2 gap-3">
        {/* Coluna 1: Altura Vertical (Y) */}
        <div className="flex flex-col gap-2 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MoveVertical className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Altura (Y)</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => onChange({ positionY: Math.min(95, currentY + 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Descer (Base)"
              >
                -
              </button>
              <span className="w-9 text-center text-xs font-mono font-black text-neutral-900">{currentY}%</span>
              <button
                type="button"
                onClick={() => onChange({ positionY: Math.max(5, currentY - 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Subir (Topo)"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={100 - currentY}
            onChange={(e) => onChange({ positionY: 100 - parseInt(e.target.value, 10) })}
            className="w-full h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
          />

          <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Base', val: 82 },
              { label: '⭐ TikTok', val: 72 },
              { label: 'Centro', val: 50 },
              { label: 'Topo', val: 18 }
            ].map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => onChange({ positionY: q.val })}
                className={`py-1 text-[10px] font-black rounded-lg border transition truncate ${
                  Math.abs(currentY - q.val) <= 2
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coluna 2: Posição Horizontal (X) */}
        <div className="flex flex-col gap-2 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MoveHorizontal className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Horizontal (X)</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => onChange({ positionX: Math.max(10, currentX - 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Esquerda"
              >
                -
              </button>
              <span className="w-9 text-center text-xs font-mono font-black text-neutral-900">{currentX}%</span>
              <button
                type="button"
                onClick={() => onChange({ positionX: Math.min(90, currentX + 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Direita"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="range"
            min="20"
            max="80"
            step="1"
            value={currentX}
            onChange={(e) => onChange({ positionX: parseInt(e.target.value, 10) })}
            className="w-full h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
          />

          {/* Quick X buttons */}
          <div className="grid grid-cols-6 gap-1">
            <button
              type="button"
              onClick={() => onChange({ positionX: 30 })}
              className={`col-span-2 py-1 text-[10px] font-black rounded-lg border transition truncate ${
                currentX <= 35 ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-800 border-neutral-300'
              }`}
            >
              ⬅️ 30%
            </button>
            <button
              type="button"
              onClick={() => onChange({ positionX: 50 })}
              className={`col-span-2 py-1 text-[10px] font-black rounded-lg border transition truncate ${
                currentX >= 45 && currentX <= 55 ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-800 border-neutral-300'
              }`}
            >
              ⭐ Centro
            </button>
            <button
              type="button"
              onClick={() => onChange({ positionX: 70 })}
              className={`col-span-2 py-1 text-[10px] font-black rounded-lg border transition truncate ${
                currentX >= 65 ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-800 border-neutral-300'
              }`}
            >
              ➡️ 70%
            </button>
          </div>
        </div>
      </div>

      {/* Linha de Quebra & Densidade de Palavras por Bloco */}
      <div className="flex flex-col gap-2.5 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
        {/* 1. SELETOR DE LINHAS (1 LINHA VS 2 LINHAS) */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4 text-neutral-900" />
            <span className="text-xs font-black text-neutral-900">Linhas na Tela:</span>
          </div>
          <div className="flex items-center bg-white p-1 rounded-lg border border-neutral-300 gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                onChange({ maxLines: 1 });
                handleRechunk(selectedWordsPerLine || 2, 1);
              }}
              className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                currentLines === 1
                  ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              1 Linha
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ maxLines: 2 });
                handleRechunk(selectedWordsPerLine || 2, 2);
              }}
              className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                currentLines === 2
                  ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              2 Linhas (Tempo Somado)
            </button>
          </div>
        </div>

        {/* 2. SELETOR DE PALAVRAS POR LINHA (1, 2, 3, 4) */}
        {onApplyRechunk && blocks.length > 0 && (
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-neutral-900">
                {currentLines === 2 ? 'Palavras por Linha (2 Linhas):' : 'Palavras por Bloco (1 Linha):'}
              </span>
            </div>
            <div className="flex items-center bg-white p-1 rounded-lg border border-neutral-300 gap-1 shadow-sm">
              {[
                { words: 1, label: currentLines === 2 ? '1 Palavra / Linha' : '1 Palavra' },
                { words: 2, label: currentLines === 2 ? '2 Palavras / Linha' : '2 Palavras' },
                { words: 3, label: currentLines === 2 ? '3 Palavras / Linha' : '3 Palavras' },
                { words: 4, label: currentLines === 2 ? '4 Palavras / Linha' : '4 Palavras' }
              ].map((item) => {
                const isActive = (selectedWordsPerLine || currentWordsPerLine) === item.words;
                return (
                  <button
                    key={item.words}
                    type="button"
                    onClick={() => handleRechunk(item.words, currentLines)}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg transition transform active:scale-95 flex items-center justify-center ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                        : 'text-neutral-800 hover:bg-neutral-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. REGRA INTELIGENTE DE PONTUAÇÃO (. , ? ! …) */}
        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-neutral-300 shadow-sm mt-0.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xs font-black font-mono">
              . ,
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                <span>Quebra Inteligente por Pontuação</span>
                <span className="text-[10px] font-bold font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded border border-neutral-300">
                  . , ? ! …
                </span>
              </span>
              <span className="text-[10px] text-neutral-600 font-medium">
                Pula para a próxima linha ou bloco ao encontrar pontos e vírgulas.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const newVal = !breakOnPunctuation;
              setBreakOnPunctuation(newVal);
              handleRechunk(selectedWordsPerLine || 2, currentLines, newVal);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 ${
              breakOnPunctuation
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
            }`}
          >
            {breakOnPunctuation && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{breakOnPunctuation ? 'Ativado' : 'Desativado'}</span>
          </button>
        </div>

        {/* Subtexto explicativo dinâmico */}
        <p className="text-[11px] text-neutral-600 font-bold border-t border-neutral-200/80 pt-1.5 flex items-center justify-between">
          <span>
            {currentLines === 2
              ? `2 linhas na tela com ${selectedWordsPerLine || currentWordsPerLine} palavras em cada linha (respeitando pontos e vírgulas).`
              : `1 linha na tela com ${selectedWordsPerLine || currentWordsPerLine} palavras por bloco (respeitando pontos e vírgulas).`}
          </span>
        </p>
      </div>
    </div>
  );
};
