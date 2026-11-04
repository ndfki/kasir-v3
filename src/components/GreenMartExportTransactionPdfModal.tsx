import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Receipt, 
  UserCheck, 
  Building, 
  FileDown
} from 'lucide-react';
import { GreenMartTransaction, CashierProfile } from '../types';
import { 
  exportTransactionHistoryReportPdf, 
  printTransactionHistoryReportPdf 
} from '../utils/statisticsPdfGenerator';

interface GreenMartExportTransactionPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: GreenMartTransaction[];
  dateFilterLabel?: string;
  statusFilter?: string;
  cashierFilter?: string;
  activeCashier?: CashierProfile;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GreenMartExportTransactionPdfModal: React.FC<GreenMartExportTransactionPdfModalProps> = ({
  isOpen,
  onClose,
  transactions,
  dateFilterLabel = 'Semua Periode',
  statusFilter = 'Semua Status',
  cashierFilter = 'Semua Kasir',
  activeCashier,
  onShowToast
}) => {
  // Personalisasi Lembar Pengesahan Resmi (sesuai personalisasi-dokumen.png)
  const [cashierName, setCashierName] = useState(() => {
    if (cashierFilter && cashierFilter !== 'all' && cashierFilter !== 'Semua Kasir') {
      return cashierFilter;
    }
    if (activeCashier) {
      return activeCashier.name;
    }
    return 'Kasir GreenMart';
  });
  const [managerName, setManagerName] = useState('Bambang S., S.E.');
  const [storeCity, setStoreCity] = useState('Batang');
  const [customNotes, setCustomNotes] = useState(
    'Laporan ini disajikan otomatis berdasarkan rekaman riwayat transaksi kasir POS GreenMart Batang.'
  );
  const [isExporting, setIsExporting] = useState(false);

  // Calculations for preview metrics
  const totalRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.grandTotal, 0);
  }, [transactions]);

  const totalItems = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.totalItemsCount || t.items.reduce((s, i) => s + i.qty, 0)), 0);
  }, [transactions]);

  const lunasCount = useMemo(() => {
    return transactions.filter(t => t.paymentStatus === 'Lunas').length;
  }, [transactions]);

  const piutangCount = useMemo(() => {
    return transactions.filter(t => t.paymentStatus === 'Piutang').length;
  }, [transactions]);

  const avgPerNota = useMemo(() => {
    return transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;
  }, [transactions, totalRevenue]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleExportPdf = () => {
    try {
      setIsExporting(true);
      exportTransactionHistoryReportPdf(transactions, {
        dateFilterLabel,
        statusFilter,
        cashierFilter,
        storeName: 'GREENMART SUPERMARKET & POS',
        storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
        storeCity,
        cashierName,
        managerName,
        customNotes
      });
      if (onShowToast) {
        onShowToast('Laporan PDF riwayat transaksi berhasil diunduh!', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Error generating transaction PDF:', err);
      if (onShowToast) {
        onShowToast('Gagal membuat berkas PDF. Silakan coba kembali.', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      printTransactionHistoryReportPdf(transactions, {
        dateFilterLabel,
        statusFilter,
        cashierFilter,
        storeName: 'GREENMART SUPERMARKET & POS',
        storeAddress: 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
        storeCity,
        cashierName,
        managerName,
        customNotes
      });
      if (onShowToast) {
        onShowToast('Membuka dialog cetak PDF riwayat transaksi...', 'info');
      }
      onClose();
    } catch (err) {
      console.error('Error printing transaction PDF:', err);
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
                <span>Unduh Laporan Riwayat Transaksi (PDF)</span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Format dokumen A4 resmi ber-kop GreenMart dengan tanda tangan pengesahan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100">
          
          {/* Preview Ringkasan Data Yang Diekspor */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Preview Ringkasan Data Yang Diekspor
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                PERIODE: {dateFilterLabel.toUpperCase()}
              </span>
            </div>

            {/* 4 Preview Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Nota Transaksi:</div>
                <div className="text-base font-black font-mono text-slate-950 dark:text-white mt-0.5">
                  {transactions.length} Nota
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {lunasCount} Lunas &bull; {piutangCount} Piutang
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Omset Terfilter:</div>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {totalItems.toLocaleString('id-ID')} Unit Terjual
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Rata-rata Nota (Mean):</div>
                <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                  Rp {avgPerNota.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Rata-rata per transaksi
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Filter Kasir &amp; Status:</div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-0.5 truncate">
                  {cashierFilter}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  Status: {statusFilter}
                </div>
              </div>
            </div>

            {/* Checklist Dokumen */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kop Surat &amp; Nomor Registrasi Dokumen</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tabel Klasemen Transaksi Lengkap</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Rincian Omset, Diskon &amp; Metode Bayar</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Distribusi Pelunasan Piutang Kasir</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Snapshot Validasi Waktu Real-Time</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kolom Tanda Tangan Kasir &amp; Manager</span>
              </div>
            </div>
          </div>

          {/* Form Personalisasi Lembar Pengesahan Resmi */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
              <span>Personalisasi Lembar Pengesahan Resmi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Petugas Kasir / Pelapor
                </label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Contoh: Kasir GreenMart"
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Manajer / Pimpinan
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Contoh: Bambang S., S.E."
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Kota Lokasi Toko
                </label>
                <input
                  type="text"
                  value={storeCity}
                  onChange={(e) => setStoreCity(e.target.value)}
                  placeholder="Contoh: Batang"
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Catatan Kaki Tambahan
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Keterangan opsional pada dokumen"
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-emerald-500 transition"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Cetak Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
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
