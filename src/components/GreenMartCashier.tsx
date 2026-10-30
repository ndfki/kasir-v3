import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingCart, 
  Camera, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Banknote, 
  Coins, 
  CheckCircle2, 
  Receipt, 
  Package, 
  X, 
  ArrowRight,
  Zap,
  Printer,
  UserCheck,
  Globe,
  FileDown
} from 'lucide-react';
import { 
  GreenMartProduct, 
  GreenMartCartItem, 
  GreenMartTransaction, 
  GreenMartTransactionItem,
  CashierProfile 
} from '../types';
import { playBarcodeScannerBeep, GREENMART_CATEGORIES } from '../data/greenmartData';
import { GreenMartCameraScannerModal } from './GreenMartCameraScannerModal';
import { GreenMartReceiptModal } from './GreenMartReceiptModal';
import { GreenMartConfirmModal } from './GreenMartConfirmModal';
import { GreenMartPrinterManagerModal } from './GreenMartPrinterManagerModal';
import { GreenMartQuickAddProductModal } from './GreenMartQuickAddProductModal';
import { LiveClock } from './LiveClock';
import { 
  PrinterDevice, 
  loadSavedPrinters, 
  loadPrinterSettings,
  savePrinterSettings,
  executeDirectReceiptPrint
} from '../utils/printerDeviceManager';
import { 
  openReceiptDirectWebPage, 
  exportGreenMartReceiptPdf 
} from '../utils/receiptGenerator';

interface GreenMartCashierProps {
  products: GreenMartProduct[];
  onCompleteTransaction: (transaction: GreenMartTransaction) => void;
  onOpenDeployModal: () => void;
  onDeleteProduct?: (productId: string) => void;
  onAddProduct?: (product: Omit<GreenMartProduct, 'id'>) => void;
  activeCashier?: CashierProfile;
  onOpenCashierModal?: () => void;
}

