export interface SubtitleWord {
  id: string;
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence?: number;
}

export interface SubtitleBlock {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words: SubtitleWord[];
  hiddenLines?: number[]; // [1] to hide Line 1, [2] to hide Line 2
  hidden?: boolean;
}

export type AnimationType = 'pop' | 'bounce' | 'karaoke' | 'color-change' | 'fade' | 'none';
export type CaseTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type AlignmentType = 'center' | 'left' | 'right';
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';
export type SafeZoneMode = 'off' | 'instagram' | 'tiktok' | 'both';

export interface SubtitleStyle {
  presetName: string;
  fontFamily: string;
  fontWeight?: number | string; // 400, 600, 700, 800, 900
  fontSize: number; // in px at 1080p
  lineHeight: number;
  letterSpacing: number; // in px
  caseTransform: CaseTransform;
  
  // Colors
  textColor: string;
  highlightColor: string; // active word color
  useHighlight?: boolean; // enable / disable word-by-word highlight
  secondaryColor?: string;
  
  // Stroke / Outline
  strokeColor: string;
  strokeWidth: number; // in px
  
  // Shadow / Glow
  shadowColor: string;
  shadowBlur: number;
  shadowDistance: number;
  
  // Background Box / Pill (Whole Block)
  useBackgroundBox: boolean;
  boxColor: string;
  boxOpacity: number; // 0 - 1
  boxPaddingX: number;
  boxPaddingY: number;
  boxRadius: number;
  
  // Word Highlight Box (Box behind active word)
  useWordHighlightBox?: boolean;
  wordHighlightBoxColor?: string;
  wordHighlightBoxTextColor?: string;
  wordHighlightBoxRadius?: number;
  wordHighlightBoxPaddingX?: number;
  wordHighlightBoxPaddingY?: number;
  
  // Position
  positionY: number; // 0 - 100% from top
  positionX?: number; // 0 - 100% from left
  alignment: AlignmentType;
  maxWidthPercent: number;
  
  // Animation
  animationType: AnimationType;
  animationScale: number; // e.g. 1.25x
  animationDurationMs: number; // e.g. 120ms
  
  // Chunking / display
  wordsPerLine: number;
  maxLines: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'viral' | 'clean' | 'neon' | 'karaoke' | 'simple';
  previewBadge: string;
  style: Partial<SubtitleStyle>;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  aspectRatio: string;
  hasAudio: boolean;
  format: string;
  videoCodec?: string;
  sizeBytes: number;
}

export interface RenderJobProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progressPercent: number;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  outputFileName?: string;
  outputFilePath?: string;
  outputFileSize?: number;
  error?: string;
}
