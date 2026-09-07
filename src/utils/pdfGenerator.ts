import { jsPDF } from 'jspdf';
import { CodeFile, PdfOptions, PdfTheme } from '../types';

interface ThemeColors {
  background: [number, number, number];
  headerBg: [number, number, number];
  headerText: [number, number, number];
  headerBorder: [number, number, number];
  codeText: [number, number, number];
  gutterBg: [number, number, number];
  gutterText: [number, number, number];
  gutterBorder: [number, number, number];
  tagColor: [number, number, number];
  attributeColor: [number, number, number];
  stringColor: [number, number, number];
  commentColor: [number, number, number];
  keywordColor: [number, number, number];
  footerText: [number, number, number];
}

const THEMES: Record<PdfTheme, ThemeColors> = {
  light: {
    background: [255, 255, 255],
    headerBg: [248, 250, 252],
    headerText: [30, 41, 59],
    headerBorder: [226, 232, 240],
    codeText: [30, 41, 59],
    gutterBg: [248, 250, 252],
    gutterText: [148, 163, 184],
    gutterBorder: [226, 232, 240],
    tagColor: [37, 99, 235], // Blue
    attributeColor: [180, 83, 9], // Amber/Orange
    stringColor: [22, 101, 52], // Green
    commentColor: [100, 116, 139], // Gray
    keywordColor: [126, 34, 206], // Purple
    footerText: [148, 163, 184],
  },
  github: {
    background: [255, 255, 255],
    headerBg: [246, 248, 250],
    headerText: [31, 35, 40],
    headerBorder: [208, 215, 222],
    codeText: [36, 41, 46],
    gutterBg: [246, 248, 250],
    gutterText: [140, 149, 159],
    gutterBorder: [208, 215, 222],
    tagColor: [5, 80, 174],
    attributeColor: [149, 56, 0],
    stringColor: [10, 48, 105],
    commentColor: [110, 119, 129],
    keywordColor: [207, 34, 46],
    footerText: [140, 149, 159],
  },
  dark: {
    background: [15, 23, 42], // Slate 900
    headerBg: [30, 41, 59], // Slate 800
    headerText: [241, 245, 249],
    headerBorder: [51, 65, 85],
    codeText: [226, 232, 240],
    gutterBg: [30, 41, 59],
    gutterText: [100, 116, 139],
    gutterBorder: [51, 65, 85],
    tagColor: [96, 165, 250], // Light Blue
    attributeColor: [251, 191, 36], // Amber
    stringColor: [74, 222, 128], // Light Green
    commentColor: [148, 163, 184], // Muted gray
    keywordColor: [192, 132, 252], // Light Purple
    footerText: [100, 116, 139],
  },
  dracula: {
    background: [40, 42, 54],
    headerBg: [68, 71, 90],
    headerText: [248, 248, 242],
    headerBorder: [98, 114, 164],
    codeText: [248, 248, 242],
    gutterBg: [40, 42, 54],
    gutterText: [98, 114, 164],
    gutterBorder: [68, 71, 90],
    tagColor: [255, 121, 198], // Pink
    attributeColor: [80, 250, 123], // Green
    stringColor: [241, 250, 140], // Yellow
    commentColor: [98, 114, 164],
    keywordColor: [189, 147, 249], // Purple
    footerText: [98, 114, 164],
  },
  monokai: {
    background: [39, 40, 34],
    headerBg: [62, 61, 50],
    headerText: [248, 248, 240],
    headerBorder: [73, 72, 62],
    codeText: [248, 248, 242],
    gutterBg: [39, 40, 34],
    gutterText: [117, 113, 94],
    gutterBorder: [73, 72, 62],
    tagColor: [249, 38, 114], // Magenta
    attributeColor: [166, 226, 46], // Lime
    stringColor: [230, 219, 116], // Soft Yellow
    commentColor: [117, 113, 94],
    keywordColor: [102, 217, 239], // Cyan
    footerText: [117, 113, 94],
  },
  grayscale: {
    background: [255, 255, 255],
    headerBg: [240, 240, 240],
    headerText: [0, 0, 0],
    headerBorder: [180, 180, 180],
    codeText: [20, 20, 20],
    gutterBg: [245, 245, 245],
    gutterText: [100, 100, 100],
    gutterBorder: [200, 200, 200],
    tagColor: [40, 40, 40],
    attributeColor: [60, 60, 60],
    stringColor: [50, 50, 50],
    commentColor: [120, 120, 120],
    keywordColor: [0, 0, 0],
    footerText: [120, 120, 120],
  },
};

/**
 * Calculates line height in mm based on pt size and spacing factor
 */
