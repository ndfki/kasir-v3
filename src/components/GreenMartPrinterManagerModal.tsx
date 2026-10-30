import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  RefreshCw, 
  Usb, 
  Bluetooth, 
  Cpu, 
  CheckCircle2, 
  Radio, 
  Play, 
  Sliders, 
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileText,
  FileDown,
  Globe
} from 'lucide-react';
import { GreenMartTransaction } from '../types';
import { 
  PrinterDevice, 
  PrinterSettings, 
  loadSavedPrinters, 
  savePrinterDevices, 
  loadPrinterSettings, 
  savePrinterSettings, 
  detectConnectedHardwarePrinters, 
  pairUsbPrinter, 
  pairBluetoothPrinter, 
  pairSerialPrinter, 
  executeTestPrint, 
  checkBrowserPrinterCapabilities 
} from '../utils/printerDeviceManager';
import { 
  exportGreenMartReceiptPdf, 
  openReceiptDirectWebPage 
} from '../utils/receiptGenerator';

interface GreenMartPrinterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterChanged?: (printer: PrinterDevice) => void;
}

export const GreenMartPrinterManagerModal: React.FC<GreenMartPrinterManagerModalProps> = ({
  isOpen,
  onClose,
  onPrinterChanged
}) => {
  const [printers, setPrinters] = useState<PrinterDevice[]>(loadSavedPrinters);
  const [settings, setSettings] = useState<PrinterSettings>(loadPrinterSettings);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedBaudRate, setSelectedBaudRate] = useState<number>(settings.serialBaudRate || 9600);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const capabilities = checkBrowserPrinterCapabilities();

  // Scan hardware devices on modal open
  useEffect(() => {
    if (isOpen) {
      handleScanDevices(false);
      setSettings(loadPrinterSettings());
    }
  }, [isOpen]);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleScanDevices = async (manual = true) => {
    setIsScanning(true);
    try {
      const detected = await detectConnectedHardwarePrinters();
      setPrinters(detected);
      if (manual) {
        showFeedback(`Deteksi selesai: ${detected.length} perangkat printer siap digunakan (COM/USB/BT/OS)`, 'success');
      }
    } catch (err: any) {
      console.warn('Scan error:', err);
      if (manual) {
        showFeedback('Gagal memindai perangkat.', 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectActivePrinter = (printer: PrinterDevice) => {
    const updatedSettings: PrinterSettings = {
      ...settings,
      activePrinterId: printer.id,
      paperWidth: printer.paperWidth
    };
    setSettings(updatedSettings);
    savePrinterSettings(updatedSettings);

    const updatedPrinters = printers.map(p => ({
      ...p,
      isDefault: p.id === printer.id,
      status: p.id === printer.id ? 'connected' as const : p.status
    }));
    setPrinters(updatedPrinters);
    savePrinterDevices(updatedPrinters);

    if (onPrinterChanged) {
      onPrinterChanged(printer);
    }
    showFeedback(`Printer aktif diubah ke: ${printer.name}`, 'success');
  };

  const handleToggleAutoPrint = (enabled: boolean) => {
    const updated = { ...settings, autoPrintOnComplete: enabled };
    setSettings(updated);
    savePrinterSettings(updated);
    showFeedback(
      enabled 
        ? '⚡ Cetak Struk Otomatis DIAKTIFKAN: Struk akan langsung keluar saat transaksi kasir lunas.' 
        : 'Cetak Struk Otomatis dinonaktifkan (Manual).',
      'info'
    );
  };

  const handleTogglePaperWidth = (width: '58mm' | '80mm') => {
    const updatedSettings = { ...settings, paperWidth: width };
    setSettings(updatedSettings);
    savePrinterSettings(updatedSettings);

    // Update active printer width
    const updatedPrinters = printers.map(p => 
      p.id === settings.activePrinterId ? { ...p, paperWidth: width } : p
    );
    setPrinters(updatedPrinters);
    savePrinterDevices(updatedPrinters);

    showFeedback(`Format lebar kertas diatur ke ${width}`, 'info');
  };

  const handlePairUsb = async () => {
    try {
      const newDevice = await pairUsbPrinter();
      if (newDevice) {
        setPrinters(loadSavedPrinters());
        handleSelectActivePrinter(newDevice);
        showFeedback(`Printer USB "${newDevice.name}" berhasil disambungkan!`, 'success');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Gagal menyambungkan printer USB', 'error');
    }
  };

  const handlePairBluetooth = async () => {
    try {
      const newDevice = await pairBluetoothPrinter();
      if (newDevice) {
        setPrinters(loadSavedPrinters());
        handleSelectActivePrinter(newDevice);
        showFeedback(`Printer Bluetooth "${newDevice.name}" terhubung!`, 'success');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Gagal menyambungkan Bluetooth printer', 'error');
    }
  };

  const handlePairSerial = async (baud: number = selectedBaudRate) => {
    try {
      const newDevice = await pairSerialPrinter(baud);
      if (newDevice) {
        setPrinters(loadSavedPrinters());
        handleSelectActivePrinter(newDevice);
        showFeedback(`Port Serial COM POS "${newDevice.name}" terhubung pada ${baud} baud!`, 'success');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Gagal menyambungkan port serial COM', 'error');
    }
  };

  const sampleTestTrx: GreenMartTransaction = {
    id: 'test-print-preview',
    invoiceNumber: `GM-TEST-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0],
    cashierName: 'Kasir Uji Coba POS',
    customerName: 'Pelanggan Kalibrasi Printer',
    items: [
      {
        productId: 'p-test-1',
        barcode: '8991234567890',
        name: 'Beras Premium Ramos 5 Kg',
        category: 'Beras & Sembako',
        qty: 1,
        unit: 'Sak',
        costPrice: 65000,
        unitPrice: 72000,
        discountPercent: 0,
        subtotal: 72000
      },
      {
        productId: 'p-test-2',
        barcode: '8999876543210',
        name: 'Minyak Goreng Refill 2 Liter',
        category: 'Minyak & Mentega',
        qty: 2,
        unit: 'Pcs',
        costPrice: 31000,
        unitPrice: 34500,
        discountPercent: 5,
        subtotal: 65550
      }
    ],
    totalItemsCount: 3,
    subtotal: 141000,
    discountTotal: 3450,
    grandTotal: 137550,
    paymentMethod: 'tunai',
    cashGiven: 150000,
    changeAmount: 12450,
    paymentStatus: 'Lunas',
    createdAt: new Date().toISOString()
  };

  const handleTestPrint = (targetPrinter?: PrinterDevice) => {
    const printerToTest = targetPrinter || printers.find(p => p.id === settings.activePrinterId) || printers[0];
    if (!printerToTest) {
      showFeedback('Tidak ada printer yang dipilih', 'error');
      return;
    }

    try {
      executeTestPrint(printerToTest);
      showFeedback(`Mengirim tiket tes cetak ke "${printerToTest.name}"...`, 'info');
    } catch (err: any) {
      showFeedback(`Gagal tes cetak: ${err.message}`, 'error');
    }
  };

  const handleTestDirectWeb = () => {
    try {
      openReceiptDirectWebPage(sampleTestTrx, {
        paperWidth: settings.paperWidth,
        activePrinterName: activePrinter.name,
        autoPrint: false
      });
      showFeedback('Halaman web struk tes dibuka di tab baru!', 'success');
    } catch (e: any) {
      showFeedback('Gagal membuka halaman web struk.', 'error');
    }
  };

  const handleTestExportPdf = () => {
    try {
      exportGreenMartReceiptPdf(sampleTestTrx, {
        paperWidth: settings.paperWidth,
        printerName: activePrinter.name
      });
      showFeedback('Berkas PDF struk uji coba berhasil diunduh!', 'success');
    } catch (e: any) {
      showFeedback('Gagal mengunduh PDF struk.', 'error');
    }
  };

  if (!isOpen) return null;

  const activePrinter = printers.find(p => p.id === settings.activePrinterId) || printers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/15 backdrop-blur-xs">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Deteksi &amp; Pengaturan Device Printer POS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  AUTO-DETECT
                </span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Pindai printer thermal USB, Bluetooth mini, Serial COM, dan driver OS perangkat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' 
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200'
              : 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200'
          }`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 text-xs">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          
          {/* Active Printer Status Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Printer Kasir Aktif Saat Ini</span>
              </span>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {activePrinter.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Koneksi: <span className="font-bold uppercase text-emerald-700 dark:text-emerald-300">{activePrinter.connectionType}</span> &bull; Lebar Kertas: <span className="font-bold">{settings.paperWidth}</span> &bull; {activePrinter.details?.deviceName || 'Siap Cetak'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleTestExportPdf}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Unduh contoh berkas PDF struk"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF Struk</span>
              </button>

              <button
                type="button"
                onClick={handleTestDirectWeb}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Buka tampilan struk di halaman web baru (Direct Print Web)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web Struk</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestPrint(activePrinter)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Cetak struk kalibrasi uji coba ke printer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Tes Cetak</span>
              </button>
            </div>
          </div>

          {/* Auto-Print Feature Showcase Banner */}
          <div className="bg-gradient-to-r from-emerald-900/90 to-teal-900/90 text-white p-4 rounded-2xl border border-emerald-500/40 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  Fitur Cetak Struk Otomatis (Auto-Print)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  settings.autoPrintOnComplete 
                    ? 'bg-emerald-400 text-slate-950 shadow-xs' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {settings.autoPrintOnComplete ? 'AKTIF (OTOMATIS)' : 'NONAKTIF (MANUAL)'}
                </span>
              </div>
              <p className="text-xs text-slate-200">
                Saat diaktifkan, struk thermal kasir akan langsung dicetak otomatis ke printer saat transaksi lunas tanpa perlu klik manual.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleAutoPrint(!settings.autoPrintOnComplete)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 shadow-md ${
                settings.autoPrintOnComplete
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
              }`}
            >
              {settings.autoPrintOnComplete ? '⚡ Auto-Print ON' : 'Aktifkan Auto-Print'}
            </button>
          </div>

          {/* Quick Paper Width & Preferences */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Format Kertas Struk Kasir
              </span>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleTogglePaperWidth('58mm')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                    settings.paperWidth === '58mm'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  58mm (Standar Mini)
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePaperWidth('80mm')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                    settings.paperWidth === '80mm'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  80mm (Lebar Supermarket)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoCut}
                  onChange={(e) => {
                    const next = { ...settings, autoCut: e.target.checked };
                    setSettings(next);
                    savePrinterSettings(next);
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Potong kertas otomatis (Auto Paper Cut)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.autoPrintOnComplete}
                  onChange={(e) => handleToggleAutoPrint(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-bold text-emerald-700 dark:text-emerald-400">
                  ⚡ Auto-Print Struk Setiap Transaksi
                </span>
              </label>
            </div>
          </div>

          {/* Connected Device List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Daftar Device Printer Terdeteksi ({printers.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => handleScanDevices(true)}
                disabled={isScanning}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Memindai...' : 'Pindai Ulang'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {printers.map((printer) => {
                const isSelected = printer.id === settings.activePrinterId;
                return (
                  <div
                    key={printer.id}
                    onClick={() => handleSelectActivePrinter(printer)}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {printer.connectionType === 'usb' ? (
                          <Usb className="w-5 h-5" />
                        ) : printer.connectionType === 'bluetooth' ? (
                          <Bluetooth className="w-5 h-5" />
                        ) : printer.connectionType === 'serial' ? (
                          <Cpu className="w-5 h-5" />
                        ) : (
                          <Printer className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {printer.name}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {printer.details?.deviceName || printer.details?.vendorName || 'Perangkat Cetak POS'} &bull; Format: {printer.paperWidth}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestPrint(printer);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                        title="Tes cetak ke printer ini"
                      >
                        <Play className="w-4 h-4" />
                      </button>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add / Pair New Device Buttons */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pemasangan Device Printer Baru (Transport Hardware)
              </span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                WebUSB &bull; WebSerial &bull; WebBluetooth
              </span>
            </div>

            {/* Serial COM Baud Rate Selector */}
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                  <span>Kecepatan Baud Rate Port Serial COM:</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Untuk adapter USB-to-RS232/TTL (CH340, FTDI, CP2102, Prolific). Default thermal 9600 bps.
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {[9600, 19200, 38400, 115200].map((baud) => (
                  <button
                    key={baud}
                    type="button"
                    onClick={() => {
                      setSelectedBaudRate(baud);
                      const updated = { ...settings, serialBaudRate: baud };
                      setSettings(updated);
                      savePrinterSettings(updated);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                      selectedBaudRate === baud
                        ? 'bg-purple-600 text-white border-purple-500 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                    }`}
                  >
                    {baud}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Button USB */}
              <button
                type="button"
                onClick={handlePairUsb}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 transition cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                    <Usb className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    USB POS
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600">
                  Kabel USB Langsung
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Epson, Xprinter, POS-58/80
                </p>
              </button>

              {/* Button Bluetooth */}
              <button
                type="button"
                onClick={handlePairBluetooth}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-slate-800 dark:text-slate-200 transition cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 group-hover:scale-105 transition-transform">
                    <Bluetooth className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    BLE / SPP
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                  Bluetooth Wireless POS
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Panda, Iware, Mini Portable
                </p>
              </button>

              {/* Button Serial COM */}
              <button
                type="button"
                onClick={() => handlePairSerial(selectedBaudRate)}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 text-slate-800 dark:text-slate-200 transition cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                    {selectedBaudRate} baud
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600">
                  Konektor Port Serial COM
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  CH340, FTDI, CP2102, USB-COM
                </p>
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400">
              * Driver Printer Sistem OS otomatis mendeteksi printer apapun yang terinstall di Windows, macOS, Linux, atau Android termasuk printer jaringan/WiFi.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Perangkat Terpilih: <span className="font-bold text-slate-900 dark:text-white">{activePrinter.name}</span> ({settings.paperWidth})
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Selesai &amp; Simpan
          </button>
        </div>

      </div>
    </div>
  );
};
