import { GreenMartTransaction } from '../types';

export type PrinterConnectionType = 'system' | 'usb' | 'bluetooth' | 'serial' | 'network';

export interface PrinterDevice {
  id: string;
  name: string;
  connectionType: PrinterConnectionType;
  status: 'connected' | 'ready' | 'offline';
  paperWidth: '58mm' | '80mm';
  isDefault: boolean;
  lastConnected?: string;
  details?: {
    vendorName?: string;
    vendorId?: string | number;
    productId?: string | number;
    serialNumber?: string;
    deviceName?: string;
    ipAddress?: string;
    port?: number;
    bluetoothId?: string;
    baudRate?: number; // COM Serial Baud Rate (e.g. 9600, 19200, 38400, 115200)
    comPort?: string;
  };
}

export interface PrinterSettings {
  activePrinterId: string;
  paperWidth: '58mm' | '80mm';
  autoCut: boolean;
  autoPrintOnComplete: boolean;
  printCopies: number;
  showLogo: boolean;
  customFooterText: string;
  serialBaudRate?: number;
}

const STORAGE_PRINTER_DEVICES_KEY = 'greenmart_printer_devices_v2';
const STORAGE_PRINTER_SETTINGS_KEY = 'greenmart_printer_settings_v2';

// Initial default printers
export const defaultPrinters: PrinterDevice[] = [
  {
    id: 'printer-system-default',
    name: 'Driver Printer Sistem OS (Default)',
    connectionType: 'system',
    status: 'connected',
    paperWidth: '58mm',
    isDefault: true,
    details: {
      deviceName: 'System Spooler (Windows / macOS / Android / Linux)',
      vendorName: 'Universal Thermal / Inkjet / Laser Driver'
    }
  },
  {
    id: 'printer-pos-58-usb',
    name: 'Epson / Xprinter POS-58 USB Thermal',
    connectionType: 'usb',
    status: 'ready',
    paperWidth: '58mm',
    isDefault: false,
    details: {
      vendorName: 'Epson / Xprinter Inc.',
      vendorId: '0x04b8',
      productId: '0x0202',
      deviceName: 'USB Thermal Receipt Printer'
    }
  },
  {
    id: 'printer-com-serial',
    name: 'Port Serial COM USB (CH340 / FTDI)',
    connectionType: 'serial',
    status: 'ready',
    paperWidth: '58mm',
    isDefault: false,
    details: {
      vendorName: 'USB to COM / RS232 Adapter',
      deviceName: 'COM Connector USB Thermal (9600 baud)',
      baudRate: 9600
    }
  },
  {
    id: 'printer-bt-mini',
    name: 'Panda / Iware Mini Bluetooth 58mm',
    connectionType: 'bluetooth',
    status: 'ready',
    paperWidth: '58mm',
    isDefault: false,
    details: {
      vendorName: 'Panda Mobile POS',
      deviceName: 'RPP-02N Bluetooth SPP'
    }
  }
];

export const defaultPrinterSettings: PrinterSettings = {
  activePrinterId: 'printer-system-default',
  paperWidth: '58mm',
  autoCut: true,
  autoPrintOnComplete: true, // Default ON for automatic cashier printing
  printCopies: 1,
  showLogo: true,
  customFooterText: 'Simpan struk ini sebagai bukti pembayaran sah',
  serialBaudRate: 9600
};

/**
 * Checks capabilities of current browser environment
 */
export function checkBrowserPrinterCapabilities() {
  const isUsbSupported = typeof navigator !== 'undefined' && 'usb' in navigator;
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  const isSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const isSystemPrintSupported = typeof window !== 'undefined' && typeof window.print === 'function';

  return {
    usb: isUsbSupported,
    bluetooth: isBluetoothSupported,
    serial: isSerialSupported,
    system: isSystemPrintSupported
  };
}

/**
 * Load saved printers from localStorage or fallback
 */
