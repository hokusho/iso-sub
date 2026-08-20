import React from 'react';
import { SubtitleStyle, AnimationType } from '../../types';
import { Sparkles, Square, Sun, Layers, Zap } from 'lucide-react';

interface EffectsControlsProps {
  style: SubtitleStyle;
  onChange: (updated: Partial<SubtitleStyle>) => void;
}

export const EffectsControls: React.FC<EffectsControlsProps> = ({ style, onChange }) => {
  const isStrokeEnabled = (style.strokeWidth ?? 0) > 0;
  const isShadowEnabled = ((style.shadowBlur ?? 0) > 0) || ((style.shadowDistance ?? 0) > 0);
  const isAnimationEnabled = style.animationType !== 'none';
  const isBoxEnabled = Boolean(style.useBackgroundBox);

  const handleToggleStroke = (checked: boolean) => {
    if (checked) {
      onChange({
        strokeWidth: (style.strokeWidth && style.strokeWidth > 0) ? style.strokeWidth : 8,
        strokeColor: style.strokeColor || '#000000'
      });
    } else {
      onChange({ strokeWidth: 0 });
    }
  };

  const handleToggleShadow = (checked: boolean) => {
    if (checked) {
      onChange({
        shadowBlur: (style.shadowBlur && style.shadowBlur > 0) ? style.shadowBlur : 6,
        shadowDistance: (style.shadowDistance && style.shadowDistance > 0) ? style.shadowDistance : 4,
        shadowColor: style.shadowColor || '#000000'
      });
    } else {
      onChange({ shadowBlur: 0, shadowDistance: 0 });
    }
  };

  const handleToggleAnimation = (checked: boolean) => {
    if (checked) {
      onChange({
        animationType: 'pop',
        animationScale: (style.animationScale && style.animationScale > 1) ? style.animationScale : 1.2
      });
    } else {
      onChange({ animationType: 'none', animationScale: 1.0 });
    }
  };

  const handleToggleBox = (checked: boolean) => {
    onChange({
      useBackgroundBox: checked,
      boxColor: style.boxColor || '#000000',
      boxOpacity: style.boxOpacity || 0.85,
      boxRadius: style.boxRadius || 14
    });
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2.5">
        <div className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-neutral-900">
          <Sparkles className="w-5 h-5 text-neutral-800" />
          <span>Efeitos & Animações</span>
        </div>
        <span className="text-xs text-neutral-900 bg-neutral-200 px-2.5 py-0.5 rounded-lg font-mono font-black border border-neutral-300">
          Personalização
        </span>
      </div>

      {/* 4 Toggles ON/OFF no LADO ESQUERDO */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. Toggle Animação Pop */}
        <button
          type="button"
          onClick={() => handleToggleAnimation(!isAnimationEnabled)}
          className={`flex items-center justify-between p-3 rounded-xl border-2 transition text-left cursor-pointer shadow-sm ${
            isAnimationEnabled
              ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-900'
              : 'bg-white hover:bg-neutral-50 border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center shadow-inner ${
                isAnimationEnabled ? 'bg-[#22c55e]' : 'bg-neutral-300'
              }`}
              style={{ width: '44px', height: '24px', minWidth: '44px' }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isAnimationEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Zap className="w-4 h-4 text-neutral-900 shrink-0" />
              <span className="text-xs font-black text-neutral-900 truncate">1. Animação Pop</span>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded shrink-0 ml-1 ${
            isAnimationEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {isAnimationEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 2. Toggle Contorno */}
        <button
          type="button"
          onClick={() => handleToggleStroke(!isStrokeEnabled)}
          className={`flex items-center justify-between p-3 rounded-xl border-2 transition text-left cursor-pointer shadow-sm ${
            isStrokeEnabled
              ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-900'
              : 'bg-white hover:bg-neutral-50 border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center shadow-inner ${
                isStrokeEnabled ? 'bg-[#22c55e]' : 'bg-neutral-300'
              }`}
              style={{ width: '44px', height: '24px', minWidth: '44px' }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isStrokeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Layers className="w-4 h-4 text-neutral-900 shrink-0" />
              <span className="text-xs font-black text-neutral-900 truncate">2. Contorno</span>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded shrink-0 ml-1 ${
            isStrokeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {isStrokeEnabled ? `${style.strokeWidth}px` : 'OFF'}
          </span>
        </button>

        {/* 3. Toggle Sombra */}
        <button
          type="button"
          onClick={() => handleToggleShadow(!isShadowEnabled)}
          className={`flex items-center justify-between p-3 rounded-xl border-2 transition text-left cursor-pointer shadow-sm ${
            isShadowEnabled
              ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-900'
              : 'bg-white hover:bg-neutral-50 border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center shadow-inner ${
                isShadowEnabled ? 'bg-[#22c55e]' : 'bg-neutral-300'
              }`}
              style={{ width: '44px', height: '24px', minWidth: '44px' }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isShadowEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Sun className="w-4 h-4 text-neutral-900 shrink-0" />
              <span className="text-xs font-black text-neutral-900 truncate">3. Sombra</span>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded shrink-0 ml-1 ${
            isShadowEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {isShadowEnabled ? `${style.shadowBlur}px` : 'OFF'}
          </span>
        </button>

        {/* 4. Toggle Caixa de Fundo */}
        <button
          type="button"
          onClick={() => handleToggleBox(!isBoxEnabled)}
          className={`flex items-center justify-between p-3 rounded-xl border-2 transition text-left cursor-pointer shadow-sm ${
            isBoxEnabled
              ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-900'
              : 'bg-white hover:bg-neutral-50 border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center shadow-inner ${
                isBoxEnabled ? 'bg-[#22c55e]' : 'bg-neutral-300'
              }`}
              style={{ width: '44px', height: '24px', minWidth: '44px' }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                  isBoxEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <Square className="w-4 h-4 text-neutral-900 shrink-0" />
              <span className="text-xs font-black text-neutral-900 truncate">4. Caixa Fundo</span>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded shrink-0 ml-1 ${
            isBoxEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
          }`}>
            {isBoxEnabled ? `${Math.round((style.boxOpacity || 0.85) * 100)}%` : 'OFF'}
          </span>
        </button>
      </div>

      {/* Painéis de Configuração dos Efeitos Ativos (com nomes correspondentes) */}
      <div className="flex flex-col gap-2.5">
        {/* 1. Painel da Animação Pop com Slider em Largura Total */}
        {isAnimationEnabled && (
          <div className="flex flex-col gap-2.5 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-neutral-900" />
                <span className="text-xs font-black text-neutral-900">1. Animação Pop</span>
              </div>
              <span className="text-[10px] font-mono font-black text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-300">
                {style.animationType === 'pop' ? `Escala ${Math.round((style.animationScale || 1.2) * 100)}%` : style.animationType}
              </span>
            </div>

            {/* Botões dos Tipos em Largura Total */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 'pop', label: '🚀 Pop (Zoom)' },
                { value: 'color-change', label: '🎤 Só Cor' },
                { value: 'karaoke', label: '✨ Karaoke' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ animationType: opt.value as AnimationType })}
                  className={`py-1.5 text-xs font-black rounded-lg border transition ${
                    style.animationType === opt.value
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                      : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Slider de Escala Pop em Largura Total Logo Abaixo */}
            {style.animationType === 'pop' && (
              <div className="flex flex-col gap-1 pt-1.5 border-t border-neutral-300">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                  <span>Intensidade do Pop (Zoom)</span>
                  <span className="font-mono font-black text-neutral-950">{Math.round((style.animationScale || 1.2) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1.05"
                  max="1.40"
                  step="0.05"
                  value={style.animationScale || 1.2}
                  onChange={(e) => onChange({ animationScale: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* 2. Painel do Contorno */}
        {isStrokeEnabled && (
          <div className="flex items-center justify-between gap-3 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300">
            <div className="flex items-center gap-1.5 min-w-[130px] shrink-0">
              <Layers className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">2. Contorno</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={style.strokeWidth}
              onChange={(e) => onChange({ strokeWidth: parseInt(e.target.value, 10) })}
              className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-neutral-900 w-10 text-center">{style.strokeWidth}px</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-neutral-400 cursor-pointer shadow-sm">
              <input
                type="color"
                value={style.strokeColor?.startsWith('#') ? style.strokeColor : '#000000'}
                onChange={(e) => onChange({ strokeColor: e.target.value.toUpperCase() })}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
              />
            </div>
          </div>
        )}

        {/* 3. Painel da Sombra */}
        {isShadowEnabled && (
          <div className="flex items-center justify-between gap-3 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300">
            <div className="flex items-center gap-1.5 min-w-[130px] shrink-0">
              <Sun className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">3. Sombra</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={style.shadowBlur || 4}
              onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value, 10) })}
              className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-neutral-900 w-10 text-center">{style.shadowBlur}px</span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-neutral-400 cursor-pointer shadow-sm">
              <input
                type="color"
                value={style.shadowColor?.startsWith('#') ? style.shadowColor : '#000000'}
                onChange={(e) => onChange({ shadowColor: e.target.value.toUpperCase() })}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
              />
            </div>
          </div>
        )}

        {/* 4. Painel da Caixa de Fundo */}
        {isBoxEnabled && (
          <div className="flex items-center justify-between gap-3 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300">
            <div className="flex items-center gap-1.5 min-w-[130px] shrink-0">
              <Square className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">4. Caixa Fundo</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={style.boxOpacity || 0.85}
              onChange={(e) => onChange({ boxOpacity: parseFloat(e.target.value) })}
              className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
            />
            <span className="text-xs font-mono font-black text-neutral-900 w-12 text-center">
              {Math.round((style.boxOpacity || 0.85) * 100)}%
            </span>
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-neutral-400 cursor-pointer shadow-sm">
              <input
                type="color"
                value={style.boxColor || '#000000'}
                onChange={(e) => onChange({ boxColor: e.target.value.toUpperCase() })}
                className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
