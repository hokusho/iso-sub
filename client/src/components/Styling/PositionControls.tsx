import React from 'react';
import { SubtitleStyle } from '../../types';
import { MoveVertical, MoveHorizontal } from 'lucide-react';

interface PositionControlsProps {
  style: SubtitleStyle;
  onChange: (updated: Partial<SubtitleStyle>) => void;
}

export const PositionControls: React.FC<PositionControlsProps> = ({
  style,
  onChange
}) => {
  const currentY = style.positionY ?? 74;
  const currentX = style.positionX ?? 50;

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
        <div className="flex items-center gap-1.5 text-xs lg:text-sm font-black uppercase tracking-wider text-neutral-900 shrink-0">
          <MoveVertical className="w-4 h-4 text-neutral-800 shrink-0" />
          <span>Posição & Layout</span>
        </div>
        <span className="text-[11px] text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded-md font-mono font-black border border-neutral-300 whitespace-nowrap shrink-0">
          Y: {currentY}% • X: {currentX}%
        </span>
      </div>

      {/* Grid de 2 Colunas Perfeitamente Dimensionadas */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Coluna 1: Vertical (Y) */}
        <div className="flex flex-col gap-2 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MoveVertical className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
              <span className="text-xs font-black text-neutral-900">Vertical (Y)</span>
            </div>
            <span className="text-xs font-mono font-black text-neutral-900 bg-white px-1.5 py-0.5 rounded-md border border-neutral-300 shadow-sm">
              {currentY}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={100 - currentY}
            onChange={(e) => onChange({ positionY: 100 - parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
          />

          <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Base', val: 82 },
              { label: 'Seguro', val: 74 },
              { label: 'Centro', val: 50 },
              { label: 'Topo', val: 18 }
            ].map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => onChange({ positionY: q.val })}
                className={`py-1 text-[10px] font-black rounded-md border transition text-center ${
                  Math.abs(currentY - q.val) <= 2
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coluna 2: Horizontal (X) */}
        <div className="flex flex-col gap-2 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MoveHorizontal className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
              <span className="text-xs font-black text-neutral-900">Horizontal (X)</span>
            </div>
            <span className="text-xs font-mono font-black text-neutral-900 bg-white px-1.5 py-0.5 rounded-md border border-neutral-300 shadow-sm">
              {currentX}%
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="80"
            step="1"
            value={currentX}
            onChange={(e) => onChange({ positionX: parseInt(e.target.value, 10) })}
            className="w-full h-2 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
          />

          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Esquerda', val: 35 },
              { label: 'Centro', val: 50 },
              { label: 'Direita', val: 65 }
            ].map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => onChange({ positionX: q.val })}
                className={`py-1 text-[10px] font-black rounded-md border transition text-center ${
                  Math.abs(currentX - q.val) <= 2
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