export function loadSavedPrinters(): PrinterDevice[] {
  try {
    const saved = localStorage.getItem(STORAGE_PRINTER_DEVICES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load printer devices:', e);
  }
  return defaultPrinters;
}

/**
 * Save printer list to localStorage
 */
export function savePrinterDevices(devices: PrinterDevice[]): void {
  try {
    localStorage.setItem(STORAGE_PRINTER_DEVICES_KEY, JSON.stringify(devices));
  } catch (e) {
    console.warn('Failed to save printer devices:', e);
  }
}

/**
 * Load printer settings
 */
export function loadPrinterSettings(): PrinterSettings {
  try {
    const saved = localStorage.getItem(STORAGE_PRINTER_SETTINGS_KEY);
    if (saved) {
      return { ...defaultPrinterSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load printer settings:', e);
  }
  return defaultPrinterSettings;
}

/**
 * Save printer settings
 */
export function savePrinterSettings(settings: PrinterSettings): void {
  try {
    localStorage.setItem(STORAGE_PRINTER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save printer settings:', e);
  }
}

/**
 * Detect already authorized or connected devices via WebUSB and WebSerial
 */
export async function detectConnectedHardwarePrinters(): Promise<PrinterDevice[]> {
  const currentList = loadSavedPrinters();
  const updatedList = [...currentList];

  // 1. Detect USB Devices
  if (typeof navigator !== 'undefined' && 'usb' in navigator) {
    try {
      // @ts-expect-error WebUSB standard API
      const usbDevices: any[] = await navigator.usb.getDevices();
      usbDevices.forEach(device => {
        const id = `usb-${device.vendorId}-${device.productId}`;
        const existingIdx = updatedList.findIndex(p => p.id === id);
        const name = device.productName || `USB Thermal (${device.vendorId?.toString(16)}:${device.productId?.toString(16)})`;
        
        const deviceData: PrinterDevice = {
          id,
          name,
          connectionType: 'usb',
          status: 'connected',
          paperWidth: '58mm',
          isDefault: false,
          lastConnected: new Date().toLocaleTimeString('id-ID'),
          details: {
            vendorName: device.manufacturerName || 'USB Device',
            vendorId: device.vendorId,
            productId: device.productId,
            serialNumber: device.serialNumber
          }
        };

        if (existingIdx !== -1) {
          updatedList[existingIdx] = { ...updatedList[existingIdx], ...deviceData, status: 'connected' };
        } else {
          updatedList.push(deviceData);
        }
      });
    } catch (err) {
      console.warn('USB detection scan error:', err);
    }
  }

  // 2. Detect Serial Devices
  if (typeof navigator !== 'undefined' && 'serial' in navigator) {
    try {
      // @ts-expect-error WebSerial standard API
      const serialPorts: any[] = await navigator.serial.getPorts();
      serialPorts.forEach((port, idx) => {
        const info = port.getInfo ? port.getInfo() : {};
        const id = `serial-${info.usbVendorId || idx}-${info.usbProductId || idx}`;
        const existingIdx = updatedList.findIndex(p => p.id === id);
        
        const deviceData: PrinterDevice = {
          id,
          name: `Port Serial / COM POS #${idx + 1}`,
          connectionType: 'serial',
          status: 'connected',
          paperWidth: '58mm',
          isDefault: false,
          lastConnected: new Date().toLocaleTimeString('id-ID'),
          details: {
            vendorId: info.usbVendorId,
            productId: info.usbProductId,
            deviceName: `COM Port Serial`
          }
        };

        if (existingIdx !== -1) {
          updatedList[existingIdx] = { ...updatedList[existingIdx], ...deviceData, status: 'connected' };
        } else {
          updatedList.push(deviceData);
        }
      });
    } catch (err) {
      console.warn('Serial detection scan error:', err);
    }
  }

  savePrinterDevices(updatedList);
  return updatedList;
}

/**
 * Request pair new USB printer via browser native picker
 */
export async function pairUsbPrinter(): Promise<PrinterDevice | null> {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) {
    throw new Error('WebUSB tidak didukung di browser ini. Gunakan Google Chrome, Microsoft Edge, atau Opera.');
  }

  try {
    // @ts-expect-error WebUSB standard API
    const device = await navigator.usb.requestDevice({ filters: [] });
    if (!device) return null;

    const id = `usb-${device.vendorId}-${device.productId}`;
    const newDevice: PrinterDevice = {
      id,
      name: device.productName || `USB POS Printer (${device.vendorId})`,
      connectionType: 'usb',
      status: 'connected',
      paperWidth: '58mm',
      isDefault: false,
      lastConnected: new Date().toLocaleTimeString('id-ID'),
      details: {
        vendorName: device.manufacturerName || 'Vendor USB',
        vendorId: device.vendorId,
        productId: device.productId,
        serialNumber: device.serialNumber
      }
    };

    const current = loadSavedPrinters().filter(p => p.id !== id);
    const updated = [newDevice, ...current];
    savePrinterDevices(updated);
    return newDevice;
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return null; // User cancelled
    }
    throw err;
  }
}

/**
 * Request pair new Bluetooth mini thermal printer
 */
export async function pairBluetoothPrinter(): Promise<PrinterDevice | null> {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth tidak didukung di browser ini. Pastikan Bluetooth aktif di perangkat.');
  }

  try {
    // @ts-expect-error WebBluetooth standard API
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    if (!device) return null;

    const id = `bt-${device.id || Date.now()}`;
    const newDevice: PrinterDevice = {
      id,
      name: device.name ? `${device.name} (Bluetooth POS)` : 'Mini Thermal Bluetooth Printer',
      connectionType: 'bluetooth',
      status: 'connected',
      paperWidth: '58mm',
      isDefault: false,
      lastConnected: new Date().toLocaleTimeString('id-ID'),
      details: {
        deviceName: device.name || 'Bluetooth Receipt Printer',
        bluetoothId: device.id
      }
    };

    const current = loadSavedPrinters().filter(p => p.id !== id);
    const updated = [newDevice, ...current];
    savePrinterDevices(updated);
    return newDevice;
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return null;
    }
    throw err;
  }
}

