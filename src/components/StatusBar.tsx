import React from 'react';
import { ExtractedFile, FileAnalysisReport } from '../types/analyzer';
import { formatBytes } from '../utils/fileDetector';

interface StatusBarProps {
  report: FileAnalysisReport | null;
  activeFile: ExtractedFile | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ report, activeFile }) => {
  const lineCount = activeFile?.decodedContent
    ? activeFile.decodedContent.split('\n').length
    : 0;

  return (
    <footer className="h-6 bg-slate-900 border-t border-slate-800 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0 z-20">
      <div className="flex items-center gap-3 truncate">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Universal Analyzer Ready</span>
        </span>

        {activeFile && (
          <>
            <span className="text-slate-600">&bull;</span>
            <span className="truncate text-slate-300">File: {activeFile.path}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {activeFile && (
          <>
            {lineCount > 0 && <span>{lineCount.toLocaleString()} lines</span>}
            <span>{formatBytes(activeFile.size)}</span>
          </>
        )}

        {report && (
          <>
            <span className="text-slate-600">&bull;</span>
            <span>Total Package: {report.extractedFiles.length} files</span>
            <span>({formatBytes(report.fileSize)})</span>
          </>
        )}
      </div>
    </footer>
  );
};
