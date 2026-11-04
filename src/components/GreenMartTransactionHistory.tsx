import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Wallet,
  Coins,
  Check,
  X,
  CalendarCheck,
  Globe,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { GreenMartTransaction, CashierProfile } from '../types';
import { GreenMartReceiptModal } from './GreenMartReceiptModal';
import { GreenMartConfirmModal } from './GreenMartConfirmModal';
import { GreenMartExportTransactionPdfModal } from './GreenMartExportTransactionPdfModal';
import { 
  exportGreenMartReceiptPdf, 
  openReceiptDirectWebPage 
} from '../utils/receiptGenerator';
import { exportTransactionHistoryReportPdf } from '../utils/statisticsPdfGenerator';

interface GreenMartTransactionHistoryProps {
  transactions: GreenMartTransaction[];
  onCancelTransaction: (transactionId: string) => void;
  onBulkDeleteTransactions?: (transactionIds: string[], restoreStock: boolean) => void;
  onSettleTransaction?: (
    transactionId: string, 
    settlement: {
      method: 'tunai' | 'qris' | 'transfer';
      amount: number;
      notes?: string;
      cashierName?: string;
    }
  ) => void;
  activeCashier?: CashierProfile;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const GreenMartTransactionHistory: React.FC<GreenMartTransactionHistoryProps> = ({
  transactions,
  onCancelTransaction,
  onBulkDeleteTransactions,
  onSettleTransaction,
  activeCashier,
  onShowToast,
  onOpenGoogleSheetsModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Lunas' | 'Piutang'>('all');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  
  // Multi-Selection State
  const [selectedTrxIds, setSelectedTrxIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [restoreStockOnBulkDelete, setRestoreStockOnBulkDelete] = useState(true);

  // Settlement Modal State (Pelunasan Piutang)
  const [trxToSettle, setTrxToSettle] = useState<GreenMartTransaction | null>(null);
  const [settleMethod, setSettleMethod] = useState<'tunai' | 'qris' | 'transfer'>('tunai');
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleCashier, setSettleCashier] = useState('Kasir Utama');
  const [settleNotes, setSettleNotes] = useState('');

  // Modals state
  const [selectedTrxForReceipt, setSelectedTrxForReceipt] = useState<GreenMartTransaction | null>(null);
  const [trxToCancel, setTrxToCancel] = useState<GreenMartTransaction | null>(null);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  const uniqueCashiers = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.cashierName) set.add(t.cashierName.trim());
    });
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Date filter
      let matchDate = true;
      if (dateFilter === 'today') matchDate = t.date === todayStr;
      else if (dateFilter === 'yesterday') matchDate = t.date === yesterdayStr;
      else if (dateFilter === '7days') matchDate = t.date >= sevenDaysAgoStr;

      // Status filter
      let matchStatus = true;
      if (statusFilter !== 'all') matchStatus = t.paymentStatus === statusFilter;

      // Cashier filter
      let matchCashier = true;
      if (cashierFilter !== 'all') matchCashier = t.cashierName === cashierFilter;

      // Search query
      const matchSearch = !searchQuery.trim() || 
        t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchDate && matchStatus && matchCashier && matchSearch;
    });
  }, [transactions, dateFilter, statusFilter, cashierFilter, searchQuery, todayStr, yesterdayStr, sevenDaysAgoStr]);

  // Statistics of filtered transactions
  const totalFilteredRevenue = filteredTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
  const totalFilteredItems = filteredTransactions.reduce((sum, t) => sum + t.totalItemsCount, 0);
  const lunasCount = filteredTransactions.filter(t => t.paymentStatus === 'Lunas').length;
  const piutangCount = filteredTransactions.filter(t => t.paymentStatus === 'Piutang').length;

  const handleConfirmCancel = () => {
    if (trxToCancel) {
      onCancelTransaction(trxToCancel.id);
      setSelectedTrxIds(prev => prev.filter(id => id !== trxToCancel.id));
      setTrxToCancel(null);
    }
  };

  const toggleSelectTrx = (id: string) => {
    setSelectedTrxIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = filteredTransactions.length > 0 && filteredTransactions.every(t => selectedTrxIds.includes(t.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredTransactions.map(t => t.id));
      setSelectedTrxIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedTrxIds);
      filteredTransactions.forEach(t => newSelected.add(t.id));
      setSelectedTrxIds(Array.from(newSelected));
    }
  };

  const selectedTransactionsTotal = useMemo(() => {
    const selectedSet = new Set(selectedTrxIds);
    return transactions.filter(t => selectedSet.has(t.id)).reduce((sum, t) => sum + t.grandTotal, 0);
  }, [transactions, selectedTrxIds]);

  const handleConfirmBulkDelete = () => {
    if (selectedTrxIds.length === 0) return;
    if (onBulkDeleteTransactions) {
      onBulkDeleteTransactions(selectedTrxIds, restoreStockOnBulkDelete);
    } else {
      selectedTrxIds.forEach(id => onCancelTransaction(id));
    }
    setSelectedTrxIds([]);
    setIsBulkDeleteConfirmOpen(false);
  };

  const openSettleModal = (trx: GreenMartTransaction) => {
    setTrxToSettle(trx);
    setSettleAmount(trx.grandTotal);
    setSettleMethod('tunai');
    setSettleCashier(trx.cashierName || 'Kasir Utama');
    setSettleNotes(`Pelunasan piutang atas nama ${trx.customerName}`);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxToSettle) return;
    if (onSettleTransaction) {
      onSettleTransaction(trxToSettle.id, {
        method: settleMethod,
        amount: Number(settleAmount) || trxToSettle.grandTotal,
        notes: settleNotes.trim() || undefined,
        cashierName: settleCashier.trim() || 'Kasir Utama'
      });
    }
    setTrxToSettle(null);
  };

  const handleExportPdfReport = () => {
    setIsExportPdfModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* 4 Summary Stats of Transactions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block">
            Total Nota Transaksi
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            {filteredTransactions.length} <span className="text-xs sm:text-sm font-normal text-slate-400">Nota</span>
          </div>
          <span className="text-xs sm:text-sm text-emerald-600 font-semibold block truncate">
            {lunasCount} Lunas &bull; {piutangCount} Piutang
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block">
            Total Omset Terfilter
          </span>
          <div className="text-xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 truncate">
            Rp {totalFilteredRevenue.toLocaleString('id-ID')}
          </div>
          <span className="text-xs sm:text-sm text-slate-400 block truncate">
            {totalFilteredItems} Total Unit Barang
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block">
            Rata-Rata per Nota (Mean)
          </span>
          <div className="text-xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400 truncate">
            Rp {filteredTransactions.length > 0 ? Math.round(totalFilteredRevenue / filteredTransactions.length).toLocaleString('id-ID') : 0}
          </div>
          <span className="text-xs sm:text-sm text-slate-400 block truncate">
            Rata-rata Basket Size
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider block truncate">
            Transaksi Piutang
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {piutangCount} <span className="text-xs sm:text-sm font-normal text-slate-400">Nota</span>
          </div>
          <span className="text-xs sm:text-sm text-slate-400 block truncate">
            Belum lunas terbayar
          </span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Nota / pelanggan..."
            className="w-full text-xs sm:text-sm font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
          />
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                dateFilter === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                dateFilter === 'yesterday'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('7days')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                dateFilter === '7days'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                dateFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Piutang">Piutang</option>
          </select>

          {/* Cashier Filter */}
          {uniqueCashiers.length > 0 && (
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-emerald-500 max-w-[180px] truncate"
              title="Filter transaksi berdasarkan nama kasir"
            >
              <option value="all">Semua Kasir</option>
              {uniqueCashiers.map(c => (
                <option key={c} value={c}>Kasir: {c}</option>
              ))}
            </select>
          )}

          {/* Tombol Simpan ke Google Spreadsheet */}
          {onOpenGoogleSheetsModal && (
            <button
              type="button"
              onClick={onOpenGoogleSheetsModal}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
              title="Simpan riwayat transaksi ke Google Spreadsheet (Cloud Webhook / .xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Google Sheets</span>
            </button>
          )}

          {/* Tombol Unduh Laporan PDF Riwayat */}
          <button
            type="button"
            onClick={handleExportPdfReport}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            title="Unduh Laporan Resmi Riwayat Transaksi format PDF dengan Personalisasi Dokumen & Kop Batang"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh PDF Riwayat</span>
          </button>

        </div>

      </div>

      {/* Multi-Selection Bulk Action Bar */}
      {selectedTrxIds.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg border border-emerald-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              {selectedTrxIds.length}
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm">
                {selectedTrxIds.length} Transaksi Terpilih &bull; Total Rp {selectedTransactionsTotal.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-emerald-200">
                Pilih aksi massal untuk menghapus atau membatalkan nota transaksi sekaligus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedTrxIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus {selectedTrxIds.length} Transaksi</span>
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider text-xs">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    title={isAllFilteredSelected ? "Batal Pilih Semua" : "Pilih Semua Terfilter"}
                  />
                </th>
                <th className="py-3.5 px-4">No. Nota</th>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Barang Dibeli</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4">Total Belanja</th>
                <th className="py-3.5 px-4">Kembalian</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 px-4 text-center text-slate-400 italic">
                    Belum ada riwayat transaksi yang cocok dengan filter ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isSelected = selectedTrxIds.includes(trx.id);

                  return (
                    <tr 
                      key={trx.id} 
                      className={`transition ${
                        isSelected 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTrx(trx.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>
                      
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {trx.invoiceNumber}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                        <div>{trx.date}</div>
                        <div className="text-xs text-slate-400">{trx.time}</div>
                      </td>

                      {/* Customer & Cashier */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                          {trx.customerName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {trx.cashierName}
                        </div>
                      </td>

                      {/* Purchased Items summary */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                            {trx.totalItemsCount} Unit ({trx.items.length} item)
                          </span>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">
                            {trx.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                          </div>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold uppercase text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {trx.paymentMethod}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        Rp {trx.grandTotal.toLocaleString('id-ID')}
                      </td>

                      {/* Change Amount */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                        {trx.paymentStatus === 'Lunas' ? (
                          trx.changeAmount > 0 
                            ? `Rp ${trx.changeAmount.toLocaleString('id-ID')}` 
                            : 'Uang Pas'
                        ) : (
                          <span className="text-rose-500 font-bold">
                            -Rp {Math.abs(trx.changeAmount).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>

                      {/* Status Pill & Settlement Badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            trx.paymentStatus === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}>
                            {trx.paymentStatus === 'Lunas' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            <span>{trx.paymentStatus}</span>
                          </span>
                          {trx.settledAt && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CalendarCheck className="w-3 h-3 shrink-0" />
                              <span>Dilunasi: {trx.settledAt}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions: View Receipt / Web / PDF / Settle Piutang / Cancel Transaction */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Settle button specifically for Piutang */}
                          {trx.paymentStatus === 'Piutang' && (
                            <button
                              type="button"
                              onClick={() => openSettleModal(trx)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Konfirmasi Pelunasan Piutang"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Lunaskan</span>
                            </button>
                          )}

                          {/* Direct ke Halaman Web Struk */}
                          <button
                            type="button"
                            onClick={() => openReceiptDirectWebPage(trx)}
                            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-900/60 transition cursor-pointer"
                            title="Buka Struk di Halaman Web Baru (Direct Print Web)"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Web</span>
                          </button>

                          {/* Export PDF Struk */}
                          <button
                            type="button"
                            onClick={() => exportGreenMartReceiptPdf(trx)}
                            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 border border-rose-200 dark:border-rose-900/60 transition cursor-pointer"
                            title="Unduh Struk dalam format berkas PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">PDF</span>
                          </button>

                          {/* Dialog & Modal Cetak Struk */}
                          <button
                            type="button"
                            onClick={() => setSelectedTrxForReceipt(trx)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                            title="Buka Pratinjau & Cetak Struk Kasir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Struk</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTrxToCancel(trx)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Hapus / Batalkan Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Thermal Receipt Modal */}
      <GreenMartReceiptModal
        isOpen={!!selectedTrxForReceipt}
        transaction={selectedTrxForReceipt}
        onClose={() => setSelectedTrxForReceipt(null)}
      />

      {/* CONFIRMATION MODAL FOR DELETING/CANCELING SINGLE TRANSACTION */}
      <GreenMartConfirmModal
        isOpen={!!trxToCancel}
        title="Batalkan Transaksi Kasir?"
        message={`Apakah Anda yakin ingin membatalkan transaksi "${trxToCancel?.invoiceNumber}" senilai Rp ${trxToCancel?.grandTotal.toLocaleString('id-ID')}? Seluruh stok barang yang telah dibeli akan otomatis dikembalikan ke inventori.`}
        confirmLabel="Ya, Batalkan & Kembalikan Stok"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleConfirmCancel}
        onCancel={() => setTrxToCancel(null)}
      />

      {/* CONFIRMATION MODAL FOR BULK DELETING TRANSACTIONS */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  Hapus {selectedTrxIds.length} Transaksi Terpilih?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Total nilai transaksi terpilih adalah <strong>Rp {selectedTransactionsTotal.toLocaleString('id-ID')}</strong>. Tindakan ini akan menghapus riwayat nota dari database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium select-none">
                <input
                  type="checkbox"
                  checked={restoreStockOnBulkDelete}
                  onChange={(e) => setRestoreStockOnBulkDelete(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span>Kembalikan stok produk barang ke inventori</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus {selectedTrxIds.length} Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PELUNASAN TRANSAKSI PIUTANG */}
      {trxToSettle && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Konfirmasi Pelunasan Piutang
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {trxToSettle.invoiceNumber} &bull; {trxToSettle.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrxToSettle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary Box */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200">
                <span>Pelanggan Piutang:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{trxToSettle.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200">
                <span>Waktu Pembelian Asal:</span>
                <span className="font-mono">{trxToSettle.date} {trxToSettle.time}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200">
                <span>Total Item Belanja:</span>
                <span>{trxToSettle.totalItemsCount} Unit ({trxToSettle.items.length} macam)</span>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-between items-center">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-100">TOTAL SISA PIUTANG:</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                  Rp {trxToSettle.grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmSettle} className="space-y-3.5">
              
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Metode Pelunasan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tunai', 'qris', 'transfer'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSettleMethod(method)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        settleMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {settleMethod === method && <Check className="w-3.5 h-3.5" />}
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settlement Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nominal Pembayaran Pelunasan (Rp)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(trxToSettle.grandTotal)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    Uang Pas: Rp {trxToSettle.grandTotal.toLocaleString('id-ID')}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={settleAmount || ''}
                    onChange={(e) => setSettleAmount(Number(e.target.value))}
                    className="w-full text-sm font-mono font-bold pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Cashier Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kasir Pemvalidasi Pelunasan
                </label>
                <input
                  type="text"
                  required
                  value={settleCashier}
                  onChange={(e) => setSettleCashier(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  placeholder="Nama kasir yang menerima uang"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pelunasan (Otomatis tercetak di struk baru)
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  placeholder="Contoh: Lunas tunai di kasir utama"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTrxToSettle(null)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Lunas &amp; Perbarui Struk</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Personalisasi Unduh PDF Riwayat Transaksi */}
      <GreenMartExportTransactionPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        transactions={filteredTransactions}
        dateFilterLabel={
          dateFilter === 'today'
            ? 'Hari Ini'
            : dateFilter === 'yesterday'
            ? 'Kemarin'
            : dateFilter === '7days'
            ? '7 Hari Terakhir'
            : 'Semua Periode'
        }
        statusFilter={statusFilter === 'all' ? 'Semua Status' : statusFilter}
        cashierFilter={cashierFilter === 'all' ? 'Semua Kasir' : cashierFilter}
        activeCashier={activeCashier}
        onShowToast={onShowToast}
      />

    </div>
  );
};
