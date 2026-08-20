import React, { useState } from 'react';
import { Search, Replace, X, Check } from 'lucide-react';
import { SubtitleBlock } from '../../types';

interface SearchReplaceModalProps {
  isOpen: boolean;
  blocks: SubtitleBlock[];
  onClose: () => void;
  onApplyReplace: (updatedBlocks: SubtitleBlock[]) => void;
}

export const SearchReplaceModal: React.FC<SearchReplaceModalProps> = ({
  isOpen,
  blocks,
  onClose,
  onApplyReplace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  if (!isOpen) return null;

  // Calculate match occurrences
  let matchCount = 0;
  if (searchTerm.trim().length > 0) {
    blocks.forEach((b) => {
      b.words.forEach((w) => {
        const wordText = matchCase ? w.text : w.text.toLowerCase();
        const query = matchCase ? searchTerm : searchTerm.toLowerCase();
        if (wordText.includes(query)) matchCount++;
      });
    });
  }

  const handleExecuteReplace = () => {
    if (!searchTerm.trim()) return;

    const newBlocks = blocks.map((block) => {
      const regex = new RegExp(
        searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        matchCase ? 'g' : 'gi'
      );

      const newWords = block.words.map((w) => ({
        ...w,
        text: w.text.replace(regex, replaceTerm)
      }));

      const newBlockText = newWords.map((w) => w.text).join(' ');

      return {
        ...block,
        text: newBlockText,
        words: newWords
      };
    });

    onApplyReplace(newBlocks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-pop">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Buscar & Substituir</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="text-xs font-bold text-slate-700">Buscar por</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: inteligencia artificial"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none transition shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Substituir por</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Ex: IA"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none transition shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
              <span>Diferenciar maiúsculas/minúsculas</span>
            </label>

            {searchTerm.trim().length > 0 && (
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {matchCount} ocorrências
              </span>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>

            <button
              onClick={handleExecuteReplace}
              disabled={!searchTerm.trim() || matchCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Replace className="w-4 h-4" />
              <span>Substituir Tudo ({matchCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
