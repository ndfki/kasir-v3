import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, Check } from 'lucide-react';
import { Sheet, SheetRow } from '../types';
import { exportToCsv, exportToXlsx, exportToPdf } from '../utils/exportHelpers';

interface ExportModalProps {
  isOpen: boolean;
  sheet: Sheet;
  filteredRows: SheetRow[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  sheet,
  filteredRows,
  onClose
}) => {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [scope, setScope] = useState<'all' | 'filtered'>('all');

  if (!isOpen) return null;

  const handleExport = () => {
    const rowsToExport = scope === 'all' ? sheet.rows : filteredRows;

    if (format === 'xlsx') {
      exportToXlsx(sheet, rowsToExport);
    } else if (format === 'csv') {
      exportToCsv(sheet, rowsToExport);
    } else if (format === 'pdf') {
      exportToPdf(sheet, rowsToExport);
    }

    onClose();
  };

  const currentCount = scope === 'all' ? sheet.rows.length : filteredRows.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Ekspor Data Sheet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Format Berkas:</label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                format === 'xlsx'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1" />
              <span className="text-xs">Excel</span>
              <span className="text-[10px] text-slate-400">.XLSX</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('csv')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                format === 'csv'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
              <span className="text-xs">CSV</span>
              <span className="text-[10px] text-slate-400">UTF-8 BOM</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                format === 'pdf'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-1" />
              <span className="text-xs">PDF</span>
              <span className="text-[10px] text-slate-400">Dokumen Cetak</span>
            </button>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Cakupan Data:</label>
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <label className="flex items-center space-x-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="exportScope"
                value="all"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                className="text-blue-600"
              />
              <span>Seluruh Data Sheet ({sheet.rows.length} baris)</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="radio"
                name="exportScope"
                value="filtered"
                checked={scope === 'filtered'}
                onChange={() => setScope('filtered')}
                className="text-blue-600"
              />
              <span>Hanya Data Terfilter / Hasil Cari ({filteredRows.length} baris)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Akan mengunduh <strong>{currentCount}</strong> baris
          </span>
          <div className="space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
