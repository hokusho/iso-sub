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
  const currentY = style.positionY ?? 72;
  const currentX = style.positionX ?? 50;

  return (
    <div className="flex flex-col gap-3.5 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2.5">
        <div className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-neutral-900">
          <MoveVertical className="w-5 h-5 text-neutral-800" />
          <span>Posição & Layout da Legenda</span>
        </div>
        <span className="text-xs text-neutral-900 bg-neutral-200 px-2.5 py-0.5 rounded-lg font-mono font-black border border-neutral-300">
          Y: {currentY}% • X: {currentX}%
        </span>
      </div>

      {/* Grid de 2 Colunas: Altura (Y) e Posição Horizontal (X) Lado a Lado */}
      <div className="grid grid-cols-2 gap-3">
        {/* Coluna 1: Altura Vertical (Y) */}
        <div className="flex flex-col gap-2 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MoveVertical className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Altura (Y)</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => onChange({ positionY: Math.min(95, currentY + 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Descer (Base)"
              >
                -
              </button>
              <span className="w-9 text-center text-xs font-mono font-black text-neutral-900">{currentY}%</span>
              <button
                type="button"
                onClick={() => onChange({ positionY: Math.max(5, currentY - 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Subir (Topo)"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="range"
            min="10"
            max="90"
            step="1"
            value={100 - currentY}
            onChange={(e) => onChange({ positionY: 100 - parseInt(e.target.value, 10) })}
            className="w-full h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
          />

          <div className="grid grid-cols-4 gap-1">
            {[
              { label: 'Base', val: 82 },
              { label: 'Seguro', val: 72 },
              { label: 'Centro', val: 50 },
              { label: 'Topo', val: 18 }
            ].map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => onChange({ positionY: q.val })}
                className={`py-1 text-[10px] font-black rounded-lg border transition truncate ${
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

        {/* Coluna 2: Posição Horizontal (X) */}
        <div className="flex flex-col gap-2 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MoveHorizontal className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Horizontal (X)</span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => onChange({ positionX: Math.max(10, currentX - 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Esquerda"
              >
                -
              </button>
              <span className="w-9 text-center text-xs font-mono font-black text-neutral-900">{currentX}%</span>
              <button
                type="button"
                onClick={() => onChange({ positionX: Math.min(90, currentX + 1) })}
                className="w-6 h-6 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-900 text-xs font-black"
                title="Direita"
              >
                +
              </button>
            </div>
          </div>

          <input
            type="range"
            min="20"
            max="80"
            step="1"
            value={currentX}
            onChange={(e) => onChange({ positionX: parseInt(e.target.value, 10) })}
            className="w-full h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
          />

          {/* Quick X button: Centro */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onChange({ positionX: 50 })}
              className={`px-3 py-1 text-[10px] font-black rounded-lg border transition shadow-sm ${
                currentX >= 48 && currentX <= 52 ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-200'
              }`}
            >
              Centro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
