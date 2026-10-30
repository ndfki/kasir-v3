import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Download, 
  Upload,
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Edit3, 
  Filter, 
  X, 
  RotateCcw, 
  Calendar, 
  Hash, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ListFilter, 
  ShoppingCart, 
  LayoutGrid, 
  Table as TableIcon,
  AlertTriangle,
  Check,
  Package,
  Layers,
  MoreHorizontal,
  Receipt,
  Printer,
  Copy,
  FileText
} from 'lucide-react';
import { Sheet, SheetRow, ColumnDefinition } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { 
  getItemType, 
  getItemStockStatus, 
  getItemSoldInfo, 
  getSheetMetrics 
} from '../utils/itemClassification';
import {
  ReceiptData,
  printReceiptTicket,
  downloadReceiptToStorage,
  copyReceiptToClipboard
} from '../utils/receiptGenerator';

interface DataTableProps {
  sheet: Sheet;
  isDarkMode?: boolean;
  onAddRow: () => void;
  onEditRow: (row: SheetRow) => void;
  onDeleteRow: (rowId: string) => void;
  onManageColumns: () => void;
  onOpenExportModal: (filteredRows: SheetRow[]) => void;
  onOpenImportModal: () => void;
  onOpenCashierModal: () => void;
  onOpenCashierWithItem?: (itemName: string, unitPrice?: number, category?: string) => void;
  onOpenProductSettings?: () => void;
  onSettleDebt?: (rowId: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  sheet,
  isDarkMode = false,
  onAddRow,
  onEditRow,
  onDeleteRow,
  onManageColumns,
  onOpenExportModal,
  onOpenImportModal,
  onOpenCashierModal,
  onOpenCashierWithItem,
  onOpenProductSettings,
  onSettleDebt,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  // Confirmations
  const [rowToDelete, setRowToDelete] = useState<SheetRow | null>(null);
  const [debtToSettleRowId, setDebtToSettleRowId] = useState<string | null>(null);

  // Core item differentiation filter tab: 'all' | 'stock' | 'sold' | 'piutang'
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'stock' | 'sold' | 'piutang'>('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumnId, setSearchColumnId] = useState<string>('all');

  // Toggle filter panel & mobile more actions menu
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Column specific filters
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [numericRanges, setNumericRanges] = useState<Record<string, { min: string; max: string }>>({});
  const [dateRanges, setDateRanges] = useState<Record<string, { start: string; end: string }>>({});

  // Sorting & Pagination
  const [sortColumnId, setSortColumnId] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Auto-detect key columns
  const itemCol = sheet.columns.find(c => 
    c.name.includes('produk') || c.name.includes('item') || c.name.includes('nama') || 
    c.label.toLowerCase().includes('produk') || c.label.toLowerCase().includes('item')
  ) || sheet.columns[1] || sheet.columns[0];

  const priceCol = sheet.columns.find(c => 
    c.name.includes('harga') || c.name.includes('price') || c.name.includes('satuan') ||
    c.label.toLowerCase().includes('harga')
  );

  const qtyCol = sheet.columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') ||
    c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || sheet.columns.find(c => c.type === 'number');

  const categoryCol = sheet.columns.find(c => c.type === 'category');

  // Live metrics calculation for items
  const metrics = useMemo(() => getSheetMetrics(sheet), [sheet]);

  // Counts for segmented tabs
  const tabCounts = useMemo(() => {
    let stockItems = 0;
    let soldItems = 0;
    let piutangItems = 0;

    sheet.rows.forEach(r => {
      const type = getItemType(r, sheet.columns);
      if (type === 'stock') stockItems++;
      if (type === 'sold') soldItems++;
      const soldInfo = getItemSoldInfo(r, sheet.columns);
      if (soldInfo.isPiutang) piutangItems++;
    });

    return {
      all: sheet.rows.length,
      stock: stockItems,
      sold: soldItems,
      piutang: piutangItems
    };
  }, [sheet.rows, sheet.columns]);

  // Selected sold row for Receipt Printing & Local Storage Download Modal
  const [selectedReceiptRow, setSelectedReceiptRow] = useState<SheetRow | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Formatted Receipt payload constructed from selected sold SheetRow
  const activeReceiptData = useMemo<ReceiptData | null>(() => {
    if (!selectedReceiptRow) return null;
    const soldInfo = getItemSoldInfo(selectedReceiptRow, sheet.columns);
    const codeCol = sheet.columns.find(c => 
      c.name.includes('kode') || c.name.includes('trx') || c.name.includes('nip') || c.label.toLowerCase().includes('kode')
    );
    const dateCol = sheet.columns.find(c => c.type === 'date');
    const catCol = sheet.columns.find(c => c.type === 'category');
    const custCol = sheet.columns.find(c => 
      c.name.includes('pelanggan') || c.name.includes('customer') || c.name.includes('debitur') || c.label.toLowerCase().includes('pelanggan')
    );

    const trxCode = codeCol && selectedReceiptRow[codeCol.id] 
      ? String(selectedReceiptRow[codeCol.id]) 
      : `TRX-${selectedReceiptRow.id.slice(-6).toUpperCase()}`;

    const itemName = itemCol && selectedReceiptRow[itemCol.id] 
      ? String(selectedReceiptRow[itemCol.id]) 
      : 'Item Barang';

    const dateStr = dateCol && selectedReceiptRow[dateCol.id] 
      ? String(selectedReceiptRow[dateCol.id]) 
      : (selectedReceiptRow.createdAt ? new Date(selectedReceiptRow.createdAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID'));

    const category = catCol && selectedReceiptRow[catCol.id] ? String(selectedReceiptRow[catCol.id]) : undefined;
    const customerName = custCol && selectedReceiptRow[custCol.id] ? String(selectedReceiptRow[custCol.id]) : undefined;

    const priceVal = priceCol ? Number(selectedReceiptRow[priceCol.id]) || 0 : 0;
    const qtyVal = (qtyCol && Number(selectedReceiptRow[qtyCol.id])) || soldInfo.soldQty || 1;
    const unitPrice = priceVal > 0 ? priceVal : (soldInfo.soldQty > 0 ? Math.round(soldInfo.totalRevenue / soldInfo.soldQty) : soldInfo.totalRevenue);
    const grandTotal = soldInfo.totalRevenue || (unitPrice * qtyVal);

    let rowBayar = 0;
    let rowKembali = 0;
    let rowDiskon = 0;

    Object.keys(selectedReceiptRow).forEach(k => {
      const colDef = sheet.columns.find(c => c.id === k);
      const labelLower = ((colDef?.label || '') + ' ' + (colDef?.name || '') + ' ' + k).toLowerCase();
      if (labelLower.includes('bayar') || labelLower.includes('cash') || labelLower.includes('tunai') || labelLower.includes('diterima')) {
        const val = Number(selectedReceiptRow[k]) || 0;
        if (val > 0) rowBayar = Math.max(rowBayar, val);
      } else if (labelLower.includes('kembali')) {
        const val = Number(selectedReceiptRow[k]) || 0;
        if (val > 0) rowKembali = Math.max(rowKembali, val);
      } else if (labelLower.includes('diskon') || labelLower.includes('potongan')) {
        const val = Number(selectedReceiptRow[k]) || 0;
        if (val > 0) rowDiskon = Math.max(rowDiskon, val);
      }
    });

    const computedSubtotal = qtyVal * unitPrice;
    const subtotal = computedSubtotal > 0 ? computedSubtotal : grandTotal;
    const discountAmount = rowDiskon;
    const finalGrandTotal = grandTotal > 0 ? grandTotal : Math.max(0, subtotal - discountAmount);
    const isPiutang = soldInfo.isPiutang;
    const receivableAmount = soldInfo.piutangAmount || 0;
    const cashGiven = rowBayar > 0 
      ? rowBayar 
      : (isPiutang ? Math.max(0, finalGrandTotal - receivableAmount) : finalGrandTotal);
    const changeAmount = rowKembali > 0 
      ? rowKembali 
      : (cashGiven >= finalGrandTotal ? cashGiven - finalGrandTotal : 0);

    return {
      sheetName: sheet.name,
      trxCode,
      date: dateStr,
      itemName,
      category,
      qty: qtyVal,
      unitPrice,
      subtotal,
      discountAmount,
      grandTotal: finalGrandTotal,
      paymentType: isPiutang ? 'Piutang' : 'Tunai',
      cashGiven,
      changeAmount,
      isPiutang,
      receivableAmount,
      customerName,
      notes: 'Arsip Transaksi POS'
    };
  }, [selectedReceiptRow, sheet, itemCol, priceCol, qtyCol]);

  // Reset filters when active sheet changes
  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    setSearchColumnId('all');
    setItemTypeFilter('all');
    setColumnFilters({});
    setNumericRanges({});
    setDateRanges({});
    setIsFilterPanelOpen(false);
    setIsMobileMenuOpen(false);
  }, [sheet.id]);

  // Compute active advanced filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (itemTypeFilter !== 'all') count++;
    Object.values(columnFilters).forEach(val => {
      if (val && val.trim() !== '') count++;
    });
    Object.values(numericRanges).forEach(range => {
      if (range.min !== '' || range.max !== '') count++;
    });
    Object.values(dateRanges).forEach(range => {
      if (range.start !== '' || range.end !== '') count++;
    });
    return count;
  }, [searchQuery, itemTypeFilter, columnFilters, numericRanges, dateRanges]);

