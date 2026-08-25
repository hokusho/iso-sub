import React, { useState, useEffect, useRef } from 'react';
import { Pipette, Hash, Check } from 'lucide-react';

// 36 Criteriosamente selecionadas: Flat UI + Viral TikTok Pops + Pastéis + Tons Neutros
export const COLOR_PALETTE_36 = [
  // Linha 1: Cores Virais / Pops Ultrabrilhantes
  '#FFE600', '#00F0FF', '#22C55E', '#FF007F', '#FF5E3A', '#A855F7',
  // Linha 2: Flat UI Clássico (Vibrante)
  '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6', '#F1C40F', '#E74C3C',
  // Linha 3: Flat UI Clássico (Profundo)
  '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#F39C12', '#C0392B',
  // Linha 4: Tons Pastéis & Neons Suaves
  '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#F78C6C', '#8338EC',
  // Linha 5: Tons Suaves / Modernos
  '#F87171', '#FB923C', '#FBBF24', '#4ADE80', '#38BDF8', '#818CF8',
  // Linha 6: Monocromáticos, Cinzas & Preto/Branco
  '#FFFFFF', '#F3F4F6', '#9CA3AF', '#4B5563', '#1F2937', '#000000'
];

interface ColorPickerPopoverProps {
  color: string;
  label: string;
  disabled?: boolean;
  align?: 'left' | 'right';
  onChange: (newColor: string) => void;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 0,
      g: parseInt(clean[1] + clean[1], 16) || 0,
      b: parseInt(clean[2] + clean[2], 16) || 0
    };
  }
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(isNaN(v) ? 0 : v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  label,
  disabled = false,
  align = 'left',
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentColor = color?.startsWith('#') ? color.toUpperCase() : '#FFFFFF';
  const rgb = hexToRgb(currentColor);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleHexInput = (rawVal: string) => {
    const clean = rawVal.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
    onChange(clean ? '#' + clean : '#');
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: string) => {
    const num = parseInt(val, 10);
    const clamped = isNaN(num) ? 0 : Math.max(0, Math.min(255, num));
    const newRgb = { ...rgb, [channel]: clamped };
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  // EyeDropper API support
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          onChange(result.sRGBHex.toUpperCase());
        }
      } catch {
        // User canceled pipette
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Botão de Disparo do Popover com Swatch e HEX */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 border-neutral-400 cursor-pointer shadow-sm hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: currentColor }}
          title={`Selecionar ${label}`}
        />

        {/* Input HEX Direto */}
        <div className="flex-1 flex items-center bg-white border border-neutral-300 rounded-lg px-2 py-1.5 shadow-sm">
          <Hash className="w-3.5 h-3.5 text-neutral-500 mr-0.5" />
          <input
            type="text"
            disabled={disabled}
            value={currentColor.replace('#', '').slice(0, 6)}
            onChange={(e) => handleHexInput(e.target.value)}
            maxLength={6}
            placeholder="FFFFFF"
            className="w-full bg-transparent text-xs font-mono uppercase text-neutral-900 font-black focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Botão Conta-gotas Rápido */}
        {'EyeDropper' in window && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleEyeDropper}
            title="Conta-gotas (Capturar cor da tela)"
            className="p-2 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 transition active:scale-95 shadow-sm disabled:opacity-50"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Dropdown com Painel 6x6 Cores Fixas + RGB + HEX */}
      {isOpen && !disabled && (
        <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-2 bg-white border-2 border-neutral-900 rounded-2xl p-3.5 shadow-2xl z-50 w-72 flex flex-col gap-3`}>
          {/* Header com Preview e Conta-gotas */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg border-2 border-neutral-400 shadow-sm shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <div className="flex flex-col">
                <span className="text-xs font-black text-neutral-900">{label}</span>
                <span className="text-[11px] font-mono font-bold text-neutral-600">{currentColor}</span>
              </div>
            </div>

            {'EyeDropper' in window && (
              <button
                type="button"
                onClick={handleEyeDropper}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 transition active:scale-95 shadow-sm"
              >
                <Pipette className="w-3.5 h-3.5 text-neutral-900" />
                <span>Conta-gotas</span>
              </button>
            )}
          </div>

          {/* PAINEL DE 6X6 CORES FIXAS (36 CORES CLICÁVEIS) */}
          <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-neutral-100 rounded-xl border border-neutral-200">
            {COLOR_PALETTE_36.map((c) => {
                const isSelected = currentColor.toLowerCase() === c.toLowerCase();
                const isLight = c === '#FFFFFF' || c === '#F3F4F6' || c === '#FFE600' || c === '#F1C40F' || c === '#00F0FF' || c === '#FFD166';

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    title={c}
                    style={{ backgroundColor: c }}
                    className={`h-7 rounded-lg transition transform active:scale-90 flex items-center justify-center border ${
                      isSelected
                        ? 'border-neutral-950 ring-2 ring-neutral-950 scale-105 shadow-md z-10'
                        : 'border-black/15 hover:scale-105 shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[3] ${isLight ? 'text-black' : 'text-white'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

          {/* VALORES RGB E HEX SEMPRE VISÍVEIS E EDITÁVEIS */}
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200">
            {/* Linha HEX */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-neutral-700 font-mono w-10">HEX:</span>
              <div className="flex-1 flex items-center bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1 shadow-inner">
                <Hash className="w-3.5 h-3.5 text-neutral-500 mr-1" />
                <input
                  type="text"
                  value={currentColor.replace('#', '').slice(0, 6)}
                  onChange={(e) => handleHexInput(e.target.value)}
                  maxLength={6}
                  placeholder="FFFFFF"
                  className="w-full bg-transparent text-xs font-mono uppercase text-neutral-900 font-black focus:outline-none"
                />
              </div>
            </div>

            {/* Linha RGB (R, G, B) */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-black text-neutral-700 font-mono w-10">RGB:</span>
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                {/* Red */}
                <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-lg px-1.5 py-1">
                  <span className="text-[10px] font-mono font-bold text-red-600 mr-1">R</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.r}
                    onChange={(e) => handleRgbChange('r', e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-neutral-900 font-black focus:outline-none text-right"
                  />
                </div>

                {/* Green */}
                <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-lg px-1.5 py-1">
                  <span className="text-[10px] font-mono font-bold text-green-600 mr-1">G</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.g}
                    onChange={(e) => handleRgbChange('g', e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-neutral-900 font-black focus:outline-none text-right"
                  />
                </div>

                {/* Blue */}
                <div className="flex items-center bg-neutral-50 border border-neutral-300 rounded-lg px-1.5 py-1">
                  <span className="text-[10px] font-mono font-bold text-blue-600 mr-1">B</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.b}
                    onChange={(e) => handleRgbChange('b', e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-neutral-900 font-black focus:outline-none text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
