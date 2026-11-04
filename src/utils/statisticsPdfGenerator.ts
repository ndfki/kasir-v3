import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  DailyStatisticalReport, 
  GreenMartProduct, 
  GreenMartTransaction,
  StockComparisonItem,
  StockAuditReportSummary
} from '../types';
import { GREENMART_LOGO_COLOR_BASE64 } from './greenmartLogoBase64';

export interface PdfExportOptions {
  dateFilterLabel?: string;
  storeName?: string;
  storeAddress?: string;
  cashierName?: string;
  managerName?: string;
  storeCity?: string;
  customNotes?: string;
}

/**
 * Format currency to Rupiah string
 */
function formatRupiah(value: number): string {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

/**
 * Generate official statistical & financial PDF report
 */
export function generateStatisticsPdf(
  report: DailyStatisticalReport,
  relevantTransactions: GreenMartTransaction[],
  products: GreenMartProduct[],
  options: PdfExportOptions = {}
): jsPDF {
  const {
    dateFilterLabel = 'Periode Aktif',
    storeName = 'GREENMART SUPERMARKET & POS',
    storeAddress = 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
    cashierName = 'Kasir Penanggung Jawab',
    managerName = 'Manajer Operasional',
    storeCity = 'Batang',
    customNotes = 'Laporan resmi ini disajikan otomatis berdasarkan rekaman data transaksi kasir dan mutasi stok di pusat data terpadu GreenMart.'
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  const today = new Date();
  const printTimestamp = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ` pukul ${today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  const docId = `GM-STAT-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // -------------------------------------------------------------
  // HEADER KOP SURAT RESMI
  // -------------------------------------------------------------
  // Emerald Top Stripe
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Accent Line
  doc.setFillColor(5, 150, 105); // emerald-700
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Logo GreenMart
  try {
    doc.addImage(GREENMART_LOGO_COLOR_BASE64, 'PNG', marginX, 8, 17, 17);
  } catch (e) {
    console.warn('Could not add logo to PDF header:', e);
  }

  const headerTextX = marginX + 21;

  // Store Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(storeName, headerTextX, 13);

  // Alamat Resmi Toko Batang (Line 1)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216', headerTextX, 17.5);

  // Kontak & Koperasi (Line 2)
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Telp: (0285) 391-234   |   Email: batang@greenmart.id   |   Jam Operasional: 07:00 - 15:30 WIB', headerTextX, 21.5);

  // Document Badge (Line 3 - Clean official text without technical jargon)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('SISTEM KASIR POS & REKAPITULASI STATISTIK HARIAN RESMI', headerTextX, 26);

  // Divider Line
  const dividerY = 29.5;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.6);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // -------------------------------------------------------------
  // JUDUL LAPORAN & METADATA RESMI
  // -------------------------------------------------------------
  const titleY = dividerY + 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN KEUANGAN & STATISTIK PENJUALAN RESMI', marginX, titleY);

  // Metadata Card / Box
  const metaBoxY = titleY + 3.5;
  const metaBoxHeight = 16.5;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, metaBoxY, contentWidth, metaBoxHeight, 2, 2, 'FD');

  const metaLabelY = metaBoxY + 5;
  const metaValY = metaBoxY + 11.5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('NO. DOKUMEN', marginX + 4, metaLabelY);
  doc.text('PERIODE DATA', marginX + 46, metaLabelY);
  doc.text('WAKTU CETAK', marginX + 88, metaLabelY);
  doc.text('STATUS AUDIT', marginX + 154, metaLabelY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(docId, marginX + 4, metaValY);
  doc.text(dateFilterLabel, marginX + 46, metaValY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(printTimestamp, marginX + 88, metaValY);

  doc.setTextColor(16, 185, 129); // emerald-600
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TERVERIFIKASI', marginX + 154, metaValY);

  // -------------------------------------------------------------
  // BAGIAN 1: RINGKASAN METRIK KEUANGAN & INDIKATOR STATISTIK (KPIs)
  // -------------------------------------------------------------
  let currentY = metaBoxY + metaBoxHeight + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Ringkasan Eksekutif Keuangan & Parameter Statistik', marginX, currentY);

  const kpiData = [
    [
      'Total Omset (Pendapatan Kotor)',
      formatRupiah(report.totalRevenue),
      'Total Modal Pokok (HPP)',
      formatRupiah(report.totalCost)
    ],
    [
      'Total Laba Bersih Operasional',
      formatRupiah(report.totalProfit),
      'Margin Keuntungan Bersih',
      `${report.profitMarginPercent}%`
    ],
    [
      'Total Transaksi / Nota',
      `${report.totalTransactions} Nota`,
      'Total Kuantitas Barang Terjual',
      `${report.totalUnitsSold.toLocaleString('id-ID')} Unit`
    ],
    [
      'Mean (Rata-rata Omset / AOV)',
      formatRupiah(report.meanRevenuePerTransaction),
      'Median Belanja Pembeli',
      formatRupiah(report.medianRevenuePerTransaction)
    ],
    [
      'Nilai Belanja Tertinggi (Max)',
      formatRupiah(report.maxTransaction),
      'Nilai Belanja Terendah (Min)',
      formatRupiah(report.minTransaction)
    ]
  ];

  autoTable(doc, {
    startY: currentY + 2.5,
    head: [['Parameter Finansial', 'Nilai Tercatat', 'Parameter Statistik', 'Nilai Tercatat']],
    body: kpiData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [16, 185, 129], // emerald-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
      1: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 41 },
      2: { fontStyle: 'bold', textColor: [51, 65, 85], cellWidth: 50 },
      3: { fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 41 }
    },
    margin: { left: marginX, right: marginX }
  });

  // -------------------------------------------------------------
  // BAGIAN 2: ANALISIS MODUS PRODUK TERLARIS (TOP 5)
  // -------------------------------------------------------------
  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Klasemen Modus Produk Terlaris (Frekuensi & Kuantitas Pembelian)', marginX, currentY);

  // Modus Highlight Banner
  if (report.topProductModus) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36); // amber-400
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, currentY + 3, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text(`MODUS UTAMA: "${report.topProductModus.productName}"`, marginX + 4, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(
      `Barcode: ${report.topProductModus.barcode} | Kategori: ${report.topProductModus.category} | Terjual: ${report.topProductModus.totalQtySold} unit (${report.topProductModus.transactionCount}x nota) | Porsi: ${report.topProductModus.percentageOfAllSales}% dari total volume | Omset: ${formatRupiah(report.topProductModus.totalRevenue)}`,
      marginX + 4,
      currentY + 12
    );

    currentY += 14;
  }

  const topProductsRows = (report.topProductsList || []).map((p, idx) => [
    `#${idx + 1}`,
    p.barcode,
    p.productName,
    p.category,
    `${p.transactionCount}x`,
    `${p.totalQtySold} unit`,
    `${p.percentageOfAllSales}%`,
    formatRupiah(p.totalRevenue)
  ]);

  if (topProductsRows.length === 0) {
    topProductsRows.push(['-', '-', 'Belum ada data barang terjual pada periode ini', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY + 2.5,
    head: [['Rank', 'Barcode', 'Nama Produk', 'Kategori', 'Frekuensi', 'Qty Terjual', 'Porsi', 'Total Omset']],
    body: topProductsRows,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [245, 158, 11], // amber-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [254, 252, 232]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 26, fontStyle: 'normal' },
      2: { cellWidth: 46, fontStyle: 'bold' },
      3: { cellWidth: 30 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 18, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: marginX, right: marginX }
  });

  // -------------------------------------------------------------
  // BAGIAN 3: DISTRIBUSI KATEGORI & METODE PEMBAYARAN
  // -------------------------------------------------------------
  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 7;

  // Check if we need to add a page or continue
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Rincian Distribusi Kategori & Metode Pembayaran', marginX, currentY);

  // Compute category breakdown
  const categoryMap = new Map<string, { qty: number; revenue: number }>();
  relevantTransactions.forEach(t => {
    t.items.forEach(i => {
      const existing = categoryMap.get(i.category) || { qty: 0, revenue: 0 };
      existing.qty += i.qty;
      existing.revenue += i.subtotal;
      categoryMap.set(i.category, existing);
    });
  });

  const categoryRows = Array.from(categoryMap.entries()).map(([cat, data], idx) => {
    const pct = report.totalRevenue > 0 ? ((data.revenue / report.totalRevenue) * 100).toFixed(1) : '0';
    return [
      String(idx + 1),
      cat,
      `${data.qty.toLocaleString('id-ID')} unit`,
      formatRupiah(data.revenue),
      `${pct}%`
    ];
  });

  if (categoryRows.length === 0) {
    categoryRows.push(['-', 'Belum ada data kategori', '0', 'Rp 0', '0%']);
  }

  // Compute payment method breakdown
  const paymentMap = new Map<string, { count: number; total: number }>();
  relevantTransactions.forEach(t => {
    const key = (t.paymentMethod || 'tunai').toUpperCase();
    const existing = paymentMap.get(key) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += t.grandTotal;
    paymentMap.set(key, existing);
  });

  const paymentRows = Array.from(paymentMap.entries()).map(([method, data]) => {
    const pct = report.totalRevenue > 0 ? ((data.total / report.totalRevenue) * 100).toFixed(1) : '0';
    return [
      method,
      `${data.count}x Nota`,
      formatRupiah(data.total),
      `${pct}%`
    ];
  });

  if (paymentRows.length === 0) {
    paymentRows.push(['TUNAI', '0 Nota', 'Rp 0', '0%']);
  }

  // Draw two side-by-side or stacked clean tables
  // Category Table
  autoTable(doc, {
    startY: currentY + 2.5,
    head: [['No', 'Kategori Barang', 'Volume Terjual', 'Total Omset', 'Kontribusi']],
    body: categoryRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 30, halign: 'center' }
    },
    margin: { left: marginX, right: marginX }
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 5;

  // Payment Table
  autoTable(doc, {
    startY: currentY,
    head: [['Metode Pembayaran', 'Jumlah Transaksi', 'Total Nilai Nominal', 'Porsi Omset']],
    body: paymentRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [139, 92, 246], // purple-500
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 40, halign: 'center' }
    },
    margin: { left: marginX, right: marginX }
  });

  // -------------------------------------------------------------
  // BAGIAN 4: INVENTORY STATUS HIGHLIGHT
  // -------------------------------------------------------------
  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 6;

  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  }

  const totalCatalogSku = products.length;
  const criticalStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalStockInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);

  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `SNAPSHOT INVENTARIS: Total ${totalCatalogSku} SKU Produk Aktif | Nilai Aset Gudang (HPP): ${formatRupiah(totalStockInventoryValue)} | Status Stok Menipis: ${criticalStockCount} SKU`,
    marginX + 4,
    currentY + 5
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(customNotes, marginX + 4, currentY + 9.5);

  currentY += 18;

  // -------------------------------------------------------------
  // BAGIAN 5: LEMBAR PENGESAHAN & TANDA TANGAN RESMI
  // -------------------------------------------------------------
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  const signY = currentY + 2;
  const dateFormatted = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Kiri: Dibuat Oleh (Kasir)
  doc.text(`${storeCity}, ${dateFormatted}`, marginX + 10, signY);
  doc.text('Petugas Pelapor / Kasir:', marginX + 10, signY + 4);

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${cashierName} )`, marginX + 10, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('ID Kasir: KSR-GM-01', marginX + 10, signY + 26);

  // Kanan: Disetujui Oleh (Store Manager)
  const rightSignX = pageWidth - marginX - 60;
  doc.setFontSize(8);
  doc.text('Mengetahui & Menyetujui:', rightSignX, signY + 4);

  doc.setFont('helvetica', 'bold');
  doc.text(`( ${managerName} )`, rightSignX, signY + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Store General Manager', rightSignX, signY + 26);

  // -------------------------------------------------------------
  // FOOTER RESMI DI SETIAP HALAMAN
  // -------------------------------------------------------------
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `GreenMart POS Statistical Suite &bull; Dokumen #${docId} &bull; Dicetak: ${printTimestamp}`,
      marginX,
      pageHeight - 6.5
    );
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - marginX - 20,
      pageHeight - 6.5
    );
  }

  return doc;
}

