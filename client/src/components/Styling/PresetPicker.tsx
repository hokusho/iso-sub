import React, { useState } from 'react';
import { SubtitleStyle, Preset } from '../../types';
import { PRESETS } from '../../presets';
import { Sparkles, Check, Type, Mic, Flame } from 'lucide-react';

interface PresetPickerProps {
  currentStyle: SubtitleStyle;
  onSelectPreset: (preset: Preset) => void;
}

export const PresetPicker: React.FC<PresetPickerProps> = ({
  currentStyle,
  onSelectPreset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'clean' | 'karaoke' | 'viral'>('all');

  const categories = [
    { id: 'all', label: 'Todos', icon: Sparkles },
    { id: 'clean', label: 'Só Texto', icon: Type },
    { id: 'karaoke', label: 'Karaokê', icon: Mic },
    { id: 'viral', label: 'Virais', icon: Flame },
  ];

  const filteredPresets = PRESETS.filter((preset: Preset) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'clean') return preset.category === 'clean' || preset.category === 'simple';
    return preset.category === selectedCategory;
  });

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2.5">
        <div className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-neutral-900">
          <Sparkles className="w-5 h-5 text-neutral-800" />
          <span>Biblioteca de Estilos</span>
        </div>
        <span className="text-xs text-neutral-900 bg-neutral-200 px-2.5 py-0.5 rounded-lg font-mono font-black border border-neutral-300">
          {filteredPresets.length} presets
        </span>
      </div>

      {/* Category Filter Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-neutral-100 p-1.5 rounded-xl border border-neutral-300">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`py-2 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Presets List with Neutral Gray Preview Boxes */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[580px] overflow-y-auto p-1.5">
        {filteredPresets.map((preset: Preset) => {
          const isSelected = currentStyle.presetName === preset.name;
          const st = preset.style;

          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col p-3.5 rounded-xl cursor-pointer transition transform active:scale-[0.99] gap-2 ${
                isSelected
                  ? 'bg-neutral-100 border-[2.5px] border-neutral-950 shadow-md ring-2 ring-neutral-950/20 text-neutral-900'
                  : 'bg-white hover:bg-neutral-50 border-2 border-neutral-300 text-neutral-900'
              }`}
            >
              {/* Top Row: Title and Check Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-neutral-900">
                    {preset.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-md ring-2 ring-emerald-300">
                      <Check className="w-4 h-4 stroke-[3.5]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-300 bg-white" />
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-600 font-medium">
                {preset.description}
              </p>

              {/* Caixa Demonstrativa em Cinza Neutro 50% (#808080) */}
              <div className="w-full rounded-xl py-3 px-4 flex items-center justify-center bg-[#808080] border border-[#6b7280] shadow-inner overflow-hidden">
                <div
                  className="flex items-center gap-1.5 text-center font-extrabold tracking-wide px-3 py-1 rounded-lg"
                  style={{
                    backgroundColor: st.useBackgroundBox ? (st.boxColor || '#000000') : 'transparent',
                    fontFamily: st.fontFamily ? `"${st.fontFamily}", sans-serif` : 'Montserrat, sans-serif',
                    textTransform: st.caseTransform === 'uppercase' ? 'uppercase' : 'none'
                  }}
                >
                  <span
                    style={{
                      color: st.textColor || '#FFFFFF',
                      textShadow: st.strokeWidth ? `0 0 4px ${st.strokeColor || '#000000'}` : undefined
                    }}
                    className="text-sm font-extrabold"
                  >
                    PALAVRA
                  </span>
                  <span
                    style={{
                      color: st.highlightColor || '#FFE600',
                      textShadow: st.strokeWidth ? `0 0 6px ${st.strokeColor || '#000000'}` : undefined
                    }}
                    className="text-sm font-black scale-105 inline-block"
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
