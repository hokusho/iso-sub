import React, { useState, useEffect, useRef } from 'react';
import { SubtitleStyle, CaseTransform } from '../../types';
import { Type, Sparkles, ChevronDown, Check } from 'lucide-react';
import { GOOGLE_FONTS_LIST } from '../../presets';
import { ColorPickerPopover, COLOR_PALETTE_36 } from './ColorPickerPopover';

interface TypographyColorControlsProps {
  style: SubtitleStyle;
  onChange: (updated: Partial<SubtitleStyle>) => void;
}

export const TypographyColorControls: React.FC<TypographyColorControlsProps> = ({
  style,
  onChange
}) => {
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isWeightDropdownOpen, setIsWeightDropdownOpen] = useState(false);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);

  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const weightDropdownRef = useRef<HTMLDivElement>(null);
  const caseDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(target)) {
        setIsFontDropdownOpen(false);
      }
      if (weightDropdownRef.current && !weightDropdownRef.current.contains(target)) {
        setIsWeightDropdownOpen(false);
      }
      if (caseDropdownRef.current && !caseDropdownRef.current.contains(target)) {
        setIsCaseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentFontMeta =
    GOOGLE_FONTS_LIST.find((f) => f.name.toLowerCase() === style.fontFamily?.toLowerCase()) ||
    GOOGLE_FONTS_LIST[0];

  const currentWeight = Number(style.fontWeight) || 800;

  const weightLabels: Record<number, string> = {
    400: 'Regular',
    500: 'Médio',
    600: 'Semibold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black'
  };

  const caseOptions: { id: CaseTransform; label: string; example: string; desc: string }[] = [
    { id: 'uppercase', label: 'ABC', example: 'LEGENDA', desc: 'Tudo em maiúsculas' },
    { id: 'lowercase', label: 'abc', example: 'legenda', desc: 'Tudo em minúsculas' },
    { id: 'capitalize', label: 'Abc', example: 'Legenda', desc: 'Iniciais maiúsculas' },
    { id: 'none', label: 'Normal', example: 'Normal', desc: 'Sem alteração' }
  ];

  const currentCaseOption = caseOptions.find((c) => c.id === style.caseTransform) || caseOptions[0];

  // Quick 6 top trending swatches for active highlight
  const quickHighlightSwatches = ['#FFE600', '#22C55E', '#00F0FF', '#FF007F', '#FF5E3A', '#A855F7'];

  // Quick 6 top swatches for base text
  const quickTextSwatches = ['#FFFFFF', '#000000', '#F3F4F6', '#9CA3AF', '#FDE047', '#FEF3C7'];

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl border-2 border-neutral-300 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2.5">
        <div className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-neutral-900">
          <Type className="w-5 h-5 text-neutral-800" />
          <span>Tipografia & Cores</span>
        </div>
        <span className="text-xs text-neutral-900 bg-neutral-200 px-2.5 py-0.5 rounded-lg font-mono font-black border border-neutral-300">
          {currentFontMeta.label} • {weightLabels[currentWeight] || currentWeight}
        </span>
      </div>

      {/* 1. SELETOR DE FONTE VISUAL EM DROPDOWN COMPACTO */}
      <div ref={fontDropdownRef} className="flex flex-col gap-1.5 relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-neutral-900">Fonte da Legenda (10 Opções Virais)</label>
          <span className="text-[11px] text-neutral-600 font-bold">{currentFontMeta.tagline}</span>
        </div>

        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => {
            setIsFontDropdownOpen(!isFontDropdownOpen);
            setIsWeightDropdownOpen(false);
            setIsCaseDropdownOpen(false);
          }}
          className="flex items-center justify-between bg-neutral-100 hover:bg-neutral-200 border-2 border-neutral-300 rounded-xl px-3.5 py-2.5 transition shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="text-base font-black text-neutral-950"
              style={{ fontFamily: `"${currentFontMeta.name}", sans-serif`, fontWeight: currentWeight }}
            >
              {currentFontMeta.label}
            </span>
            <span
              className="text-xs font-black text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-300 truncate"
              style={{ fontFamily: `"${currentFontMeta.name}", sans-serif`, fontWeight: currentWeight }}
            >
              Ag Preview
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-800">
            <span className="text-xs font-bold">Trocar Fonte</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFontDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu Modal/Popover */}
        {isFontDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-neutral-400 rounded-2xl p-2 shadow-2xl z-40 max-h-64 overflow-y-auto grid grid-cols-2 gap-2">
            {GOOGLE_FONTS_LIST.map((f) => {
              const isSelected = style.fontFamily?.toLowerCase() === f.name.toLowerCase();

              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => {
                    const newWeight = f.weights.includes(currentWeight) ? currentWeight : f.weights[f.weights.length - 1];
                    onChange({ fontFamily: f.name, fontWeight: newWeight });
                    setIsFontDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition text-left ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                      : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-900'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-1">
                    <span
                      className="text-sm font-black truncate"
                      style={{ fontFamily: `"${f.name}", sans-serif` }}
                    >
                      {f.label}
                    </span>
                    <span className={`text-[10px] truncate ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {f.tagline}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. GRID COMPACTO LADO A LADO: PESO VISUAL + TAMANHO + CAIXA DO TEXTO COM DROPDOWN VISUAL */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Dropdown Visual de Peso da Fonte */}
        <div ref={weightDropdownRef} className="flex flex-col gap-1 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300 relative">
          <span className="text-xs font-black text-neutral-900">Peso (Weight)</span>
          
          <button
            type="button"
            onClick={() => {
              setIsWeightDropdownOpen(!isWeightDropdownOpen);
              setIsFontDropdownOpen(false);
              setIsCaseDropdownOpen(false);
            }}
            className="w-full bg-white hover:bg-neutral-50 border-2 border-neutral-300 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs text-neutral-900 shadow-sm transition"
          >
            <span
              className="truncate font-bold"
              style={{
                fontFamily: `"${currentFontMeta.name}", sans-serif`,
                fontWeight: currentWeight
              }}
            >
              {weightLabels[currentWeight] || `${currentWeight}`}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-700 transition-transform ${isWeightDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Visual Weight Dropdown Popover */}
          {isWeightDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border-2 border-neutral-400 rounded-xl p-1.5 shadow-2xl z-40 min-w-[200px] flex flex-col gap-1">
              {currentFontMeta.weights.map((w) => {
                const isSelected = currentWeight === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      onChange({ fontWeight: w });
                      setIsWeightDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm px-1.5 py-0.5 rounded bg-white/20 border border-black/10"
                        style={{
                          fontFamily: `"${currentFontMeta.name}", sans-serif`,
                          fontWeight: w
                        }}
                      >
                        Ag
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          fontFamily: `"${currentFontMeta.name}", sans-serif`,
                          fontWeight: w
                        }}
                      >
                        {weightLabels[w] || `${w}`}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tamanho da Fonte */}
        <div className="flex flex-col gap-1 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-900">Tamanho</span>
            <span className="text-xs font-mono font-black text-neutral-900">{style.fontSize}px</span>
          </div>
          <input
            type="range"
            min="5"
            max="96"
            step="1"
            value={style.fontSize}
            onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
            className="w-full mt-1.5 h-2 bg-neutral-300 rounded-lg accent-neutral-900"
          />
        </div>

        {/* Dropdown Visual de Caixa do Texto (Maiúsculas / Minúsculas) */}
        <div ref={caseDropdownRef} className="flex flex-col gap-1 bg-neutral-100 p-2.5 rounded-xl border-2 border-neutral-300 relative">
          <span className="text-xs font-black text-neutral-900">Caixa do Texto</span>
          
          <button
            type="button"
            onClick={() => {
              setIsCaseDropdownOpen(!isCaseDropdownOpen);
              setIsFontDropdownOpen(false);
              setIsWeightDropdownOpen(false);
            }}
            className="w-full bg-white hover:bg-neutral-50 border-2 border-neutral-300 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs text-neutral-900 shadow-sm transition"
          >
            <span className="font-black truncate">
              {currentCaseOption.label}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-700 transition-transform ${isCaseDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Visual Case Dropdown Popover */}
          {isCaseDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border-2 border-neutral-400 rounded-xl p-1.5 shadow-2xl z-40 min-w-[210px] flex flex-col gap-1">
              {caseOptions.map((opt) => {
                const isSelected = (style.caseTransform || 'uppercase') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange({ caseTransform: opt.id });
                      setIsCaseDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${
                      isSelected
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-1.5 py-0.5 rounded bg-white/20 border border-black/10">
                        {opt.example}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-black">{opt.label}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>{opt.desc}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. CORES COM DROP 6X6, CONTA-GOTAS, RGB E HEX */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-neutral-200">
        {/* Coluna 1: Palavra Destaque (Ativa) */}
        <div className={`flex flex-col gap-2.5 p-3 rounded-xl border-2 transition ${
          style.useHighlight !== false
            ? 'bg-neutral-100 border-neutral-300'
            : 'bg-neutral-50 border-neutral-200 opacity-75'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Palavra Destaque</span>
            </div>

            {/* Toggle Switch: Ativado / Desativado */}
            <button
              type="button"
              onClick={() => onChange({ useHighlight: style.useHighlight === false ? true : false })}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black transition active:scale-95 border ${
                style.useHighlight !== false
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-neutral-200 text-neutral-600 border-neutral-300 hover:bg-neutral-300'
              }`}
            >
              {style.useHighlight !== false && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{style.useHighlight !== false ? 'Ativado' : 'Desativado'}</span>
            </button>
          </div>

          {style.useHighlight !== false ? (
            <>
              {/* Custom Popover Picker com Grade 6x6 + Conta-gotas + RGB + HEX */}
              <ColorPickerPopover
                color={style.highlightColor || '#FFE600'}
                label="Palavra Destaque"
                onChange={(c) => onChange({ highlightColor: c })}
              />

              {/* Mini Swatches de Atalho */}
              <div className="grid grid-cols-6 gap-1 mt-0.5">
                {quickHighlightSwatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ highlightColor: c })}
                    style={{ backgroundColor: c }}
                    className={`h-5 rounded-md border transition ${
                      style.highlightColor?.toLowerCase() === c.toLowerCase()
                        ? 'border-neutral-950 ring-2 ring-neutral-950 scale-110'
                        : 'border-neutral-400 hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="py-3 px-2 bg-white rounded-lg border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center">
              <span className="text-[11px] text-neutral-600 font-bold">
                Destaque Desativado
              </span>
              <span className="text-[10px] text-neutral-500">
                Todas as palavras usam a cor do Texto Base.
              </span>
            </div>
          )}
        </div>

        {/* Coluna 2: Texto Padrão (Base) */}
        <div className="flex flex-col gap-2.5 bg-neutral-100 p-3 rounded-xl border-2 border-neutral-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Type className="w-4 h-4 text-neutral-900" />
              <span className="text-xs font-black text-neutral-900">Texto Base</span>
            </div>
            <span className="text-[11px] font-mono font-black text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-300">
              {style.textColor?.toUpperCase() || '#FFFFFF'}
            </span>
          </div>

          {/* Custom Popover Picker com Grade 6x6 + Conta-gotas + RGB + HEX */}
          <ColorPickerPopover
            color={style.textColor || '#FFFFFF'}
            label="Texto Base"
            onChange={(c) => onChange({ textColor: c })}
          />

          {/* Mini Swatches de Atalho */}
          <div className="grid grid-cols-6 gap-1 mt-0.5">
            {quickTextSwatches.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ textColor: c })}
                style={{ backgroundColor: c }}
                className={`h-5 rounded-md border transition ${
                  style.textColor?.toLowerCase() === c.toLowerCase()
                    ? 'border-neutral-950 ring-2 ring-neutral-950 scale-110'
                    : 'border-neutral-400 hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
