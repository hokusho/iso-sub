import React from 'react';
import { SubtitleStyle, AnimationType } from '../../types';
import { Sparkles } from 'lucide-react';

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
        shadowBlur: (style.shadowBlur !== undefined && style.shadowBlur >= 0) ? style.shadowBlur : 0,
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

      {/* Lista de Sub Cards de Efeitos */}
      <div className="flex flex-col gap-2.5">
        {/* 1. Sub Card: Animação */}
        <div className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 transition ${
          isAnimationEnabled ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-50/80 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-neutral-900">Animação</span>
              <button
                type="button"
                onClick={() => handleToggleAnimation(!isAnimationEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center cursor-pointer shadow-inner ${
                  isAnimationEnabled ? 'bg-emerald-500' : 'bg-neutral-300'
                }`}
                title={isAnimationEnabled ? 'Desativar Animação' : 'Ativar Animação'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                    isAnimationEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
              isAnimationEnabled 
                ? 'text-neutral-900 bg-white border-neutral-300' 
                : 'text-neutral-500 bg-neutral-200/60 border-neutral-200'
            }`}>
              {isAnimationEnabled 
                ? (style.animationType === 'pop' ? `Pop ${Math.round((style.animationScale ?? 1.18) * 100)}%` : style.animationType === 'karaoke' ? 'Karaoke' : 'Só Cor')
                : 'OFF'
              }
            </span>
          </div>

          {isAnimationEnabled && (
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'pop', label: 'Pop (Zoom)' },
                  { value: 'color-change', label: 'Só Cor' },
                  { value: 'karaoke', label: 'Karaoke' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ animationType: opt.value as AnimationType })}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      style.animationType === opt.value
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {style.animationType === 'pop' && (
                <div className="flex flex-col gap-1 pt-1.5 border-t border-neutral-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                    <span>Intensidade do Pop (Zoom)</span>
                    <span className="font-mono font-black text-neutral-950">{Math.round((style.animationScale ?? 1.18) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.05"
                    max="1.25"
                    step="0.01"
                    value={style.animationScale ?? 1.18}
                    onChange={(e) => onChange({ animationScale: parseFloat(e.target.value) })}
                    className="w-full h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Sub Card: Contorno */}
        <div className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 transition ${
          isStrokeEnabled ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-50/80 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-neutral-900">Contorno</span>
              <button
                type="button"
                onClick={() => handleToggleStroke(!isStrokeEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center cursor-pointer shadow-inner ${
                  isStrokeEnabled ? 'bg-emerald-500' : 'bg-neutral-300'
                }`}
                title={isStrokeEnabled ? 'Desativar Contorno' : 'Ativar Contorno'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                    isStrokeEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
              isStrokeEnabled 
                ? 'text-neutral-900 bg-white border-neutral-300' 
                : 'text-neutral-500 bg-neutral-200/60 border-neutral-200'
            }`}>
              {isStrokeEnabled ? `${style.strokeWidth}px` : 'OFF'}
            </span>
          </div>

          {isStrokeEnabled && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-200">
              <span className="text-xs font-bold text-neutral-700 min-w-[70px]">Espessura</span>
              <input
                type="range"
                min="2"
                max="20"
                step="1"
                value={style.strokeWidth}
                onChange={(e) => onChange({ strokeWidth: parseInt(e.target.value, 10) })}
                className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
              />
              <span className="text-xs font-mono font-black text-neutral-900 w-9 text-center">{style.strokeWidth}px</span>
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
        </div>

        {/* 3. Sub Card: Sombra */}
        <div className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 transition ${
          isShadowEnabled ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-50/80 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-neutral-900">Sombra</span>
              <button
                type="button"
                onClick={() => handleToggleShadow(!isShadowEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center cursor-pointer shadow-inner ${
                  isShadowEnabled ? 'bg-emerald-500' : 'bg-neutral-300'
                }`}
                title={isShadowEnabled ? 'Desativar Sombra' : 'Ativar Sombra'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                    isShadowEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
              isShadowEnabled 
                ? 'text-neutral-900 bg-white border-neutral-300' 
                : 'text-neutral-500 bg-neutral-200/60 border-neutral-200'
            }`}>
              {isShadowEnabled ? `${style.shadowBlur ?? 0}px blur` : 'OFF'}
            </span>
          </div>

          {isShadowEnabled && (
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-neutral-700 min-w-[70px]">Desfoque</span>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={style.shadowBlur ?? 0}
                  onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value, 10) })}
                  className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-neutral-900 w-9 text-center">
                  {style.shadowBlur ?? 0}px
                </span>
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-neutral-400 cursor-pointer shadow-sm">
                  <input
                    type="color"
                    value={style.shadowColor?.startsWith('#') ? style.shadowColor : '#000000'}
                    onChange={(e) => onChange({ shadowColor: e.target.value.toUpperCase() })}
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200/60">
                <span className="text-xs font-bold text-neutral-700 min-w-[70px]">Distância</span>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={style.shadowDistance ?? 4}
                  onChange={(e) => onChange({ shadowDistance: parseInt(e.target.value, 10) })}
                  className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-neutral-900 w-9 text-center">
                  {style.shadowDistance ?? 4}px
                </span>
                <div className="w-8 shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* 4. Sub Card: Caixa de Fundo do Bloco */}
        <div className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 transition ${
          isBoxEnabled ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-50/80 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-neutral-900">Caixa de Fundo (Bloco)</span>
              <button
                type="button"
                onClick={() => handleToggleBox(!isBoxEnabled)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center cursor-pointer shadow-inner ${
                  isBoxEnabled ? 'bg-emerald-500' : 'bg-neutral-300'
                }`}
                title={isBoxEnabled ? 'Desativar Caixa de Fundo' : 'Ativar Caixa de Fundo'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                    isBoxEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
              isBoxEnabled 
                ? 'text-neutral-900 bg-white border-neutral-300' 
                : 'text-neutral-500 bg-neutral-200/60 border-neutral-200'
            }`}>
              {isBoxEnabled ? `${Math.round((style.boxOpacity || 0.85) * 100)}%` : 'OFF'}
            </span>
          </div>

          {isBoxEnabled && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-200">
              <span className="text-xs font-bold text-neutral-700 min-w-[70px]">Opacidade</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={style.boxOpacity || 0.85}
                onChange={(e) => onChange({ boxOpacity: parseFloat(e.target.value) })}
                className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
              />
              <span className="text-xs font-mono font-black text-neutral-900 w-11 text-center">
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

        {/* 5. Sub Card: Caixa Destaque na Palavra (Word Highlight Box) */}
        <div className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 transition ${
          style.useWordHighlightBox ? 'bg-neutral-100 border-neutral-300' : 'bg-neutral-50/80 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black text-neutral-900">Caixa Destaque na Palavra</span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !style.useWordHighlightBox;
                  onChange({
                    useWordHighlightBox: nextVal,
                    ...(nextVal ? { animationType: 'none' } : {})
                  });
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center cursor-pointer shadow-inner ${
                  style.useWordHighlightBox ? 'bg-emerald-500' : 'bg-neutral-300'
                }`}
                title={style.useWordHighlightBox ? 'Desativar Caixa Destaque' : 'Ativar Caixa Destaque'}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
                    style.useWordHighlightBox ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${
              style.useWordHighlightBox 
                ? 'text-neutral-900 bg-white border-neutral-300' 
                : 'text-neutral-500 bg-neutral-200/60 border-neutral-200'
            }`}>
              {style.useWordHighlightBox ? 'ON' : 'OFF'}
            </span>
          </div>

          {style.useWordHighlightBox && (
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-neutral-700 min-w-[70px]">Arredondado</span>
                <input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={style.wordHighlightBoxRadius ?? 8}
                  onChange={(e) => onChange({ wordHighlightBoxRadius: parseInt(e.target.value, 10) })}
                  className="flex-1 h-2.5 bg-neutral-300 rounded-lg accent-neutral-900 cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-neutral-900 w-11 text-center">
                  {style.wordHighlightBoxRadius ?? 8}px
                </span>
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-neutral-400 cursor-pointer shadow-sm">
                  <input
                    type="color"
                    value={style.wordHighlightBoxColor || style.highlightColor || '#7C3AED'}
                    onChange={(e) => onChange({ wordHighlightBoxColor: e.target.value.toUpperCase(), highlightColor: e.target.value.toUpperCase() })}
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
