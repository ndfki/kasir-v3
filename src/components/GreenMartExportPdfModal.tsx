import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Award, 
  UserCheck, 
  Building, 
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { DailyStatisticalReport, GreenMartProduct, GreenMartTransaction } from '../types';
import { exportStatisticsReportPdf, printStatisticsReportPdf } from '../utils/statisticsPdfGenerator';

interface GreenMartExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyStatisticalReport;
  relevantTransactions: GreenMartTransaction[];
  products: GreenMartProduct[];
  selectedDateFilter: string;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GreenMartExportPdfModal: React.FC<GreenMartExportPdfModalProps> = ({
  isOpen,
  onClose,
  report,
  relevantTransactions,
  products,
  selectedDateFilter,
  onShowToast
}) => {
  const [cashierName, setCashierName] = useState('Kasir GreenMart');
  const [managerName, setManagerName] = useState('Bambang S., S.E.');
  const [storeCity, setStoreCity] = useState('Batang');
  const [customNotes, setCustomNotes] = useState(
    'Laporan ini disajikan otomatis berdasarkan rekaman data transaksi kasir dan statistik terpusat GreenMart.'
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const dateLabel = selectedDateFilter === 'all' 
    ? 'Semua Periode Transaksi' 
    : `Tanggal: ${selectedDateFilter}`;

  const handleExportPdf = () => {
    try {
      setIsExporting(true);
      exportStatisticsReportPdf(
        report,
        relevantTransactions,
        products,
        {
          dateFilterLabel: dateLabel,
          storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id | Jam Operasional: 07:00 - 15:30 WIB',
          cashierName,
          managerName,
          storeCity,
          customNotes
        }
      );
      if (onShowToast) {
        onShowToast('Laporan PDF resmi berhasil diunduh ke perangkat Anda!', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal membuat file PDF. Silakan coba lagi.', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      printStatisticsReportPdf(
        report,
        relevantTransactions,
        products,
        {
          dateFilterLabel: dateLabel,
          storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id | Jam Operasional: 07:00 - 15:30 WIB',
          cashierName,
          managerName,
          storeCity,
          customNotes
        }
      );
      if (onShowToast) {
        onShowToast('Membuka dialog cetak PDF...', 'info');
      }
      onClose();
    } catch (err) {
      console.error('Error printing PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal mencetak PDF.', 'error');
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
                <span>Unduh Laporan Statistik &amp; Keuangan (PDF)</span>
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
                {dateLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Total Omset Kotor:</span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  Rp {report.totalRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Laba Bersih ({report.profitMarginPercent}%):</span>
                <span className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">
                  Rp {report.totalProfit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Rata-rata Nota (Mean):</span>
                <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                  Rp {report.meanRevenuePerTransaction.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block font-medium">Modus Produk Terlaris:</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate block">
                  {report.topProductModus ? report.topProductModus.productName : 'Belum Ada'}
                </span>
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
                <span>Tabel Klasemen Modus Top 5 Produk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Rincian Omset per Kategori Barang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Distribusi Metode Pembayaran</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Snapshot Aset &amp; Stok Menipis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Kolom Tanda Tangan Kasir &amp; Manager</span>
              </div>
            </div>
          </div>

          {/* Form Pengaturan Pengesahan Laporan */}
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
                  placeholder="Contoh: Rina Anggraini"
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
                  placeholder="Contoh: Jakarta"
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