  const isFiltered = activeFiltersCount > 0;

  // Filter and sort rows
  const filteredAndSortedRows = useMemo(() => {
    let result = [...sheet.rows];

    // 1. Item Type Filter: Stock vs Sold vs Piutang
    if (itemTypeFilter === 'stock') {
      result = result.filter(row => getItemType(row, sheet.columns) === 'stock');
    } else if (itemTypeFilter === 'sold') {
      result = result.filter(row => getItemType(row, sheet.columns) === 'sold');
    } else if (itemTypeFilter === 'piutang') {
      result = result.filter(row => getItemSoldInfo(row, sheet.columns).isPiutang);
    }

    // 2. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (searchColumnId === 'all') {
        result = result.filter(row => {
          return sheet.columns.some(col => {
            const val = row[col.id];
            return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
          });
        });
      } else {
        result = result.filter(row => {
          const val = row[searchColumnId];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      }
    }

    // 3. Category & Column Filters
    Object.entries(columnFilters).forEach(([colId, filterVal]) => {
      if (filterVal && filterVal.trim() !== '') {
        const targetCol = sheet.columns.find(c => c.id === colId);
        const lowerFilter = filterVal.toLowerCase().trim();

        result = result.filter(row => {
          const cellVal = row[colId];
          if (cellVal === undefined || cellVal === null) return false;
          if (targetCol?.type === 'category') {
            return String(cellVal).toLowerCase() === lowerFilter;
          }
          return String(cellVal).toLowerCase().includes(lowerFilter);
        });
      }
    });

    // 4. Numeric Ranges
    Object.entries(numericRanges).forEach(([colId, range]) => {
      if (range.min !== '' || range.max !== '') {
        const minNum = range.min !== '' ? parseFloat(range.min) : null;
        const maxNum = range.max !== '' ? parseFloat(range.max) : null;

        result = result.filter(row => {
          const cellVal = row[colId];
          if (cellVal === undefined || cellVal === null || cellVal === '') return false;
          const num = parseFloat(String(cellVal));
          if (isNaN(num)) return false;
          if (minNum !== null && num < minNum) return false;
          if (maxNum !== null && num > maxNum) return false;
          return true;
        });
      }
    });

    // 5. Date Ranges
    Object.entries(dateRanges).forEach(([colId, range]) => {
      if (range.start !== '' || range.end !== '') {
        result = result.filter(row => {
          const cellVal = row[colId];
          if (!cellVal) return false;
          const strDate = String(cellVal).substring(0, 10);
          if (range.start && strDate < range.start) return false;
          if (range.end && strDate > range.end) return false;
          return true;
        });
      }
    });

    // 6. Sorting
    if (sortColumnId) {
      const col = sheet.columns.find(c => c.id === sortColumnId);
      result.sort((a, b) => {
        const valA = a[sortColumnId];
        const valB = b[sortColumnId];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (col?.type === 'number' || col?.type === 'decimal') {
          const numA = Number(valA);
          const numB = Number(valB);
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [
    sheet.rows, 
    sheet.columns, 
    itemTypeFilter,
    searchQuery, 
    searchColumnId, 
    columnFilters, 
    numericRanges, 
    dateRanges, 
    sortColumnId, 
    sortDirection
  ]);

  // Pagination calculation
  const totalRecords = filteredAndSortedRows.length;
  const totalSheetRows = sheet.rows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, page, pageSize]);

  const handleHeaderSort = (colId: string) => {
    if (sortColumnId === colId) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumnId(colId);
      setSortDirection('asc');
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSearchColumnId('all');
    setItemTypeFilter('all');
    setColumnFilters({});
    setNumericRanges({});
    setDateRanges({});
    setPage(1);
  };

  const formatValue = (value: any, column: ColumnDefinition) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-slate-300 dark:text-slate-600">-</span>;
    }

    const colLower = column.label.toLowerCase();

    // Check if column is Piutang or Status
    if (colLower.includes('piutang') || colLower.includes('hutang')) {
      const num = Number(value);
      if (!isNaN(num) && num > 0) {
        return (
          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
            Rp {num.toLocaleString('id-ID')}
          </span>
        );
      }
      return <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Lunas (Rp 0)</span>;
    }

    if (colLower.includes('status')) {
      const strVal = String(value);
      const isDebt = strVal.toLowerCase().includes('piutang') || strVal.toLowerCase().includes('tempo');
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
          isDebt 
            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        }`}>
          {strVal}
        </span>
      );
    }

    if (column.type === 'number' || column.type === 'decimal') {
      const num = Number(value);
      if (!isNaN(num)) {
        return (
          <span className="font-mono text-slate-900 dark:text-slate-100 font-medium tabular-nums">
            {num.toLocaleString('id-ID')}
          </span>
        );
      }
    }

    if (column.type === 'category') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {String(value)}
        </span>
      );
    }

    if (column.type === 'date') {
      return (
        <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px] tabular-nums">
          {String(value)}
        </span>
      );
    }

    return <span className="text-slate-800 dark:text-slate-200">{String(value)}</span>;
  };

  const selectedColumnObj = sheet.columns.find(c => c.id === searchColumnId);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col space-y-0 transition-colors">
      
      {/* 1. STREAMLINED TOP CONTROL BAR (RESPONSIVE CROSS-DEVICE) */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Left: Search Bar with Column Scope Selector */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative shrink-0">
            <select
              value={searchColumnId}
              onChange={(e) => {
                setSearchColumnId(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold pl-2.5 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-blue-500 shadow-xs appearance-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate"
            >
              <option value="all">🔍 Semua Kolom</option>
              {sheet.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={
                searchColumnId === 'all'
                  ? `Cari data di ${sheet.name}...`
                  : `Cari di kolom "${selectedColumnObj?.label}"...`
              }
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-blue-500 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg absolute right-1.5 top-1.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Primary Fast-Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end shrink-0">
          {/* Kasir POS Button (Primary Action) */}
          <button
            onClick={onOpenCashierModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs shadow-emerald-500/20 transition cursor-pointer active:scale-95"
            title="Buka Kasir POS untuk transaksi cepat & deteksi piutang otomatis"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
            <span className="whitespace-nowrap">Kasir POS</span>
          </button>

          {/* Tambah Baris Button */}
          <button
            onClick={onAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition cursor-pointer active:scale-95"
            title="Tambah data baru ke sheet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline whitespace-nowrap">Tambah Baris</span>
            <span className="sm:hidden">Tambah</span>
          </button>

          {/* Desktop Secondary Action Bar */}
          <div className="hidden lg:flex items-center gap-1.5">
            {onOpenProductSettings && (
              <button
                onClick={onOpenProductSettings}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
                title="Kelola Data Produk & Stok Kasir"
              >
                <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Stok Produk</span>
              </button>
            )}

            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
              title="Impor data Excel/CSV"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Impor</span>
            </button>

            <button
              onClick={() => onOpenExportModal(filteredAndSortedRows)}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
              title="Ekspor CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Ekspor</span>
            </button>

            <button
              onClick={onManageColumns}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
              title="Atur Kolom Sheet"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Kolom</span>
            </button>
          </div>

          {/* Mobile / Compact More Actions Toggle */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
              title="Opsi & Fitur Tambahan"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in duration-100">
                {onOpenProductSettings && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenProductSettings();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Stok Produk</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenImportModal();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Impor CSV/Excel</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenExportModal(filteredAndSortedRows);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Ekspor Data</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onManageColumns();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kelola Kolom</span>
                </button>
              </div>
            )}
          </div>

          {/* Table / Card View Switcher */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300/40 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'cards' 
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tampilan Kartu (Optimal Touch/HP)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED SEGMENTED FILTER TABS: STOK TERSEDIA VS BARANG TERJUAL */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* Tab: Semua */}
          <button
            onClick={() => {
              setItemTypeFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              itemTypeFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Semua Data ({tabCounts.all})</span>
          </button>

          {/* Tab: Stok Tersedia */}
          <button
            onClick={() => {
              setItemTypeFilter('stock');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              itemTypeFilter === 'stock'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-500/20'
                : 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
            title="Tampilkan hanya data stok barang yang tersedia untuk dijual"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stok Tersedia ({tabCounts.stock})</span>
            {metrics.totalAvailableStockUnits > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                itemTypeFilter === 'stock' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200/80 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
              }`}>
                {metrics.totalAvailableStockUnits} unit
              </span>
            )}
          </button>

          {/* Tab: Barang Terjual */}
          <button
            onClick={() => {
              setItemTypeFilter('sold');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              itemTypeFilter === 'sold'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/20'
                : 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40'
            }`}
            title="Tampilkan riwayat transaksi barang yang telah terjual"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Barang Terjual ({tabCounts.sold})</span>
            {metrics.totalSoldUnits > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                itemTypeFilter === 'sold' ? 'bg-blue-800 text-blue-100' : 'bg-blue-200/80 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
              }`}>
                {metrics.totalSoldUnits} unit
              </span>
            )}
          </button>

          {/* Tab: Piutang */}
          {tabCounts.piutang > 0 && (
            <button
              onClick={() => {
                setItemTypeFilter('piutang');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                itemTypeFilter === 'piutang'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
              }`}
              title="Transaksi yang belum lunas (piutang pembeli)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Piutang ({tabCounts.piutang})</span>
            </button>
          )}
        </div>

        {/* Right: Advanced Column Filter Toggle & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterPanelOpen(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
              isFilterPanelOpen || activeFiltersCount > (itemTypeFilter !== 'all' ? 1 : 0)
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-3 h-3" />
            <span className="hidden sm:inline">Filter Kolom</span>
            {isFilterPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isFiltered && (
            <button
              onClick={handleResetAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              title="Reset seluruh filter pencarian dan jenis item"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. EXPANDABLE COLUMN-SPECIFIC FILTER PANEL */}
      {isFilterPanelOpen && (
        <div className="p-4 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Filter Spesifik Berdasarkan Nilai Kolom</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sheet.columns.map((col) => {
              if (col.type === 'category') {
                const currentVal = columnFilters[col.id] || '';
                return (
                  <div key={col.id} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-500" />
                      <span>{col.label}</span>
                    </label>
                    <select
                      value={currentVal}
                      onChange={(e) => {
                        setColumnFilters(prev => ({ ...prev, [col.id]: e.target.value }));
                        setPage(1);
                      }}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-blue-500 shadow-xs"
                    >
                      <option value="">-- Semua Kategori --</option>
                      {col.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (col.type === 'number' || col.type === 'decimal') {
                const currentMin = numericRanges[col.id]?.min ?? '';
                const currentMax = numericRanges[col.id]?.max ?? '';
                return (
                  <div key={col.id} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-emerald-500" />
                      <span>{col.label} (Rentang Nilai)</span>
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        placeholder="Min..."
                        value={currentMin}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNumericRanges(prev => ({
                            ...prev,
                            [col.id]: { min: val, max: prev[col.id]?.max ?? '' }
                          }));
                          setPage(1);
                        }}
                        className="w-1/2 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-mono shadow-xs tabular-nums"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="number"
                        placeholder="Max..."
                        value={currentMax}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNumericRanges(prev => ({
                            ...prev,
                            [col.id]: { min: prev[col.id]?.min ?? '', max: val }
                          }));
                          setPage(1);
                        }}
                        className="w-1/2 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-mono shadow-xs tabular-nums"
                      />
                    </div>
                  </div>
                );
              }

              if (col.type === 'date') {
                const currentStart = dateRanges[col.id]?.start ?? '';
                const currentEnd = dateRanges[col.id]?.end ?? '';
                return (
                  <div key={col.id} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span>{col.label} (Rentang Tanggal)</span>
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="date"
                        value={currentStart}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDateRanges(prev => ({
                            ...prev,
                            [col.id]: { start: val, end: prev[col.id]?.end ?? '' }
                          }));
                          setPage(1);
                        }}
                        className="w-1/2 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="date"
                        value={currentEnd}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDateRanges(prev => ({
                            ...prev,
                            [col.id]: { start: prev[col.id]?.start ?? '', end: val }
                          }));
                          setPage(1);
                        }}
                        className="w-1/2 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs"
                      />
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* 4. DATA PRESENTATION: CARDS VIEW (TOUCH / MOBILE) OR TABLE VIEW (DESKTOP) */}
      {viewMode === 'cards' ? (
        <div className="p-3.5 sm:p-5 bg-slate-50/60 dark:bg-slate-950 min-h-[300px]">
          {paginatedRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {isFiltered ? 'Tidak ada data yang cocok dengan kriteria filter.' : 'Belum ada data pada Sheet ini.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {paginatedRows.map((row, idx) => {
                const globalIndex = (page - 1) * pageSize + idx + 1;
                const type = getItemType(row, sheet.columns);
                const isStock = type === 'stock';
                const stockStatus = getItemStockStatus(row, sheet.columns);
                const soldInfo = getItemSoldInfo(row, sheet.columns);

                const primaryName = itemCol ? String(row[itemCol.id] || 'Item Tanpa Nama') : 'Baris Data';
                const otherCols = sheet.columns.filter(c => c.id !== itemCol?.id);
                const itemPrice = priceCol ? Number(row[priceCol.id]) || 0 : 0;
                const itemCategory = categoryCol ? String(row[categoryCol.id] || '') : '';

                return (
                  <div
                    key={row.id}
                    className={`rounded-2xl p-4 border shadow-xs transition flex flex-col justify-between space-y-3.5 ${
                      isStock
                        ? 'bg-white dark:bg-slate-900 border-emerald-200/90 dark:border-emerald-900/60 hover:border-emerald-400'
                        : soldInfo.isPiutang
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
                        : 'bg-white dark:bg-slate-900 border-blue-200/90 dark:border-blue-900/60 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      {/* Top Header Strip with Distinct Item Type Indicator */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-400 font-bold text-[11px]">
                            #{globalIndex}
                          </span>
                          {isStock ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${stockStatus.badgeClass}`}>
                              <Package className="w-3 h-3 shrink-0" />
                              <span>Stok: {stockStatus.statusLabel}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <ShoppingCart className="w-3 h-3 shrink-0" />
                              <span>Terjual ({soldInfo.soldQty} unit)</span>
                            </span>
                          )}
                        </div>

                        {soldInfo.isPiutang && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Piutang</span>
                          </span>
                        )}
                      </div>

                      {/* Primary Item Name & Quick Price Headline */}
                      <div className="mt-2.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {primaryName}
                        </h4>
                        <div className="flex items-center justify-between text-xs mt-1 text-slate-500 dark:text-slate-400">
                          {isStock ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {itemPrice > 0 ? `Rp ${itemPrice.toLocaleString('id-ID')} / unit` : 'Stok Toko'}
                            </span>
                          ) : (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              Omset: Rp {soldInfo.totalRevenue.toLocaleString('id-ID')}
                            </span>
                          )}
                          {itemCategory && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-medium">
                              {itemCategory}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Data Columns Detail List */}
                      <div className="mt-3 space-y-1 text-xs">
                        {otherCols.slice(0, 5).map(col => (
                          <div key={col.id} className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-50 dark:border-slate-800/40">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{col.label}:</span>
                            <div className="font-medium text-right shrink-0">
                              {formatValue(row[col.id], col)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons for Mobile/Card View */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* For Stock Items: Instant Sell at POS button */}
                      {isStock && stockStatus.qty > 0 && onOpenCashierWithItem && (
                        <button
                          onClick={() => onOpenCashierWithItem(primaryName, itemPrice, itemCategory)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition cursor-pointer active:scale-98"
                          title="Buka Kasir POS untuk menjual barang ini langsung"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Jual di Kasir POS</span>
                        </button>
                      )}

                      {/* For Sold Items: Settle Debt button */}
                      {soldInfo.isPiutang && onSettleDebt && (
                        <button
                          onClick={() => setDebtToSettleRowId(row.id)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer active:scale-98"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Lunasi Piutang (Rp {soldInfo.piutangAmount.toLocaleString('id-ID')})</span>
                        </button>
                      )}

                      {/* For Sold Items: Receipt Print & Local Storage Download */}
                      {!isStock && (
                        <button
                          onClick={() => setSelectedReceiptRow(row)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer active:scale-98"
                          title="Cetak struk ke printer atau simpan ke penyimpanan lokal perangkat"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Cetak &amp; Simpan Struk</span>
                        </button>
                      )}

                      {/* Standard Edit & Delete */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onEditRow(row)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setRowToDelete(row)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW FOR DESKTOP / WIDE SCREENS */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-12 text-center text-slate-400">#</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Tipe Item</th>
                {sheet.columns.map((col) => {
                  const isSorted = sortColumnId === col.id;
                  return (
                    <th
                      key={col.id}
                      onClick={() => handleHeaderSort(col.id)}
                      className="py-3 px-3.5 select-none cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1">
                        <span>{col.label}</span>
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-3.5 text-center w-36 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={sheet.columns.length + 3}
                    className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs"
                  >
                    {isFiltered ? 'Tidak ada data yang cocok dengan kriteria filter.' : 'Belum ada data pada Sheet ini.'}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const globalIndex = (page - 1) * pageSize + idx + 1;
                  const type = getItemType(row, sheet.columns);
                  const isStock = type === 'stock';
                  const stockStatus = getItemStockStatus(row, sheet.columns);
                  const soldInfo = getItemSoldInfo(row, sheet.columns);

                  const itemName = itemCol ? String(row[itemCol.id] || '') : '';
                  const itemPrice = priceCol ? Number(row[priceCol.id]) || 0 : 0;
                  const itemCategory = categoryCol ? String(row[categoryCol.id] || '') : '';

                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isStock 
                          ? 'bg-emerald-50/15 dark:bg-emerald-950/10' 
                          : soldInfo.isPiutang 
                          ? 'bg-amber-50/30 dark:bg-amber-950/20' 
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px] tabular-nums">
                        {globalIndex}
                      </td>

                      {/* Dedicated Item Type Badge Column */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {isStock ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${stockStatus.badgeClass}`}>
                            <Package className="w-3 h-3 shrink-0" />
                            <span>Stok: {stockStatus.statusLabel}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <ShoppingCart className="w-3 h-3 shrink-0" />
                            <span>Terjual ({soldInfo.soldQty})</span>
                          </span>
                        )}
                      </td>

                      {/* Sheet Columns */}
                      {sheet.columns.map((col) => (
                        <td key={col.id} className="py-3 px-3.5 whitespace-nowrap">
                          {formatValue(row[col.id], col)}
                        </td>
                      ))}

                      {/* Action Column */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Sell at POS Quick Action */}
                          {isStock && stockStatus.qty > 0 && onOpenCashierWithItem && (
                            <button
                              onClick={() => onOpenCashierWithItem(itemName, itemPrice, itemCategory)}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1"
                              title="Jual barang ini di Kasir POS"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Jual</span>
                            </button>
                          )}

                          {/* Settle Debt Quick Action */}
                          {soldInfo.isPiutang && onSettleDebt && (
                            <button
                              onClick={() => setDebtToSettleRowId(row.id)}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition cursor-pointer"
                              title="Tandai piutang lunas"
                            >
                              Lunasi
                            </button>
                          )}

                          {/* Print & Download Receipt for Sold Items */}
                          {!isStock && (
                            <button
                              onClick={() => setSelectedReceiptRow(row)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition cursor-pointer"
                              title="Cetak struk ke printer atau simpan ke penyimpanan lokal"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditRow(row)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition cursor-pointer"
                            title="Edit baris"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setRowToDelete(row)}
                            className="p-1.5 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 5. PAGINATION & STATS SUMMARY FOOTER */}
      <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2.5">
        <div className="flex items-center gap-3">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
              {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
              {Math.min(page * pageSize, totalRecords)}
            </strong>{' '}
            dari <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{totalRecords}</strong> baris
            {isFiltered && (
              <span className="text-blue-600 dark:text-blue-400 ml-1 font-semibold">
                (filter aktif)
              </span>
            )}
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value={10}>10 / hal</option>
            <option value={25}>25 / hal</option>
            <option value={50}>50 / hal</option>
          </select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Sebelumnya
          </button>
          
          <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Row Deletion */}
      <ConfirmModal
        isOpen={!!rowToDelete}
        title="Hapus Baris Data"
        message="Apakah Anda yakin ingin menghapus baris data ini secara permanen?"
        confirmLabel="Ya, Hapus"
        variant="danger"
        onConfirm={() => {
          if (rowToDelete) {
            onDeleteRow(rowToDelete.id);
            setRowToDelete(null);
          }
        }}
        onClose={() => setRowToDelete(null)}
      />

      {/* Confirmation Dialog for Debt Settlement */}
      <ConfirmModal
        isOpen={!!debtToSettleRowId}
        title="Lunasi Piutang"
        message="Konfirmasi pelunasan piutang? Sisa piutang akan diubah menjadi Rp 0 dan status transaksi ditandai Lunas."
        confirmLabel="Ya, Lunasi"
        variant="success"
        onConfirm={() => {
          if (debtToSettleRowId && onSettleDebt) {
            onSettleDebt(debtToSettleRowId);
            setDebtToSettleRowId(null);
          }
        }}
        onClose={() => setDebtToSettleRowId(null)}
      />

      {/* Transaction Receipt Modal with Native Printing & Storage Download */}
      {selectedReceiptRow && activeReceiptData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Struk Transaksi Penjualan
                </h4>
              </div>
              <button 
                onClick={() => setSelectedReceiptRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Preview Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl font-mono text-xs space-y-2 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              <div className="text-center font-bold text-sm">DATA STATISTIK KASIR POS</div>
              <div className="text-center text-[10px] text-slate-500 dark:text-slate-400">
                Sheet: {activeReceiptData.sheetName} &bull; {activeReceiptData.date}
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-1"></div>
              <div className="flex justify-between"><span>No:</span><span className="font-bold">{activeReceiptData.trxCode}</span></div>
              <div className="flex justify-between"><span>Item:</span><span className="font-bold truncate max-w-[170px]">{activeReceiptData.itemName}</span></div>
              
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                Operasi Hitung Total Harga:
              </div>
              <div className="flex justify-between">
                <span>{activeReceiptData.qty} unit x Rp {activeReceiptData.unitPrice.toLocaleString('id-ID')}</span>
                <span className="font-bold font-mono">Rp {activeReceiptData.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {activeReceiptData.discountAmount && activeReceiptData.discountAmount > 0 ? (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Diskon:</span>
                  <span className="font-mono">- Rp {activeReceiptData.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              ) : null}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>TOTAL TAGIHAN:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Rp {activeReceiptData.grandTotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                Operasi Pembayaran Kasir:
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Uang Diterima ({activeReceiptData.paymentType}):</span>
                <span className="font-mono font-bold">Rp {activeReceiptData.cashGiven.toLocaleString('id-ID')}</span>
              </div>
              
              {activeReceiptData.isPiutang ? (
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-bold space-y-0.5 mt-1">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                    Operasi: Total Tagihan - Uang Diterima
                  </div>
                  <div className="flex justify-between">
                    <span>SISA PIUTANG:</span>
                    <span className="font-mono">Rp {activeReceiptData.receivableAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[10px] text-center pt-0.5">STATUS: BELUM LUNAS</div>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold space-y-0.5 mt-1">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">
                    Operasi: Uang Diterima - Total Tagihan
                  </div>
                  <div className="flex justify-between">
                    <span>KEMBALIAN:</span>
                    <span className="font-mono">
                      {activeReceiptData.changeAmount === 0 ? 'Rp 0 (Uang Pas)' : `Rp ${activeReceiptData.changeAmount.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-center pt-0.5">STATUS: LUNAS TERBAYAR</div>
                </div>
              )}
            </div>

            {/* Native Device Printing & Local Storage Download Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => printReceiptTicket(activeReceiptData)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk (Printer Fisik / Simpan PDF)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => downloadReceiptToStorage(activeReceiptData, 'txt')}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  title="Unduh struk ke penyimpanan lokal sebagai file teks (.txt)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh .TXT</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadReceiptToStorage(activeReceiptData, 'html')}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  title="Unduh struk ke penyimpanan lokal sebagai file HTML (.html)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh .HTML</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyReceiptToClipboard(activeReceiptData);
                    if (ok) {
                      setCopiedReceipt(true);
                      setTimeout(() => setCopiedReceipt(false), 2000);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copiedReceipt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Teks</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReceiptRow(null)}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
