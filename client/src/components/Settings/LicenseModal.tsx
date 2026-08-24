import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Copy, Sparkles, ExternalLink, Laptop, RefreshCw } from 'lucide-react';
import { ClientLicenseInfo, validateSerialWithServer, clearSavedLicense } from '../../services/licenseClient';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatoryLock?: boolean;
  currentLicense: ClientLicenseInfo | null;
  onLicenseUpdated: (lic: ClientLicenseInfo | null) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  isMandatoryLock = false,
  currentLicense,
  onLicenseUpdated
}) => {
  const [serialInput, setSerialInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(!currentLicense);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) {
      setErrorMsg('Por favor, insira a sua chave de serial.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await validateSerialWithServer(serialInput.trim());

      if (res.valid && res.customerName) {
        const updatedLic: ClientLicenseInfo = {
          serial: serialInput.trim().toUpperCase(),
          customerName: res.customerName,
          expiresAt: res.expiresAt ?? null,
          isLifetime: res.isLifetime ?? false,
          daysRemaining: res.daysRemaining ?? 9999,
          lastValidatedAt: new Date().toISOString()
        };
        setSuccessMsg(`Licença ativada com sucesso! Bem-vindo(a), ${res.customerName}! 🎉`);
        onLicenseUpdated(updatedLic);
        setIsEditingKey(false);
        setTimeout(() => {
          if (isMandatoryLock) {
            onClose();
          }
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Serial inválido ou expirado.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao verificar serial. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = () => {
    if (confirm('Tem certeza que deseja desativar a licença deste computador?')) {
      clearSavedLicense();
      onLicenseUpdated(null);
      setIsEditingKey(true);
      setSerialInput('');
      setSuccessMsg('Licença desvinculada deste computador.');
    }
  };

  const expDateFormatted = currentLicense?.expiresAt
    ? new Date(currentLicense.expiresAt).toLocaleDateString('pt-BR')
    : 'Vitalício (Sem Expiração)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
        
        {/* Glow de Fundo */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <KeyRound className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-white tracking-wide flex items-center gap-2">
                Ativação & Licença
                {currentLicense && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Ativo
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {isMandatoryLock ? 'Insira seu Serial para desbloquear o ISO SUB' : 'Gerenciamento da sua licença'}
              </p>
            </div>
          </div>

          {!isMandatoryLock && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* MODO 1: LICENÇA JÁ ATIVA */}
        {currentLicense && !isEditingKey ? (
          <div className="space-y-4">
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-[11px] font-bold text-slate-400">Titular da Licença</span>
                <span className="text-xs font-black text-white">{currentLicense.customerName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-[11px] font-bold text-slate-400">Validade</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {currentLicense.isLifetime ? '⭐ Vitalício' : `${expDateFormatted} (${currentLicense.daysRemaining} dias)`}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Chave de Serial</span>
                <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="font-mono text-xs text-emerald-400 font-bold tracking-wider">
                    {currentLicense.serial}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(currentLicense.serial)}
                    className="text-slate-400 hover:text-white p-1"
                    title="Copiar Serial"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeactivate}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 py-2 px-3 rounded-xl hover:bg-rose-500/10 transition"
              >
                Desativar neste PC
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-black text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20"
              >
                Concluir
              </button>
            </div>

          </div>
        ) : (
          /* MODO 2: FORMULÁRIO DE INSERÇÃO DE SERIAL */
          <form onSubmit={handleActivate} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Chave de Serial (Licença) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                  placeholder="ISOSUB-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-mono font-bold text-emerald-400 placeholder-slate-600 focus:outline-none transition tracking-widest uppercase"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Digite ou cole o serial exatamente como você recebeu.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-display font-black text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>VERIFICANDO SERIAL...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>ATIVAR APLICATIVO AGORA</span>
                </>
              )}
            </button>

            {currentLicense && (
              <button
                type="button"
                onClick={() => setIsEditingKey(false)}
                className="w-full py-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Voltar aos dados da licença ativa
              </button>
            )}

          </form>
        )}

      </div>
    </div>
  );
};