export const GreenMartCashier: React.FC<GreenMartCashierProps> = ({
  products,
  onCompleteTransaction,
  onOpenDeployModal,
  onDeleteProduct,
  onAddProduct,
  activeCashier,
  onOpenCashierModal
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<GreenMartCartItem[]>([]);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [cashierName, setCashierName] = useState(() => {
    if (activeCashier) {
      const cls = activeCashier.studentClass ? ` - ${activeCashier.studentClass}` : '';
      return `${activeCashier.name}${cls} (NIS: ${activeCashier.nis})`;
    }
    return 'Dewi Sartika - XII BDP 1 (NIS: 20241001)';
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer' | 'piutang'>('tunai');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Sync cashier name whenever activeCashier changes
  useEffect(() => {
    if (activeCashier) {
      const cls = activeCashier.studentClass ? ` - ${activeCashier.studentClass}` : '';
      setCashierName(`${activeCashier.name}${cls} (NIS: ${activeCashier.nis})`);
    }
  }, [activeCashier]);
  
  // Feedback alerts
  const [scanBanner, setScanBanner] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Modals
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [activeReceiptTrx, setActiveReceiptTrx] = useState<GreenMartTransaction | null>(null);
  const [lastCompletedTrx, setLastCompletedTrx] = useState<GreenMartTransaction | null>(null);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);
  const [productToDeleteFromCatalog, setProductToDeleteFromCatalog] = useState<GreenMartProduct | null>(null);

  // Printer Device State
  const [printers, setPrinters] = useState<PrinterDevice[]>(loadSavedPrinters);
  const [printerSettings, setPrinterSettings] = useState(loadPrinterSettings);
  const activePrinter = printers.find(p => p.id === printerSettings.activePrinterId) || printers[0];

  // Product quick search in catalog view
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Autofocus barcode input on mount and after scans
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const showScanBanner = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setScanBanner({ text, type });
    setTimeout(() => {
      setScanBanner(null);
    }, 2800);
  };

  // Add product to cart by barcode or ID
  const handleAddProductByBarcode = (codeOrName: string) => {
    const raw = (codeOrName || '').trim();
    if (!raw) return;
    const query = raw.toLowerCase();

    // Find exact barcode first, then partial barcode, then product name
    const found = products.find(p => p.barcode.toLowerCase() === query)
      || products.find(p => p.barcode.toLowerCase().includes(query))
      || products.find(p => p.name.toLowerCase().includes(query));

    if (!found) {
      playBarcodeScannerBeep('error');
      setUnregisteredBarcode(raw);
      showScanBanner(`Kode Barcode "${raw}" belum terdaftar di katalog. Klik "Daftarkan Sekarang" untuk mendaftarkan barang baru.`, 'error');
      return;
    }

    setUnregisteredBarcode(null);

    // Check stock
    if (found.stock <= 0) {
      playBarcodeScannerBeep('warning');
      showScanBanner(`Stok ${found.name} habis (0 ${found.unit})`, 'warning');
      return;
    }

    // Check if already in cart
    const existingIndex = cart.findIndex(c => c.product.id === found.id);
    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty + 1 > found.stock) {
        playBarcodeScannerBeep('warning');
        showScanBanner(`Qty melebihi sisa stok (${found.stock} ${found.unit})`, 'warning');
        return;
      }

      setCart(prev => {
        const next = [...prev];
        const nextQty = next[existingIndex].qty + 1;
        const discount = next[existingIndex].discountPercent;
        const subtotal = Math.round(nextQty * next[existingIndex].product.sellingPrice * (1 - discount / 100));
        next[existingIndex] = {
          ...next[existingIndex],
          qty: nextQty,
          subtotal
        };
        return next;
      });
    } else {
      const newCartItem: GreenMartCartItem = {
        product: found,
        qty: 1,
        discountPercent: 0,
        subtotal: found.sellingPrice
      };
      setCart(prev => [newCartItem, ...prev]);
    }

    playBarcodeScannerBeep('success');
    showScanBanner(`Scan: ${found.name} (Rp ${found.sellingPrice.toLocaleString('id-ID')})`, 'success');
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Quick save new product from cashier modal
  const handleQuickSaveProduct = (newProduct: Omit<GreenMartProduct, 'id'>) => {
    onAddProduct?.(newProduct);
    const createdProduct: GreenMartProduct = {
      ...newProduct,
      id: `prod-${Date.now()}`
    };
    setCart(prev => [
      {
        product: createdProduct,
        qty: 1,
        discountPercent: 0,
        subtotal: createdProduct.sellingPrice
      },
      ...prev
    ]);
    playBarcodeScannerBeep('success');
    showScanBanner(`Produk "${createdProduct.name}" berhasil didaftarkan & ditambahkan ke keranjang!`, 'success');
    setUnregisteredBarcode(null);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProductByBarcode(barcodeInput);
    }
  };

  // Modify Cart Item Qty
  const handleUpdateQty = (productId: string, delta: number) => {
    const item = cart.find(c => c.product.id === productId);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > item.product.stock) {
      showScanBanner(`Maksimal stok tersedia: ${item.product.stock} ${item.product.unit}`, 'warning');
      return;
    }

    setCart(prev => prev.map(c => {
      if (c.product.id === productId) {
        const subtotal = Math.round(newQty * c.product.sellingPrice * (1 - c.discountPercent / 100));
        return { ...c, qty: newQty, subtotal };
      }
      return c;
    }));
  };

  // Remove item from cart (works directly on click!)
  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  // Clear Cart via custom confirm modal
  const handleConfirmClearCart = () => {
    setCart([]);
    setCashGiven(0);
    setOverallDiscount(0);
    setIsClearCartConfirmOpen(false);
    barcodeInputRef.current?.focus();
    showScanBanner('Keranjang belanja berhasil dikosongkan', 'info' as any);
  };

  // Delete product from catalog directly in POS cashier
  const handleConfirmDeleteFromCatalog = () => {
    if (!productToDeleteFromCatalog) return;
    const prod = productToDeleteFromCatalog;
    setCart(prev => prev.filter(c => c.product.id !== prod.id));
    onDeleteProduct?.(prod.id);
    showScanBanner(`Produk "${prod.name}" berhasil dihapus dari katalog`, 'success');
    setProductToDeleteFromCatalog(null);
  };

  // Mathematical Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const totalDiscountAmount = useMemo(() => {
    return Math.min(cartSubtotal, Math.max(0, overallDiscount));
  }, [cartSubtotal, overallDiscount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - totalDiscountAmount);
  }, [cartSubtotal, totalDiscountAmount]);

  const totalUnitsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Payment & Kembalian Logic
  const effectiveCash = paymentMethod === 'piutang' ? 0 : cashGiven;
  const isPaidLess = grandTotal > 0 && effectiveCash < grandTotal;
  const isPaidExact = grandTotal > 0 && effectiveCash === grandTotal;
  const changeAmount = effectiveCash >= grandTotal ? effectiveCash - grandTotal : 0;
  const receivableAmount = isPaidLess ? grandTotal - effectiveCash : 0;

  // Filtered Catalog for Quick Picker
  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = !catalogSearch.trim() || 
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
        p.barcode.includes(catalogSearch);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, catalogSearch]);

  // Checkout and Submit Transaction
  const handleCheckout = () => {
    if (cart.length === 0) {
      showScanBanner('Keranjang belanja masih kosong! Silakan scan barang terlebih dahulu.', 'warning');
      barcodeInputRef.current?.focus();
      return;
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0];
    const dateCode = dateStr.replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `GM-${dateCode}-${randomSuffix}`;

    const transactionItems: GreenMartTransactionItem[] = cart.map(item => ({
      productId: item.product.id,
      barcode: item.product.barcode,
      name: item.product.name,
      category: item.product.category,
      qty: item.qty,
      unit: item.product.unit,
      costPrice: item.product.costPrice,
      unitPrice: item.product.sellingPrice,
      discountPercent: item.discountPercent,
      subtotal: item.subtotal
    }));

    const newTransaction: GreenMartTransaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber,
      date: dateStr,
      time: timeStr,
      cashierName: cashierName.trim() || 'Kasir GreenMart',
      customerName: customerName.trim() || (isPaidLess ? 'Pelanggan Piutang' : 'Pelanggan Umum'),
      customerPhone: customerPhone.trim() || undefined,
      items: transactionItems,
      totalItemsCount: totalUnitsCount,
      subtotal: cartSubtotal,
      discountTotal: totalDiscountAmount,
      grandTotal,
      paymentMethod,
      cashGiven: effectiveCash,
      changeAmount: changeAmount > 0 ? changeAmount : 0,
      paymentStatus: isPaidLess ? 'Piutang' : 'Lunas',
      notes: notes.trim() || undefined,
      createdAt: today.toISOString()
    };

    // Complete transaction in parent App
    onCompleteTransaction(newTransaction);

    // Show thermal receipt dialog
    setActiveReceiptTrx(newTransaction);
    setLastCompletedTrx(newTransaction);

    // Reset cashier form
    setCart([]);
    setCashGiven(0);
    setOverallDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setPaymentMethod('tunai');
  };

  return (
    <div className="space-y-5 w-full min-w-0">
      
      {/* Real-time Moving POS Station Clock */}
      <LiveClock 
        variant="cashier" 
        shiftLabel={activeCashier ? `Shift ${activeCashier.shift}` : undefined} 
      />

      {/* Top Banner & Barcode Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Kasir POS &amp; Scan Barcode</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                LIVE
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Scanner laser USB, kamera barcode, &amp; hitung kembalian otomatis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">

            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Kamera</span>
            </button>
            <button
              type="button"
              onClick={onOpenDeployModal}
              className="px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition cursor-pointer"
            >
              Unduh ZIP
            </button>
          </div>
        </div>

        {/* Barcode Search Input with autofocus */}
        <div className="relative">
          <div className="flex items-stretch rounded-2xl border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-inner overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/20">
            <span className="flex items-center justify-center px-4 sm:px-5 bg-emerald-600 text-white font-mono font-black text-xs sm:text-sm select-none tracking-wide">
              BARCODE
            </span>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Arahkan laser scanner atau ketik barcode produk..."
              className="w-full text-sm sm:text-base font-bold font-mono px-4 py-3 sm:py-3.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              autoFocus
            />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => setBarcodeInput('')}
                className="px-3 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAddProductByBarcode(barcodeInput)}
              className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer shrink-0"
            >
              <span>Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Test Barcode Chips (Click to test scanning) */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tes Scan Cepat:</span>
          {[
            { label: '🍜 Indomie', code: '8998866200221' },
            { label: '🛢️ Bimoli 2L', code: '8992753211029' },
            { label: '🍚 Beras 5Kg', code: '8993888200101' },
            { label: '🥛 Ultra Milk', code: '8991389220011' },
            { label: '💧 Aqua Botol', code: '8992752011019' },
            { label: '🥚 Telur 1Kg', code: '8990001000011' },
            { label: '☕ Kopi Kapal Api', code: '8991002100555' }
          ].map(chip => (
            <button
              key={chip.code}
              type="button"
              onClick={() => handleAddProductByBarcode(chip.code)}
              className="px-2.5 py-1 rounded-lg bg-slate-200/90 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-[11px] transition cursor-pointer border border-slate-300/60 dark:border-slate-700 hover:border-emerald-400"
              title={`Klik untuk scan barcode ${chip.code}`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Unregistered Barcode Action Prompt (Quick registration to prevent errors) */}
        {unregisteredBarcode && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold block text-sm">Kode Barcode "{unregisteredBarcode}" Belum Terdaftar</span>
                <span className="text-slate-600 dark:text-slate-300 text-[11px]">Daftarkan nama produk dan harga jualnya sekarang agar langsung masuk ke struk kasir.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Daftarkan Produk Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setUnregisteredBarcode(null)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition cursor-pointer"
                title="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Feedback Banner */}
        {scanBanner && (
          <div className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-in slide-in-from-top-1 ${
            scanBanner.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
              : scanBanner.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            <span>{scanBanner.text}</span>
            <button type="button" onClick={() => setScanBanner(null)} className="p-1 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Last Transaction Quick Print & Export Bar */}
        {lastCompletedTrx && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border border-emerald-300 dark:border-emerald-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Nota: <strong className="font-mono">{lastCompletedTrx.invoiceNumber}</strong></span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    Rp {lastCompletedTrx.grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pelanggan: {lastCompletedTrx.customerName} &bull; Status: {lastCompletedTrx.paymentStatus}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => exportGreenMartReceiptPdf(lastCompletedTrx, { paperWidth: printerSettings.paperWidth, printerName: activePrinter.name })}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Unduh struk transaksi terakhir dalam format PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={() => openReceiptDirectWebPage(lastCompletedTrx, { paperWidth: printerSettings.paperWidth, activePrinterName: activePrinter.name })}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Buka struk transaksi terakhir di halaman web baru (Direct Print Web)"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Direct ke Web</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReceiptTrx(lastCompletedTrx)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Buka dialog cetak struk"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setLastCompletedTrx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Tutup notifikasi struk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Preset Barcode Simulation Chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Simulasi Barcode Cepat:</span>
            <span className="font-normal text-slate-400 hidden sm:inline">Klik untuk scan langsung</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
            {products.slice(0, 10).map(prod => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleAddProductByBarcode(prod.barcode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                <span className="text-base">{prod.emoji || '📦'}</span>
                <span className="truncate max-w-[130px] font-semibold">{prod.name}</span>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {prod.barcode.slice(-4)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Cart & Catalog / Right Payment Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* SISI KIRI: KERANJANG & KATALOG PICKER (7 Kolom) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* TABEL KERANJANG BELANJA (CART) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Keranjang Belanja
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {cart.length} Item ({totalUnitsCount} Unit)
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearCartConfirmOpen(true)}
                  className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 sm:max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Keranjang Belanja Kosong
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                    Arahkan scan barcode atau klik produk dari katalog di bawah untuk menambahkan barang.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="p-3.5 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{item.product.emoji || '📦'}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[220px] sm:max-w-[280px]">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Rp {item.product.sellingPrice.toLocaleString('id-ID')} &bull; Sisa: {item.product.stock} {item.product.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Qty Stepper */}
                      <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 sm:w-9 text-center font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="w-24 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </div>

                      {/* Working Direct Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                        title="Hapus item ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KATALOG PRODUK CEPAT */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Katalog Produk ({products.length} Barang)</span>
              </h3>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari barang / barcode..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Kategori Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('Semua')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'Semua'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semua
              </button>
              {GREENMART_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="col-span-2 sm:col-span-3 text-center py-8 text-slate-400 text-xs sm:text-sm">
                  Tidak ada barang yang sesuai pencarian atau kategori
                </div>
              ) : (
                filteredCatalog.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProductByBarcode(prod.barcode)}
                    className="relative group/card p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-400 text-left transition flex flex-col justify-between gap-2 cursor-pointer shadow-xs"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAddProductByBarcode(prod.barcode);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl group-hover/card:scale-110 transition">{prod.emoji || '📦'}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-md font-bold ${
                          prod.stock <= 5 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}>
                          {prod.stock} {prod.unit}
                        </span>

                        {onDeleteProduct && (
                          <button
                            type="button"
                            title={`Hapus produk ${prod.name} dari database`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDeleteFromCatalog(prod);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate" title={prod.name}>
                        {prod.name}
                      </div>
                      <div className="text-xs sm:text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Rp {prod.sellingPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* SISI KANAN: KALKULATOR TOTAL BELANJA & KEMBALIAN (5 Kolom) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* COMPACT BILL AMOUNT CARD */}
          <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-200 uppercase font-bold tracking-wider">
              <span>Total Tagihan Belanja</span>
              <span className="bg-emerald-500/30 px-2 py-0.5 rounded text-xs font-mono">Rupiah</span>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-white">
              Rp {grandTotal.toLocaleString('id-ID')}
            </div>

            <div className="pt-2 border-t border-emerald-700/60 text-xs sm:text-sm text-emerald-200 flex items-center justify-between font-medium">
              <span>Subtotal: Rp {cartSubtotal.toLocaleString('id-ID')}</span>
              {totalDiscountAmount > 0 && (
                <span className="text-amber-300 font-bold">Diskon: -Rp {totalDiscountAmount.toLocaleString('id-ID')}</span>
              )}
            </div>
          </div>

          {/* PAYMENT & CHANGE INTERACTIVE BOX */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'tunai', label: 'Tunai' },
                  { id: 'qris', label: 'QRIS' },
                  { id: 'transfer', label: 'Transfer' },
                  { id: 'piutang', label: 'Piutang' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'piutang') setCashGiven(0);
                    }}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Given Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Uang Diterima (Rp)</span>
                </label>
                {grandTotal > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    effectiveCash >= grandTotal 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {effectiveCash >= grandTotal ? 'LUNAS' : 'KURANG / PIUTANG'}
                  </span>
                )}
              </div>

              <div className="flex items-stretch rounded-2xl border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-inner overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/20">
                <span className="flex items-center justify-center px-4 bg-emerald-600 text-white font-mono font-bold text-base select-none">
                  Rp
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={paymentMethod === 'piutang'}
                  value={paymentMethod === 'piutang' ? 0 : (cashGiven || '')}
                  onChange={(e) => setCashGiven(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder={paymentMethod === 'piutang' ? '0 (Piutang)' : 'Ketik uang tunai...'}
                  className="w-full text-2xl sm:text-3xl font-black font-mono px-4 py-3 sm:py-3.5 bg-transparent text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none"
                />
                {cashGiven > 0 && paymentMethod !== 'piutang' && (
                  <button
                    type="button"
                    onClick={() => setCashGiven(0)}
                    className="px-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Clean Kembalian Banner */}
            <div className={`p-4 sm:p-4.5 rounded-2xl border transition-all ${
              grandTotal === 0
                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                : effectiveCash > grandTotal
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : isPaidExact
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-bold uppercase block">
                    {effectiveCash > grandTotal
                      ? 'Kembalian Pembeli:'
                      : isPaidExact
                      ? 'Uang Pas (Lunas):'
                      : paymentMethod === 'piutang'
                      ? 'Total Piutang:'
                      : 'Kurang Bayar (Piutang):'}
                  </span>
                  <span className="text-xs opacity-75 mt-0.5 block">
                    {effectiveCash > grandTotal ? 'Kembalikan ke pembeli' : isPaidExact ? 'Lunas tepat tanpa kembalian' : 'Dicatat sebagai piutang pelanggan'}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black font-mono">
                    Rp {(effectiveCash >= grandTotal ? changeAmount : receivableAmount).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Denominations */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pecahan Cepat:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {grandTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tunai');
                      setCashGiven(grandTotal);
                    }}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
                  >
                    Pas (Rp {grandTotal.toLocaleString('id-ID')})
                  </button>
                )}
                {[10000, 20000, 50000, 100000, 200000].map(nom => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tunai');
                      setCashGiven(nom);
                    }}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    {nom >= 1000 ? `${nom / 1000}k` : nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Cashier On Duty Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kasir Bertugas</span>
                </label>
                {onOpenCashierModal && (
                  <button
                    type="button"
                    onClick={onOpenCashierModal}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Ganti Shift</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Nama Kasir Bertugas"
                  className="flex-1 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
                {activeCashier && (
                  <span className="px-2.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                    Shift {activeCashier.shift}
                  </span>
                )}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Nama Pelanggan (Opsional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Pelanggan Umum"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Selesaikan &amp; Cetak Struk</span>
            </button>

          </div>

        </div>

      </div>

      {/* CAMERA BARCODE SCANNER MODAL */}
      <GreenMartCameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(code) => handleAddProductByBarcode(code)}
        products={products}
      />

      {/* THERMAL RECEIPT MODAL */}
      <GreenMartReceiptModal
        isOpen={!!activeReceiptTrx}
        transaction={activeReceiptTrx}
        onClose={() => setActiveReceiptTrx(null)}
      />

      {/* CLEAR CART CONFIRMATION MODAL */}
      <GreenMartConfirmModal
        isOpen={isClearCartConfirmOpen}
        title="Kosongkan Keranjang Belanja?"
        message="Seluruh item yang telah dimasukkan ke dalam keranjang saat ini akan dihapus."
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleConfirmClearCart}
        onCancel={() => setIsClearCartConfirmOpen(false)}
      />

      {/* DELETE PRODUCT FROM CATALOG CONFIRMATION MODAL */}
      <GreenMartConfirmModal
        isOpen={!!productToDeleteFromCatalog}
        title="Hapus Produk dari Database / Katalog?"
        message={
          productToDeleteFromCatalog
            ? `Apakah Anda yakin ingin menghapus produk "${productToDeleteFromCatalog.name}" (Barcode: ${productToDeleteFromCatalog.barcode})? Produk akan dihapus dari katalog dan keranjang kasir.`
            : ''
        }
        confirmLabel="Ya, Hapus Produk"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleConfirmDeleteFromCatalog}
        onCancel={() => setProductToDeleteFromCatalog(null)}
      />

      {/* PRINTER DEVICE MANAGER MODAL */}
      <GreenMartPrinterManagerModal
        isOpen={isPrinterModalOpen}
        onClose={() => {
          setIsPrinterModalOpen(false);
          setPrinters(loadSavedPrinters());
          setPrinterSettings(loadPrinterSettings());
        }}
        onPrinterChanged={() => {
          setPrinters(loadSavedPrinters());
          setPrinterSettings(loadPrinterSettings());
        }}
      />

      {/* QUICK ADD UNREGISTERED BARCODE MODAL */}
      <GreenMartQuickAddProductModal
        isOpen={isQuickAddOpen}
        initialBarcode={unregisteredBarcode || ''}
        onClose={() => setIsQuickAddOpen(false)}
        onSaveProduct={handleQuickSaveProduct}
      />

    </div>
  );
};
