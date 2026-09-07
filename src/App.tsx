import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode2,
  CheckCircle2,
  Download,
  FileArchive,
  RefreshCw,
  FileText,
  Sparkles,
  Smartphone,
  Info,
  X,
  FolderDown,
  ExternalLink,
} from 'lucide-react';
import { FileAnalysisReport } from './types/analyzer';
import { processArchiveOrFile, countLinesFast } from './utils/apkExtractor';
import { createSampleApkFile } from './utils/sampleApkBuilder';
import {
  downloadReportPdf,
  exportDecodedProjectZip,
  openLastSavedFile,
  lastSavedNativeFile,
} from './utils/exportUtils';
import { formatBytes } from './utils/fileDetector';

export default function App() {
  const [report, setReport] = useState<FileAnalysisReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [showApkGuideModal, setShowApkGuideModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File processing handler
  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setProgressPercent(10);
    setProgressMessage('Reading file headers...');
    setDownloadNotice(null);

    try {
      const result = await processArchiveOrFile(file, (percent, msg) => {
        setProgressPercent(percent);
        setProgressMessage(msg);
      });

      setReport(result);
    } catch (err: any) {
      console.error('Error processing file:', err);
      alert(`Error processing file: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo sample loader
  const handleLoadSample = async () => {
    setIsProcessing(true);
    setProgressPercent(20);
    setProgressMessage('Generating sample Android APK with 500+ lines XML...');
    setDownloadNotice(null);
    try {
      const demoFile = await createSampleApkFile();
      await handleFile(demoFile);
    } catch (err: any) {
      console.error('Failed to load demo APK:', err);
      alert('Failed to generate sample file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to upload another file
  const handleReset = () => {
    setReport(null);
    setProgressPercent(0);
    setProgressMessage('');
    setDownloadNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag & Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Download PDF action
  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsDownloadingPdf(true);
    setDownloadNotice(null);
    try {
      await downloadReportPdf(report);
      setDownloadNotice('PDF saved! File aapke phone ke "Download" folder me save ho gayi hai.');
      setTimeout(() => setDownloadNotice(null), 8000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please check your browser popup settings.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Download ZIP action
  const handleDownloadZip = async () => {
    if (!report) return;
    setIsDownloadingZip(true);
    setDownloadNotice(null);
    try {
      const baseName = report.fileName.replace(/\.[^/.]+$/, '');
      await exportDecodedProjectZip(report.extractedFiles, baseName);
      setDownloadNotice('ZIP saved! File aapke phone ke "Download" folder me save ho gayi hai.');
      setTimeout(() => setDownloadNotice(null), 8000);
    } catch (err: any) {
      console.error('Error creating ZIP:', err);
      alert('Failed to export ZIP file.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Fast memory-safe calculation of total lines and output size
  const totalOutputSizeBytes = report
    ? report.extractedFiles.reduce((acc, f) => {
        const len = f.decodedContent ? f.decodedContent.length : f.size;
        return acc + len;
      }, 0)
    : 0;

  const totalLinesCount = report
    ? report.extractedFiles.reduce((acc, f) => {
        if (!f.decodedContent) return acc;
        return acc + (f.linesCount ?? countLinesFast(f.decodedContent));
      }, 0)
    : 0;

  // Condition from user request:
  // "Agar output 20 MB se bada ho aur multiple PDFs banein, to Download ZIP button show ho"
  const isOutputOver20Mb = totalOutputSizeBytes > 20 * 1024 * 1024;
  const decodedFilesCount = report
    ? report.extractedFiles.filter((f) => f.decodedContent && f.decodedContent.length > 0).length
    : 0;
  const hasMultipleFiles = decodedFilesCount > 1 || (report ? report.extractedFiles.length > 1 : false);
  const showZipButton = isOutputOver20Mb || hasMultipleFiles;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* Hidden File Input: accept all files so mobile Android immediately opens Downloads/Files without filtering */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
        accept="*/*,.apk,.aab,.xapk,.apks,.dex,.so,.xml,.arsc,.zip,.jar,.tar,.gz,.7z,.kt,.java,.txt,.json"
      />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur px-4 sm:px-6 py-3.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100 tracking-tight">
                Universal File Analyzer
              </h1>
              <p className="text-xs text-slate-400">
                Extract & Convert Source Code to PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* GitHub APK Workflow Button */}
            <button
              type="button"
              onClick={() => setShowApkGuideModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-2.5 py-1.5 rounded-lg border border-blue-500/30 hover:border-blue-500/50 bg-blue-500/10 transition-colors cursor-pointer"
              title="Build Phone APK via GitHub Actions"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Build APK</span>
            </button>

            {report && !isProcessing && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Select New</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full">
          {/* Download Notice Banner */}
          {downloadNotice && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderDown className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="break-words">{downloadNotice}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lastSavedNativeFile && (
                  <button
                    onClick={() => openLastSavedFile()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs cursor-pointer shadow transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open / Share</span>
                  </button>
                )}
                <button
                  onClick={() => setDownloadNotice(null)}
                  className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 1: MINIMAL UPLOAD AREA */}
          {!report && !isProcessing && (
            <div className="space-y-4">
              {/* Entire drag-and-drop container is clickable: tap anywhere to open phone's Download / Files folder */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                    : 'border-slate-800 hover:border-blue-500/50 bg-slate-900/40 hover:bg-slate-900/70 shadow-sm'
                }`}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-1.5">
                  Tap here to open Downloads
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                  Tapping anywhere opens your mobile's Downloads or Files folder. (APK, ZIP, DEX, XML, etc.)
                </p>

                {/* Primary Action: Select File Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all cursor-pointer"
                >
                  <FolderDown className="w-4 h-4" />
                  <span>Select from Downloads</span>
                </button>
              </div>

              {/* Sample file option */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Try with sample Android file (500+ lines XML)</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: PROCESSING STATE */}
          {isProcessing && (
            <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-8 text-center space-y-5 shadow-xl">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-slate-100">
                  Processing File...
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {progressMessage || 'Extracting content safely...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 max-w-xs mx-auto">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-mono text-right">
                  {progressPercent}%
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: PROCESSED & READY */}
          {report && !isProcessing && (
            <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              {/* Clean File Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    File Ready
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-100 truncate mt-0.5" title={report.fileName}>
                    {report.fileName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-2.5 text-xs text-slate-400 mt-1">
                    <span>{report.detection.formatName}</span>
                    <span>&bull;</span>
                    <span>{formatBytes(report.fileSize)}</span>
                    {totalLinesCount > 0 && (
                      <>
                        <span>&bull;</span>
                        <span className="text-blue-400 font-medium">
                          {totalLinesCount.toLocaleString()} lines
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* 1. Primary Action: Download PDF */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Preparing PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF to Phone</span>
                    </>
                  )}
                </button>

                {/* 2. Download ZIP (Only if output > 20 MB or multiple files) */}
                {showZipButton && (
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-medium text-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDownloadingZip ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white animate-spin" />
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <FileArchive className="w-4 h-4 text-amber-400" />
                        <span>Download ZIP ({report.extractedFiles.length} files{isOutputOver20Mb ? ' &bull; >20MB' : ''})</span>
                      </>
                    )}
                  </button>
                )}

                {/* 3. Upload Another File Button */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Upload another file</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Clean Bottom Note */}
      <footer className="py-3 text-center text-xs text-slate-500">
        Universal File Analyzer &bull; Complete zero-loss multi-page PDF export
      </footer>

      {/* APK Guide Modal */}
      {showApkGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  Build Real Phone APK (GitHub Actions)
                </h3>
              </div>
              <button
                onClick={() => setShowApkGuideModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Aapke project me GitHub Actions workflow file <code className="text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded">.github/workflows/build-apk.yml</code> add kar di gayi hai.
            </p>

            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="font-medium text-slate-200 text-[13px] mb-1">
                Real Phone par install karne ke 3 aasan steps:
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span>Apna code GitHub repository par push karein (<code className="text-slate-200 font-mono">git push</code>).</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span>GitHub par <strong className="text-white">Actions</strong> tab me ja kar <strong className="text-white">Build Android APK</strong> select karein aur <strong className="text-white">Run workflow</strong> par click karein.</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span>Build complete hone ke baad <strong className="text-emerald-400">UniversalFileAnalyzer-APK</strong> download karke apne phone par install kar lein!</span>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowApkGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
              >
                Samajh Gaya (Done)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
