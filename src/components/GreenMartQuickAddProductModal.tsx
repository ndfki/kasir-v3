import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Sparkles, Check, AlertCircle, Barcode, Tag } from 'lucide-react';
import { GreenMartProduct } from '../types';
import { GREENMART_CATEGORIES } from '../data/greenmartData';

interface GreenMartQuickAddProductModalProps {
  isOpen: boolean;
  initialBarcode: string;
  onClose: () => void;
  onSaveProduct: (product: Omit<GreenMartProduct, 'id'>) => void;
}

export const GreenMartQuickAddProductModal: React.FC<GreenMartQuickAddProductModalProps> = ({
  isOpen,
  initialBarcode,
  onClose,
  onSaveProduct
}) => {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(GREENMART_CATEGORIES[0] || 'Sembako & Beras');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(50);
  const [unit, setUnit] = useState('Pcs');
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBarcode(initialBarcode.trim());
      setName('');
      setSellingPrice('');
      setCostPrice('');
      setStock(50);
      setUnit('Pcs');
      setMinStock(5);
      setErrorMsg(null);
    }
  }, [isOpen, initialBarcode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanBarcode = barcode.trim();
    const cleanName = name.trim();

    if (!cleanBarcode) {
      setErrorMsg('Kode barcode wajib diisi.');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Nama barang wajib diisi (minimal 2 karakter).');
      return;
    }
    const numSell = Number(sellingPrice);
    if (!sellingPrice || isNaN(numSell) || numSell <= 0) {
      setErrorMsg('Harga jual harus berupa angka lebih dari 0.');
      return;
    }

    const numCost = Number(costPrice) || Math.round(numSell * 0.8);
    const numStock = Number(stock) || 10;
    const numMin = Number(minStock) || 5;

    const newProduct: Omit<GreenMartProduct, 'id'> = {
      barcode: cleanBarcode,
      name: cleanName,
      category,
      sellingPrice: numSell,
      costPrice: numCost,
      stock: numStock,
      unit: unit.trim() || 'Pcs',
      minStock: numMin,
      description: `Produk terdaftar cepat dari transaksi POS Kasir`,
      createdAt: new Date().toISOString()
    };

    onSaveProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Daftarkan Barang Baru</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kode belum terdaftar? Tambahkan langsung dalam 10 detik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Barcode input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Kode Barcode
            </label>
            <div className="relative">
              <Barcode className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Contoh: 8991234567890"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Nama Produk / Barang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beng-Beng Coklat 20g"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-emerald-500"
            />
          </div>

          {/* Category & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-emerald-500"
              >
                {GREENMART_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Satuan
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Pcs, Bungkus, Pouch"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Pricing: Harga Jual & Harga Modal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Harga Jual (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step={100}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Contoh: 5000"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Harga Modal (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Contoh: 4000"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Initial Stock */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Stok Awal di Toko
            </label>
            <input
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
              placeholder="50"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan &amp; Masukkan ke Kasir</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
