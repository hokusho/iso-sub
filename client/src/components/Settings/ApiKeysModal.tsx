import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, ExternalLink, Download, Key, Info, Trash2, Lock } from 'lucide-react';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [groqKey, setGroqKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState<boolean>(() => Boolean(localStorage.getItem('GROQ_API_KEY')));

  useEffect(() => {
    const stored = localStorage.getItem('GROQ_API_KEY') || '';
    setGroqKey(stored);
    setHasStoredKey(Boolean(stored));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = groqKey.trim();
    if (!trimmed) {
      alert('Por favor, cole a sua chave da Groq (começa com gsk_...) antes de salvar.');
      return;
    }
    localStorage.setItem('GROQ_API_KEY', trimmed);
    setHasStoredKey(true);
    setSavedSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleRemoveKey = () => {
    if (!hasStoredKey && !groqKey) return;
    
    if (window.confirm('Tem certeza que deseja remover a chave de IA deste computador? O aplicativo será bloqueado até que uma nova chave seja inserida.')) {
      localStorage.removeItem('GROQ_API_KEY');
      setGroqKey('');
      setHasStoredKey(false);
      setRemoveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setRemoveSuccess(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const keyToSave = groqKey.trim() || localStorage.getItem('GROQ_API_KEY') || '';
    if (!keyToSave) {
      alert('Insira a sua chave no campo acima para gerar o arquivo de backup em .txt.');
      return;
    }

    const content = `=====================================================
ISO SUB — BACKUP DA SUA CHAVE DE IA (GROQ CLOUD)
=====================================================

Sua Chave de API Groq:
${keyToSave}

Data do Backup: ${new Date().toLocaleString('pt-BR')}

INSTRUÇÕES E DICAS:
1. Guarde este arquivo em um local seguro (pen drive, nuvem ou pasta pessoal).
2. Se você trocar de computador ou formatar a máquina, basta copiar esta chave e colar nas configurações do ISO SUB.
3. Sua chave é 100% gratuita e oficial via console.groq.com.
4. Ela transcreve vídeos palavra por palavra em menos de 2 segundos.

Equipe ISO SUB
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `minha_chave_groq_isosub.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const isMandatory = !hasStoredKey;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => {
        // Only allow closing on backdrop click if NOT mandatory lock
        if (!isMandatory && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white border-2 border-neutral-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              isMandatory ? 'bg-amber-500 text-white' : 'bg-neutral-950 text-white'
            }`}>
              {isMandatory ? <Lock className="w-5 h-5" /> : <Key className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-neutral-900 text-base">Chave de IA (Groq Whisper)</h3>
                {isMandatory && (
                  <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    Obrigatório
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-bold">Configuração Necessária para Usar o App</p>
            </div>
          </div>

          {/* Only show Close 'X' if NOT mandatory */}
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Why is this needed? (Explanation Box) */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Por que é obrigatório configurar a chave antes de usar?</span>
          </div>
          <p className="text-[11.5px] text-amber-950 font-medium leading-relaxed">
            O <strong>ISO SUB</strong> utiliza a inteligência artificial do modelo <strong>Whisper Large v3</strong> para ouvir seu vídeo e gerar as legendas palavra por palavra em segundos. Sem essa chave, o motor de transcrição não consegue funcionar.
          </p>
        </div>

        {/* Informative & Input Card */}
        <div className="bg-neutral-50 border border-neutral-300 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                100% GRATUITO
              </span>
              <span className="text-xs font-black text-neutral-800">Groq Cloud Oficial</span>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-bold transition active:scale-95 shadow-xs"
            >
              <span>Gerar Chave Grátis</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-800 block">
                Cole sua Chave da Groq abaixo:
              </label>
              {hasStoredKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  title="Remover chave deste computador"
                  className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-bold hover:underline transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{removeSuccess ? 'Chave Removida!' : 'Remover Chave'}</span>
                </button>
              )}
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              autoFocus={isMandatory}
              className="w-full bg-white border-2 border-neutral-300 focus:border-neutral-950 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-mono focus:outline-none font-bold shadow-inner"
            />
          </div>

          {/* Download TXT Backup Option */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-neutral-500 font-semibold">
              Não perca sua chave:
            </p>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 ${
                downloadSuccess
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-black shadow-xs'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Arquivo .TXT Baixado!' : 'Salvar Chave em .txt'}</span>
            </button>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="bg-neutral-100/80 border border-neutral-200 rounded-2xl p-3">
          <p className="text-[10.5px] font-black uppercase tracking-wider text-neutral-600 mb-1.5">
            Como criar sua chave em 3 passos rápidos:
          </p>
          <ol className="text-xs text-neutral-700 font-medium space-y-1 list-decimal list-inside">
            <li>Acesse <strong className="font-bold">console.groq.com/keys</strong> com sua conta Google.</li>
            <li>Clique no botão <strong className="font-bold">Create API Key</strong> e dê um nome.</li>
            <li>Copie a chave (<code className="bg-neutral-200 px-1 py-0.5 rounded text-[11px] font-mono">gsk_...</code>), cole acima e clique em Salvar.</li>
          </ol>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Salva apenas no seu computador local</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Only show Close button if NOT mandatory lock */}
            {!isMandatory && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
              >
                Fechar
              </button>
            )}

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition shadow-xs active:scale-95 ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : isMandatory
                  ? 'bg-neutral-950 hover:bg-black text-white px-6 ring-2 ring-neutral-950/20'
                  : 'bg-neutral-950 hover:bg-black text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Chave Salva!</span>
                </>
              ) : (
                <span>Salvar Chave & Começar</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
