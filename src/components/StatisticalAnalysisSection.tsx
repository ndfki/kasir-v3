import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  BarChart2, 
  Hash, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  Award, 
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Sheet } from '../types';
import { getSoldItemsStatistics, SoldItemsStatistics } from '../utils/statistics';

interface StatisticalAnalysisSectionProps {
  sheet: Sheet;
  onOpenCashier?: () => void;
}

type SelectedMetricType = 'revenue' | 'qty' | 'price';

export const StatisticalAnalysisSection: React.FC<StatisticalAnalysisSectionProps> = ({
  sheet,
  onOpenCashier
}) => {
  const [selectedMetric, setSelectedMetric] = useState<SelectedMetricType>('revenue');
  const [showExplanation, setShowExplanation] = useState(false);

  // Compute statistics strictly from sold items
  const stats: SoldItemsStatistics = useMemo(() => {
    return getSoldItemsStatistics(sheet);
  }, [sheet]);

  const currentMetricData = useMemo(() => {
    switch (selectedMetric) {
      case 'qty':
        return {
          title: 'Kuantitas Barang Terjual',
          unit: 'Unit',
          prefix: '',
          suffix: ' Unit',
          stats: stats.qtyStats,
          isCurrency: false,
          meanDesc: 'Rata-rata unit barang yang dibeli per transaksi kasir',
          medianDesc: 'Nilai tengah kuantitas pembelian setelah diurutkan',
          modeDesc: 'Jumlah pembelian per transaksi yang paling sering terjadi'
        };
      case 'price':
        return {
          title: 'Harga Satuan Barang',
          unit: 'Rupiah',
          prefix: 'Rp ',
          suffix: '',
          stats: stats.priceStats,
          isCurrency: true,
          meanDesc: 'Rata-rata harga satuan dari barang-barang yang laku terjual',
          medianDesc: 'Nilai tengah harga satuan barang yang laku di kasir',
          modeDesc: 'Harga satuan yang paling banyak dimiliki oleh barang terjual'
        };
      case 'revenue':
      default:
        return {
          title: 'Nilai Omset per Transaksi',
          unit: 'Rupiah',
          prefix: 'Rp ',
          suffix: '',
          stats: stats.revenueStats,
          isCurrency: true,
          meanDesc: 'Rata-rata nominal pengeluaran pembeli per transaksi kasir',
          medianDesc: 'Nilai tengah omset transaksi penjualan (tahan terhadap transaksi ekstrem)',
          modeDesc: 'Nominal transaksi belanja yang paling sering dibayarkan pembeli'
        };
    }
  }, [selectedMetric, stats]);

  const formatVal = (val: number, isCurrency = currentMetricData.isCurrency) => {
    if (isCurrency) {
      return `Rp ${val.toLocaleString('id-ID')}`;
    }
    return val.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sistem Analisis Statistik: Mean, Median, dan Modus
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShoppingCart className="w-3 h-3" />
              Khusus Barang Terjual ({stats.soldRowCount} transaksi)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Perhitungan ukuran pemusatan data (Rata-rata, Nilai Tengah, dan Nilai Terbanyak) berdasarkan barang yang sudah laku di kasir.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedMetric('revenue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMetric === 'revenue'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            💰 Omset Transaksi
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('qty')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMetric === 'qty'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📦 Qty Terjual
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('price')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedMetric === 'price'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🏷️ Harga Satuan
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {stats.soldRowCount === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Belum Ada Data Transaksi Penjualan Terjual
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistem Mean, Median, dan Modus secara ketat hanya menghitung barang yang telah terjual melalui kasir. Data stok inventori dipisahkan agar hasil analisis statistik akurat.
            </p>
          </div>
          {onOpenCashier && (
            <button
              type="button"
              onClick={onOpenCashier}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Input Penjualan via Kasir POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Three Prominent Cards: MEAN, MEDIAN, MODUS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* 1. MEAN (RATA-RATA) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 dark:from-slate-800/90 dark:via-slate-900 dark:to-slate-800/50 border-2 border-blue-200/90 dark:border-blue-900/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px]">x̄</span>
                    <span>MEAN (RATA-RATA)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Σx ÷ N
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-blue-700 dark:text-blue-400 tracking-tight">
                    {formatVal(currentMetricData.stats.mean)}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {currentMetricData.meanDesc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Total Akumulasi (Σx):</span>
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatVal(currentMetricData.stats.sum)}
                  </strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Banyak Data (N):</span>
                  <strong className="text-slate-700 dark:text-slate-300">
                    {currentMetricData.stats.count} transaksi
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. MEDIAN (NILAI TENGAH) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 dark:from-slate-800/90 dark:via-slate-900 dark:to-slate-800/50 border-2 border-emerald-200/90 dark:border-emerald-900/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px]">Me</span>
                    <span>MEDIAN (NILAI TENGAH)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Posisi {(currentMetricData.stats.count + 1) / 2}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
                    {formatVal(currentMetricData.stats.median)}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {currentMetricData.medianDesc}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Nilai Minimum (Min):</span>
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatVal(currentMetricData.stats.min)}
                  </strong>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Nilai Maksimum (Max):</span>
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatVal(currentMetricData.stats.max)}
                  </strong>
                </div>
              </div>
            </div>

            {/* 3. MODUS (NILAI & PRODUK TERBANYAK) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 dark:from-slate-800/90 dark:via-slate-900 dark:to-slate-800/50 border-2 border-purple-200/90 dark:border-purple-900/60 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-mono text-[10px]">Mo</span>
                    <span>MODUS (TERBANYAK)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    Frekuensi Maksimal
                  </span>
                </div>

                <div className="mt-3">
                  {currentMetricData.stats.modes.length > 0 ? (
                    <div className="text-2xl sm:text-3xl font-black font-mono text-purple-700 dark:text-purple-400 tracking-tight truncate">
                      {formatVal(currentMetricData.stats.modes[0])}
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-400 py-1">
                      Distribusi Rata (1x Tiap Nilai)
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {currentMetricData.stats.modes.length > 0
                      ? `Muncul sebanyak ${currentMetricData.stats.modeFrequency} kali transaksi`
                      : currentMetricData.modeDesc}
                  </p>
                </div>
              </div>

              {/* Modus Produk Terlaris Bar */}
              <div className="mt-4 pt-3 border-t border-purple-100 dark:border-slate-800/80 text-[10px] space-y-1">
                <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Modus Produk Terlaris:</span>
                  </span>
                </div>
                <div className="truncate font-semibold text-slate-700 dark:text-slate-200" title={stats.mostSoldProductByFrequency?.name}>
                  {stats.mostSoldProductByFrequency ? (
                    <span>
                      {stats.mostSoldProductByFrequency.name}{' '}
                      <span className="text-purple-600 dark:text-purple-400 font-mono">
                        ({stats.mostSoldProductByFrequency.transactionCount}x terjual, {stats.mostSoldProductByFrequency.totalQty} unit)
                      </span>
                    </span>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Toggleable Breakdown: Mathematical Steps & Product Frequency */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Transparansi Perhitungan &amp; Distribusi Data Statistik ({currentMetricData.title})
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>{showExplanation ? 'Tutup Rincian' : 'Lihat Langkah Hitung'}</span>
                {showExplanation ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showExplanation && (
              <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs animate-in fade-in">
                {/* 1. Urutan Nilai Data (Sorted Array) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Distribusi Data Terurut (Ascending, N = {currentMetricData.stats.count}):</span>
                    </strong>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Jangkauan (Range): {formatVal(currentMetricData.stats.range)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    {currentMetricData.stats.sortedValues.map((val, idx) => {
                      const isMedianValue = 
                        currentMetricData.stats.count % 2 !== 0 
                          ? idx === Math.floor(currentMetricData.stats.count / 2)
                          : idx === (currentMetricData.stats.count / 2) - 1 || idx === currentMetricData.stats.count / 2;
                      const isModeValue = currentMetricData.stats.modes.includes(val);

                      return (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                            isMedianValue
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                              : isModeValue
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                          title={`Data ke-${idx + 1}${isMedianValue ? ' (Median)' : ''}${isModeValue ? ' (Modus)' : ''}`}
                        >
                          {formatVal(val)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Step-by-step Formulas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <strong className="text-blue-700 dark:text-blue-400 block font-bold">
                      Rumus Mean:
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      x̄ = {formatVal(currentMetricData.stats.sum)} ÷ {currentMetricData.stats.count}
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-mono">
                      = {formatVal(currentMetricData.stats.mean)}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">
                      Rumus Median:
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      {currentMetricData.stats.count % 2 !== 0
                        ? `Posisi ganjil ke-${(currentMetricData.stats.count + 1) / 2}`
                        : `Rata-rata elemen ke-${currentMetricData.stats.count / 2} dan ke-${currentMetricData.stats.count / 2 + 1}`}
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-mono">
                      = {formatVal(currentMetricData.stats.median)}
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <strong className="text-purple-700 dark:text-purple-400 block font-bold">
                      Rumus Modus:
                    </strong>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      {currentMetricData.stats.modes.length > 0
                        ? `Frekuensi terbanyak = ${currentMetricData.stats.modeFrequency}x`
                        : 'Semua nilai memiliki frekuensi sama (1x)'}
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-mono truncate">
                      = {currentMetricData.stats.modes.length > 0 ? currentMetricData.stats.modes.map(m => formatVal(m)).join(', ') : 'Tidak ada modus tunggal'}
                    </p>
                  </div>
                </div>

                {/* 3. Modus Produk Terlaris Table */}
                {stats.productFrequencies.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <strong className="text-slate-800 dark:text-slate-200 font-bold block">
                      Peringkat Frekuensi Barang Terjual (Modus Produk Terlaris):
                    </strong>
                    <div className="space-y-1.5">
                      {stats.productFrequencies.slice(0, 5).map((prod, rank) => {
                        const maxCount = stats.productFrequencies[0].transactionCount || 1;
                        const percentage = Math.round((prod.transactionCount / maxCount) * 100);

                        return (
                          <div
                            key={prod.name}
                            className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                rank === 0 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' 
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {rank + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                  {prod.name}
                                </span>
                                <div className="w-24 sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-1.5 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 font-mono text-[11px]">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {prod.transactionCount}x transaksi
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Total: {prod.totalQty} unit &bull; Rp {prod.totalRevenue.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
