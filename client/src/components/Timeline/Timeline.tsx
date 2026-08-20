import React, { useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Scissors,
  Merge,
  Trash2,
  Plus
} from 'lucide-react';
import { SubtitleBlock } from '../../types';
import { WaveformTrack } from './WaveformTrack';
import { SubtitleTrack } from './SubtitleTrack';
import { formatTimeShort, formatTimecode } from '../../utils/timeFormat';

interface TimelineProps {
  blocks: SubtitleBlock[];
  duration: number;
  currentTime: number;
  waveformPeaks: number[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlockTiming: (blockId: string, newStart: number, newEnd: number) => void;
  onSplitBlock: (blockId: string, splitTime: number) => void;
  onMergeBlocks: (firstBlockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: (startTime: number) => void;
  onSeek: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  blocks,
  duration,
  currentTime,
  waveformPeaks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlockTiming,
  onSplitBlock,
  onMergeBlocks,
  onDeleteBlock,
  onAddBlock,
  onSeek
}) => {
  const [zoom, setZoom] = useState<number>(1.5);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const totalWidth = Math.max(containerWidth, containerWidth * zoom);
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const playheadX = totalWidth * progressRatio;

  // Handle timeline track click to seek
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickTime = Math.max(0, Math.min(duration, (clickX / totalWidth) * duration));
    onSeek(clickTime);
  };

  // Keyboard shortcut Ctrl+K or S to split
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSplitCurrent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleSplitCurrent = () => {
    const currentBlock = blocks.find(b => currentTime > b.start && currentTime < b.end);
    if (currentBlock) {
      onSplitBlock(currentBlock.id, currentTime);
    }
  };

  const handleMergeCurrent = () => {
    if (selectedBlockId) {
      onMergeBlocks(selectedBlockId);
    }
  };

  const handleDeleteCurrent = () => {
    if (selectedBlockId) {
      onDeleteBlock(selectedBlockId);
      onSelectBlock(null);
    }
  };

  const renderRulerTicks = () => {
    const ticks = [];
    const step = zoom > 2 ? 1 : zoom > 1 ? 2 : 5;
    for (let time = 0; time <= duration; time += step) {
      const x = (time / duration) * totalWidth;
      ticks.push(
        <div
          key={time}
          style={{ left: `${x}px` }}
          className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
        >
          <div className="w-px h-2 bg-slate-300" />
          <span className="text-[10px] font-mono text-slate-500 mt-0.5 select-none font-medium">
            {formatTimeShort(time)}
          </span>
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 gap-2 flex-wrap">
        {/* Left Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSplitCurrent}
            title="Dividir Legenda no Playhead (Ctrl+K)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 border border-slate-200 transition active:scale-95 shadow-sm"
          >
            <Scissors className="w-3.5 h-3.5 text-slate-700" />
            <span>Dividir</span>
          </button>

          <button
            onClick={handleMergeCurrent}
            disabled={!selectedBlockId}
            title="Mesclar com próximo bloco"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-800 border border-slate-200 transition active:scale-95 shadow-sm"
          >
            <Merge className="w-3.5 h-3.5 text-slate-700" />
            <span>Mesclar</span>
          </button>

          <button
            onClick={handleDeleteCurrent}
            disabled={!selectedBlockId}
            title="Excluir bloco selecionado (Del)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 text-xs font-bold text-slate-800 border border-slate-200 transition active:scale-95 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-700" />
            <span>Excluir</span>
          </button>

          <button
            onClick={() => onAddBlock(currentTime)}
            title="Adicionar bloco no tempo atual"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-xs font-bold text-white transition active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Bloco</span>
          </button>
        </div>

        {/* Right: Zoom and Timecode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
              className="p-1 text-slate-600 hover:text-black rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-800 w-10 text-center">{zoom.toFixed(1)}x</span>
            <button
              onClick={() => setZoom(Math.min(5, zoom + 0.5))}
              className="p-1 text-slate-600 hover:text-black rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {formatTimecode(currentTime)}
          </div>
        </div>
      </div>

      {/* Scrollable Tracks Area */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden mt-2.5 select-none"
        style={{ height: '145px' }}
      >
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{ width: `${totalWidth}px` }}
          className="relative h-full cursor-pointer bg-slate-100 rounded-xl overflow-hidden border border-slate-200"
        >
          {/* Top Ruler */}
          <div className="relative h-6 border-b border-slate-200 bg-slate-50">
            {renderRulerTicks()}
          </div>

          {/* Subtitle Track */}
          <div className="relative h-14 border-b border-slate-200 bg-slate-100">
            <SubtitleTrack
              blocks={blocks}
              duration={duration}
              zoom={zoom}
              trackWidth={totalWidth}
              currentTime={currentTime}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
              onUpdateBlockTiming={onUpdateBlockTiming}
              onSeek={onSeek}
            />
          </div>

          {/* Audio Waveform Track */}
          <div className="relative h-14 bg-slate-100">
            <WaveformTrack
              peaks={waveformPeaks}
              duration={duration}
              zoom={zoom}
              currentTime={currentTime}
              width={totalWidth}
            />
          </div>

          {/* Playhead Needle */}
          <div
            style={{ left: `${playheadX}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 pointer-events-none z-30 shadow-md"
          >
            <div className="w-3.5 h-3.5 bg-slate-900 rounded-full -ml-[6px] -mt-1 shadow-md border-2 border-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
