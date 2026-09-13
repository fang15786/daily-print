export type GridType = 'tian' | 'mi' | 'hui' | 'jiu' | 'fang';

export type CopybookMode = 'stroke_order' | 'continuous' | 'stroke_basic';

export type TracingColor = 'cinnabar' | 'gray' | 'ink_light';

export interface GridStyleConfig {
  gridType: GridType;
  gridSizeMm: number; // e.g. 15mm, 18mm, 20mm, 22mm
  gridLineColor: string; // e.g. '#e27360' or '#d1d5db'
  gridLineWidth: number; // 0.8, 1, 1.2
  innerLineStyle: 'dashed' | 'dotted' | 'solid';
  charColor: string; // '#1a1a1a'
  tracingColor: TracingColor;
  tracingOpacity: number; // 0.25 - 0.5
  showPinyin: boolean;
  pinyinStyle: 'four_lines' | 'clean'; // whether to show 4-line 3-space guide
  showMeta: boolean; // whether to show radical & stroke count tag
}

export interface HeaderFooterConfig {
  title: string;
  subTitle: string;
  showStudentInfo: boolean; // Name, Class, Date, Score
  showBindingGuide: boolean; // Left binding perforation guideline
  footerMotto: string; // e.g. "端端正正写字，堂堂正正做人"
  showPageNumber: boolean;
}

export interface StrokeStepItem {
  stepIndex: number;
  activeStrokes: string[]; // paths up to this step
  isFull: boolean;
  isTracing: boolean;
  isBlank: boolean;
}

export interface CharacterItem {
  char: string;
  pinyin: string;
  strokes?: string[]; // SVG paths
  strokeCount?: number;
  radical?: string;
  error?: boolean;
}

export interface PageLayoutConfig {
  paperSize: 'A4';
  orientation: 'portrait';
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  colsPerPage: number;
  rowsPerPage: number;
}
