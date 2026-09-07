import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileArchive,
  Binary,
  Shield,
  Layers,
  ChevronRight,
  ChevronDown,
  Cpu,
  Package,
} from 'lucide-react';
import { ExtractedFile, FileCategory } from '../types/analyzer';
import { formatBytes } from '../utils/fileDetector';

interface SidebarTreeProps {
  files: ExtractedFile[];
  activeFile: ExtractedFile | null;
  onSelectFile: (file: ExtractedFile) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({
  files,
  activeFile,
  onSelectFile,
  selectedCategory,
  onSelectCategory,
  searchQuery,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true,
    res: true,
    'res/layout': true,
    lib: true,
    assets: true,
    'META-INF': false,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Filter files by category & search query
  const filteredFiles = files.filter((file) => {
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'manifest' && !file.path.endsWith('AndroidManifest.xml')) return false;
      if (selectedCategory === 'dex' && file.category !== 'dex') return false;
      if (selectedCategory === 'elf' && file.category !== 'elf') return false;
      if (selectedCategory === 'resources' && !file.path.startsWith('res/') && !file.path.endsWith('.arsc')) return false;
      if (selectedCategory === 'assets' && !file.path.startsWith('assets/')) return false;
      if (selectedCategory === 'meta' && !file.path.startsWith('META-INF/')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inPath = file.path.toLowerCase().includes(q);
      const inDecoded = file.decodedContent ? file.decodedContent.toLowerCase().includes(q) : false;
      return inPath || inDecoded;
    }

    return true;
  });

  const getFileIcon = (file: ExtractedFile) => {
    if (file.path.endsWith('AndroidManifest.xml')) return <Shield className="w-3.5 h-3.5 text-indigo-400" />;
    if (file.category === 'dex') return <Binary className="w-3.5 h-3.5 text-amber-400" />;
    if (file.category === 'elf') return <Cpu className="w-3.5 h-3.5 text-rose-400" />;
    if (file.category === 'axml' || file.path.endsWith('.xml')) return <FileCode className="w-3.5 h-3.5 text-cyan-400" />;
    if (file.category === 'arsc') return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
    if (file.path.startsWith('META-INF/')) return <Package className="w-3.5 h-3.5 text-purple-400" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Category Pills Header */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/80">
        <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-1 mb-1.5">
          Archive Filter ({filteredFiles.length} files)
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'manifest', label: 'Manifest' },
            { id: 'dex', label: 'DEX' },
            { id: 'elf', label: 'Native (.so)' },
            { id: 'resources', label: 'Resources' },
            { id: 'assets', label: 'Assets' },
            { id: 'meta', label: 'META-INF' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-1 text-xs font-mono">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No files match current filter or search.
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredFiles.map((file) => {
              const isActive = activeFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => onSelectFile(file)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between group transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {getFileIcon(file)}
                    <span className="truncate text-[11px]">{file.path}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {file.isDecoded && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                        DEC
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
