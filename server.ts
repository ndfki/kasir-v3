import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

// In development, the dev server must always bind to port 3000 (per environment constraints).
// In production (Cloud Run), it binds to process.env.PORT (defaults to 8080).
function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const val = Number(process.argv[portArgIdx + 1]);
    if (!isNaN(val) && val > 0) return val;
  }
  if (process.env.DEFAULT_APP_PORT) {
    const val = Number(process.env.DEFAULT_APP_PORT);
    if (!isNaN(val) && val > 0) return val;
  }
  if (!isProd) {
    return 3000;
  }
  return Number(process.env.PORT) || 8080;
}

const PORT = resolvePort();

// Parse JSON and URL-encoded bodies with generous limit for data tables
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- DEVICE COMPATIBILITY & CROSS-PLATFORM HEADERS MIDDLEWARE ---
app.use((req: Request, res: Response, next: NextFunction) => {
  // Client Hints for responsive multi-device rendering
  res.setHeader(
    'Accept-CH',
    'Sec-CH-UA, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Sec-CH-UA-Model, Viewport-Width, Width, DPR'
  );
  res.setHeader('Permissions-Policy', 'ch-ua-platform=*, ch-viewport-width=*');
  res.setHeader('Vary', 'User-Agent, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Viewport-Width');

  // CORS headers allowing mobile apps, webviews, and external devices on LAN
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, User-Agent, Sec-CH-UA-Mobile, Sec-CH-UA-Platform'
  );

  // Security & Content sniffing protection
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Helper: Device Detection from User-Agent & Client Hints
function detectDeviceInfo(req: Request) {
  const ua = req.headers['user-agent'] || '';
  const chMobile = req.headers['sec-ch-ua-mobile'];
  const chPlatform = req.headers['sec-ch-ua-platform'];

  const isAndroid = /android/i.test(ua);
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isTablet = /tablet|ipad|playbook|silk/i.test(ua) || (isAndroid && !/mobile/i.test(ua));
  const isMobile = chMobile === '?1' || (!isTablet && /mobile|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua));
  const isDesktop = !isMobile && !isTablet;

  let platform = 'Unknown';
  if (chPlatform) {
    platform = String(chPlatform).replace(/"/g, '');
  } else if (isAndroid) platform = 'Android';
  else if (isIos) platform = 'iOS';
  else if (/windows/i.test(ua)) platform = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) platform = 'macOS';
  else if (/linux/i.test(ua)) platform = 'Linux';

  return {
    isMobile,
    isTablet,
    isDesktop,
    platform,
    touchCapable: isMobile || isTablet,
    recommendedViewMode: isMobile ? 'cards' : 'table',
    recommendedPageSize: isMobile ? 10 : 25,
    userAgent: ua,
    timestamp: new Date().toISOString()
  };
}

// In-Memory Backend Store for Sheets & Rows (with real CRUD & working DELETE)
interface BackendSheet {
  id: string;
  name: string;
  description: string;
  columns: any[];
  rows: any[];
  chartConfig?: any;
  createdAt: string;
  updatedAt: string;
}

