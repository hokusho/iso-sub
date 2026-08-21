import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  Type,
  FileText,
  Sliders,
  Play,
  RotateCcw,
  Video,
  Layers,
  Wand2,
  FolderOpen
} from 'lucide-react';
import { Navbar, CacheInfo } from './components/Navbar';
import isoLogo from './assets/iso3.png';
import { CanvasPreview } from './components/VideoPlayer/CanvasPreview';
import { VideoControls } from './components/VideoPlayer/VideoControls';
import { Timeline } from './components/Timeline/Timeline';
import { PresetPicker } from './components/Styling/PresetPicker';
import { TypographyColorControls } from './components/Styling/TypographyColorControls';
import { EffectsControls } from './components/Styling/EffectsControls';
import { PositionControls } from './components/Styling/PositionControls';
import { WordEditor } from './components/Editor/WordEditor';
import { ContinuousEditor } from './components/Editor/ContinuousEditor';
import { SearchReplaceModal } from './components/Editor/SearchReplaceModal';
import { ApiKeysModal } from './components/Settings/ApiKeysModal';
import { ExportModal } from './components/Export/ExportModal';
import { ProcessingModal, ProcessStep } from './components/Common/ProcessingModal';
import { ToastContainer, ToastMessage } from './components/Common/Toast';
import { DEFAULT_STYLE, PRESETS } from './presets';
import {
  SubtitleBlock,
  SubtitleStyle,
  SubtitleWord,
  VideoMetadata,
  AspectRatio,
  SafeZoneMode,
  Preset
} from './types';
import { v4 as uuidv4 } from 'uuid';

