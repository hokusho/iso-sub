import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Shield,
  Gauge,
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { AspectRatio, SafeZoneMode } from '../../types';
import { formatTimecode } from '../../utils/timeFormat';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  aspectRatio: AspectRatio;
  safeZoneMode: SafeZoneMode;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onSafeZoneChange: (mode: SafeZoneMode) => void;
  onToggleFullscreen: () => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  aspectRatio,
  safeZoneMode,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onAspectRatioChange,
  onSafeZoneChange,
  onToggleFullscreen
}) => {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const aspectRatios: AspectRatio[] = ['9:16', '16:9', '1:1', '4:5'];

  const [isSafeZoneDropdownOpen, setIsSafeZoneDropdownOpen] = useState(false);
  const safeZoneRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (safeZoneRef.current && !safeZoneRef.current.contains(event.target as Node)) {
        setIsSafeZoneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeZoneOptions: { id: SafeZoneMode; label: string; desc: string; badge?: string }[] = [
    { id: 'off', label: 'Desativado', desc: 'Sem sobreposição na tela' },
    { id: 'instagram', label: 'Instagram (Reels)', desc: 'Botões laterais, legenda e grid 4:5', badge: 'Reels' },
    { id: 'tiktok', label: 'TikTok', desc: 'Avatar, botões e área de texto', badge: 'TikTok' },
    { id: 'both', label: 'Ambos (Sobreposição)', desc: 'Guia combinada de área 100% segura', badge: 'Multi' },
  ];

  const currentSafeZoneLabel = safeZoneOptions.find(o => o.id === safeZoneMode)?.label || 'Safe Zone';

  return (
    <div className="flex flex-col gap-2.5 p-3.5 bg-white rounded-2xl border-2 border-neutral-300 mt-2.5 max-w-4xl mx-auto w-full select-none shadow-sm">
      {/* 1. BARRA DE TEMPO / PROGRESSO */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-black text-neutral-900 w-16 text-right shrink-0">
          {formatTimecode(currentTime)}
        </span>

        <input
          type="range"
          min="0"
          max={duration || 10}
          step="0.01"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-neutral-300 rounded-lg cursor-pointer accent-neutral-900"
        />

        <span className="text-xs font-mono font-bold text-neutral-600 w-16 text-left shrink-0">
          {formatTimecode(duration)}
        </span>
      </div>

      {/* 2. BARRA DE BOTÕES PRINCIPAIS DE REPRODUÇÃO */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-200">
        {/* Left: Play/Pause, Rewind, Forward, Volume */}
        <div className="flex items-center gap-2">
          {/* Rewind -2s */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 2))}
            title="Voltar 2s (Seta Esquerda)"
            className="p-2 rounded-xl text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 transition active:scale-95 border border-neutral-300 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Big Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            title="Play / Pause (Espaço)"
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white flex items-center gap-2 shadow-sm transition transform active:scale-95 text-xs font-extrabold"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Forward +2s */}
          <button
            onClick={() => onSeek(Math.min(duration, currentTime + 2))}
            title="Avançar 2s (Seta Direita)"
            className="p-2 rounded-xl text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 transition active:scale-95 border border-neutral-300 shadow-sm"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 ml-1 bg-neutral-100 px-2.5 py-1.5 rounded-xl border border-neutral-300">
            <button
              onClick={onToggleMute}
              className="p-0.5 rounded text-neutral-800 hover:text-black transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-neutral-900" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-neutral-300 cursor-pointer accent-neutral-900"
            />
          </div>
        </div>

        {/* Center: Aspect Ratio Toggle */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-300 gap-1">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio}
              onClick={() => onAspectRatioChange(ratio)}
              className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${
                aspectRatio === ratio
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>

        {/* Right: Speed, Safezone 4-Option Dropdown & Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Speed Selector */}
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-900 font-mono font-extrabold border border-neutral-300 transition"
              title="Velocidade de Reprodução"
            >
              <Gauge className="w-3.5 h-3.5 text-neutral-800" />
              <span>{playbackRate}x</span>
            </button>
            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:flex flex-col bg-white border-2 border-neutral-300 rounded-xl p-1 shadow-xl z-30 min-w-[80px]">
              {speeds.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onPlaybackRateChange(rate)}
                  className={`px-2.5 py-1.5 text-xs font-bold text-left rounded-lg ${
                    playbackRate === rate ? 'bg-neutral-900 text-white font-extrabold' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Safe Zones 4-Option Custom Popover Dropdown */}
          <div className="relative" ref={safeZoneRef}>
            <button
              type="button"
              onClick={() => setIsSafeZoneDropdownOpen(!isSafeZoneDropdownOpen)}
              title="Guias de Safe Zone e Sobreposição"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition border shadow-sm ${
                safeZoneMode !== 'off'
                  ? 'bg-neutral-900 text-white border-neutral-900 font-black'
                  : 'text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 border-neutral-300'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${safeZoneMode !== 'off' ? 'text-emerald-400' : 'text-neutral-700'}`} />
              <span className="text-xs font-black">
                {safeZoneMode === 'off' ? 'Safe Zone' : currentSafeZoneLabel.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isSafeZoneDropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border-2 border-neutral-900 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1">
                <div className="flex items-center justify-between px-2.5 py-1 border-b border-neutral-200 text-xs font-black uppercase tracking-wider text-neutral-900">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-neutral-900" />
                    <span>Guias de Safe Zone</span>
                  </div>
                  <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded font-mono font-bold">4 opções</span>
                </div>

                {safeZoneOptions.map((opt) => {
                  const isSelected = safeZoneMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onSafeZoneChange(opt.id);
                        setIsSafeZoneDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-left transition transform active:scale-98 ${
                        isSelected
                          ? 'bg-neutral-100 border-2 border-neutral-900 text-neutral-950 font-black shadow-sm'
                          : 'hover:bg-neutral-50 border-2 border-transparent text-neutral-800'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-neutral-900">{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[9px] font-mono font-bold bg-neutral-200 text-neutral-700 px-1.5 py-0.2 rounded">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">{opt.desc}</span>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#22c55e] text-white flex items-center justify-center shrink-0 shadow-sm ring-1 ring-emerald-300">
                          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title="Tela Cheia"
            className="p-2 rounded-xl text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 transition shadow-sm"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
