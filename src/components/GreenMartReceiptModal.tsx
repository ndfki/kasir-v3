import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Receipt, 
  Settings2, 
  Sliders, 
  CheckCircle2, 
  Usb, 
  Bluetooth, 
  Cpu,
  FileDown,
  Globe,
  ExternalLink,
  FileText
} from 'lucide-react';
import { GreenMartTransaction } from '../types';
import { 
  PrinterDevice, 
  PrinterSettings, 
  loadSavedPrinters, 
  loadPrinterSettings, 
  savePrinterSettings,
  savePrinterDevices 
} from '../utils/printerDeviceManager';
import { 
  exportGreenMartReceiptPdf, 
  openReceiptDirectWebPage,
  generateGreenMartReceiptText 
} from '../utils/receiptGenerator';
import { GREENMART_LOGO_COLOR_BASE64, GREENMART_LOGO_BW_BASE64 } from '../utils/greenmartLogoBase64';
import { GreenMartPrinterManagerModal } from './GreenMartPrinterManagerModal';

interface GreenMartReceiptModalProps {
  isOpen: boolean;
  transaction: GreenMartTransaction | null;
  onClose: () => void;
}

export const GreenMartReceiptModal: React.FC<GreenMartReceiptModalProps> = ({
  isOpen,
  transaction,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [isPrinterManagerOpen, setIsPrinterManagerOpen] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>(loadSavedPrinters);
  const [settings, setSettings] = useState<PrinterSettings>(loadPrinterSettings);

  // Sync printer settings when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPrinters(loadSavedPrinters());
      setSettings(loadPrinterSettings());
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const activePrinter = printers.find(p => p.id === settings.activePrinterId) || printers[0];
  const is80mm = settings.paperWidth === '80mm';

  const handlePrint = () => {
    let iframe = document.getElementById('receipt-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'receipt-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const isSettled = Boolean(transaction.settledAt);
    const paperWidthCss = is80mm ? '74mm' : '52mm';
    const pageCss = is80mm ? '80mm auto' : '58mm auto';
    const storeAddressFull = 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Struk GreenMart - ${transaction.invoiceNumber}</title>
        <style>
          @page { size: ${pageCss}; margin: 0; }
          body {
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: ${is80mm ? '12px' : '10.5px'};
            line-height: 1.35;
            color: #000000;
            font-weight: 700;
            width: ${paperWidthCss};
            margin: 0 auto;
            padding: ${is80mm ? '2mm 3mm' : '1.5mm 1.5mm'};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: 800; }
          .line { border-top: 1.5px dashed #000000; margin: 4px 0; }
          .double-line { border-top: 2px dashed #000000; margin: 5px 0; }
          .flex { display: flex; justify-content: space-between; align-items: flex-start; }
          .receipt-logo {
            display: block;
            margin: 0 auto;
            object-fit: contain;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          .settled-badge {
            border: 1.5px solid #000000;
            padding: 3px;
            text-align: center;
            font-weight: 800;
            margin: 4px 0;
            font-size: 10px;
          }
          @media print {
            body { width: 100%; margin: 0; padding: ${is80mm ? '1.5mm' : '1mm'}; color: #000000; }
          }
        </style>
      </head>
      <body>
        <!-- Header Logo (Support B&W & Color) -->
        <div class="text-center" style="margin-bottom: 2px;">
          <img src="${GREENMART_LOGO_COLOR_BASE64}" alt="GreenMart Logo" class="receipt-logo" style="width: ${is80mm ? '40px' : '34px'}; height: ${is80mm ? '40px' : '34px'}; margin-bottom: 3px;" />
          <div class="bold" style="font-size: ${is80mm ? '14px' : '13px'}; line-height: 1.2; letter-spacing: 0.5px;">GREENMART SUPERMARKET</div>
          <div style="font-size: ${is80mm ? '10px' : '9px'}; font-weight: 700; color: #000; margin-top: 1px;">Pusat Belanja Segar &amp; Hemat Lengkap</div>
          <div style="font-size: ${is80mm ? '9px' : '8.5px'}; font-weight: 600; color: #000; line-height: 1.25; margin-top: 2px;">${storeAddressFull}</div>
        </div>
        <div class="line"></div>
        <div class="flex"><span>Nota:</span><span class="bold">${transaction.invoiceNumber}</span></div>
        <div class="flex"><span>Waktu:</span><span>${transaction.date} ${transaction.time}</span></div>
        <div class="flex"><span>Kasir:</span><span class="bold">${transaction.cashierName}</span></div>
        <div class="flex"><span>Pelanggan:</span><span class="bold">${transaction.customerName}</span></div>
        ${isSettled ? `
          <div class="settled-badge">
            *** BUKTI PELUNASAN PIUTANG RESMI ***<br/>
            STATUS: LUNAS TERBAYAR
          </div>
        ` : ''}
        <div class="double-line"></div>
        ${transaction.items.map(item => `
          <div style="margin-bottom: 3.5px;">
            <div class="bold" style="font-size: ${is80mm ? '12px' : '11px'};">${item.name}</div>
            <div class="flex" style="font-size: ${is80mm ? '11px' : '10px'}; font-weight: 700;">
              <span>  ${item.qty} ${item.unit} x Rp ${item.unitPrice.toLocaleString('id-ID')}</span>
              <span class="bold">Rp ${item.subtotal.toLocaleString('id-ID')}</span>
            </div>
            ${item.discountPercent > 0 ? `<div class="flex" style="font-size: 9px; font-weight: 700; color: #000;"><span>  Diskon ${item.discountPercent}%</span><span>-</span></div>` : ''}
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="flex"><span>Total Item:</span><span>${transaction.totalItemsCount} Unit</span></div>
        <div class="flex"><span>Subtotal:</span><span>Rp ${transaction.subtotal.toLocaleString('id-ID')}</span></div>
        ${transaction.discountTotal > 0 ? `<div class="flex" style="font-weight: 800; color: #000;"><span>Potongan Diskon:</span><span class="bold">-Rp ${transaction.discountTotal.toLocaleString('id-ID')}</span></div>` : ''}
        <div class="line"></div>
        <div class="flex bold" style="font-size: ${is80mm ? '14.5px' : '13px'}; padding: 2px 0;">
          <span>TOTAL BELANJA:</span>
          <span>Rp ${transaction.grandTotal.toLocaleString('id-ID')}</span>
        </div>
        <div class="line"></div>
        <div class="flex"><span>Metode Bayar Awal:</span><span class="bold">${transaction.paymentMethod.toUpperCase()}</span></div>
        ${isSettled ? `
          <div class="flex"><span>Status Pembayaran:</span><span class="bold">LUNAS</span></div>
          <div class="flex"><span>Tgl Pelunasan:</span><span class="bold">${transaction.settledAt}</span></div>
          <div class="flex"><span>Metode Pelunasan:</span><span class="bold">${(transaction.settledMethod || 'tunai').toUpperCase()}</span></div>
          <div class="flex"><span>Uang Diterima:</span><span class="bold">Rp ${(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}</span></div>
          <div class="flex bold"><span>SISA PIUTANG:</span><span>Rp 0 (LUNAS)</span></div>
          ${transaction.settledNotes ? `<div class="flex" style="font-size: 9px; font-weight: 700;"><span>Catatan:</span><span>${transaction.settledNotes}</span></div>` : ''}
          ${transaction.settledByCashier ? `<div class="flex" style="font-size: 9px; font-weight: 700;"><span>Kasir Pelunasan:</span><span>${transaction.settledByCashier}</span></div>` : ''}
        ` : `
          <div class="flex"><span>Bayar (Cash):</span><span class="bold">Rp ${transaction.cashGiven.toLocaleString('id-ID')}</span></div>
          <div class="flex bold" style="font-size: 11.5px;">
            <span>${transaction.changeAmount >= 0 ? 'KEMBALIAN:' : 'SISA PIUTANG:'}</span>
            <span>Rp ${Math.abs(transaction.changeAmount).toLocaleString('id-ID')}</span>
          </div>
          <div class="flex"><span>Status:</span><span class="bold">${transaction.paymentStatus}</span></div>
        `}
        <div class="double-line"></div>
        <div class="text-center bold" style="margin-top: 3px; font-size: ${is80mm ? '11px' : '10px'};">Terima Kasih Atas Kunjungan Anda!</div>
        <div class="text-center" style="font-size: ${is80mm ? '8.5px' : '8px'}; font-weight: 600; color: #000;">Barang yang sudah dibeli dapat ditukar 1x24 jam dengan struk resmi</div>
        
        <!-- Footer Logo GreenMart Resmi -->
        <div style="text-align: center; margin: 4px 0 2px 0;">
          <img src="${GREENMART_LOGO_COLOR_BASE64}" alt="GreenMart Footer Logo" class="receipt-logo" style="width: ${is80mm ? '28px' : '22px'}; height: ${is80mm ? '28px' : '22px'};" />
        </div>

        <div class="text-center bold" style="font-size: ${is80mm ? '14px' : '12px'}; letter-spacing: 2px;">|||| || ||||| || |||||| |||| |</div>
        <div class="text-center" style="font-size: 8.5px; font-weight: 700; color: #000;">*${transaction.invoiceNumber}*</div>
        <div class="text-center" style="font-size: 7.5px; font-weight: 600; color: #000; margin-top: 2px;">Device: ${activePrinter.name} (${settings.paperWidth})</div>
        ${settings.autoCut ? '<div style="height: 14mm;"></div>' : '<div style="height: 6mm;"></div>'}
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          window.print();
        }
      }, 250);
    } else {
      window.print();
    }
  };

  const getPlainText = () => {
    const isSettled = Boolean(transaction.settledAt);
    const line = is80mm 
      ? '================================================' 
      : '========================================';
    const sub = is80mm 
      ? '------------------------------------------------' 
      : '----------------------------------------';
    let text = `${line}\n`;
    text += '          GREENMART SUPERMARKET          \n';
    text += '   Pusat Belanja Segar, Hemat & Lengkap  \n';
    text += 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat\n';
    text += '  Proyonanggan Sel., Batang, Jateng 51216 \n';
    text += `${line}\n`;
    text += `No. Nota   : ${transaction.invoiceNumber}\n`;
    text += `Tanggal    : ${transaction.date} ${transaction.time}\n`;
    text += `Kasir      : ${transaction.cashierName}\n`;
    text += `Pelanggan  : ${transaction.customerName}\n`;
    if (isSettled) {
      text += `${sub}\n`;
      text += '*** STATUS: LUNAS (PIUTANG TELAH DILUNASI) ***\n';
      text += `Tgl Pelunasan    : ${transaction.settledAt}\n`;
      text += `Metode Pelunasan : ${(transaction.settledMethod || 'tunai').toUpperCase()}\n`;
      if (transaction.settledByCashier) {
        text += `Kasir Pelunasan  : ${transaction.settledByCashier}\n`;
      }
      if (transaction.settledNotes) {
        text += `Catatan          : ${transaction.settledNotes}\n`;
      }
    }
    text += `${sub}\n`;
    text += 'DAFTAR BARANG BELANJA:\n';
    transaction.items.forEach(i => {
      text += `* ${i.name}\n`;
      text += `  ${i.qty} ${i.unit} x Rp ${i.unitPrice.toLocaleString('id-ID')} = Rp ${i.subtotal.toLocaleString('id-ID')}\n`;
    });
    text += `${sub}\n`;
    text += `Total Barang  : ${transaction.totalItemsCount} Unit\n`;
    text += `Subtotal      : Rp ${transaction.subtotal.toLocaleString('id-ID')}\n`;
    if (transaction.discountTotal > 0) {
      text += `Diskon Total  : -Rp ${transaction.discountTotal.toLocaleString('id-ID')}\n`;
    }
    text += `${line}\n`;
    text += `TOTAL AKHIR   : Rp ${transaction.grandTotal.toLocaleString('id-ID')}\n`;
    text += `${line}\n`;
    if (isSettled) {
      text += `Status        : LUNAS (Piutang Selesai)\n`;
      text += `Metode Bayar  : ${(transaction.settledMethod || 'tunai').toUpperCase()} (Pelunasan)\n`;
      text += `Uang Diterima : Rp ${(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}\n`;
      text += `Sisa Piutang  : Rp 0 (Lunas)\n`;
    } else {
      text += `Metode Bayar  : ${transaction.paymentMethod.toUpperCase()}\n`;
      text += `Uang Diterima : Rp ${transaction.cashGiven.toLocaleString('id-ID')}\n`;
      text += `Kembalian     : Rp ${transaction.changeAmount.toLocaleString('id-ID')}\n`;
      text += `Status        : ${transaction.paymentStatus}\n`;
    }
    text += `${line}\n`;
    text += '   Terima kasih telah berbelanja di GreenMart!   \n';
    text += `${line}\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadTxt = () => {
    const text = getPlainText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Struk_GreenMart_${transaction.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    try {
      exportGreenMartReceiptPdf(transaction, {
        paperWidth: settings.paperWidth,
        printerName: activePrinter.name
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 2500);
    } catch (e) {
      console.error('Failed to export PDF receipt:', e);
    }
  };

  const handleOpenWebPage = () => {
    openReceiptDirectWebPage(transaction, {
      paperWidth: settings.paperWidth,
      activePrinterName: activePrinter.name,
      autoPrint: false
    });
  };

  const handleTogglePaperWidth = (width: '58mm' | '80mm') => {
    const nextSettings = { ...settings, paperWidth: width };
    setSettings(nextSettings);
    savePrinterSettings(nextSettings);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-800 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-xl">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight">Struk Kasir GreenMart</h3>
                <p className="text-xs text-emerald-200 font-mono">{transaction.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DETECTED PRINTER DEVICE CONTROL BAR */}
          <div className="bg-emerald-50/90 dark:bg-emerald-950/50 px-4 py-2.5 border-b border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                {activePrinter.connectionType === 'usb' ? (
                  <Usb className="w-3.5 h-3.5" />
                ) : activePrinter.connectionType === 'bluetooth' ? (
                  <Bluetooth className="w-3.5 h-3.5" />
                ) : activePrinter.connectionType === 'serial' ? (
                  <Cpu className="w-3.5 h-3.5" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{activePrinter.name}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Ready</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Koneksi: {activePrinter.connectionType.toUpperCase()} &bull; Lebar: {settings.paperWidth}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick Paper Width Toggle */}
              <div className="flex items-center rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleTogglePaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    settings.paperWidth === '58mm'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    settings.paperWidth === '80mm'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  80mm
                </button>
              </div>

              {/* Configure / Detect Printers */}
              <button
                type="button"
                onClick={() => setIsPrinterManagerOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs"
                title="Pindai dan kelola device printer terhubung"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deteksi Device</span>
              </button>
            </div>
          </div>

          {/* Modal Body: Thermal Paper Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100 dark:bg-slate-950">
            <div className={`bg-white text-black p-5 rounded-2xl shadow-sm border border-slate-300 font-mono text-xs sm:text-sm space-y-3 mx-auto transition-all duration-200 ${
              is80mm ? 'max-w-sm sm:max-w-md' : 'max-w-xs'
            }`}>
              
              <div className="text-center space-y-1">
                <img 
                  src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
                  alt="GreenMart Logo" 
                  className="w-10 h-10 mx-auto object-contain"
                />
                <div className="font-black text-sm sm:text-base tracking-wide text-black">GREENMART SUPERMARKET</div>
                <div className="text-xs text-black font-bold">Pusat Belanja Segar &amp; Hemat Lengkap</div>
                <div className="text-[11px] text-black font-semibold leading-snug px-1 max-w-[250px] mx-auto">
                  Jl. Ki Mangunsarkoro No.2, 03, Dracik<br />
                  Barat, Proyonanggan Sel., Kec.<br />
                  Batang, Kabupaten Batang, Jawa Tengah<br />
                  51216
                </div>
              </div>

              <div className="border-t-2 border-dashed border-black/80 pt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">No. Nota:</span>
                  <span className="font-black text-black">{transaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Waktu:</span>
                  <span className="font-bold text-black">{transaction.date} {transaction.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Kasir:</span>
                  <span className="font-bold text-black">{transaction.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-800">Pelanggan:</span>
                  <span className="font-black text-black">{transaction.customerName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border-t-2 border-dashed border-black/80 pt-2 space-y-1.5 text-xs sm:text-sm">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-black text-black flex justify-between">
                      <span className="truncate max-w-[180px] sm:max-w-[240px]">{item.name}</span>
                      <span className="font-mono">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 flex justify-between">
                      <span>{item.qty} {item.unit} &times; Rp {item.unitPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations Breakdown */}
              <div className="border-t-2 border-dashed border-black/80 pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Total Item:</span>
                  <span className="font-black text-black">{transaction.totalItemsCount} Unit</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Subtotal:</span>
                  <span className="font-black text-black">Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {transaction.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-700 font-black">
                    <span>Diskon:</span>
                    <span>-Rp {transaction.discountTotal.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Box */}
              <div className="border-y-2 border-black py-2.5 flex justify-between items-center text-sm font-black">
                <span className="tracking-wide">TOTAL TAGIHAN:</span>
                <span className="text-black text-base sm:text-lg font-black font-mono">Rp {transaction.grandTotal.toLocaleString('id-ID')}</span>
              </div>

              {/* Payment & Change Info */}
              {transaction.settledAt ? (
                <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-black/40">
                  <div className="text-center font-black text-black pb-1 border-b border-dashed border-black/40">
                    BUKTI PELUNASAN PIUTANG RESMI
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">Status Akhir:</span>
                    <span className="px-2 py-0.5 rounded font-black text-xs bg-black text-white">
                      LUNAS TERBAYAR
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">Waktu Pelunasan:</span>
                    <span className="font-black text-black">{transaction.settledAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">Metode Pelunasan:</span>
                    <span className="font-black uppercase text-black">{transaction.settledMethod || 'Tunai'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-800">Nominal Dilunasi:</span>
                    <span className="font-black text-black">Rp {(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-black text-black">
                    <span>Sisa Piutang:</span>
                    <span className="font-black">Rp 0 (LUNAS)</span>
                  </div>
                  {transaction.settledByCashier && (
                    <div className="flex justify-between text-[11px] font-bold text-slate-800">
                      <span>Kasir Pelunasan:</span>
                      <span className="font-black text-black">{transaction.settledByCashier}</span>
                    </div>
                  )}
                  {transaction.settledNotes && (
                    <div className="text-[11px] text-slate-800 font-bold italic pt-1 border-t border-dashed border-black/40">
                      Ket: {transaction.settledNotes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Metode Bayar:</span>
                    <span className="font-black uppercase text-black">{transaction.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Bayar (Cash):</span>
                    <span className="font-black text-black">Rp {transaction.cashGiven.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-black text-black">
                    <span>{transaction.changeAmount >= 0 ? 'Kembalian:' : 'Sisa Piutang:'}</span>
                    <span className="font-black">
                      Rp {Math.abs(transaction.changeAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="font-bold text-slate-800">Status:</span>
                    <span className="px-2 py-0.5 rounded font-black text-xs border border-black bg-slate-100 text-black">
                      {transaction.paymentStatus}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t-2 border-dashed border-black/80 pt-2 text-center text-xs space-y-1">
                <div className="font-black text-black text-xs">Terima Kasih Atas Kunjungan Anda di GreenMart!</div>
                <div className="text-[10px] text-slate-800 font-bold leading-tight">Barang yang sudah dibeli dapat ditukar 1x24 jam dengan struk resmi</div>
                
                {/* Logo GreenMart di Footer Struk */}
                <div className="py-1">
                  <img 
                    src="/assets/aistudio/gm_logo_small.png" 
                    alt="GreenMart Footer Logo" 
                    className="w-7 h-7 mx-auto object-contain opacity-95"
                  />
                </div>

                <div className="font-mono text-xs tracking-widest font-black text-black">|||| || ||||| || |||||| |||| |</div>
                <div className="text-[10px] font-black text-black font-mono">*{transaction.invoiceNumber}*</div>
                <div className="text-[9.5px] font-bold text-slate-800">Format: {settings.paperWidth} &bull; GreenMart POS Batang</div>
              </div>

            </div>
          </div>

          {/* Modal Footer Actions - Proportional & Responsive */}
          <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            {/* Auxiliary actions: Copy & TXT */}
            <div className="flex items-center gap-1.5 order-2 sm:order-1">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Salin format teks struk ke clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Download struk dalam format berkas teks (.txt)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>TXT</span>
              </button>
            </div>

            {/* Main actions: Export PDF, Direct Web, Cetak Printer */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
              {/* EXPORT PDF OPTION */}
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Unduh struk dalam format berkas dokumen PDF resmi"
              >
                {pdfDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                <span>{pdfDownloaded ? 'PDF Diunduh!' : 'Export PDF'}</span>
              </button>

              {/* DIRECT KE HALAMAN WEB OPTION */}
              <button
                type="button"
                onClick={handleOpenWebPage}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Buka tampilan struk di halaman web baru (Direct Print Web)"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Direct ke Web</span>
              </button>

              {/* CETAK KE PRINTER OPTION */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                title={`Cetak langsung ke ${activePrinter.name}`}
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Printer</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* PRINTER DEVICE MANAGER MODAL */}
      <GreenMartPrinterManagerModal
        isOpen={isPrinterManagerOpen}
        onClose={() => {
          setIsPrinterManagerOpen(false);
          setPrinters(loadSavedPrinters());
          setSettings(loadPrinterSettings());
        }}
        onPrinterChanged={(newPrinter) => {
          setPrinters(loadSavedPrinters());
          setSettings(loadPrinterSettings());
        }}
      />
    </>
  );
};
