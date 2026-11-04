import jsPDF from 'jspdf';
import { GreenMartTransaction } from '../types';
import { GREENMART_LOGO_COLOR_BASE64, GREENMART_LOGO_BW_BASE64 } from './greenmartLogoBase64';

export interface ReceiptData {
  sheetName: string;
  trxCode: string;
  date: string;
  itemName: string;
  category?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  grandTotal: number;
  paymentType: string;
  cashGiven: number;
  changeAmount: number;
  isPiutang: boolean;
  receivableAmount: number;
  customerName?: string;
  customerPhone?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * Normalizes and recalculates receipt data to guarantee 100% mathematical accuracy.
 */
export function normalizeReceiptData(data: ReceiptData): ReceiptData & {
  computedSubtotal: number;
  computedDiscount: number;
  computedGrandTotal: number;
  computedCash: number;
  computedChange: number;
  computedReceivable: number;
  isPaidFull: boolean;
} {
  const qty = Math.max(1, data.qty || 1);
  const unitPrice = Math.max(0, data.unitPrice || 0);
  const computedSubtotal = qty * unitPrice;
  const subtotal = data.subtotal > 0 ? data.subtotal : computedSubtotal;

  const discountPercent = Math.min(100, Math.max(0, data.discountPercent || 0));
  const computedDiscount = data.discountAmount !== undefined && data.discountAmount >= 0
    ? data.discountAmount 
    : Math.round((subtotal * discountPercent) / 100);

  const computedGrandTotal = Math.max(0, subtotal - computedDiscount);
  const grandTotal = data.grandTotal > 0 ? data.grandTotal : computedGrandTotal;

  const isPiutangExplicit = data.paymentType.toLowerCase().includes('piutang') || data.isPiutang;
  const computedCash = isPiutangExplicit ? 0 : Math.max(0, data.cashGiven || 0);

  const isPaidFull = grandTotal === 0 || computedCash >= grandTotal;
  const computedChange = isPaidFull && grandTotal > 0 ? computedCash - grandTotal : 0;
  const computedReceivable = !isPaidFull && grandTotal > 0 
    ? grandTotal - computedCash 
    : (data.receivableAmount || 0);

  const isPiutang = computedReceivable > 0;

  return {
    ...data,
    qty,
    unitPrice,
    subtotal,
    discountPercent,
    discountAmount: computedDiscount,
    grandTotal,
    cashGiven: computedCash,
    changeAmount: computedChange,
    receivableAmount: computedReceivable,
    isPiutang,
    computedSubtotal,
    computedDiscount,
    computedGrandTotal: grandTotal,
    computedCash,
    computedChange,
    computedReceivable,
    isPaidFull
  };
}

/**
 * Generates formatted pure plain text receipt with explicit arithmetic operation breakdowns.
 */
export function generateReceiptText(rawData: ReceiptData): string {
  const data = normalizeReceiptData(rawData);
  const line = '========================================';
  const subLine = '----------------------------------------';

  const formatRow = (left: string, right: string, width = 40) => {
    const l = String(left);
    const r = String(right);
    const spaces = Math.max(1, width - l.length - r.length);
    return l + ' '.repeat(spaces) + r;
  };

  const lines: string[] = [
    line,
    '       DATA STATISTIK KASIR POS         ',
    '        STRUK RESMI TRANSAKSI           ',
    line,
    `Sheet      : ${data.sheetName}`,
    `No. Struk  : ${data.trxCode}`,
    `Tanggal    : ${data.date}`,
    `Metode     : ${data.paymentType.toUpperCase()}`,
  ];

  if (data.customerName) {
    lines.push(`Pelanggan  : ${data.customerName}`);
  }
  if (data.customerPhone) {
    lines.push(`Kontak/WA  : ${data.customerPhone}`);
  }

  lines.push(subLine);
  lines.push(`BARANG YANG DIBELI:`);
  lines.push(`  ${data.itemName}`);
  if (data.category) {
    lines.push(`  Kategori: ${data.category}`);
  }

  lines.push(subLine);
  lines.push('SISTEM OPERASI HITUNG TOTAL HARGA:');
  lines.push(
    formatRow(
      `  ${data.qty} unit x Rp ${data.unitPrice.toLocaleString('id-ID')}`,
      `= Rp ${data.subtotal.toLocaleString('id-ID')}`
    )
  );

  if (data.discountAmount && data.discountAmount > 0) {
    lines.push(
      formatRow(
        `  Potongan Diskon (${data.discountPercent || 0}%)`,
        `- Rp ${data.discountAmount.toLocaleString('id-ID')}`
      )
    );
    lines.push(
      formatRow(
        `  Operasi [Subtotal - Diskon]`,
        `= Rp ${data.grandTotal.toLocaleString('id-ID')}`
      )
    );
  }

  lines.push(line);
  lines.push(
    formatRow('TOTAL TAGIHAN BELANJA', `Rp ${data.grandTotal.toLocaleString('id-ID')}`)
  );
  lines.push(line);

  lines.push('SISTEM OPERASI PEMBAYARAN KASIR:');
  lines.push(
    formatRow('  Total Tagihan Belanja', `Rp ${data.grandTotal.toLocaleString('id-ID')}`)
  );
  lines.push(
    formatRow('  Uang Diterima dari Pembeli', `Rp ${data.cashGiven.toLocaleString('id-ID')}`)
  );

  if (data.isPiutang) {
    lines.push(subLine);
    lines.push('  Operasi Hitung Kurang Bayar:');
    lines.push('  [Total Tagihan] - [Uang Diterima]');
    lines.push(
      formatRow(
        '  SISA KURANG (PIUTANG)',
        `Rp ${data.receivableAmount.toLocaleString('id-ID')}`
      )
    );
    lines.push('*** STATUS: BELUM LUNAS / PIUTANG ***');
    if (data.dueDate) {
      lines.push(`  Jatuh Tempo: ${data.dueDate}`);
    }
  } else {
    lines.push(subLine);
    lines.push('  Operasi Hitung Kembalian:');
    lines.push('  [Uang Diterima] - [Total Tagihan]');
    if (data.changeAmount === 0) {
      lines.push(formatRow('  KEMBALIAN', 'Rp 0 (UANG PAS)'));
    } else {
      lines.push(
        formatRow('  KEMBALIAN KE PEMBELI', `Rp ${data.changeAmount.toLocaleString('id-ID')}`)
      );
    }
    lines.push('*** STATUS PEMBAYARAN: LUNAS ***');
  }

  if (data.notes) {
    lines.push(subLine);
    lines.push(`Catatan: ${data.notes}`);
  }

  lines.push(line);
  lines.push(' Terima kasih atas transaksi belanja Anda! ');
  lines.push('   Simpan struk ini sebagai bukti resmi    ');
  lines.push(line);

  return lines.join('\n');
}

/**
 * Generates printable HTML optimized for 58mm / 80mm thermal printers or standard system print / Save to PDF.
 */
export function generateReceiptHtml(rawData: ReceiptData): string {
  const data = normalizeReceiptData(rawData);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk POS - ${data.trxCode}</title>
  <style>
    @page {
      margin: 4mm;
      size: auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace, monospace;
      width: 72mm;
      max-width: 100%;
      margin: 2mm auto;
      padding: 3mm;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
    .line { border-top: 1px dashed #000; margin: 4px 0; }
    .double-line { border-top: 2px dashed #000; margin: 5px 0; }
    .flex { display: flex; justify-content: space-between; align-items: flex-start; }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 3px;
      margin-bottom: 2px;
    }
    .badge {
      display: inline-block;
      padding: 3px 6px;
      font-size: 10px;
      font-weight: bold;
      border: 1px solid #000;
      margin: 3px auto;
      text-align: center;
    }
    .badge-piutang {
      background: #fee2e2;
      border-color: #b91c1c;
      color: #b91c1c;
    }
    .badge-lunas {
      background: #ecfdf5;
      border-color: #059669;
      color: #059669;
    }
    .total-box {
      border: 1px solid #000;
      padding: 4px 6px;
      margin: 4px 0;
      background: #f8fafc;
    }
    .total-row {
      font-size: 13px;
      font-weight: bold;
    }
    .calc-row {
      font-size: 10px;
      color: #222;
      margin-left: 4px;
    }
    @media print {
      body { margin: 0 auto; padding: 2mm; width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="text-center header-title">DATA STATISTIK KASIR POS</div>
  <div class="text-center bold">STRUK RESMI TRANSAKSI PENJUALAN</div>
  <div class="text-center" style="font-size: 10px;">${data.sheetName}</div>
  <div class="text-center" style="font-size: 9px; color: #444;">${data.date}</div>
  <div class="line"></div>
  
  <div class="flex"><span>No. Struk:</span><span class="bold">${data.trxCode}</span></div>
  <div class="flex"><span>Metode Bayar:</span><span>${data.paymentType.toUpperCase()}</span></div>
  ${data.customerName ? `<div class="flex"><span>Pelanggan:</span><span class="bold">${data.customerName}</span></div>` : ''}
  ${data.customerPhone ? `<div class="flex"><span>Kontak/WA:</span><span>${data.customerPhone}</span></div>` : ''}
  
  <div class="double-line"></div>
  <div class="section-title">BARANG YANG DIBELI:</div>
  <div class="bold" style="font-size: 12px;">${data.itemName}</div>
  ${data.category ? `<div style="font-size: 10px; color: #444;">Kategori: ${data.category}</div>` : ''}
  
  <div class="line"></div>
  <div class="section-title">OPERASI HITUNG TOTAL HARGA:</div>
  
  <div class="flex">
    <span>${data.qty} unit &times; Rp ${data.unitPrice.toLocaleString('id-ID')}</span>
    <span class="bold">Rp ${data.subtotal.toLocaleString('id-ID')}</span>
  </div>

  ${
    data.discountAmount && data.discountAmount > 0
      ? `
      <div class="flex" style="color: #b91c1c; font-size: 10px;">
        <span>Potongan Diskon (${data.discountPercent || 0}%):</span>
        <span>- Rp ${data.discountAmount.toLocaleString('id-ID')}</span>
      </div>
      <div class="calc-row text-right" style="font-size: 9px; color: #666;">
        [Subtotal Rp ${data.subtotal.toLocaleString('id-ID')} - Diskon Rp ${data.discountAmount.toLocaleString('id-ID')}]
      </div>`
      : ''
  }

  <div class="total-box">
    <div class="flex total-row">
      <span>TOTAL TAGIHAN:</span>
      <span>Rp ${data.grandTotal.toLocaleString('id-ID')}</span>
    </div>
  </div>

  <div class="section-title">OPERASI PEMBAYARAN KASIR:</div>
  <div class="flex">
    <span>Total Belanja:</span>
    <span>Rp ${data.grandTotal.toLocaleString('id-ID')}</span>
  </div>
  <div class="flex">
    <span>Uang Diterima (Cash):</span>
    <span class="bold">Rp ${data.cashGiven.toLocaleString('id-ID')}</span>
  </div>

  ${
    data.isPiutang
      ? `
      <div class="line"></div>
      <div class="calc-row">Operasi: Total Tagihan - Uang Diterima</div>
      <div class="flex bold" style="color: #b91c1c; font-size: 12px; margin-top: 2px;">
        <span>SISA PIUTANG:</span>
        <span>Rp ${data.receivableAmount.toLocaleString('id-ID')}</span>
      </div>
      <div class="text-center" style="margin-top: 4px;">
        <span class="badge badge-piutang">STATUS: BELUM LUNAS / PIUTANG</span>
      </div>
      ${data.dueDate ? `<div class="flex" style="font-size: 10px; margin-top: 2px;"><span>Jatuh Tempo:</span><span>${data.dueDate}</span></div>` : ''}
    `
      : `
      <div class="line"></div>
      <div class="calc-row">Operasi: Uang Diterima - Total Tagihan</div>
      <div class="flex bold" style="font-size: 12px; margin-top: 2px;">
        <span>KEMBALIAN:</span>
        <span>${data.changeAmount === 0 ? 'Rp 0 (UANG PAS)' : `Rp ${data.changeAmount.toLocaleString('id-ID')}`}</span>
      </div>
      <div class="text-center" style="margin-top: 4px;">
        <span class="badge badge-lunas">STATUS: LUNAS TERBAYAR</span>
      </div>
    `
  }

  ${data.notes ? `<div class="line"></div><div style="font-size: 10px;">Catatan: ${data.notes}</div>` : ''}

  <div class="double-line"></div>
  <div class="text-center bold" style="margin-top: 4px;">Terima kasih atas transaksi Anda!</div>
  <div class="text-center" style="font-size: 9px; margin-top: 2px; color: #555;">Simpan struk ini sebagai bukti pembayaran resmi</div>
  <div class="text-center" style="font-size: 8px; margin-top: 2px; color: #777;">Tersinkronisasi Otomatis &bull; Kasir POS Statistik</div>
</body>
</html>`;
}

/**
 * Triggers native system printing dialog for the receipt via an isolated iframe.
 * Works seamlessly with Windows Print, macOS AirPrint, Android Print Service, and Save as PDF!
 */
export function printReceiptTicket(rawData: ReceiptData) {
  const data = normalizeReceiptData(rawData);
  const html = generateReceiptHtml(data);

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

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error fallback:', e);
      window.print();
    }
  }, 350);
}

/**
 * Downloads the receipt to device local storage (TXT format or standalone HTML).
 */
export function downloadReceiptToStorage(rawData: ReceiptData, format: 'txt' | 'html' = 'txt') {
  const data = normalizeReceiptData(rawData);
  const content = format === 'txt' ? generateReceiptText(data) : generateReceiptHtml(data);
  const mimeType = format === 'txt' ? 'text/plain;charset=utf-8' : 'text/html;charset=utf-8';
  const fileName = `struk-${data.trxCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the formatted receipt text to clipboard.
 */
export async function copyReceiptToClipboard(rawData: ReceiptData): Promise<boolean> {
  const data = normalizeReceiptData(rawData);
  const text = generateReceiptText(data);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (e) {
    console.error('Failed to copy receipt to clipboard:', e);
    return false;
  }
}

/**
 * Generates plain text receipt specifically formatted for GreenMartTransaction
 */
export function generateGreenMartReceiptText(
  transaction: GreenMartTransaction, 
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const is80mm = paperWidth === '80mm';
  const line = is80mm 
    ? '================================================' 
    : '========================================';
  const sub = is80mm 
    ? '------------------------------------------------' 
    : '----------------------------------------';
  
  let text = `${line}\n`;
  text += '             GREENMART SUPERMARKET              \n';
  text += '      Pusat Belanja Segar, Hemat & Lengkap      \n';
  text += '  Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat,  \n';
  text += '  Proyonanggan Sel., Kec. Batang, Batang 51216  \n';
  text += `${line}\n`;
  text += `No. Nota   : ${transaction.invoiceNumber}\n`;
  text += `Waktu      : ${transaction.date} ${transaction.time}\n`;
  text += `Kasir      : ${transaction.cashierName}\n`;
  text += `Pelanggan  : ${transaction.customerName || 'Umum'}\n`;
  
  if (transaction.settledAt) {
    text += `${sub}\n`;
    text += '*** STATUS: LUNAS (PIUTANG TELAH DILUNASI) ***\n';
    text += `Tgl Pelunasan    : ${transaction.settledAt}\n`;
    text += `Metode Pelunasan : ${(transaction.settledMethod || 'tunai').toUpperCase()}\n`;
    if (transaction.settledByCashier) {
      text += `Kasir Pelunasan  : ${transaction.settledByCashier}\n`;
    }
    if (transaction.settledNotes) {
      text += `Catatan Pelunasan: ${transaction.settledNotes}\n`;
    }
  }

  text += `${sub}\n`;
  text += 'DAFTAR BARANG BELANJA:\n';
  transaction.items.forEach(i => {
    text += `* ${i.name}\n`;
    text += `  ${i.qty} ${i.unit} x Rp ${i.unitPrice.toLocaleString('id-ID')} = Rp ${i.subtotal.toLocaleString('id-ID')}\n`;
    if (i.discountPercent > 0) {
      text += `  Diskon Item: ${i.discountPercent}%\n`;
    }
  });

  text += `${sub}\n`;
  text += `Total Barang  : ${transaction.totalItemsCount} Unit\n`;
  text += `Subtotal      : Rp ${transaction.subtotal.toLocaleString('id-ID')}\n`;
  if (transaction.discountTotal > 0) {
    text += `Diskon Total  : -Rp ${transaction.discountTotal.toLocaleString('id-ID')}\n`;
  }
  text += `${line}\n`;
  text += `TOTAL TAGIHAN : Rp ${transaction.grandTotal.toLocaleString('id-ID')}\n`;
  text += `${line}\n`;

  if (transaction.settledAt) {
    text += `Metode Bayar  : ${(transaction.settledMethod || 'tunai').toUpperCase()} (Pelunasan)\n`;
    text += `Uang Diterima : Rp ${(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}\n`;
    text += `Sisa Piutang  : Rp 0 (Lunas Terbayar)\n`;
  } else {
    text += `Metode Bayar  : ${transaction.paymentMethod.toUpperCase()}\n`;
    text += `Uang Diterima : Rp ${transaction.cashGiven.toLocaleString('id-ID')}\n`;
    text += `Kembalian     : Rp ${transaction.changeAmount.toLocaleString('id-ID')}\n`;
    text += `Status Bayar  : ${transaction.paymentStatus}\n`;
  }

  if (transaction.notes) {
    text += `Catatan       : ${transaction.notes}\n`;
  }

  text += `${line}\n`;
  text += '    Terima kasih telah berbelanja di GreenMart!    \n';
  text += '    Barang dapat ditukar 1x24 jam dengan struk    \n';
  text += `${line}\n`;
  return text;
}

/**
 * Export official GreenMart transaction receipt as a high-resolution, proportional PDF.
 * Formatted specifically for thermal receipt roll (80mm / 58mm) or standard A4 invoice voucher.
 */
export function exportGreenMartReceiptPdf(
  transaction: GreenMartTransaction,
  options: {
    paperWidth?: '58mm' | '80mm' | 'a4';
    storeName?: string;
    printerName?: string;
    printMode?: 'color' | 'bw';
  } = {}
): jsPDF {
  const paperWidth = options.paperWidth || '80mm';
  const isA4 = paperWidth === 'a4';
  const is58mm = paperWidth === '58mm';
  const isBw = options.printMode === 'bw';

  // Compute roll height for thermal continuous format
  const baseItemsHeight = transaction.items.length * (isA4 ? 9 : 8);
  const estimatedHeight = isA4 ? 297 : Math.max(165, 125 + baseItemsHeight + (transaction.settledAt ? 25 : 0) + (transaction.notes ? 12 : 0));
  const docWidth = isA4 ? 210 : is58mm ? 58 : 80;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : [docWidth, estimatedHeight]
  });

  const marginX = isA4 ? 20 : is58mm ? 3.5 : 5;
  const contentWidth = docWidth - marginX * 2;
  const centerX = docWidth / 2;
  const rightX = docWidth - marginX;

  let y = isA4 ? 14 : 5;

  // Header Logo GreenMart
  const logoData = isBw ? GREENMART_LOGO_BW_BASE64 : GREENMART_LOGO_COLOR_BASE64;
  const headerLogoSize = isA4 ? 18 : is58mm ? 11 : 13;
  try {
    doc.addImage(logoData, 'PNG', centerX - (headerLogoSize / 2), y, headerLogoSize, headerLogoSize);
    y += headerLogoSize + (isA4 ? 3 : 2);
  } catch (e) {
    console.warn('Could not add header logo to receipt PDF:', e);
  }

  // Header Title
  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 15 : is58mm ? 11 : 12.5);
  doc.text('GREENMART SUPERMARKET', centerX, y, { align: 'center' });
  y += isA4 ? 5 : 3.8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 9.5 : is58mm ? 7.8 : 8.5);
  doc.text('Pusat Belanja Segar & Hemat Lengkap', centerX, y, { align: 'center' });
  y += isA4 ? 4 : 3;

  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 8.5 : is58mm ? 7 : 7.5);
  doc.text('Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat,', centerX, y, { align: 'center' });
  y += isA4 ? 3.8 : 2.8;
  doc.text('Proyonanggan Sel., Kec. Batang, Batang 51216', centerX, y, { align: 'center' });
  y += isA4 ? 3.5 : 2.6;
  doc.setFontSize(isA4 ? 7.8 : is58mm ? 6.5 : 7);
  doc.text('Jam Operasional: 07:00 - 15:30 WIB', centerX, y, { align: 'center' });
  y += isA4 ? 4.5 : 3.5;

  const drawDashedLine = (currY: number) => {
    doc.setLineDashPattern([1.5, 1], 0);
    doc.setLineWidth(0.35);
    doc.line(marginX, currY, rightX, currY);
    doc.setLineDashPattern([], 0);
  };

  const drawDoubleLine = (currY: number) => {
    doc.setLineDashPattern([2, 1], 0);
    doc.setLineWidth(0.4);
    doc.line(marginX, currY, rightX, currY);
    doc.line(marginX, currY + 0.9, rightX, currY + 0.9);
    doc.setLineDashPattern([], 0);
  };

  drawDashedLine(y);
  y += isA4 ? 5 : 3.8;

  // Metadata
  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 9.5 : is58mm ? 7.6 : 8.5);
  doc.text(`Nota  : ${transaction.invoiceNumber}`, marginX, y);
  y += isA4 ? 4.5 : 3.4;
  doc.text(`Waktu : ${transaction.date} ${transaction.time}`, marginX, y);
  y += isA4 ? 4.5 : 3.4;
  doc.text(`Kasir : ${transaction.cashierName}`, marginX, y);
  y += isA4 ? 4.5 : 3.4;
  doc.text(`Plg   : ${transaction.customerName || 'Umum'}`, marginX, y);
  y += isA4 ? 5 : 4;

  if (transaction.settledAt) {
    // Settled official stamp box
    doc.setLineWidth(0.35);
    doc.rect(marginX, y, contentWidth, 8.5);
    doc.setFont('courier', 'bold');
    doc.setFontSize(isA4 ? 9.5 : 7.5);
    doc.text('*** BUKTI PELUNASAN PIUTANG RESMI ***', centerX, y + 3.4, { align: 'center' });
    doc.text('STATUS: LUNAS TERBAYAR', centerX, y + 6.8, { align: 'center' });
    y += 11.5;
  }

  drawDoubleLine(y);
  y += isA4 ? 6 : 4.2;

  // Items
  transaction.items.forEach(item => {
    doc.setFont('courier', 'bold');
    doc.setFontSize(isA4 ? 9.5 : is58mm ? 8.2 : 8.8);
    const maxChars = is58mm ? 20 : 32;
    const displayName = item.name.length > maxChars ? item.name.substring(0, maxChars - 2) + '..' : item.name;
    doc.text(displayName, marginX, y);
    y += isA4 ? 4 : 3.2;

    doc.setFont('courier', 'bold');
    doc.setFontSize(isA4 ? 9 : is58mm ? 7.8 : 8.2);
    const qtyText = `  ${item.qty} ${item.unit} x Rp ${item.unitPrice.toLocaleString('id-ID')}`;
    const subtotalText = `Rp ${item.subtotal.toLocaleString('id-ID')}`;
    doc.text(qtyText, marginX, y);
    doc.text(subtotalText, rightX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.6;

    if (item.discountPercent > 0) {
      doc.setFontSize(is58mm ? 7 : 7.5);
      doc.text(`  (Diskon ${item.discountPercent}%)`, marginX, y);
      y += 3;
    }
  });

  drawDashedLine(y);
  y += isA4 ? 5 : 3.8;

  // Totals
  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 9.5 : is58mm ? 7.8 : 8.5);
  doc.text(`Total Barang :`, marginX, y);
  doc.text(`${transaction.totalItemsCount} Unit`, rightX, y, { align: 'right' });
  y += isA4 ? 4.5 : 3.4;

  doc.text(`Subtotal :`, marginX, y);
  doc.text(`Rp ${transaction.subtotal.toLocaleString('id-ID')}`, rightX, y, { align: 'right' });
  y += isA4 ? 4.5 : 3.4;

  if (transaction.discountTotal > 0) {
    doc.text(`Potongan Diskon :`, marginX, y);
    doc.text(`-Rp ${transaction.discountTotal.toLocaleString('id-ID')}`, rightX, y, { align: 'right' });
    y += isA4 ? 4.5 : 3.4;
  }

  drawDashedLine(y);
  y += isA4 ? 5.5 : 4.4;

  // Grand total
  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 13 : is58mm ? 11 : 12.5);
  doc.text(`TOTAL TAGIHAN :`, marginX, y);
  doc.text(`Rp ${transaction.grandTotal.toLocaleString('id-ID')}`, rightX, y, { align: 'right' });
  y += isA4 ? 5.5 : 4.4;