/**
 * Direct download helper for statistical PDF report
 */
export function exportStatisticsReportPdf(
  report: DailyStatisticalReport,
  relevantTransactions: GreenMartTransaction[],
  products: GreenMartProduct[],
  options: PdfExportOptions = {}
): void {
  const doc = generateStatisticsPdf(report, relevantTransactions, products, options);
  const cleanDate = (report.selectedDate || 'semua').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Laporan_Statistik_GreenMart_${cleanDate}.pdf`;
  doc.save(filename);
}

/**
 * Print directly via browser helper
 */
export function printStatisticsReportPdf(
  report: DailyStatisticalReport,
  relevantTransactions: GreenMartTransaction[],
  products: GreenMartProduct[],
  options: PdfExportOptions = {}
): void {
  const doc = generateStatisticsPdf(report, relevantTransactions, products, options);
  const blobUrl = doc.output('bloburl');
  
  const printWindow = window.open(blobUrl);
  if (printWindow) {
    printWindow.focus();
  } else {
    // If popup blocked, fallback to iframe print or direct save
    doc.save(`Laporan_Statistik_GreenMart_${report.selectedDate || 'all'}.pdf`);
  }
}

export interface TransactionHistoryPdfOptions {
  dateFilterLabel?: string;
  statusFilter?: string;
  cashierFilter?: string;
  storeName?: string;
  storeAddress?: string;
  storeCity?: string;
  cashierName?: string;
  managerName?: string;
  customNotes?: string;
}

/**
 * Generate official PDF report for Transaction History (Riwayat Transaksi)
 */
export function generateTransactionHistoryPdf(
  transactions: GreenMartTransaction[],
  options: TransactionHistoryPdfOptions = {}
): jsPDF {
  const {
    dateFilterLabel = 'Semua Periode',
    statusFilter = 'Semua Status',
    cashierFilter = 'Semua Kasir',
    storeName = 'GREENMART SUPERMARKET & POS',
    storeAddress = 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
    storeCity = 'Batang',
    cashierName = 'Kasir Penanggung Jawab',
    managerName = 'Manajer Operasional',
    customNotes = 'Laporan resmi ini disajikan otomatis berdasarkan rekaman riwayat transaksi kasir POS GreenMart Batang.'
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginX = 14;

  const today = new Date();
  const printTimestamp = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ` pukul ${today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  const docId = `GM-TRX-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // -------------------------------------------------------------
  // KOP SURAT RESMI
  // -------------------------------------------------------------
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFillColor(5, 150, 105); // emerald-700
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Logo GreenMart
  try {
    doc.addImage(GREENMART_LOGO_COLOR_BASE64, 'PNG', marginX, 8.5, 16, 16);
  } catch (e) {
    console.warn('Could not add logo to history PDF:', e);
  }

  const histHeaderX = marginX + 21;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(storeName, histHeaderX, 13);

  // Alamat Resmi Toko Batang (Line 1)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216', histHeaderX, 17.5);

  // Kontak & Koperasi (Line 2)
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Telp: (0285) 391-234   |   Email: batang@greenmart.id   |   Unit Koperasi Siswa Batang', histHeaderX, 21.5);

  // Document Badge (Line 3)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('SISTEM KASIR POS & REKAP TRANSAKSI HARIAN RESMI', histHeaderX, 26);

  const histDividerY = 29.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(marginX, histDividerY, pageWidth - marginX, histDividerY);

  // -------------------------------------------------------------
  // JUDUL & INFO FILTER
  // -------------------------------------------------------------
  const histTitleY = histDividerY + 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN RESMI RIWAYAT TRANSAKSI PENJUALAN KASIR', marginX, histTitleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode: ${dateFilterLabel} | Filter Status: ${statusFilter} | Kasir: ${cashierFilter} | Waktu Cetak: ${printTimestamp}`, marginX, histTitleY + 5);

  // -------------------------------------------------------------
  // STATISTIK RINGKASAN TRANSAKSI (METRIC BOXES)
  // -------------------------------------------------------------
  const totalRevenue = transactions.reduce((sum, t) => sum + t.grandTotal, 0);
  const totalItems = transactions.reduce((sum, t) => sum + t.totalItemsCount, 0);
  const lunasCount = transactions.filter(t => t.paymentStatus === 'Lunas').length;
  const piutangCount = transactions.filter(t => t.paymentStatus === 'Piutang').length;
  const avgPerNota = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;

  const cardY = 44;
  const cardWidth = (pageWidth - marginX * 2 - 12) / 4;
  const cardHeight = 16;

  // Box 1: Total Nota
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL NOTA TRANSAKSI', marginX + 4, cardY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${transactions.length} Nota (${lunasCount} Lunas, ${piutangCount} Piutang)`, marginX + 4, cardY + 12);

  // Box 2: Total Omset
  const box2X = marginX + cardWidth + 4;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(box2X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL OMSET TERFILTER', box2X + 4, cardY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70);
  doc.text(formatRupiah(totalRevenue), box2X + 4, cardY + 12);

  // Box 3: Total Unit Barang
  const box3X = box2X + cardWidth + 4;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(box3X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(29, 78, 216);
  doc.text('TOTAL BARANG TERJUAL', box3X + 4, cardY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175);
  doc.text(`${totalItems.toLocaleString('id-ID')} Unit Produk`, box3X + 4, cardY + 12);

  // Box 4: Rata-Rata per Nota
  const box4X = box3X + cardWidth + 4;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(box4X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('RATA-RATA (MEAN) PER NOTA', box4X + 4, cardY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(146, 64, 14);
  doc.text(formatRupiah(avgPerNota), box4X + 4, cardY + 12);

  // -------------------------------------------------------------
  // TABEL DATA TRANSAKSI
  // -------------------------------------------------------------
  const tableHeaders = [
    'No',
    'No. Nota',
    'Waktu Transaksi',
    'Pelanggan',
    'Kasir',
    'Item',
    'Subtotal',
    'Diskon',
    'Total Belanja',
    'Metode Bayar',
    'Status'
  ];

  const tableData = transactions.map((t, idx) => [
    (idx + 1).toString(),
    t.invoiceNumber,
    `${t.date} ${t.time || ''}`,
    t.customerName || 'Umum',
    t.cashierName || 'Kasir Utama',
    `${t.totalItemsCount || t.items?.reduce((s, i) => s + i.qty, 0) || 0} unit`,
    formatRupiah(t.subtotal || t.grandTotal),
    t.discountTotal > 0 ? `-${formatRupiah(t.discountTotal)}` : '-',
    formatRupiah(t.grandTotal),
    (t.paymentMethod || 'TUNAI').toUpperCase(),
    t.paymentStatus || 'Lunas'
  ]);

  autoTable(doc, {
    startY: cardY + cardHeight + 5,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [6, 78, 59], // emerald-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 32 },
      4: { cellWidth: 28 },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 22, halign: 'center' },
      10: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: marginX, right: marginX, bottom: 35 },
    didParseCell: (data) => {
      // Highlight status badge
      if (data.column.index === 10 && data.section === 'body') {
        const val = String(data.cell.raw);
        if (val === 'Lunas') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    }
  });

  // Footer & Signatures
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : cardY + cardHeight + 20;

  // Custom Notes Block if provided
  if (customNotes && customNotes.trim().length > 0) {
    if (finalY > pageHeight - 48) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Catatan: ${customNotes}`, marginX, finalY);
    finalY += 6;
  }
  
  // If not enough room for signatures, add new page
  if (finalY > pageHeight - 38) {
    doc.addPage();
    finalY = 20;
  }

  const signY = finalY;
  const colWidth = 60;
  const rightColX = pageWidth - marginX - colWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${storeCity}, ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightColX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Dibuat & Diverifikasi:', marginX + 10, signY + 6);
  doc.text('Mengetahui,', rightColX, signY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text('Kasir Penanggung Jawab', marginX + 10, signY + 11);
  doc.text('Manajer Operasional GreenMart', rightColX, signY + 11);

  // Line for signature
  doc.setDrawColor(148, 163, 184);
  doc.line(marginX + 10, signY + 28, marginX + 10 + 45, signY + 28);
  doc.line(rightColX, signY + 28, rightColX + 45, signY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`( ${cashierName} )`, marginX + 10, signY + 32);
  doc.text(`( ${managerName} )`, rightColX, signY + 32);

  // Page numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `GreenMart Supermarket Batang - Rekap Riwayat Transaksi | Dokumen: ${docId}`,
      marginX,
      pageHeight - 6.5
    );
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - marginX - 25,
      pageHeight - 6.5
    );
  }

  return doc;
}

/**
 * Direct download helper for Transaction History PDF report
 */
export function exportTransactionHistoryReportPdf(
  transactions: GreenMartTransaction[],
  options: TransactionHistoryPdfOptions = {}
): void {
  const doc = generateTransactionHistoryPdf(transactions, options);
  const cleanDate = (options.dateFilterLabel || 'semua').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Laporan_Riwayat_Transaksi_GreenMart_${cleanDate}.pdf`;
  doc.save(filename);
}

/**
 * Direct print helper for Transaction History PDF report
 */
export function printTransactionHistoryReportPdf(
  transactions: GreenMartTransaction[],
  options: TransactionHistoryPdfOptions = {}
): void {
  const doc = generateTransactionHistoryPdf(transactions, options);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = String(blobUrl);
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  }
}

// =========================================================================
// LAPORAN RESMI STOK BARANG & VALUASI INVENTARIS
// =========================================================================

export interface StockPdfExportOptions {
  categoryFilter?: string;
  stockStatusFilter?: string;
  storeName?: string;
  storeAddress?: string;
  cashierName?: string; // Nama Petugas / Pengelola Inventaris
  managerName?: string; // Nama Manajer Operasional
  storeCity?: string;   // Kota Penandatanganan (default 'Batang')
  customNotes?: string; // Catatan keterangan resmi
}

/**
 * Generate official PDF report for Inventory Stock (Stok Barang & Valuasi Aset)
 */
export function generateInventoryStockPdf(
  products: GreenMartProduct[],
  options: StockPdfExportOptions = {}
): jsPDF {
  const {
    categoryFilter = 'Semua Kategori',
    stockStatusFilter = 'Semua Stok',
    storeName = 'GREENMART SUPERMARKET & POS',
    storeAddress = 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
    storeCity = 'Batang',
    cashierName = 'Petugas Inventaris / Kasir',
    managerName = 'Bambang S., S.E.',
    customNotes = 'Laporan resmi ini disajikan otomatis berdasarkan data inventaris fisik dan valuasi modal aset toko GreenMart.'
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginX = 14;

  const today = new Date();
  const printTimestamp = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ` pukul ${today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  const docId = `GM-STK-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // -------------------------------------------------------------
  // KOP SURAT RESMI
  // -------------------------------------------------------------
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFillColor(5, 150, 105); // emerald-700
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Logo GreenMart
  try {
    doc.addImage(GREENMART_LOGO_COLOR_BASE64, 'PNG', marginX, 8.5, 16, 16);
  } catch (e) {
    console.warn('Could not add logo to stock PDF:', e);
  }

  const headerX = marginX + 21;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(storeName, headerX, 13);

  // Alamat Resmi Toko Batang (Line 1)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216', headerX, 17.5);

  // Kontak & Koperasi (Line 2)
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Telp: (0285) 391-234   |   Email: batang@greenmart.id   |   Unit Koperasi Siswa Batang', headerX, 21.5);

  // Document Badge (Line 3)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('SISTEM KASIR POS & REKAPITULASI INVENTARIS STOK BARANG RESMI', headerX, 26);

  const dividerY = 29.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // -------------------------------------------------------------
  // JUDUL & INFO FILTER
  // -------------------------------------------------------------
  const titleY = dividerY + 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN RESMI REKAPITULASI DATA STOK & VALUASI ASET BARANG', marginX, titleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kategori: ${categoryFilter} | Status Filter: ${stockStatusFilter} | Waktu Cetak: ${printTimestamp}`, marginX, titleY + 5);

  // -------------------------------------------------------------
  // METRIC SUMMARY CARDS
  // -------------------------------------------------------------
  const totalSku = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCostAsset = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const totalSellingValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const potentialProfit = Math.max(0, totalSellingValue - totalCostAsset);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const cardY = titleY + 9;
  const cardWidth = (pageWidth - marginX * 2 - 12) / 4;
  const cardHeight = 15;

  // Box 1: Total SKU
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL SKU BARANG', marginX + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalSku} Produk`, marginX + 3.5, cardY + 11);

  // Box 2: Total Unit Fisik
  const box2X = marginX + cardWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL UNIT FISIK STOK', box2X + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`${totalUnits.toLocaleString('id-ID')} Unit`, box2X + 3.5, cardY + 11);

  // Box 3: Total Valuasi Aset HPP
  const box3X = box2X + cardWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box3X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('VALUASI ASET MODAL (HPP)', box3X + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(formatRupiah(totalCostAsset), box3X + 3.5, cardY + 11);

  // Box 4: Potensi Laba Kotor / Status
  const box4X = box3X + cardWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box4X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('POTENSI LABA KOTOR', box4X + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(147, 51, 234); // purple-600
  doc.text(formatRupiah(potentialProfit), box4X + 3.5, cardY + 11);

  // -------------------------------------------------------------
  // TABEL DATA STOK BARANG
  // -------------------------------------------------------------
  const tableData = products.map((p, idx) => {
    const assetVal = p.stock * p.costPrice;
    const marginRp = p.sellingPrice - p.costPrice;
    const marginPct = p.costPrice > 0 ? Math.round((marginRp / p.costPrice) * 100) : 0;
    const statusText = p.stock <= 0 ? 'HABIS' : p.stock <= p.minStock ? 'MENIPIS' : 'AMAN';

    return [
      String(idx + 1),
      p.barcode,
      p.name,
      p.category,
      formatRupiah(p.costPrice),
      formatRupiah(p.sellingPrice),
      `${marginPct}% (${formatRupiah(marginRp)})`,
      `${p.stock} ${p.unit}`,
      statusText,
      formatRupiah(assetVal)
    ];
  });

  autoTable(doc, {
    head: [[
      'No',
      'Barcode',
      'Nama Produk',
      'Kategori',
      'Harga Beli (HPP)',
      'Harga Jual',
      'Margin',
      'Sisa Stok',
      'Status',
      'Valuasi Aset HPP'
    ]],
    body: tableData,
    foot: [[
      '',
      'TOTAL',
      `${totalSku} Produk SKU`,
      '',
      '',
      '',
      '',
      `${totalUnits.toLocaleString('id-ID')} Unit`,
      `${lowStockCount} Tipis / ${outOfStockCount} Habis`,
      formatRupiah(totalCostAsset)
    ]],
    startY: cardY + cardHeight + 4.5,
    margin: { left: marginX, right: marginX, bottom: 28 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, font: 'courier' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28 },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight status cell
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val === 'HABIS') {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'MENIPIS') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-600
        }
      }
    }
  });

  // -------------------------------------------------------------
  // LEMBAR PENGESAHAN & TANDA TANGAN RESMI
  // -------------------------------------------------------------
  const lastTable = (doc as any).lastAutoTable;
  let finalY = (lastTable ? lastTable.finalY : 140) + 7;

  if (finalY > pageHeight - 38) {
    doc.addPage();
    finalY = 22;
  }

  // Catatan Dokumen
  if (customNotes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Catatan: ${customNotes}`, marginX, finalY);
    finalY += 6;
  }

  const signY = finalY;
  const colWidth = 65;
  const rightColX = pageWidth - marginX - colWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${storeCity}, ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightColX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dibuat & Diverifikasi:', marginX + 8, signY + 5);
  doc.text('Mengetahui,', rightColX, signY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Kasir Penanggung Jawab', marginX + 8, signY + 10);
  doc.text('Manajer Operasional GreenMart', rightColX, signY + 10);

  // Line for signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(marginX + 8, signY + 24, marginX + 8 + 52, signY + 24);
  doc.line(rightColX, signY + 24, rightColX + 52, signY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${cashierName} )`, marginX + 8, signY + 28.5);
  doc.text(`( ${managerName} )`, rightColX, signY + 28.5);

  // Page numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `GreenMart Supermarket Batang - Rekap Inventaris Stok Barang | Dokumen: ${docId}`,
      marginX,
      pageHeight - 6.5
    );
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - marginX - 25,
      pageHeight - 6.5
    );
  }

  return doc;
}

