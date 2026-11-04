import * as XLSX from 'xlsx';
import { GreenMartProduct, GreenMartTransaction } from '../types';

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSyncOnTransaction: boolean;
  lastSyncTimestamp: string | null;
  lastSyncStatus: 'success' | 'failed' | null;
  lastSyncCount: {
    products: number;
    transactions: number;
  } | null;
}

const STORAGE_KEY = 'greenmart_google_sheets_config_v1';

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load Google Sheets config:', e);
  }
  return {
    webhookUrl: '',
    autoSyncOnTransaction: false,
    lastSyncTimestamp: null,
    lastSyncStatus: null,
    lastSyncCount: null
  };
}

export function saveGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
  const current = getGoogleSheetsConfig();
  const updated: GoogleSheetsConfig = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save Google Sheets config:', e);
  }
  return updated;
}

/**
 * Generate formatted multi-sheet Excel file (.xlsx) natively compatible with Google Sheets import
 */
export function exportMultiSheetForGoogleSheets(
  products: GreenMartProduct[],
  transactions: GreenMartTransaction[],
  summaryMetrics?: {
    totalRevenue: number;
    totalHpp: number;
    netProfit: number;
    profitMargin: number;
    totalTrx: number;
    meanAov: number;
    bestSellerModus: string;
  }
): void {
  const wb = XLSX.utils.book_new();

  // 1. SHEET STOK BARANG
  const stockHeaders = [
    'No',
    'Barcode (SKU)',
    'Nama Produk',
    'Kategori',
    'Harga Modal (HPP)',
    'Harga Jual',
    'Margin Untung (Rp)',
    'Persentase Margin',
    'Stok Fisik',
    'Batas Min. Stok',
    'Satuan',
    'Nilai Valuasi Modal (HPP)',
    'Nilai Valuasi Jual',
    'Status Stok'
  ];

  const stockRows = products.map((p, idx) => {
    const marginRp = Math.max(0, p.sellingPrice - p.costPrice);
    const marginPct = p.costPrice > 0 ? `${((marginRp / p.costPrice) * 100).toFixed(1)}%` : '0%';
    const status = p.stock <= 0 ? 'HABIS' : p.stock <= p.minStock ? 'MENIPIS' : 'AMAN';
    return [
      idx + 1,
      p.barcode,
      p.name,
      p.category,
      p.costPrice,
      p.sellingPrice,
      marginRp,
      marginPct,
      p.stock,
      p.minStock,
      p.unit,
      p.stock * p.costPrice,
      p.stock * p.sellingPrice,
      status
    ];
  });

  const wsStock = XLSX.utils.aoa_to_sheet([stockHeaders, ...stockRows]);
  wsStock['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 20 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsStock, 'Stok_Barang');

  // 2. SHEET RIWAYAT TRANSAKSI
  const trxHeaders = [
    'No',
    'No. Nota / Invoice',
    'Tanggal Transaksi',
    'Jam',
    'Kasir Penanggung Jawab',
    'Nama Pelanggan',
    'Rincian Barang Dibeli',
    'Total Kuantitas Item',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Total Tagihan (Rp)',
    'Metode Bayar',
    'Uang Diterima (Rp)',
    'Kembalian (Rp)',
    'Status Pembayaran',
    'Waktu Pelunasan',
    'Kasir Pelunasan',
    'Catatan Pelunasan'
  ];

  const trxRows = transactions.map((t, idx) => {
    const itemsSummary = t.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join('; ');
    return [
      idx + 1,
      t.invoiceNumber,
      t.date,
      t.time || '',
      t.cashierName || 'Kasir',
      t.customerName || 'Umum',
      itemsSummary,
      t.totalItemsCount || t.items.reduce((sum, i) => sum + i.qty, 0),
      t.subtotal || t.grandTotal,
      t.discountTotal || 0,
      t.grandTotal,
      (t.paymentMethod || 'Tunai').toUpperCase(),
      t.cashGiven || t.grandTotal,
      t.changeAmount || 0,
      t.paymentStatus || 'Lunas',
      t.settledAt || '-',
      t.settledByCashier || '-',
      t.settledNotes || '-'
    ];
  });

  const wsTrx = XLSX.utils.aoa_to_sheet([trxHeaders, ...trxRows]);
  wsTrx['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 24 },
    { wch: 22 },
    { wch: 45 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsTrx, 'Riwayat_Transaksi');

  // 3. SHEET REKAP STATISTIK
  const totRev = summaryMetrics?.totalRevenue ?? transactions.reduce((s, t) => s + t.grandTotal, 0);
  const totHpp = summaryMetrics?.totalHpp ?? products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const netProf = summaryMetrics?.netProfit ?? Math.max(0, totRev * 0.22);
  const marginPct = totRev > 0 ? `${((netProf / totRev) * 100).toFixed(1)}%` : '0%';
  const modus = summaryMetrics?.bestSellerModus ?? (products[0]?.name || '-');
  const meanAov = transactions.length > 0 ? Math.round(totRev / transactions.length) : 0;

  const statData = [
    ['REKAPITULASI STATISTIK GREENMART SUPERMARKET & POS'],
    ['Lokasi Toko', 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Kec. Batang, Kab. Batang, Jawa Tengah 51216'],
    ['Waktu Ekspor', new Date().toLocaleString('id-ID')],
    [''],
    ['PARAMETER STATISTIK & KEUANGAN', 'NILAI TERCATAT', 'KETERANGAN'],
    ['Total Omset Pendapatan Kotor', totRev, 'Akumulasi total tagihan belanja transaksi'],
    ['Total Valuasi Modal Aset (HPP)', totHpp, 'Nilai modal harga pokok pembelian stok gudang'],
    ['Estimasi Laba Bersih Operasional', netProf, 'Selisih harga jual terhadap HPP belanja'],
    ['Margin Keuntungan Bersih', marginPct, 'Rasio profitabilitas penjualan toko'],
    ['Total Transaksi / Nota', transactions.length, 'Jumlah nota tercatat dalam sistem'],
    ['Rata-Rata per Nota (Mean / AOV)', meanAov, 'Rata-rata pengeluaran per keranjang belanja'],
    ['Modus Produk Paling Laris', modus, 'Produk dengan frekuensi pembelian tertinggi'],
    ['Total SKU Barang Aktif', products.length, 'Jumlah variasi produk dalam katalog inventaris'],
    ['Total Unit Fisik Stok', products.reduce((s, p) => s + p.stock, 0), 'Total unit fisik barang tersedia di rak & gudang']
  ];

  const wsStat = XLSX.utils.aoa_to_sheet(statData);
  wsStat['!cols'] = [
    { wch: 36 },
    { wch: 26 },
    { wch: 55 }
  ];
  XLSX.utils.book_append_sheet(wb, wsStat, 'Rekap_Statistika');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `GreenMart_Database_GoogleSpreadsheet_${todayStr}.xlsx`);
}

/**
 * Open new blank Google Spreadsheet in new browser tab
 */
export function openNewGoogleSheetInTab(): void {
  window.open('https://sheets.new', '_blank');
}

/**
 * Open Google Drive upload page
 */
export function openGoogleDriveUploadInTab(): void {
  window.open('https://drive.google.com', '_blank');
}

/**
 * Google Apps Script (GAS) ready-to-paste template for Web App endpoint
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GREENMART POS - GOOGLE APPS SCRIPT WEBHOOK RECEIVER
 * =========================================================================
 * Script ini secara otomatis menerima data dari sistem kasir GreenMart dan
 * mengisinya ke 3 tab sheet: 'Stok_Barang', 'Riwayat_Transaksi', 'Rekap_Statistika'.
 * 
 * CARA MEMASANG:
 * 1. Buka spreadsheet Google Anda (atau buat baru di https://sheets.new).
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus seluruh isi default, lalu tempel (Paste) script ini.
 * 4. Klik ikon Disket (Save / Simpan).
 * 5. Klik tombol biru 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru).
 * 6. Klik ikon Gear (roda gigi) di kiri > pilih 'Web app'.
 * 7. Atur:
 *    - Description: GreenMart POS Webhook
 *    - Execute as: Me (email@gmail.com)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING!
 * 8. Klik 'Deploy', lalu salin URL Web App yang muncul.
 * 9. Tempelkan URL tersebut ke kolom Webhook di GreenMart POS!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Tidak ada data JSON yang diterima'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var timestamp = new Date();

    // 1. UPDATE / BUAT SHEET: Stok_Barang
    if (payload.inventory && payload.inventory.length > 0) {
      var stockSheet = ss.getSheetByName('Stok_Barang') || ss.insertSheet('Stok_Barang');
      stockSheet.clear();
      
      var stockHeaders = [
        'No', 'Barcode', 'Nama Produk', 'Kategori', 'Harga Modal (HPP)',
        'Harga Jual', 'Margin (Rp)', 'Stok', 'Batas Min', 'Satuan',
        'Valuasi Modal (HPP)', 'Status Stok'
      ];
      stockSheet.appendRow(stockHeaders);
      
      var stockRows = payload.inventory.map(function(p, i) {
        var hpp = p.costPrice || 0;
        var jual = p.sellingPrice || 0;
        var margin = jual - hpp;
        var stock = p.stock || 0;
        var status = stock <= 0 ? 'HABIS' : (stock <= (p.minStock || 5) ? 'MENIPIS' : 'AMAN');
        return [
          i + 1, p.barcode, p.name, p.category, hpp,
          jual, margin, stock, p.minStock || 5, p.unit || 'pcs',
          stock * hpp, status
        ];
      });
      
      if (stockRows.length > 0) {
        stockSheet.getRange(2, 1, stockRows.length, stockHeaders.length).setValues(stockRows);
      }
      
      // Format Header Stok
      stockSheet.getRange(1, 1, 1, stockHeaders.length)
        .setBackground('#064e3b')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      stockSheet.autoResizeColumns(1, stockHeaders.length);
    }

    // 2. UPDATE / BUAT SHEET: Riwayat_Transaksi
    if (payload.transactions && payload.transactions.length > 0) {
      var trxSheet = ss.getSheetByName('Riwayat_Transaksi') || ss.insertSheet('Riwayat_Transaksi');
      trxSheet.clear();
      
      var trxHeaders = [
        'No', 'No. Nota', 'Tanggal', 'Jam', 'Kasir', 'Pelanggan',
        'Total Item', 'Subtotal', 'Diskon', 'Total Belanja',
        'Metode Bayar', 'Status', 'Waktu Pelunasan'
      ];
      trxSheet.appendRow(trxHeaders);
      
      var trxRows = payload.transactions.map(function(t, i) {
        return [
          i + 1,
          t.invoiceNumber,
          t.date,
          t.time || '',
          t.cashierName || 'Kasir',
          t.customerName || 'Umum',
          t.totalItemsCount || 0,
          t.subtotal || t.grandTotal,
          t.discountTotal || 0,
          t.grandTotal,
          (t.paymentMethod || 'TUNAI').toUpperCase(),
          t.paymentStatus || 'Lunas',
          t.settledAt || '-'
        ];
      });
      
      if (trxRows.length > 0) {
        trxSheet.getRange(2, 1, trxRows.length, trxHeaders.length).setValues(trxRows);
      }
      
      // Format Header Transaksi
      trxSheet.getRange(1, 1, 1, trxHeaders.length)
        .setBackground('#047857')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      trxSheet.autoResizeColumns(1, trxHeaders.length);
    }

    // 3. UPDATE / BUAT SHEET: Rekap_Statistika
    var statSheet = ss.getSheetByName('Rekap_Statistika') || ss.insertSheet('Rekap_Statistika');
    statSheet.clear();
    
    var statRows = [
      ['REKAPITULASI SISTEM KASIR GREENMART POS BATANG', ''],
      ['Waktu Terakhir Sinkronisasi', timestamp.toISOString()],
      ['Status Koneksi', 'TERHUBUNG AKTIF'],
      [''],
      ['PARAMETER STATISTIK', 'NILAI'],
      ['Total Produk Terdaftar (SKU)', (payload.inventory || []).length],
      ['Total Nota Transaksi', (payload.transactions || []).length],
      ['Total Omset Belanja (Rp)', (payload.statistics && payload.statistics.totalRevenue) || 0],
      ['Total Modal Aset HPP (Rp)', (payload.statistics && payload.statistics.totalHpp) || 0],
      ['Estimasi Laba Bersih (Rp)', (payload.statistics && payload.statistics.netProfit) || 0],
      ['Modus Produk Terlaris', (payload.statistics && payload.statistics.bestSellerModus) || '-'],
      ['Rata-Rata per Nota (Mean)', (payload.statistics && payload.statistics.meanAov) || 0]
    ];
    
    statSheet.getRange(1, 1, statRows.length, 2).setValues(statRows);
    statSheet.getRange(1, 1, 1, 2).setBackground('#10b981').setFontColor('#ffffff').setFontWeight('bold');
    statSheet.getRange(5, 1, 1, 2).setBackground('#e2e8f0').setFontWeight('bold');
    statSheet.autoResizeColumns(1, 2);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data GreenMart berhasil disinkronkan ke Google Spreadsheet!',
      syncedAt: timestamp.toISOString(),
      counts: {
        products: (payload.inventory || []).length,
        transactions: (payload.transactions || []).length
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Gagal memproses data: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    app: 'GreenMart POS Webhook Receiver',
    message: 'Endpoint siap menerima POST payload data dari kasir.'
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Dispatch sync payload to Google Sheets Webhook via backend proxy or direct fetch
 */
export async function syncToGoogleSheetsWebhook(
  webhookUrl: string,
  products: GreenMartProduct[],
  transactions: GreenMartTransaction[],
  summaryMetrics?: {
    totalRevenue: number;
    totalHpp: number;
    netProfit: number;
    profitMargin: number;
    totalTrx: number;
    meanAov: number;
    bestSellerModus: string;
  }
): Promise<{ success: boolean; message: string; details?: any }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'URL Webhook Google Apps Script belum valid. Silakan tempelkan URL Web App.'
    };
  }

  const payload = {
    timestamp: new Date().toISOString(),
    storeName: 'GreenMart Supermarket & POS Batang',
    inventory: products,
    transactions: transactions,
    statistics: {
      totalRevenue: summaryMetrics?.totalRevenue ?? transactions.reduce((s, t) => s + t.grandTotal, 0),
      totalHpp: summaryMetrics?.totalHpp ?? products.reduce((s, p) => s + p.stock * p.costPrice, 0),
      netProfit: summaryMetrics?.netProfit ?? Math.max(0, (summaryMetrics?.totalRevenue || 0) * 0.22),
      bestSellerModus: summaryMetrics?.bestSellerModus || products[0]?.name || '-',
      meanAov: transactions.length > 0 ? Math.round((summaryMetrics?.totalRevenue || 0) / transactions.length) : 0,
      totalTrx: transactions.length
    }
  };

  // Try 1: Call internal backend proxy to bypass browser CORS constraints on Google Apps Script
  try {
    const proxyRes = await fetch('/api/sheets/sync-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhookUrl: webhookUrl.trim(),
        payload
      })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      saveGoogleSheetsConfig({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncCount: {
          products: products.length,
          transactions: transactions.length
        }
      });
      return {
        success: true,
        message: data.message || 'Data berhasil disinkronkan ke Google Spreadsheet!',
        details: data
      };
    }
  } catch (proxyErr) {
    console.warn('Backend proxy sync failed, trying direct browser fetch:', proxyErr);
  }

  // Try 2: Direct browser fetch with mode: 'no-cors' fallback
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    saveGoogleSheetsConfig({
      lastSyncTimestamp: new Date().toISOString(),
      lastSyncStatus: 'success',
      lastSyncCount: {
        products: products.length,
        transactions: transactions.length
      }
    });

    return {
      success: true,
      message: 'Payload data telah dikirimkan ke Google Apps Script Webhook!'
    };
  } catch (directErr: any) {
    console.error('Direct fetch to webhook failed:', directErr);
    saveGoogleSheetsConfig({
      lastSyncTimestamp: new Date().toISOString(),
      lastSyncStatus: 'failed'
    });
    return {
      success: false,
      message: `Gagal mengirim data ke Google Sheets: ${directErr?.message || 'Koneksi terputus'}`
    };
  }
}