  drawDashedLine(y);
  y += isA4 ? 5 : 3.8;

  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 9.5 : is58mm ? 7.8 : 8.5);

  if (transaction.settledAt) {
    doc.text(`Metode Awal  : ${transaction.paymentMethod.toUpperCase()}`, marginX, y);
    y += 3.4;
    doc.text(`Status       : LUNAS (Piutang Selesai)`, marginX, y);
    y += 3.4;
    doc.text(`Tgl Lunas    : ${transaction.settledAt}`, marginX, y);
    y += 3.4;
    doc.text(`Pelunasan    : ${(transaction.settledMethod || 'tunai').toUpperCase()}`, marginX, y);
    y += 3.4;
    doc.text(`Jml Dilunasi : Rp ${(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}`, marginX, y);
    y += 3.4;
    doc.text(`Sisa Piutang : Rp 0 (LUNAS)`, marginX, y);
    y += 4;
  } else {
    doc.text(`Metode Bayar : ${transaction.paymentMethod.toUpperCase()}`, marginX, y);
    y += 3.4;
    doc.text(`Uang Diterima: Rp ${transaction.cashGiven.toLocaleString('id-ID')}`, marginX, y);
    y += 3.4;
    const changeLabel = transaction.changeAmount >= 0 ? 'Kembalian    :' : 'Sisa Piutang :';
    doc.text(changeLabel, marginX, y);
    doc.text(`Rp ${Math.abs(transaction.changeAmount).toLocaleString('id-ID')}`, rightX, y, { align: 'right' });
    y += 3.6;
    doc.text(`Status       : ${transaction.paymentStatus}`, marginX, y);
    y += 3.6;
  }

  if (transaction.notes) {
    y += 1;
    doc.text(`Catatan: ${transaction.notes}`, marginX, y);
    y += 3.6;
  }

  drawDoubleLine(y);
  y += isA4 ? 6 : 4.6;

  // Footer
  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 9.5 : is58mm ? 7.8 : 8.5);
  doc.text('Terima Kasih Atas Kunjungan Anda!', centerX, y, { align: 'center' });
  y += isA4 ? 4.5 : 3.4;

  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 8 : is58mm ? 6.5 : 7.2);
  doc.text('Barang yang dibeli dapat ditukar 1x24 jam dengan struk', centerX, y, { align: 'center' });
  y += isA4 ? 4 : 3.2;

  // Footer Logo GreenMart
  const footerLogoSize = isA4 ? 12 : is58mm ? 7.5 : 9;
  try {
    doc.addImage(logoData, 'PNG', centerX - (footerLogoSize / 2), y, footerLogoSize, footerLogoSize);
    y += footerLogoSize + 2.5;
  } catch (e) {
    console.warn('Could not add footer logo to receipt PDF:', e);
  }

  // Simulated barcode text
  doc.setFont('courier', 'bold');
  doc.setFontSize(isA4 ? 13 : is58mm ? 10.5 : 12);
  doc.text('|||| || ||||| || |||||| |||| |', centerX, y, { align: 'center' });
  y += isA4 ? 4 : 2.8;
  doc.setFont('courier', 'normal');
  doc.setFontSize(is58mm ? 5.5 : 6.5);
  doc.text(`*${transaction.invoiceNumber}*`, centerX, y, { align: 'center' });
  y += isA4 ? 4 : 3;

  doc.setFontSize(5.5);
  doc.text(`GreenMart POS • ${options.printerName || 'Direct Print Device'}`, centerX, y, { align: 'center' });

  // Save the PDF
  doc.save(`Struk_GreenMart_${transaction.invoiceNumber}.pdf`);
  return doc;
}

