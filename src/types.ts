export interface CodeFile {
  id: string;
  name: string;
  path: string;
  extension: string;
  language: string;
  content: string;
  linesCount: number;
  sizeBytes: number;
  selected: boolean;
}

export type PaperFormat = 'a4' | 'letter' | 'legal';
export type PageOrientation = 'portrait' | 'landscape';
export type PdfTheme = 'light' | 'dark' | 'github' | 'monokai' | 'dracula' | 'grayscale';

export interface PdfOptions {
  paperFormat: PaperFormat;
  orientation: PageOrientation;
  theme: PdfTheme;
  fontSize: number; // in pt (e.g. 8, 9, 10)
  lineSpacing: number; // multiplier (e.g. 1.25, 1.4)
  showLineNumbers: boolean;
  wordWrap: boolean;
  showHeader: boolean;
  showFooter: boolean;
  headerTitle: string; // custom project or document title
  authorName: string;
  showDate: boolean;
  twoColumn: boolean; // optional 2-column mode for saving paper
  syntaxHighlighting: boolean;
}

export interface GenerationProgress {
  isGenerating: boolean;
  currentFile: string;
  currentProgress: number; // 0 - 100
  totalFiles: number;
  completedFiles: number;
  error?: string;
}
