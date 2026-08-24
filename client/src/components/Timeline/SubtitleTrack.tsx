import React, { useState } from 'react';
import { SubtitleBlock } from '../../types';

interface SubtitleTrackProps {
  blocks: SubtitleBlock[];
  duration: number;
  zoom: number;
  trackWidth: number;
  currentTime: number;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onUpdateBlockTiming: (blockId: string, newStart: number, newEnd: number) => void;
  onSeek: (time: number) => void;
}

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({
  blocks,
  duration,
  zoom,
  trackWidth,
  currentTime,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlockTiming,
  onSeek
}) => {
  const [dragging, setDragging] = useState<{
    type: 'move' | 'resize-left' | 'resize-right';
    blockId: string;
    initialX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const timeToPx = (time: number) => (duration > 0 ? (time / duration) * trackWidth : 0);
  const pxToTime = (px: number) => (trackWidth > 0 ? (px / trackWidth) * duration : 0);

  const handleMouseDown = (
    e: React.MouseEvent,
    block: SubtitleBlock,
    type: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    onSelectBlock(block.id);

    setDragging({
      type,
      blockId: block.id,
      initialX: e.clientX,
      initialStart: block.start,
      initialEnd: block.end
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - e.clientX;
      const deltaTime = pxToTime(deltaX);

      if (type === 'move') {
        const blockDur = block.end - block.start;
        const newStart = Math.max(0, Math.min(duration - blockDur, block.start + deltaTime));
        const newEnd = newStart + blockDur;
        onUpdateBlockTiming(block.id, newStart, newEnd);
      } else if (type === 'resize-left') {
        const newStart = Math.max(0, Math.min(block.end - 0.1, block.start + deltaTime));
        onUpdateBlockTiming(block.id, newStart, block.end);
      } else if (type === 'resize-right') {
        const newEnd = Math.max(block.start + 0.1, Math.min(duration, block.end + deltaTime));
        onUpdateBlockTiming(block.id, block.start, newEnd);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative h-14 w-full">
      {blocks.map((block, idx) => {
        const left = timeToPx(block.start);
        const width = Math.max(24, timeToPx(block.end) - left);
        const isActive = currentTime >= block.start && currentTime <= block.end;
        const isSelected = selectedBlockId === block.id;

        const prevBlock = idx > 0 ? blocks[idx - 1] : null;
        const nextBlock = idx < blocks.length - 1 ? blocks[idx + 1] : null;
        const isOverlapping = Boolean((nextBlock && block.end > nextBlock.start + 0.02) || (prevBlock && block.start < prevBlock.end - 0.02));

        return (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(block.id);
              onSeek(block.start);
            }}
            style={{ left: `${left}px`, width: `${width}px` }}
            className={`absolute top-1 bottom-1 rounded-lg flex items-center justify-between px-2 cursor-grab active:cursor-grabbing select-none transition-all ${
              isActive
                ? 'bg-slate-900 text-white font-bold border-2 border-slate-950 shadow-md'
                : isSelected
                ? 'bg-slate-800 text-white font-semibold border-2 border-slate-700 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm'
            }`}
          >
            {/* Left resize handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, block, 'resize-left')}
              className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 bg-black/10 hover:bg-black/20 cursor-ew-resize rounded-l-lg transition-all"
            />

            {/* Block Content */}
            <span className="truncate text-xs px-1 pointer-events-none font-medium">
              {block.text || '...'}
            </span>

            {/* Right resize handle */}
            <div
              onMouseDown={(e) => handleMouseDown(e, block, 'resize-right')}
              className="absolute right-0 top-0 bottom-0 w-2 hover:w-3 bg-white/20 hover:bg-white/40 cursor-ew-resize rounded-r-lg transition-all"
            />
          </div>
        );
      })}
    </div>
  );
};
