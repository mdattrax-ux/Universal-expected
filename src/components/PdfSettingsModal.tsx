import React from 'react';
import { PdfOptions, PaperFormat, PageOrientation, PdfTheme } from '../types';
import { X, Sliders, Check } from 'lucide-react';

interface PdfSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PdfOptions;
  onChangeOptions: (updated: PdfOptions) => void;
}

export const PdfSettingsModal: React.FC<PdfSettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  onChangeOptions,
}) => {
  if (!isOpen) return null;

  const update = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
    onChangeOptions({ ...options, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              PDF Formatting & Layout Options
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Paper Format & Orientation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Paper Format
              </label>
              <select
                value={options.paperFormat}
                onChange={(e) => update('paperFormat', e.target.value as PaperFormat)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="a4">A4 (Standard 210 x 297 mm)</option>
                <option value="letter">US Letter (8.5 x 11 in)</option>
                <option value="legal">US Legal (8.5 x 14 in)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Page Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['portrait', 'landscape'] as PageOrientation[]).map((ori) => (
                  <button
                    key={ori}
                    type="button"
                    onClick={() => update('orientation', ori)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border capitalize transition-colors ${
                      options.orientation === ori
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ori}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Visual Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'light', name: 'Clean Light', desc: 'White bg, crisp text' },
                { id: 'github', name: 'GitHub Light', desc: 'Light gray header' },
                { id: 'dark', name: 'Slate Dark', desc: 'Eye-friendly dark' },
                { id: 'dracula', name: 'Dracula', desc: 'Vibrant syntax' },
                { id: 'monokai', name: 'Monokai', desc: 'Classic dark palette' },
                { id: 'grayscale', name: 'Grayscale', desc: 'Printer friendly' },
              ].map((thm) => (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => update('theme', thm.id as PdfTheme)}
                  className={`p-2.5 text-left rounded-xl border transition-all ${
                    options.theme === thm.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {thm.name}
                    </span>
                    {options.theme === thm.id && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {thm.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Scale: Font Size and Line Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Font Size ({options.fontSize}pt)
              </label>
              <div className="flex items-center gap-1.5">
                {[7, 8, 9, 10, 11].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => update('fontSize', size)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      options.fontSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {size}pt
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Line Spacing
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Compact', val: 1.2 },
                  { label: 'Normal', val: 1.35 },
                  { label: 'Spacious', val: 1.55 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => update('lineSpacing', item.val)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      options.lineSpacing === item.val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Line Numbers Gutter
                </span>
                <p className="text-[11px] text-slate-500">
                  Numbered margin for each line with divider line (1, 2, ... 500)
                </p>
              </div>
              <input
                type="checkbox"
                checked={options.showLineNumbers}
                onChange={(e) => update('showLineNumbers', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              >
              </input>
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Word Wrap
                </span>
                <p className="text-[11px] text-slate-500">
                  Wrap lines that exceed printable page width with indentation
                </p>
              </div>
              <input
                type="checkbox"
                checked={options.wordWrap}
                onChange={(e) => update('wordWrap', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Syntax Highlighting Colors
                </span>
                <p className="text-[11px] text-slate-500">
                  Colorize XML tags, comments, attributes, and language keywords
                </p>
              </div>
              <input
                type="checkbox"
                checked={options.syntaxHighlighting}
                onChange={(e) => update('syntaxHighlighting', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Page Header
                </span>
                <p className="text-[11px] text-slate-500">
                  Includes filename, line count, language badge, and size on every page
                </p>
              </div>
              <input
                type="checkbox"
                checked={options.showHeader}
                onChange={(e) => update('showHeader', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Page Footer
                </span>
                <p className="text-[11px] text-slate-500">
                  Includes "Page X", timestamp, and project title
                </p>
              </div>
              <input
                type="checkbox"
                checked={options.showFooter}
                onChange={(e) => update('showFooter', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Custom Document Title / Watermark */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document / Project Header Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. My Android App - Production Release v1.0"
              value={options.headerTitle}
              onChange={(e) => update('headerTitle', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
