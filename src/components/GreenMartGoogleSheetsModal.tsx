import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Cloud, 
  Code2, 
  BookOpen, 
  FileText, 
  Sparkles,
  Link2,
  ArrowRight
} from 'lucide-react';
import { GreenMartProduct, GreenMartTransaction } from '../types';
import { 
  getGoogleSheetsConfig, 
  saveGoogleSheetsConfig, 
  exportMultiSheetForGoogleSheets, 
  openNewGoogleSheetInTab, 
  openGoogleDriveUploadInTab, 
  GOOGLE_APPS_SCRIPT_TEMPLATE, 
  syncToGoogleSheetsWebhook,
  GoogleSheetsConfig
} from '../utils/googleSheetsSync';

interface GreenMartGoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: GreenMartProduct[];
  transactions: GreenMartTransaction[];
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GreenMartGoogleSheetsModal: React.FC<GreenMartGoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  products,
  transactions,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'webhook' | 'export' | 'guide'>('webhook');
  const [config, setConfig] = useState<GoogleSheetsConfig>(getGoogleSheetsConfig);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getGoogleSheetsConfig();
      setConfig(current);
      setWebhookUrlInput(current.webhookUrl || '');
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveWebhookUrl = () => {
    const updated = saveGoogleSheetsConfig({
      webhookUrl: webhookUrlInput.trim()
    });
    setConfig(updated);
    if (onShowToast) {
      onShowToast('URL Webhook Google Apps Script tersimpan!', 'success');
    }
  };

  const handleToggleAutoSync = () => {
    const nextVal = !config.autoSyncOnTransaction;
    const updated = saveGoogleSheetsConfig({
      autoSyncOnTransaction: nextVal
    });
    setConfig(updated);
    if (onShowToast) {
      onShowToast(
        nextVal ? 'Auto-sync aktif: Data akan dikirim setiap transaksi baru.' : 'Auto-sync dinonaktifkan.',
        'info'
      );
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
    if (onShowToast) {
      onShowToast('Kode Google Apps Script berhasil disalin ke clipboard!', 'success');
    }
  };

  const handleSyncNow = async () => {
    const urlToUse = webhookUrlInput.trim() || config.webhookUrl;
    if (!urlToUse) {
      if (onShowToast) {
        onShowToast('Harap masukkan URL Webhook Google Apps Script terlebih dahulu.', 'error');
      }
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    // Save URL if changed
    if (urlToUse !== config.webhookUrl) {
      saveGoogleSheetsConfig({ webhookUrl: urlToUse });
    }

    try {
      const res = await syncToGoogleSheetsWebhook(urlToUse, products, transactions);
      setSyncResult({
        success: res.success,
        message: res.message
      });
      setConfig(getGoogleSheetsConfig());
      if (onShowToast) {
        onShowToast(res.message, res.success ? 'success' : 'error');
      }
    } catch (err: any) {
      const errMsg = `Gagal sinkronisasi: ${err?.message || 'Koneksi terputus'}`;
      setSyncResult({
        success: false,
        message: errMsg
      });
      if (onShowToast) {
        onShowToast(errMsg, 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportXlsx = () => {
    try {
      exportMultiSheetForGoogleSheets(products, transactions);
      if (onShowToast) {
        onShowToast('Berkas multi-sheet (.xlsx) untuk Google Spreadsheet berhasil diunduh!', 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      if (onShowToast) {
        onShowToast('Gagal mengunduh berkas spreadsheet.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Simpan &amp; Integrasi Google Spreadsheet
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950">
                  Resmi
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Simpan stok barang, riwayat transaksi, dan rekap statistik ke Google Sheets
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sinkronisasi Otomatis (Cloud Webhook)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor File (.xlsx Multi-Sheet)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Langkah-Langkah Panduan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100 flex-1">
          
          {/* TAB 1: SINKRONISASI OTOMATIS (WEBHOOK) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              
              {/* Status Connection Banner */}
              <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                config.webhookUrl 
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  {config.webhookUrl ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-bold">
                      {config.webhookUrl ? 'Webhook Terkonfigurasi' : 'Webhook Belum Dikonfigurasi'}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {config.webhookUrl 
                        ? 'GreenMart dapat langsung mengirimkan stok, transaksi, dan statistika ke Google Spreadsheet Anda.' 
                        : 'Masukkan URL Web App dari Google Apps Script untuk mengaktifkan sinkronisasi cloud realtime.'}
                    </p>
                    {config.lastSyncTimestamp && (
                      <div className="text-[11px] font-mono mt-1.5 text-slate-500 dark:text-slate-400">
                        Sinkronisasi terakhir: {new Date(config.lastSyncTimestamp).toLocaleString('id-ID')} ({config.lastSyncCount?.products || 0} stok, {config.lastSyncCount?.transactions || 0} nota)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Lihat Panduan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={webhookUrlInput}
                      onChange={(e) => setWebhookUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full text-xs font-mono font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-emerald-500 transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveWebhookUrl}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              {/* Auto Sync Toggle & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="autoSyncToggle"
                    checked={config.autoSyncOnTransaction}
                    onChange={handleToggleAutoSync}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="autoSyncToggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Sinkronkan otomatis setiap ada transaksi kasir baru
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Sync Feedback Alert */}
              {syncResult && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  syncResult.success 
                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200' 
                    : 'bg-rose-100/70 border-rose-300 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
                }`}>
                  {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{syncResult.message}</span>
                </div>
              )}

              {/* Ready-to-use Script Snippet */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    <span>Kode Google Apps Script Siap Pasang:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Tersalin!' : 'Salin Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-300 p-3 rounded-2xl font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800">
                  <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
                </div>
                <p className="text-[11px] text-slate-500">
                  Script di atas otomatis membuat 3 tab: <strong className="text-emerald-700 dark:text-emerald-400">Stok_Barang</strong>, <strong className="text-emerald-700 dark:text-emerald-400">Riwayat_Transaksi</strong>, dan <strong className="text-emerald-700 dark:text-emerald-400">Rekap_Statistika</strong>.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: EKSPOR BERKAS MULTI-SHEET (.XLSX) */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-200 text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Berkas Multi-Sheet Khusus Google Spreadsheet (.xlsx)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Unduh 1 berkas terpadu yang memuat 3 lembar kerja terformat rapi. Anda dapat mengunggahnya langsung ke Google Drive atau mengimpornya ke Google Spreadsheet tanpa perlu edit manual.
                </p>
              </div>

              {/* 3 Sheets Preview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sheet: Stok_Barang</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {products.length} SKU Barang, Barcode, HPP, Harga Jual, Margin, Valuasi Modal, &amp; Status Stok.
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sheet: Riwayat_Transaksi</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {transactions.length} Nota Transaksi, Pelanggan, Kasir, Subtotal, Diskon, Metode &amp; Pelunasan.
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sheet: Rekap_Statistika</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Omset Kotor, Modal HPP, Laba Bersih, Margin %, Modus Produk Terlaris, dan Mean per Nota.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="flex-1 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Spreadsheet (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={openNewGoogleSheetInTab}
                  className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Buka lembar kerja Google Sheets baru di tab peramban"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  <span>Buka sheets.new</span>
                </button>

                <button
                  type="button"
                  onClick={openGoogleDriveUploadInTab}
                  className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Buka Google Drive untuk mengunggah file spreadsheet"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Google Drive</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: LANGKAH-LANGKAH PANDUAN LENGKAP */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              
              <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>Panduan Langkah-Demi-Langkah (Metode Cloud Otomatis)</span>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Buka Google Spreadsheet Baru
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Buka peramban dan kunjungi <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">sheets.new</a> untuk membuat Google Spreadsheet baru, atau buka lembar kerja Google yang sudah ada. Beri nama spreadsheet misalnya: <strong className="text-emerald-700 dark:text-emerald-400">GreenMart POS Batang</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Buka Menu Apps Script
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Pada menu atas Google Spreadsheet, klik <strong>Extensions (Ekstensi)</strong> &gt; lalu pilih <strong>Apps Script</strong>. Jendela editor script Google akan terbuka di tab baru.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Tempelkan Kode Script GreenMart
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Hapus semua kode bawaan di file <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">Code.gs</code>, kemudian klik tombol <strong>"Salin Script"</strong> di Tab 1 modal ini, lalu <strong>Paste (Tempel)</strong> ke editor Apps Script. Tekan ikon disket <strong>Save (Simpan)</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Deploy Sebagai Web App (Penerapan Baru)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Klik tombol biru <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; pilih <strong>New deployment (Penerapan baru)</strong>. Pada ikon roda gigi kiri, pilih <strong>Web app</strong>. Atur:
                    </p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5 pt-1 pl-1">
                      <li><strong>Execute as:</strong> Me (email Anda)</li>
                      <li><strong>Who has access:</strong> <span className="font-bold text-emerald-700 dark:text-emerald-400">Anyone (Siapa saja)</span> &mdash; <em>Penting agar kasir dapat mengirimkan data!</em></li>
                    </ul>
                    <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                      Klik <strong>Deploy</strong>, izinkan akses akun bila diminta, lalu salin URL Web App yang berakhiran <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">/exec</code>.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    5
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Tempel URL di GreenMart &amp; Sinkronkan
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Kembali ke aplikasi GreenMart, tempelkan URL tersebut ke kolom <strong>Google Apps Script Web App URL</strong>, lalu klik <strong>"Sinkronkan Sekarang"</strong>. Tiga sheet (Stok Barang, Riwayat Transaksi, Rekap Statistika) akan terisi otomatis secara rapi!
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternative Method 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 mt-4">
                <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Metode Alternatif: Impor Berkas (.xlsx) Manual</span>
                </div>
                <ol className="text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside space-y-1">
                  <li>Buka Tab 2 <strong>"Ekspor File (.xlsx Multi-Sheet)"</strong> lalu klik tombol <strong>"Unduh File Spreadsheet"</strong>.</li>
                  <li>Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">sheets.new</a>.</li>
                  <li>Klik menu <strong>File</strong> &gt; <strong>Import (Impor)</strong> &gt; pilih tab <strong>Upload (Unggah)</strong>.</li>
                  <li>Pilih file <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">GreenMart_Database_GoogleSpreadsheet.xlsx</code> yang sudah diunduh.</li>
                  <li>Pilih opsi <em>"Replace spreadsheet"</em> (Ganti spreadsheet) &gt; klik <strong>Import data</strong>. Selesai!</li>
                </ol>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Format 100% Kompatibel Google Sheets &amp; Excel</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
