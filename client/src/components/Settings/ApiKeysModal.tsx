import React, { useState, useEffect } from 'react';
import { Key, X, Check, Zap, ShieldCheck, ExternalLink } from 'lucide-react';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [groqKey, setGroqKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setGroqKey(localStorage.getItem('GROQ_API_KEY') || '');
    setOpenaiKey(localStorage.getItem('OPENAI_API_KEY') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('GROQ_API_KEY', groqKey.trim());
    localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
    setSavedSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-pop">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Configurar Transcrição Whisper</h3>
              <p className="text-xs text-slate-500 font-medium">Timestamps palavra por palavra em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed font-medium">
          Conecte sua chave da Groq (gratuita e super rápida) ou OpenAI para transcrever o áudio com precisão cirúrgica:
        </p>

        <div className="flex flex-col gap-4 mt-4">
          {/* Groq Key */}
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-slate-900" />
                <span>Groq API Key (Recomendado - Gratuito & 1s)</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-slate-700 hover:text-black font-bold underline"
              >
                <span>Criar Chave Grátis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none font-bold"
            />
            <span className="text-[11px] text-slate-500 mt-1.5 block font-medium">
              ⭐ Roda o modelo <strong>Whisper Large v3</strong> em menos de 1 segundo com palavras individuais. Gratuito e sem cartão.
            </span>
          </div>

          {/* OpenAI Key */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                OpenAI API Key (Whisper-1)
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-bold underline"
              >
                <span>Obter na OpenAI</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>Salvas apenas no seu navegador local</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Fechar
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                savedSuccess
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo!</span>
                </>
              ) : (
                <span>Salvar Configuração</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