/**
 * Direct download helper for Inventory Stock PDF report
 */
export function exportInventoryStockReportPdf(
  products: GreenMartProduct[],
  options: StockPdfExportOptions = {}
): void {
  const doc = generateInventoryStockPdf(products, options);
  const cleanCategory = (options.categoryFilter || 'semua').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Laporan_Stok_Barang_GreenMart_${cleanCategory}.pdf`;
  doc.save(filename);
}

/**
 * Direct print helper for Inventory Stock PDF report
 */
export function printInventoryStockReportPdf(
  products: GreenMartProduct[],
  options: StockPdfExportOptions = {}
): void {
  const doc = generateInventoryStockPdf(products, options);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}

// =========================================================================
// LAPORAN BERITA ACARA AUDIT STOCK OPNAME & REKONSILIASI GUDANG
// =========================================================================

export interface StockOpnamePdfOptions {
  storeName?: string;
  storeAddress?: string;
  storeCity?: string;
  auditorName?: string;
  managerName?: string;
  customNotes?: string;
  filterMode?: 'all' | 'discrepancy' | 'minus' | 'surplus';
}

/**
 * Generate official PDF report for Stock Opname Audit & Discrepancy Comparison
 */
export function generateStockOpnameAuditPdf(
  items: StockComparisonItem[],
  options: StockOpnamePdfOptions = {}
): jsPDF {
  const {
    storeName = 'GREENMART SUPERMARKET & POS',
    storeAddress = 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216 | Telp: (0285) 391-234 | Email: batang@greenmart.id',
    storeCity = 'Batang',
    auditorName = 'Petugas Pemeriksa Gudang',
    managerName = 'Bambang S., S.E.',
    customNotes = 'Laporan berita acara ini disajikan otomatis berdasarkan hasil audit fisik barang di gudang vs stok sistem POS.',
    filterMode = 'all'
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginX = 14;

  const today = new Date();
  const printTimestamp = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ` pukul ${today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

  const docId = `GM-OPNAME-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Top stripes
  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(5, 150, 105); // emerald-700
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // GreenMart Logo
  try {
    doc.addImage(GREENMART_LOGO_COLOR_BASE64, 'PNG', marginX, 8, 16, 16);
  } catch (e) {
    console.warn('Could not add logo to stock opname PDF:', e);
  }

  const headerX = marginX + 20;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(storeName, headerX, 13);

  // Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(storeAddress.split('|')[0].trim(), headerX, 17.5);

  // Contact line
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Telp: (0285) 391-234   |   Email: batang@greenmart.id   |   Unit Koperasi Siswa Batang', headerX, 21.5);

  // Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text('BERITA ACARA AUDIT STOCK OPNAME & REKONSILIASI FISIK GUDANG', headerX, 26);

  // Divider
  const dividerY = 29.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.6);
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // Title line
  const titleY = dividerY + 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('BERITA ACARA PEMBANDING STOK FISIK GUDANG VS SISTEM POS', marginX, titleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`No. Registrasi: ${docId} | Waktu Audit: ${printTimestamp} | Filter Data: ${filterMode === 'discrepancy' ? 'Hanya Produk Berselisih' : 'Semua Produk Terdaftar'}`, marginX, titleY + 5);

  // Filtered items
  const displayItems = filterMode === 'discrepancy'
    ? items.filter(i => i.difference !== 0)
    : filterMode === 'minus'
    ? items.filter(i => i.difference < 0)
    : filterMode === 'surplus'
    ? items.filter(i => i.difference > 0)
    : items;

  // Metric summaries
  const totalSku = items.length;
  const matchCount = items.filter(i => i.difference === 0).length;
  const minusCount = items.filter(i => i.difference < 0).length;
  const surplusCount = items.filter(i => i.difference > 0).length;
  const totalFinancialDiffHpp = items.reduce((sum, i) => sum + i.financialDiffHpp, 0);

  const cardY = titleY + 8.5;
  const cardWidth = (pageWidth - marginX * 2 - 12) / 4;
  const cardHeight = 14;

  // Box 1: Total SKU & Match
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL SKU DIPERIKSA', marginX + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalSku} Produk (${Math.round((matchCount / (totalSku || 1)) * 100)}% Klop)`, marginX + 3.5, cardY + 10.5);

  // Box 2: Stok Klop (Match)
  const box2X = marginX + cardWidth + 4;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(box2X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87);
  doc.text('STOK SESUAI (KLOP)', box2X + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(`${matchCount} Produk Cocok`, box2X + 3.5, cardY + 10.5);

  // Box 3: Stok Selisih (Minus & Plus)
  const box3X = box2X + cardWidth + 4;
  doc.setFillColor(minusCount > 0 ? 254 : 248, minusCount > 0 ? 242 : 250, minusCount > 0 ? 242 : 252);
  doc.setDrawColor(minusCount > 0 ? 254 : 226, minusCount > 0 ? 202 : 232, minusCount > 0 ? 202 : 240);
  doc.roundedRect(box3X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(minusCount > 0 ? 185 : 100, minusCount > 0 ? 28 : 116, minusCount > 0 ? 28 : 139);
  doc.text('SELISIH FISIK VS SISTEM', box3X + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(minusCount > 0 ? 185 : 15, minusCount > 0 ? 28 : 23, minusCount > 0 ? 28 : 42);
  doc.text(`${minusCount} Minus | ${surplusCount} Surplus`, box3X + 3.5, cardY + 10.5);

  // Box 4: Total Valuasi Selisih HPP
  const box4X = box3X + cardWidth + 4;
  doc.setFillColor(totalFinancialDiffHpp < 0 ? 254 : 239, totalFinancialDiffHpp < 0 ? 242 : 246, totalFinancialDiffHpp < 0 ? 242 : 255);
  doc.setDrawColor(totalFinancialDiffHpp < 0 ? 254 : 191, totalFinancialDiffHpp < 0 ? 202 : 219, totalFinancialDiffHpp < 0 ? 202 : 254);
  doc.roundedRect(box4X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(totalFinancialDiffHpp < 0 ? 185 : 29, totalFinancialDiffHpp < 0 ? 28 : 78, totalFinancialDiffHpp < 0 ? 28 : 216);
  doc.text('VALUASI SELISIH MODAL (HPP)', box4X + 3.5, cardY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(totalFinancialDiffHpp < 0 ? 185 : 30, totalFinancialDiffHpp < 0 ? 28 : 64, totalFinancialDiffHpp < 0 ? 28 : 175);
  doc.text(
    (totalFinancialDiffHpp >= 0 ? '+' : '') + formatRupiah(totalFinancialDiffHpp),
    box4X + 3.5,
    cardY + 10.5
  );

  // AutoTable
  const headers = [
    'No',
    'Barcode',
    'Nama Barang',
    'Kategori',
    'Stok Sistem',
    'Stok Fisik',
    'Selisih (Varian)',
    'Harga Modal (HPP)',
    'Nilai Selisih HPP',
    'Status & Keterangan Audit'
  ];

  const bodyData = displayItems.map((item, idx) => {
    const diffSign = item.difference > 0 ? `+${item.difference}` : item.difference.toString();
    const statusText = item.difference === 0 
      ? 'SESUAI' 
      : item.difference < 0 
      ? `MINUS (${item.difference} ${item.unit})` 
      : `SURPLUS (+${item.difference} ${item.unit})`;

    const noteText = item.notes && item.notes !== 'Sesuai' ? ` (${item.notes})` : '';

    return [
      (idx + 1).toString(),
      item.barcode,
      item.name,
      item.category,
      `${item.systemStock} ${item.unit}`,
      `${item.physicalStock} ${item.unit}`,
      `${diffSign} ${item.unit}`,
      formatRupiah(item.costPrice),
      formatRupiah(item.financialDiffHpp),
      `${statusText}${noteText}`
    ];
  });

  autoTable(doc, {
    startY: cardY + cardHeight + 4.5,
    head: [headers],
    body: bodyData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    headStyles: {
      fillColor: [6, 78, 59], // emerald-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 54 },
      3: { cellWidth: 26 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      9: { cellWidth: 37 }
    },
    margin: { left: marginX, right: marginX, bottom: 35 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const item = displayItems[data.row.index];
        if (item) {
          // Highlight Difference Column
          if (data.column.index === 6) {
            if (item.difference < 0) {
              data.cell.styles.textColor = [225, 29, 72]; // rose-600
            } else if (item.difference > 0) {
              data.cell.styles.textColor = [37, 99, 235]; // blue-600
            } else {
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            }
          }
          // Highlight Status Column
          if (data.column.index === 9) {
            if (item.difference < 0) {
              data.cell.styles.textColor = [190, 18, 60];
              data.cell.styles.fontStyle = 'bold';
            } else if (item.difference > 0) {
              data.cell.styles.textColor = [29, 78, 216];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [5, 150, 105];
            }
          }
        }
      }
    }
  });

  // Footer & Signatures Block
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : cardY + cardHeight + 20;

  if (customNotes && customNotes.trim().length > 0) {
    if (finalY > pageHeight - 45) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Catatan Berita Acara: ${customNotes}`, marginX, finalY);
    finalY += 6;
  }

  if (finalY > pageHeight - 38) {
    doc.addPage();
    finalY = 20;
  }

  const signY = finalY;
  const colWidth = 60;
  const rightColX = pageWidth - marginX - colWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${storeCity}, ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightColX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dibuat & Diverifikasi:', marginX + 8, signY + 5);
  doc.text('Mengetahui,', rightColX, signY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Petugas Pemeriksa Gudang', marginX + 8, signY + 10);
  doc.text('Manajer Operasional GreenMart', rightColX, signY + 10);

  // Line for signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(marginX + 8, signY + 24, marginX + 8 + 52, signY + 24);
  doc.line(rightColX, signY + 24, rightColX + 52, signY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${auditorName} )`, marginX + 8, signY + 28.5);
  doc.text(`( ${managerName} )`, rightColX, signY + 28.5);

  // Page numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `GreenMart Supermarket Batang - Berita Acara Stock Opname | Dokumen: ${docId}`,
      marginX,
      pageHeight - 6.5
    );
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - marginX - 25,
      pageHeight - 6.5
    );
  }

  return doc;
}

/**
 * Direct download helper for Stock Opname Audit PDF report
 */
export function exportStockOpnameAuditPdf(
  items: StockComparisonItem[],
  options: StockOpnamePdfOptions = {}
): void {
  const doc = generateStockOpnameAuditPdf(items, options);
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Berita_Acara_Stock_Opname_GreenMart_${todayStr}.pdf`;
  doc.save(filename);
}

/**
 * Direct print helper for Stock Opname Audit PDF report
 */
export function printStockOpnameAuditPdf(
  items: StockComparisonItem[],
  options: StockOpnamePdfOptions = {}
): void {
  const doc = generateStockOpnameAuditPdf(items, options);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = String(blobUrl);
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  }
}



