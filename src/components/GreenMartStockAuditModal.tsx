import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scale, 
  X, 
  Search, 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileDown, 
  Save, 
  Check, 
  RotateCcw, 
  Filter, 
  ShieldCheck, 
  HelpCircle,
  Plus,
  Minus,
  Sparkles,
  Layers,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { GreenMartProduct, CashierProfile, StockComparisonItem } from '../types';
import { GREENMART_CATEGORIES } from '../data/greenmartData';
import { 
  exportStockOpnameAuditPdf, 
  printStockOpnameAuditPdf 
} from '../utils/statisticsPdfGenerator';
import { GreenMartExportStockAuditPdfModal } from './GreenMartExportStockAuditPdfModal';

interface GreenMartStockAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: GreenMartProduct[];
  activeCashier?: CashierProfile;
  onReconcileStocks: (updatedProducts: GreenMartProduct[]) => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const STORAGE_KEY = 'greenmart_stock_audit_session_v2';

const REASON_OPTIONS = [
  'Sesuai',
  'Rusak / Pecah / Kadaluarsa',
  'Hilang / Selisih Fisik',
  'Salah Catat / Human Error',
  'Barang Contoh / Display',
  'Retur Belum Dicatat',
  'Barang Masuk Belum Terinput',
  'Penyusutan Alami'
];

