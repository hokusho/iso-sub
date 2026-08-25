import React, { useState, useEffect, useRef } from 'react';
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
  Edit3,
  Smartphone,
  Tv,
  Music2,
  Zap,
  Check
} from 'lucide-react';
import { SubtitleBlock, SubtitleStyle, VideoMetadata, RenderJobProgress } from '../../types';
import { apiEndpoint, resolveMediaUrl } from '../../utils/api';

interface ExportModalProps {
  isOpen: boolean;
  fileId: string;
  fileName?: string | null;
  metadata: VideoMetadata | null;
  blocks: SubtitleBlock[];
  style: SubtitleStyle;
  onClose: () => void;
}

type ExportDestination = 'instagram' | 'tiktok' | 'youtube' | 'prores' | 'subtitles';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  fileId,
  fileName,
  metadata,
  blocks,
  style,
  onClose
}) => {
  const [destination, setDestination] = useState<ExportDestination>('instagram');
  const [subFormat, setSubFormat] = useState<'ass' | 'srt' | 'vtt' | 'json'>('ass');
  const [customName, setCustomName] = useState<string>('video-legendado');
  const [optimize50MB, setOptimize50MB] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderJob, setRenderJob] = useState<RenderJobProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [explorerSuccess, setExplorerSuccess] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const closeEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, []);

  // Auto-detect best platform preset based on video proportions
  useEffect(() => {
    if (metadata?.width && metadata?.height) {
      if (metadata.width > metadata.height) {
        setDestination('youtube');
      } else {
        setDestination('instagram');
      }
    }
  }, [metadata, isOpen]);

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

  const isHorizontal = metadata?.width && metadata?.height ? metadata.width > metadata.height : false;
  const isVideoExport = destination === 'instagram' || destination === 'tiktok' || destination === 'youtube';

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

      if (isVideoExport) {
        const res = await fetch(apiEndpoint('/api/render/mp4'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId,
            blocks,
            style,
            customFileName: `${baseName}.mp4`,
            presetPlatform: destination,
            optimize50MB
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Falha ao iniciar renderização MP4');
        }

        const data = await res.json();
        listenToProgress(data.jobId);
      } else if (destination === 'prores') {
        const res = await fetch(apiEndpoint('/api/render/prores'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks,
            style,
            duration: metadata?.duration || 10,
            width: metadata?.width || (isHorizontal ? 1920 : 1080),
            height: metadata?.height || (isHorizontal ? 1080 : 1920),
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
      } else if (destination === 'subtitles') {
        // Direct download subtitle file
        const res = await fetch(apiEndpoint('/api/export/subtitles'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks,
            style,
            format: subFormat,
            width: metadata?.width || (isHorizontal ? 1920 : 1080),
            height: metadata?.height || (isHorizontal ? 1080 : 1920)
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

  const handleClose = () => {
    closeEventSource();
    setIsRendering(false);
    onClose();
  };

  const listenToProgress = (jobId: string) => {
    closeEventSource();
    const eventSource = new EventSource(apiEndpoint(`/api/progress/${jobId}`));
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      try {
        const data: RenderJobProgress = JSON.parse(e.data);
        setRenderJob(data);

        if (data.status === 'completed') {
          setIsRendering(false);
          closeEventSource();
        } else if (data.status === 'error') {
          setIsRendering(false);
          setErrorMsg(data.error || 'Erro na renderização');
          closeEventSource();
        }
      } catch (err) {
        console.error(err);
      }
    };

    eventSource.onerror = () => {
      setIsRendering(false);
      closeEventSource();
    };
  };

  const handleOpenExplorer = async () => {
    try {
      const res = await fetch(apiEndpoint('/api/open-folder'), {
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
    if (isVideoExport) return '.mp4';
    if (destination === 'prores') return '.mov';
    return `.${subFormat}`;
  };

  const getFormatBadge = () => {
    if (!metadata?.width || !metadata?.height) return 'Formato Nativo';
    const { width, height } = metadata;
    const ratio = width / height;

    if (Math.abs(ratio - 16 / 9) < 0.15 || ratio > 1.35) return '16:9 Horizontal';
    if (Math.abs(ratio - 9 / 16) < 0.15 || ratio < 0.75) return '9:16 Vertical';
    if (Math.abs(ratio - 1) < 0.12) return '1:1 Quadrado';
    if (Math.abs(ratio - 4 / 5) < 0.12) return '4:5 Retrato';
    return `${width}x${height} Nativo`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn select-none">
      <div className="bg-white border-2 border-neutral-900 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-base">Exportar Vídeo & Legendas</h3>
              <p className="text-xs text-neutral-500 font-medium">
                Renderização na resolução nativa ({metadata?.width || 1920}x{metadata?.height || 1080}) adaptada para redes sociais
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-4 mt-4 overflow-y-auto pr-1">
          {/* Completed State Display */}
          {renderJob?.status === 'completed' ? (
            <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 border-2 border-neutral-200 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-lg ring-4 ring-emerald-100">
                <CheckCircle className="w-9 h-9" />
              </div>
              <h4 className="font-black text-neutral-900 text-lg">Exportação Concluída com Sucesso!</h4>
              <p className="text-xs text-neutral-600 font-mono mt-1 mb-5 max-w-md break-all bg-white p-2.5 rounded-xl border border-neutral-200 shadow-xs">
                Arquivo salvo: <strong className="text-neutral-950">{renderJob.outputFileName}</strong>
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenExplorer}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{explorerSuccess ? 'Pasta Aberta!' : 'Abrir Pasta no Windows'}</span>
                </button>

                <a
                  href={resolveMediaUrl(`/storage/renders/${renderJob.outputFileName}`)}
                  download={renderJob.outputFileName}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold border-2 border-neutral-300 transition active:scale-95 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* 1. SELETOR VISUAL DE DESTINO / PLATAFORMA */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-900 uppercase tracking-wide">
                    Destino & Plataforma de Exportação:
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-neutral-900 text-white px-2.5 py-0.5 rounded-md shadow-xs">
                    {getFormatBadge()} • {metadata?.width || 1920}x{metadata?.height || 1080}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Instagram Card */}
                  <div
                    onClick={() => setDestination('instagram')}
                    className={`flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition relative ${
                      destination === 'instagram'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Smartphone className={`w-4 h-4 ${destination === 'instagram' ? 'text-pink-400' : 'text-pink-600'}`} />
                      {destination === 'instagram' && (
                        <span className="w-2 h-2 rounded-full bg-pink-400 ring-2 ring-white/20" />
                      )}
                    </div>
                    <span className="text-xs font-black">Instagram (Feed & Reels)</span>
                    <span className={`text-[10px] mt-0.5 ${destination === 'instagram' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {getFormatBadge()} • Cores Rec.709
                    </span>
                  </div>

                  {/* TikTok Card */}
                  <div
                    onClick={() => setDestination('tiktok')}
                    className={`flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition relative ${
                      destination === 'tiktok'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Music2 className={`w-4 h-4 ${destination === 'tiktok' ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      {destination === 'tiktok' && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-white/20" />
                      )}
                    </div>
                    <span className="text-xs font-black">TikTok</span>
                    <span className={`text-[10px] mt-0.5 ${destination === 'tiktok' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {getFormatBadge()} • Nitidez Mobile
                    </span>
                  </div>

                  {/* YouTube Card */}
                  <div
                    onClick={() => setDestination('youtube')}
                    className={`flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition relative ${
                      destination === 'youtube'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Tv className={`w-4 h-4 ${destination === 'youtube' ? 'text-red-400' : 'text-red-600'}`} />
                      {destination === 'youtube' && (
                        <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-white/20" />
                      )}
                    </div>
                    <span className="text-xs font-black">YouTube</span>
                    <span className={`text-[10px] mt-0.5 ${destination === 'youtube' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {getFormatBadge()} • Alto Bitrate
                    </span>
                  </div>

                  {/* ProRes 4444 Alpha Card */}
                  <div
                    onClick={() => setDestination('prores')}
                    className={`flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition relative ${
                      destination === 'prores'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Layers className={`w-4 h-4 ${destination === 'prores' ? 'text-amber-400' : 'text-amber-600'}`} />
                      {destination === 'prores' && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white/20" />
                      )}
                    </div>
                    <span className="text-xs font-black">ProRes 4444 Alpha</span>
                    <span className={`text-[10px] mt-0.5 ${destination === 'prores' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      Fundo Transparente ({metadata?.width || 1920}x{metadata?.height || 1080})
                    </span>
                  </div>

                  {/* Subtitles File Card */}
                  <div
                    onClick={() => setDestination('subtitles')}
                    className={`flex flex-col p-3 rounded-2xl border-2 cursor-pointer transition relative ${
                      destination === 'subtitles'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900/10'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <FileText className={`w-4 h-4 ${destination === 'subtitles' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      {destination === 'subtitles' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/20" />
                      )}
                    </div>
                    <span className="text-xs font-black">Arquivo de Legenda</span>
                    <span className={`text-[10px] mt-0.5 ${destination === 'subtitles' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      .ASS / .SRT / .VTT / .JSON
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. OPCIONAL: COMPACTAÇÃO < 50MB (Para Instagram/TikTok) */}
              {(destination === 'instagram' || destination === 'tiktok') && (
                <div
                  onClick={() => setOptimize50MB(!optimize50MB)}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition select-none ${
                    optimize50MB
                      ? 'bg-amber-50/80 border-amber-400 text-neutral-900 shadow-xs'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${optimize50MB ? 'bg-amber-500 text-white shadow-xs' : 'bg-neutral-200 text-neutral-600'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-neutral-900">
                        Otimizar para menos de 50 MB
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Ajusta a taxa de bits para o arquivo não sofrer recompressão agressiva do Instagram/TikTok.
                      </span>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition ${
                    optimize50MB
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-neutral-300 bg-white'
                  }`}>
                    {optimize50MB && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              )}

              {/* 3. INPUT DE NOME DO ARQUIVO */}
              <div className="flex flex-col gap-1.5 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-neutral-700" />
                  <span>Nome do Arquivo Final:</span>
                </label>
                <div className="flex items-center bg-white border border-neutral-300 rounded-xl px-3.5 py-2 focus-within:border-neutral-900 transition shadow-sm">
                  <FileVideo className="w-4 h-4 text-neutral-500 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Digite o nome do arquivo..."
                    className="flex-1 bg-transparent text-xs font-mono font-bold text-neutral-900 focus:outline-none tracking-wide"
                  />
                  <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200 shrink-0">
                    {getFileExtension()}
                  </span>
                </div>
              </div>

              {/* 4. Subtitle Format selector if subtitles chosen */}
              {destination === 'subtitles' && (
                <div className="flex items-center gap-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-neutral-700">Formato da Legenda:</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {(['ass', 'srt', 'vtt', 'json'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setSubFormat(fmt)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg uppercase font-mono transition cursor-pointer ${
                          subFormat === fmt
                            ? 'bg-neutral-900 text-white shadow-sm'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical summary info */}
              <div className="bg-neutral-100 rounded-2xl p-3 border border-neutral-200 flex items-center justify-between text-xs text-neutral-700 font-mono">
                <span>Preset: <strong className="text-neutral-900">{style.presetName}</strong></span>
                <span>Proporção: <strong className="text-neutral-900">{getFormatBadge()}</strong></span>
                <span>Resolução: <strong className="text-neutral-900">{metadata?.width || (isHorizontal ? 1920 : 1080)}x{metadata?.height || (isHorizontal ? 1080 : 1920)}</strong></span>
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
                <div className="flex flex-col gap-2 p-4 bg-neutral-50 border border-neutral-300 rounded-2xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                      Renderizando via FFmpeg ({destination.toUpperCase()})...
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">
                      {renderJob.progressPercent}%
                    </span>
                  </div>

                  <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: `${renderJob.progressPercent}%` }}
                      className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                    />
                  </div>

                  {renderJob.fps && (
                    <span className="text-[11px] text-neutral-500 font-mono self-end font-medium">
                      Velocidade: {renderJob.fps} FPS
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-neutral-200">
                <button
                  onClick={handleClose}
                  disabled={isRendering}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleStartRender}
                  disabled={isRendering || blocks.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold shadow-sm transition transform active:scale-95 cursor-pointer"
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
                        {destination === 'subtitles'
                          ? 'Baixar Legenda'
                          : `Exportar para ${destination === 'instagram' ? 'Instagram' : (destination === 'tiktok' ? 'TikTok' : (destination === 'youtube' ? 'YouTube' : 'ProRes 4444'))}`}
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
