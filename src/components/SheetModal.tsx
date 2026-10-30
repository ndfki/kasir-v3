import React, { useState, useEffect } from 'react';
import { X, Layers, Trash2, Check } from 'lucide-react';
import { Sheet } from '../types';

interface SheetModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  sheetToEdit?: Sheet;
  totalSheets: number;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
  onUpdate: (sheetId: string, name: string, description: string) => void;
  onDelete: (sheetId: string) => void;
}

export const SheetModal: React.FC<SheetModalProps> = ({
  isOpen,
  mode,
  sheetToEdit,
  totalSheets,
  onClose,
  onCreate,
  onUpdate,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && sheetToEdit) {
      setName(sheetToEdit.name);
      setDescription(sheetToEdit.description);
    } else {
      setName('');
      setDescription('');
    }
    setError('');
    setIsConfirmingDelete(false);
  }, [mode, sheetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama Sheet wajib diisi');
      return;
    }

    if (mode === 'create') {
      onCreate(name.trim(), description.trim());
    } else if (mode === 'edit' && sheetToEdit) {
      onUpdate(sheetToEdit.id, name.trim(), description.trim());
    }
    onClose();
  };

  const handleStartDelete = () => {
    if (!sheetToEdit) return;
    if (totalSheets <= 1) {
      setError('Tidak dapat menghapus Sheet terakhir. Sistem harus memiliki minimal satu Sheet aktif.');
      return;
    }
    setIsConfirmingDelete(true);
  };

  const handleExecuteDelete = () => {
    if (!sheetToEdit) return;
    onDelete(sheetToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? 'Buat Sheet Baru' : 'Pengaturan & Edit Sheet'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Sheet *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Laporan Penjualan Q1, Data Inventori"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan tujuan atau cakupan data pada sheet ini..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          {isConfirmingDelete ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
              <p className="text-xs text-rose-800 dark:text-rose-200 font-semibold leading-relaxed">
                Hapus sheet <strong>"{sheetToEdit?.name}"</strong> beserta seluruh kolom dan data baris di dalamnya?
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Sekarang</span>
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            {mode === 'edit' && !isConfirmingDelete ? (
              <button
                type="button"
                onClick={handleStartDelete}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sheet</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{mode === 'create' ? 'Buat Sheet' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
