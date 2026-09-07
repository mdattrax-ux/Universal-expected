import React, { useState } from 'react';
import { CodeFile } from '../types';
import {
  FileCode,
  Trash2,
  CheckSquare,
  Square,
  Search,
  CheckCircle2,
  FolderOpen,
  FileText
} from 'lucide-react';

interface FileSidebarProps {
  files: CodeFile[];
  activeFileId: string | null;
  onSelectActiveFile: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onGenerateSelected: () => void;
  isGenerating: boolean;
}

export const FileSidebar: React.FC<FileSidebarProps> = ({
  files,
  activeFileId,
  onSelectActiveFile,
  onToggleSelect,
  onToggleSelectAll,
  onRemoveFile,
  onClearAll,
  onGenerateSelected,
  isGenerating,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.language.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = files.filter((f) => f.selected).length;
  const allSelected = files.length > 0 && selectedCount === files.length;
  const totalSelectedLines = files
    .filter((f) => f.selected)
    .reduce((acc, curr) => acc + curr.linesCount, 0);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-full md:w-80 shrink-0">
      {/* Header with Search & Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Files ({files.length})
            </h3>
          </div>
          {files.length > 0 && (
            <button
              type="button"
              id="btn-clear-all-files"
              onClick={onClearAll}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, path or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selection Bar */}
        {files.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
            <button
              type="button"
              id="btn-toggle-select-all"
              onClick={onToggleSelectAll}
              className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-medium"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {selectedCount} selected ({totalSelectedLines.toLocaleString()} lines)
            </span>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p>No matching files found</p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectActiveFile(file.id)}
                className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 group ${
                  isActive
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Checkbox for PDF export */}
                <button
                  type="button"
                  id={`btn-select-file-${file.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(file.id);
                  }}
                  className="mt-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {file.selected ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                  )}
                </button>

                {/* File Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {file.extension || 'TXT'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                    {file.path}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {file.linesCount} lines
                    </span>
                    <span>•</span>
                    <span>{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {/* Delete single file */}
                <button
                  type="button"
                  id={`btn-remove-file-${file.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                  title="Remove file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer conversion trigger */}
      {files.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            id="btn-sidebar-generate-pdf"
            onClick={onGenerateSelected}
            disabled={selectedCount === 0 || isGenerating}
            className="w-full py-2.5 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl shadow-md shadow-blue-500/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span>Converting to PDF...</span>
            ) : (
              <span>
                Convert {selectedCount} {selectedCount === 1 ? 'File' : 'Files'} to PDF
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
