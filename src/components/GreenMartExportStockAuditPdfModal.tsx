import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Scale, 
  UserCheck, 
  Building, 
  FileDown,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { StockComparisonItem, StockAuditReportSummary, CashierProfile } from '../types';
import { 
  exportStockOpnameAuditPdf, 
  printStockOpnameAuditPdf 
} from '../utils/statisticsPdfGenerator';

interface GreenMartExportStockAuditPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockComparisonItem[];
  summary: StockAuditReportSummary;
  activeCashier?: CashierProfile;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GreenMartExportStockAuditPdfModal: React.FC<GreenMartExportStockAuditPdfModalProps> = ({
  isOpen,
  onClose,
  items,
  summary,
  activeCashier,
  onShowToast
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'discrepancy'>('all');

  // Personalisasi Lembar Pengesahan Resmi (sesuai personalisasi-dokumen.png & stockopname-personalisasi.png)
  const [auditorName, setAuditorName] = useState(() => {
    if (activeCashier) {
      return activeCashier.name;
    }
    return 'Petugas Auditor Gudang';
  });
  const [managerName, setManagerName] = useState('Bambang S., S.E.');
  const [storeCity, setStoreCity] = useState('Batang');
  const [customNotes, setCustomNotes] = useState(
    'Berita acara ini dibuat dan disahkan berdasarkan hasil stock opname fisik riil di gudang GreenMart Batang.'
  );
  const [isExporting, setIsExporting] = useState(false);

  const discrepancyCount = useMemo(() => {
    return items.filter(it => it.difference !== 0).length;
  }, [items]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleExportPdf = () => {
    try {
      setIsExporting(true);
      exportStockOpnameAuditPdf(items, {
        auditorName,
        managerName,
        storeCity,
        customNotes,
        filterMode,
        storeName: 'GREENMART SUPERMARKET & POS',
        storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id'
      });
      if (onShowToast) {
        onShowToast('Berita Acara Stock Opname (PDF) berhasil diunduh!', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error generating stock opname PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal membuat berkas PDF. Silakan coba kembali.', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      printStockOpnameAuditPdf(items, {
        auditorName,
        managerName,
        storeCity,
        customNotes,
        filterMode,
        storeName: 'GREENMART SUPERMARKET & POS',
        storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id'
      });
      if (onShowToast) {
        onShowToast('Membuka jendela cetak Berita Acara Stock Opname...', 'info');
      }
      onClose();
    } catch (err) {
      console.error('Error printing stock opname PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal mencetak dokumen. Silakan coba kembali.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Unduh Berita Acara Stock Opname (PDF)
              </h3>
              <p className="text-xs text-emerald-100">
                Format dokumen A4 resmi ber-kop GreenMart dengan tanda tangan pengesahan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Card Preview Ringkasan Data Yang Diekspor */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Preview Ringkasan Data Audit Fisik
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                TANGGAL: {todayStr}
              </span>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-medium">Total SKU Barang:</span>
                <span className="text-sm sm:text-base font-black font-mono text-white">
                  {summary.totalSku} Produk
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {summary.totalPhysicalStock} Unit Fisik Terhitung
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-medium">Akurasi Stok (Klop):</span>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                  {summary.accuracyRate ?? (summary.totalSku > 0 ? Math.round((summary.matchedCount / summary.totalSku) * 100) : 100)}% Akurat
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {summary.matchedCount} SKU Sesuai
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-medium">Status Selisih:</span>
                <span className={`text-sm sm:text-base font-black font-mono ${
                  summary.netDifferenceUnits === 0 ? 'text-emerald-400' : summary.netDifferenceUnits < 0 ? 'text-rose-400' : 'text-blue-400'
                }`}>
                  {summary.netDifferenceUnits === 0 ? '0 Unit (Klop)' : `${summary.netDifferenceUnits > 0 ? '+' : ''}${summary.netDifferenceUnits} Unit`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {summary.minusCount} Minus &bull; {summary.surplusCount} Surplus
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-medium">Valuasi Selisih HPP:</span>
                <span className={`text-sm sm:text-base font-black font-mono ${
                  summary.totalFinancialDiffHpp === 0 ? 'text-emerald-400' : summary.totalFinancialDiffHpp < 0 ? 'text-rose-400' : 'text-blue-400'
                }`}>
                  Rp {Math.abs(summary.totalFinancialDiffHpp).toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {summary.totalFinancialDiffHpp === 0 ? 'Aset Klop Sempurna' : summary.totalFinancialDiffHpp < 0 ? 'Potensi Kerugian HPP' : 'Surplus Nilai Aset'}
                </span>
              </div>
            </div>

            {/* Dokumen Features checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Kop Surat &amp; No. Registrasi Batang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tabel Komparasi Fisik vs Sistem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Keterangan &amp; Alasan Selisih</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Kolom Tanda Tangan Kasir &amp; Manager</span>
              </div>
            </div>
          </div>

          {/* Opsi Cakupan Ekspor Data */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Cakupan Data yang Diekspor
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterMode === 'all'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Semua Produk ({items.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('discrepancy')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterMode === 'discrepancy'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Hanya Berselisih ({discrepancyCount})</span>
              </button>
            </div>
          </div>

          {/* FORM PERSONALISASI LEMBAR PENGESAHAN RESMI */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Personalisasi Lembar Pengesahan Resmi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Petugas Auditor / Kasir Pelapor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Petugas Pemeriksa / Auditor
                </label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="Contoh: Sarimin - Kasir Utama"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Manajer Operasional / Pimpinan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Manajer / Pimpinan
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Contoh: Bambang S., S.E."
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Kota Lokasi Toko */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kota Lokasi Toko
                </label>
                <input
                  type="text"
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                  placeholder="Batang"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Catatan Kaki Tambahan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Kaki Tambahan
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Catatan resmi berita acara..."
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
