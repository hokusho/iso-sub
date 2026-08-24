import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Key,
  FolderOpen,
  Search,
  LayoutGrid,
  FileVideo,
  Trash2,
  HardDrive,
  Check,
  Loader2,
  ShieldCheck
} from 'lucide-react';

export interface CacheInfo {
  tempBytes: number;
  tempCount: number;
  uploadBytes: number;
  uploadCount: number;
  totalBytes: number;
  totalFormatted: string;
}

interface NavbarProps {
  fileName: string | null;
  fileId?: string | null;
  isTranscribing: boolean;
  statusBadge?: { label: string; type: 'idle' | 'loading' | 'success' };
  cacheInfo: CacheInfo | null;
  isClearingCache: boolean;
  onUploadClick: () => void;
  onImportSubtitlesClick?: () => void;
  onTranscribeClick: () => void;
  onOpenSearchReplace: () => void;
  onOpenApiKeys: () => void;
  onOpenExplorer: () => void;
  onOpenExport: () => void;
  onClearCache: () => void;
  currentLicense?: any;
  onOpenLicense?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  fileName,
  fileId,
  isTranscribing,
  statusBadge = { label: 'Pronto', type: 'idle' },
  cacheInfo,
  isClearingCache,
  onUploadClick,
  onImportSubtitlesClick,
  onTranscribeClick,
  onOpenSearchReplace,
  onOpenApiKeys,
  onOpenExplorer,
  onOpenExport,
  onClearCache,
  currentLicense,
  onOpenLicense
}) => {
  const [isCacheMenuOpen, setIsCacheMenuOpen] = useState(false);
  const cacheRef = useRef<HTMLDivElement | null>(null);

  // Close cache popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cacheRef.current && !cacheRef.current.contains(e.target as Node)) {
        setIsCacheMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalFormatted = cacheInfo?.totalFormatted || '0 B';
  const hasCacheToClear = Boolean(cacheInfo && cacheInfo.totalBytes > 0);

  return (
    <header className="h-18 border-b-2 border-neutral-300 bg-white flex items-center justify-between px-6 select-none z-30 shrink-0 shadow-sm py-2.5">
      {/* Brand Title: ISO (Mais grossa e em vermelho) + SUB (Mais fino) */}
      <div className="flex items-center gap-3.5">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl tracking-tight leading-none">
              <span className="font-black text-[#B91C1C]">ISO</span>{' '}
              <span className="font-semibold text-neutral-600">SUB</span>
            </h1>

            {/* Live Visual Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
              statusBadge.type === 'loading'
                ? 'bg-amber-50 border-amber-200 text-amber-900 animate-pulse'
                : statusBadge.type === 'success'
                ? 'bg-neutral-200 border-neutral-300 text-neutral-900'
                : 'bg-neutral-100 border-neutral-300 text-neutral-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                statusBadge.type === 'loading' ? 'bg-amber-500' : statusBadge.type === 'success' ? 'bg-emerald-600' : 'bg-neutral-400'
              }`} />
              <span>{statusBadge.label}</span>
            </div>
          </div>
          {fileName && (
            <div className="flex items-center gap-1 text-xs text-neutral-600 font-mono font-medium truncate max-w-sm mt-1">
              <FileVideo className="w-4 h-4 text-neutral-500" />
              <span className="truncate">{fileName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Buttons & Cache Tools */}
      <div className="flex items-center gap-2.5">
        {/* Cache & Temp Files Disk Space Indicator / Cleanup Menu */}
        <div className="relative" ref={cacheRef}>
          <button
            type="button"
            onClick={() => setIsCacheMenuOpen(!isCacheMenuOpen)}
            title="Tamanho do Cache e Limpeza de Disco"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-mono font-black transition active:scale-95 shadow-sm"
          >
            <HardDrive className="w-3.5 h-3.5 text-neutral-700" />
            <span>Cache: {totalFormatted}</span>
          </button>

          {isCacheMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-neutral-900 rounded-2xl p-3.5 shadow-2xl z-50 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-black uppercase text-neutral-900">Limpeza de Disco</span>
                </div>
                <span className="text-xs font-mono font-black bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
                  {totalFormatted}
                </span>
              </div>

              {/* Cache Breakdown */}
              <div className="flex flex-col gap-1.5 text-xs text-neutral-700 font-medium">
                <div className="flex items-center justify-between bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <span>🎧 Áudios & Legendas Temp (.wav/.ass):</span>
                  <span className="font-mono font-bold text-neutral-900">{cacheInfo?.tempCount || 0} arq</span>
                </div>

                <div className="flex items-center justify-between bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <span>📁 Uploads Antigos em Cache:</span>
                  <span className="font-mono font-bold text-neutral-900">{cacheInfo?.uploadCount || 0} arq</span>
                </div>
              </div>

              {/* Safety Guarantee Info */}
              <div className="flex items-start gap-1.5 bg-emerald-50 text-emerald-950 p-2.5 rounded-xl border border-emerald-200 text-[11px] font-medium leading-tight">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Apenas arquivos desnecessários:</strong> O vídeo aberto no editor e seus vídeos exportados <strong>permanecem 100% seguros</strong>.
                </span>
              </div>

              {/* Clear Cache Action Button */}
              <button
                type="button"
                onClick={() => {
                  onClearCache();
                  setIsCacheMenuOpen(false);
                }}
                disabled={!hasCacheToClear || isClearingCache}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95"
              >
                {isClearingCache ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Limpando Disco...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Liberar {totalFormatted} em Disco</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-neutral-300 mx-0.5" />

        {/* Upload / Change Video Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition active:scale-95 shadow-sm"
          title="Carregar Novo Vídeo"
        >
          <Upload className="w-4 h-4 text-neutral-800" />
          <span>{fileName ? 'Trocar Vídeo' : 'Carregar Vídeo'}</span>
        </button>

        {/* Import Subtitle (.SRT / .ASS) */}
        {onImportSubtitlesClick && (
          <button
            onClick={onImportSubtitlesClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-xs font-bold transition active:scale-95 shadow-sm"
            title="Importar Arquivo de Legenda (.SRT / .ASS / .VTT)"
          >
            <span>Importar .SRT</span>
          </button>
        )}

        <div className="h-7 w-px bg-neutral-300 mx-0.5" />

        {/* Quick Tool: Search & Replace */}
        <button
          onClick={onOpenSearchReplace}
          title="Localizar e Substituir Palavras"
          className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition active:scale-95"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Tool: API Keys Settings */}
        <button
          onClick={onOpenApiKeys}
          title="Configurar Chave Gratuita da Groq (Whisper)"
          className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition active:scale-95"
        >
          <Key className="w-4 h-4" />
        </button>

        {/* Quick Tool: License / Serial Management */}
        {onOpenLicense && (
          <button
            onClick={onOpenLicense}
            title={currentLicense ? `Licença Ativa: ${currentLicense.customerName}` : "Inserir Serial de Ativação"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 border shadow-sm ${
              currentLicense
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${currentLicense ? 'text-emerald-600' : 'text-amber-600'} stroke-[2.5]`} />
            <span className="font-mono text-[11px] font-black">
              {currentLicense?.isLifetime ? 'Vitalício' : currentLicense ? `${currentLicense.daysRemaining}d` : 'Serial'}
            </span>
          </button>
        )}

        {/* Quick Tool: Open Render Folder in Explorer */}
        <button
          onClick={onOpenExplorer}
          title="Abrir Pasta de Exportação no Windows Explorer"
          className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition active:scale-95"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Big Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-black shadow-sm transition transform active:scale-95 ml-1"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Exportar Vídeo</span>
        </button>
      </div>
    </header>
  );
};
