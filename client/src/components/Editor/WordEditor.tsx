import React, { useState } from 'react';
import {
  Play,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Type,
  Eye,
  EyeOff
} from 'lucide-react';
import { SubtitleBlock, SubtitleWord, SubtitleStyle } from '../../types';
import { formatTimecode } from '../../utils/timeFormat';
import { v4 as uuidv4 } from 'uuid';

interface WordEditorProps {
  blocks: SubtitleBlock[];
  style?: SubtitleStyle;
  currentTime: number;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (blockId: string, updated: Partial<SubtitleBlock>) => void;
  onUpdateWord: (blockId: string, wordId: string, updated: Partial<SubtitleWord>) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteWord: (blockId: string, wordId: string) => void;
  onAddWord: (blockId: string) => void;
  onSeek: (time: number) => void;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  blocks,
  style,
  currentTime,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onUpdateWord,
  onDeleteBlock,
  onDeleteWord,
  onAddWord,
  onSeek
}) => {
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
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

  return (
    <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[600px] p-1.5 select-none">
      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border-2 border-neutral-300">
          <Type className="w-10 h-10 text-neutral-500 mb-2" />
          <p className="text-base font-black text-neutral-900">Nenhuma legenda encontrada.</p>
          <p className="text-xs text-neutral-600 mt-1 font-bold">Gere a transcrição ou adicione um novo bloco na timeline.</p>
        </div>
      ) : (
        blocks.map((block, idx) => {
          const isActive = currentTime >= block.start && currentTime <= block.end;
          const isSelected = selectedBlockId === block.id;
          const isExpanded = !!expandedBlocks[block.id];

          // Compute 1-line vs 2-line layout
          const targetWordsPerLine = style?.wordsPerLine || 3;
          const isMultiline = (style?.maxLines === 2 && block.words.length > targetWordsPerLine) || (block.words.length >= 6);

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
          splitIndex = isMultiline ? Math.min(block.words.length - 1, Math.max(1, splitIndex)) : block.words.length;

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
              {/* Block Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
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

                  <span className="text-xs font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                    #{idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(block.start);
                    }}
                    title="Ouvir este trecho"
                    className="flex items-center gap-1.5 text-xs font-mono text-neutral-900 font-black bg-neutral-100 hover:bg-neutral-200 px-2.5 py-0.5 rounded-lg border border-neutral-300 transition shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-neutral-900" />
                    <span>{formatTimecode(block.start)}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600 font-mono font-bold">
                    até {formatTimecode(block.end)}
                  </span>
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
  );
};
