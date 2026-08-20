import React, { useState } from 'react';
import { LayoutGrid, Sparkles, Check } from 'lucide-react';
import { SubtitleBlock, SubtitleWord } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface WordChunkControlsProps {
  blocks: SubtitleBlock[];
  onApplyRechunk: (rechunkedBlocks: SubtitleBlock[]) => void;
}

export const WordChunkControls: React.FC<WordChunkControlsProps> = ({
  blocks,
  onApplyRechunk
}) => {
  const [wordsPerBlock, setWordsPerBlock] = useState<number>(3);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Flatten all words
  const allWords: SubtitleWord[] = blocks.flatMap((b) => b.words);

  const handleApply = (count: number) => {
    setWordsPerBlock(count);
    if (allWords.length === 0) return;

    const newBlocks: SubtitleBlock[] = [];
    let currentWords: SubtitleWord[] = [];

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      currentWords.push(word);

      const isLast = i === allWords.length - 1;
      const nextWord = !isLast ? allWords[i + 1] : null;
      const hasLongPause = nextWord ? (nextWord.start - word.end > 0.4) : false;
      const reachedMax = currentWords.length >= count;

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
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2000);
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
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm select-none">
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2.5 text-base font-black uppercase tracking-wider text-slate-900">
          <LayoutGrid className="w-5 h-5 text-slate-800" />
          <span>Reagrupador & Quebra de Palavras</span>
        </div>
        <span className="text-xs font-mono font-black text-slate-900 bg-[#e2e8f0] px-3 py-1 rounded-lg border border-slate-300 shadow-sm">
          {allWords.length} palavras
        </span>
      </div>

      <p className="text-xs text-slate-700 font-bold leading-relaxed">
        Escolha a densidade de palavras na tela por bloco para reajustar o ritmo visual do vídeo:
      </p>

      {/* Grid de Opções de Quebra em Cards */}
      <div className="flex flex-col gap-2.5 bg-[#e2e8f0] p-3 rounded-2xl border-2 border-slate-300 shadow-inner">
        {options.map((opt) => {
          const isSelected = wordsPerBlock === opt.words;

          return (
            <div
              key={opt.words}
              onClick={() => handleApply(opt.words)}
              className={`flex items-start justify-between p-3.5 rounded-xl border-2 cursor-pointer transition transform active:scale-[0.99] shadow-sm ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-950 shadow-md ring-2 ring-slate-900'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex flex-col gap-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {opt.title}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-slate-800 text-slate-200' : 'bg-[#cbd5e1] text-slate-900'
                  }`}>
                    {opt.badge}
                  </span>
                </div>
                <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-slate-600'} font-medium`}>
                  {opt.desc}
                </p>
              </div>

              <div className="mt-1 shrink-0">
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-md ring-2 ring-emerald-300">
                    <Check className="w-4 h-4 stroke-[3.5]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {appliedSuccess && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs font-black text-emerald-900 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Legendas reagrupadas com sucesso!</span>
        </div>
      )}
    </div>
  );
};