export const GreenMartStockAuditModal: React.FC<GreenMartStockAuditModalProps> = ({
  isOpen,
  onClose,
  products,
  activeCashier,
  onReconcileStocks,
  onShowToast
}) => {
  // State for comparison items
  const [auditItems, setAuditItems] = useState<StockComparisonItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'discrepancy' | 'minus' | 'surplus' | 'match'>('all');
  
  // Barcode quick scan input
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);

  // Personalisasi Pengesahan Berita Acara
  const [auditorName, setAuditorName] = useState(() => activeCashier?.name || 'Petugas Pemeriksa Gudang');
  const [managerName, setManagerName] = useState('Bambang S., S.E.');
  const [storeCity, setStoreCity] = useState('Batang');
  const [customNotes, setCustomNotes] = useState(
    'Berita acara audit fisik ini dilakukan untuk menyesuaikan stok gudang aktual dengan data sistem POS GreenMart.'
  );

  // Confirm modal for reconciliation
  const [isConfirmReconcileOpen, setIsConfirmReconcileOpen] = useState(false);

  // Modal personalisasi ekspor PDF Berita Acara (sesuai stockopname-personalisasi.png)
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);

  // Initialize or restore session
  useEffect(() => {
    if (!isOpen) return;

    let savedSession: Record<string, { physical: number; notes: string }> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedSession = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse saved audit session:', e);
    }

    const initial = products.map(p => {
      const saved = savedSession[p.id];
      const physical = saved ? saved.physical : p.stock;
      const diff = physical - p.stock;
      const status: 'match' | 'minus' | 'surplus' = diff === 0 ? 'match' : diff < 0 ? 'minus' : 'surplus';
      return {
        productId: p.id,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        systemStock: p.stock,
        physicalStock: physical,
        difference: diff,
        financialDiffHpp: diff * p.costPrice,
        unit: p.unit,
        status,
        notes: saved?.notes || (diff === 0 ? 'Sesuai' : 'Perlu Investigasi'),
        isAudited: !!saved
      };
    });

    setAuditItems(initial);
    if (activeCashier?.name) {
      setAuditorName(activeCashier.name);
    }
  }, [isOpen, products, activeCashier]);

  // Persist session on changes
  const saveSession = (items: StockComparisonItem[]) => {
    try {
      const sessionMap: Record<string, { physical: number; notes: string }> = {};
      items.forEach(i => {
        sessionMap[i.productId] = {
          physical: i.physicalStock,
          notes: i.notes
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionMap));
    } catch (e) {
      console.warn('Failed to save audit session:', e);
    }
  };

  // Play audio beep on barcode scan
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  // Update physical stock for a specific product
  const handleUpdatePhysical = (productId: string, newPhysical: number, newNotes?: string) => {
    const val = Math.max(0, Number(newPhysical) || 0);
    setAuditItems(prev => {
      const updated = prev.map(item => {
        if (item.productId === productId) {
          const diff = val - item.systemStock;
          const status: 'match' | 'minus' | 'surplus' = diff === 0 ? 'match' : diff < 0 ? 'minus' : 'surplus';
          let note = newNotes !== undefined ? newNotes : item.notes;
          if (newNotes === undefined && diff === 0 && item.notes === 'Perlu Investigasi') {
            note = 'Sesuai';
          }
          return {
            ...item,
            physicalStock: val,
            difference: diff,
            financialDiffHpp: diff * item.costPrice,
            status,
            notes: note,
            isAudited: true,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      saveSession(updated);
      return updated;
    });
  };

  // Handle quick barcode scan
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = barcodeInput.trim();
    if (!clean) return;

    const target = auditItems.find(i => i.barcode.toLowerCase() === clean.toLowerCase() || i.barcode.includes(clean));
    if (target) {
      playBeep();
      handleUpdatePhysical(target.productId, target.physicalStock + 1);
      setLastScannedBarcode(target.barcode);
      setBarcodeInput('');
      if (onShowToast) {
        onShowToast(`Scan: ${target.name} (+1 Fisik: ${target.physicalStock + 1} ${target.unit})`, 'info');
      }
    } else {
      if (onShowToast) {
        onShowToast(`Barcode "${clean}" tidak ditemukan dalam katalog barang.`, 'error');
      }
    }
  };

  // Set all physical = system
  const handleMatchAllToSystem = () => {
    setAuditItems(prev => {
      const updated = prev.map(item => ({
        ...item,
        physicalStock: item.systemStock,
        difference: 0,
        financialDiffHpp: 0,
        status: 'match' as const,
        notes: 'Sesuai',
        isAudited: true
      }));
      saveSession(updated);
      return updated;
    });
    if (onShowToast) {
      onShowToast('Semua stok fisik diselaraskan sama dengan stok sistem.', 'info');
    }
  };

  // Reset physical counts
  const handleResetAudit = () => {
    setAuditItems(prev => {
      const updated = prev.map(item => ({
        ...item,
        physicalStock: item.systemStock,
        difference: 0,
        financialDiffHpp: 0,
        status: 'match' as const,
        notes: 'Sesuai',
        isAudited: false
      }));
      localStorage.removeItem(STORAGE_KEY);
      return updated;
    });
    if (onShowToast) {
      onShowToast('Hitungan audit fisik telah direset ke nilai awal.', 'info');
    }
  };

  // Calculations for summary KPI
  const totalSku = auditItems.length;
  const matchItems = auditItems.filter(i => i.difference === 0);
  const minusItems = auditItems.filter(i => i.difference < 0);
  const surplusItems = auditItems.filter(i => i.difference > 0);
  const discrepancyItems = auditItems.filter(i => i.difference !== 0);

  const totalSystemUnits = auditItems.reduce((sum, i) => sum + i.systemStock, 0);
  const totalPhysicalUnits = auditItems.reduce((sum, i) => sum + i.physicalStock, 0);
  const totalNetDiffUnits = totalPhysicalUnits - totalSystemUnits;
  const totalFinancialDiffHpp = auditItems.reduce((sum, i) => sum + i.financialDiffHpp, 0);

  // Filtered display items
  const filteredItems = useMemo(() => {
    return auditItems.filter(item => {
      const matchCat = selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.barcode.includes(searchQuery);

      let matchStatus = true;
      if (statusFilter === 'discrepancy') matchStatus = item.difference !== 0;
      else if (statusFilter === 'minus') matchStatus = item.difference < 0;
      else if (statusFilter === 'surplus') matchStatus = item.difference > 0;
      else if (statusFilter === 'match') matchStatus = item.difference === 0;

      return matchCat && matchSearch && matchStatus;
    });
  }, [auditItems, selectedCategory, searchQuery, statusFilter]);

  // Execute reconciliation into POS products
  const handleApplyReconciliation = () => {
    // Map new physical stock directly to original products
    const updatedProducts: GreenMartProduct[] = products.map(prod => {
      const audit = auditItems.find(a => a.productId === prod.id);
      if (audit && audit.difference !== 0) {
        return {
          ...prod,
          stock: audit.physicalStock,
          updatedAt: new Date().toISOString()
        };
      }
      return prod;
    });

    onReconcileStocks(updatedProducts);
    setIsConfirmReconcileOpen(false);
    localStorage.removeItem(STORAGE_KEY);
    if (onShowToast) {
      onShowToast(
        `Rekonsiliasi berhasil! Stok sistem telah diperbarui sesuai kondisi fisik gudang (${discrepancyItems.length} produk disesuaikan).`,
        'success'
      );
    }
    onClose();
  };

  // Export PDF Berita Acara
  const handleExportPdf = () => {
    try {
      exportStockOpnameAuditPdf(auditItems, {
        auditorName,
        managerName,
        storeCity,
        customNotes,
        filterMode: statusFilter === 'discrepancy' ? 'discrepancy' : 'all'
      });
      if (onShowToast) {
        onShowToast('Berita acara audit stock opname (PDF) berhasil diunduh!', 'success');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      if (onShowToast) {
        onShowToast('Gagal membuat dokumen PDF audit.', 'error');
      }
    }
  };

  // Print PDF Berita Acara
  const handlePrintPdf = () => {
    try {
      printStockOpnameAuditPdf(auditItems, {
        auditorName,
        managerName,
        storeCity,
        customNotes,
        filterMode: statusFilter === 'discrepancy' ? 'discrepancy' : 'all'
      });
      if (onShowToast) {
        onShowToast('Membuka dialog cetak berita acara stock opname...', 'info');
      }
    } catch (err) {
      console.error('Print PDF error:', err);
      if (onShowToast) {
        onShowToast('Gagal mencetak dokumen.', 'error');
      }
    }
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    try {
      const headers = [
        'No',
        'Barcode',
        'Nama Produk',
        'Kategori',
        'Stok Sistem (Buku)',
        'Stok Fisik (Gudang)',
        'Selisih Unit (Varian)',
        'Satuan',
        'Harga Modal (HPP)',
        'Valuasi Selisih HPP (Rp)',
        'Harga Jual',
        'Valuasi Selisih Jual (Rp)',
        'Status Rekonsiliasi',
        'Keterangan / Alasan'
      ];

      const rows = auditItems.map((item, idx) => [
        idx + 1,
        item.barcode,
        item.name,
        item.category,
        item.systemStock,
        item.physicalStock,
        item.difference,
        item.unit,
        item.costPrice,
        item.financialDiffHpp,
        item.sellingPrice,
        item.difference * item.sellingPrice,
        item.difference === 0 ? 'SESUAI' : item.difference < 0 ? 'MINUS' : 'SURPLUS',
        item.notes
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['BERITA ACARA AUDIT STOCK OPNAME & PEMBANDING STOK FISIK GUDANG - GREENMART BATANG'],
        ['Waktu Audit', new Date().toLocaleString('id-ID')],
        ['Petugas Pemeriksa', auditorName],
        ['Manajer Operasional', managerName],
        ['Total SKU', totalSku],
        ['Total Produk Sesuai (Klop)', matchItems.length],
        ['Total Produk Berselisih', discrepancyItems.length],
        ['Total Valuasi Selisih HPP', totalFinancialDiffHpp],
        [''],
        headers,
        ...rows
      ]);

      XLSX.utils.book_append_sheet(wb, ws, 'Stock_Opname_Gudang');
      const todayStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Stock_Opname_Gudang_vs_Sistem_${todayStr}.xlsx`);

      if (onShowToast) {
        onShowToast('Berkas excel perbandingan stok gudang berhasil diunduh!', 'success');
      }
    } catch (err) {
      console.error('Excel export error:', err);
      if (onShowToast) {
        onShowToast('Gagal mengekspor berkas Excel.', 'error');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs shadow-inner">
              <Scale className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Sistem Pembanding Stok: Fisik Gudang vs Sistem
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950">
                  Stock Opname
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Audit rekonsiliasi barang fisik aktual di gudang dengan catatan buku sistem POS
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

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
          
          {/* Card 1: Total SKU */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total SKU Barang
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {totalSku} <span className="text-xs font-normal text-slate-400">Produk</span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {totalPhysicalUnits} Unit Fisik Terhitung
            </span>
          </div>

          {/* Card 2: Klop / Sesuai */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Sesuai (Klop)</span>
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {matchItems.length} <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block">
              {Math.round((matchItems.length / (totalSku || 1)) * 100)}% Akurasi Stok
            </span>
          </div>

          {/* Card 3: Selisih Kurang (Minus) */}
          <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border ${
            minusItems.length > 0 ? 'border-rose-200 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-rose-600" />
              <span>Stok Minus (Hilang)</span>
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {minusItems.length} <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <span className="text-[10px] text-rose-500 font-semibold block truncate">
              {minusItems.reduce((s, i) => s + Math.abs(i.difference), 0)} Unit Kurang
            </span>
          </div>

          {/* Card 4: Selisih Lebih (Surplus) */}
          <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border ${
            surplusItems.length > 0 ? 'border-blue-200 dark:border-blue-900/60' : 'border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-blue-600" />
              <span>Stok Surplus (Lebih)</span>
            </span>
            <div className="text-base sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {surplusItems.length} <span className="text-xs font-normal text-slate-400">SKU</span>
            </div>
            <span className="text-[10px] text-blue-500 font-semibold block truncate">
              +{surplusItems.reduce((s, i) => s + i.difference, 0)} Unit Lebih
            </span>
          </div>

          {/* Card 5: Valuasi Selisih HPP */}
          <div className={`col-span-2 md:col-span-1 p-3 rounded-2xl bg-white dark:bg-slate-900 border ${
            totalFinancialDiffHpp < 0 
              ? 'border-rose-300 dark:border-rose-800' 
              : totalFinancialDiffHpp > 0 
              ? 'border-blue-300 dark:border-blue-800' 
              : 'border-emerald-300 dark:border-emerald-800'
          }`}>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Valuasi Selisih (HPP)
            </span>
            <div className={`text-sm sm:text-base font-black font-mono mt-0.5 truncate ${
              totalFinancialDiffHpp < 0 
                ? 'text-rose-600 dark:text-rose-400' 
                : totalFinancialDiffHpp > 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {totalFinancialDiffHpp > 0 ? '+' : ''}Rp {totalFinancialDiffHpp.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {totalFinancialDiffHpp < 0 ? 'Potensi Kerugian Modal' : totalFinancialDiffHpp > 0 ? 'Surplus Aset Modal' : 'Aset Klop Sempurna'}
            </span>
          </div>

        </div>

        {/* Toolbar: Barcode Scanner, Search, Filters, and Batch Actions (Responsive for Mobile & Desktop) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 shrink-0">
          
          {/* Row 1 on Mobile: Quick Barcode Scanner Input */}
          <form onSubmit={handleBarcodeScan} className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode fisik gudang..."
                className="w-full text-xs font-mono font-bold pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-2xs"
            >
              + 1 Fisik
            </button>
          </form>

          {/* Row 2 on Mobile: Search, Category Filter, and Status Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / barcode..."
                className="w-full text-xs pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
            >
              <option value="Semua">Semua Kategori</option>
              {GREENMART_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Filter Tabs and Actions Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              
              {/* Status Tabs */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua ({totalSku})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('discrepancy')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'discrepancy'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                  }`}
                  title="Hanya tampilkan produk dengan selisih fisik vs sistem"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Selisih ({discrepancyItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('match')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer hidden sm:inline ${
                    statusFilter === 'match'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  Klop ({matchItems.length})
                </button>
              </div>

              {/* Batch Helper Actions */}
              <button
                type="button"
                onClick={handleMatchAllToSystem}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer shrink-0 whitespace-nowrap"
                title="Isi cepat semua stok fisik sama dengan stok sistem saat ini"
              >
                Klopkan Semua
              </button>

              <button
                type="button"
                onClick={handleResetAudit}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer shrink-0"
                title="Reset hitungan audit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

            </div>

          </div>

        </div>

        {/* Main List: Comparison Data (Mobile Card View + Desktop Table) */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 bg-slate-100 dark:bg-slate-950">
          
          {/* MOBILE VIEW: COMPACT TOUCH-FRIENDLY CARDS (< md screens) */}
          <div className="md:hidden space-y-2.5">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                Tidak ada barang yang cocok dengan filter pencarian.
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isHighlighted = item.barcode === lastScannedBarcode;
                const hasDiscrepancy = item.difference !== 0;

                return (
                  <div
                    key={item.productId}
                    className={`p-3 rounded-2xl border transition-all ${
                      isHighlighted
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-sm'
                        : hasDiscrepancy
                        ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    {/* Header: Name, Category, & Barcode */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {idx + 1}. {item.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.barcode}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {item.category}
                      </span>
                    </div>

                    {/* Middle Row: Comparison Metrics */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Stok Sistem (Buku)</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.systemStock} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Status Selisih</span>
                        {item.difference === 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>0 Klop</span>
                          </span>
                        ) : item.difference < 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono font-black text-[11px] text-rose-600 dark:text-rose-400">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>{item.difference} {item.unit}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono font-black text-[11px] text-blue-600 dark:text-blue-400">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>+{item.difference} {item.unit}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Counter & Financial Discrepancy Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10.5px] font-bold text-slate-500 mr-1">Fisik:</span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdatePhysical(item.productId, item.physicalStock - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={item.physicalStock}
                            onChange={(e) => handleUpdatePhysical(item.productId, Number(e.target.value))}
                            className="w-16 py-1 px-1.5 text-center font-mono font-black text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdatePhysical(item.productId, item.physicalStock + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex items-center justify-center text-white transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9.5px] text-slate-400 block">Valuasi HPP</span>
                        <span className={`font-mono font-bold text-xs ${
                          item.financialDiffHpp < 0 
                            ? 'text-rose-600 dark:text-rose-400' 
                            : item.financialDiffHpp > 0 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-slate-400'
                        }`}>
                          {item.financialDiffHpp > 0 ? '+' : ''}Rp {item.financialDiffHpp.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Reason Dropdown & Quick Match Button */}
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <select
                        value={item.notes}
                        onChange={(e) => handleUpdatePhysical(item.productId, item.physicalStock, e.target.value)}
                        className={`flex-1 text-[10.5px] font-semibold px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-800 focus:outline-emerald-500 transition ${
                          hasDiscrepancy 
                            ? 'border-amber-300 text-amber-900 dark:text-amber-200 dark:border-amber-700' 
                            : 'border-slate-200 text-slate-700 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {REASON_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {hasDiscrepancy && (
                        <button
                          type="button"
                          onClick={() => handleUpdatePhysical(item.productId, item.systemStock, 'Sesuai')}
                          className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
                          title="Samakan fisik dengan stok sistem"
                        >
                          Samakan
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE VIEW (>= md screens) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black tracking-wider uppercase text-[11px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Produk &amp; Barcode</th>
                    <th className="py-3 px-3 text-center">Kategori</th>
                    <th className="py-3 px-3 text-center bg-slate-100/60 dark:bg-slate-800/40">
                      Stok Sistem (Buku)
                    </th>
                    <th className="py-3 px-3 text-center bg-emerald-50/50 dark:bg-emerald-950/30">
                      Stok Fisik Gudang
                    </th>
                    <th className="py-3 px-3 text-center">Selisih (Varian)</th>
                    <th className="py-3 px-3 text-right">Valuasi HPP</th>
                    <th className="py-3 px-3">Keterangan / Alasan Selisih</th>
                    <th className="py-3 px-2 text-center w-20">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ada barang yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const isHighlighted = item.barcode === lastScannedBarcode;
                      const hasDiscrepancy = item.difference !== 0;

                      return (
                        <tr 
                          key={item.productId}
                          className={`transition-colors ${
                            isHighlighted 
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/70 font-semibold' 
                              : hasDiscrepancy 
                              ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* No */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Product & Barcode */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3 h-3 text-slate-400" />
                              <span>{item.barcode}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.category}
                            </span>
                          </td>

                          {/* System Stock */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold bg-slate-50/60 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300">
                            {item.systemStock} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                          </td>

                          {/* Physical Stock Counter */}
                          <td className="py-2 px-2 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdatePhysical(item.productId, item.physicalStock - 1)}
                                className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
                                title="Kurang 1 fisik"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              
                              <input
                                type="number"
                                min="0"
                                value={item.physicalStock}
                                onChange={(e) => handleUpdatePhysical(item.productId, Number(e.target.value))}
                                className="w-16 py-1 px-1.5 text-center font-mono font-black text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdatePhysical(item.productId, item.physicalStock + 1)}
                                className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white transition cursor-pointer"
                                title="Tambah 1 fisik"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Difference / Varian Badge */}
                          <td className="py-2.5 px-3 text-center">
                            {item.difference === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>0 Klop</span>
                              </span>
                            ) : item.difference < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-black text-[11px] bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                <span>{item.difference} {item.unit}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-black text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                <ArrowUpRight className="w-3 h-3 text-blue-600" />
                                <span>+{item.difference} {item.unit}</span>
                              </span>
                            )}
                          </td>

                          {/* Financial Value of Discrepancy */}
                          <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                            item.financialDiffHpp < 0 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : item.financialDiffHpp > 0 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-slate-400'
                          }`}>
                            {item.financialDiffHpp > 0 ? '+' : ''}Rp {item.financialDiffHpp.toLocaleString('id-ID')}
                          </td>

                          {/* Reason / Notes Selection */}
                          <td className="py-2 px-2">
                            <select
                              value={item.notes}
                              onChange={(e) => handleUpdatePhysical(item.productId, item.physicalStock, e.target.value)}
                              className={`w-full text-[11px] font-semibold px-2 py-1 rounded-lg border bg-white dark:bg-slate-800 focus:outline-emerald-500 transition ${
                                hasDiscrepancy 
                                   ? 'border-amber-300 text-amber-900 dark:text-amber-200 dark:border-amber-700' 
                                  : 'border-slate-200 text-slate-700 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {REASON_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>

                          {/* Quick Action: Match to System */}
                          <td className="py-2 px-2 text-center">
                            {hasDiscrepancy && (
                              <button
                                type="button"
                                onClick={() => handleUpdatePhysical(item.productId, item.systemStock, 'Sesuai')}
                                className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 hover:text-emerald-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                title="Samakan fisik dengan stok sistem"
                              >
                                Samakan
                              </button>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions: Personalization & Reconciliation Execution (Responsive for Mobile & Desktop) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
          
          {/* Status Discrepancy Text */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
              Status Audit:
            </span>
            {discrepancyItems.length === 0 ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">100% Selaras (Tidak ada selisih stok)</span>
              </span>
            ) : (
              <span className="text-rose-600 font-bold flex items-center gap-1 truncate">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ditemukan {discrepancyItems.length} produk berselisih ({totalFinancialDiffHpp < 0 ? 'Defisit' : 'Surplus'} Rp {Math.abs(totalFinancialDiffHpp).toLocaleString('id-ID')})</span>
              </span>
            )}
          </div>

          {/* Action Buttons: Responsive Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
            
            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Unduh tabel hasil perbandingan fisik vs sistem ke format Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span>Excel</span>
            </button>

            {/* Print Berita Acara */}
            <button
              type="button"
              onClick={() => setIsExportPdfModalOpen(true)}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Cetak langsung berita acara stock opname (dengan personalisasi lembar pengesahan)"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span>Cetak</span>
            </button>

            {/* Download PDF Berita Acara */}
            <button
              type="button"
              onClick={() => setIsExportPdfModalOpen(true)}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Unduh berkas PDF Berita Acara resmi ber-kop GreenMart Batang dengan personalisasi petugas & manajer"
            >
              <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />
              <span className="truncate">PDF Berita Acara</span>
            </button>

            {/* Apply Reconciliation to System Stock */}
            <button
              type="button"
              onClick={() => setIsConfirmReconcileOpen(true)}
              disabled={discrepancyItems.length === 0}
              className="col-span-3 sm:col-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Perbarui stok di sistem kasir POS agar sama persis dengan fisik riil gudang"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Rekonsiliasi ke Sistem ({discrepancyItems.length})</span>
            </button>

          </div>

        </div>

      </div>

      {/* Confirmation Modal Before Applying Reconciliation */}
      {isConfirmReconcileOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Terapkan Rekonsiliasi Stok?
                </h4>
                <p className="text-xs text-slate-500">
                  Sinkronisasi stok fisik gudang ke database sistem POS
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Produk yang Diselaraskan:</span>
                <span className="font-mono text-emerald-600 font-black">{discrepancyItems.length} SKU Barang</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Selisih Kuantitas Bersih:</span>
                <span className="font-mono">{totalNetDiffUnits > 0 ? `+${totalNetDiffUnits}` : totalNetDiffUnits} Unit</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Penyesuaian Valuasi Modal:</span>
                <span className={`font-mono font-black ${totalFinancialDiffHpp < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                  {totalFinancialDiffHpp > 0 ? '+' : ''}Rp {totalFinancialDiffHpp.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                Stok barang pada sistem kasir dan inventaris akan langsung diganti dengan nilai fisik gudang yang baru Anda hitung.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmReconcileOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyReconciliation}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition cursor-pointer"
              >
                Ya, Perbarui Stok Sistem
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PERSONALISASI EKSPOR PDF BERITA ACARA STOCK OPNAME (sesuai stockopname-personalisasi.png & personalisasi-dokumen.png) */}
      <GreenMartExportStockAuditPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        items={auditItems}
        summary={{
          totalSku: totalSku,
          totalAudited: auditItems.filter(i => i.isAudited).length,
          totalSystemStock: totalSystemUnits,
          totalPhysicalStock: totalPhysicalUnits,
          matchedCount: matchItems.length,
          minusCount: minusItems.length,
          surplusCount: surplusItems.length,
          netDifferenceUnits: totalNetDiffUnits,
          totalFinancialDiffHpp: totalFinancialDiffHpp,
          accuracyRate: totalSku > 0 ? Math.round((matchItems.length / totalSku) * 100) : 100
        }}
        activeCashier={activeCashier}
        onShowToast={onShowToast}
      />

    </div>
  );
};
