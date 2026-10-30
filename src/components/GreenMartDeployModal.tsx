import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Database, 
  FileCode, 
  Server, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink, 
  Terminal, 
  FolderArchive,
  Layers,
  Sparkles
} from 'lucide-react';
import { GreenMartProduct, GreenMartTransaction } from '../types';
import { 
  generateGreenMartSql, 
  getGreenMartPhpConfig, 
  getGreenMartPhpApi, 
  getGreenMartPhpIndex, 
  getGreenMartPhpKasir, 
  getGreenMartPhpProduk, 
  getGreenMartPhpTransaksi, 
  getGreenMartPanduanInstalasi,
  downloadGreenMartSuiteZip 
} from '../utils/greenmartZipGenerator';

interface GreenMartDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: GreenMartProduct[];
  transactions: GreenMartTransaction[];
}

export const GreenMartDeployModal: React.FC<GreenMartDeployModalProps> = ({
  isOpen,
  onClose,
  products,
  transactions
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'sql' | 'xampp' | 'virtualbox' | 'code'>('download');
  const [selectedCodeFile, setSelectedCodeFile] = useState<'config' | 'api' | 'index' | 'kasir' | 'produk' | 'transaksi'>('config');
  const [copied, setCopied] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sqlContent = generateGreenMartSql(products, transactions);
  const panduanContent = getGreenMartPanduanInstalasi();

  const codeFiles = {
    config: { name: 'config.php', content: getGreenMartPhpConfig() },
    api: { name: 'api.php', content: getGreenMartPhpApi() },
    index: { name: 'index.php', content: getGreenMartPhpIndex() },
    kasir: { name: 'kasir.php', content: getGreenMartPhpKasir() },
    produk: { name: 'produk.php', content: getGreenMartPhpProduk() },
    transaksi: { name: 'transaksi.php', content: getGreenMartPhpTransaksi() }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      await downloadGreenMartSuiteZip(products, transactions);
    } catch (e) {
      console.error(e);
      setDownloadError('Gagal membuat file ZIP. Silakan coba kembali.');
      setTimeout(() => setDownloadError(null), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src="/assets/aistudio/GM_Logo-ai_f89efb6e.png" 
                alt="GreenMart Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Deploy GreenMart ke XAMPP &amp; VirtualBox Linux
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  PHP &amp; MySQL
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Download paket mandiri .ZIP &bull; Skrip SQL database lengkap &bull; Panduan instalasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('download')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'download'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Download Paket .ZIP</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>2. Skrip SQL Database</span>
          </button>

          <button
            onClick={() => setActiveTab('xampp')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'xampp'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. Panduan XAMPP</span>
          </button>

          <button
            onClick={() => setActiveTab('virtualbox')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'virtualbox'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>4. Panduan VirtualBox Linux</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>5. Source Code PHP</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white dark:bg-slate-900">
          
          {/* TAB 1: DOWNLOAD ZIP */}
          {activeTab === 'download' && (
            <div className="max-w-2xl mx-auto space-y-6 text-center py-4">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                <FolderArchive className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Unduh Paket Komplet GreenMart (.ZIP)
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                  Paket siap pakai berisi seluruh source code PHP Native, skrip database MySQL (<code className="font-mono text-emerald-600">database_greenmart.sql</code>), dan buku panduan instalasi lengkap.
                </p>
              </div>

              {/* Package Content List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>database_greenmart.sql</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tabel produk, transaksi, detail, rekap, serta query view kalkulasi otomatis Modus &amp; Mean.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>kasir.php &amp; index.php</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Layar Kasir POS barcode scanner, keranjang, kembalian, dan dashboard statistik interaktif.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>produk.php &amp; transaksi.php</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Manajemen stok barang, auto-restock, dan riwayat nota cetak struk thermal.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PANDUAN_INSTALASI.md</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Panduan instalasi XAMPP dan VirtualBox Ubuntu langkah demi langkah lengkap.
                  </p>
                </div>
              </div>

              {/* Big Download Button */}
              <div className="pt-2 space-y-2">
                {downloadError && (
                  <div className="p-3 max-w-md mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    {downloadError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isDownloading}
                  className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span>{isDownloading ? 'Sedang Memaketkan File ZIP...' : 'Unduh Sekarang (GreenMart_Suite.zip)'}</span>
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Kompatibel dengan XAMPP v7.4 - v8.3+ &bull; Linux Ubuntu Server / VirtualBox
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SKRIP SQL DATABASE */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Skrip Database MySQL: database_greenmart.sql</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Skema tabel, relasi foreign keys, indeks barcode, query view modus &amp; mean omset, serta data awal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(sqlContent, 'sql')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {copied === 'sql' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'sql' ? 'Tersalin ke Clipboard!' : 'Salin Semua Skrip SQL'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs max-h-[55vh] overflow-y-auto leading-relaxed">
                <pre>{sqlContent}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN XAMPP */}
          {activeTab === 'xampp' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Langkah Cepat Instalasi di XAMPP Windows / Mac</span>
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Ikuti 4 langkah mudah berikut untuk menjalankan GreenMart di PC lokal Anda.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                    <span>Ekstrak ZIP ke Folder htdocs</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    Buka folder <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-emerald-600">C:\xampp\htdocs</code>. Buat folder baru bernama <code className="font-mono text-emerald-600">greenmart</code>, lalu ekstrak seluruh file ZIP ke dalamnya.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">2</span>
                    <span>Start Apache &amp; MySQL di XAMPP Control Panel</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    Buka XAMPP Control Panel, lalu klik tombol <strong>Start</strong> di sebelah modul <strong>Apache</strong> dan modul <strong>MySQL</strong> hingga indikator berwarna hijau.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                    <span>Impor Database di phpMyAdmin</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pl-8">
                    Buka browser dan buka <code className="font-mono text-emerald-600">http://localhost/phpmyadmin</code>. Klik tab <strong>Import</strong>, pilih file <code className="font-mono text-emerald-600">database_greenmart.sql</code>, lalu klik tombol <strong>Import / Kirim</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
                    <span>Akses GreenMart di Web Browser</span>
                  </div>
                  <div className="pl-8 space-y-1 text-slate-600 dark:text-slate-400">
                    <p>Buka tautan berikut di browser Anda:</p>
                    <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      <li>Layar Kasir POS: http://localhost/greenmart/kasir.php</li>
                      <li>Dashboard Statistik: http://localhost/greenmart/index.php</li>
                      <li>Kelola Stok Barang: http://localhost/greenmart/produk.php</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN VIRTUALBOX LINUX */}
          {activeTab === 'virtualbox' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80">
                <h4 className="font-bold text-sm text-teal-900 dark:text-teal-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-teal-600" />
                  <span>Panduan Deployment di VirtualBox (Ubuntu Linux Server)</span>
                </h4>
                <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                  Jalankan GreenMart di virtual machine Ubuntu sehingga dapat diakses oleh HP kasir atau komputer lain dalam satu jaringan Wi-Fi.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {/* Langkah 1 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Setting Network VirtualBox: Bridged Adapter</span>
                  </div>
                  <p className="text-slate-500 text-[11px] pl-7">
                    Di VirtualBox, buka VM Settings &gt; Network &gt; ubah 'Attached to' menjadi <strong>Bridged Adapter</strong> agar VM mendapat IP sendiri dari router Wi-Fi.
                  </p>
                </div>

                {/* Langkah 2 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Perintah CLI Terminal Ubuntu: Install Apache, PHP &amp; MySQL</span>
                  </div>
                  <div className="pl-7">
                    <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
                      <div>sudo apt update</div>
                      <div>sudo apt install -y apache2 mysql-server php libapache2-mod-php php-mysql unzip</div>
                    </div>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Deploy File &amp; Impor Database</span>
                  </div>
                  <div className="pl-7">
                    <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
                      <div>sudo mkdir -p /var/www/html/greenmart</div>
                      <div>sudo unzip GreenMart_Suite.zip -d /var/www/html/greenmart/</div>
                      <div>sudo chown -R www-data:www-data /var/www/html/greenmart</div>
                      <div className="text-emerald-400"># Impor database:</div>
                      <div>sudo mysql &lt; /var/www/html/greenmart/database_greenmart.sql</div>
                    </div>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Akses dari HP / Komputer Host via IP LAN</span>
                  </div>
                  <p className="text-slate-500 text-[11px] pl-7">
                    Jalankan <code className="font-mono text-emerald-600">ip a</code> di terminal Ubuntu untuk cek IP (misal <code className="font-mono text-emerald-600">192.168.1.150</code>). Buka browser di laptop atau smartphone kasir Anda di alamat: <code className="font-mono text-emerald-600">http://192.168.1.150/greenmart/kasir.php</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOURCE CODE PHP */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(Object.keys(codeFiles) as Array<keyof typeof codeFiles>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedCodeFile(k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        selectedCodeFile === k
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {codeFiles[k].name}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(codeFiles[selectedCodeFile].content, selectedCodeFile)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copied === selectedCodeFile ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === selectedCodeFile ? 'Tersalin!' : `Salin ${codeFiles[selectedCodeFile].name}`}</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs max-h-[55vh] overflow-y-auto leading-relaxed">
                <pre>{codeFiles[selectedCodeFile].content}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            GreenMart POS &bull; PHP Native &amp; MySQL
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download ZIP (.zip)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
