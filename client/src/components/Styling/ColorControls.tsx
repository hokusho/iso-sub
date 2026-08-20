import React from 'react';
import { SubtitleStyle } from '../../types';
import { Palette, Hash, Sparkles, Type } from 'lucide-react';

interface ColorControlsProps {
  style: SubtitleStyle;
  onChange: (updated: Partial<SubtitleStyle>) => void;
}

export const ColorControls: React.FC<ColorControlsProps> = ({ style, onChange }) => {
  // Paleta vibrante para palavra de destaque
  const highlightPalette = [
    { name: 'Amarelo Viral', color: '#FFE600' },
    { name: 'Verde Eletrizante', color: '#22C55E' },
    { name: 'Ciano Neon', color: '#00F0FF' },
    { name: 'Rosa Shock', color: '#FF007F' },
    { name: 'Laranja Fogo', color: '#F97316' },
    { name: 'Roxo Submagic', color: '#C084FC' },
    { name: 'Vermelho Alerta', color: '#EF4444' },
    { name: 'Azul Celeste', color: '#38BDF8' }
  ];

  // Paleta elegante para o texto base / padrão
  const textPalette = [
    { name: 'Branco Puro', color: '#FFFFFF' },
    { name: 'Preto Profundo', color: '#000000' },
    { name: 'Cinza Claro', color: '#CBD5E1' },
    { name: 'Cinza Médio', color: '#64748B' },
    { name: 'Creme Suave', color: '#FEF3C7' },
    { name: 'Amarelo Claro', color: '#FDE047' },
    { name: 'Azul Gelo', color: '#E0F2FE' },
    { name: 'Grafite', color: '#1E293B' }
  ];

  const handleHexChange = (key: 'highlightColor' | 'textColor', rawVal: string) => {
    const cleanHex = rawVal.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
    onChange({ [key]: cleanHex ? '#' + cleanHex : '#' });
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2.5 text-base font-black uppercase tracking-wider text-slate-900">
          <Palette className="w-5 h-5 text-slate-800" />
          <span>Cores & Destaque</span>
        </div>
        <span className="text-xs text-slate-800 font-mono font-bold bg-[#e2e8f0] px-3 py-1 rounded-lg border border-slate-300">Código Hash (#HEX)</span>
      </div>

      {/* 1. CAIXA DA PALAVRA ATIVA (DESTAQUE) */}
      <div className="flex flex-col gap-3.5 bg-[#e2e8f0] p-4 rounded-2xl border-2 border-slate-300 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-900" />
            <label className="text-sm font-black text-slate-900">
              Palavra Ativa (Destaque)
            </label>
          </div>
          <span className="text-xs text-slate-900 font-mono font-black bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-sm">
            {style.highlightColor?.toUpperCase() || '#FFE600'}
          </span>
        </div>

        {/* Color Swatch & Hash Input */}
        <div className="flex items-center gap-3">
          {/* Swatch Picker */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 border-slate-400 shadow-sm cursor-pointer hover:scale-105 transition">
            <input
              type="color"
              value={style.highlightColor?.startsWith('#') ? style.highlightColor : '#FFE600'}
              onChange={(e) => onChange({ highlightColor: e.target.value.toUpperCase() })}
              className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer opacity-100 border-0"
            />
          </div>

          {/* Hash Input */}
          <div className="flex-1 min-w-0 flex items-center bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 focus-within:border-slate-900 transition shadow-sm">
            <Hash className="w-4 h-4 text-slate-600 shrink-0 mr-1" />
            <input
              type="text"
              value={style.highlightColor?.replace('#', '').slice(0, 6) || 'FFE600'}
              onChange={(e) => handleHexChange('highlightColor', e.target.value)}
              maxLength={6}
              placeholder="FFE600"
              className="w-full bg-transparent text-sm font-mono uppercase text-slate-900 focus:outline-none tracking-wider font-black"
            />
          </div>
        </div>

        {/* Paleta Rápida da Palavra Destaque */}
        <div className="mt-1">
          <span className="text-xs text-slate-800 block mb-2 font-black">
            Paleta Rápida de Destaque:
          </span>
          <div className="grid grid-cols-8 gap-2">
            {highlightPalette.map((p) => {
              const isSelected = style.highlightColor?.toLowerCase() === p.color.toLowerCase();
              return (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => onChange({ highlightColor: p.color })}
                  title={`${p.name} (${p.color})`}
                  style={{ backgroundColor: p.color }}
                  className={`h-9 rounded-xl transition transform hover:scale-110 border-2 ${
                    isSelected
                      ? 'border-slate-950 ring-2 ring-slate-950 scale-105 shadow-md'
                      : 'border-slate-400 hover:border-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. CAIXA DO TEXTO PADRÃO */}
      <div className="flex flex-col gap-3.5 bg-[#e2e8f0] p-4 rounded-2xl border-2 border-slate-300 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-slate-900" />
            <label className="text-sm font-black text-slate-900">
              Texto Padrão
            </label>
          </div>
          <span className="text-xs text-slate-900 font-mono font-black bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-sm">
            {style.textColor?.toUpperCase() || '#FFFFFF'}
          </span>
        </div>

        {/* Color Swatch & Hash Input */}
        <div className="flex items-center gap-3">
          {/* Swatch Picker */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 border-slate-400 shadow-sm cursor-pointer hover:scale-105 transition">
            <input
              type="color"
              value={style.textColor?.startsWith('#') ? style.textColor : '#FFFFFF'}
              onChange={(e) => onChange({ textColor: e.target.value.toUpperCase() })}
              className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer opacity-100 border-0"
            />
          </div>

          {/* Hash Input */}
          <div className="flex-1 min-w-0 flex items-center bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 focus-within:border-slate-900 transition shadow-sm">
            <Hash className="w-4 h-4 text-slate-600 shrink-0 mr-1" />
            <input
              type="text"
              value={style.textColor?.replace('#', '').slice(0, 6) || 'FFFFFF'}
              onChange={(e) => handleHexChange('textColor', e.target.value)}
              maxLength={6}
              placeholder="FFFFFF"
              className="w-full bg-transparent text-sm font-mono uppercase text-slate-900 focus:outline-none tracking-wider font-black"
            />
          </div>
        </div>

        {/* Paleta Rápida do Texto Padrão */}
        <div className="mt-1">
          <span className="text-xs text-slate-800 block mb-2 font-black">
            Paleta Rápida de Texto Padrão:
          </span>
          <div className="grid grid-cols-8 gap-2">
            {textPalette.map((p) => {
              const isSelected = style.textColor?.toLowerCase() === p.color.toLowerCase();
              return (
                <button
                  key={p.color}
                  type="button"
                  onClick={() => onChange({ textColor: p.color })}
                  title={`${p.name} (${p.color})`}
                  style={{ backgroundColor: p.color }}
                  className={`h-9 rounded-xl transition transform hover:scale-110 border-2 ${
                    isSelected
                      ? 'border-slate-950 ring-2 ring-slate-950 scale-105 shadow-md'
                      : 'border-slate-400 hover:border-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
