import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Layers, 
  UserCheck, 
  Building, 
  FileDown
} from 'lucide-react';
import { GreenMartProduct, CashierProfile } from '../types';
import { GREENMART_CATEGORIES } from '../data/greenmartData';
import { 
  exportInventoryStockReportPdf, 
  printInventoryStockReportPdf 
} from '../utils/statisticsPdfGenerator';

interface GreenMartExportStockPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: GreenMartProduct[];
  activeCategory?: string;
  activeStockFilter?: 'all' | 'low' | 'out';
  activeCashier?: CashierProfile;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GreenMartExportStockPdfModal: React.FC<GreenMartExportStockPdfModalProps> = ({
  isOpen,
  onClose,
  products,
  activeCategory = 'Semua',
  activeStockFilter = 'all',
  activeCashier,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(activeCategory);
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'low' | 'out'>(activeStockFilter);
  
  // Personalisasi Pengesahan & Lembar Dokumen (seperti pada 1.png & 2.png)
  const [cashierName, setCashierName] = useState(() => {
    if (activeCashier) {
      return activeCashier.name;
    }
    return 'Kasir GreenMart';
  });
  const [managerName, setManagerName] = useState('Bambang S., S.E.');
  const [storeCity, setStoreCity] = useState('Batang');
  const [customNotes, setCustomNotes] = useState(
    'Laporan ini disajikan otomatis berdasarkan rekaman data inventaris dan mutasi stok barang GreenMart.'
  );
  const [isExporting, setIsExporting] = useState(false);

  // Filtered products for export preview
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      let matchStock = true;
      if (selectedStockFilter === 'low') matchStock = p.stock > 0 && p.stock <= p.minStock;
      if (selectedStockFilter === 'out') matchStock = p.stock <= 0;
      return matchCat && matchStock;
    });
  }, [products, selectedCategory, selectedStockFilter]);

  // Metric summaries
  const totalSku = filteredProducts.length;
  const totalUnits = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalCostAsset = filteredProducts.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const totalSellingValue = filteredProducts.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const stockFilterLabel = selectedStockFilter === 'low'
    ? 'Hanya Stok Menipis'
    : selectedStockFilter === 'out'
    ? 'Hanya Stok Habis'
    : 'Semua Status Stok';

  const handleExportPdf = () => {
    try {
      setIsExporting(true);
      exportInventoryStockReportPdf(filteredProducts, {
        categoryFilter: selectedCategory,
        stockStatusFilter: stockFilterLabel,
        storeName: 'GREENMART SUPERMARKET & POS',
        storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
        storeCity,
        cashierName,
        managerName,
        customNotes
      });
      if (onShowToast) {
        onShowToast('Laporan PDF resmi stok barang berhasil diunduh!', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error generating stock PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal membuat berkas PDF. Silakan coba kembali.', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      printInventoryStockReportPdf(filteredProducts, {
        categoryFilter: selectedCategory,
        stockStatusFilter: stockFilterLabel,
        storeName: 'GREENMART SUPERMARKET & POS',
        storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
        storeCity,
        cashierName,
        managerName,
        customNotes
      });
      if (onShowToast) {
        onShowToast('Membuka dialog cetak PDF stok barang...', 'info');
      }
      onClose();
    } catch (err) {
      console.error('Error printing stock PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal mencetak dokumen. Silakan coba kembali.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Unduh Laporan Stok Barang &amp; Valuasi (PDF)</span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Format dokumen A4 resmi ber-kop GreenMart dengan tanda tangan pengesahan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          
          {/* Ringkasan Isi Laporan Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Preview Ringkasan Data Yang Diekspor</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                TANGGAL: {todayStr}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Total SKU Terfilter:</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {totalSku} Produk
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Total Fisik Stok:</span>
                <span className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">
                  {totalUnits.toLocaleString('id-ID')} Unit
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Valuasi Modal (HPP):</span>
                <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                  Rp {totalCostAsset.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Nilai Jual Total:</span>
                <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                  Rp {totalSellingValue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Filter Scope Controls */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter Kategori:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-emerald-500"
                >
                  <option value="Semua">Semua Kategori ({products.length} SKU)</option>
                  {GREENMART_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Filter Kondisi Stok:</label>
                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value as any)}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-emerald-500"
                >
                  <option value="all">Semua Kondisi Stok</option>
                  <option value="low">Hanya Stok Menipis (&le; Min)</option>
                  <option value="out">Hanya Stok Habis (0 Unit)</option>
                </select>
              </div>
            </div>

            {/* Included Content Checklist */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Kop Surat &amp; Nomor Registrasi Dokumen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Rincian Stok, Barcode &amp; Satuan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Perhitungan Modal HPP &amp; Valuasi Aset</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Margin Keuntungan &amp; Potensi Laba</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Status Menipis &amp; Peringatan Habis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Kolom Tanda Tangan Kasir &amp; Manager</span>
              </div>
            </div>
          </div>

          {/* Form Pengaturan Pengesahan Laporan (seperti pada 1.png) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Personalisasi Lembar Pengesahan Resmi</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Petugas Kasir / Pelapor
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Contoh: Kasir GreenMart"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Manajer / Pimpinan
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Contoh: Bambang S., S.E."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kota Lokasi Toko
                </label>
                <input
                  type="text"
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                  placeholder="Contoh: Batang"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Catatan Kaki Tambahan
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Catatan validasi..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Batal
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Cetak Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses...' : 'Unduh File PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
