import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Zap, Check, AlertTriangle, TrendingDown, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { Sheet, SheetRow } from '../types';

interface RowModalProps {
  isOpen: boolean;
  sheet: Sheet;
  editingRow: SheetRow | null;
  onClose: () => void;
  onSave: (rowData: Record<string, any>) => void;
}

export const RowModal: React.FC<RowModalProps> = ({
  isOpen,
  sheet,
  editingRow,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [itemType, setItemType] = useState<'stock' | 'sold'>('stock');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  // Cashier helper states
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);

  // Identify qty, price, total columns for cashier auto-calculation
  const qtyCol = sheet.columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') || c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  );

  const priceCol = sheet.columns.find(c => 
    c.name.includes('harga') || c.name.includes('price') || c.name.includes('satuan') || c.label.toLowerCase().includes('harga')
  );

  const totalCol = sheet.columns.find(c => 
    c.name.includes('total') || c.name.includes('omset') || c.label.toLowerCase().includes('total') || c.label.toLowerCase().includes('omset')
  );

  const piutangCol = sheet.columns.find(c => 
    c.name.includes('piutang') || c.name.includes('hutang') || c.label.toLowerCase().includes('piutang') || c.label.toLowerCase().includes('hutang')
  );

  const statusCol = sheet.columns.find(c => 
    c.name.includes('status') || c.label.toLowerCase().includes('status')
  );

  useEffect(() => {
    if (editingRow) {
      setFormData({ ...editingRow });
      setItemType(editingRow.itemType || (editingRow.id && editingRow.id.startsWith('stock-') ? 'stock' : 'sold'));
      if (piutangCol && editingRow[piutangCol.id]) {
        // If editing an existing row with piutang
        const tot = totalCol ? Number(editingRow[totalCol.id]) || 0 : 0;
        const p = Number(editingRow[piutangCol.id]) || 0;
        setCashGiven(Math.max(0, tot - p));
      }
    } else {
      resetToDefault();
    }
    setErrors({});
  }, [editingRow, sheet.columns, isOpen]);

  const resetToDefault = () => {
    const initial: Record<string, any> = {};
    sheet.columns.forEach(col => {
      if (col.type === 'category' && col.options && col.options.length > 0) {
        initial[col.id] = col.options[0];
      } else if (col.type === 'date') {
        initial[col.id] = new Date().toISOString().split('T')[0];
      } else if (col.type === 'number') {
        initial[col.id] = col === qtyCol ? 1 : 0;
      } else if (col.type === 'decimal') {
        initial[col.id] = 0;
      } else {
        initial[col.id] = '';
      }
    });
    setFormData(initial);
    setItemType('stock');
    setCashGiven(0);
    setCostPrice(0);
  };

  if (!isOpen) return null;

  const currentTotal = totalCol 
    ? parseFloat(formData[totalCol.id]) || 0 
    : (qtyCol && priceCol 
        ? (parseFloat(formData[qtyCol.id]) || 0) * (parseFloat(formData[priceCol.id]) || 0) 
        : 0);

  // Real-time automatic Piutang detection:
  // When cashGiven < currentTotal and currentTotal > 0
  const isPaidLess = currentTotal > 0 && cashGiven < currentTotal;
  const autoReceivable = isPaidLess ? currentTotal - cashGiven : 0;

  const handleChange = (colId: string, val: any) => {
    setFormData(prev => {
      const next = { ...prev, [colId]: val };

      // Auto calculate total if qty or price changes
      if (totalCol && (colId === qtyCol?.id || colId === priceCol?.id)) {
        const currentQty = colId === qtyCol?.id ? parseFloat(val) || 0 : parseFloat(next[qtyCol?.id || '']) || 0;
        const currentPrice = colId === priceCol?.id ? parseFloat(val) || 0 : parseFloat(next[priceCol?.id || '']) || 0;
        if (currentQty > 0 && currentPrice > 0) {
          next[totalCol.id] = Math.round(currentQty * currentPrice);
        }
      }

      return next;
    });

    if (errors[colId]) {
      setErrors(prev => ({ ...prev, [colId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    sheet.columns.forEach(col => {
      const val = formData[col.id];
      if (col.isRequired && (val === undefined || val === null || String(val).trim() === '')) {
        newErrors[col.id] = `${col.label} wajib diisi`;
      }

      if ((col.type === 'number' || col.type === 'decimal') && val !== '' && val !== undefined) {
        if (isNaN(Number(val))) {
          newErrors[col.id] = 'Format harus berupa angka valid';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const prepareDataBeforeSave = () => {
    const dataToSave: Record<string, any> = { ...formData, itemType };
    // If piutang or status columns exist and cashier helper was used:
    if (piutangCol && cashGiven > 0) {
      dataToSave[piutangCol.id] = autoReceivable;
    }
    if (statusCol && cashGiven > 0) {
      dataToSave[statusCol.id] = autoReceivable > 0 ? 'Piutang' : 'Lunas';
    }
    return dataToSave;
  };

  const handleSaveAndClose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    onSave(prepareDataBeforeSave());
    onClose();
  };

  const handleSaveAndAddAnother = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    onSave(prepareDataBeforeSave());
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2000);
    resetToDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingRow ? 'Edit Baris Data' : 'Tambah Baris Data (Entri Cepat)'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sheet: <strong>{sheet.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast inside modal */}
        {showSavedNotification && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-1.5 animate-in slide-in-from-top-1">
            <Check className="w-4 h-4" />
            <span>Baris tersimpan! Siap menambah baris berikutnya.</span>
          </div>
        )}

        {/* Dynamic Form Body */}
        <form onSubmit={handleSaveAndClose} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Item Type Classification Selector */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Klasifikasi Tipe Item Baris
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setItemType('stock')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    itemType === 'stock'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Stok Tersedia</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('sold')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    itemType === 'sold'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Barang Terjual</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {itemType === 'stock' 
                  ? 'Dicatat sebagai stok inventori barang siap jual di toko.' 
                  : 'Dicatat sebagai riwayat transaksi penjualan.'}
              </p>
            </div>
            {sheet.columns.map(col => {
              const error = errors[col.id];
              const isNumeric = col.type === 'number' || col.type === 'decimal';
              const isTotal = totalCol && col.id === totalCol.id;

              return (
                <div key={col.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {col.label}
                      {col.isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                    </label>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                      {col.type}
                    </span>
                  </div>

                  {col.type === 'category' && col.options ? (
                    <select
                      value={formData[col.id] || ''}
                      onChange={(e) => handleChange(col.id, e.target.value)}
                      className={`w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-blue-500 ${
                        error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {col.options.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input
                        type={
                          col.type === 'number'
                            ? 'number'
                            : col.type === 'decimal'
                            ? 'number'
                            : col.type === 'date'
                            ? 'date'
                            : 'text'
                        }
                        step={col.type === 'decimal' ? 'any' : col.type === 'number' ? '1' : undefined}
                        value={formData[col.id] ?? ''}
                        onChange={(e) => handleChange(col.id, e.target.value)}
                        placeholder={`Masukkan ${col.label.toLowerCase()}...`}
                        className={`w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-blue-500 ${
                          error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                        } ${isNumeric ? 'font-mono' : ''}`}
                      />

                      {/* Cashier quick-increment helper for qty and number columns */}
                      {col.type === 'number' && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Cepat:</span>
                          {[1, 2, 5, 10].map(addVal => (
                            <button
                              key={addVal}
                              type="button"
                              onClick={() => {
                                const cur = parseInt(formData[col.id], 10) || 0;
                                handleChange(col.id, cur + addVal);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              +{addVal}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Cashier helper note if total is auto calculated */}
                      {isTotal && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>Terkalkulasi otomatis dari Qty &times; Harga</span>
                        </p>
                      )}
                    </div>
                  )}

                  {error && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Analisis Kasir POS: Potensi Rugi & Piutang (Rp) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/90 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kalkulator Kasir: Deteksi Piutang &amp; Rugi (Rp)</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                  Bantuan Kasir
                </span>
              </div>

              {/* Input Uang Dibayar & Harga Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Uang Diterima / Dibayar (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 50000"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Harga Modal Pokok / HPP (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 15000"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Real-time Auto-Detection Display */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Status Piutang:</span>
                  {isPaidLess ? (
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                      ⚠️ Piutang: Rp {autoReceivable.toLocaleString('id-ID')}
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Lunas (Rp 0)
                    </span>
                  )}
                </div>

                {costPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Margin / Potensi Rugi:</span>
                    {(() => {
                      const q = qtyCol ? parseFloat(formData[qtyCol.id]) || 1 : 1;
                      const totCost = costPrice * q;
                      const margin = currentTotal - totCost;
                      return margin < 0 ? (
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          - Rp {Math.abs(margin).toLocaleString('id-ID')} (RUGI HPP)
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          + Rp {margin.toLocaleString('id-ID')} (Untung)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>

            <div className="flex items-center space-x-2">
              {!editingRow && (
                <button
                  type="button"
                  onClick={handleSaveAndAddAnother}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition cursor-pointer"
                  title="Simpan baris ini dan langsung buka form baru untuk baris berikutnya"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Simpan &amp; Tambah Lagi</span>
                </button>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Baris</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
