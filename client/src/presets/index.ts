import { Preset, SubtitleStyle } from '../types';

export const DEFAULT_STYLE: SubtitleStyle = {
  presetName: 'Destaque Animado',
  fontFamily: 'Montserrat',
  fontSize: 20,
  lineHeight: 1.2,
  letterSpacing: 1,
  caseTransform: 'uppercase',
  textColor: '#FFFFFF',
  highlightColor: '#FFE600', // Viral Yellow
  secondaryColor: '#22C55E',
  strokeColor: '#000000',
  strokeWidth: 3,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowDistance: 0,
  useBackgroundBox: false,
  boxColor: '#000000',
  boxOpacity: 0.75,
  boxPaddingX: 16,
  boxPaddingY: 8,
  boxRadius: 12,
  useWordHighlightBox: false,
  wordHighlightBoxColor: '#A855F7',
  wordHighlightBoxTextColor: '#FFFFFF',
  wordHighlightBoxRadius: 6,
  wordHighlightBoxPaddingX: 6,
  wordHighlightBoxPaddingY: 2,
  positionY: 74, // 74% from top (optimal 9:16 safe zone)
  positionX: 50,
  alignment: 'center',
  maxWidthPercent: 70,
  animationType: 'pop',
  animationScale: 1.18,
  animationDurationMs: 120,
  wordsPerLine: 3,
  maxLines: 1,
};

export const PRESETS: Preset[] = [
  {
    id: 'so-texto',
    name: 'Só Texto',
    description: 'Texto limpo, estático e direto sem animações',
    category: 'clean',
    previewBadge: '📝 Clean',
    style: {
      presetName: 'Só Texto',
      fontFamily: 'Montserrat',
      fontSize: 20,
      fontWeight: 800,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FFFFFF',
      useHighlight: false,
      useWordHighlightBox: false,
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: false,
      animationType: 'none',
      positionY: 74,
    }
  },
  {
    id: 'destaque-animado',
    name: 'Destaque Animado',
    description: 'Palavra ativa em amarelo vibrante com animação Pop',
    category: 'viral',
    previewBadge: '🔥 Pop',
    style: {
      presetName: 'Destaque Animado',
      fontFamily: 'Montserrat',
      fontSize: 20,
      fontWeight: 800,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FFE600',
      useHighlight: true,
      useWordHighlightBox: false,
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: false,
      animationType: 'pop',
      animationScale: 1.18,
      positionY: 74,
    }
  },
  {
    id: 'karaoke',
    name: 'Karaokê',
    description: 'Destaque progressivo e contínuo palavra por palavra',
    category: 'karaoke',
    previewBadge: '🎤 Karaokê',
    style: {
      presetName: 'Karaokê',
      fontFamily: 'Montserrat',
      fontSize: 20,
      fontWeight: 800,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#22C55E',
      useHighlight: true,
      useWordHighlightBox: false,
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: false,
      animationType: 'karaoke',
      positionY: 74,
    }
  },
  {
    id: 'caixa-destaque',
    name: 'Caixa Destaque',
    description: 'Caixa sólida roxa atrás da palavra ativa com texto branco',
    category: 'viral',
    previewBadge: '🏷️ Caixa',
    style: {
      presetName: 'Caixa Destaque',
      fontFamily: 'Montserrat',
      fontSize: 20,
      fontWeight: 800,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FFFFFF',
      useHighlight: true,
      useWordHighlightBox: true,
      wordHighlightBoxColor: '#A855F7',
      wordHighlightBoxRadius: 6,
      wordHighlightBoxPaddingX: 6,
      wordHighlightBoxPaddingY: 2,
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: false,
      animationType: 'none',
      positionY: 74,
    }
  }
];

export interface GoogleFontOption {
  name: string;
  label: string;
  tagline: string;
  category: 'sans-serif' | 'display' | 'serif';
  weights: number[]; // e.g. [400, 600, 700, 800, 900]
}

export const GOOGLE_FONTS_LIST: GoogleFontOption[] = [
  {
    name: 'Montserrat',
    label: 'Montserrat',
    tagline: 'O padrão ouro dos vídeos virais (Hormozi / Reels)',
    category: 'sans-serif',
    weights: [400, 600, 700, 800, 900]
  },
  {
    name: 'Anton',
    label: 'Anton',
    tagline: 'Fonte ultra pesada e marcante (Estilo MrBeast)',
    category: 'display',
    weights: [900]
  },
  {
    name: 'Bebas Neue',
    label: 'Bebas Neue',
    tagline: 'Condensada e vertical para grande impacto visual',
    category: 'display',
    weights: [700]
  },
  {
    name: 'Poppins',
    label: 'Poppins',
    tagline: 'Geométrica e amigável, muito usada no TikTok',
    category: 'sans-serif',
    weights: [400, 600, 700, 800, 900]
  },
  {
    name: 'Inter',
    label: 'Inter',
    tagline: 'Ultra nítida, clean e altamente legível em qualquer tela',
    category: 'sans-serif',
    weights: [400, 600, 700, 800, 900]
  },
  {
    name: 'Oswald',
    label: 'Oswald',
    tagline: 'Clássica do YouTube e Shorts, excelente proporção',
    category: 'sans-serif',
    weights: [400, 600, 700]
  },
  {
    name: 'Rubik',
    label: 'Rubik',
    tagline: 'Cantos suaves e visual moderno para vídeos dinâmicos',
    category: 'sans-serif',
    weights: [400, 600, 700, 800, 900]
  },
  {
    name: 'Syne',
    label: 'Syne',
    tagline: 'Visual futurista e sofisticado (Estilo Submagic / IA)',
    category: 'sans-serif',
    weights: [700, 800]
  },
  {
    name: 'Archivo Black',
    label: 'Archivo Black',
    tagline: 'Bloco sólido e encorpado para títulos expressivos',
    category: 'display',
    weights: [900]
  },
  {
    name: 'Roboto',
    label: 'Roboto',
    tagline: 'Neutro, balanceado e perfeito para estilo podcast',
    category: 'sans-serif',
    weights: [400, 500, 700, 900]
  }
];
