import React, { useState } from 'react';
import { X, Sparkles, Download, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { AppUpdateInfo, applyAppUpdate } from '../../services/updateService';

interface UpdateModalProps {
  isOpen: boolean;
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, updateInfo, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleApply = async () => {
    if (!updateInfo.bundleUrl) {
      // Se não houver bundleUrl configurado, apenas recarrega
      window.location.reload();
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const res = await applyAppUpdate(updateInfo.bundleUrl);
      if (res.success) {
        localStorage.setItem('isosub_installed_version', updateInfo.latestVersion);
        setUpdateSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setUpdateError(res.message || 'Não foi possível aplicar a atualização automaticamente.');
        setIsUpdating(false);
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Erro de conexão ao baixar a atualização.');
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border-2 border-neutral-300 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative">
        
        {/* Close Button (If not mandatory) */}
        {!updateInfo.mandatory && (
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-neutral-900 text-base">Nova Versão Disponível!</h3>
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                v{updateInfo.latestVersion}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-bold mt-0.5">
              Versão atual: <span className="font-mono text-neutral-800">v{updateInfo.currentVersion}</span>
            </p>
          </div>
        </div>

        {/* Release Notes */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block">
            Novidades & Melhorias:
          </span>
          <p className="text-xs text-neutral-800 font-medium leading-relaxed whitespace-pre-line">
            {updateInfo.releaseNotes || 'Novas melhorias e correções de desempenho incluídas nesta versão.'}
          </p>
        </div>

        {/* Error Message */}
        {updateError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{updateError}</span>
          </div>
        )}

        {/* Success Message */}
        {updateSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-black animate-pulse">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
            <span>Atualização aplicada! Reiniciando o aplicativo...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
          {!updateInfo.mandatory && (
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
            >
              Lembrar mais tarde
            </button>
          )}

          <button
            onClick={handleApply}
            disabled={isUpdating || updateSuccess}
            className={`w-full ${!updateInfo.mandatory ? 'w-auto' : ''} flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition active:scale-95 shadow-sm ${
              updateSuccess
                ? 'bg-emerald-600 text-white'
                : isUpdating
                ? 'bg-neutral-800 text-white cursor-wait'
                : 'bg-neutral-950 hover:bg-black text-white'
            }`}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Atualizando em 1 Clique...</span>
              </>
            ) : updateSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pronto!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Atualizar Agora</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