let backendSheets: BackendSheet[] = [
  {
    id: 'sheet-1',
    name: 'Penjualan Toko Elektronik',
    description: 'Pencatatan data penjualan harian toko gadget dan elektronik',
    columns: [
      { id: 'col_trx', name: 'kode_transaksi', label: 'Kode Transaksi', type: 'text', isRequired: true },
      { id: 'col_name', name: 'nama_produk', label: 'Nama Produk', type: 'text', isRequired: true },
      { id: 'col_cat', name: 'kategori', label: 'Kategori Produk', type: 'category', options: ['Laptop', 'Smartphone', 'Aksesoris', 'Audio', 'Monitor'], isRequired: true },
      { id: 'col_qty', name: 'jumlah_terjual', label: 'Qty Terjual', type: 'number', isRequired: true },
      { id: 'col_price', name: 'harga_satuan', label: 'Harga Satuan (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_total', name: 'total_omset', label: 'Total Omset (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_date', name: 'tanggal_transaksi', label: 'Tanggal', type: 'date', isRequired: true },
      { id: 'col_bayar', name: 'jumlah_bayar', label: 'Jumlah Bayar (Rp)', type: 'decimal' },
      { id: 'col_piutang', name: 'sisa_piutang', label: 'Sisa Piutang (Rp)', type: 'decimal' },
      { id: 'col_status', name: 'status_pembayaran', label: 'Status Pembayaran', type: 'category', options: ['Lunas', 'Piutang', 'Uang Muka'] }
    ],
    rows: [
      {
        id: 'row-1',
        col_trx: 'TRX-2026-001',
        col_name: 'Laptop Gaming ROG 16',
        col_cat: 'Laptop',
        col_qty: 2,
        col_price: 21500000,
        col_total: 43000000,
        col_date: '2026-02-01',
        col_bayar: 43000000,
        col_piutang: 0,
        col_status: 'Lunas',
        createdAt: '2026-02-01T09:00:00.000Z',
        updatedAt: '2026-02-01T09:00:00.000Z'
      },
      {
        id: 'row-2',
        col_trx: 'TRX-2026-002',
        col_name: 'Wireless Noise Cancelling Headphone',
        col_cat: 'Audio',
        col_qty: 4,
        col_price: 1850000,
        col_total: 7400000,
        col_date: '2026-02-03',
        col_bayar: 5000000,
        col_piutang: 2400000,
        col_status: 'Piutang',
        createdAt: '2026-02-03T11:15:00.000Z',
        updatedAt: '2026-02-03T11:15:00.000Z'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// --- REST API ENDPOINTS ---

// 1. Device Info Endpoint (Diagnose device & viewport compatibility)
app.get('/api/device-info', (req: Request, res: Response) => {
  const deviceInfo = detectDeviceInfo(req);
  res.json({
    success: true,
    data: deviceInfo
  });
});

// 2. Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: isProd ? 'production' : 'development',
    port: PORT,
    sheetsCount: backendSheets.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 3. Sheets CRUD
app.get('/api/sheets', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: backendSheets
  });
});

app.post('/api/sheets', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ success: false, message: 'Nama sheet wajib diisi' });
    return;
  }

  const newSheet: BackendSheet = {
    id: 'sheet-' + Date.now(),
    name: name.trim(),
    description: (description || '').trim(),
    columns: [
      { id: 'col_name', name: 'nama_barang', label: 'Nama Barang / Transaksi', type: 'text', isRequired: true },
      { id: 'col_qty', name: 'jumlah', label: 'Jumlah / Qty', type: 'number', isRequired: true },
      { id: 'col_price', name: 'harga', label: 'Harga (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_date', name: 'tanggal', label: 'Tanggal', type: 'date', isRequired: true }
    ],
    rows: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  backendSheets.push(newSheet);
  res.status(201).json({ success: true, message: 'Sheet berhasil dibuat', data: newSheet });
});

app.put('/api/sheets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const sheet = backendSheets.find(s => s.id === id);
  if (!sheet) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }

  if (name) sheet.name = String(name).trim();
  if (description !== undefined) sheet.description = String(description).trim();
  sheet.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Sheet berhasil diperbarui', data: sheet });
});

// DELETE SHEET (Fully functioning CRUD delete)
app.delete('/api/sheets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (backendSheets.length <= 1) {
    res.status(400).json({ success: false, message: 'Tidak dapat menghapus Sheet terakhir. Sistem harus memiliki minimal 1 sheet.' });
    return;
  }

  const idx = backendSheets.findIndex(s => s.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }

  const deleted = backendSheets.splice(idx, 1)[0];
  res.json({
    success: true,
    message: `Sheet "${deleted.name}" berhasil dihapus`,
    data: { id: deleted.id, remainingSheets: backendSheets.length }
  });
});

