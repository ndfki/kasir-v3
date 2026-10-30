import React from 'react';
import { Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react';
import { Sheet } from '../types';
import { getSheetMetrics } from '../utils/itemClassification';

interface StatsCardsProps {
  sheet: Sheet;
  totalSheets?: number;
  onOpenCashierModal?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  sheet, 
  onOpenCashierModal 
}) => {
  const metrics = getSheetMetrics(sheet);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. STOK BARANG TERSEDIA */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Stok Tersedia
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {metrics.totalAvailableStockUnits.toLocaleString('id-ID')}{' '}
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Unit</span>
          </p>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 mt-0.5 truncate">
            {metrics.countStockItems} jenis barang siap jual
          </span>
        </div>
      </div>

      {/* 2. BARANG TERJUAL */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Barang Terjual
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <p className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
            {metrics.totalSoldUnits.toLocaleString('id-ID')}{' '}
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Unit</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {metrics.countSoldTransactions} transaksi
            </span>
            {metrics.countSoldTransactions > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold">
                x̄ {(metrics.totalSoldUnits / metrics.countSoldTransactions).toFixed(1)} unit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. TOTAL OMSET PENJUALAN */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            Total Omset
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2">
          <p className="text-sm sm:text-xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight truncate" title={`Rp ${metrics.totalRevenueRupiah.toLocaleString('id-ID')}`}>
            Rp {metrics.totalRevenueRupiah.toLocaleString('id-ID')}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Hasil omset terjual
            </span>
            {metrics.countSoldTransactions > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold">
                x̄ Rp {Math.round(metrics.totalRevenueRupiah / metrics.countSoldTransactions).toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. SISA PIUTANG PEMBELI */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs transition ${
        metrics.totalPiutangRupiah > 0
          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sisa Piutang</span>
          </span>
          {onOpenCashierModal && (
            <button
              onClick={onOpenCashierModal}
              className="text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0"
            >
              Kasir &rarr;
            </button>
          )}
        </div>
        <div className="mt-1.5 sm:mt-2">
          <p className="text-sm sm:text-xl font-black text-amber-700 dark:text-amber-400 tabular-nums tracking-tight truncate" title={`Rp ${metrics.totalPiutangRupiah.toLocaleString('id-ID')}`}>
            {metrics.totalPiutangRupiah > 0 ? `Rp ${metrics.totalPiutangRupiah.toLocaleString('id-ID')}` : 'Rp 0'}
          </p>
          <span className={`text-[10px] sm:text-[11px] font-medium inline-flex items-center gap-1 mt-0.5 truncate ${
            metrics.countPiutangTransactions > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {metrics.countPiutangTransactions > 0 
              ? `${metrics.countPiutangTransactions} transaksi belum lunas`
              : 'Semua transaksi lunas'}
          </span>
        </div>
      </div>
    </div>
  );
};
