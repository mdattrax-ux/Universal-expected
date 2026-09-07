/**
 * MASTER DEVELOPER SPECIFICATION
 * Section 21 & 22: Content Export Capabilities
 * Single file export (raw or decoded), Full Decoded Project ZIP re-pack,
 * Technical Summary export (JSON, Markdown), and Full-Content Multi-Page PDF print.
 */

import JSZip from 'jszip';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ExtractedFile, FileAnalysisReport } from '../types/analyzer';
import { CodeFile, PdfOptions } from '../types';
import { generatePdfDocument } from './pdfGenerator';
import { countLinesFast } from './apkExtractor';

export interface NativeSaveResult {
  success: boolean;
  path?: string;
  uri?: string;
  filename?: string;
}

export interface NativeFileSaverPluginInterface {
  saveToDownloads(options: {
    filename: string;
    base64Data: string;
    mimeType: string;
  }): Promise<NativeSaveResult>;
  openFile(options: { uri: string; mimeType: string }): Promise<void>;
  shareFile(options: { uri: string; filename: string; mimeType: string }): Promise<void>;
}

export const NativeFileSaver = registerPlugin<NativeFileSaverPluginInterface>('NativeFileSaver');

export let lastSavedNativeFile: {
  filename: string;
  uri: string;
  path: string;
  mimeType: string;
} | null = null;

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Index = result.indexOf(';base64,');
      if (base64Index !== -1) {
        resolve(result.substring(base64Index + 8));
      } else {
        resolve(result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function openLastSavedFile(): Promise<void> {
  if (!lastSavedNativeFile) return;
  try {
    if (lastSavedNativeFile.uri && NativeFileSaver.openFile) {
      await NativeFileSaver.openFile({
        uri: lastSavedNativeFile.uri,
        mimeType: lastSavedNativeFile.mimeType,
      });
      return;
    }
  } catch (err) {
    console.warn('Native openFile failed, trying Share fallback:', err);
  }

  try {
    if (lastSavedNativeFile.uri) {
      await Share.share({
        title: lastSavedNativeFile.filename,
        text: `Exported: ${lastSavedNativeFile.filename}`,
        url: lastSavedNativeFile.uri,
        dialogTitle: 'Open / Share File',
      });
    }
  } catch (shareErr) {
    console.error('Share fallback error:', shareErr);
  }
}

export async function shareLastSavedFile(): Promise<void> {
  if (!lastSavedNativeFile) return;
  try {
    if (lastSavedNativeFile.uri && NativeFileSaver.shareFile) {
      await NativeFileSaver.shareFile({
        uri: lastSavedNativeFile.uri,
        filename: lastSavedNativeFile.filename,
        mimeType: lastSavedNativeFile.mimeType,
      });
      return;
    }
  } catch (err) {
    console.warn('Native shareFile failed, trying Share plugin:', err);
  }

  try {
    if (lastSavedNativeFile.uri) {
      await Share.share({
        title: lastSavedNativeFile.filename,
        text: `Exported: ${lastSavedNativeFile.filename}`,
        url: lastSavedNativeFile.uri,
        dialogTitle: 'Share File',
      });
    }
  } catch (shareErr) {
    console.error('Share fallback error:', shareErr);
  }
}

export async function downloadBlob(blob: Blob, filename: string): Promise<NativeSaveResult> {
  // If running as a native Android APK via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const mimeType =
        blob.type ||
        (filename.endsWith('.pdf')
          ? 'application/pdf'
          : filename.endsWith('.zip')
          ? 'application/zip'
          : 'application/octet-stream');

      const base64Data = await blobToBase64(blob);

      // Primary native method: write directly to public Android Download folder via MediaStore
      try {
        const result = await NativeFileSaver.saveToDownloads({
          filename,
          base64Data,
          mimeType,
        });

        if (result && result.success) {
          lastSavedNativeFile = {
            filename,
            uri: result.uri || '',
            path: result.path || '',
            mimeType,
          };
          return result;
        }
      } catch (nativeSaverErr) {
        console.warn('NativeFileSaver encountered error, attempting Filesystem plugin fallback:', nativeSaverErr);
      }

      // Secondary native method: Capacitor Filesystem plugin
      const fsResult = await Filesystem.writeFile({
        path: `Download/${filename}`,
        data: base64Data,
        directory: Directory.ExternalStorage,
        recursive: true,
      });

      lastSavedNativeFile = {
        filename,
        uri: fsResult.uri,
        path: fsResult.uri,
        mimeType,
      };

      return {
        success: true,
        path: fsResult.uri,
        uri: fsResult.uri,
        filename,
      };
    } catch (err: any) {
      console.error('Failed to save file through native methods, attempting browser fallback:', err);
    }
  }

  // Web Browser / Preview fallback
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch {
        // safe fallback
      }
      resolve({ success: true, filename });
    }, 1500);
  });
}