// 4. Rows CRUD (with fully functioning DELETE ROW)
app.get('/api/sheets/:id/rows', (req: Request, res: Response) => {
  const sheet = backendSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: sheet.rows });
});

app.post('/api/sheets/:id/rows', (req: Request, res: Response) => {
  const sheet = backendSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }

  const rowData = req.body || {};
  const newRow = {
    id: 'row-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    ...rowData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sheet.rows.unshift(newRow);
  sheet.updatedAt = new Date().toISOString();

  res.status(201).json({ success: true, message: 'Baris data berhasil ditambahkan', data: newRow });
});

app.put('/api/sheets/:id/rows/:rowId', (req: Request, res: Response) => {
  const sheet = backendSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }

  const row = sheet.rows.find(r => r.id === req.params.rowId);
  if (!row) {
    res.status(404).json({ success: false, message: 'Baris data tidak ditemukan' });
    return;
  }

  Object.assign(row, req.body, { updatedAt: new Date().toISOString() });
  sheet.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Baris data berhasil diperbarui', data: row });
});

// DELETE ROW (Fully functioning CRUD delete)
app.delete('/api/sheets/:id/rows/:rowId', (req: Request, res: Response) => {
  const sheet = backendSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }

  const rowIdx = sheet.rows.findIndex(r => r.id === req.params.rowId);
  if (rowIdx === -1) {
    res.status(404).json({ success: false, message: 'Baris data tidak ditemukan' });
    return;
  }

  const deletedRow = sheet.rows.splice(rowIdx, 1)[0];
  sheet.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Baris data berhasil dihapus',
    data: { id: deletedRow.id, remainingRows: sheet.rows.length }
  });
});

// DELETE COLUMN
app.delete('/api/sheets/:id/columns/:columnId', (req: Request, res: Response) => {
  const sheet = backendSheets.find(s => s.id === req.params.id);
  if (!sheet) {
    res.status(404).json({ success: false, message: 'Sheet tidak ditemukan' });
    return;
  }

  if (sheet.columns.length <= 1) {
    res.status(400).json({ success: false, message: 'Sheet harus memiliki minimal 1 kolom.' });
    return;
  }

  const colIdx = sheet.columns.findIndex(c => c.id === req.params.columnId);
  if (colIdx === -1) {
    res.status(404).json({ success: false, message: 'Kolom tidak ditemukan' });
    return;
  }

  const deletedCol = sheet.columns.splice(colIdx, 1)[0];
  sheet.rows.forEach(r => {
    delete r[deletedCol.id];
  });
  sheet.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Kolom "${deletedCol.label}" berhasil dihapus`,
    data: { id: deletedCol.id, remainingColumns: sheet.columns.length }
  });
});

// --- SERVER SETUP (VITE MIDDLEWARE IN DEV OR STATIC IN PROD) ---
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let retryCount = 0;
  const MAX_RETRIES = 10;

  // Handle server error events such as EADDRINUSE gracefully
  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.warn(`⚠️ [Server] Port ${PORT} busy, retrying in 500ms (attempt ${retryCount}/${MAX_RETRIES})...`);
        setTimeout(() => {
          try {
            httpServer.close();
          } catch {}
          httpServer.listen(PORT, '0.0.0.0');
        }, 500);
      } else {
        console.error(`❌ [Server] Port ${PORT} is still in use after ${MAX_RETRIES} retries. Exiting.`);
        process.exit(1);
      }
    } else {
      console.error('❌ [Server] Server error:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown hooks
  const handleExit = (signal: string) => {
    console.log(`🛑 [Server] Received ${signal}, closing server...`);
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.once('SIGTERM', () => handleExit('SIGTERM'));
  process.once('SIGINT', () => handleExit('SIGINT'));

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Backend running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
    console.log(`📱 [Device Compatibility] Client-Hints, Touch Breakpoints, and Multi-Device Headers Active`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
