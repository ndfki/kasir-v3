import React, { useState } from 'react';
import { X, Copy, Check, FileCode2, Download } from 'lucide-react';
import { Sheet } from '../types';
import { 
  generateDatabaseSql, 
  getPhpConfigContent, 
  getPhpApiContent, 
  getPhpExportContent, 
  getPhpIndexContent, 
  getPhpCssContent, 
  getPhpJsContent, 
  getPhpReadmeContent,
  downloadProjectZip
} from '../utils/zipGenerator';

interface CodeViewerModalProps {
  isOpen: boolean;
  sheets: Sheet[];
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  sheets,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'config' | 'api' | 'export' | 'index' | 'js' | 'readme'>('sql');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getCodeContent = () => {
    switch (activeTab) {
      case 'sql':
        return generateDatabaseSql(sheets);
      case 'config':
        return getPhpConfigContent();
      case 'api':
        return getPhpApiContent();
      case 'export':
        return getPhpExportContent();
      case 'index':
        return getPhpIndexContent();
      case 'js':
        return getPhpJsContent();
      case 'readme':
        return getPhpReadmeContent();
      default:
        return '';
    }
  };

  const code = getCodeContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Source Code Lengkap PHP, MySQL &amp; JavaScript
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semua berkas ini otomatis dikemas dalam paket ZIP siap pasang di XAMPP &amp; Ubuntu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'sql' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              database.sql
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'config' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              config.php
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'api' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              api.php
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'export' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              export.php
            </button>
            <button
              onClick={() => setActiveTab('index')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'index' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              index.php
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'js' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              app.js
            </button>
            <button
              onClick={() => setActiveTab('readme')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'readme' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              README.md
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed">
          <pre>{code}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline">
            {activeTab === 'sql' && 'File skema relasional MySQL siap import via phpMyAdmin atau CLI.'}
            {activeTab === 'config' && 'Koneksi PDO, auto bootstrap, error handling, dan proteksi CSRF.'}
            {activeTab === 'api' && 'REST endpoint untuk CRUD multi-sheet, kolom dinamis, dan row values.'}
            {activeTab === 'export' && 'Ekspor langsung ke Excel XLSX, CSV UTF-8 BOM, dan PDF print view.'}
            {activeTab === 'index' && 'Frontend responsif dengan Chart.js dan Tailwind UI.'}
            {activeTab === 'js' && 'Logic asynchronous CRUD & live Chart.js rendering.'}
            {activeTab === 'readme' && 'Panduan instalasi langkah-demi-langkah XAMPP & Linux Ubuntu.'}
          </span>
          <button
            onClick={() => downloadProjectZip(sheets)}
            className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer ml-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Seluruh Proyek (.ZIP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
