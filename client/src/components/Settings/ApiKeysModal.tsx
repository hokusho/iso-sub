import React, { useState, useEffect } from 'react';
import { Key, X, Check, Zap, ShieldCheck, ExternalLink } from 'lucide-react';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [groqKey, setGroqKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setGroqKey(localStorage.getItem('GROQ_API_KEY') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('GROQ_API_KEY', groqKey.trim());
    setSavedSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white border-2 border-neutral-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-pop">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-neutral-900 text-base">Inteligência Artificial (Whisper)</h3>
              <p className="text-xs text-neutral-500 font-bold">Transcrição e Sincronização Ultra-Rápida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="mt-4 bg-neutral-50 border border-neutral-300 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                100% GRATUITO
              </span>
              <span className="text-xs font-black text-neutral-900">Groq Cloud Whisper</span>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-bold transition active:scale-95 shadow-sm"
            >
              <span>Gerar Chave Grátis</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-neutral-600 font-medium leading-relaxed">
            A Groq oferece uma cota gratuita generosa de <strong>2 horas de áudio por hora</strong> (mais de 150 vídeos curtos por dia), sem pedir cartão de crédito.
          </p>

          <div className="mt-1">
            <label className="text-xs font-bold text-neutral-800 block mb-1.5">
              Cole sua Chave da Groq abaixo:
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-white border-2 border-neutral-300 focus:border-neutral-950 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-mono focus:outline-none font-bold shadow-inner"
            />
          </div>
        </div>

        {/* Quick 3-Step Guide */}
        <div className="mt-4 bg-neutral-100/70 border border-neutral-200 rounded-2xl p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-neutral-500 mb-2">Como obter em 30 segundos:</p>
          <ol className="text-xs text-neutral-700 font-medium space-y-1 list-decimal list-inside">
            <li>Acesse <strong className="font-bold">console.groq.com</strong> com sua conta Google.</li>
            <li>No menu lateral, clique em <strong className="font-bold">API Keys</strong> &gt; <strong className="font-bold">Create API Key</strong>.</li>
            <li>Copie a chave (começa com <code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px] font-mono">gsk_</code>) e cole acima.</li>
          </ol>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-200">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Salva apenas no seu computador local</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
            >
              Fechar
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition shadow-sm ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-950 hover:bg-black text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <span>Salvar Chave</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