/**
 * Pair serial / COM port printer with configurable baud rate
 */
export async function pairSerialPrinter(baudRate: number = 9600): Promise<PrinterDevice | null> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    throw new Error('Web Serial tidak didukung di browser ini. Gunakan browser modern (Google Chrome, MS Edge, Opera) di PC/Laptop.');
  }

  try {
    // @ts-expect-error WebSerial standard API
    const port = await navigator.serial.requestPort();
    if (!port) return null;

    const info = port.getInfo ? port.getInfo() : {};
    const hexVendor = info.usbVendorId ? `0x${info.usbVendorId.toString(16)}` : 'USB-COM';
    const hexProduct = info.usbProductId ? `0x${info.usbProductId.toString(16)}` : '';
    const id = `serial-${info.usbVendorId || Date.now()}-${info.usbProductId || Date.now()}`;
    
    const newDevice: PrinterDevice = {
      id,
      name: `Konektor COM Serial (${baudRate} baud)`,
      connectionType: 'serial',
      status: 'connected',
      paperWidth: '58mm',
      isDefault: true,
      lastConnected: new Date().toLocaleTimeString('id-ID'),
      details: {
        vendorName: 'USB-to-Serial COM Bridge (CH340/FTDI/PL2303)',
        deviceName: `Port Serial COM (${baudRate} bps)`,
        vendorId: hexVendor,
        productId: hexProduct,
        baudRate
      }
    };

    const current = loadSavedPrinters().filter(p => p.id !== id);
    const updated = [newDevice, ...current];
    savePrinterDevices(updated);

    // Also update active printer settings
    const settings = loadPrinterSettings();
    savePrinterSettings({
      ...settings,
      activePrinterId: newDevice.id,
      serialBaudRate: baudRate
    });

    return newDevice;
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return null;
    }
    throw err;
  }
}

/**
 * Generates printer-ready HTML receipt content formatted specifically for POS thermal rolls
 */