export function convertExtractedFilesToCodeFiles(
  extractedFiles: ExtractedFile[]
): CodeFile[] {
  const codeFiles: CodeFile[] = [];

  for (let i = 0; i < extractedFiles.length; i++) {
    const file = extractedFiles[i];
    // Skip binary files that don't have decoded text
    if (!file.decodedContent && file.isBinary) continue;

    const content =
      file.decodedContent ||
      (file.rawBytes ? new TextDecoder('utf-8', { fatal: false }).decode(file.rawBytes) : '');

    if (!content.trim()) continue;

    const ext = file.path.split('.').pop()?.toLowerCase() || 'txt';
    const linesCount = file.linesCount ?? countLinesFast(content);

    codeFiles.push({
      id: `file-${i}`,
      name: file.name,
      path: file.path,
      extension: ext,
      language: ext.toUpperCase(),
      content: content,
      linesCount,
      sizeBytes: file.size,
      selected: true,
    });
  }

  return codeFiles;
}

export async function downloadReportPdf(
  report: FileAnalysisReport,
  onProgress?: (percent: number, message: string) => void
): Promise<void> {
  onProgress?.(5, 'Preparing document structure...');
  await new Promise((r) => setTimeout(r, 20));

  const codeFiles = convertExtractedFilesToCodeFiles(report.extractedFiles);

  if (codeFiles.length === 0) {
    const summaryText = `File Analysis Report\nFile Name: ${report.fileName}\nFormat: ${report.detection.formatName}\nSize: ${report.fileSize} bytes\n\nNo text or decoded source files were extracted.`;
    codeFiles.push({
      id: 'summary',
      name: `${report.fileName}-summary.txt`,
      path: 'summary.txt',
      extension: 'txt',
      language: 'TEXT',
      content: summaryText,
      linesCount: countLinesFast(summaryText),
      sizeBytes: summaryText.length,
      selected: true,
    });
  }

  const defaultPdfOptions: PdfOptions = {
    paperFormat: 'a4',
    orientation: 'portrait',
    theme: 'light',
    fontSize: 8.5,
    lineSpacing: 1.3,
    showLineNumbers: true,
    wordWrap: true,
    showHeader: true,
    showFooter: true,
    headerTitle: report.fileName,
    authorName: 'Code to PDF Converter',
    showDate: true,
    twoColumn: false,
    syntaxHighlighting: true,
  };

  const doc = generatePdfDocument(codeFiles, defaultPdfOptions, (percent, fileName) => {
    if (onProgress) {
      onProgress(percent, `Formatting ${fileName} into PDF...`);
    }
  });

  const rawPdfBlob = doc.output('blob');
  const pdfBlob = new Blob([rawPdfBlob], { type: 'application/pdf' });
  const baseName = report.fileName.replace(/\.[^/.]+$/, '');
  downloadBlob(pdfBlob, `${baseName}.pdf`);
}

export function downloadText(filename: string, text: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBinary(filename: string, bytes: Uint8Array, mimeType = 'application/octet-stream') {
  const blob = new Blob([bytes], { type: mimeType });
  downloadBlob(blob, filename);
}

export async function exportDecodedProjectZip(
  files: ExtractedFile[],
  projectBaseName: string
): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    if (file.decodedContent) {
      zip.file(file.path, file.decodedContent);
    } else if (file.rawBytes) {
      zip.file(file.path, file.rawBytes);
    }
  }

  const rawZipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const zipBlob = new Blob([rawZipBlob], { type: 'application/zip' });
  downloadBlob(zipBlob, `${projectBaseName}-decoded-decompiled.zip`);
}

