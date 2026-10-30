import React from 'react';
import { X, Keyboard, ShoppingCart, Sun, Moon, Plus, FileText, Download, Package, Receipt, BarChart3, Camera } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['Ctrl', 'K'],
      macKeys: ['⌘', 'K'],
      description: 'Buka Tab Layar Kasir POS',
      icon: <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    },
    {
      keys: ['Ctrl', 'B'],
      macKeys: ['⌘', 'B'],
      description: 'Buka Kamera Scan Barcode',
      icon: <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    },
    {
      keys: ['Ctrl', '1'],
      macKeys: ['⌘', '1'],
      description: 'Pindah ke Kasir POS',
      icon: <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
    },
    {
      keys: ['Ctrl', '2'],
      macKeys: ['⌘', '2'],
      description: 'Pindah ke Stok & Inventori',
      icon: <Package className="w-4 h-4 text-amber-500 dark:text-amber-400" />
    },
    {
      keys: ['Ctrl', '3'],
      macKeys: ['⌘', '3'],
      description: 'Pindah ke Riwayat Transaksi',
      icon: <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    },
    {
      keys: ['Ctrl', '4'],
      macKeys: ['⌘', '4'],
      description: 'Pindah ke Grafik & Rekap Statistik',
      icon: <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
    },
    {
      keys: ['Ctrl', 'D'],
      macKeys: ['⌘', 'D'],
      description: 'Toggle Mode Gelap / Terang',
      icon: <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" />
    },
    {
      keys: ['Esc'],
      macKeys: ['Esc'],
      description: 'Tutup jendela modal yang aktif',
      icon: <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Pintasan Keyboard GreenMart
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Akses cepat alur kerja kasir dan navigasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 sm:p-5 space-y-2 max-h-80 overflow-y-auto">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="shrink-0">{sc.icon}</div>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {sc.description}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                {sc.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Barcode scanner USB otomatis input &amp; submit Enter</span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 cursor-pointer transition"
          >
            Tutup (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
