import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  FileCode,
  FileArchive,
  Printer,
  Sparkles,
  UploadCloud,
  FileJson,
  FileText,
} from 'lucide-react';
import { FileAnalysisReport, ExtractedFile } from '../types/analyzer';
import {
  exportAnalysisAsJson,
  exportAnalysisAsMarkdown,
  exportDecodedProjectZip,
  printFullDocumentPdf,
} from '../utils/exportUtils';

interface NavbarProps {
  report: FileAnalysisReport | null;
  activeFile: ExtractedFile | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUploadClick: () => void;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  report,
  activeFile,
  searchQuery,
  onSearchChange,
  onUploadClick,
  onLoadSample,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-20">
      {/* Brand & File Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <FileArchive className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 text-sm tracking-tight">
                Universal File Analyzer
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                APK &bull; DEX &bull; ELF &bull; AXML
              </span>
            </div>
            {report && (
              <p className="text-xs text-slate-400 truncate max-w-xs font-mono">
                {report.fileName} ({(report.fileSize / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Global Search */}
      {report && (
        <div className="relative w-72 md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search classes, methods, strings, files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              &times;
            </button>
          )}
        </div>
      )}

      {/* Actions & Export Menu */}
      <div className="flex items-center gap-2">
        {!report && (
          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo APK</span>
          </button>
        )}

        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>

        {report && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1.5 z-50 text-xs text-slate-200"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportDecodedProjectZip(report.extractedFiles, report.fileName);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                >
                  <FileArchive className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-medium">Export Decoded ZIP</div>
                    <div className="text-[10px] text-slate-400">All decompiled source files</div>
                  </div>
                </button>

                {activeFile && activeFile.decodedContent && (
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      printFullDocumentPdf(
                        activeFile.name,
                        activeFile.decodedContent!,
                        'Universal File Analyzer - Decompiled Code'
                      );
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200 border-t border-slate-800"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-medium">Print / PDF (Active File)</div>
                      <div className="text-[10px] text-slate-400">Full multi-page unclipped PDF</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportAnalysisAsJson(report);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200 border-t border-slate-800"
                >
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-medium">Export Technical Audit (JSON)</div>
                    <div className="text-[10px] text-slate-400">Full structured metadata</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    exportAnalysisAsMarkdown(report);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-medium">Export Report (Markdown)</div>
                    <div className="text-[10px] text-slate-400">Formatted documentation</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