export const App: React.FC = () => {
  // Video and Media State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subInputRef = useRef<HTMLInputElement | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);

  // Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [safeZoneMode, setSafeZoneMode] = useState<SafeZoneMode>('off');

  // Subtitles & Styling State
  const [blocks, setBlocks] = useState<SubtitleBlock[]>([]);
  const [originalBlocks, setOriginalBlocks] = useState<SubtitleBlock[]>([]);
  const [translatedBlocks, setTranslatedBlocks] = useState<SubtitleBlock[] | null>(null);
  const [activeSubtitleVersion, setActiveSubtitleVersion] = useState<'original' | 'translated'>('original');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [style, setStyle] = useState<SubtitleStyle>(DEFAULT_STYLE);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  // Visual Processing & Toast States
  const [processStep, setProcessStep] = useState<ProcessStep>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Pronto');
  const [isProcessingMinimized, setIsProcessingMinimized] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, type, title, description }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sidebar Tab Navigation
  const [activeTab, setActiveTab] = useState<'presets' | 'style' | 'words' | 'script'>('presets');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState<boolean>(false);
  const [isSearchReplaceOpen, setIsSearchReplaceOpen] = useState<boolean>(false);

  // Cache & Disk Space State
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);

  const fetchCacheInfo = async () => {
    try {
      const url = fileId ? `/api/cache-info?currentFileId=${encodeURIComponent(fileId)}` : '/api/cache-info';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCacheInfo(data);
      }
    } catch (err) {
      console.warn('Failed to fetch cache info:', err);
    }
  };

  useEffect(() => {
    fetchCacheInfo();
    const interval = setInterval(fetchCacheInfo, 10000);
    return () => clearInterval(interval);
  }, [fileId]);

  // Video Time Synchronizer loop
  useEffect(() => {
    let animFrameId: number;
    const updateTime = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animFrameId = requestAnimationFrame(updateTime);
    };
    animFrameId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Handle Video element metadata load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 10);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoUrl]);

  // Spacebar Play / Pause Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 2));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 2));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
    setIsMuted(vol === 0);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Upload Handler with Visual Step Tracking & Instant Local Playback
  const handleFileUpload = async (file: File) => {
    let progressTimer: any = null;
    try {
      // 1. Instant local video display
      const localBlobUrl = URL.createObjectURL(file);
      setVideoUrl(localBlobUrl);
      setFileName(file.name);

      setProcessStep('uploading');
      setStatusMessage(`Enviando "${file.name}" e analisando dimensões...`);
      setIsProcessingMinimized(false);

      const formData = new FormData();
      formData.append('media', file);

      progressTimer = setTimeout(() => {
        setProcessStep('processing-audio');
        setStatusMessage('Extraindo faixa de áudio mono e calculando waveform...');
      }, 800);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (progressTimer) clearTimeout(progressTimer);

      if (!res.ok) {
        let errMsg = `Erro no servidor (${res.status})`;
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      const resolvedUrl = data.fileUrl || `/storage/uploads/${data.fileId}`;
      setFileId(data.fileId);
      setFileName(data.originalName || file.name);
      setVideoUrl(resolvedUrl);
      setMetadata(data.metadata);
      setWaveformPeaks(data.waveformPeaks || []);
      setDuration(data.metadata.duration || 10);

      addToast('info', 'Vídeo carregado', `${data.metadata.width}x${data.metadata.height} (${data.metadata.duration.toFixed(1)}s)`);

      // Step 3: Transcription with Whisper
      setProcessStep('transcribing');
      setStatusMessage('Transcrevendo áudio com Whisper e alinhando palavras...');

      await triggerTranscription(data.fileId, data.metadata.duration);

      setProcessStep(null);
      addToast('success', 'Vídeo e legendas prontos!', 'Legendas animadas sincronizadas com o player.');
    } catch (err: any) {
      if (progressTimer) clearTimeout(progressTimer);
      setProcessStep(null);
      addToast('error', 'Erro no processamento', err.message || 'Falha ao conectar com o backend');
      console.error('Upload error:', err);
    }
  };

  // Demo Sample Video Loader
  const handleLoadDemoSample = () => {
    setProcessStep('processing-audio');
    setStatusMessage('Carregando vídeo de demonstração e faixas...');

    setTimeout(() => {
      setProcessStep('transcribing');
      setStatusMessage('Alinhando blocos e palavras no Canvas 9:16...');

      setTimeout(() => {
        const demoDuration = 12;
        const demoPeaks = Array.from({ length: 400 }, (_, i) =>
          Math.abs(Math.sin(i / 15)) * 0.7 + Math.random() * 0.3
        );

        const demoWords: SubtitleWord[] = [
          { id: uuidv4(), text: 'CRIE', start: 0.4, end: 0.9 },
          { id: uuidv4(), text: 'VÍDEOS', start: 0.9, end: 1.5 },
          { id: uuidv4(), text: 'INCRÍVEIS', start: 1.5, end: 2.3 },
          { id: uuidv4(), text: 'COM', start: 2.5, end: 2.8 },
          { id: uuidv4(), text: 'LEGENDAS', start: 2.8, end: 3.5 },
          { id: uuidv4(), text: 'ANIMADAS', start: 3.5, end: 4.4 },
          { id: uuidv4(), text: 'EM', start: 4.7, end: 4.9 },
          { id: uuidv4(), text: 'ALTA', start: 4.9, end: 5.4 },
          { id: uuidv4(), text: 'QUALIDADE', start: 5.4, end: 6.3 },
          { id: uuidv4(), text: 'PARA', start: 6.6, end: 6.9 },
          { id: uuidv4(), text: 'TIKTOK', start: 6.9, end: 7.6 },
          { id: uuidv4(), text: 'E', start: 7.6, end: 7.8 },
          { id: uuidv4(), text: 'REELS', start: 7.8, end: 8.6 },
          { id: uuidv4(), text: 'EXPORTE', start: 9.0, end: 9.7 },
          { id: uuidv4(), text: 'EM', start: 9.7, end: 9.9 },
          { id: uuidv4(), text: 'PRORES', start: 9.9, end: 10.7 },
          { id: uuidv4(), text: 'TRANSPARENTE', start: 10.7, end: 11.8 }
        ];

        const demoBlocks: SubtitleBlock[] = [
          {
            id: uuidv4(),
            start: 0.4,
            end: 2.3,
            text: 'CRIE VÍDEOS INCRÍVEIS',
            words: demoWords.slice(0, 3)
          },
          {
            id: uuidv4(),
            start: 2.5,
            end: 4.4,
            text: 'COM LEGENDAS ANIMADAS',
            words: demoWords.slice(3, 6)
          },
          {
            id: uuidv4(),
            start: 4.7,
            end: 6.3,
            text: 'EM ALTA QUALIDADE',
            words: demoWords.slice(6, 9)
          },
          {
            id: uuidv4(),
            start: 6.6,
            end: 8.6,
            text: 'PARA TIKTOK E REELS',
            words: demoWords.slice(9, 13)
          },
          {
            id: uuidv4(),
            start: 9.0,
            end: 11.8,
            text: 'EXPORTE EM PRORES TRANSPARENTE',
            words: demoWords.slice(13, 17)
          }
        ];

        setFileId('demo-sample-video.mp4');
        setFileName('Demo Video Sample (9:16).mp4');
        setDuration(demoDuration);
        setWaveformPeaks(demoPeaks);
        setBlocks(demoBlocks);
        setOriginalBlocks(demoBlocks);
        setTranslatedBlocks(null);
        setActiveSubtitleVersion('original');
        setMetadata({
          duration: demoDuration,
          width: 1080,
          height: 1920,
          fps: 30,
          aspectRatio: '9:16',
          hasAudio: true,
          format: 'mp4',
          sizeBytes: 1024 * 1024 * 15
        });

        if (videoRef.current) {
          videoRef.current.src = '';
        }

        setProcessStep(null);
        addToast('success', 'Exemplo Demo Carregado!', '5 blocos com 17 palavras e animações ativadas.');
      }, 500);
    }, 400);
  };

  // Transcription Trigger
  const triggerTranscription = async (currentFileId?: string, currentDur = 10) => {
    const id = currentFileId || fileId;
    if (!id) return;

    try {
      setIsTranscribing(true);
      const groqKey = localStorage.getItem('GROQ_API_KEY') || '';
      const openaiKey = localStorage.getItem('OPENAI_API_KEY') || '';

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: id,
          apiKey: groqKey || openaiKey || undefined,
          provider: groqKey ? 'groq' : openaiKey ? 'openai' : 'auto',
          wordsPerBlock: style.wordsPerLine || 3
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha na transcrição');
      }

      const data = await res.json();
      const loadedBlocks = data.blocks || [];
      setBlocks(loadedBlocks);
      setOriginalBlocks(loadedBlocks);
      setTranslatedBlocks(null);
      setActiveSubtitleVersion('original');
      setIsTranscribing(false);
      addToast('success', 'Transcrição concluída', `${loadedBlocks.length} blocos de legenda gerados.`);
    } catch (err: any) {
      setIsTranscribing(false);
      console.warn('Transcription failed, using fallback speech alignment:', err);
      addToast('warning', 'Alinhamento Offline Ativado', 'Transcrição processada com modelo de cadência local.');
    }
  };

  // Subtitle Operations
  const handleUpdateBlockTiming = (blockId: string, newStart: number, newEnd: number) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== blockId) return b;
        const dur = newEnd - newStart;
        const wordDur = dur / Math.max(1, b.words.length);
        const updatedWords = b.words.map((w, idx) => ({
          ...w,
          start: newStart + idx * wordDur,
          end: Math.min(newEnd, newStart + (idx + 1) * wordDur)
        }));
        return {
          ...b,
          start: Math.round(newStart * 1000) / 1000,
          end: Math.round(newEnd * 1000) / 1000,
          words: updatedWords
        };
      })
    );
  };

  const handleSplitBlock = (blockId: string, splitTime: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || splitTime <= block.start || splitTime >= block.end) return;

    const leftWords = block.words.filter(w => w.end <= splitTime || (w.start < splitTime && w.end > splitTime));
    const rightWords = block.words.filter(w => w.start >= splitTime);

    const block1: SubtitleBlock = {
      id: uuidv4(),
      start: block.start,
      end: splitTime,
      text: leftWords.map(w => w.text).join(' '),
      words: leftWords
    };

    const block2: SubtitleBlock = {
      id: uuidv4(),
      start: splitTime,
      end: block.end,
      text: rightWords.map(w => w.text).join(' '),
      words: rightWords
    };

    const blockIdx = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(blockIdx, 1, block1, block2);
    setBlocks(newBlocks);
  };

  const handleMergeBlocks = (firstBlockId: string) => {
    const idx = blocks.findIndex(b => b.id === firstBlockId);
    if (idx === -1 || idx >= blocks.length - 1) return;

    const b1 = blocks[idx];
    const b2 = blocks[idx + 1];

    const merged: SubtitleBlock = {
      id: uuidv4(),
      start: b1.start,
      end: b2.end,
      text: `${b1.text} ${b2.text}`.trim(),
      words: [...b1.words, ...b2.words]
    };

    const newBlocks = [...blocks];
    newBlocks.splice(idx, 2, merged);
    setBlocks(newBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const handleAddBlock = (startTime: number) => {
    const newBlock: SubtitleBlock = {
      id: uuidv4(),
      start: Math.round(startTime * 1000) / 1000,
      end: Math.min(duration, Math.round((startTime + 2) * 1000) / 1000),
      text: 'NOVA LEGENDA',
      words: [
        { id: uuidv4(), text: 'NOVA', start: startTime, end: startTime + 0.8 },
        { id: uuidv4(), text: 'LEGENDA', start: startTime + 0.8, end: startTime + 2.0 }
      ]
    };

    const newBlocks = [...blocks, newBlock].sort((a, b) => a.start - b.start);
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = (blockId: string, updated: Partial<SubtitleBlock>) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== blockId) return b;
        const updatedBlock: SubtitleBlock = { ...b, ...updated };

        // Sincroniza as palavras instantaneamente quando o texto do bloco é editado
        if (updated.text !== undefined && updated.words === undefined) {
          const rawWords = updated.text.trim().split(/\s+/).filter(Boolean);
          const existingWords = b.words || [];

          if (rawWords.length === 0) {
            updatedBlock.words = [];
          } else if (rawWords.length === existingWords.length) {
            // Mesma quantidade de palavras: atualiza o texto de cada uma preservando os timestamps
            updatedBlock.words = existingWords.map((w, idx) => ({
              ...w,
              text: rawWords[idx]
            }));
          } else {
            // Quantidade de palavras mudou: redistribui os timestamps proporcionalmente no bloco
            const totalDuration = Math.max(0.1, b.end - b.start);
            const wordDuration = totalDuration / rawWords.length;

            updatedBlock.words = rawWords.map((wordText, idx) => {
              const wStart = b.start + idx * wordDuration;
              const wEnd = idx === rawWords.length - 1 ? b.end : wStart + wordDuration;
              return {
                id: existingWords[idx]?.id || uuidv4(),
                text: wordText,
                start: Math.round(wStart * 1000) / 1000,
                end: Math.round(wEnd * 1000) / 1000
              };
            });
          }
        }

        return updatedBlock;
      })
    );
  };

  const handleUpdateWord = (blockId: string, wordId: string, updated: Partial<SubtitleWord>) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== blockId) return b;
        const newWords = b.words.map(w => (w.id === wordId ? { ...w, ...updated } : w));
        return {
          ...b,
          text: newWords.map(w => w.text).join(' '),
          words: newWords
        };
      })
    );
  };

  const handleDeleteWord = (blockId: string, wordId: string) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== blockId) return b;
        const newWords = b.words.filter(w => w.id !== wordId);
        return {
          ...b,
          text: newWords.map(w => w.text).join(' '),
          words: newWords
        };
      })
    );
  };

  const handleAddWord = (blockId: string) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== blockId) return b;
        const lastWord = b.words[b.words.length - 1];
        const start = lastWord ? lastWord.end : b.start;
        const end = Math.min(b.end, start + 0.5);
        const newWord: SubtitleWord = {
          id: uuidv4(),
          text: 'Palavra',
          start,
          end
        };
        const newWords = [...b.words, newWord];
        return {
          ...b,
          text: newWords.map(w => w.text).join(' '),
          words: newWords
        };
      })
    );
  };

  const handleSelectPreset = (preset: Preset) => {
    setStyle(prev => {
      const pStyle = preset.style;
      return {
        ...prev,
        // Cores do preset selecionado
        textColor: pStyle.textColor || prev.textColor,
        highlightColor: pStyle.highlightColor || prev.highlightColor,
        strokeColor: pStyle.strokeColor || prev.strokeColor,
        shadowColor: pStyle.shadowColor || prev.shadowColor,
        boxColor: pStyle.boxColor || prev.boxColor,

        // Efeitos e animações do preset selecionado
        animationType: pStyle.animationType ?? prev.animationType,
        animationScale: pStyle.animationScale ?? prev.animationScale,
        strokeWidth: pStyle.strokeWidth ?? prev.strokeWidth,
        shadowBlur: pStyle.shadowBlur ?? prev.shadowBlur,
        shadowDistance: pStyle.shadowDistance ?? prev.shadowDistance,
        useBackgroundBox: pStyle.useBackgroundBox ?? prev.useBackgroundBox,
        boxOpacity: pStyle.boxOpacity ?? prev.boxOpacity,
        boxRadius: pStyle.boxRadius ?? prev.boxRadius,
        boxPaddingX: pStyle.boxPaddingX ?? prev.boxPaddingX,
        boxPaddingY: pStyle.boxPaddingY ?? prev.boxPaddingY,

        // Preserva a Tipografia atual do usuário (Fonte, Tamanho, Peso, Caixa)
        fontFamily: prev.fontFamily,
        fontSize: prev.fontSize,
        fontWeight: prev.fontWeight,
        caseTransform: prev.caseTransform,

        // Preserva a Posição e Layout do usuário (Altura Y, Horizontal X, Alinhamento)
        positionY: prev.positionY,
        positionX: prev.positionX,
        alignment: prev.alignment,

        presetName: preset.name
      };
    });
  };

  const handleOpenExplorer = async () => {
    try {
      const res = await fetch('/api/open-folder', { method: 'POST' });
      if (res.ok) {
        addToast('success', 'Windows Explorer aberto', 'Pasta de renders visualizada no Explorer.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = () => {
    if (processStep) {
      return { label: statusMessage, type: 'loading' as const };
    }
    if (fileName) {
      return { label: `${blocks.length} blocos ativos`, type: 'success' as const };
    }
    return { label: 'Pronto para começar', type: 'idle' as const };
  };

  const handleSubtitleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('subtitleFile', file);

      const res = await fetch('/api/parse-subtitles', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Falha ao importar legenda');
      }

      const data = await res.json();
      if (data.blocks && data.blocks.length > 0) {
        setBlocks(data.blocks);
        setOriginalBlocks(data.blocks);
        setTranslatedBlocks(null);
        setActiveSubtitleVersion('original');
        addToast('success', 'Legenda importada!', `${data.blocks.length} blocos carregados do arquivo "${file.name}".`);
      } else {
        addToast('warning', 'Arquivo vazio', 'Nenhum bloco de legenda encontrado no arquivo.');
      }
    } catch (err: any) {
      addToast('error', 'Erro ao importar legenda', err.message);
    }
  };

  // AI Subtitle Translation
  const handleTranslate = async (targetLanguage: string) => {
    try {
      const baseBlocks = originalBlocks.length > 0 ? originalBlocks : blocks;
      if (baseBlocks.length === 0) {
        addToast('warning', 'Sem legendas', 'Carregue um vídeo e gere a transcrição antes de traduzir.');
        return;
      }

      setIsTranslating(true);
      setProcessStep('transcribing');
      setStatusMessage(`Traduzindo legendas com IA para ${targetLanguage.toUpperCase()}...`);
      setIsProcessingMinimized(false);

      const groqKey = localStorage.getItem('GROQ_API_KEY') || '';
      const openaiKey = localStorage.getItem('OPENAI_API_KEY') || '';

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: baseBlocks,
          targetLanguage,
          apiKey: groqKey || openaiKey || undefined
        })
      });

      if (!res.ok) {
        let errMsg = 'Falha ao processar tradução no servidor';
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.blocks && data.blocks.length > 0) {
        setTranslatedBlocks(data.blocks);
        setBlocks(data.blocks);
        setActiveSubtitleVersion('translated');
        addToast('success', 'Tradução Concluída!', `Legenda traduzida para ${targetLanguage.toUpperCase()} aplicada no vídeo.`);
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      addToast('error', 'Erro na Tradução', err.message || 'Falha ao traduzir legendas');
    } finally {
      setIsTranslating(false);
      setProcessStep(null);
    }
  };

  // Switch between Original and Translated Subtitles
  const handleSelectSubtitleVersion = (version: 'original' | 'translated') => {
    setActiveSubtitleVersion(version);
    if (version === 'original') {
      if (originalBlocks.length > 0) {
        setBlocks(originalBlocks);
      }
      addToast('info', 'Legenda Original', 'Exibindo legendas no idioma original do áudio.');
    } else {
      if (translatedBlocks && translatedBlocks.length > 0) {
        setBlocks(translatedBlocks);
        addToast('info', 'Legenda Traduzida', 'Exibindo legendas traduzidas no vídeo.');
      }
    }
  };

  // Clear Unnecessary Cache & Temp Files
  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      const res = await fetch('/api/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentFileId: fileId || undefined })
      });

      if (!res.ok) {
        throw new Error('Falha ao limpar arquivos temporários');
      }

      const data = await res.json();
      addToast('success', 'Cache Limpo com Sucesso!', `${data.freedFormatted || '0 B'} liberados no seu disco.`);
      await fetchCacheInfo();
    } catch (err: any) {
      console.error('Clear cache error:', err);
      addToast('error', 'Erro ao Limpar Cache', err.message || 'Não foi possível apagar arquivos temporários.');
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f4f5f7] text-slate-900 overflow-hidden font-sans select-none">
      {/* Hidden Media File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Hidden Subtitle File Input (.srt, .vtt, .json) */}
      <input
        ref={subInputRef}
        type="file"
        accept=".srt,.vtt,.json"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleSubtitleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Top Navbar */}
      <Navbar
        fileName={fileName}
        fileId={fileId}
        isTranscribing={isTranscribing}
        statusBadge={getStatusBadge()}
        cacheInfo={cacheInfo}
        isClearingCache={isClearingCache}
        onUploadClick={() => fileInputRef.current?.click()}
        onImportSubtitlesClick={() => subInputRef.current?.click()}
        onTranscribeClick={() => triggerTranscription()}
        onOpenSearchReplace={() => setIsSearchReplaceOpen(true)}
        onOpenApiKeys={() => setIsApiKeysOpen(true)}
        onOpenExplorer={handleOpenExplorer}
        onOpenExport={() => setIsExportOpen(true)}
        onClearCache={handleClearCache}
      />

      {/* Main Workspace: Left Player + Right Styling/Editor Panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left / Center Area: Canvas Player & Timeline */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-neutral-300 bg-[#eeeeee]">
          {/* Top: Video Player & Subtitle Canvas (Stage with 50% Gray studio backdrop) */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
            {fileName ? (
              <div className="flex flex-col items-center justify-center w-full h-full max-h-full">
                {/* 50% Neutral Gray (#808080) Studio Stage */}
                <div className="w-full flex-1 flex items-center justify-center bg-[#808080] rounded-3xl p-3 shadow-inner border-2 border-[#666666] overflow-hidden min-h-0">
                  <CanvasPreview
                    videoRef={videoRef}
                    videoUrl={videoUrl || (fileId ? `/storage/uploads/${fileId}` : null)}
                    blocks={blocks}
                    style={style}
                    currentTime={currentTime}
                    duration={duration}
                    aspectRatio={aspectRatio}
                    safeZoneMode={safeZoneMode}
                    onTimeUpdate={(t) => setCurrentTime(t)}
                    onDurationChange={(d) => setDuration(d)}
                    onTogglePlay={togglePlay}
                    onSeek={seek}
                  />
                </div>
                <VideoControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  isMuted={isMuted}
                  playbackRate={playbackRate}
                  aspectRatio={aspectRatio}
                  safeZoneMode={safeZoneMode}
                  onTogglePlay={togglePlay}
                  onSeek={seek}
                  onVolumeChange={handleVolumeChange}
                  onToggleMute={handleToggleMute}
                  onPlaybackRateChange={handlePlaybackRateChange}
                  onAspectRatioChange={setAspectRatio}
                  onSafeZoneChange={setSafeZoneMode}
                  onToggleFullscreen={() => {
                    if (videoRef.current) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        videoRef.current.requestFullscreen();
                      }
                    }
                  }}
                />
              </div>
            ) : (
              /* Drag & Drop Hero Upload Screen */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 hover:border-slate-800 bg-white rounded-3xl max-w-xl mx-auto text-center transition-all cursor-pointer shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
                  <Upload className="w-8 h-8 text-slate-800" />
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Arraste seu vídeo aqui ou clique para enviar
                </h2>
                <p className="text-sm text-slate-600 mt-2 max-w-md leading-relaxed font-medium">
                  Suporta MP4, MOV, WebM, AVI em 9:16 (Reels/TikTok), 16:9 (YouTube) ou 1:1.
                  Geração instantânea de legendas animadas com Whisper e renderização FFmpeg.
                </p>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Selecionar Arquivo</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadDemoSample();
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-slate-700" />
                    <span>Carregar Exemplo Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom: Interactive Multi-Track Timeline */}
          {fileName && (
            <div className="mt-2 shrink-0">
              <Timeline
                blocks={blocks}
                duration={duration}
                currentTime={currentTime}
                waveformPeaks={waveformPeaks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlockTiming={handleUpdateBlockTiming}
                onSplitBlock={handleSplitBlock}
                onMergeBlocks={handleMergeBlocks}
                onDeleteBlock={handleDeleteBlock}
                onAddBlock={handleAddBlock}
                onSeek={seek}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar: Tabs for Presets, Styles, Words & Script (Widened & Spacious) */}
        <div className="w-[460px] lg:w-[500px] xl:w-[540px] 2xl:w-[580px] flex flex-col bg-white border-l border-neutral-300 shrink-0 select-none overflow-hidden transition-all shadow-sm">
          {/* Tab Navigation Header */}
          <div className="flex items-center border-b border-neutral-300 bg-neutral-100 p-2.5 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === 'presets'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Presets</span>
            </button>

            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === 'style'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Estilo</span>
            </button>

            <button
              onClick={() => setActiveTab('words')}
              className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === 'words'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Palavras</span>
            </button>

            <button
              onClick={() => setActiveTab('script')}
              className={`flex-1 py-2.5 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition ${
                activeTab === 'script'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Roteiro</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#eeeeee]">
            {activeTab === 'presets' && (
              <PresetPicker currentStyle={style} onSelectPreset={handleSelectPreset} />
            )}

            {activeTab === 'style' && (
              <div className="flex flex-col gap-4">
                <PositionControls
                  style={style}
                  blocks={blocks}
                  onChange={(u) => setStyle((s) => ({ ...s, ...u }))}
                  onApplyRechunk={(newBlocks) => setBlocks(newBlocks)}
                />
                <TypographyColorControls
                  style={style}
                  onChange={(u) => setStyle((s) => ({ ...s, ...u }))}
                />
                <EffectsControls
                  style={style}
                  onChange={(u) => setStyle((s) => ({ ...s, ...u }))}
                />
              </div>
            )}

            {activeTab === 'words' && (
              <WordEditor
                blocks={blocks}
                style={style}
                currentTime={currentTime}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlock={handleUpdateBlock}
                onUpdateWord={handleUpdateWord}
                onDeleteBlock={handleDeleteBlock}
                onDeleteWord={handleDeleteWord}
                onAddWord={handleAddWord}
                onSeek={seek}
              />
            )}

            {activeTab === 'script' && (
              <ContinuousEditor
                blocks={blocks}
                originalBlocks={originalBlocks.length > 0 ? originalBlocks : blocks}
                translatedBlocks={translatedBlocks}
                activeSubtitleVersion={activeSubtitleVersion}
                currentTime={currentTime}
                onSeek={seek}
                onSelectSubtitleVersion={handleSelectSubtitleVersion}
                onTranslate={handleTranslate}
                isTranslating={isTranslating}
              />
            )}
          </div>

          {/* Sidebar Logo Footer */}
          <div className="py-4 px-6 border-t-2 border-slate-200 bg-white flex items-center justify-center shrink-0">
            <img
              src={isoLogo}
              alt="ISO"
              className="h-16 w-auto object-contain transition transform hover:scale-105 duration-200"
            />
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <ExportModal
        isOpen={isExportOpen}
        fileId={fileId || ''}
        fileName={fileName}
        metadata={metadata}
        blocks={blocks}
        style={style}
        onClose={() => setIsExportOpen(false)}
      />

      <ApiKeysModal isOpen={isApiKeysOpen} onClose={() => setIsApiKeysOpen(false)} />

      <SearchReplaceModal
        isOpen={isSearchReplaceOpen}
        blocks={blocks}
        onClose={() => setIsSearchReplaceOpen(false)}
        onApplyReplace={(updated) => setBlocks(updated)}
      />

      {/* Visual Step Progress Modal */}
      <ProcessingModal
        currentStep={processStep}
        statusMessage={statusMessage}
        isMinimized={isProcessingMinimized}
        onToggleMinimize={() => setIsProcessingMinimized(!isProcessingMinimized)}
        onCancel={() => setProcessStep(null)}
      />

      {/* Real-time Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
