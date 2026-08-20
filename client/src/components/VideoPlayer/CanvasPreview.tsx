import React, { useEffect, useRef } from 'react';
import { SubtitleBlock, SubtitleStyle, AspectRatio, SafeZoneMode } from '../../types';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music2,
  Camera,
  Search,
  Plus,
  Send,
  Sparkles
} from 'lucide-react';

interface CanvasPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl?: string | null;
  blocks: SubtitleBlock[];
  style: SubtitleStyle;
  currentTime: number;
  duration: number;
  aspectRatio: AspectRatio;
  safeZoneMode: SafeZoneMode;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (dur: number) => void;
  onTogglePlay?: () => void;
  onSeek?: (time: number) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  videoRef,
  videoUrl,
  blocks,
  style,
  currentTime,
  duration,
  aspectRatio,
  safeZoneMode,
  onTimeUpdate,
  onDurationChange,
  onTogglePlay,
  onSeek
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Aspect ratio dimension calculations - Always fit 100% height
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] h-full max-h-full w-auto';
      case '16:9':
        return 'aspect-[16/9] w-full max-h-full h-auto';
      case '1:1':
        return 'aspect-square h-full max-h-full w-auto';
      case '4:5':
        return 'aspect-[4/5] h-full max-h-full w-auto';
      default:
        return 'aspect-[9/16] h-full max-h-full w-auto';
    }
  };

  // Ensure video element reloads and displays the frame when videoUrl changes
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.load();
    }
  }, [videoUrl, videoRef]);

  // Render animated subtitles on canvas (supporting 1 line and 2 lines seamlessly)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Internal reference resolution (1080 x 1920 base for 9:16)
    const baseWidth = 1080;
    const baseHeight = 1920;
    canvas.width = baseWidth;
    canvas.height = baseHeight;

    ctx.clearRect(0, 0, baseWidth, baseHeight);

    // Find active block
    const activeBlock = blocks.find(b => currentTime >= b.start && currentTime <= b.end);
    if (!activeBlock) {
      return;
    }

    const words = activeBlock.words && activeBlock.words.length > 0
      ? activeBlock.words
      : [{ id: '1', text: activeBlock.text, start: activeBlock.start, end: activeBlock.end }];

    // Scale font size proportionally to 1080x1920 Full HD Canvas space
    const fontSize = (style.fontSize || 54) * 2;
    const fontWeight = style.fontWeight || 800;
    const fontFamily = style.fontFamily || 'Montserrat';

    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Helper to format case
    const formatWord = (text: string) => {
      if (style.caseTransform === 'uppercase') return text.toUpperCase();
      if (style.caseTransform === 'lowercase') return text.toLowerCase();
      if (style.caseTransform === 'capitalize') return text.replace(/\b\w/g, c => c.toUpperCase());
      return text;
    };

    // Calculate position
    const posX = baseWidth * ((style.positionX ?? 50) / 100);
    const posY = baseHeight * (style.positionY / 100);

    // Measure words and prepare line layout
    const isHighlightEnabled = style.useHighlight !== false;
    const isKaraoke = style.animationType === 'karaoke';

    const formattedWords = words.map(w => ({
      ...w,
      display: formatWord(w.text),
      isActive: isHighlightEnabled && (
        isKaraoke
          ? currentTime >= w.start
          : (currentTime >= w.start && currentTime < w.end)
      )
    }));

    // Measure widths with spacing
    const spaceWidth = ctx.measureText(' ').width + (style.letterSpacing || 0);
    const wordMeasures = formattedWords.map(w => ({
      ...w,
      width: ctx.measureText(w.display).width + (style.letterSpacing || 0)
    }));

    // Determine 1-line vs 2-line layout:
    // Only wrap to 2 lines if total words strictly EXCEED wordsPerLine (e.g. 4+ words for 3 words/line)
    const targetWordsPerLine = style.wordsPerLine || 3;
    const isMultiline = (style.maxLines === 2 && words.length > targetWordsPerLine) || (words.length >= 6);
    
    let splitIndex = targetWordsPerLine;
    if (isMultiline && wordMeasures.length > targetWordsPerLine) {
      // Balance 4 words into 2 + 2 for visual harmony
      if (wordMeasures.length === 4 && targetWordsPerLine === 3) {
        splitIndex = 2;
      }
      // Smart punctuation break for multiline: break right after punctuation mark if within line 1
      const punctIdx = wordMeasures.findIndex((w, idx) => idx >= 0 && idx < wordMeasures.length - 1 && /[,.?!…:;]$/.test(w.text.trim()));
      if (punctIdx !== -1 && punctIdx + 1 <= targetWordsPerLine) {
        splitIndex = punctIdx + 1;
      }
    }
    splitIndex = isMultiline ? Math.min(wordMeasures.length - 1, Math.max(1, splitIndex)) : wordMeasures.length;

    const line1Words = wordMeasures.slice(0, splitIndex);
    const line2Words = isMultiline ? wordMeasures.slice(splitIndex) : [];

    const line1Width = line1Words.reduce((sum, w) => sum + w.width, 0) + Math.max(0, line1Words.length - 1) * spaceWidth;
    const line2Width = line2Words.reduce((sum, w) => sum + w.width, 0) + Math.max(0, line2Words.length - 1) * spaceWidth;
    const maxLineWidth = Math.max(line1Width, line2Width);

    const lineSpacing = fontSize * (style.lineHeight || 1.25);
    const line1Y = isMultiline ? posY - lineSpacing / 2 : posY;
    const line2Y = isMultiline ? posY + lineSpacing / 2 : posY;

    // Render Background Pill/Box if enabled
    if (style.useBackgroundBox) {
      const padX = (style.boxPaddingX || 16) * 2;
      const padY = (style.boxPaddingY || 8) * 2;
      const boxW = maxLineWidth + padX * 2;
      const totalTextHeight = isMultiline ? lineSpacing + fontSize : fontSize;
      const boxH = totalTextHeight + padY * 2;
      const boxX = posX - boxW / 2;
      const boxY = posY - boxH / 2;
      const radius = (style.boxRadius || 12) * 2;

      ctx.save();
      ctx.globalAlpha = style.boxOpacity || 0.8;
      ctx.fillStyle = style.boxColor || '#000000';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, radius);
      ctx.fill();
      ctx.restore();
    }

    const hasShadow = ((style.shadowDistance ?? 0) > 0) || ((style.shadowBlur ?? 0) > 0);
    const hasStroke = (style.strokeWidth ?? 0) > 0;

    // Helper to render a single line of words
    const renderWordLine = (lineWords: typeof wordMeasures, lineTotalWidth: number, targetY: number) => {
      let currentX = posX - lineTotalWidth / 2;

      lineWords.forEach((w) => {
        const wordCenterX = currentX + w.width / 2;
        const isWordActive = w.isActive;

        ctx.save();
        ctx.translate(wordCenterX, targetY);

        // Handle Pop / Bounce animation scale
        if (isWordActive && (style.animationType === 'pop' || style.animationType === 'bounce')) {
          const timeIntoWord = currentTime - w.start;
          const dur = Math.min(0.2, (w.end - w.start) * 0.6);
          let scale = 1.0;

          if (timeIntoWord < dur) {
            const progress = timeIntoWord / dur;
            scale = 1.0 + ((style.animationScale || 1.22) - 1.0) * Math.sin(progress * Math.PI);
          } else {
            scale = 1.0;
          }

          ctx.scale(scale, scale);
        }

        // 1. Pass 1: Sombra / Glow (desenhada atrás)
        if (hasShadow) {
          ctx.save();
          ctx.shadowColor = style.shadowColor || '#000000';
          ctx.shadowBlur = (style.shadowBlur || 4) * 2.5;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = (style.shadowDistance || 3) * 2.5;
          ctx.fillStyle = isWordActive ? (style.highlightColor || '#FFE600') : (style.textColor || '#FFFFFF');
          ctx.fillText(w.display, 0, 0);
          ctx.restore();
        }

        // 2. Pass 2: Contorno / Stroke (desenhado com espessura nítida)
        if (hasStroke) {
          ctx.save();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.strokeStyle = style.strokeColor || '#000000';
          ctx.lineWidth = (style.strokeWidth || 8) * 2.8;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(w.display, 0, 0);
          ctx.restore();
        }

        // 3. Pass 3: Preenchimento do Texto (nítido por cima do contorno)
        ctx.save();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = isWordActive ? (style.highlightColor || '#FFE600') : (style.textColor || '#FFFFFF');
        ctx.fillText(w.display, 0, 0);
        ctx.restore();

        ctx.restore();

        currentX += w.width + spaceWidth;
      });
    };

    const isLine1Hidden = activeBlock.hidden || activeBlock.hiddenLines?.includes(1);
    const isLine2Hidden = activeBlock.hidden || activeBlock.hiddenLines?.includes(2);

    // Render Line 1 (if not hidden)
    if (!isLine1Hidden && line1Words.length > 0) {
      renderWordLine(line1Words, line1Width, line1Y);
    }

    // Render Line 2 (if multiline and not hidden)
    if (isMultiline && !isLine2Hidden && line2Words.length > 0) {
      renderWordLine(line2Words, line2Width, line2Y);
    }

  }, [currentTime, blocks, style, aspectRatio]);

  const showInstagram = safeZoneMode === 'instagram' || safeZoneMode === 'both';
  const showTikTok = safeZoneMode === 'tiktok' || safeZoneMode === 'both';

  return (
    <div
      ref={containerRef}
      style={{ containerType: 'size' }}
      className={`relative ${getAspectRatioClasses()} bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center select-none border-2 border-neutral-800`}
    >
      {/* HTML5 Video Layer */}
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        onClick={onTogglePlay}
        onTimeUpdate={(e) => {
          if (onTimeUpdate) onTimeUpdate((e.target as HTMLVideoElement).currentTime);
        }}
        onLoadedMetadata={(e) => {
          const target = e.target as HTMLVideoElement;
          if (onDurationChange && target.duration) {
            onDurationChange(target.duration);
          }
        }}
        className="w-full h-full object-contain pointer-events-auto cursor-pointer"
        playsInline
        preload="auto"
      />

      {/* Subtitle Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none object-contain z-10"
      />

      {/* ========================================================================= */}
      {/* 100% PROPORTIONALLY SCALED SOCIAL MEDIA SAFE ZONES OVERLAY (Container CQ) */}
      {/* ========================================================================= */}
      {safeZoneMode !== 'off' && (
        <div
          className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden text-white font-sans"
          style={{ fontSize: '3cqw' }}
        >
          {/* Top UI Header Overlay */}
          <div
            className="w-full flex items-center justify-between font-bold drop-shadow-md z-30"
            style={{
              paddingTop: '2.5cqh',
              paddingLeft: '3.5cqw',
              paddingRight: '3.5cqw',
              fontSize: '3.2cqw'
            }}
          >
            {showInstagram && !showTikTok && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight" style={{ fontSize: '4cqw' }}>Reels</span>
                </div>
                <div className="flex items-center gap-3">
                  <Camera style={{ width: '4.5cqw', height: '4.5cqw' }} />
                </div>
              </>
            )}

            {showTikTok && !showInstagram && (
              <>
                <div style={{ width: '4cqw' }} />
                <div className="flex items-center gap-3 font-extrabold tracking-wide" style={{ fontSize: '3.4cqw' }}>
                  <span className="text-white/60">Seguindo</span>
                  <span className="text-white border-b-2 border-white pb-0.5">Para Você</span>
                </div>
                <Search style={{ width: '4.5cqw', height: '4.5cqw' }} />
              </>
            )}

            {safeZoneMode === 'both' && (
              <div className="w-full flex items-center justify-between">
                <span
                  className="uppercase font-mono font-bold bg-pink-600/80 rounded-full border border-pink-400"
                  style={{ fontSize: '2.2cqw', padding: '0.4cqh 2cqw' }}
                >
                  Instagram
                </span>
                <span
                  className="uppercase font-mono font-bold bg-cyan-600/80 rounded-full border border-cyan-400"
                  style={{ fontSize: '2.2cqw', padding: '0.4cqh 2cqw' }}
                >
                  TikTok
                </span>
              </div>
            )}
          </div>

          {/* Center Safe Area Box (Guia Proporcional de Área Segura) */}
          <div
            className="absolute border-2 border-dashed border-emerald-400/60 rounded-xl flex flex-col items-center justify-between pointer-events-none"
            style={{
              top: '14%',
              bottom: '28%',
              left: '4%',
              right: '4%',
              padding: '1cqh 0'
            }}
          >
            <span
              className="font-mono font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 rounded-full border border-emerald-500/50 shadow-sm flex items-center gap-1"
              style={{
                fontSize: '2.2cqw',
                padding: '0.4cqh 2.5cqw'
              }}
            >
              <Sparkles style={{ width: '2.8cqw', height: '2.8cqw' }} className="text-emerald-300" />
              <span>Área Segura de Legendas & Hooks</span>
            </span>

            {/* Profile Grid 4:5 Crop Guide for Instagram */}
            {showInstagram && (
              <div className="w-full h-1/2 border-t border-b border-pink-400/30 flex items-center justify-center">
                <span
                  className="font-mono text-pink-300 bg-pink-950/60 rounded"
                  style={{
                    fontSize: '2.2cqw',
                    padding: '0.3cqh 2cqw'
                  }}
                >
                  Feed / Grade 4:5 (Instagram)
                </span>
              </div>
            )}

            <span
              className="font-mono font-bold text-emerald-300/80"
              style={{ fontSize: '2.1cqw' }}
            >
              ✓ Visível em 100% dos smartphones
            </span>
          </div>

          {/* Right Engagement Sidebar (Curtidas, Comentários, Compartilhar) */}
          <div
            className="absolute flex flex-col items-center z-30 drop-shadow-lg text-white"
            style={{
              right: '2cqw',
              bottom: '10cqh',
              gap: '1.2cqh'
            }}
          >
            {showTikTok && (
              <div className="relative mb-0.5">
                <div
                  className="rounded-full border-2 border-white bg-neutral-700 overflow-hidden flex items-center justify-center font-black"
                  style={{ width: '8cqw', height: '8cqw', fontSize: '3cqw' }}
                >
                  👤
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-red-500 rounded-full flex items-center justify-center text-white"
                  style={{ width: '3.4cqw', height: '3.4cqw', bottom: '-0.8cqw' }}
                >
                  <Plus className="stroke-[3]" style={{ width: '2.5cqw', height: '2.5cqw' }} />
                </div>
              </div>
            )}

            {/* Like */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                style={{ width: '7.5cqw', height: '7.5cqw' }}
              >
                <Heart className="fill-white text-white" style={{ width: '4.2cqw', height: '4.2cqw' }} />
              </div>
              <span className="font-bold mt-0.5" style={{ fontSize: '2.2cqw' }}>84.2K</span>
            </div>

            {/* Comments */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                style={{ width: '7.5cqw', height: '7.5cqw' }}
              >
                <MessageCircle className="fill-white text-white" style={{ width: '4.2cqw', height: '4.2cqw' }} />
              </div>
              <span className="font-bold mt-0.5" style={{ fontSize: '2.2cqw' }}>1.4K</span>
            </div>

            {/* Share / Send */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                style={{ width: '7.5cqw', height: '7.5cqw' }}
              >
                {showInstagram && !showTikTok ? (
                  <Send className="fill-white text-white" style={{ width: '3.8cqw', height: '3.8cqw' }} />
                ) : (
                  <Share2 className="fill-white text-white" style={{ width: '3.8cqw', height: '3.8cqw' }} />
                )}
              </div>
              <span className="font-bold mt-0.5" style={{ fontSize: '2.2cqw' }}>9.8K</span>
            </div>

            {/* Bookmark */}
            <div className="flex flex-col items-center">
              <div
                className="rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                style={{ width: '7.5cqw', height: '7.5cqw' }}
              >
                <Bookmark className="fill-white text-white" style={{ width: '3.8cqw', height: '3.8cqw' }} />
              </div>
              <span className="font-bold mt-0.5" style={{ fontSize: '2.2cqw' }}>3.2K</span>
            </div>

            {/* Music Disc */}
            <div
              className="rounded-full bg-neutral-900 border-2 border-neutral-600 flex items-center justify-center animate-spin"
              style={{ width: '7.5cqw', height: '7.5cqw' }}
            >
              <Music2 className="text-white" style={{ width: '3.5cqw', height: '3.5cqw' }} />
            </div>
          </div>

          {/* Bottom Captions & User Info Overlay */}
          <div
            className="w-full flex flex-col z-30 drop-shadow-md"
            style={{
              bottom: '1.5cqh',
              paddingLeft: '3.5cqw',
              paddingRight: '15cqw',
              paddingBottom: '2.5cqh',
              gap: '0.4cqh'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-white" style={{ fontSize: '3cqw' }}>@seu_perfil</span>
              <button
                className="font-extrabold bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-md border border-white/40"
                style={{ fontSize: '2.4cqw', padding: '0.2cqh 1.8cqw' }}
              >
                Seguir
              </button>
            </div>
            <p
              className="text-white/90 font-medium line-clamp-2 leading-tight"
              style={{ fontSize: '2.4cqw', lineHeight: 1.2 }}
            >
              Aprenda como legendar seus vídeos verticais com alto engajamento! #viral #reels
            </p>
            <div
              className="flex items-center gap-1.5 text-white/80 font-bold"
              style={{ fontSize: '2.2cqw', marginTop: '0.2cqh' }}
            >
              <Music2 style={{ width: '3cqw', height: '3cqw' }} className="shrink-0" />
              <span className="truncate">Áudio Original • som oficial</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