function ptToMm(pt: number): number {
  return (pt * 25.4) / 72;
}

export function generatePdfDocument(
  files: CodeFile[],
  options: PdfOptions,
  onProgress?: (percent: number, currentFileName: string) => void
): jsPDF {
  const theme = THEMES[options.theme] || THEMES.light;
  const isDark = ['dark', 'dracula', 'monokai'].includes(options.theme);

  // Initialize jsPDF with format and orientation
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.paperFormat,
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Define margins (in mm)
  const marginTop = options.showHeader ? 16 : 10;
  const marginBottom = options.showFooter ? 14 : 10;
  const marginLeft = 10;
  const marginRight = 10;

  const codeFontSize = options.fontSize;
  const codeLineHeightMm = ptToMm(codeFontSize) * options.lineSpacing;
  const headerHeightMm = 12;
  const footerHeightMm = 8;

  const contentTopY = marginTop + (options.showHeader ? headerHeightMm : 0);
  const contentBottomY = pageHeight - marginBottom;

  const totalFiles = files.length;
  let currentFileIndex = 0;

  // Process each file
  for (const file of files) {
    currentFileIndex++;
    if (onProgress) {
      const progress = Math.round((currentFileIndex / totalFiles) * 100);
      onProgress(progress, file.name);
    }

    // If not first file, start with a new page
    if (currentFileIndex > 1) {
      doc.addPage(options.paperFormat, options.orientation);
    }

    const fileLines = file.content.split('\n');
    const totalLines = fileLines.length;

    // Calculate gutter width based on total lines (e.g. 500 lines needs ~4-5 characters space)
    doc.setFont('courier', 'normal');
    doc.setFontSize(codeFontSize);

    const digitCount = Math.max(3, String(totalLines).length);
    // Rough width in mm of digits in courier font
    const charWidthMm = ptToMm(codeFontSize) * 0.6;
    const gutterWidthMm = options.showLineNumbers
      ? digitCount * charWidthMm + 5
      : 0;

    const codeLeftX = marginLeft + gutterWidthMm + (options.showLineNumbers ? 2 : 0);
    const availableCodeWidthMm = pageWidth - codeLeftX - marginRight;
    const maxCharsWithoutWrapping = Math.max(20, Math.floor(availableCodeWidthMm / charWidthMm));

    let currentY = contentTopY;
    let pageNumberForFile = 1;

    // Helper: Draw background color for the current page
    const drawPageBackground = () => {
      doc.setFillColor(theme.background[0], theme.background[1], theme.background[2]);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      if (options.showLineNumbers && gutterWidthMm > 0) {
        // Subtle gutter background
        doc.setFillColor(theme.gutterBg[0], theme.gutterBg[1], theme.gutterBg[2]);
        doc.rect(
          marginLeft,
          contentTopY - 2,
          gutterWidthMm,
          contentBottomY - contentTopY + 4,
          'F'
        );

        // Gutter divider line
        doc.setDrawColor(theme.gutterBorder[0], theme.gutterBorder[1], theme.gutterBorder[2]);
        doc.setLineWidth(0.2);
        doc.line(
          marginLeft + gutterWidthMm,
          contentTopY - 2,
          marginLeft + gutterWidthMm,
          contentBottomY + 2
        );
      }
    };

    // Helper: Draw page header
    const drawHeader = () => {
      if (!options.showHeader) return;

      const headerY = marginTop - 3;
      // Header background container
      doc.setFillColor(theme.headerBg[0], theme.headerBg[1], theme.headerBg[2]);
      doc.roundedRect(marginLeft, headerY, pageWidth - marginLeft - marginRight, 8, 1.5, 1.5, 'F');

      // Border around header
      doc.setDrawColor(theme.headerBorder[0], theme.headerBorder[1], theme.headerBorder[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(marginLeft, headerY, pageWidth - marginLeft - marginRight, 8, 1.5, 1.5, 'S');

      // Header Text: File name + language badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(theme.headerText[0], theme.headerText[1], theme.headerText[2]);
      doc.text(file.name, marginLeft + 3, headerY + 5.2);

      // File path or Language badge
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(theme.commentColor[0], theme.commentColor[1], theme.commentColor[2]);
      const badgeText = `${file.language} • ${file.linesCount} lines • ${(file.sizeBytes / 1024).toFixed(1)} KB`;
      doc.text(badgeText, pageWidth - marginRight - 3, headerY + 5.2, { align: 'right' });
    };

    // Helper: Draw page footer
    const drawFooter = () => {
      if (!options.showFooter) return;

      const footerY = pageHeight - marginBottom + 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(theme.footerText[0], theme.footerText[1], theme.footerText[2]);

      // Left footer: document title or author
      const footerLeft = options.headerTitle || options.authorName || 'Source Code to PDF';
      doc.text(footerLeft, marginLeft, footerY);

      // Right footer: Date + Page number
      const dateStr = options.showDate ? new Date().toLocaleDateString() : '';
      const pageStr = `Page ${doc.getNumberOfPages()}`;
      const footerRight = dateStr ? `${dateStr}  |  ${pageStr}` : pageStr;
      doc.text(footerRight, pageWidth - marginRight, footerY, { align: 'right' });
    };

    // Draw for the first page of this file
    drawPageBackground();
    drawHeader();
    drawFooter();

    // Loop through all lines (1 to 500+)
    for (let lineIdx = 0; lineIdx < totalLines; lineIdx++) {
      // Memory protection: if a single file reaches 250 pages, prevent browser memory crash
      if (pageNumberForFile >= 250) {
        doc.setFont('courier', 'italic');
        doc.setFontSize(codeFontSize);
        doc.setTextColor(theme.commentColor[0], theme.commentColor[1], theme.commentColor[2]);
        doc.text(
          `// ... [PDF length limit reached at page 250 (${lineIdx} lines). Complete unclipped file is in the Download ZIP] ...`,
          codeLeftX,
          currentY
        );
        break;
      }

      const lineNum = lineIdx + 1;
      let rawLine = fileLines[lineIdx];

      // Convert tab characters to 4 spaces for consistent font metrics
      rawLine = rawLine.replace(/\t/g, '    ');

      // Fast word wrapping check: only run expensive splitTextToSize if line exceeds safe character width
      let subLines: string[] = [rawLine];
      if (options.wordWrap && rawLine.length > maxCharsWithoutWrapping) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(codeFontSize);
        // jsPDF splitTextToSize splits correctly based on current font size
        const split = doc.splitTextToSize(rawLine, availableCodeWidthMm);
        if (Array.isArray(split) && split.length > 0) {
          subLines = split;
        }
      }

      // Render line number and line chunks
      for (let subIdx = 0; subIdx < subLines.length; subIdx++) {
        // Page boundary check: If printing this line exceeds bottom margin, add new page!
        if (currentY + codeLineHeightMm > contentBottomY) {
          doc.addPage(options.paperFormat, options.orientation);
          pageNumberForFile++;
          currentY = contentTopY;

          drawPageBackground();
          drawHeader();
          drawFooter();
        }

        const subLineText = subLines[subIdx];

        // Draw line number ONLY on the first sub-chunk
        if (options.showLineNumbers) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(codeFontSize * 0.95);
          doc.setTextColor(theme.gutterText[0], theme.gutterText[1], theme.gutterText[2]);

          if (subIdx === 0) {
            // Right-aligned line number in gutter
            const lineNumX = marginLeft + gutterWidthMm - 2;
            doc.text(String(lineNum), lineNumX, currentY, { align: 'right' });
          } else {
            // Subtle continuation arrow for wrapped lines
            const lineNumX = marginLeft + gutterWidthMm - 2;
            doc.text('>', lineNumX, currentY, { align: 'right' });
          }
        }

        // Draw Code Text
        doc.setFont('courier', 'normal');
        doc.setFontSize(codeFontSize);

        // Simple syntax color detection if enabled
        if (options.syntaxHighlighting) {
          const trimmed = subLineText.trim();
          if (trimmed.startsWith('<!--') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            doc.setTextColor(theme.commentColor[0], theme.commentColor[1], theme.commentColor[2]);
          } else if (file.extension === 'xml' && (trimmed.startsWith('<') || trimmed.endsWith('>'))) {
            doc.setTextColor(theme.tagColor[0], theme.tagColor[1], theme.tagColor[2]);
          } else if (/\b(val|var|fun|class|interface|import|package|def|function|return|if|else|for|while)\b/.test(trimmed)) {
            doc.setTextColor(theme.keywordColor[0], theme.keywordColor[1], theme.keywordColor[2]);
          } else {
            doc.setTextColor(theme.codeText[0], theme.codeText[1], theme.codeText[2]);
          }
        } else {
          doc.setTextColor(theme.codeText[0], theme.codeText[1], theme.codeText[2]);
        }

        // Indent wrapped lines slightly
        const chunkX = subIdx === 0 ? codeLeftX : codeLeftX + 3;
        doc.text(subLineText, chunkX, currentY);

        // Advance Y coordinate
        currentY += codeLineHeightMm;
      }
    }
  }

  return doc;
}

export function exportPdfBlobUrl(doc: jsPDF): string {
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
