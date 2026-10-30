import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Check, Package, Layers, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { Sheet, SheetRow } from '../types';

interface ProductSettingsModalProps {
  isOpen: boolean;
  sheet: Sheet;
  onClose: () => void;
  onSaveRow: (rowData: Record<string, any>) => void;
  onUpdateRow: (rowId: string, rowData: Record<string, any>) => void;
  onDeleteRow: (rowId: string) => void;
}

export const ProductSettingsModal: React.FC<ProductSettingsModalProps> = ({
  isOpen,
  sheet,
  onClose,
  onSaveRow,
  onUpdateRow,
  onDeleteRow
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Umum');
  const [qty, setQty] = useState<number>(10);
  const [price, setPrice] = useState<number>(10000);
  const [costPrice, setCostPrice] = useState<number>(7000);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  // Identify columns
  const itemCol = sheet.columns.find(c => 
    c.name.includes('produk') || c.name.includes('item') || c.name.includes('nama') || c.label.toLowerCase().includes('produk') || c.label.toLowerCase().includes('item')
  ) || sheet.columns[0];

  const categoryCol = sheet.columns.find(c => c.type === 'category');

  const qtyCol = sheet.columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') || c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || sheet.columns.find(c => c.type === 'number');

  const priceCol = sheet.columns.find(c => 
    c.name.includes('harga') || c.name.includes('satuan') || c.name.includes('price') || c.label.toLowerCase().includes('harga')
  ) || sheet.columns.find(c => c.type === 'decimal');

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setItemName('');
    setCategory(categoryCol?.options?.[0] || 'Umum');
    setQty(25);
    setPrice(15000);
    setCostPrice(10000);
    setFormError('');
  };

  const handleStartEdit = (row: SheetRow) => {
    setIsAdding(false);
    setEditingId(row.id);
    setItemName(itemCol ? String(row[itemCol.id] || '') : '');
    setCategory(categoryCol ? String(row[categoryCol.id] || 'Umum') : 'Umum');
    setQty(qtyCol ? Number(row[qtyCol.id]) || 0 : 0);
    setPrice(priceCol ? Number(row[priceCol.id]) || 0 : 0);
    setFormError('');
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setFormError('Nama item / produk wajib diisi.');
      return;
    }
    setFormError('');

    const rowData: Record<string, any> = {};
    sheet.columns.forEach(col => {
      if (itemCol && col.id === itemCol.id) {
        rowData[col.id] = itemName;
      } else if (categoryCol && col.id === categoryCol.id) {
        rowData[col.id] = category;
      } else if (qtyCol && col.id === qtyCol.id) {
        rowData[col.id] = qty;
      } else if (priceCol && col.id === priceCol.id) {
        rowData[col.id] = price;
      } else {
        rowData[col.id] = col.type === 'number' || col.type === 'decimal' ? 0 : '';
      }
    });

    rowData.itemType = 'stock';

    if (editingId) {
      onUpdateRow(editingId, rowData);
      setEditingId(null);
    } else {
      onSaveRow(rowData);
      setIsAdding(false);
    }
    setItemName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan &amp; CRUD Data Produk (Stok Kasir)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola barang tersedia pada sheet: <strong className="text-blue-600 dark:text-blue-400">{sheet.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Action bar to add new product */}
          {!isAdding && !editingId && (
            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Total {sheet.rows.length} item produk terdaftar dalam inventori kasir.
                </span>
              </div>
              <button
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            </div>
          )}

          {/* Form Add / Edit */}
          {(isAdding || editingId) && (
            <form onSubmit={handleSaveSubmit} className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {editingId ? 'Edit Data Produk' : 'Tambah Produk Inventori Baru'}
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingId(null); setFormError(''); }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Batal
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError('')} className="p-0.5 text-rose-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Produk / Item *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Gula Aren 500ml"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                    autoFocus
                  />
                </div>

                {categoryCol && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {categoryCol.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stok Tersedia (Qty)
                  </label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    min={0}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Jual Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    step={500}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan ke Stok'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Table List of Products */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 font-bold">Nama Produk</th>
                    <th className="p-3 font-bold">Kategori</th>
                    <th className="p-3 font-bold text-center">Stok Tersedia</th>
                    <th className="p-3 font-bold text-right">Harga Jual (Rp)</th>
                    <th className="p-3 font-bold text-center">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sheet.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Belum ada data produk. Silakan tambahkan produk baru.
                      </td>
                    </tr>
                  ) : (
                    sheet.rows.map(row => {
                      const nameVal = itemCol ? row[itemCol.id] : '-';
                      const catVal = categoryCol ? row[categoryCol.id] : '-';
                      const qtyVal = qtyCol ? Number(row[qtyCol.id]) || 0 : 0;
                      const priceVal = priceCol ? Number(row[priceCol.id]) || 0 : 0;

                      return (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {String(nameVal)}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              {String(catVal || 'Umum')}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              qtyVal > 5 
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : qtyVal > 0 
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {qtyVal} unit
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            Rp {priceVal.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleStartEdit(row)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
                                title="Edit Produk"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteProductId === row.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      onDeleteRow(row.id);
                                      setConfirmDeleteProductId(null);
                                    }}
                                    className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteProductId(null)}
                                    className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded transition cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteProductId(row.id)}
                                  className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[11px] text-slate-500">
            Perubahan stok otomatis tersinkron saat transaksi POS kasir dilakukan.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