export function generateThermalReceiptHtml(
  transaction: GreenMartTransaction,
  settings: PrinterSettings,
  isAutoPrint: boolean = false
): string {
  const is80mm = settings.paperWidth === '80mm';
  const paperWidthCss = is80mm ? '74mm' : '54mm';
  const pageCss = is80mm ? '80mm auto' : '58mm auto';
  const isSettled = Boolean(transaction.settledAt);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Struk GreenMart - ${transaction.invoiceNumber}</title>
      <style>
        @page { size: ${pageCss}; margin: 2mm; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: ${is80mm ? '12px' : '11px'};
          line-height: 1.35;
          color: #000;
          width: ${paperWidthCss};
          margin: 0 auto;
          padding: 2mm;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .double-line { border-top: 2px dashed #000; margin: 5px 0; }
        .flex { display: flex; justify-content: space-between; }
        .settled-badge {
          border: 1px solid #000;
          padding: 3px;
          text-align: center;
          font-weight: bold;
          margin: 4px 0;
          font-size: 10px;
        }
        .auto-tag {
          font-size: 8px;
          text-align: center;
          margin-bottom: 2px;
          font-style: italic;
        }
        @media print {
          body { width: 100%; margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${isAutoPrint ? '<div class="auto-tag">[CETAK OTOMATIS SISTEM KASIR]</div>' : ''}
      <div class="text-center bold" style="font-size: 13px;">GREENMART SUPERMARKET</div>
      <div class="text-center" style="font-size: 9px;">Koperasi &amp; Lab Praktik Transaksi Sekolah</div>
      <div class="text-center" style="font-size: 8px;">Jl. Raya Utama No. 88 &bull; Telp: (021) 7890-1234</div>
      <div class="line"></div>
      <div class="flex"><span>No. Nota:</span><span class="bold">${transaction.invoiceNumber}</span></div>
      <div class="flex"><span>Waktu:</span><span>${transaction.date} ${transaction.time}</span></div>
      <div class="flex"><span>Kasir:</span><span class="bold">${transaction.cashierName}</span></div>
      <div class="flex"><span>Pelanggan:</span><span>${transaction.customerName}</span></div>
      ${transaction.customerPhone ? `<div class="flex"><span>No. HP/WA:</span><span>${transaction.customerPhone}</span></div>` : ''}
      ${isSettled ? `
        <div class="settled-badge">
          *** BUKTI PELUNASAN PIUTANG RESMI ***<br/>
          STATUS: LUNAS TERBAYAR
        </div>
      ` : ''}
      <div class="double-line"></div>
      ${transaction.items.map(item => `
        <div style="margin-bottom: 3px;">
          <div class="bold">${item.name}</div>
          <div class="flex">
            <span>  ${item.qty} ${item.unit} x Rp ${item.unitPrice.toLocaleString('id-ID')}</span>
            <span class="bold">Rp ${item.subtotal.toLocaleString('id-ID')}</span>
          </div>
          ${item.discountPercent > 0 ? `<div class="flex" style="font-size: 9px; color: #333;"><span>  Potongan Diskon (${item.discountPercent}%)</span><span>-Rp ${Math.round(item.unitPrice * item.qty * item.discountPercent / 100).toLocaleString('id-ID')}</span></div>` : ''}
        </div>
      `).join('')}
      <div class="line"></div>
      <div class="flex"><span>Total Barang:</span><span>${transaction.totalItemsCount} Unit</span></div>
      <div class="flex"><span>Subtotal:</span><span>Rp ${transaction.subtotal.toLocaleString('id-ID')}</span></div>
      ${transaction.discountTotal > 0 ? `<div class="flex"><span>Total Potongan:</span><span>-Rp ${transaction.discountTotal.toLocaleString('id-ID')}</span></div>` : ''}
      <div class="line"></div>
      <div class="flex bold" style="font-size: 13px;">
        <span>TOTAL BELANJA:</span>
        <span>Rp ${transaction.grandTotal.toLocaleString('id-ID')}</span>
      </div>
      <div class="line"></div>
      <div class="flex"><span>Metode Bayar:</span><span class="bold">${transaction.paymentMethod.toUpperCase()}</span></div>
      ${isSettled ? `
        <div class="flex"><span>Status:</span><span class="bold">LUNAS</span></div>
        <div class="flex"><span>Tgl Pelunasan:</span><span class="bold">${transaction.settledAt}</span></div>
        <div class="flex"><span>Pelunasan:</span><span class="bold">${(transaction.settledMethod || 'tunai').toUpperCase()}</span></div>
        <div class="flex"><span>Uang Diterima:</span><span class="bold">Rp ${(transaction.settledAmount || transaction.grandTotal).toLocaleString('id-ID')}</span></div>
        <div class="flex bold"><span>SISA PIUTANG:</span><span>Rp 0 (LUNAS)</span></div>
        ${transaction.settledNotes ? `<div class="flex"><span>Catatan:</span><span>${transaction.settledNotes}</span></div>` : ''}
      ` : `
        <div class="flex"><span>Bayar (Cash):</span><span class="bold">Rp ${transaction.cashGiven.toLocaleString('id-ID')}</span></div>
        <div class="flex bold">
          <span>${transaction.changeAmount >= 0 ? 'KEMBALIAN:' : 'SISA PIUTANG:'}</span>
          <span>Rp ${Math.abs(transaction.changeAmount).toLocaleString('id-ID')}</span>
        </div>
        <div class="flex"><span>Status:</span><span class="bold">${transaction.paymentStatus}</span></div>
      `}
      <div class="double-line"></div>
      <div class="text-center bold" style="margin-top: 3px;">Terima Kasih Atas Kunjungan Anda!</div>
      <div class="text-center" style="font-size: 8px;">${settings.customFooterText || 'Simpan struk ini sebagai bukti pembayaran sah'}</div>
      <div class="text-center" style="font-size: 7px; color: #555; margin-top: 2px;">Cetak: ${settings.paperWidth} &bull; GreenMart POS Engine</div>
      ${settings.autoCut ? '<div style="height: 18mm;"></div>' : '<div style="height: 8mm;"></div>'}
    </body>
    </html>
  `;
}

/**
 * Execute direct receipt print to printer device
 */
export async function executeDirectReceiptPrint(
  transaction: GreenMartTransaction,
  targetPrinter?: PrinterDevice,
  customSettings?: PrinterSettings,
  isAutoPrint: boolean = false
): Promise<boolean> {
  const settings = customSettings || loadPrinterSettings();
  const printers = loadSavedPrinters();
  const printer = targetPrinter || printers.find(p => p.id === settings.activePrinterId) || printers[0];

  const htmlContent = generateThermalReceiptHtml(transaction, settings, isAutoPrint);

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

  return new Promise((resolve) => {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (e) {
          console.warn('Iframe print error, falling back to window print:', e);
          try {
            window.print();
            resolve(true);
          } catch {
            resolve(false);
          }
        }
      }, 200);
    } else {
      window.print();
      resolve(true);
    }
  });
}

/**
 * Automatically trigger receipt printing if autoPrintOnComplete is enabled
 */
export async function autoPrintReceiptIfEnabled(
  transaction: GreenMartTransaction,
  targetPrinter?: PrinterDevice,
  customSettings?: PrinterSettings
): Promise<boolean> {
  const settings = customSettings || loadPrinterSettings();
  if (!settings.autoPrintOnComplete) {
    return false;
  }

  return await executeDirectReceiptPrint(transaction, targetPrinter, settings, true);
}

/**
 * Execute a test print ticket to calibrate and verify the printer hardware
 */
export function executeTestPrint(printer: PrinterDevice): void {
  const is80mm = printer.paperWidth === '80mm';
  const paperWidthCss = is80mm ? '74mm' : '54mm';
  const pageCss = is80mm ? '80mm auto' : '58mm auto';

  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Uji Coba Printer - GreenMart POS</title>
      <style>
        @page { size: ${pageCss}; margin: 2mm; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.35;
          color: #000;
          width: ${paperWidthCss};
          margin: 0 auto;
          padding: 2mm;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .double-line { border-top: 2px dashed #000; margin: 5px 0; }
        .flex { display: flex; justify-content: space-between; }
        .box {
          border: 1px solid #000;
          padding: 4px;
          margin: 4px 0;
          text-align: center;
        }
        @media print {
          body { width: 100%; margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="text-center bold" style="font-size: 13px;">GREENMART POS</div>
      <div class="text-center bold">TES CETAK &amp; KALIBRASI DEVICE</div>
      <div class="line"></div>
      
      <div class="box">
        <div class="bold">STATUS: SUKSES TERHUBUNG</div>
        <div style="font-size: 9px;">Printer Device Berfungsi Normal</div>
      </div>

      <div class="flex"><span>Nama Device:</span><span class="bold">${printer.name}</span></div>
      <div class="flex"><span>Koneksi:</span><span class="bold">${printer.connectionType.toUpperCase()}</span></div>
      <div class="flex"><span>Ukuran Kertas:</span><span class="bold">${printer.paperWidth}</span></div>
      <div class="flex"><span>Waktu Uji:</span><span>${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</span></div>
      ${printer.details?.baudRate ? `<div class="flex"><span>Baud Rate COM:</span><span class="bold">${printer.details.baudRate} bps</span></div>` : ''}
      ${printer.details?.vendorName ? `<div class="flex"><span>Vendor:</span><span>${printer.details.vendorName}</span></div>` : ''}

      <div class="line"></div>
      <div class="text-center bold">PENGUJIAN FONT &amp; TULISAN</div>
      <div>Standar : 1234567890 ABCDEFG</div>
      <div class="bold">Tebal    : Rp 125.000 (LUNAS)</div>
      <div style="letter-spacing: 2px;">Spasi    : T E R B A C A</div>
      
      <div class="line"></div>
      <div class="text-center bold">UJI BARCODE SIMULASI</div>
      <div class="text-center" style="font-size: 14px; letter-spacing: 3px; font-weight: bold; margin: 4px 0;">
        |||| | ||||| || |||||| |
      </div>
      <div class="text-center" style="font-size: 9px; font-family: monospace;">GM-TEST-8991234567</div>

      <div class="double-line"></div>
      <div class="text-center bold">UJI CETAK SELESAI</div>
      <div class="text-center" style="font-size: 9px;">Perangkat printer siap mencetak transaksi kasir GreenMart secara otomatis.</div>
      <div style="height: 18mm;"></div>
    </body>
    </html>
  `;

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
  if (doc) {
    doc.open();
    doc.write(testHtml);
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
}
