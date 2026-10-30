import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  DollarSign, 
  Calendar, 
  PieChart, 
  Percent, 
  Sparkles, 
  Database,
  Calculator,
  FileDown,
  Printer,
  Download,
  X
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { GreenMartProduct, GreenMartTransaction, DailyStatisticalReport } from '../types';
import { calculateGreenMartStatistics } from '../data/greenmartData';
import { GreenMartExportPdfModal } from './GreenMartExportPdfModal';
import { exportStatisticsReportPdf } from '../utils/statisticsPdfGenerator';
import { LiveClock } from './LiveClock';

Chart.register(...registerables);

interface GreenMartStatisticsDashboardProps {
  products: GreenMartProduct[];
  transactions: GreenMartTransaction[];
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GreenMartStatisticsDashboard: React.FC<GreenMartStatisticsDashboardProps> = ({
  products,
  transactions,
  onShowToast
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(todayStr);
  const [showSqlFormulaModal, setShowSqlFormulaModal] = useState(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);

  // Compute stats report dynamically based on selected date
  const statReport: DailyStatisticalReport = useMemo(() => {
    return calculateGreenMartStatistics(
      transactions,
      selectedDateFilter === 'all' ? undefined : selectedDateFilter
    );
  }, [transactions, selectedDateFilter]);

  // Chart References
  const financialChartRef = useRef<HTMLCanvasElement | null>(null);
  const modusChartRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartRef = useRef<HTMLCanvasElement | null>(null);
  const paymentMethodChartRef = useRef<HTMLCanvasElement | null>(null);

  const financialChartInstance = useRef<Chart | null>(null);
  const modusChartInstance = useRef<Chart | null>(null);
  const categoryChartInstance = useRef<Chart | null>(null);
  const paymentMethodChartInstance = useRef<Chart | null>(null);

  // Fluctuation View Mode: 'interval' (hourly/transaction fluctuation) vs 'cumulative' (progressive accumulation)
  const [curveMode, setCurveMode] = useState<'interval' | 'cumulative'>('interval');

  // Filtered transactions for charts
  const relevantTransactions = useMemo(() => {
    return selectedDateFilter === 'all' 
      ? transactions 
      : transactions.filter(t => t.date === selectedDateFilter);
  }, [transactions, selectedDateFilter]);

  // Compute chronological fluctuation data points
  const fluctuationData = useMemo(() => {
    // Case 1: All dates selected
    if (selectedDateFilter === 'all') {
      const dateMap = new Map<string, { omset: number; modal: number; laba: number }>();
      
      const sortedTrx = [...relevantTransactions].sort((a, b) => a.date.localeCompare(b.date));
      
      sortedTrx.forEach(trx => {
        const existing = dateMap.get(trx.date) || { omset: 0, modal: 0, laba: 0 };
        const trxCost = trx.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.qty, 0);
        existing.omset += trx.grandTotal;
        existing.modal += trxCost;
        existing.laba += (trx.grandTotal - trxCost);
        dateMap.set(trx.date, existing);
      });

      const dates = Array.from(dateMap.keys());
      if (dates.length === 0) {
        return {
          labels: ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5'],
          omsetData: [0, 0, 0, 0, 0],
          modalData: [0, 0, 0, 0, 0],
          labaData: [0, 0, 0, 0, 0]
        };
      }

      const labels = dates.map(d => {
        const parts = d.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
      });

      let runningOmset = 0;
      let runningModal = 0;
      let runningLaba = 0;

      const omsetData: number[] = [];
      const modalData: number[] = [];
      const labaData: number[] = [];

      dates.forEach(d => {
        const val = dateMap.get(d)!;
        if (curveMode === 'cumulative') {
          runningOmset += val.omset;
          runningModal += val.modal;
          runningLaba += val.laba;
          omsetData.push(runningOmset);
          modalData.push(runningModal);
          labaData.push(runningLaba);
        } else {
          omsetData.push(val.omset);
          modalData.push(val.modal);
          labaData.push(val.laba);
        }
      });

      return { labels, omsetData, modalData, labaData };
    }

    // Case 2: Single date selected (Today, Yesterday, or specific date)
    const sortedTrx = [...relevantTransactions].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (sortedTrx.length === 0) {
      return {
        labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
        omsetData: [0, 0, 0, 0, 0, 0, 0],
        modalData: [0, 0, 0, 0, 0, 0, 0],
        labaData: [0, 0, 0, 0, 0, 0, 0]
      };
    }

    // If <= 12 transactions: use individual transaction timestamps
    if (sortedTrx.length <= 12) {
      const labels: string[] = ['Buka (08:00)'];
      const omsetData: number[] = [0];
      const modalData: number[] = [0];
      const labaData: number[] = [0];

      let runningOmset = 0;
      let runningModal = 0;
      let runningLaba = 0;

      sortedTrx.forEach((trx) => {
        const timeLabel = (trx.time || '00:00').substring(0, 5);
        labels.push(`${timeLabel} (#${trx.invoiceNumber.slice(-3)})`);
        const trxCost = trx.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.qty, 0);
        const trxProfit = trx.grandTotal - trxCost;

        if (curveMode === 'cumulative') {
          runningOmset += trx.grandTotal;
          runningModal += trxCost;
          runningLaba += trxProfit;
          omsetData.push(runningOmset);
          modalData.push(runningModal);
          labaData.push(runningLaba);
        } else {
          omsetData.push(trx.grandTotal);
          modalData.push(trxCost);
          labaData.push(trxProfit);
        }
      });

      return { labels, omsetData, modalData, labaData };
    }

    // If > 12 transactions: bucket into hourly slots
    const hourMap = new Map<string, { omset: number; modal: number; laba: number }>();
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    hours.forEach(h => hourMap.set(h, { omset: 0, modal: 0, laba: 0 }));

    sortedTrx.forEach(trx => {
      const hourNum = parseInt(trx.time?.split(':')[0] || '8', 10);
      const slotHour = `${hourNum.toString().padStart(2, '0')}:00`;
      const existing = hourMap.get(slotHour) || { omset: 0, modal: 0, laba: 0 };
      const trxCost = trx.items.reduce((sum, item) => sum + (item.costPrice || 0) * item.qty, 0);
      existing.omset += trx.grandTotal;
      existing.modal += trxCost;
      existing.laba += (trx.grandTotal - trxCost);
      hourMap.set(slotHour, existing);
    });

    const activeHours = Array.from(hourMap.keys());
    let runningOmset = 0;
    let runningModal = 0;
    let runningLaba = 0;

    const omsetData: number[] = [];
    const modalData: number[] = [];
    const labaData: number[] = [];

    activeHours.forEach(h => {
      const val = hourMap.get(h)!;
      if (curveMode === 'cumulative') {
        runningOmset += val.omset;
        runningModal += val.modal;
        runningLaba += val.laba;
        omsetData.push(runningOmset);
        modalData.push(runningModal);
        labaData.push(runningLaba);
      } else {
        omsetData.push(val.omset);
        modalData.push(val.modal);
        labaData.push(val.laba);
      }
    });

    return { labels: activeHours, omsetData, modalData, labaData };
  }, [relevantTransactions, selectedDateFilter, curveMode]);

