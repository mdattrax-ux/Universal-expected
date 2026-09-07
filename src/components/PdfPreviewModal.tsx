import React, { useEffect } from 'react';
import { X, Download, Printer, ExternalLink, FileText } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobUrl: string | null;
  filename: string;
  onDownload: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  blobUrl,
  filename,
  onDownload,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !blobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-14 px-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{filename}</h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multi-page preview ready for download or printing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Download Button */}
            <button
              type="button"
              id="btn-modal-download-pdf"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Open in new tab button */}
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
              title="Open full PDF in separate browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-pdf-preview"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Preview */}
        <div className="flex-1 bg-slate-800 relative w-full h-full">
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=1`}
            title="Generated PDF Preview"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
