import React from 'react';
import { SubtitleStyle } from '../../types';
import { Type, Check, Bold, Sparkles } from 'lucide-react';
import { GOOGLE_FONTS_LIST } from '../../presets';

interface FontControlsProps {
  style: SubtitleStyle;
  onChange: (updated: Partial<SubtitleStyle>) => void;
}

export const FontControls: React.FC<FontControlsProps> = ({ style, onChange }) => {
  // Find current selected font metadata
  const currentFontMeta = GOOGLE_FONTS_LIST.find((f) => f.name.toLowerCase() === style.fontFamily?.toLowerCase()) || GOOGLE_FONTS_LIST[0];
  const currentWeight = Number(style.fontWeight) || 800;

  const weightLabels: Record<number, string> = {
    400: 'Regular (400)',
    500: 'Médio (500)',
    600: 'Semibold (600)',
    700: 'Bold (700)',
    800: 'Extra Bold (800)',
    900: 'Black (900)'
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm select-none">
      <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2.5 text-base font-black uppercase tracking-wider text-slate-900">
          <Type className="w-5 h-5 text-slate-800" />
          <span>Tipografia & 10 Fontes Virais</span>
        </div>
        <span className="text-xs font-mono font-black text-slate-900 bg-[#e2e8f0] px-3 py-1 rounded-lg border border-slate-300 shadow-sm">
          {style.fontSize}px • Peso {currentWeight}
        </span>
      </div>

      {/* 1. SELETOR VISUAL DE FONTES (GRID COM PREVIEW REAL) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-black text-slate-900">
            Escolha a Tipografia Visualmente (10 Fontes)
          </label>
          <span className="text-xs text-slate-600 font-bold">Visualização em tempo real</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 bg-[#e2e8f0] p-2.5 rounded-2xl border-2 border-slate-300 shadow-inner">
          {GOOGLE_FONTS_LIST.map((f) => {
            const isSelected = style.fontFamily?.toLowerCase() === f.name.toLowerCase();

            return (
              <button
                key={f.name}
                type="button"
                onClick={() => {
                  // If switching font, adjust weight to closest available weight
                  const newWeight = f.weights.includes(currentWeight) ? currentWeight : f.weights[f.weights.length - 1];
                  onChange({ fontFamily: f.name, fontWeight: newWeight });
                }}
                className={`flex flex-col p-3 rounded-xl border-2 transition-all text-left group active:scale-[0.98] ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-950 shadow-md ring-2 ring-slate-900'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {/* Header: Name and Check */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {f.label}
                  </span>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>

                {/* Real Live Visual Sample in the exact typeface */}
                <div
                  className="py-1.5 px-2 rounded-lg my-1 flex items-center justify-center text-center overflow-hidden"
                  style={{
                    fontFamily: `"${f.name}", sans-serif`,
                    backgroundColor: isSelected ? '#1e293b' : '#f1f5f9'
                  }}
                >
                  <span
                    className="text-base font-black truncate tracking-wide"
                    style={{
                      fontFamily: `"${f.name}", sans-serif`,
                      color: isSelected ? '#ffffff' : '#0f172a'
                    }}
                  >
                    Ag Legendas Pro
                  </span>
                </div>

                {/* Subtitle / Tagline */}
                <span className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {f.tagline}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTROLE DE PESO DA FONTE (FONT WEIGHT) */}
      <div className="flex flex-col gap-2 bg-[#e2e8f0] p-4 rounded-2xl border-2 border-slate-300 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bold className="w-4 h-4 text-slate-900" />
            <label className="text-sm font-black text-slate-900">
              Peso da Fonte (Espessura / Boldness)
            </label>
          </div>
          <span className="text-xs font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300 shadow-sm">
            {weightLabels[currentWeight] || `${currentWeight}`}
          </span>
        </div>

        {currentFontMeta.weights.length > 1 ? (
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {currentFontMeta.weights.map((w) => {
              const isSelected = currentWeight === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChange({ fontWeight: w })}
                  className={`py-2 px-2 rounded-xl text-xs font-black border transition shadow-sm ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-1 ring-slate-900'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-[#cbd5e1]'
                  }`}
                  style={{ fontWeight: w }}
                >
                  {weightLabels[w] || `${w}`}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-2.5 rounded-xl border border-slate-300 text-center">
            <span className="text-xs font-black text-slate-800">
              Esta fonte possui peso único e fixo de alto impacto ({weightLabels[currentFontMeta.weights[0]] || 'Ultra Bold'}).
            </span>
          </div>
        )}
      </div>

      {/* 3. TAMANHO DA FONTE */}
      <div className="flex flex-col gap-2 bg-[#e2e8f0] p-4 rounded-2xl border-2 border-slate-300 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-slate-900">Tamanho da Legenda</span>
          <span className="font-mono text-slate-900 text-sm font-black bg-white px-2.5 py-0.5 rounded border border-slate-300">{style.fontSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="96"
          step="1"
          value={style.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
          className="w-full mt-1.5 h-3 bg-[#cbd5e1] rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-700 font-mono font-bold mt-0.5">
          <span>5px (Mínimo)</span>
          <span>54px (Padrão)</span>
          <span>96px (Máximo)</span>
        </div>
      </div>

      {/* 4. TRANSFORMAÇÃO DE TEXTO (MAIÚSCULAS / MINÚSCULAS) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-black text-slate-900">Transformação de Texto</label>
        <div className="grid grid-cols-4 gap-2 bg-[#e2e8f0] p-2 rounded-2xl border-2 border-slate-300">
          {[
            { id: 'uppercase', label: 'ABC (Alta)' },
            { id: 'lowercase', label: 'abc (Baixa)' },
            { id: 'capitalize', label: 'Abc (Título)' },
            { id: 'none', label: 'Normal' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange({ caseTransform: item.id as any })}
              className={`py-2.5 text-xs font-black rounded-xl transition shadow-sm ${
                style.caseTransform === item.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-800 hover:text-black hover:bg-[#cbd5e1] border border-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
