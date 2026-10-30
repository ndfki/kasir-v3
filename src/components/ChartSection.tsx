import React, { useEffect, useRef, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  registerables,
  ChartData,
  ChartOptions
} from 'chart.js';
import { BarChart3, TrendingUp, PieChart, Donut, ShoppingCart } from 'lucide-react';
import { Sheet, ChartType, AggregationMethod } from '../types';
import { getItemType } from '../utils/itemClassification';

// Register all ChartJS controllers and components
ChartJS.register(...registerables);

interface ChartSectionProps {
  sheet: Sheet;
  isDarkMode?: boolean;
  onUpdateChartConfig: (newConfig: Sheet['chartConfig']) => void;
}

const PALETTE = [
  '#2563eb', // Blue 600
  '#4f46e5', // Indigo 600
  '#06b6d4', // Cyan 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ef4444', // Red 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#14b8a6', // Teal 500
  '#f97316'  // Orange 500
];

export const ChartSection: React.FC<ChartSectionProps> = ({
  sheet,
  isDarkMode = false,
  onUpdateChartConfig
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  const { chartConfig, columns, rows } = sheet;

  // Filter ONLY rows for items that have been sold (Penjualan / Transaksi)
  const soldRows = useMemo(() => {
    return rows.filter(r => getItemType(r, columns) === 'sold');
  }, [rows, columns]);

  // Filter valid columns for X and Y
  const numericColumns = columns.filter(c => c.type === 'number' || c.type === 'decimal');
  const xCol = columns.find(c => c.id === chartConfig.xAxisColId) || columns[0];
  const yCol = numericColumns.find(c => c.id === chartConfig.yAxisColId) || numericColumns[0];

  // Group and aggregate data ONLY from sold goods
  const groupedData: Record<string, number[]> = {};

  soldRows.forEach(row => {
    const rawX = row[xCol?.id || ''];
    const label = rawX !== undefined && rawX !== null && String(rawX).trim() !== '' 
      ? String(rawX) 
      : 'Lainnya';
    const num = yCol ? Number(row[yCol.id]) || 0 : 1;

    if (!groupedData[label]) {
      groupedData[label] = [];
    }
    groupedData[label].push(num);
  });

  const labels = Object.keys(groupedData);
  const aggregatedValues = labels.map(lbl => {
    const vals = groupedData[lbl];
    if (vals.length === 0) return 0;
    switch (chartConfig.aggregation) {
      case 'sum':
        return vals.reduce((a, b) => a + b, 0);
      case 'avg':
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      case 'count':
        return vals.length;
      case 'min':
        return Math.min(...vals);
      case 'max':
        return Math.max(...vals);
      default:
        return vals.reduce((a, b) => a + b, 0);
    }
  });

  // Render chart using ChartJS
  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const isPieOrDonut = chartConfig.type === 'pie' || chartConfig.type === 'doughnut';
    const isLine = chartConfig.type === 'line';

    const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);
    const borderColors = isLine 
      ? '#2563eb' 
      : isPieOrDonut 
      ? (isDarkMode ? '#1e293b' : '#ffffff')
      : colors;

    const data: ChartData = {
      labels,
      datasets: [
        {
          label: `${chartConfig.aggregation.toUpperCase()} ${yCol?.label || 'Data'}`,
          data: aggregatedValues,
          backgroundColor: isPieOrDonut
            ? colors
            : isLine
            ? 'rgba(37, 99, 235, 0.15)'
            : colors.map(c => c + 'cc'),
          borderColor: borderColors,
          borderWidth: isLine ? 2.5 : 1,
          fill: isLine,
          tension: 0.35,
          borderRadius: chartConfig.type === 'bar' ? 6 : 0
        }
      ]
    };

    const textColor = isDarkMode ? '#94a3b8' : '#64748b';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9';

    const options: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: isPieOrDonut,
          position: 'bottom',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            color: isDarkMode ? '#cbd5e1' : '#334155',
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#1e293b' : '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          callbacks: {
            label: function (context) {
              const val = context.raw as number;
              return ` ${context.dataset.label}: ${val.toLocaleString('id-ID', { maximumFractionDigits: 2 })}`;
            }
          }
        }
      },
      scales: isPieOrDonut ? {} : {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: textColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            font: { size: 11 },
            color: textColor,
            callback: function (val) {
              const n = Number(val);
              if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'M';
              if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'Jt';
              if (n >= 1_000) return (n / 1_000).toFixed(1) + 'Rb';
              return n.toLocaleString('id-ID');
            }
          }
        }
      }
    };

    chartInstanceRef.current = new ChartJS(ctx, {
      type: chartConfig.type,
      data,
      options
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [sheet.id, chartConfig, soldRows, isDarkMode]);

  const handleTypeChange = (type: ChartType) => {
    onUpdateChartConfig({ ...chartConfig, type });
  };

  const handleXChange = (xAxisColId: string) => {
    onUpdateChartConfig({ ...chartConfig, xAxisColId });
  };

  const handleYChange = (yAxisColId: string) => {
    onUpdateChartConfig({ ...chartConfig, yAxisColId });
  };

  const handleAggChange = (aggregation: AggregationMethod) => {
    onUpdateChartConfig({ ...chartConfig, aggregation });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
      {/* Top Header & Chart Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {chartConfig.title || 'Grafik Statistik Penjualan'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Live Chart.js
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShoppingCart className="w-3 h-3" />
              Khusus Barang Terjual ({soldRows.length} transaksi)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Agregasi transaksi barang terjual dari Sheet <strong>{sheet.name}</strong> (Stok inventori siap jual dipisahkan)
          </p>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => handleTypeChange('bar')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartConfig.type === 'bar' 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grafik Batang (Bar)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleTypeChange('line')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartConfig.type === 'line' 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grafik Garis (Line)"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleTypeChange('pie')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartConfig.type === 'pie' 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grafik Lingkaran (Pie)"
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleTypeChange('doughnut')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                chartConfig.type === 'doughnut' 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grafik Donat (Doughnut)"
            >
              <Donut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sumbu X (Kategori) */}
          <div className="flex items-center">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1.5 hidden sm:inline">X:</label>
            <select
              value={chartConfig.xAxisColId}
              onChange={(e) => handleXChange(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-blue-500"
            >
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sumbu Y (Numerik) */}
          {numericColumns.length > 0 && (
            <div className="flex items-center">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1.5 hidden sm:inline">Y:</label>
              <select
                value={chartConfig.yAxisColId}
                onChange={(e) => handleYChange(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-blue-500"
              >
                {numericColumns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metode Agregasi */}
          <div className="flex items-center">
            <select
              value={chartConfig.aggregation}
              onChange={(e) => handleAggChange(e.target.value as AggregationMethod)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-blue-500"
            >
              <option value="sum">Sum (Jumlah)</option>
              <option value="avg">Avg (Rata-rata)</option>
              <option value="count">Count (Frekuensi)</option>
              <option value="max">Max (Maksimal)</option>
              <option value="min">Min (Minimal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64 sm:h-72 w-full">
        {soldRows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Belum ada transaksi barang terjual pada Sheet ini
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm">
              Grafik statistik khusus memvisualisasikan data penjualan/omset. Stok inventori yang tersedia dipisahkan dari grafik omset ini. Silakan input transaksi via Kasir POS.
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>
    </div>
  );
};