  // Render Charts
  useEffect(() => {
    // 1. Financial Chart (Grafik Kurva Garis Fluktuasi Omset, Modal, Laba)
    if (financialChartRef.current) {
      if (financialChartInstance.current) financialChartInstance.current.destroy();

      const ctx = financialChartRef.current.getContext('2d');
      if (ctx) {
        // Create smooth vertical gradient fills for curve areas
        const createCurveGradient = (colorRgb: string) => {
          const grad = ctx.createLinearGradient(0, 0, 0, 260);
          grad.addColorStop(0, `rgba(${colorRgb}, 0.28)`);
          grad.addColorStop(0.6, `rgba(${colorRgb}, 0.08)`);
          grad.addColorStop(1, `rgba(${colorRgb}, 0.0)`);
          return grad;
        };

        financialChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: fluctuationData.labels,
            datasets: [
              {
                label: 'Kurva Omset (Pendapatan)',
                data: fluctuationData.omsetData,
                borderColor: '#10b981', // Emerald 500
                backgroundColor: createCurveGradient('16, 185, 129'),
                borderWidth: 3,
                tension: 0.38,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4.5,
                pointHoverRadius: 7.5
              },
              {
                label: 'Kurva Modal Pokok (HPP)',
                data: fluctuationData.modalData,
                borderColor: '#f59e0b', // Amber 500
                backgroundColor: createCurveGradient('245, 158, 11'),
                borderWidth: 2.5,
                tension: 0.38,
                fill: true,
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7
              },
              {
                label: 'Kurva Laba Bersih',
                data: fluctuationData.labaData,
                borderColor: '#8b5cf6', // Violet 500
                backgroundColor: createCurveGradient('139, 92, 246'),
                borderWidth: 3,
                tension: 0.38,
                fill: true,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                titleColor: '#ffffff',
                titleFont: { weight: 'bold', size: 12 },
                bodyColor: '#e2e8f0',
                bodyFont: { size: 11 },
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                  label: (context) => {
                    const val = Number(context.raw || 0);
                    return ` ${context.dataset.label}: Rp ${val.toLocaleString('id-ID')}`;
                  },
                  footer: (tooltipItems) => {
                    const omsetVal = Number(tooltipItems[0]?.raw || 0);
                    const labaVal = Number(tooltipItems[2]?.raw || 0);
                    if (omsetVal > 0) {
                      const margin = Math.round((labaVal / omsetVal) * 100);
                      return `Margin Laba: ${margin}%`;
                    }
                    return '';
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (val) => 'Rp ' + Number(val).toLocaleString('id-ID'),
                  color: '#94a3b8',
                  font: { size: 10 }
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
              },
              x: {
                ticks: {
                  color: '#94a3b8',
                  font: { size: 9.5 }
                },
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // 2. Modus Top 5 Produk Terlaris (Horizontal Bar Chart)
    if (modusChartRef.current) {
      if (modusChartInstance.current) modusChartInstance.current.destroy();

      const ctx = modusChartRef.current.getContext('2d');
      if (ctx) {
        const labels = statReport.topProductsList.map(p => p.productName);
        const dataValues = statReport.topProductsList.map(p => p.totalQtySold);

        modusChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length > 0 ? labels : ['Belum ada data'],
            datasets: [{
              label: 'Unit Terjual (Modus)',
              data: dataValues.length > 0 ? dataValues : [0],
              backgroundColor: '#f59e0b',
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.raw} unit terjual`
                }
              }
            },
            scales: {
              x: {
                ticks: { stepSize: 1 },
                grid: { color: 'rgba(0,0,0,0.05)' }
              },
              y: {
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // 3. Category Revenue Distribution (Doughnut)
    if (categoryChartRef.current) {
      if (categoryChartInstance.current) categoryChartInstance.current.destroy();

      const catMap = new Map<string, number>();
      relevantTransactions.forEach(t => {
        t.items.forEach(i => {
          catMap.set(i.category, (catMap.get(i.category) || 0) + i.subtotal);
        });
      });

      const catLabels = Array.from(catMap.keys());
      const catValues = Array.from(catMap.values());

      const ctx = categoryChartRef.current.getContext('2d');
      if (ctx) {
        categoryChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catLabels.length > 0 ? catLabels : ['Belum Ada Data'],
            datasets: [{
              data: catValues.length > 0 ? catValues : [1],
              backgroundColor: [
                '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: Rp ${Number(ctx.raw).toLocaleString('id-ID')}`
                }
              }
            }
          }
        });
      }
    }

    // 4. Payment Methods Distribution (Pie)
    if (paymentMethodChartRef.current) {
      if (paymentMethodChartInstance.current) paymentMethodChartInstance.current.destroy();

      const payMap = new Map<string, number>();
      relevantTransactions.forEach(t => {
        payMap.set(t.paymentMethod, (payMap.get(t.paymentMethod) || 0) + 1);
      });

      const payLabels = Array.from(payMap.keys()).map(p => p.toUpperCase());
      const payValues = Array.from(payMap.values());

      const ctx = paymentMethodChartRef.current.getContext('2d');
      if (ctx) {
        paymentMethodChartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: payLabels.length > 0 ? payLabels : ['Belum Ada Data'],
            datasets: [{
              data: payValues.length > 0 ? payValues : [1],
              backgroundColor: ['#10b981', '#06b6d4', '#6366f1', '#f43f5e']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } }
            }
          }
        });
      }
    }

    return () => {
      financialChartInstance.current?.destroy();
      modusChartInstance.current?.destroy();
      categoryChartInstance.current?.destroy();
      paymentMethodChartInstance.current?.destroy();
    };
  }, [statReport, relevantTransactions, fluctuationData]);

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Date Filter & Formula Explanation Trigger */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Rekap Data Statistik Harian GreenMart</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                MySQL View
              </span>
            </h2>
            <LiveClock variant="compact" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Perhitungan otomatis: Modus (Barang Terlaris), Mean (Rata-rata Omset), dan Total Pendapatan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Quick Date Pills */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDateFilter(todayStr)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                selectedDateFilter === todayStr
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setSelectedDateFilter(yesterdayStr)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                selectedDateFilter === yesterdayStr
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => setSelectedDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs sm:text-sm ${
                selectedDateFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Ekspor Laporan PDF Button */}
          <button
            type="button"
            onClick={() => setShowExportPdfModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
            title="Ekspor Laporan Keuangan & Statistik Resmi ke PDF (A4)"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>

          {/* Formula Explanation Button */}
          <button
            type="button"
            onClick={() => setShowSqlFormulaModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Rumus &amp; SQL</span>
          </button>

        </div>
      </div>

      {/* 4 PRIMARY METRIC CARDS (MODUS, MEAN, TOTAL REVENUE, NET PROFIT) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* 1. MODUS BARANG TERLARIS */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-800/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Modus Terlaris</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
              Top 1
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {statReport.topProductModus ? statReport.topProductModus.productName : 'Belum Ada Penjualan'}
            </h3>
            <div className="text-xs sm:text-sm font-mono font-bold text-amber-900 dark:text-amber-300 mt-0.5">
              {statReport.topProductModus ? `${statReport.topProductModus.totalQtySold} unit (${statReport.topProductModus.transactionCount}x nota)` : '0 unit'}
            </div>
          </div>

          <p className="text-xs text-amber-800/80 dark:text-amber-400 truncate pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
            {statReport.topProductModus?.percentageOfAllSales || 0}% dari seluruh item terjual
          </p>
        </div>

        {/* 2. MEAN / RATA-RATA OMSET PER TRANSAKSI */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/20 p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Mean (Rata-rata)</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
              AOV
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white truncate">
              Rp {statReport.meanRevenuePerTransaction.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 font-medium truncate">
              Rata-rata per nota pembeli
            </p>
          </div>

          <p className="text-xs text-blue-800/80 dark:text-blue-400 truncate pt-1 border-t border-blue-200/60 dark:border-blue-800/60">
            Median: Rp {statReport.medianRevenuePerTransaction.toLocaleString('id-ID')}
          </p>
        </div>

        {/* 3. TOTAL PENDAPATAN (OMSET) */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Total Pendapatan</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
              {statReport.totalTransactions} Nota
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white truncate">
              Rp {statReport.totalRevenue.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium truncate">
              {statReport.totalUnitsSold} unit barang keluar
            </p>
          </div>

          <p className="text-xs text-emerald-800/80 dark:text-emerald-400 truncate pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
            Omset kotor terverifikasi
          </p>
        </div>

        {/* 4. TOTAL LABA BERSIH */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/20 p-4 sm:p-5 rounded-2xl border border-purple-200 dark:border-purple-800/80 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Laba Bersih</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
              {statReport.profitMarginPercent}% Margin
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-3xl font-black font-mono text-purple-700 dark:text-purple-300 truncate">
              Rp {statReport.totalProfit.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs sm:text-sm text-purple-800 dark:text-purple-300 font-medium truncate">
              Modal: Rp {statReport.totalCost.toLocaleString('id-ID')}
            </p>
          </div>

          <p className="text-xs text-purple-800/80 dark:text-purple-400 truncate pt-1 border-t border-purple-200/60 dark:border-purple-800/60">
            Omset dikurangi modal HPP
          </p>
        </div>

      </div>

      {/* TOP 5 MODUS LEADERBOARD BREAKDOWN */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Klasemen Modus Produk Terlaris (Top 5 Barang Terbanyak Dibeli)
            </h3>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-400">
              Berdasarkan kuantitas &amp; frekuensi
            </span>
            <button
              type="button"
              onClick={() => setShowExportPdfModal(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-1 cursor-pointer"
              title="Unduh Laporan PDF Resmi Lengkap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th className="py-3 px-3.5">No</th>
                <th className="py-3 px-3.5">Nama Produk</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Frekuensi Nota</th>
                <th className="py-3 px-3.5">Total Qty Terjual</th>
                <th className="py-3 px-3.5">Porsi Penjualan</th>
                <th className="py-3 px-3.5 text-right">Total Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {statReport.topProductsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-slate-400 italic">
                    Belum ada data barang terjual pada periode ini.
                  </td>
                </tr>
              ) : (
                statReport.topProductsList.map((p, idx) => (
                  <tr key={p.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 
                          ? 'bg-amber-400 text-slate-950 font-black' 
                          : idx === 1 
                          ? 'bg-slate-200 text-slate-800' 
                          : idx === 2 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{p.productName}</div>
                      <div className="text-xs font-mono text-slate-400">{p.barcode}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 text-xs sm:text-sm">{p.category}</td>
                    <td className="py-3 px-3.5 font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      {p.transactionCount}x Transaksi
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                      {p.totalQtySold} Unit
                    </td>
                    <td className="py-3 px-3.5 w-40">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-500">
                          {p.percentageOfAllSales}%
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${p.percentageOfAllSales}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      Rp {p.totalRevenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 CHART.JS GRAPHS (COMFORTABLE HEIGHTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Kurva Garis Fluktuasi Omset, Modal & Laba */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Grafik 1: Perbandingan Omset, Modal, &amp; Laba (Kurva Garis Fluktuasi)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analisis pergerakan fluktuasi finansial real-time berbasis kurva spline
              </p>
            </div>

            {/* Curve View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setCurveMode('interval')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  curveMode === 'interval'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilkan pergerakan fluktuasi per jam/waktu transaksi"
              >
                Fluktuasi Waktu
              </button>
              <button
                type="button"
                onClick={() => setCurveMode('cumulative')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  curveMode === 'cumulative'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilkan kurva pertumbuhan akumulasi total"
              >
                Akumulasi
              </button>
            </div>
          </div>

          {/* Interactive Legend Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Kurva Omset:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                Rp {statReport.totalRevenue.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Kurva Modal:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                Rp {statReport.totalCost.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Kurva Laba:</span>
              <span className="font-bold text-purple-700 dark:text-purple-400 font-mono">
                Rp {statReport.totalProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 relative">
            <canvas ref={financialChartRef}></canvas>
          </div>
        </div>

        {/* Chart 2: Top 5 Modus Terlaris */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Grafik 2: Modus Barang Terlaris (Qty)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Horizontal Bar</span>
          </div>
          <div className="h-64 sm:h-72 relative">
            <canvas ref={modusChartRef}></canvas>
          </div>
        </div>

        {/* Chart 3: Category Revenue Distribution */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Grafik 3: Proporsi Omset per Kategori</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Doughnut</span>
          </div>
          <div className="h-64 sm:h-72 relative">
            <canvas ref={categoryChartRef}></canvas>
          </div>
        </div>

        {/* Chart 4: Payment Method Breakdown */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600" />
              <span>Grafik 4: Metode Pembayaran</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Pie</span>
          </div>
          <div className="h-64 sm:h-72 relative">
            <canvas ref={paymentMethodChartRef}></canvas>
          </div>
        </div>

      </div>

      {/* SQL FORMULA & LOGIC EXPLANATION MODAL */}
      {showSqlFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-800 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-300" />
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  Rumus Statistik &amp; Query MySQL GreenMart
                </h3>
              </div>
              <button
                onClick={() => setShowSqlFormulaModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              
              {/* Modus */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>1. Modus (Mode) Produk Terlaris</span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Data dengan frekuensi penjualan tertinggi di tabel transaksi:
                </p>
                <pre className="p-2.5 bg-slate-950 text-amber-300 rounded-lg font-mono text-[10px] overflow-x-auto">
{`SELECT td.nama_produk, SUM(td.qty) AS total_qty
FROM transaksi_detail td
JOIN transaksi t ON td.transaksi_id = t.id
WHERE t.tanggal = CURDATE()
GROUP BY td.barcode, td.nama_produk
ORDER BY total_qty DESC LIMIT 1;`}
                </pre>
              </div>

              {/* Mean */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
                <h4 className="font-bold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Mean (Rata-rata Omset per Nota)</span>
                </h4>
                <pre className="p-2.5 bg-slate-950 text-blue-300 rounded-xl font-mono text-[10px] overflow-x-auto">
{`SELECT AVG(total_belanja) AS mean_omset
FROM transaksi
WHERE tanggal = CURDATE();`}
                </pre>
              </div>

              {/* Total Pendapatan & Laba */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Total Pendapatan &amp; Laba Bersih</span>
                </h4>
                <pre className="p-2.5 bg-slate-950 text-emerald-300 rounded-xl font-mono text-[10px] overflow-x-auto">
{`SELECT 
  SUM(total_belanja) AS total_pendapatan,
  SUM(total_belanja) - SUM(td.qty * td.harga_beli) AS laba_bersih
FROM transaksi t
JOIN transaksi_detail td ON t.id = td.transaksi_id
WHERE t.tanggal = CURDATE();`}
                </pre>
              </div>

            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSqlFormulaModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXPORT STATISTICAL REPORT TO PDF MODAL */}
      <GreenMartExportPdfModal
        isOpen={showExportPdfModal}
        onClose={() => setShowExportPdfModal(false)}
        report={statReport}
        relevantTransactions={relevantTransactions}
        products={products}
        selectedDateFilter={selectedDateFilter}
        onShowToast={onShowToast}
      />

    </div>
  );
};
