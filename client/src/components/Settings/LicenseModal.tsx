import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Copy, X, User, RefreshCw } from 'lucide-react';
import { ClientLicenseInfo, validateLicenseOnline, deactivateLicenseOnline } from '../../services/licenseClient';

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
  const [nameInput, setNameInput] = useState(currentLicense?.customerName || '');
  const [serialInput, setSerialInput] = useState(currentLicense?.serial || '');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(!currentLicense);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!currentLicense) {
      setIsEditingKey(true);
      if (isMandatoryLock) {
        setErrorMsg('Esta licença está bloqueada ou inativa. Insira uma nova chave.');
      }
    } else {
      setIsEditingKey(false);
      setNameInput(currentLicense.customerName);
      setSerialInput(currentLicense.serial);
      setErrorMsg(null);
    }
  }, [currentLicense, isMandatoryLock]);

  const effectiveLock = isMandatoryLock || !currentLicense;

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setErrorMsg('Por favor, informe o seu nome de usuário cadastrado.');
      return;
    }
    if (!serialInput.trim()) {
      setErrorMsg('Por favor, insira a sua chave de serial.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await validateLicenseOnline(nameInput.trim(), serialInput.trim());

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
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Nome ou Serial inválido.');
        setCooldown(3);
      }
    } catch {
      setErrorMsg('Erro de conexão ao verificar serial com o Supabase. Tente novamente.');
      setCooldown(3);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (confirm('Tem certeza que deseja desativar e desvincular a licença deste computador? O aplicativo será bloqueado imediatamente.')) {
      setIsLoading(true);
      if (currentLicense?.serial) {
        await deactivateLicenseOnline(currentLicense.serial);
      }
      onLicenseUpdated(null);
      setIsEditingKey(true);
      setNameInput('');
      setSerialInput('');
      setSuccessMsg('Licença desvinculada. Insira um novo serial para desbloquear o app.');
      setIsLoading(false);
    }
  };

  const expDateFormatted = currentLicense?.expiresAt
    ? new Date(currentLicense.expiresAt).toLocaleDateString('pt-BR')
    : 'Vitalício (Sem Expiração)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-white border-2 border-neutral-300 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-sm">
              <KeyRound className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-neutral-900 text-base flex items-center gap-2">
                Ativação do ISO SUB
                {currentLicense && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-black">
                    Ativo
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-500 font-bold">
                {isMandatoryLock ? 'Insira seu Usuário e Serial para liberar o uso' : 'Gerenciamento da sua licença ativa'}
              </p>
            </div>
          </div>

          {!effectiveLock && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* MODO 1: LICENÇA JÁ ATIVA */}
        {currentLicense && !isEditingKey ? (
          <div className="space-y-4">
            
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-300 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-xs font-bold text-neutral-600">Usuário / Titular</span>
                <span className="text-xs font-black text-neutral-950">{currentLicense.customerName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-xs font-bold text-neutral-600">Validade</span>
                <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {currentLicense.isLifetime ? '⭐ Vitalício' : `${expDateFormatted} (${currentLicense.daysRemaining} dias)`}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500">Chave de Serial</span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-300">
                  <span className="font-mono text-xs text-neutral-900 font-black tracking-wider">
                    {currentLicense.serial}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(currentLicense.serial)}
                    className="text-neutral-500 hover:text-neutral-900 p-1"
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
                className="text-xs font-bold text-rose-600 hover:text-rose-700 py-2 px-3 rounded-xl hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
              >
                Desativar neste PC
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-neutral-950 hover:bg-black text-white font-black text-xs px-6 py-2.5 rounded-xl transition active:scale-95 shadow-sm"
              >
                Concluir
              </button>
            </div>

          </div>
        ) : (
          /* MODO 2: FORMULÁRIO DE INSERÇÃO DE NOME + SERIAL */
          <form onSubmit={handleActivate} className="space-y-4">
            
            {/* Input Nome de Usuário */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-600" />
                <span>Nome de Usuário / Titular *</span>
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ex: hokusho"
                className="w-full bg-neutral-100 border border-neutral-300 focus:border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none transition"
              />
              <p className="text-[10px] text-neutral-500 font-medium">
                Nome exatamente como cadastrado pelo administrador.
              </p>
            </div>

            {/* Input Chave de Serial */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-neutral-800 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neutral-600" />
                <span>Chave de Serial *</span>
              </label>
              <input
                type="text"
                required
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                placeholder="ISOSUB-XXXX-XXXX-XXXX"
                className="w-full bg-neutral-100 border border-neutral-300 focus:border-neutral-900 rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-neutral-900 placeholder-neutral-400 focus:outline-none transition tracking-wider uppercase"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-bold">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="font-bold">{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="w-full py-3 rounded-2xl bg-neutral-950 hover:bg-black text-white text-xs font-black transition active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>VERIFICANDO NO SUPABASE...</span>
                </>
              ) : cooldown > 0 ? (
                <span className="text-amber-300 font-mono font-bold">AGUARDE {cooldown}S...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>ATIVAR APLICATIVO AGORA</span>
                </>
              )}
            </button>

            {currentLicense && (
              <button
                type="button"
                onClick={() => setIsEditingKey(false)}
                className="w-full py-1 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition"
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
