import React, { useState, useEffect } from 'react';
import {
  Download,
  FolderOpen,
  Film,
  Layers,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  FileVideo,
  Edit3
} from 'lucide-react';
import { SubtitleBlock, SubtitleStyle, VideoMetadata, RenderJobProgress } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  fileId: string;
  fileName?: string | null;
  metadata: VideoMetadata | null;
  blocks: SubtitleBlock[];
  style: SubtitleStyle;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  fileId,
  fileName,
  metadata,
  blocks,
  style,
  onClose
}) => {
  const [exportType, setExportType] = useState<'mp4' | 'prores' | 'subtitles'>('mp4');
  const [subFormat, setSubFormat] = useState<'ass' | 'srt' | 'vtt' | 'json'>('ass');
  const [customName, setCustomName] = useState<string>('video-legendado');
  const [isRendering, setIsRendering] = useState(false);
  const [renderJob, setRenderJob] = useState<RenderJobProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [explorerSuccess, setExplorerSuccess] = useState(false);

  // Initialize or reset custom filename based on original video name
  useEffect(() => {
    if (fileName) {
      const base = fileName.replace(/\.[^/.]+$/, '').trim();
      setCustomName(`${base}-legendado`);
    } else {
      setCustomName('video-legendado');
    }
  }, [fileName, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsRendering(false);
      setRenderJob(null);
      setErrorMsg(null);
      setExplorerSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCleanBaseName = () => {
    const clean = customName.trim().replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    return clean.length > 0 ? clean : 'video-legendado';
  };

  const handleStartRender = async () => {
    try {
      setIsRendering(true);
      setErrorMsg(null);
      setExplorerSuccess(false);

      const baseName = getCleanBaseName();

      if (exportType === 'mp4') {
        const res = await fetch('/api/render/mp4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId,
            blocks,
            style,
            customFileName: `${baseName}.mp4`
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Falha ao iniciar renderização MP4');
        }

        const data = await res.json();
        listenToProgress(data.jobId);
      } else if (exportType === 'prores') {
        const res = await fetch('/api/render/prores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks,
            style,
            duration: metadata?.duration || 10,
            width: metadata?.width || 1080,
            height: metadata?.height || 1920,
            fps: metadata?.fps || 30,
            customFileName: `${baseName}.mov`
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Falha ao iniciar renderização ProRes 4444');
        }

        const data = await res.json();
        listenToProgress(data.jobId);
      } else if (exportType === 'subtitles') {
        // Direct download subtitle file
        const res = await fetch('/api/export/subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks,
            style,
            format: subFormat,
            width: metadata?.width || 1080,
            height: metadata?.height || 1920
          })
        });

        if (!res.ok) throw new Error('Falha ao exportar legenda');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.${subFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setIsRendering(false);
      }
    } catch (err: any) {
      setIsRendering(false);
      setErrorMsg(err.message);
    }
  };

  const listenToProgress = (jobId: string) => {
    const eventSource = new EventSource(`/api/progress/${jobId}`);

    eventSource.onmessage = (e) => {
      try {
        const data: RenderJobProgress = JSON.parse(e.data);
        setRenderJob(data);

        if (data.status === 'completed') {
          setIsRendering(false);
          eventSource.close();
        } else if (data.status === 'error') {
          setIsRendering(false);
          setErrorMsg(data.error || 'Erro na renderização');
          eventSource.close();
        }
      } catch (err) {
        console.error(err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  const handleOpenExplorer = async () => {
    try {
      const res = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: renderJob?.jobId,
          targetPath: renderJob?.outputFilePath
        })
      });
      if (res.ok) {
        setExplorerSuccess(true);
        setTimeout(() => setExplorerSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to open explorer:', err);
    }
  };

  const getFileExtension = () => {
    if (exportType === 'mp4') return '.mp4';
    if (exportType === 'prores') return '.mov';
    return `.${subFormat}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Exportar Vídeo & Legendas</h3>
              <p className="text-xs text-slate-500 font-medium">Qualidade máxima Full HD otimizada para Instagram, TikTok e YouTube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-4 mt-5">
          {/* Completed State Display */}
          {renderJob?.status === 'completed' ? (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center mb-3 shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">Exportação Concluída com Sucesso!</h4>
              <p className="text-xs text-slate-600 font-mono mt-1 mb-4 max-w-md break-all">
                Arquivo salvo como: <strong className="text-slate-900">{renderJob.outputFileName}</strong>
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenExplorer}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{explorerSuccess ? 'Pasta Aberta!' : 'Abrir Pasta no Windows'}</span>
                </button>

                <a
                  href={`/storage/renders/${renderJob.outputFileName}`}
                  download={renderJob.outputFileName}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold border border-slate-200 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* 1. INPUT DE NOME DO ARQUIVO */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-slate-700" />
                  <span>Nome do Arquivo Final:</span>
                </label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-slate-900 transition shadow-sm">
                  <FileVideo className="w-4 h-4 text-slate-500 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Digite o nome do arquivo..."
                    className="flex-1 bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none tracking-wide"
                  />
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 shrink-0">
                    {getFileExtension()}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Preenchido automaticamente com o nome do vídeo. Você pode editar como preferir.
                </span>
              </div>

              {/* 2. Format Selection Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* MP4 Card */}
                <div
                  onClick={() => setExportType('mp4')}
                  className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition ${
                    exportType === 'mp4'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <Film className={`w-5 h-5 mb-2 ${exportType === 'mp4' ? 'text-white' : 'text-slate-700'}`} />
                  <span className="text-xs font-bold">MP4 Vídeo</span>
                  <span className={`text-[11px] mt-0.5 ${exportType === 'mp4' ? 'text-slate-300' : 'text-slate-500'}`}>Burn-in completo Full HD</span>
                </div>

                {/* ProRes 4444 Alpha Card */}
                <div
                  onClick={() => setExportType('prores')}
                  className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition ${
                    exportType === 'prores'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <Layers className={`w-5 h-5 mb-2 ${exportType === 'prores' ? 'text-white' : 'text-slate-700'}`} />
                  <span className="text-xs font-bold">ProRes 4444</span>
                  <span className={`text-[11px] font-semibold mt-0.5 ${exportType === 'prores' ? 'text-slate-300' : 'text-slate-500'}`}>Alpha (Transparência)</span>
                </div>

                {/* Subtitles File Card */}
                <div
                  onClick={() => setExportType('subtitles')}
                  className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition ${
                    exportType === 'subtitles'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <FileText className={`w-5 h-5 mb-2 ${exportType === 'subtitles' ? 'text-white' : 'text-slate-700'}`} />
                  <span className="text-xs font-bold">Legenda Texto</span>
                  <span className={`text-[11px] mt-0.5 ${exportType === 'subtitles' ? 'text-slate-300' : 'text-slate-500'}`}>Arquivo .ASS / SRT / VTT</span>
                </div>
              </div>

              {/* Subtitle Format selector if subtitles chosen */}
              {exportType === 'subtitles' && (
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Formato da Legenda:</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {(['ass', 'srt', 'vtt', 'json'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSubFormat(fmt)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg uppercase font-mono transition ${
                          subFormat === fmt
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical summary info */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between text-xs text-slate-700 font-mono">
                <span>Preset: <strong className="text-slate-900">{style.presetName}</strong></span>
                <span>Blocos: <strong className="text-slate-900">{blocks.length}</strong></span>
                <span>Resolução: <strong className="text-slate-900">{metadata?.width || 1080}x{metadata?.height || 1920}</strong></span>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Live Progress Bar if rendering */}
              {isRendering && renderJob && (
                <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-300 rounded-2xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      Renderizando via FFmpeg...
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      {renderJob.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: `${renderJob.progressPercent}%` }}
                      className="h-full bg-slate-900 rounded-full transition-all duration-300"
                    />
                  </div>

                  {renderJob.fps && (
                    <span className="text-[11px] text-slate-500 font-mono self-end font-medium">
                      Velocidade: {renderJob.fps} FPS
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-slate-200">
                <button
                  onClick={onClose}
                  disabled={isRendering}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleStartRender}
                  disabled={isRendering || blocks.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold shadow-sm transition transform active:scale-95"
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {exportType === 'subtitles'
                          ? 'Baixar Legenda'
                          : `Iniciar Renderização (${exportType.toUpperCase()})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
