import React from 'react';
import { SubtitleStyle, Preset } from '../../types';
import { PRESETS } from '../../presets';
import { Sparkles, Check } from 'lucide-react';

interface PresetPickerProps {
  currentStyle: SubtitleStyle;
  onSelectPreset: (preset: Preset) => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({
  currentStyle,
  onSelectPreset
}) => {
  return (
    <div className="flex flex-col gap-2.5 p-3.5 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
        <div className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wider text-neutral-900">
          <Sparkles className="w-4 h-4 text-neutral-800" />
          <span>Modelos de Estilo</span>
        </div>
        <span className="text-[11px] text-neutral-800 bg-neutral-200 px-2 py-0.5 rounded-md font-mono font-bold border border-neutral-300">
          {PRESETS.length} Modelos
        </span>
      </div>

      {/* Lista com Rolagem (Exibe ~2 estilos por vez de forma fina e elegante) */}
      <div className="flex flex-col gap-2 max-h-[185px] overflow-y-auto pr-1 pb-0.5">
        {PRESETS.map((preset: Preset) => {
          const isSelected = currentStyle.presetName === preset.name;
          const st = preset.style;

          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col p-2 rounded-xl cursor-pointer transition transform active:scale-[0.99] gap-1.5 ${
                isSelected
                  ? 'bg-neutral-100 border-2 border-neutral-950 shadow-sm ring-1 ring-neutral-950/20'
                  : 'bg-white hover:bg-neutral-50 border border-neutral-300'
              }`}
            >
              {/* Linha 1: Nome do Modelo + Indicador */}
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-neutral-900">
                    {preset.previewBadge} {preset.name}
                  </span>
                </div>

                <div className="flex items-center">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-neutral-300 bg-white" />
                  )}
                </div>
              </div>

              {/* Linha 2: Barra Fina de Demonstração */}
              <div className="w-full rounded-lg py-1 px-3 flex items-center justify-center bg-[#737373] border border-[#525252] shadow-inner overflow-hidden">
                <div
                  className="flex items-center gap-1.5 text-center font-extrabold tracking-wide"
                  style={{
                    backgroundColor: st.useBackgroundBox ? (st.boxColor || '#000000') : 'transparent',
                    fontFamily: st.fontFamily ? `"${st.fontFamily}", sans-serif` : 'Montserrat, sans-serif',
                    textTransform: st.caseTransform === 'uppercase' ? 'uppercase' : 'none'
                  }}
                >
                  <span
                    style={{
                      color: st.textColor || '#FFFFFF',
                      textShadow: st.strokeWidth ? `0 0 3px ${st.strokeColor || '#000000'}` : undefined
                    }}
                    className="text-xs font-extrabold"
                  >
                    PALAVRA
                  </span>
                  <span
                    style={{
                      color: st.highlightColor || '#FFE600',
                      backgroundColor: st.useWordHighlightBox ? (st.wordHighlightBoxColor || '#7C3AED') : 'transparent',
                      padding: st.useWordHighlightBox ? '1px 6px' : undefined,
                      borderRadius: st.useWordHighlightBox ? `${st.wordHighlightBoxRadius || 4}px` : undefined,
                      textShadow: (!st.useWordHighlightBox && st.strokeWidth) ? `0 0 4px ${st.strokeColor || '#000000'}` : undefined
                    }}
                    className={`text-xs font-black inline-block ${st.useWordHighlightBox ? 'shadow-xs' : 'scale-105'}`}
                  >
                    DESTAQUE
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