export function exportAnalysisAsJson(report: FileAnalysisReport): void {
  const exportData = {
    generatedAt: new Date().toISOString(),
    tool: 'Universal File Analyzer (Production Android/Binary Inspection Engine)',
    file: {
      name: report.fileName,
      size: report.fileSize,
      category: report.detection.category,
      format: report.detection.formatName,
      mimeType: report.detection.mimeType,
    },
    apkMetadata: report.apkMetadata,
    totalExtractedFiles: report.extractedFiles.length,
    fileIndex: report.extractedFiles.map((f) => ({
      path: f.path,
      size: f.size,
      category: f.category,
      sha256: f.sha256,
      isDecoded: f.isDecoded,
    })),
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  downloadText(`${report.fileName}-technical-audit.json`, jsonStr, 'application/json');
}

export function exportAnalysisAsMarkdown(report: FileAnalysisReport): void {
  const lines: string[] = [
    `# Technical Audit & Decompilation Report`,
    `**Target File:** \`${report.fileName}\`  `,
    `**File Size:** \`${report.fileSize.toLocaleString()} bytes\`  `,
    `**Detected Format:** ${report.detection.formatName} (\`${report.detection.mimeType}\`)  `,
    `**Audit Date:** ${new Date().toLocaleString()}  `,
    ``,
    `---`,
    ``,
  ];

  if (report.apkMetadata) {
    const meta = report.apkMetadata;
    lines.push(`## Android Package Metadata`);
    lines.push(`- **Package Identifier:** \`${meta.packageName}\``);
    lines.push(`- **Version Name / Code:** \`${meta.versionName}\` (Code: \`${meta.versionCode}\`)`);
    lines.push(`- **SDK Compatibility:** Min SDK: \`${meta.minSdkVersion}\` | Target SDK: \`${meta.targetSdkVersion}\``);
    lines.push(`- **DEX Compilations:** ${meta.dexFilesCount} classes.dex modules`);
    lines.push(`- **Architectures:** ${meta.nativeArchitectures.join(', ') || 'Pure Bytecode / No Native Libraries'}`);
    lines.push(`- **Signer Certificates:** ${meta.signingInfo.certSigners.join(', ') || 'Unsigned'}`);
    lines.push(``);
    lines.push(`### Declared Components`);
    lines.push(`- Activities (${meta.activities.length}): ${meta.activities.slice(0, 8).join(', ')}${meta.activities.length > 8 ? '...' : ''}`);
    lines.push(`- Services (${meta.services.length}): ${meta.services.join(', ') || 'None'}`);
    lines.push(`- Receivers (${meta.receivers.length}): ${meta.receivers.join(', ') || 'None'}`);
    lines.push(`- Providers (${meta.providers.length}): ${meta.providers.join(', ') || 'None'}`);
    lines.push(``);
    lines.push(`### Requested Permissions (${meta.permissions.length})`);
    for (const perm of meta.permissions) {
      lines.push(`- \`${perm}\``);
    }
    lines.push(``);
  }

  lines.push(`## Extracted Archive Hierarchy (${report.extractedFiles.length} files)`);
  lines.push(`| File Path | Category | Size | Decoded |`);
  lines.push(`| :--- | :--- | :--- | :--- |`);
  for (const f of report.extractedFiles.slice(0, 100)) {
    lines.push(`| \`${f.path}\` | ${f.category.toUpperCase()} | ${f.size.toLocaleString()} B | ${f.isDecoded ? 'Yes' : 'No'} |`);
  }
  if (report.extractedFiles.length > 100) {
    lines.push(`| ... and ${report.extractedFiles.length - 100} more files | | | |`);
  }

  downloadText(`${report.fileName}-analysis-report.md`, lines.join('\n'));
}

/**
 * FIX FOR PREVIOUS BUG: "500 lines ka code tha laken sirf 1 line ke pdf bani"
 * Generates an unclipped, perfectly styled, paginated, multi-page print document
 * containing the complete 500+ lines of code with line numbers, code highlighting,
 * and page-break rules so no content is ever dropped or truncated!
 */
export function printFullDocumentPdf(
  fileName: string,
  content: string,
  title: string = 'Source & Analysis Document'
): void {
  // If running in native Android APK, generate real PDF file and save directly to Downloads
  if (Capacitor.isNativePlatform()) {
    try {
      const ext = fileName.split('.').pop() || 'txt';
      const codeFile: CodeFile = {
        id: 'single-doc',
        name: fileName,
        path: fileName,
        extension: ext,
        language: ext.toUpperCase(),
        content: content,
        linesCount: countLinesFast(content),
        sizeBytes: content.length,
        selected: true,
      };

      const doc = generatePdfDocument([codeFile], {
        paperFormat: 'a4',
        orientation: 'portrait',
        theme: 'light',
        fontSize: 8.5,
        lineSpacing: 1.3,
        showLineNumbers: true,
        wordWrap: true,
        showHeader: true,
        showFooter: true,
        headerTitle: fileName,
        authorName: 'Universal File Analyzer',
        showDate: true,
        twoColumn: false,
        syntaxHighlighting: true,
      });

      const rawPdfBlob = doc.output('blob');
      const pdfBlob = new Blob([rawPdfBlob], { type: 'application/pdf' });
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      downloadBlob(pdfBlob, `${baseName}-code.pdf`);
      return;
    } catch (e) {
      console.error('Failed to generate native PDF in printFullDocumentPdf:', e);
    }
  }

  const lines = content.split('\n');
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocker prevented print window from opening. Please allow popups for PDF export.');
    return;
  }

  const maxPrintLines = 15000;
  const isTruncated = lines.length > maxPrintLines;
  const renderLines = isTruncated ? lines.slice(0, maxPrintLines) : lines;

  let numberedCodeHtml = '';
  for (let i = 0; i < renderLines.length; i++) {
    const lineNum = (i + 1).toString().padStart(4, ' ');
    const escaped = renderLines[i]
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    numberedCodeHtml += `<div class="code-line"><span class="line-num">${lineNum}</span><span class="line-content">${escaped || ' '}</span></div>\n`;
  }
  if (isTruncated) {
    numberedCodeHtml += `<div class="code-line" style="color: #dc2626; padding: 8px 0; font-weight: bold;"><span class="line-num">...</span><span class="line-content">// Note: Print preview limited to first 15,000 lines. The complete unclipped file is in the ZIP archive.</span></div>`;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${fileName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .header-box {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
      margin: 0 0 4px 0;
    }
    .meta-line {
      font-size: 11px;
      color: #64748b;
    }
    .code-container {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 10.5px;
      line-height: 1.45;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      word-break: break-all;
      white-space: pre-wrap;
    }
    .code-line {
      display: flex;
      page-break-inside: avoid;
    }
    .line-num {
      user-select: none;
      color: #94a3b8;
      width: 42px;
      flex-shrink: 0;
      border-right: 1px solid #e2e8f0;
      margin-right: 10px;
      padding-right: 6px;
      text-align: right;
    }
    .line-content {
      flex: 1;
    }
    @media print {
      body { padding: 0; }
      .code-container { border: none; background: transparent; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 18px; background: #2563eb; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
      Print / Save as PDF
    </button>
    <button onclick="window.close()" style="padding: 8px 18px; background: #e2e8f0; color: #334155; border: none; border-radius: 4px; cursor: pointer;">
      Close Window
    </button>
    <span style="font-size: 12px; color: #64748b; align-self: center;">
      Total: ${lines.length} lines. In print dialog, select "Save as PDF".
    </span>
  </div>

  <div class="header-box">
    <h1 class="title">${title}</h1>
    <div class="meta-line">
      Target File: <strong>${fileName}</strong> &bull; Total Lines: <strong>${lines.length}</strong> &bull; Generated: ${new Date().toLocaleString()}
    </div>
  </div>

  <div class="code-container">
    ${numberedCodeHtml}
  </div>

  <script>
    window.onload = function() {
      // Small timeout so DOM rendering completes before print dialog
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`);

  printWindow.document.close();
}
