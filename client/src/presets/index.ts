import { Preset, SubtitleStyle } from '../types';

export const DEFAULT_STYLE: SubtitleStyle = {
  presetName: 'Hormozi Viral',
  fontFamily: 'Montserrat',
  fontSize: 54,
  lineHeight: 1.2,
  letterSpacing: 1,
  caseTransform: 'uppercase',
  textColor: '#FFFFFF',
  highlightColor: '#FFDF00', // Viral Hormozi Yellow
  secondaryColor: '#22C55E', // Green accent
  strokeColor: '#000000',
  strokeWidth: 8,
  shadowColor: '#000000',
  shadowBlur: 4,
  shadowDistance: 4,
  useBackgroundBox: false,
  boxColor: '#000000',
  boxOpacity: 0.75,
  boxPaddingX: 16,
  boxPaddingY: 8,
  boxRadius: 12,
  positionY: 74, // 74% from top (optimal 9:16 safe zone)
  positionX: 50,
  alignment: 'center',
  maxWidthPercent: 85,
  animationType: 'pop',
  animationScale: 1.2,
  animationDurationMs: 120,
  wordsPerLine: 3,
  maxLines: 2,
};

export const PRESETS: Preset[] = [
  // --- CATEGORIA: VIRAIS & DINÂMICOS ---
  {
    id: 'hormozi',
    name: 'Hormozi Viral',
    description: 'Amarelo vibrante com efeito Pop Bounce de alta retenção',
    category: 'viral',
    previewBadge: '🔥 Viral',
    style: {
      presetName: 'Hormozi Viral',
      fontFamily: 'Montserrat',
      fontSize: 54,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FFE600',
      strokeColor: '#000000',
      strokeWidth: 8,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 4,
      useBackgroundBox: false,
      animationType: 'pop',
      animationScale: 1.2,
      positionY: 74,
    }
  },
  {
    id: 'mrbeast',
    name: 'MrBeast Impact',
    description: 'Fonte grossa impactante com contorno preto e verde neon',
    category: 'viral',
    previewBadge: '⚡ Impacto',
    style: {
      presetName: 'MrBeast Impact',
      fontFamily: 'Anton',
      fontSize: 58,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#22C55E',
      strokeColor: '#000000',
      strokeWidth: 10,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 6,
      useBackgroundBox: false,
      animationType: 'pop',
      animationScale: 1.22,
      positionY: 72,
    }
  },
  {
    id: 'submagic-magic',
    name: 'Submagic Roxo',
    description: 'Estilo moderno gradiente roxo e rosa em caixa alta',
    category: 'viral',
    previewBadge: '✨ Magic',
    style: {
      presetName: 'Submagic Roxo',
      fontFamily: 'Montserrat',
      fontSize: 52,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#C084FC',
      strokeColor: '#1E1B4B',
      strokeWidth: 8,
      shadowColor: '#A855F7',
      shadowBlur: 8,
      shadowDistance: 4,
      useBackgroundBox: false,
      animationType: 'pop',
      animationScale: 1.18,
      positionY: 74,
    }
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Ciano',
    description: 'Ciano elétrico com destaque magenta neon',
    category: 'neon',
    previewBadge: '🔮 Neon',
    style: {
      presetName: 'Cyber Ciano',
      fontFamily: 'Montserrat',
      fontSize: 52,
      caseTransform: 'uppercase',
      textColor: '#00F0FF',
      highlightColor: '#FF007F',
      strokeColor: '#050515',
      strokeWidth: 8,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 4,
      useBackgroundBox: false,
      animationType: 'pop',
      animationScale: 1.18,
      positionY: 74,
    }
  },

  // --- CATEGORIA: SÓ TEXTO (SIMPLES / MINIMALISTAS) ---
  {
    id: 'minimal-white',
    name: 'Só Texto Branco',
    description: 'Texto branco limpo e elegante sem contorno grosso (estilo podcast)',
    category: 'clean',
    previewBadge: '🤍 Minimal',
    style: {
      presetName: 'Só Texto Branco',
      fontFamily: 'Montserrat',
      fontSize: 48,
      caseTransform: 'none',
      textColor: '#FFFFFF',
      highlightColor: '#FFFFFF',
      strokeColor: 'transparent',
      strokeWidth: 0,
      shadowColor: '#000000',
      shadowBlur: 6,
      shadowDistance: 3,
      useBackgroundBox: false,
      animationType: 'none',
      animationScale: 1.0,
      positionY: 75,
    }
  },
  {
    id: 'minimal-yellow',
    name: 'Só Texto Amarelo',
    description: 'Texto amarelo ouro direto e limpo sem saltos ou contornos',
    category: 'clean',
    previewBadge: '💛 Minimal',
    style: {
      presetName: 'Só Texto Amarelo',
      fontFamily: 'Montserrat',
      fontSize: 48,
      caseTransform: 'none',
      textColor: '#FDE047',
      highlightColor: '#FDE047',
      strokeColor: 'transparent',
      strokeWidth: 0,
      shadowColor: '#000000',
      shadowBlur: 6,
      shadowDistance: 3,
      useBackgroundBox: false,
      animationType: 'none',
      animationScale: 1.0,
      positionY: 75,
    }
  },
  {
    id: 'minimal-bold-caps',
    name: 'Só Texto Caixa Alta',
    description: 'Texto em maiúsculas nítido e direto sem animação',
    category: 'clean',
    previewBadge: '🔤 Clean',
    style: {
      presetName: 'Só Texto Caixa Alta',
      fontFamily: 'Montserrat',
      fontSize: 50,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 4,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 2,
      useBackgroundBox: false,
      animationType: 'none',
      animationScale: 1.0,
      positionY: 74,
    }
  },
  {
    id: 'minimal-dark',
    name: 'Só Texto Preto',
    description: 'Texto preto minimalista para vídeos com fundo claro',
    category: 'clean',
    previewBadge: '🖤 Minimal',
    style: {
      presetName: 'Só Texto Preto',
      fontFamily: 'Montserrat',
      fontSize: 48,
      caseTransform: 'none',
      textColor: '#0F172A',
      highlightColor: '#0F172A',
      strokeColor: '#FFFFFF',
      strokeWidth: 3,
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: false,
      animationType: 'none',
      animationScale: 1.0,
      positionY: 75,
    }
  },

  // --- CATEGORIA: KARAOKE SUAVE (SEM PULAR / SÓ COR) ---
  {
    id: 'karaoke-yellow',
    name: 'Karaoke Amarelo',
    description: 'Texto branco com a palavra ativa iluminando em amarelo suave',
    category: 'karaoke',
    previewBadge: '🎤 Karaoke',
    style: {
      presetName: 'Karaoke Amarelo',
      fontFamily: 'Montserrat',
      fontSize: 52,
      caseTransform: 'uppercase',
      textColor: '#94A3B8',
      highlightColor: '#FACC15',
      strokeColor: '#000000',
      strokeWidth: 6,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 3,
      useBackgroundBox: false,
      animationType: 'color-change',
      animationScale: 1.0,
      positionY: 74,
    }
  },
  {
    id: 'karaoke-cyan',
    name: 'Karaoke Ciano',
    description: 'Texto cinza com palavra ativa acendendo em ciano brilhante',
    category: 'karaoke',
    previewBadge: '🎤 Karaoke',
    style: {
      presetName: 'Karaoke Ciano',
      fontFamily: 'Montserrat',
      fontSize: 52,
      caseTransform: 'uppercase',
      textColor: '#64748B',
      highlightColor: '#38BDF8',
      strokeColor: '#000000',
      strokeWidth: 6,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 3,
      useBackgroundBox: false,
      animationType: 'color-change',
      animationScale: 1.0,
      positionY: 74,
    }
  },
  {
    id: 'karaoke-green',
    name: 'Karaoke Verde',
    description: 'Destaque suave em verde lime palavra por palavra',
    category: 'karaoke',
    previewBadge: '🎤 Karaoke',
    style: {
      presetName: 'Karaoke Verde',
      fontFamily: 'Montserrat',
      fontSize: 52,
      caseTransform: 'uppercase',
      textColor: '#94A3B8',
      highlightColor: '#4ADE80',
      strokeColor: '#000000',
      strokeWidth: 6,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowDistance: 3,
      useBackgroundBox: false,
      animationType: 'color-change',
      animationScale: 1.0,
      positionY: 74,
    }
  },

  // --- CATEGORIA: CAIXAS / PILL BOX ---
  {
    id: 'box-pill-dark',
    name: 'Pill Box Escura',
    description: 'Caixa de fundo preta translúcida para máxima legibilidade',
    category: 'clean',
    previewBadge: '🏷️ Box',
    style: {
      presetName: 'Pill Box Escura',
      fontFamily: 'Montserrat',
      fontSize: 46,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      strokeColor: 'transparent',
      strokeWidth: 0,
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: true,
      boxColor: '#000000',
      boxOpacity: 0.85,
      boxPaddingX: 18,
      boxPaddingY: 10,
      boxRadius: 14,
      animationType: 'color-change',
      animationScale: 1.0,
      positionY: 75,
    }
  },
  {
    id: 'box-pill-red',
    name: 'Pill Box Alerta',
    description: 'Fundo vermelho vibrante estilo notícias e alertas',
    category: 'clean',
    previewBadge: '🚨 Alerta',
    style: {
      presetName: 'Pill Box Alerta',
      fontFamily: 'Montserrat',
      fontSize: 46,
      caseTransform: 'uppercase',
      textColor: '#FFFFFF',
      highlightColor: '#FEF08A',
      strokeColor: 'transparent',
      strokeWidth: 0,
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowDistance: 0,
      useBackgroundBox: true,
      boxColor: '#DC2626',
      boxOpacity: 0.92,
      boxPaddingX: 18,
      boxPaddingY: 10,
      boxRadius: 14,
      animationType: 'color-change',
      animationScale: 1.0,
      positionY: 75,
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

