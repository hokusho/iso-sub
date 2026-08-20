import React, { useState } from 'react';
import { SubtitleBlock } from '../../types';
import { Copy, Check, FileText, Sparkles, Download, Languages, Loader2 } from 'lucide-react';
import { formatTimecode } from '../../utils/timeFormat';

interface ContinuousEditorProps {
  blocks: SubtitleBlock[];
  originalBlocks: SubtitleBlock[];
  translatedBlocks: SubtitleBlock[] | null;
  activeSubtitleVersion: 'original' | 'translated';
  currentTime: number;
  onSeek: (time: number) => void;
  onSelectSubtitleVersion: (version: 'original' | 'translated') => void;
  onTranslate: (targetLanguage: string) => Promise<void>;
  isTranslating: boolean;
}

export const ContinuousEditor: React.FC<ContinuousEditorProps> = ({
  blocks,
  originalBlocks,
  translatedBlocks,
  activeSubtitleVersion,
  currentTime,
  onSeek,
  onSelectSubtitleVersion,
  onTranslate,
  isTranslating
}) => {
  const [copied, setCopied] = useState(false);
  const [formatMode, setFormatMode] = useState<'sentences' | 'timestamps' | 'paragraph'>('sentences');
  const [targetLang, setTargetLang] = useState('pt');

  const langNames: Record<string, string> = {
    pt: 'Português',
    en: 'Inglês',
    es: 'Espanhol',
    fr: 'Francês',
    de: 'Alemão',
    it: 'Italiano',
    ja: 'Japonês',
    zh: 'Chinês'
  };

  const hasTranslated = Boolean(translatedBlocks && translatedBlocks.length > 0);

  // Generate formatted text based on selected mode
  const getFormattedText = () => {
    if (!blocks || blocks.length === 0) return 'Nenhuma transcrição disponível no momento.';

    if (formatMode === 'sentences') {
      return blocks
        .map((b) => b.text.trim())
        .filter(Boolean)
        .join('\n\n');
    }

    if (formatMode === 'timestamps') {
      return blocks
        .map((b) => `[${formatTimecode(b.start)} - ${formatTimecode(b.end)}] ${b.text.trim()}`)
        .filter(Boolean)
        .join('\n');
    }

    if (formatMode === 'paragraph') {
      return blocks
        .map((b) => b.text.trim())
        .filter(Boolean)
        .join(' ');
    }

    return '';
  };

  const formattedText = getFormattedText();
  const totalWords = blocks.reduce((acc, b) => acc + (b.words?.length || b.text.split(' ').length), 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${activeSubtitleVersion}-${formatMode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3.5 select-none">
      {/* 1. SELETOR DE VERSÃO DE LEGENDA (ORIGINAL VS TRADUZIDA) */}
      <div className="flex flex-col gap-2 p-3 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm">
        <div className="flex items-center justify-between text-xs font-black uppercase text-neutral-900 border-b border-neutral-200 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-neutral-800" />
            <span>Versão da Legenda no Vídeo</span>
          </div>
          <span className="text-[10px] font-mono bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded">
            {activeSubtitleVersion === 'original' ? '🎙️ Áudio Original Ativo' : `🌐 Tradução Ativa (${langNames[targetLang] || targetLang})`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Botão Legenda Original */}
          <button
            type="button"
            onClick={() => onSelectSubtitleVersion('original')}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
              activeSubtitleVersion === 'original'
                ? 'bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
            }`}
          >
            <span>🎙️ Áudio Original (Nativo)</span>
          </button>

          {/* Botão Legenda Traduzida */}
          <button
            type="button"
            onClick={() => onSelectSubtitleVersion('translated')}
            disabled={!hasTranslated}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition ${
              activeSubtitleVersion === 'translated'
                ? 'bg-neutral-900 text-white shadow-sm ring-2 ring-neutral-900'
                : hasTranslated
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60'
            }`}
          >
            <span>🌐 Legenda Traduzida</span>
          </button>
        </div>

        {/* Ferramenta de Tradução Rápida com IA */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-neutral-800">Traduzir para:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-neutral-900 shadow-sm"
            >
              <option value="pt">🇧🇷 Português (Brasil)</option>
              <option value="en">🇺🇸 Inglês (English)</option>
              <option value="es">🇪🇸 Espanhol (Español)</option>
              <option value="fr">🇫🇷 Francês (Français)</option>
              <option value="de">🇩🇪 Alemão (Deutsch)</option>
              <option value="it">🇮🇹 Italiano (Italiano)</option>
              <option value="ja">🇯🇵 Japonês (日本語)</option>
              <option value="zh">🇨🇳 Chinês (中文)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => onTranslate(targetLang)}
            disabled={isTranslating || originalBlocks.length === 0}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition transform active:scale-95 disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Traduzindo com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Traduzir Roteiro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. VISUALIZAÇÃO INTERATIVA DO ROTEIRO COM SYNC DE PLAY */}
      <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm">
        <div className="text-base font-black uppercase tracking-wider text-neutral-900 border-b-2 border-neutral-200 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neutral-800" />
            <span>Roteiro {activeSubtitleVersion === 'translated' ? 'Traduzido' : 'Original'} Sincronizado</span>
          </div>
          <span className="text-xs text-neutral-900 bg-neutral-200 px-2.5 py-0.5 rounded-lg font-mono font-black border border-neutral-300">
            Clique na palavra
          </span>
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-2 leading-relaxed text-base max-h-48 overflow-y-auto pr-1">
          {blocks.length === 0 ? (
            <span className="text-sm text-neutral-600 italic">Carregue um vídeo para visualizar o roteiro.</span>
          ) : (
            blocks.flatMap((block) =>
              block.words.map((word) => {
                const isWordActive = currentTime >= word.start && currentTime < word.end;

                return (
                  <span
                    key={word.id || `${word.text}-${word.start}`}
                    onClick={() => onSeek(word.start)}
                    className={`cursor-pointer px-2.5 py-1 rounded-xl font-black transition-all select-none ${
                      isWordActive
                        ? 'bg-neutral-900 text-white shadow-md scale-105 ring-2 ring-neutral-950'
                        : 'text-neutral-800 hover:text-black hover:bg-neutral-200 border border-transparent hover:border-neutral-300'
                    }`}
                  >
                    {word.text}
                  </span>
                );
              })
            )
          )}
        </div>
      </div>

      {/* 3. CAIXA DE TEXTO COMPLETO FORMATADO PARA COPIAR */}
      <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm">
        {/* Header com Controles e Botão Copiar */}
        <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-800" />
            <div className="flex flex-col">
              <span className="text-base font-black text-neutral-900 uppercase tracking-wider">
                Texto Transcrito Completo
              </span>
              <span className="text-xs text-neutral-600 font-mono font-bold">
                {blocks.length} frases • {totalWords} palavras
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              title="Baixar como arquivo .TXT"
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition active:scale-95 border border-neutral-300 shadow-sm"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition transform active:scale-95 shadow-sm ${
                copied
                  ? 'bg-neutral-900 text-white shadow-md'
                  : 'bg-neutral-900 hover:bg-black text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copiar Roteiro</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Abas de Formatação de Saída */}
        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
          <span className="text-xs text-neutral-900 font-black">Formato:</span>
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-300 gap-1 shadow-sm">
            <button
              type="button"
              onClick={() => setFormatMode('sentences')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                formatMode === 'sentences'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-800 hover:text-black hover:bg-neutral-200'
              }`}
            >
              📝 Frase por Frase
            </button>
            <button
              type="button"
              onClick={() => setFormatMode('timestamps')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                formatMode === 'timestamps'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-800 hover:text-black hover:bg-neutral-200'
              }`}
            >
              ⏱️ Com Tempo
            </button>
            <button
              type="button"
              onClick={() => setFormatMode('paragraph')}
              className={`px-3 py-1 text-xs font-black rounded-lg transition ${
                formatMode === 'paragraph'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-800 hover:text-black hover:bg-neutral-200'
              }`}
            >
              📄 Parágrafo
            </button>
          </div>
        </div>

        {/* Caixa de Texto Organizada */}
        <div className="relative group">
          <textarea
            readOnly
            value={formattedText}
            rows={7}
            className="w-full bg-neutral-100 border-2 border-neutral-300 rounded-xl p-3.5 text-neutral-950 text-sm font-mono font-bold leading-relaxed focus:outline-none focus:border-neutral-900 resize-y transition select-text shadow-inner"
            placeholder="O texto transcrito formatado aparecerá aqui..."
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-600 font-mono font-bold">
          <span>Pronto para colar em editores, YouTube ou IA</span>
          <span>Clique em "Copiar Roteiro"</span>
        </div>
      </div>
    </div>
  );
};
