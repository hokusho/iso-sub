import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Type,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  FileText,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { SubtitleBlock, SubtitleWord, SubtitleStyle } from '../../types';
import { formatTimecode } from '../../utils/timeFormat';
import { v4 as uuidv4 } from 'uuid';

import {
  recalculateBlocksFromFullText,
  findOptimalSplitIndex,
  countSignificantWords
} from '../../utils/textChunker';

interface WordEditorProps {
  blocks: SubtitleBlock[];
  originalBlocks?: SubtitleBlock[];
  style?: SubtitleStyle;
  currentTime: number;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (blockId: string, updated: Partial<SubtitleBlock>) => void;
  onUpdateWord: (blockId: string, wordId: string, updated: Partial<SubtitleWord>) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteWord: (blockId: string, wordId: string) => void;
  onAddWord: (blockId: string) => void;
  onApplyBlocks?: (newBlocks: SubtitleBlock[]) => void;
  onStyleChange?: (updated: Partial<SubtitleStyle>) => void;
  onSeek: (time: number) => void;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  blocks,
  originalBlocks,
  style,
  currentTime,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onUpdateWord,
  onDeleteBlock,
  onDeleteWord,
  onAddWord,
  onApplyBlocks,
  onStyleChange,
  onSeek
}) => {
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Line & Word density controls
  const currentLines = style?.maxLines ?? 2;
  const currentWordsPerLine = style?.wordsPerLine || 4;
  const [breakOnPunctuation, setBreakOnPunctuation] = useState<boolean>(true);

  // Full Text Card State & Synchronization
  const [fullText, setFullText] = useState<string>('');
  const [isFullTextExpanded, setIsFullTextExpanded] = useState<boolean>(true);
  const [justRecalculated, setJustRecalculated] = useState<boolean>(false);

  // Compute the canonical text from blocks
  const canonicalText = blocks.map(b => b.text.trim()).filter(Boolean).join('\n');

  // Sync fullText whenever individual blocks change from above
  useEffect(() => {
    setFullText(canonicalText);
  }, [canonicalText]);

  const hasPendingTextChanges = fullText.trim() !== canonicalText.trim();

  const handleRecalculate = (
    words: number = currentWordsPerLine,
    lines: number = currentLines,
    usePunct: boolean = breakOnPunctuation
  ) => {
    if (!onApplyBlocks || blocks.length === 0) return;
    const recalculated = recalculateBlocksFromFullText(fullText, blocks, words, lines, usePunct);
    onApplyBlocks(recalculated);
    setJustRecalculated(true);
    setTimeout(() => setJustRecalculated(false), 2500);
  };

  const handleSelectLines = (lines: 1 | 2) => {
    onStyleChange?.({ maxLines: lines });
    handleRecalculate(currentWordsPerLine, lines, breakOnPunctuation);
  };

  const handleSelectWordsPerLine = (words: number) => {
    onStyleChange?.({ wordsPerLine: words });
    handleRecalculate(words, currentLines, breakOnPunctuation);
  };

  const handleTogglePunctuation = () => {
    const newVal = !breakOnPunctuation;
    setBreakOnPunctuation(newVal);
    handleRecalculate(currentWordsPerLine, currentLines, newVal);
  };

  const handleResetFullText = () => {
    setFullText(canonicalText);
  };

  const toggleExpand = (id: string) => {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to reset a block's timing back to its original Whisper alignment
  const handleResetBlockTiming = (block: SubtitleBlock) => {
    const original = originalBlocks?.find(b => b.id === block.id);
    if (!original) return;

    onUpdateBlock(block.id, {
      start: original.start,
      end: original.end,
      words: original.words && original.words.length > 0 ? original.words : block.words
    });
  };

  // Helper to adjust block start time
  const handleAdjustStartTime = (block: SubtitleBlock, delta: number, shiftEntireBlock = false) => {
    if (shiftEntireBlock) {
      const dur = block.end - block.start;
      const newStart = Math.max(0, Math.round((block.start + delta) * 100) / 100);
      const newEnd = Math.round((newStart + dur) * 100) / 100;
      const actualDelta = newStart - block.start;

      const updatedWords = (block.words || []).map(w => ({
        ...w,
        start: Math.max(0, Math.round((w.start + actualDelta) * 1000) / 1000),
        end: Math.max(0.05, Math.round((w.end + actualDelta) * 1000) / 1000)
      }));

      onUpdateBlock(block.id, {
        start: newStart,
        end: newEnd,
        words: updatedWords
      });
      return;
    }

    const minDuration = 0.2;
    const newStart = Math.max(0, Math.min(block.end - minDuration, Math.round((block.start + delta) * 100) / 100));
    if (newStart === block.start) return;

    const newDuration = block.end - newStart;
    const rawWords = block.words || [];
    const wordDur = newDuration / Math.max(1, rawWords.length);

    const updatedWords = rawWords.map((w, idx) => ({
      ...w,
      start: Math.round((newStart + idx * wordDur) * 1000) / 1000,
      end: idx === rawWords.length - 1 ? block.end : Math.round((newStart + (idx + 1) * wordDur) * 1000) / 1000
    }));

    onUpdateBlock(block.id, {
      start: newStart,
      words: updatedWords
    });
  };

  // Helper to adjust block end time
  const handleAdjustEndTime = (block: SubtitleBlock, delta: number, shiftEntireBlock = false) => {
    if (shiftEntireBlock) {
      return handleAdjustStartTime(block, delta, true);
    }

    const minDuration = 0.2;
    const newEnd = Math.max(block.start + minDuration, Math.round((block.end + delta) * 100) / 100);
    if (newEnd === block.end) return;

    const newDuration = newEnd - block.start;
    const rawWords = block.words || [];
    const wordDur = newDuration / Math.max(1, rawWords.length);

    const updatedWords = rawWords.map((w, idx) => ({
      ...w,
      start: Math.round((block.start + idx * wordDur) * 1000) / 1000,
      end: idx === rawWords.length - 1 ? newEnd : Math.round((block.start + (idx + 1) * wordDur) * 1000) / 1000
    }));

    onUpdateBlock(block.id, {
      end: newEnd,
      words: updatedWords
    });
  };

  const handleToggleHideLine = (block: SubtitleBlock, lineNumber: 1 | 2) => {
    const currentHidden = block.hiddenLines || [];
    const isCurrentlyHidden = currentHidden.includes(lineNumber);
    
    let newHidden: number[];
    if (isCurrentlyHidden) {
      newHidden = currentHidden.filter(n => n !== lineNumber);
    } else {
      newHidden = [...currentHidden, lineNumber];
    }

    onUpdateBlock(block.id, {
      hiddenLines: newHidden,
      hidden: newHidden.includes(1) && newHidden.includes(2)
    });
  };

  // Helper to update text of Line 1 or Line 2
  const handleUpdateLineText = (
    block: SubtitleBlock,
    lineIndex: 1 | 2,
    newText: string,
    splitIndex: number
  ) => {
    const rawWords = newText.trim().split(/\s+/).filter(Boolean);
    const existingWords = block.words && block.words.length > 0
      ? [...block.words]
      : [{ id: uuidv4(), text: block.text, start: block.start, end: block.end }];

    let newLine1Words: SubtitleWord[];
    let newLine2Words: SubtitleWord[];

    if (lineIndex === 1) {
      const line1OldWords = existingWords.slice(0, splitIndex);
      const line1Duration = line1OldWords.length > 0
        ? line1OldWords[line1OldWords.length - 1].end - line1OldWords[0].start
        : (block.end - block.start) / 2;
      const line1Start = line1OldWords.length > 0 ? line1OldWords[0].start : block.start;
      const wordDur = Math.max(0.1, line1Duration / Math.max(1, rawWords.length));

      newLine1Words = rawWords.map((t, i) => {
        const oldW = line1OldWords[i];
        return {
          id: oldW ? oldW.id : uuidv4(),
          text: t,
          start: Math.round((line1Start + i * wordDur) * 1000) / 1000,
          end: Math.round((line1Start + (i + 1) * wordDur) * 1000) / 1000
        };
      });

      newLine2Words = existingWords.slice(splitIndex);
    } else {
      newLine1Words = existingWords.slice(0, splitIndex);

      const line2OldWords = existingWords.slice(splitIndex);
      const line2Duration = line2OldWords.length > 0
        ? line2OldWords[line2OldWords.length - 1].end - line2OldWords[0].start
        : (block.end - block.start) / 2;
      const line2Start = line2OldWords.length > 0 ? line2OldWords[0].start : (block.start + block.end) / 2;
      const wordDur = Math.max(0.1, line2Duration / Math.max(1, rawWords.length));

      newLine2Words = rawWords.map((t, i) => {
        const oldW = line2OldWords[i];
        return {
          id: oldW ? oldW.id : uuidv4(),
          text: t,
          start: Math.round((line2Start + i * wordDur) * 1000) / 1000,
          end: Math.round((line2Start + (i + 1) * wordDur) * 1000) / 1000
        };
      });
    }

    const updatedWords = [...newLine1Words, ...newLine2Words];
    const fullText = updatedWords.map(w => w.text).join(' ');

    onUpdateBlock(block.id, {
      text: fullText,
      words: updatedWords
    });
  };

  // Helper to update full 1-line block text
  const handleUpdateFullBlockText = (block: SubtitleBlock, newText: string) => {
    const rawWords = newText.trim().split(/\s+/).filter(Boolean);
    const existingWords = block.words || [];
    const duration = block.end - block.start;
    const wordDur = Math.max(0.05, duration / Math.max(1, rawWords.length));

    const updatedWords: SubtitleWord[] = rawWords.map((t, i) => {
      const oldW = existingWords[i];
      return {
        id: oldW ? oldW.id : uuidv4(),
        text: t,
        start: oldW ? oldW.start : Math.round((block.start + i * wordDur) * 1000) / 1000,
        end: oldW ? oldW.end : Math.round((block.start + (i + 1) * wordDur) * 1000) / 1000
      };
    });

    onUpdateBlock(block.id, {
      text: newText,
      words: updatedWords
    });
  };

  // Helper to transform text case (ABC, Abc, abc) - transforms selected text or whole line
  const handleTransformCase = (
    block: SubtitleBlock,
    lineIndex: 1 | 2,
    mode: 'upper' | 'title' | 'lower',
    splitIndex: number,
    isMultiline: boolean
  ) => {
    const inputKey = `${block.id}-${lineIndex}`;
    const inputEl = inputRefs.current[inputKey];
    const currentVal = !isMultiline || lineIndex === 1
      ? (isMultiline ? block.words.slice(0, splitIndex).map(w => w.text).join(' ') : block.text)
      : block.words.slice(splitIndex).map(w => w.text).join(' ');

    const start = inputEl?.selectionStart ?? 0;
    const end = inputEl?.selectionEnd ?? 0;

    const transformStr = (s: string) => {
      if (mode === 'upper') return s.toUpperCase();
      if (mode === 'lower') return s.toLowerCase();
      // Title case: Capitalize first letter of each word
      return s.toLowerCase().replace(/(^|\s|\p{P})\p{L}/gu, (m) => m.toUpperCase());
    };

    let newText: string;
    let newSelStart = start;
    let newSelEnd = end;

    if (start !== end && start >= 0 && end <= currentVal.length) {
      const before = currentVal.substring(0, start);
      const selected = currentVal.substring(start, end);
      const after = currentVal.substring(end);
      const transformedSelected = transformStr(selected);
      newText = before + transformedSelected + after;
      newSelStart = start;
      newSelEnd = start + transformedSelected.length;
    } else {
      newText = transformStr(currentVal);
    }

    if (isMultiline) {
      handleUpdateLineText(block, lineIndex, newText, splitIndex);
    } else {
      handleUpdateFullBlockText(block, newText);
    }

    if (inputEl) {
      setTimeout(() => {
        inputEl.focus();
        if (start !== end) {
          inputEl.setSelectionRange(newSelStart, newSelEnd);
        }
      }, 20);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full select-none pb-2">
      {/* 1. CARD DO TEXTO COMPLETO (REVISÃO & PONTUAÇÃO INTELIGENTE) */}
      {blocks.length > 0 && (
        <div className="flex flex-col p-3.5 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm gap-2.5">
          {/* Header do Card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                Texto Completo & Pontuação
              </span>
              <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                {blocks.length} {blocks.length === 1 ? 'linha' : 'linhas'} • {blocks.reduce((s, b) => s + (b.words?.length || 0), 0)} palavras
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsFullTextExpanded(!isFullTextExpanded)}
              className="text-xs font-bold text-neutral-700 hover:text-neutral-950 flex items-center gap-1 cursor-pointer bg-neutral-50 hover:bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-300 transition shadow-2xs"
            >
              {isFullTextExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{isFullTextExpanded ? 'Recolher' : 'Expandir'}</span>
            </button>
          </div>

          {isFullTextExpanded && (
            <div className="flex flex-col gap-2 pt-1 border-t border-neutral-200">
              <p className="text-[11px] text-neutral-600 leading-relaxed font-medium">
                Edite acentuações, vírgulas e pontos linha por linha. Ao terminar, clique no botão para <strong>recalcular e reorganizar as legendas</strong>.
              </p>

              {/* Textarea do Texto Completo */}
              <div className="relative">
                <textarea
                  value={fullText}
                  onChange={(e) => setFullText(e.target.value)}
                  rows={Math.min(8, Math.max(3, fullText.split('\n').length))}
                  placeholder="Digite ou edite o texto completo linha por linha..."
                  className="w-full p-3 text-xs font-mono font-bold text-neutral-900 bg-neutral-50 border-2 border-neutral-300 focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 rounded-xl leading-relaxed resize-y shadow-inner outline-none transition"
                />
              </div>

              {/* Ações: Status + Botão Recalcular */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                {hasPendingTextChanges ? (
                  <span className="text-[11px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
                    ⚠️ Alterações pendentes
                  </span>
                ) : justRecalculated ? (
                  <span className="text-[11px] font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-700" /> Legendas recalculadas!
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Sincronizado com os blocos abaixo
                  </span>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  {hasPendingTextChanges && (
                    <button
                      type="button"
                      onClick={handleResetFullText}
                      className="px-2.5 py-1.5 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition cursor-pointer"
                      title="Descartar mudanças e restaurar texto dos blocos"
                    >
                      Desfazer
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRecalculate()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg transition cursor-pointer shadow-sm bg-neutral-900 text-white hover:bg-black ring-2 ring-neutral-900/30 active:scale-95"
                    title="Recalcular e reorganizar legendas com base na pontuação e linhas"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${hasPendingTextChanges ? 'animate-spin-once' : ''}`} />
                    <span>Recalcular Legendas</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CARD DE CONFIGURAÇÃO DE DIVISÃO & DENSIDADE DE PALAVRAS */}
      {blocks.length > 0 && (
        <div className="flex flex-col gap-2.5 bg-white p-3.5 rounded-2xl border-2 border-neutral-300 shadow-sm">
          {/* Linhas na Tela */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Linhas na Tela:</span>
            </div>
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-300 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => handleSelectLines(1)}
                className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                  currentLines === 1
                    ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                1 Linha
              </button>
              <button
                type="button"
                onClick={() => handleSelectLines(2)}
                className={`px-3 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                  currentLines === 2
                    ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                2 Linhas
              </button>
            </div>
          </div>

          {/* Palavras por Linha */}
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-neutral-900">
                {currentLines === 2 ? 'Palavras por Linha (2 Linhas):' : 'Palavras por Bloco (1 Linha):'}
              </span>
            </div>
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-300 gap-1 shadow-inner">
              {[
                { words: 1, label: '1 Palavra' },
                { words: 2, label: '2 Palavras' },
                { words: 3, label: '3 Palavras' },
                { words: 4, label: '4 Palavras' },
                { words: 5, label: '5 Palavras' }
              ].map((item) => {
                const isActive = currentWordsPerLine === item.words;
                return (
                  <button
                    key={item.words}
                    type="button"
                    onClick={() => handleSelectWordsPerLine(item.words)}
                    className={`px-2 py-1 text-xs font-black rounded-lg transition transform active:scale-95 flex items-center justify-center cursor-pointer ${
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

          {/* Quebra Inteligente por Pontuação */}
          <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 mt-0.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-xs font-black font-mono shadow-xs">
                . ,
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                  <span>Quebra Inteligente por Pontuação</span>
                  <span className="text-[10px] font-bold font-mono bg-white text-neutral-700 px-1.5 py-0.2 rounded border border-neutral-300">
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
              onClick={handleTogglePunctuation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ${
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
                ? `2 linhas na tela com ${currentWordsPerLine} palavras em cada linha (respeitando pontos e vírgulas).`
                : `1 linha na tela com ${currentWordsPerLine} palavras por bloco (respeitando pontos e vírgulas).`}
            </span>
          </p>
        </div>
      )}

      {/* 3. CARD PRINCIPAL: LEGENDAS POR LINHA */}
      <div className="flex flex-col p-3.5 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm gap-3">
        {/* Header do Card das Linhas */}
        <div className="flex items-center justify-between border-b-2 border-neutral-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
              Legendas por Linha
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              {blocks.length} {blocks.length === 1 ? 'bloco' : 'blocos'}
            </span>
          </div>
        </div>

        {/* Lista de Sub-cards das Linhas */}
        <div className="flex flex-col gap-2.5">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-neutral-50 rounded-xl border-2 border-neutral-200">
              <Type className="w-10 h-10 text-neutral-400 mb-2" />
              <p className="text-sm font-black text-neutral-900">Nenhuma legenda encontrada.</p>
              <p className="text-xs text-neutral-500 mt-1 font-bold">Gere a transcrição ou digite no texto acima.</p>
            </div>
          ) : (
            blocks.map((block, idx) => {
          const isActive = currentTime >= block.start && currentTime <= block.end;
          const isSelected = selectedBlockId === block.id;
          const isExpanded = !!expandedBlocks[block.id];

          const origBlock = originalBlocks?.find(b => b.id === block.id);
          const isTimingModified = Boolean(
            origBlock &&
            (Math.abs(origBlock.start - block.start) > 0.01 || Math.abs(origBlock.end - block.end) > 0.01)
          );

          // Compute 1-line vs 2-line layout
          const targetWordsPerLine = style?.wordsPerLine || 4;
          const splitIndex = style?.maxLines === 2 ? findOptimalSplitIndex(block.words, targetWordsPerLine) : block.words.length;
          const isMultiline = style?.maxLines === 2 && splitIndex < block.words.length;

          const line1Words = block.words.slice(0, splitIndex);
          const line2Words = isMultiline ? block.words.slice(splitIndex) : [];

          const line1Text = line1Words.map(w => w.text).join(' ');
          const line2Text = line2Words.map(w => w.text).join(' ');

          const isLine1Hidden = block.hidden || block.hiddenLines?.includes(1);
          const isLine2Hidden = block.hidden || block.hiddenLines?.includes(2);

          return (
            <div
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={`flex flex-col rounded-2xl transition-all p-3.5 ${
                isActive
                  ? 'bg-white border-[2.5px] border-neutral-950 shadow-md ring-2 ring-neutral-950/20'
                  : isSelected
                  ? 'bg-white border-2 border-neutral-600 shadow-sm'
                  : 'bg-white hover:bg-neutral-100 border-2 border-neutral-300'
              }`}
            >
              {/* Block Header with Timing Steppers */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Left Side: Start Time Stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(block.id);
                    }}
                    className="p-1 text-neutral-800 hover:text-black bg-neutral-100 rounded-lg border border-neutral-300 transition"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>

                  <span className="text-xs font-mono font-black text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">
                    #{idx + 1}
                  </span>

                  {/* Start Stepper (- / Play / +) */}
                  <div className="flex items-center bg-neutral-100 rounded-lg border border-neutral-300 p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustStartTime(block, -0.1, e.shiftKey);
                      }}
                      title="Adiantar início (-0.1s). Segure Shift para mover bloco todo."
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-black text-xs transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeek(block.start);
                      }}
                      title="Ouvir este trecho"
                      className="flex items-center gap-1 text-xs font-mono font-black px-1.5 py-0.5 rounded hover:bg-neutral-200 text-neutral-900 transition"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{formatTimecode(block.start)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustStartTime(block, 0.1, e.shiftKey);
                      }}
                      title="Atrasar início (+0.1s). Segure Shift para mover bloco todo."
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-black text-xs transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Right Side: End Time Stepper, Restore & Delete */}
                <div className="flex items-center gap-1.5">
                  {/* Restore Original Timing Button (Shown when timing has been modified) */}
                  {isTimingModified && origBlock && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetBlockTiming(block);
                      }}
                      title={`Restaurar tempo original (${formatTimecode(origBlock.start)} - ${formatTimecode(origBlock.end)})`}
                      className="p-1 text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-lg border border-neutral-300 transition shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* End Stepper (- / até / +) */}
                  <div className="flex items-center bg-neutral-100 rounded-lg border border-neutral-300 p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustEndTime(block, -0.1, e.shiftKey);
                      }}
                      title="Terminar antes (-0.1s). Segure Shift para mover bloco todo."
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-black text-xs transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded text-neutral-700">
                      até {formatTimecode(block.end)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustEndTime(block, 0.1, e.shiftKey);
                      }}
                      title="Terminar depois (+0.1s). Segure Shift para mover bloco todo."
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-neutral-200 active:bg-neutral-300 text-neutral-800 font-black text-xs transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBlock(block.id);
                    }}
                    title="Excluir este bloco"
                    className="p-1 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VISUALIZAÇÃO POR LINHAS (LINHA 1 E LINHA 2 COM TOGGLE DE OLHO) */}
              <div className="mt-2.5 flex flex-col gap-2">
                {/* LINHA 1 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase text-neutral-600 bg-neutral-100 px-1.5 py-1 rounded border border-neutral-300 shrink-0">
                    L1
                  </span>

                  <input
                    ref={(el) => { inputRefs.current[`${block.id}-1`] = el; }}
                    type="text"
                    value={isMultiline ? line1Text : block.text}
                    onChange={(e) => {
                      if (isMultiline) {
                        handleUpdateLineText(block, 1, e.target.value, splitIndex);
                      } else {
                        onUpdateBlock(block.id, { text: e.target.value });
                      }
                    }}
                    className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-black border-2 transition shadow-sm ${
                      isLine1Hidden
                        ? 'bg-neutral-200 text-neutral-400 border-neutral-300 line-through'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900'
                    }`}
                    placeholder="Texto da Linha 1..."
                  />

                  {/* Botões de Caixa Alta/Baixa (ABC, Abc, abc) para Linha 1 */}
                  <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-300 gap-0.5 shrink-0 shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransformCase(block, 1, 'upper', splitIndex, isMultiline);
                      }}
                      title="TUDO MAIÚSCULO (ABC) - Altera seleção ou linha toda"
                      className="px-2 py-1 text-[11px] font-black rounded-lg text-neutral-800 hover:text-black hover:bg-neutral-200 active:scale-95 transition"
                    >
                      ABC
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransformCase(block, 1, 'title', splitIndex, isMultiline);
                      }}
                      title="Primeira Letra Maiúscula (Abc) - Altera seleção ou linha toda"
                      className="px-2 py-1 text-[11px] font-black rounded-lg text-neutral-800 hover:text-black hover:bg-neutral-200 active:scale-95 transition"
                    >
                      Abc
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransformCase(block, 1, 'lower', splitIndex, isMultiline);
                      }}
                      title="tudo minúsculo (abc) - Altera seleção ou linha toda"
                      className="px-2 py-1 text-[11px] font-black rounded-lg text-neutral-800 hover:text-black hover:bg-neutral-200 active:scale-95 transition"
                    >
                      abc
                    </button>
                  </div>

                  {/* Eye Toggle para Linha 1 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleHideLine(block, 1);
                    }}
                    title={isLine1Hidden ? 'Mostrar Linha 1 no Vídeo' : 'Ocultar Linha 1 no Vídeo'}
                    className={`p-2 rounded-xl border transition active:scale-95 shadow-sm ${
                      isLine1Hidden
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900'
                    }`}
                  >
                    {isLine1Hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* LINHA 2 (Exibida quando o bloco for de 2 Linhas) */}
                {isMultiline && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase text-neutral-600 bg-neutral-100 px-1.5 py-1 rounded border border-neutral-300 shrink-0">
                      L2
                    </span>

                    <input
                      ref={(el) => { inputRefs.current[`${block.id}-2`] = el; }}
                      type="text"
                      value={line2Text}
                      onChange={(e) => handleUpdateLineText(block, 2, e.target.value, splitIndex)}
                      className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-black border-2 transition shadow-sm ${
                        isLine2Hidden
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 line-through'
                          : 'bg-neutral-100 border-neutral-300 text-neutral-900 focus:outline-none focus:border-neutral-900'
                      }`}
                      placeholder="Texto da Linha 2..."
                    />

                    {/* Botões de Caixa Alta/Baixa (ABC, Abc, abc) para Linha 2 */}
                    <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-300 gap-0.5 shrink-0 shadow-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransformCase(block, 2, 'upper', splitIndex, isMultiline);
                        }}
                        title="TUDO MAIÚSCULO (ABC) - Altera seleção ou linha toda"
                        className="px-2 py-1 text-[11px] font-black rounded-lg text-neutral-800 hover:text-black hover:bg-neutral-200 active:scale-95 transition"
                      >
                        ABC
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransformCase(block, 2, 'title', splitIndex, isMultiline);
                        }}
                        title="Primeira Letra Maiúscula (Abc) - Altera seleção ou linha toda"
                        className="px-2 py-1 text-[11px] font-black rounded-lg text-neutral-800 hover:text-black hover:bg-neutral-200 active:scale-95 transition"
                      >
                        Abc
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransformCase(block, 2, 'lower', splitIndex, isMultiline);
                        }}
                        title="tudo minúsculo (abc) - Altera seleção ou linha toda"
                        className="px-2 py-1 text-[11px] font-black rounded-lg text-neutral-800 hover:text-black hover:bg-neutral-200 active:scale-95 transition"
                      >
                        abc
                      </button>
                    </div>

                    {/* Eye Toggle para Linha 2 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHideLine(block, 2);
                      }}
                      title={isLine2Hidden ? 'Mostrar Linha 2 no Vídeo' : 'Ocultar Linha 2 no Vídeo'}
                      className={`p-2 rounded-xl border transition active:scale-95 shadow-sm ${
                        isLine2Hidden
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900'
                      }`}
                    >
                      {isLine2Hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Word List */}
              {isExpanded && (
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t-2 border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-900 uppercase">Palavras e Timestamps</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddWord(block.id);
                      }}
                      className="flex items-center gap-1.5 text-xs font-black text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-lg border border-neutral-300 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Palavra</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {block.words.map((word, wordIdx) => {
                      const isWordActive = currentTime >= word.start && currentTime < word.end;

                      return (
                        <div
                          key={word.id}
                          className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition ${
                            isWordActive
                              ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400'
                              : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-neutral-500 w-5">
                            #{wordIdx + 1}
                          </span>

                          <input
                            type="text"
                            value={word.text}
                            onChange={(e) => onUpdateWord(block.id, word.id, { text: e.target.value })}
                            className="flex-1 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 shadow-sm"
                          />

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={word.start}
                              onChange={(e) => onUpdateWord(block.id, word.id, { start: parseFloat(e.target.value) || 0 })}
                              className="w-16 bg-white border border-neutral-300 rounded-lg px-1 py-1 text-xs font-mono font-bold text-neutral-900 text-center shadow-sm"
                              title="Início (segundos)"
                            />
                            <span className="text-xs text-neutral-400">→</span>
                            <input
                              type="number"
                              step="0.01"
                              value={word.end}
                              onChange={(e) => onUpdateWord(block.id, word.id, { end: parseFloat(e.target.value) || 0 })}
                              className="w-16 bg-white border border-neutral-300 rounded-lg px-1 py-1 text-xs font-mono font-bold text-neutral-900 text-center shadow-sm"
                              title="Fim (segundos)"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteWord(block.id, word.id);
                            }}
                            title="Excluir palavra"
                            className="p-1 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
        </div>
      </div>
    </div>
  );
};
