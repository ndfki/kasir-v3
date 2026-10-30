import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ShoppingCart, 
  Printer, 
  Check, 
  RotateCcw, 
  Receipt, 
  Plus, 
  Minus, 
  Banknote, 
  ArrowRight,
  Sparkles,
  Zap,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  User,
  Calendar,
  CreditCard,
  ShieldAlert,
  Clock,
  Phone,
  Package,
  Download,
  Copy,
  FileText,
  Search,
  Coins,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { Sheet, SheetRow, ColumnDefinition } from '../types';
import { getItemType } from '../utils/itemClassification';
import {
  ReceiptData,
  printReceiptTicket,
  downloadReceiptToStorage,
  copyReceiptToClipboard
} from '../utils/receiptGenerator';

interface CashierModalProps {
  isOpen: boolean;
  sheet: Sheet;
  onClose: () => void;
  onSaveRow: (rowData: Record<string, any>) => void;
  onSaveTransaction?: (rowData: Record<string, any>, newColumns?: ColumnDefinition[]) => void;
  preselectedItem?: { name: string; price?: number; category?: string } | null;
}

export const CashierModal: React.FC<CashierModalProps> = ({
  isOpen,
  sheet,
  onClose,
  onSaveRow,
  onSaveTransaction,
  preselectedItem,
}) => {
  // Identify key columns in active sheet (code, item/product, qty, price, total, category, date)
  const itemCol = sheet.columns.find(c => 
    c.name.includes('produk') || c.name.includes('item') || c.name.includes('nama') || c.label.toLowerCase().includes('produk') || c.label.toLowerCase().includes('item')
  ) || sheet.columns[0];

  const codeCol = sheet.columns.find(c => 
    c.name.includes('kode') || c.name.includes('trx') || c.name.includes('nip') || c.label.toLowerCase().includes('kode')
  );

  const categoryCol = sheet.columns.find(c => c.type === 'category');

  const qtyCol = sheet.columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') || c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || sheet.columns.find(c => c.type === 'number');

  const priceCol = sheet.columns.find(c => 
    c.name.includes('harga') || c.name.includes('satuan') || c.name.includes('gaji') || c.name.includes('price') || c.label.toLowerCase().includes('harga')
  ) || sheet.columns.find(c => c.type === 'decimal');

  const totalCol = sheet.columns.find(c => 
    c.name.includes('total') || c.name.includes('omset') || c.label.toLowerCase().includes('total') || c.label.toLowerCase().includes('omset')
  );

  const dateCol = sheet.columns.find(c => c.type === 'date');

  // Form states
  const [itemName, setItemName] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [trxCode, setTrxCode] = useState('');
  const [category, setCategory] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0); // Harga Modal Pokok (HPP)
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [customerName, setCustomerName] = useState(''); // Nama pelanggan / debitur
  const [customerPhone, setCustomerPhone] = useState(''); // No WhatsApp / Telp debitur
  const [dueDate, setDueDate] = useState(''); // Tanggal jatuh tempo piutang
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'tunai' | 'piutang' | 'qris' | 'transfer'>('tunai');
  const [successMsg, setSuccessMsg] = useState(false);
  const [formError, setFormError] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  // Auto-generate transaction code on open or reset
  const generateNewTrxCode = () => {
    const today = new Date();
    const dateStr = today.getFullYear().toString().slice(-2) + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TRX-${dateStr}-${random}`;
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (preselectedItem) {
        setItemName(preselectedItem.name);
        if (preselectedItem.price !== undefined) setUnitPrice(preselectedItem.price);
        if (preselectedItem.category) setCategory(preselectedItem.category);
      }
    }
  }, [isOpen, sheet.id, preselectedItem]);

  const resetForm = () => {
    setTrxCode(generateNewTrxCode());
    setItemName('');
    setStockSearchTerm('');
    setCategory(categoryCol?.options ? categoryCol.options[0] : '');
    setQty(1);
    setUnitPrice(0);
    setCostPrice(0);
    setDiscountPercent(0);
    setCashGiven(0);
    setCustomerName('');
    setCustomerPhone('');
    setDueDate('');
    setNotes('');
    setPaymentType('tunai');
    setFormError('');
    setShowReceiptPreview(false);
  };

  // 1. Tagihan / Harga Jual Total (Harga Barang Total)
  const subtotal = Math.max(0, qty * unitPrice);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // 2. DETEKSI OTOMATIS PIUTANG:
  // Terdeteksi otomatis ketika pembeli membayar kurang dari harga jual total (grandTotal)
  const effectiveCash = paymentType === 'piutang' ? 0 : cashGiven;
  const isPaidLess = grandTotal > 0 && effectiveCash < grandTotal;
  const receivableAmount = isPaidLess ? grandTotal - effectiveCash : 0;
  const isPiutang = receivableAmount > 0;
  const changeAmount = effectiveCash >= grandTotal ? effectiveCash - grandTotal : 0;

  // 3. Total Modal Pokok & Potensi Rugi HPP
  const totalCost = qty * costPrice;
  const grossProfitOrLoss = costPrice > 0 ? grandTotal - totalCost : 0;
  const isDirectLoss = costPrice > 0 && grossProfitOrLoss < 0;
  const directLossAmount = isDirectLoss ? Math.abs(grossProfitOrLoss) : 0;

  // 4. DAFTAR STOK BARANG TERSEDIA (INVENTORI SIAP JUAL)
  const availableStockList = useMemo(() => {
    return sheet.rows
      .filter(r => getItemType(r, sheet.columns) === 'stock')
      .map(r => {
        const name = itemCol ? String(r[itemCol.id] || '') : '';
        const price = priceCol ? Number(r[priceCol.id]) || 0 : 0;
        const stockQty = qtyCol ? Number(r[qtyCol.id]) || 0 : 0;
        const cat = categoryCol ? String(r[categoryCol.id] || '') : '';
        return { id: r.id, name, price, stockQty, category: cat };
      })
      .filter(i => i.name.trim() !== '');
  }, [sheet.rows, sheet.columns, itemCol, priceCol, qtyCol, categoryCol]);

  const filteredStockList = useMemo(() => {
    if (!stockSearchTerm.trim()) return availableStockList;
    const term = stockSearchTerm.toLowerCase();
    return availableStockList.filter(i => 
      i.name.toLowerCase().includes(term) || (i.category && i.category.toLowerCase().includes(term))
    );
  }, [availableStockList, stockSearchTerm]);

  // Current selected stock item matching itemName
  const matchedStockItem = useMemo(() => {
    if (!itemName.trim()) return null;
    return availableStockList.find(s => s.name.trim().toLowerCase() === itemName.trim().toLowerCase());
  }, [availableStockList, itemName]);

  const handleSelectStockItem = (item: { name: string; price: number; stockQty: number; category: string }) => {
    setItemName(item.name);
    setUnitPrice(item.price);
    if (costPrice === 0 && item.price > 0) {
      setCostPrice(Math.round(item.price * 0.75));
    }
    if (item.category) {
      setCategory(item.category);
    }
    setFormError('');
  };

  // Build row data with automatic piutang columns support
  const prepareSavePayload = () => {
    const rowData: Record<string, any> = {};
    const newColumnsNeeded: ColumnDefinition[] = [];

    // Check existing columns for status, piutang, customer, payment amount
    const existingStatusCol = sheet.columns.find(c => 
      c.label.toLowerCase().includes('status') || c.name.toLowerCase().includes('status')
    );
    const existingPiutangCol = sheet.columns.find(c => 
      c.label.toLowerCase().includes('piutang') || c.name.toLowerCase().includes('piutang') || c.label.toLowerCase().includes('hutang')
    );
    const existingCustomerCol = sheet.columns.find(c => 
      c.label.toLowerCase().includes('pelanggan') || c.name.toLowerCase().includes('pelanggan') || c.label.toLowerCase().includes('customer') || c.label.toLowerCase().includes('debitur')
    );

    // Map base columns
    sheet.columns.forEach(col => {
      if (itemCol && col.id === itemCol.id) {
        rowData[col.id] = itemName || 'Item Transaksi';
      } else if (codeCol && col.id === codeCol.id) {
        rowData[col.id] = trxCode;
      } else if (categoryCol && col.id === categoryCol.id) {
        rowData[col.id] = category;
      } else if (qtyCol && col.id === qtyCol.id) {
        rowData[col.id] = qty;
      } else if (priceCol && col.id === priceCol.id) {
        rowData[col.id] = unitPrice;
      } else if (totalCol && col.id === totalCol.id) {
        rowData[col.id] = grandTotal;
      } else if (dateCol && col.id === dateCol.id) {
        rowData[col.id] = new Date().toISOString().split('T')[0];
      } else {
        const colLower = (col.label + ' ' + col.name).toLowerCase();
        if (colLower.includes('bayar') || colLower.includes('diterima') || colLower.includes('cash') || colLower.includes('tunai')) {
          rowData[col.id] = effectiveCash;
        } else if (colLower.includes('kembali')) {
          rowData[col.id] = changeAmount;
        } else if (colLower.includes('diskon') || colLower.includes('potongan')) {
          rowData[col.id] = discountAmount;
        } else if (colLower.includes('piutang') || colLower.includes('hutang')) {
          rowData[col.id] = receivableAmount;
        } else if (colLower.includes('status')) {
          rowData[col.id] = isPiutang ? 'Piutang' : 'Lunas';
        } else if (colLower.includes('rugi') || colLower.includes('loss')) {
          rowData[col.id] = directLossAmount;
        } else if (colLower.includes('modal') || colLower.includes('hpp') || colLower.includes('pokok')) {
          rowData[col.id] = costPrice > 0 ? totalCost : 0;
        } else if (colLower.includes('laba') || colLower.includes('profit') || colLower.includes('untung')) {
          rowData[col.id] = grossProfitOrLoss;
        } else if (colLower.includes('pelanggan') || colLower.includes('customer') || colLower.includes('debitur')) {
          rowData[col.id] = customerName || (isPiutang ? 'Pelanggan Piutang' : 'Umum');
        } else {
          rowData[col.id] = col.type === 'number' || col.type === 'decimal' ? 0 : '';
        }
      }
    });

    // Auto-create Status Bayar column if not yet in sheet
    let statusColId = existingStatusCol?.id;
    if (!existingStatusCol) {
      statusColId = 'col_status_bayar';
      newColumnsNeeded.push({
        id: 'col_status_bayar',
        name: 'status_bayar',
        label: 'Status Bayar',
        type: 'category',
        options: ['Lunas', 'Piutang', 'Sebagian'],
        isRequired: false
      });
    }
    rowData[statusColId!] = isPiutang ? 'Piutang' : 'Lunas';

    // Auto-create Sisa Piutang column if not yet in sheet
    let piutangColId = existingPiutangCol?.id;
    if (!existingPiutangCol) {
      piutangColId = 'col_sisa_piutang';
      newColumnsNeeded.push({
        id: 'col_sisa_piutang',
        name: 'sisa_piutang',
        label: 'Sisa Piutang (Rp)',
        type: 'decimal',
        isRequired: false
      });
    }
    rowData[piutangColId!] = receivableAmount;

    // Auto-create Pelanggan column if not yet in sheet
    let customerColId = existingCustomerCol?.id;
    if (!existingCustomerCol) {
      customerColId = 'col_pelanggan';
      newColumnsNeeded.push({
        id: 'col_pelanggan',
        name: 'pelanggan',
        label: 'Pelanggan / Debitur',
        type: 'text',
        isRequired: false
      });
    }
    rowData[customerColId!] = customerName || (isPiutang ? 'Pelanggan Piutang' : 'Umum');

    // Explicit item differentiation flag
    rowData.itemType = 'sold';

    return { rowData, newColumnsNeeded };
  };

  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Formatted Receipt payload ready for print, download to storage, or clipboard
  const currentReceiptData = useMemo<ReceiptData>(() => ({
    sheetName: sheet.name,
    trxCode: trxCode || 'TRX-SAMPLE',
    date: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' }),
    itemName: itemName || 'Item Barang',
    category: category || undefined,
    qty,
    unitPrice,
    subtotal,
    discountPercent,
    discountAmount,
    grandTotal,
    paymentType,
    cashGiven: effectiveCash,
    changeAmount,
    isPiutang,
    receivableAmount,
    customerName: customerName || undefined,
    customerPhone: customerPhone || undefined,
    dueDate: dueDate || undefined,
    notes: notes || undefined,
  }), [sheet.name, trxCode, itemName, category, qty, unitPrice, subtotal, discountPercent, discountAmount, grandTotal, paymentType, effectiveCash, changeAmount, isPiutang, receivableAmount, customerName, customerPhone, dueDate, notes]);

  const handleSaveAndNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!itemName.trim() && itemCol) {
      setFormError('Harap masukkan atau pilih nama item/produk transaksi.');
      return;
    }
    setFormError('');

    const { rowData, newColumnsNeeded } = prepareSavePayload();
    if (onSaveTransaction) {
      onSaveTransaction(rowData, newColumnsNeeded);
    } else {
      onSaveRow(rowData);
    }

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2500);
    resetForm();
  };

  const handleSaveAndClose = () => {
    if (!itemName.trim() && itemCol) {
      setFormError('Harap masukkan atau pilih nama item/produk transaksi.');
      return;
    }
    setFormError('');
    const { rowData, newColumnsNeeded } = prepareSavePayload();
    if (onSaveTransaction) {
      onSaveTransaction(rowData, newColumnsNeeded);
    } else {
      onSaveRow(rowData);
    }
    onClose();
  };

  const handlePrintReceipt = () => {
    setShowReceiptPreview(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[96vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Header Mode Kasir */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight leading-none">
                  Mode Kasir POS &bull; Deteksi Piutang Otomatis
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  Rupiah (Rp)
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1">
                Entri cepat kasir &bull; Sheet: <strong>{sheet.name}</strong>
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast alert */}
        {successMsg && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span>Transaksi tersimpan ke Sheet &amp; Database! Siap untuk input transaksi berikutnya.</span>
          </div>
        )}

        {/* Content Body: Split View between Kasir Form & Real-time Auto-Detection */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-50 dark:bg-slate-950">
          {/* SISI KIRI: Form Entri Kasir Cepat */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              {/* No Transaksi & Metode Bayar */}
              <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  No: <strong className="text-slate-800 dark:text-slate-200">{trxCode}</strong>
                </span>
                
                {/* Metode Pembayaran */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Metode:</span>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-blue-500"
                  >
                    <option value="tunai">💵 Tunai / Cash</option>
                    <option value="piutang">📝 Piutang / Kasbon</option>
                    <option value="qris">📱 QRIS / E-Wallet</option>
                    <option value="transfer">🏦 Transfer Bank</option>
                  </select>
                </div>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                  <button type="button" onClick={() => setFormError('')} className="p-0.5 text-rose-500 hover:text-rose-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Nama Item / Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nama Item / Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setFormError('');
                  }}
                  placeholder="Ketik nama barang / scan barcode / layanan..."
                  className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-blue-600 shadow-xs"
                  autoFocus
                />

                {/* Available Stock Quick-Select Chips with Search Filter */}
                {availableStockList.length > 0 && (
                  <div className="space-y-1.5 mt-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <Package className="w-3.5 h-3.5" />
                        <span>Pilih dari Stok Tersedia ({availableStockList.length} jenis):</span>
                      </span>
                      {availableStockList.length > 3 && (
                        <div className="relative">
                          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={stockSearchTerm}
                            onChange={(e) => setStockSearchTerm(e.target.value)}
                            placeholder="Cari stok..."
                            className="text-[11px] pl-6 pr-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-blue-500 w-28"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      {filteredStockList.length > 0 ? (
                        filteredStockList.map((item) => {
                          const isSelected = itemName.trim().toLowerCase() === item.name.trim().toLowerCase();
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectStockItem(item)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                              }`}
                            >
                              <span className="truncate max-w-[140px]">{item.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                item.stockQty <= 2 
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' 
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              }`}>
                                Stok: {item.stockQty}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-[11px] text-slate-400 p-2 italic w-full text-center">
                          Tidak ada stok cocok dengan "{stockSearchTerm}".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Stock Availability & Over-limit Warning */}
                {matchedStockItem && (
                  <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    qty > matchedStockItem.stockQty
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 font-semibold'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sisa Stok Tersedia: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{matchedStockItem.stockQty} unit</strong></span>
                    </span>
                    {qty > matchedStockItem.stockQty && (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        ⚠️ Qty beli melebihi stok!
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Kategori (jika ada pada sheet) */}
              {categoryCol && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {categoryCol.label}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-blue-500"
                  >
                    {categoryCol.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Qty & Harga Jual Satuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Qty */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Jumlah (Qty)
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center text-sm font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(q => q + 1)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Quick Qty Badges */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {[1, 2, 5, 10].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQty(n)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          qty === n 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Harga Jual Satuan */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Harga Jual Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={unitPrice || ''}
                    onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Contoh: 25000"
                    className="w-full text-sm font-mono font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
                  />
                  {/* Preset quick price buttons */}
                  <div className="flex items-center gap-1 mt-1.5 overflow-x-auto">
                    {[10000, 25000, 50000, 100000].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setUnitPrice(p)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0"
                      >
                        {p / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Harga Pokok / Modal (HPP) untuk Deteksi Potensi Rugi */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Harga Modal Pokok / HPP per Item (Rp)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Deteksi Margin &amp; Rugi</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Contoh: 18000"
                    className="w-full text-xs font-mono font-bold p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-amber-600"
                  />
                  {costPrice > 0 && unitPrice > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                      unitPrice < costPrice 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    }`}>
                      {unitPrice < costPrice ? 'Jual di bawah modal!' : `Margin: Rp ${(unitPrice - costPrice).toLocaleString('id-ID')}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Diskon Penjualan */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Diskon Penjualan (%)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Potongan harga khusus untuk transaksi ini
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent || ''}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      placeholder="0"
                      className="w-full text-right text-sm font-bold pr-7 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-blue-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                      -Rp {discountAmount.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              {/* SECTION: INPUT HARGA YANG PEMBELI BAYAR (SUPER PROMINENT) */}
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-400/80 dark:border-indigo-500/70 bg-gradient-to-b from-indigo-50/90 via-blue-50/40 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/90 shadow-sm space-y-3.5">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-700/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200 tracking-wide uppercase">
                        Uang Yang Pembeli Bayar (Cash Diterima) <span className="text-rose-600">*</span>
                      </h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                        Ketik nominal uang tunai yang diserahkan pembeli ke kasir
                      </p>
                    </div>
                  </div>

                  {/* Payment Status Pill */}
                  <div>
                    {grandTotal > 0 && effectiveCash >= grandTotal ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        LUNAS
                      </span>
                    ) : grandTotal > 0 && isPiutang ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        PIUTANG / KURANG
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Total: Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Big Prominent Input Box */}
                <div className="relative">
                  <div className="flex items-stretch rounded-2xl border-2 border-indigo-500/80 dark:border-indigo-500 bg-white dark:bg-slate-900 shadow-inner focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition overflow-hidden">
                    <span className="flex items-center justify-center px-4 bg-indigo-600 text-white font-mono font-black text-base sm:text-lg select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      disabled={paymentType === 'piutang'}
                      value={paymentType === 'piutang' ? 0 : (cashGiven || '')}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setCashGiven(val);
                        if (paymentType === 'piutang') setPaymentType('tunai');
                      }}
                      placeholder={paymentType === 'piutang' ? '0 (Piutang Penuh)' : 'Ketik nominal uang dibayar...'}
                      className="w-full text-2xl sm:text-3xl font-black font-mono tracking-tight px-3.5 py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
                    />
                    {cashGiven > 0 && paymentType !== 'piutang' && (
                      <button
                        type="button"
                        onClick={() => setCashGiven(0)}
                        className="px-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title="Kosongkan nominal"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Instant Dynamic Feedback Banners (Kembalian / Lunas / Kurang) */}
                {grandTotal > 0 && (
                  <div className="space-y-1.5">
                    {effectiveCash > grandTotal && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Kembalian untuk Pembeli:</span>
                        </span>
                        <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                          Rp {changeAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    {effectiveCash === grandTotal && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Uang Pas! Transaksi lunas tepat tanpa kembalian.</span>
                      </div>
                    )}

                    {isPaidLess && (
                      <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Kurang Bayar (Dicatat Piutang):</span>
                          </div>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">
                            Wajib lengkapi identitas pelanggan di bawah
                          </span>
                        </div>
                        <span className="text-base sm:text-lg font-black font-mono text-amber-700 dark:text-amber-300">
                          Rp {receivableAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Nominal Buttons (Kasir Shortcuts) */}
                <div className="pt-1 border-t border-indigo-100/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tombol Cepat Pecahan Rupiah:</span>
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">Klik untuk isi otomatis</span>
                  </div>

                  {/* Primary shortcuts: Uang Pas, DP 50%, Piutang Rp 0 */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {grandTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentType('tunai');
                          setCashGiven(grandTotal);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer ${
                          effectiveCash === grandTotal && paymentType === 'tunai'
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Uang Pas (Rp {grandTotal.toLocaleString('id-ID')})</span>
                      </button>
                    )}

                    {grandTotal > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentType('tunai');
                          setCashGiven(Math.round(grandTotal * 0.5));
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer"
                        title="Bayar DP 50% sisanya piutang"
                      >
                        DP 50% (Rp {Math.round(grandTotal * 0.5).toLocaleString('id-ID')})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('piutang');
                        setCashGiven(0);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        paymentType === 'piutang'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                      }`}
                      title="Piutang Penuh / Belum Bayar"
                    >
                      📝 Piutang Penuh (Rp 0)
                    </button>
                  </div>

                  {/* Indonesian Denomination chips */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Nominal:</span>
                    {[10000, 20000, 50000, 100000, 200000, 500000].map(nominal => (
                      <button
                        key={nominal}
                        type="button"
                        onClick={() => {
                          setPaymentType('tunai');
                          setCashGiven(nominal);
                        }}
                        className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg border transition ${
                          cashGiven === nominal && paymentType === 'tunai'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50'
                        }`}
                      >
                        Rp {nominal >= 1000 ? `${nominal / 1000}k` : nominal}
                      </button>
                    ))}
                  </div>

                  {/* Quick Addition (+Rp 5k, +10k, +20k, +50k) */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Tambah:</span>
                    {[5000, 10000, 20000, 50000].map(addVal => (
                      <button
                        key={addVal}
                        type="button"
                        onClick={() => {
                          setPaymentType('tunai');
                          setCashGiven(prev => prev + addVal);
                        }}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title={`Tambahkan Rp ${addVal.toLocaleString('id-ID')} ke nominal saat ini`}
                      >
                        +{addVal / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Pelanggan / Debitur Piutang jika pembeli membayar kurang */}
              {(isPiutang || paymentType === 'piutang') && (
                <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/40 rounded-2xl border-2 border-rose-300 dark:border-rose-800 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Data Debitur / Pelanggan Piutang (Wajib Dicatat)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                      Penagihan Piutang
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                        Nama Lengkap Pelanggan <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Contoh: Bpk. Ahmad Santoso"
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                        No. Telepon / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full text-xs font-mono p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 block mb-0.5">
                        Tanggal Jatuh Tempo (Opsional)
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 block mb-0.5">
                        Catatan Bon / Keterangan
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Janji bayar minggu depan"
                        className="w-full text-xs p-2 rounded-xl border border-rose-200 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SISI KANAN: Real-time Auto-Detection Banner, Financial Breakdown & Actions */}
          <div className="lg:col-span-5 space-y-4">
            {/* Big Total Display Card */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Tagihan Kasir:
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  isPiutang ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-emerald-500 text-slate-950'
                }`}>
                  {isPiutang ? 'Kurang Bayar / Piutang' : 'Lunas'}
                </span>
              </div>

              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>

              {/* Rincian Subtotal & Pembayaran */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal ({qty} item):</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Diskon ({discountPercent}%):</span>
                    <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Uang Diterima:</span>
                  <span className="font-mono">Rp {effectiveCash.toLocaleString('id-ID')}</span>
                </div>

                {changeAmount > 0 && (
                  <div className="flex justify-between font-bold text-sm text-yellow-300 pt-1 border-t border-slate-800">
                    <span>Kembalian:</span>
                    <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KOTAK DETEKSI OTOMATIS PIUTANG (RUPIAH) */}
            {isPiutang ? (
              <div className="bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/60 dark:border-amber-600 rounded-2xl p-4 text-amber-900 dark:text-amber-200 space-y-2 shadow-xs animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    TERDETEKSI OTOMATIS: PIUTANG PEMBELI
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white animate-pulse">
                    Kurang Bayar
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-800 dark:text-amber-300 font-mono">
                    Rp {receivableAmount.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    (Sisa Piutang)
                  </span>
                </div>

                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-snug">
                  Pembeli membayar <strong>Rp {effectiveCash.toLocaleString('id-ID')}</strong> dari total harga <strong>Rp {grandTotal.toLocaleString('id-ID')}</strong>. Sisa <strong>Rp {receivableAmount.toLocaleString('id-ID')}</strong> otomatis terdeteksi &amp; tersimpan sebagai piutang pelanggan <strong>{customerName || '(Belum dinamai)'}</strong>.
                </p>
              </div>
            ) : grandTotal > 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>PEMBAYARAN LUNAS (Tidak Ada Piutang)</span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Pembayaran diterima penuh sebesar Rp {effectiveCash.toLocaleString('id-ID')}. Transaksi bersih tanpa beban piutang.
                </p>
              </div>
            ) : null}

            {/* KOTAK ANALISIS POTENSI RUGI HPP (RUPIAH) */}
            {costPrice > 0 && (
              <div className={`p-4 rounded-2xl border space-y-1.5 shadow-xs ${
                isDirectLoss 
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    {isDirectLoss ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-rose-700 dark:text-rose-300">POTENSI RUGI TRANSAKSI:</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300">Estimasi Keuntungan Bersih:</span>
                      </>
                    )}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isDirectLoss 
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200' 
                      : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    {isDirectLoss ? 'DEFISIT HPP' : 'PROFIT POSITIF'}
                  </span>
                </div>

                <div className={`text-xl font-black font-mono ${
                  isDirectLoss ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                }`}>
                  {isDirectLoss ? `- Rp ${directLossAmount.toLocaleString('id-ID')}` : `+ Rp ${grossProfitOrLoss.toLocaleString('id-ID')}`}
                </div>

                <p className="text-[11px] leading-tight opacity-80">
                  {isDirectLoss 
                    ? `Perhatian: Harga jual (Rp ${grandTotal.toLocaleString('id-ID')}) berada di bawah modal pokok total (Rp ${totalCost.toLocaleString('id-ID')}).`
                    : `Total modal pokok: Rp ${totalCost.toLocaleString('id-ID')}. Margin profit sehat.`
                  }
                </p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleSaveAndNew()}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Simpan Transaksi Kasir</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Cetak Struk POS</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Simpan &amp; Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Piutang: <strong className={isPiutang ? 'text-amber-600 dark:text-amber-400 font-mono font-bold' : 'text-slate-700 dark:text-slate-300 font-mono'}>Rp {receivableAmount.toLocaleString('id-ID')}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Potensi Rugi HPP: <strong className={isDirectLoss ? 'text-rose-600 dark:text-rose-400 font-mono font-bold' : 'text-slate-700 dark:text-slate-300 font-mono'}>Rp {directLossAmount.toLocaleString('id-ID')}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Form Kasir</span>
          </button>
        </div>
      </div>

      {/* In-Modal Receipt Preview & Print Modal */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Struk Transaksi POS
                </h4>
              </div>
              <button 
                onClick={() => setShowReceiptPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl font-mono text-xs space-y-2 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
              <div className="text-center font-bold text-sm">DATA STATISTIK KASIR POS</div>
              <div className="text-center text-[10px] text-slate-500 dark:text-slate-400">
                Sheet: {sheet.name} &bull; {new Date().toLocaleDateString('id-ID')}
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-slate-600 my-1"></div>
              <div className="flex justify-between"><span>No:</span><span className="font-bold">{trxCode}</span></div>
              <div className="flex justify-between"><span>Item:</span><span className="font-bold truncate max-w-[170px]">{itemName || 'Item Barang'}</span></div>
              
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                Operasi Hitung Total Harga:
              </div>
              <div className="flex justify-between">
                <span>{qty} unit x Rp {unitPrice.toLocaleString('id-ID')}</span>
                <span className="font-bold font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Diskon ({discountPercent}%):</span>
                  <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>TOTAL TAGIHAN:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                Operasi Pembayaran Kasir:
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Uang Diterima ({paymentType}):</span>
                <span className="font-mono font-bold">Rp {effectiveCash.toLocaleString('id-ID')}</span>
              </div>
              
              {isPiutang ? (
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-bold space-y-0.5 mt-1">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                    Operasi: Total Tagihan - Uang Diterima
                  </div>
                  <div className="flex justify-between">
                    <span>SISA PIUTANG:</span>
                    <span className="font-mono">Rp {receivableAmount.toLocaleString('id-ID')}</span>
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
                      {changeAmount === 0 ? 'Rp 0 (Uang Pas)' : `Rp ${changeAmount.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-center pt-0.5">STATUS: LUNAS TERBAYAR</div>
                </div>
              )}
            </div>

            {/* Device-Native Print & Local Storage Download Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Primary Print with Device Native Printer Dialog (Thermal / PDF) */}
              <button
                type="button"
                onClick={() => printReceiptTicket(currentReceiptData)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk (Printer Fisik / Simpan PDF)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Download TXT to Local Storage */}
                <button
                  type="button"
                  onClick={() => downloadReceiptToStorage(currentReceiptData, 'txt')}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  title="Unduh struk ke penyimpanan lokal perangkat sebagai file teks (.txt)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh .TXT</span>
                </button>

                {/* Download HTML to Local Storage */}
                <button
                  type="button"
                  onClick={() => downloadReceiptToStorage(currentReceiptData, 'html')}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  title="Unduh struk ke penyimpanan lokal perangkat sebagai file HTML (.html)"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh .HTML</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Copy Text to Clipboard */}
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyReceiptToClipboard(currentReceiptData);
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
                  onClick={() => setShowReceiptPreview(false)}
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
