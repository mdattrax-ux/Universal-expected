import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Printer,
  Download,
  Search,
  Code2,
  Binary,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { ExtractedFile } from '../types/analyzer';
import { generateHexPreview } from '../utils/apkExtractor';
import { printFullDocumentPdf, downloadText, downloadBinary } from '../utils/exportUtils';

interface CodeViewerProps {
  file: ExtractedFile;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ file }) => {
  const [viewMode, setViewMode] = useState<'decoded' | 'hex'>('decoded');
  const [copied, setCopied] = useState(false);
  const [inDocSearch, setInDocSearch] = useState('');

  // Default to hex if no decoded content exists
  const hasDecoded = Boolean(file.decodedContent);
  const currentMode = hasDecoded ? viewMode : 'hex';

  const contentToDisplay = useMemo(() => {
    if (currentMode === 'hex' && file.rawBytes) {
      return generateHexPreview(file.rawBytes, 4096);
    }
    return file.decodedContent || (file.rawBytes ? generateHexPreview(file.rawBytes, 4096) : '');
  }, [currentMode, file]);

  const lines = useMemo(() => {
    return contentToDisplay.split('\n');
  }, [contentToDisplay]);

  const filteredLinesWithIndex = useMemo(() => {
    if (!inDocSearch.trim()) {
      return lines.map((text, idx) => ({ text, lineNum: idx + 1 }));
    }
    const q = inDocSearch.toLowerCase();
    const result: Array<{ text: string; lineNum: number }> = [];
    lines.forEach((text, idx) => {
      if (text.toLowerCase().includes(q)) {
        result.push({ text, lineNum: idx + 1 });
      }
    });
    return result;
  }, [lines, inDocSearch]);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    printFullDocumentPdf(file.name, contentToDisplay, `Universal File Analyzer - ${file.name}`);
  };

  const handleDownload = () => {
    if (currentMode === 'decoded' && file.decodedContent) {
      downloadText(file.name, file.decodedContent);
    } else if (file.rawBytes) {
      downloadBinary(file.name, file.rawBytes);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden h-full">
      {/* File Header Toolbar */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-semibold text-slate-200 truncate">
            {file.path}
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {file.category}
          </span>
          {file.isDecoded && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Decompiled
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          {hasDecoded && (
            <div className="flex items-center rounded-md bg-slate-800 p-0.5 text-xs font-mono border border-slate-700">
              <button
                onClick={() => setViewMode('decoded')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                  viewMode === 'decoded'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>Decoded</span>
              </button>
              <button
                onClick={() => setViewMode('hex')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                  viewMode === 'hex'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Binary className="w-3 h-3" />
                <span>Hex View</span>
              </button>
            </div>
          )}

          {/* In-File Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find in file..."
              value={inDocSearch}
              onChange={(e) => setInDocSearch(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded pl-6 pr-2 py-0.5 text-xs font-mono text-slate-200 placeholder-slate-500 w-32 focus:w-44 transition-all focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleCopy}
            title="Copy content to clipboard"
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handlePrint}
            title="Print or Save Full Document as Multi-Page PDF"
            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownload}
            title="Download file"
            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code / Hex Lines Container */}
      <div className="flex-1 overflow-auto font-mono text-xs text-slate-300 p-2 leading-relaxed selection:bg-blue-500/30">
        <div className="min-w-max">
          {filteredLinesWithIndex.map(({ text, lineNum }) => {
            const isMatch = inDocSearch.trim() && text.toLowerCase().includes(inDocSearch.toLowerCase());
            return (
              <div
                key={lineNum}
                className={`flex hover:bg-slate-900/60 rounded px-1 ${
                  isMatch ? 'bg-amber-500/10 border-l-2 border-amber-400' : ''
                }`}
              >
                <span className="w-12 text-right pr-4 text-slate-600 select-none shrink-0">
                  {lineNum}
                </span>
                <span className="whitespace-pre flex-1">{text || ' '}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
