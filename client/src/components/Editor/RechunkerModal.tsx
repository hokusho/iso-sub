import React, { useState } from 'react';
import { LayoutGrid, X, Check, Sparkles } from 'lucide-react';
import { SubtitleBlock, SubtitleWord } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface RechunkerModalProps {
  isOpen: boolean;
  blocks: SubtitleBlock[];
  onClose: () => void;
  onApplyRechunk: (rechunkedBlocks: SubtitleBlock[]) => void;
}

export const RechunkerModal: React.FC<RechunkerModalProps> = ({
  isOpen,
  blocks,
  onClose,
  onApplyRechunk
}) => {
  const [wordsPerBlock, setWordsPerBlock] = useState<number>(3);

  if (!isOpen) return null;

  // Flatten all words
  const allWords: SubtitleWord[] = blocks.flatMap((b) => b.words);

  const handleApply = () => {
    if (allWords.length === 0) return;

    const newBlocks: SubtitleBlock[] = [];
    let currentWords: SubtitleWord[] = [];

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      currentWords.push(word);

      const isLast = i === allWords.length - 1;
      const nextWord = !isLast ? allWords[i + 1] : null;
      const hasLongPause = nextWord ? (nextWord.start - word.end > 0.4) : false;
      const reachedMax = currentWords.length >= wordsPerBlock;

      if (reachedMax || hasLongPause || isLast) {
        newBlocks.push({
          id: uuidv4(),
          start: currentWords[0].start,
          end: currentWords[currentWords.length - 1].end,
          text: currentWords.map((w) => w.text).join(' '),
          words: [...currentWords]
        });
        currentWords = [];
      }
    }

    onApplyRechunk(newBlocks);
    onClose();
  };

  const options = [
    {
      words: 1,
      title: '1 Palavra (Hormozi Fast)',
      desc: 'Ritmo ultrarrápido com 1 palavra na tela por vez, máxima retenção.',
      badge: '🔥 Mais Retenção'
    },
    {
      words: 2,
      title: '2 Palavras (Duo Pop)',
      desc: 'Frases muito curtas, visual limpo e dinâmico.',
      badge: '⚡ Dinâmico'
    },
    {
      words: 3,
      title: '3 Palavras (TikTok Padrão)',
      desc: 'O equilíbrio perfeito entre legibilidade e animação constante.',
      badge: '⭐ Recomendado'
    },
    {
      words: 5,
      title: '4-5 Palavras (Frase Curta)',
      desc: 'Ideal para vídeos explicativos ou podcasts.',
      badge: '🎙️ Podcasts'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-pop">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Reagrupador de Palavras</h3>
              <p className="text-xs text-slate-500 font-medium">Reorganize automaticamente a quantidade de palavras por bloco</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-3 mt-4">
          {options.map((opt) => {
            const isSelected = wordsPerBlock === opt.words;
            return (
              <div
                key={opt.words}
                onClick={() => setWordsPerBlock(opt.words)}
                className={`flex items-start justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex flex-col gap-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{opt.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {opt.desc}
                  </p>
                </div>

                <div className="mt-1 shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500 font-mono">
            {allWords.length} palavras totais
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleApply}
              disabled={allWords.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Reagrupar Legendas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
