import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, AlertCircle } from 'lucide-react';
import { Sheet, ColumnDefinition, ColumnType } from '../types';

interface ColumnModalProps {
  isOpen: boolean;
  sheet: Sheet;
  onClose: () => void;
  onAddColumn: (column: ColumnDefinition) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const ColumnModal: React.FC<ColumnModalProps> = ({
  isOpen,
  sheet,
  onClose,
  onAddColumn,
  onDeleteColumn
}) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<ColumnType>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteColId, setConfirmDeleteColId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Nama label kolom wajib diisi');
      return;
    }

    const colId = 'col_' + Math.random().toString(36).substring(2, 9);
    const name = label.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 30);

    const options = type === 'category'
      ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    if (type === 'category' && (!options || options.length === 0)) {
      setError('Masukkan minimal 1 pilihan opsi untuk tipe kategori (pisahkan koma)');
      return;
    }

    const newCol: ColumnDefinition = {
      id: colId,
      name,
      label: label.trim(),
      type,
      options,
      isRequired
    };

    onAddColumn(newCol);
    setLabel('');
    setOptionsStr('');
    setIsRequired(false);
    setError('');
    setConfirmDeleteColId(null);
  };

  const handleRequestDelete = (colId: string) => {
    if (sheet.columns.length <= 1) {
      setError('Sheet harus memiliki minimal 1 kolom.');
      return;
    }
    setError('');
    setConfirmDeleteColId(colId);
  };

  const handleConfirmDelete = (colId: string) => {
    onDeleteColumn(colId);
    setConfirmDeleteColId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Kelola Kolom Sheet</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tambah Kolom Baru */}
        <form onSubmit={handleAdd} className="space-y-3 bg-slate-50/70 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tambah Kolom Baru:</span>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Label Kolom
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Lokasi Gudang, Diskon (%)"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Tipe Data Kolom
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ColumnType)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-blue-500"
            >
              <option value="text">Teks (String)</option>
              <option value="number">Angka Bulat (Integer)</option>
              <option value="decimal">Desimal / Nilai Rupiah (Float)</option>
              <option value="date">Tanggal (Date YYYY-MM-DD)</option>
              <option value="category">Kategori Pilihan (Dropdown)</option>
            </select>
          </div>

          {type === 'category' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Pilihan Opsi Kategori (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Contoh: Aktif, Ditunda, Selesai"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
              />
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="reqCheck"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="reqCheck" className="text-xs text-slate-700 dark:text-slate-300 select-none">
              Kolom wajib diisi (Required)
            </label>
          </div>

          {error && (
            <p className="text-[11px] text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simpan Kolom Baru</span>
          </button>
        </form>

        {/* Existing Columns List */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Daftar Kolom Aktif ({sheet.columns.length}):
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {sheet.columns.map(col => (
              <div
                key={col.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl text-xs gap-2"
              >
                <div className="truncate">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{col.label}</span>
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                    {col.type}
                  </span>
                  {col.isRequired && (
                    <span className="ml-1 text-[10px] text-rose-500 font-bold">*Wajib</span>
                  )}
                </div>

                {confirmDeleteColId === col.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-rose-600 font-bold">Hapus?</span>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(col.id)}
                      className="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition cursor-pointer"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteColId(null)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-md transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(col.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer shrink-0"
                    title="Hapus kolom"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
