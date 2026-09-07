import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, ShieldAlert, Sparkles, FileCode, CheckCircle2 } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  progressPercent: number;
  progressMessage: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  onLoadSample,
  isProcessing,
  progressPercent,
  progressMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-2xl w-full">
        {/* Main Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            accept=".apk,.aab,.xapk,.apks,.dex,.so,.xml,.arsc,.zip,.jar,.tar,.gz,.7z"
          />

          {isProcessing ? (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">Decompiling & Analyzing File</h3>
                <p className="text-xs text-slate-400 font-mono">{progressMessage || 'Processing...'}</p>
              </div>
              <div className="max-w-xs mx-auto bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 font-mono">{progressPercent}% complete</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-b from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Drop Android APK, DEX, SO or Archive
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Drag and drop your file here, or click to browse. Automatic magic-byte inspection,
                  DEX decompilation, ELF disassembly, and AXML decoding.
                </p>
              </div>

              {/* Supported Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {[
                  'APK',
                  'AAB',
                  'XAPK',
                  'DEX',
                  '.SO (ELF)',
                  'AXML (Binary XML)',
                  'RESOURCES.ARSC',
                  'ZIP / JAR',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Demo Button */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-3">
                <span className="text-xs text-slate-500">Don't have an APK handy?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadSample();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample Android APK</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Technical Capabilities Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-200 font-medium text-xs mb-1">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Full Binary Decompilation</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Decodes Dalvik bytecode (DEX), ELF shared libraries (.so), and Android binary XML into
              human-readable representations.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-200 font-medium text-xs mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Security & Attack Surface</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Audits dangerous permissions, exposed activities/services, cleartext HTTP, hardcoded API
              keys, and tracker SDKs.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-200 font-medium text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <span>Zero-Clipping Export</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Exports decompiled project ZIPs, structured JSON/Markdown audits, and complete 500+
              line paginated PDFs without clipping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
