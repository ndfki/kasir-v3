import React, { useState } from 'react';
import { 
  Download, 
  FileCode2, 
  BookOpen, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  ShoppingCart,
  Menu,
  X,
  Sun,
  Moon,
  Keyboard
} from 'lucide-react';
import { Sheet } from '../types';
import { downloadProjectZip } from '../utils/zipGenerator';
import { GMLogo } from './GMLogo';

interface NavbarProps {
  sheets: Sheet[];
  activeSheet: Sheet;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCodeViewer: () => void;
  onOpenGuide: () => void;
  onOpenCashierModal: () => void;
  onResetData: () => void;
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sheets,
  activeSheet,
  isDarkMode,
  onToggleTheme,
  onOpenCodeViewer,
  onOpenGuide,
  onOpenCashierModal,
  onResetData,
  onOpenShortcuts
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await downloadProjectZip(sheets);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-xs shrink-0">
              <GMLogo className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  DataStatistik
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  POS &amp; MySQL
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[150px] sm:max-w-none">
                Multi-Sheet Suite (PC &amp; Mobile)
              </p>
            </div>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden lg:flex items-center space-x-2.5">
            {/* Quick POS Cashier button */}
            <button
              onClick={onOpenCashierModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition shadow-xs cursor-pointer"
              title="Buka Mode Kasir POS (Pintasan: Ctrl+K / ⌘K)"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Kasir POS</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/80 ml-0.5">
                Ctrl+K
              </kbd>
            </button>

            {/* Deployment Guide button */}
            <button
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="Panduan Instalasi XAMPP & Linux"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Panduan XAMPP &amp; Ubuntu</span>
            </button>

            {/* Source Code Viewer */}
            <button
              onClick={onOpenCodeViewer}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="Lihat Kode PHP & SQL"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Source Code PHP</span>
            </button>

            {/* Keyboard Shortcuts Cheatsheet Button */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Pintasan Keyboard (Ctrl+/)"
                aria-label="Pintasan keyboard"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}

            {/* Reset mock data */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Reset ke Data Awal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* PRIMARY: Download Project ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengemas ZIP...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>ZIP Terunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh ZIP</span>
                </>
              )}
            </button>

            {/* PENGATURAN UI: MODE GELAP / TERANG (POJOK KANAN ATAS) */}
            <div className="pl-1 border-l border-slate-200 dark:border-slate-700">
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition cursor-pointer"
                title={isDarkMode ? 'Ganti ke Mode Terang (Ctrl+D)' : 'Ganti ke Mode Gelap (Ctrl+D)'}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden xl:inline text-xs">Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-600" />
                    <span className="hidden xl:inline text-xs">Gelap</span>
                  </>
                )}
                <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Ctrl+D
                </kbd>
              </button>
            </div>
          </div>

          {/* Mobile Phone Actions: Theme Toggle + Kasir + Download ZIP + Hamburger */}
          <div className="flex lg:hidden items-center space-x-1.5 sm:space-x-2">
            {/* Theme Toggle Button on Mobile (Pojok Kanan Atas) */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-amber-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            </button>

            {/* Quick Kasir button always visible on mobile */}
            <button
              onClick={onOpenCashierModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              title="Mode Kasir"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir</span>
            </button>

            {/* Download ZIP on Mobile */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="p-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              title="Unduh Proyek ZIP"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="Menu Opsi"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 animate-in slide-in-from-top-1 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pengaturan Tampilan:</span>
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aktif: Mode Gelap</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Aktif: Mode Terang</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenCashierModal();
            }}
            className="w-full flex items-center gap-2.5 p-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mode Kasir POS (Entri Cepat &amp; Cetak Struk)</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenGuide();
            }}
            className="w-full flex items-center gap-2.5 p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Panduan Instalasi XAMPP &amp; Ubuntu</span>
          </button>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenCodeViewer();
            }}
            className="w-full flex items-center gap-2.5 p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <FileCode2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Lihat Source Code PHP &amp; SQL</span>
          </button>

          {onOpenShortcuts && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenShortcuts();
              }}
              className="w-full flex items-center justify-between p-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            >
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pintasan Keyboard (Shortcuts)</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Ctrl+K</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">Ctrl+D</kbd>
              </div>
            </button>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onResetData();
              }}
              className="inline-flex items-center gap-1.5 p-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data Awal</span>
            </button>

            <span className="text-[10px] text-slate-400">
              v1.3 &bull; Dark Mode Ready
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