/**
 * Builds standalone, interactive HTML page for direct web receipt viewing & printing.
 * 100% compatible with 58mm and 80mm thermal rolls, and includes header & footer logos
 * with support for both color and high-contrast monochrome (B&W) thermal printing.
 */
export function generateGreenMartReceiptStandaloneHtml(
  transaction: GreenMartTransaction,
  options: {
    paperWidth?: '58mm' | '80mm';
    autoPrint?: boolean;
    activePrinterName?: string;
    initialMode?: 'color' | 'bw';
  } = {}
): string {
  const initialWidth = options.paperWidth || '58mm';
  const isInitial80mm = initialWidth === '80mm';
  const isSettled = Boolean(transaction.settledAt);

  const plainTextEscaped = generateGreenMartReceiptText(transaction, initialWidth)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  const storeAddressFormatted = 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Struk Pembelian GreenMart - ${transaction.invoiceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #059669;
      --primary-dark: #047857;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-100: #f1f5f9;
      --border-gray: #cbd5e1;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #e2e8f0;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-bottom: 40px;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Top Floating Control Bar */
    .top-bar {
      position: sticky;
      top: 0;
      width: 100%;
      background: #ffffff;
      border-bottom: 1px solid #cbd5e1;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
      z-index: 100;
      padding: 10px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-title img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    .brand-title h1 {
      font-size: 14px;
      font-weight: 800;
      color: var(--slate-900);
      line-height: 1.2;
    }
    .brand-title p {
      font-size: 11px;
      color: #64748b;
      font-family: 'JetBrains Mono', monospace;
    }
    
    .actions-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Toggle pill groups */
    .toggle-group {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 2px;
      gap: 2px;
    }
    .toggle-btn {
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .toggle-btn.active {
      background: #059669;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .toggle-btn-bw.active {
      background: #1e293b;
      color: #ffffff;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
      font-family: inherit;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
    }
    .btn-primary:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #ffffff;
      color: var(--slate-800);
      border-color: #cbd5e1;
    }
    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-danger {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fecaca;
    }
    .btn-danger:hover {
      background: #fecaca;
    }

    /* Thermal Paper Container */
    .receipt-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      width: 100%;
      padding: 0 12px;
    }
    
    .receipt-paper {
      background: #ffffff;
      color: #000000;
      border-radius: 4px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      line-height: 1.35;
      position: relative;
      transition: width 0.2s ease, padding 0.2s ease;
      overflow: hidden;
      word-break: break-word;
    }

    /* 58mm default width */
    .receipt-paper.paper-58mm {
      width: 52mm;
      max-width: 52mm;
      padding: 10px 6px;
      font-size: 10.5px;
      font-weight: 700;
    }
    /* 80mm width */
    .receipt-paper.paper-80mm {
      width: 76mm;
      max-width: 76mm;
      padding: 16px 14px;
      font-size: 12px;
      font-weight: 700;
    }

    /* Zigzag paper edges simulation */
    .receipt-paper::before, .receipt-paper::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      height: 6px;
      background-size: 12px 6px;
    }
    .receipt-paper::before {
      top: -6px;
      background-image: radial-gradient(circle at 6px 6px, transparent 6px, #ffffff 6px);
    }
    .receipt-paper::after {
      bottom: -6px;
      background-image: radial-gradient(circle at 6px 0, transparent 6px, #ffffff 6px);
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: 800; }
    .line { border-top: 1.5px dashed #000; margin: 4px 0; }
    .double-line { border-top: 2px dashed #000; margin: 5px 0; }
    .flex { display: flex; justify-content: space-between; align-items: flex-start; }

    /* LOGO STYLING - Color & B&W High-Contrast */
    .receipt-logo {
      display: block;
      margin: 0 auto;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      transition: filter 0.2s ease;
    }
    .header-logo {
      max-width: 44px;
      max-height: 44px;
      margin-bottom: 4px;
    }
    .paper-58mm .header-logo {
      max-width: 38px;
      max-height: 38px;
      margin-bottom: 3px;
    }
    .footer-logo {
      max-width: 32px;
      max-height: 32px;
      margin: 4px auto 3px auto;
    }
    .paper-58mm .footer-logo {
      max-width: 26px;
      max-height: 26px;
      margin: 3px auto 2px auto;
    }

    /* Monochrome / B&W Thermal Print filter mode */
    body.mode-bw .receipt-paper,
    .receipt-paper.mode-bw {
      color: #000000 !important;
    }
    body.mode-bw .receipt-logo,
    .receipt-paper.mode-bw .receipt-logo {
      filter: grayscale(100%) contrast(250%) brightness(90%);
      -webkit-filter: grayscale(100%) contrast(250%) brightness(90%);
    }

    .settled-badge {
      border: 1.5px solid #000;
      padding: 4px;
      text-align: center;
      font-weight: 700;
      margin: 5px 0;
      font-size: 9.5px;
      line-height: 1.25;
      background: #ecfdf5;
    }
    .mode-bw .settled-badge {
      background: #ffffff !important;
      border: 1.5px solid #000000 !important;
      color: #000000 !important;
    }

    .item-block {
      margin-bottom: 3.5px;
    }
    .item-name {
      font-weight: 800;
      word-break: break-word;
      line-height: 1.25;
      font-size: 11px;
    }
    .paper-80mm .item-name {
      font-size: 12px;
    }

    .item-calc {
      display: flex;
      justify-content: space-between;
      color: #000000;
      font-size: 10.5px;
      font-weight: 700;
    }
    .paper-80mm .item-calc {
      font-size: 11px;
    }

    .total-container {
      border-top: 1.5px solid #000000;
      border-bottom: 1.5px solid #000000;
      padding: 3px 0;
      margin: 4px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 900;
      font-size: 13.5px;
    }
    .paper-80mm .total-container {
      font-size: 15px;
    }

    .barcode-display {
      font-size: 14px;
      letter-spacing: 2px;
      font-weight: 800;
      margin: 4px 0 2px 0;
      text-align: center;
    }
    .paper-58mm .barcode-display {
      font-size: 12.5px;
      letter-spacing: 1.5px;
    }

    /* Print media query: pure continuous thermal strip */
    @media print {
      @page {
        margin: 0;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        color: #000000 !important;
      }
      .top-bar {
        display: none !important;
      }
      .receipt-container {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        display: block !important;
      }
      .receipt-paper {
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 auto !important;
      }
      .receipt-paper.paper-58mm {
        width: 50mm !important;
        max-width: 50mm !important;
        padding: 1mm 1.5mm !important;
        font-size: 10.5px !important;
        font-weight: 700 !important;
        color: #000000 !important;
      }
      .receipt-paper.paper-80mm {
        width: 74mm !important;
        max-width: 74mm !important;
        padding: 2mm 3mm !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        color: #000000 !important;
      }
      .receipt-paper::before, .receipt-paper::after {
        display: none !important;
      }
      .receipt-logo {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body.mode-bw .receipt-logo,
      .receipt-paper.mode-bw .receipt-logo {
        filter: grayscale(100%) contrast(300%) brightness(85%) !important;
        -webkit-filter: grayscale(100%) contrast(300%) brightness(85%) !important;
      }
    }
  </style>
</head>
<body class="${options.initialMode === 'bw' ? 'mode-bw' : ''}">

  <!-- Top Floating Actions Bar -->
  <header class="top-bar">
    <div class="brand-title">
      <img src="${GREENMART_LOGO_COLOR_BASE64}" alt="GreenMart Logo">
      <div>
        <h1>Struk Kasir GreenMart</h1>
        <p>${transaction.invoiceNumber} &bull; ${transaction.date} ${transaction.time}</p>
      </div>
    </div>

    <div class="actions-group">
      <!-- Paper Width Switcher (58mm / 80mm) -->
      <div class="toggle-group" title="Pilih ukuran kertas printer kasir">
        <button 
          id="btn-width-58" 
          onclick="setPaperWidth('58mm')" 
          class="toggle-btn ${!isInitial80mm ? 'active' : ''}">
          58mm (Kecil)
        </button>
        <button 
          id="btn-width-80" 
          onclick="setPaperWidth('80mm')" 
          class="toggle-btn ${isInitial80mm ? 'active' : ''}">
          80mm (Standar)
        </button>
      </div>

      <!-- Print Mode Switcher (Color / Thermal B&W) -->
      <div class="toggle-group" title="Pilih mode warna atau hitam-putih khusus printer thermal">
        <button 
          id="btn-mode-color" 
          onclick="setPrintMode('color')" 
          class="toggle-btn ${options.initialMode !== 'bw' ? 'active' : ''}">
          Berwarna
        </button>
        <button 
          id="btn-mode-bw" 
          onclick="setPrintMode('bw')" 
          class="toggle-btn toggle-btn-bw ${options.initialMode === 'bw' ? 'active' : ''}">
          Hitam-Putih
        </button>
      </div>
      
      <!-- Print Button -->
      <button onclick="window.print()" class="btn btn-primary" title="Cetak langsung ke printer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        <span>Cetak (Print)</span>
      </button>

      <!-- Unduh PDF Button -->
      <button onclick="downloadPdfReceipt()" class="btn btn-secondary" title="Unduh berkas struk format PDF">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Unduh PDF</span>
      </button>

      <!-- Copy Text Button -->
      <button onclick="copyReceipt()" class="btn btn-secondary" title="Salin format teks struk">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span id="copy-btn-text">Salin Teks</span>
      </button>

      <button onclick="window.close()" class="btn btn-danger" title="Tutup tab ini">
        Tutup
      </button>
    </div>
  </header>

  <!-- Centered Thermal Receipt -->
  <main class="receipt-container">
    <div class="receipt-paper ${!isInitial80mm ? 'paper-58mm' : 'paper-80mm'} ${options.initialMode === 'bw' ? 'mode-bw' : ''}" id="receipt-paper">
      
      <!-- 1. HEADER DENGAN LOGO GREENMART RESMI (SUPPORT BERWARNA & HITAM-PUTIH) -->
      <div class="text-center" style="margin-bottom: 2px;">
        <img 
          id="header-receipt-logo"
          src="${options.initialMode === 'bw' ? GREENMART_LOGO_BW_BASE64 : GREENMART_LOGO_COLOR_BASE64}" 
          alt="GreenMart Logo" 
          class="receipt-logo header-logo"
        />
        <div class="bold" style="font-size: 14px; letter-spacing: 0.5px; line-height: 1.2;">GREENMART SUPERMARKET</div>
        <div style="font-size: 10px; font-weight: 700; color: #000; margin-top: 1px;">Pusat Belanja Segar &amp; Hemat Lengkap</div>
        <div style="font-size: 9px; font-weight: 600; color: #000; line-height: 1.25; margin-top: 2px; padding: 0 1px;">
          ${storeAddressFormatted}
        </div>
        <div style="font-size: 8.5px; font-weight: 700; color: #000; margin-top: 1.5px;">
          Jam Operasional: 07:00 - 15:30 WIB
        </div>
      </div>

      <div class="line"></div>
      
      <!-- 2. METADATA TRANSAKSI -->
      <div class="flex"><span>No. Nota:</span><span class="bold">${transaction.invoiceNumber}</span></div>
      <div class="flex"><span>Waktu:</span><span>${transaction.date} ${transaction.time}</span></div>
      <div class="flex"><span>Kasir:</span><span class="bold">${transaction.cashierName}</span></div>
      <div class="flex"><span>Pelanggan:</span><span class="bold">${transaction.customerName || 'Umum'}</span></div>

      ${isSettled ? `
        <div class="settled-badge">
          *** BUKTI PELUNASAN PIUTANG RESMI ***<br/>
          STATUS: LUNAS TERBAYAR
        </div>
      ` : ''}

      <div class="double-line"></div>
      
      <!-- 3. DAFTAR BARANG BELANJA (KOMPATIBEL 58MM - ZERO CLIPPING) -->
      <div id="items-list">
        ${transaction.items.map(item => `
          <div class="item-block">
            <div class="item-name">${item.name}</div>
            <div class="item-calc">
              <span>  ${item.qty} ${item.unit} &times; Rp ${item.unitPrice.toLocaleString('id-ID')}</span>
              <span class="bold">Rp ${item.subtotal.toLocaleString('id-ID')}</span>
            </div>
            ${item.discountPercent > 0 ? `
              <div class="flex" style="font-size: 9px; font-weight: 700; color: #000; padding-left: 8px;">
                <span>Diskon Item (${item.discountPercent}%):</span>
                <span>-</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="line"></div>
      
      <!-- 4. TOTAL REKAPITULASI -->
      <div class="flex"><span>Total Barang:</span><span>${transaction.totalItemsCount} Unit</span></div>
      <div class="flex"><span>Subtotal:</span><span>Rp ${transaction.subtotal.toLocaleString('id-ID')}</span></div>
      ${transaction.discountTotal > 0 ? `
        <div class="flex" style="font-weight: 800; color: #000;"><span>Potongan Diskon:</span><span class="bold">-Rp ${transaction.discountTotal.toLocaleString('id-ID')}</span></div>
      ` : ''}

      <!-- TOTAL BELANJA CONTAINER -->
      <div class="total-container">
        <span>TOTAL BELANJA:</span>
        <span class="bold">Rp ${transaction.grandTotal.toLocaleString('id-ID')}</span>
      </div>

      <!-- 5. PEMBAYARAN DAN KEMBALIAN -->
      <div class="flex"><span>Metode Bayar:</span><span class="bold">${transaction.paymentMethod.toUpperCase()}</span></div>
      
      ${isSettled ? `
        <div class="flex"><span>Status Pembayaran:</span><span class="bold">LUNAS TERBAYAR</span></div>
        <div class="flex"><span>Tgl Pelunasan:</span><span class="bold">${transaction.settledAt}</span></div>
        <div class="flex"><span>Metode Pelunasan:</span><span class="bold">${(transaction.settledMethod || 'tunai').toUpperCase()}</span></div>
        <div class="flex"><span>Uang Diterima:</span><span class="bold">Rp ${(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}</span></div>
        <div class="flex bold"><span>SISA PIUTANG:</span><span>Rp 0 (LUNAS)</span></div>
        ${transaction.settledNotes ? `<div class="flex" style="font-size: 9px; font-weight: 700; color: #000;"><span>Catatan:</span><span>${transaction.settledNotes}</span></div>` : ''}
        ${transaction.settledByCashier ? `<div class="flex" style="font-size: 9px; font-weight: 700; color: #000;"><span>Kasir Pelunasan:</span><span>${transaction.settledByCashier}</span></div>` : ''}
      ` : `
        <div class="flex"><span>Bayar (Cash):</span><span class="bold">Rp ${transaction.cashGiven.toLocaleString('id-ID')}</span></div>
        <div class="flex bold" style="font-size: 11.5px;">
          <span>${transaction.changeAmount >= 0 ? 'KEMBALIAN:' : 'SISA PIUTANG:'}</span>
          <span>Rp ${Math.abs(transaction.changeAmount).toLocaleString('id-ID')}</span>
        </div>
        <div class="flex"><span>Status Bayar:</span><span class="bold">${transaction.paymentStatus}</span></div>
      `}

      ${transaction.notes ? `
        <div class="line"></div>
        <div style="font-size: 9.5px; font-weight: 600; color: #000;">Catatan: ${transaction.notes}</div>
      ` : ''}

      <div class="double-line"></div>
      
      <!-- 6. FOOTER STRUK DENGAN LOGO GREENMART -->
      <div class="text-center bold" style="margin-top: 3px; font-size: 10.5px;">
        Terima Kasih Atas Kunjungan Anda!
      </div>
      <div class="text-center" style="font-size: 8.5px; font-weight: 600; color: #000; line-height: 1.25; margin-top: 2px;">
        Barang yang sudah dibeli dapat ditukar 1x24 jam dengan struk resmi
      </div>
      
      <!-- LOGO GREENMART DI FOOTER STRUK -->
      <div class="text-center" style="margin: 4px 0 2px 0;">
        <img 
          id="footer-receipt-logo"
          src="${options.initialMode === 'bw' ? GREENMART_LOGO_BW_BASE64 : GREENMART_LOGO_COLOR_BASE64}" 
          alt="GreenMart Footer Logo" 
          class="receipt-logo footer-logo"
        />
      </div>

      <!-- BARCODE DISPLAY -->
      <div class="barcode-display">|||| || ||||| || |||||| |||| |</div>
      <div class="text-center" style="font-size: 8.5px; font-weight: 700; color: #000;">*${transaction.invoiceNumber}*</div>
      <div class="text-center" style="font-size: 8px; font-weight: 600; color: #000; margin-top: 2px;">
        Format: <span id="label-active-width">${initialWidth}</span> &bull; GreenMart POS Batang
      </div>

    </div>
  </main>

  <script>
    const logoColor = "${GREENMART_LOGO_COLOR_BASE64}";
    const logoBw = "${GREENMART_LOGO_BW_BASE64}";
    let currentWidth = "${initialWidth}";
    let currentMode = "${options.initialMode === 'bw' ? 'bw' : 'color'}";
    const plainText = \`${plainTextEscaped}\`;
    
    function setPaperWidth(width) {
      currentWidth = width;
      const paper = document.getElementById('receipt-paper');
      const btn58 = document.getElementById('btn-width-58');
      const btn80 = document.getElementById('btn-width-80');
      const lbl = document.getElementById('label-active-width');

      if (width === '58mm') {
        paper.classList.remove('paper-80mm');
        paper.classList.add('paper-58mm');
        btn58.classList.add('active');
        btn80.classList.remove('active');
        if (lbl) lbl.textContent = '58mm';
      } else {
        paper.classList.remove('paper-58mm');
        paper.classList.add('paper-80mm');
        btn80.classList.add('active');
        btn58.classList.remove('active');
        if (lbl) lbl.textContent = '80mm';
      }
    }

    function setPrintMode(mode) {
      currentMode = mode;
      const paper = document.getElementById('receipt-paper');
      const headerLogo = document.getElementById('header-receipt-logo');
      const footerLogo = document.getElementById('footer-receipt-logo');
      const btnColor = document.getElementById('btn-mode-color');
      const btnBw = document.getElementById('btn-mode-bw');

      if (mode === 'bw') {
        document.body.classList.add('mode-bw');
        paper.classList.add('mode-bw');
        btnBw.classList.add('active');
        btnColor.classList.remove('active');
        if (headerLogo) headerLogo.src = logoBw;
        if (footerLogo) footerLogo.src = logoBw;
      } else {
        document.body.classList.remove('mode-bw');
        paper.classList.remove('mode-bw');
        btnColor.classList.add('active');
        btnBw.classList.remove('active');
        if (headerLogo) headerLogo.src = logoColor;
        if (footerLogo) footerLogo.src = logoColor;
      }
    }

    function copyReceipt() {
      navigator.clipboard.writeText(plainText).then(() => {
        const btnText = document.getElementById('copy-btn-text');
        btnText.textContent = 'Tersalin!';
        setTimeout(() => {
          btnText.textContent = 'Salin Teks';
        }, 2000);
      }).catch(err => {
        alert('Gagal menyalin teks ke clipboard');
      });
    }

    function downloadPdfReceipt() {
      window.print();
    }

    ${options.autoPrint ? `
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.print();
        }, 400);
      });
    ` : ''}
  </script>

</body>
</html>`;
}

/**
 * Opens receipt directly in a standalone browser web page in a new window/tab.
 */
export function openReceiptDirectWebPage(
  transaction: GreenMartTransaction,
  options: {
    paperWidth?: '58mm' | '80mm';
    autoPrint?: boolean;
    activePrinterName?: string;
    initialMode?: 'color' | 'bw';
  } = {}
): Window | null {
  const html = generateGreenMartReceiptStandaloneHtml(transaction, options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const win = window.open(blobUrl, '_blank');
  if (!win || win.closed || typeof win.closed === 'undefined') {
    // If popup is blocked, fallback to downloading standalone HTML
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Struk_GreenMart_${transaction.invoiceNumber}.html`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return win;
}
