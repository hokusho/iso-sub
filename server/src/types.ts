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

export interface SubtitleStyle {
  presetName: string;
  fontFamily: string;
  fontWeight?: number | string;
  fontSize: number; // in px
  lineHeight: number;
  letterSpacing: number; // in px
  caseTransform: CaseTransform;
  
  // Colors (hex string with #)
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
  positionY: number; // 0 - 100 percentage from top (default ~75%)
  positionX?: number; // 0 - 100 percentage from left
  alignment: AlignmentType;
  maxWidthPercent: number; // default 85%
  
  // Animation
  animationType: AnimationType;
  animationScale: number; // e.g. 1.2x for pop
  animationDurationMs: number; // e.g. 120ms
  
  // Display Options
  wordsPerLine: number; // 1 to 8
  maxLines: number; // 1 or 2
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
  estimatedRemainingSec?: number;
  outputFilePath?: string;
  outputFileName?: string;
  outputFileSize?: number;
  error?: string;
}
