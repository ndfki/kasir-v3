import React, { useState } from 'react';
import { X, BookOpen, Terminal, Laptop, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'xampp' | 'ubuntu' | 'troubleshoot'>('xampp');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Panduan Instalasi &amp; Deployment Lengkap
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Langkah-langkah menjalankan di XAMPP Windows &amp; Deploy ke Server Ubuntu Linux
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-100 dark:bg-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('xampp')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'xampp'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>XAMPP Localhost (Windows/Mac)</span>
          </button>

          <button
            onClick={() => setActiveTab('ubuntu')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'ubuntu'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Server Ubuntu / Linux (Apache &amp; MySQL)</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`py-3 px-4 font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'troubleshoot'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan &amp; Troubleshooting</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900">
          {activeTab === 'xampp' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
                <strong>Catatan Penting:</strong> Aplikasi ini dirancang siap pakai (Zero-Config) di XAMPP.
                Koneksi default menggunakan host <code className="bg-blue-100 px-1 py-0.5 rounded">localhost</code>, user <code className="bg-blue-100 px-1 py-0.5 rounded">root</code>, dan password kosong.
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Unduh &amp; Ekstrak Berkas ZIP</h4>
                    <p className="mt-1">
                      Klik tombol <strong>"Unduh Proyek (.ZIP)"</strong> di navbar atas. Ekstrak seluruh isi file ZIP ke folder:
                    </p>
                    <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px] mt-2">
                      C:\xampp\htdocs\data-statistik\
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Jalankan XAMPP Control Panel</h4>
                    <p className="mt-1">
                      Buka aplikasi XAMPP Control Panel, lalu klik tombol <strong>Start</strong> pada baris <strong>Apache</strong> dan <strong>MySQL</strong> hingga statusnya berwarna hijau.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Impor Database ke phpMyAdmin</h4>
                    <p className="mt-1">
                      Buka browser dan akses alamat: <code className="text-blue-600 font-bold">http://localhost/phpmyadmin/</code>
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
                      <li>Klik menu <strong>Basis Data (Databases)</strong>, buat database baru dengan nama <code>data_statistik</code>.</li>
                      <li>Pilih database <code>data_statistik</code> di panel sebelah kiri.</li>
                      <li>Klik tab <strong>Impor (Import)</strong> di bagian atas.</li>
                      <li>Klik tombol <strong>Pilih Berkas (Choose File)</strong>, lalu pilih file <code>database.sql</code> dari folder proyek Anda.</li>
                      <li>Gulir ke bawah dan klik tombol <strong>Kirim (Import)</strong>.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Buka Aplikasi di Browser</h4>
                    <p className="mt-1">
                      Buka browser Anda (Google Chrome, Edge, Firefox), lalu buka tautan:
                    </p>
                    <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] mt-2">
                      http://localhost/data-statistik/
                    </pre>
                    <p className="mt-2 text-slate-600">
                      Aplikasi langsung terbuka tanpa perlu login! Anda dapat langsung membuat sheet, menambah kolom, menginput data, dan mengekspor laporan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ubuntu' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Langkah 1: Pasang Web Server &amp; PHP 8 di Ubuntu</h4>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
                  {`sudo apt update && sudo apt upgrade -y
sudo apt install apache2 mysql-server php php-mysql php-cli php-curl php-json php-mbstring libapache2-mod-php -y`}
                </pre>

                <h4 className="font-bold text-slate-900 text-sm mt-4">Langkah 2: Buat Database &amp; User MySQL</h4>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
                  {`sudo mysql -u root

-- Didalam prompt MySQL:
CREATE DATABASE data_statistik CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'user_statistik'@'localhost' IDENTIFIED BY 'PasswordKuat123!';
GRANT ALL PRIVILEGES ON data_statistik.* TO 'user_statistik'@'localhost';
FLUSH PRIVILEGES;
EXIT;`}
                </pre>

                <h4 className="font-bold text-slate-900 text-sm mt-4">Langkah 3: Salin File Proyek &amp; Atur Permissions</h4>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
                  {`# Buat direktori web
sudo mkdir -p /var/www/html/data-statistik

# Salin seluruh isi berkas dari file zip ke folder tersebut
sudo cp -r /path/to/extracted/* /var/www/html/data-statistik/

# Atur kepemilikan user Apache
sudo chown -R www-data:www-data /var/www/html/data-statistik/
sudo chmod -R 755 /var/www/html/data-statistik/`}
                </pre>

                <h4 className="font-bold text-slate-900 text-sm mt-4">Langkah 4: Impor Database &amp; Edit config.php</h4>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
                  {`# Impor file database.sql
mysql -u user_statistik -p data_statistik < /var/www/html/data-statistik/database.sql

# Sesuaikan credential di config.php
sudo nano /var/www/html/data-statistik/config.php`}
                </pre>
                <p className="text-slate-600">
                  Ganti <code>DB_USER</code> menjadi <code>'user_statistik'</code> dan <code>DB_PASS</code> dengan password Anda.
                </p>

                <h4 className="font-bold text-slate-900 text-sm mt-4">Langkah 5: Pasang SSL HTTPS (Let's Encrypt Gratis)</h4>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
                  {`sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d domainanda.com`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'troubleshoot' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mengamankan phpMyAdmin di Server Publik
                </h5>
                <p className="text-slate-600">
                  Jangan pernah membuka phpMyAdmin tanpa autentikasi ganda atau port terbuka ke publik. Gunakan SSH Tunneling (<code className="bg-slate-200 px-1 rounded">ssh -L 8888:localhost:80 user@server</code>) atau tambahkan <code>.htaccess</code> proteksi IP.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Error: "Access denied for user 'root'@'localhost'"
                </h5>
                <p className="text-slate-600">
                  Di Ubuntu, user <code>root</code> MySQL menggunakan auth plugin <code>auth_socket</code> secara default. Buat user baru dengan perintah <code>CREATE USER 'user_statistik'@'localhost' IDENTIFIED BY '...'</code> seperti dijelaskan di tab Ubuntu.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Konflik Port 80 atau Port 3306 di Windows
                </h5>
                <p className="text-slate-600">
                  Jika Apache di XAMPP gagal start (berwarna merah), pastikan tidak ada aplikasi lain yang memakai port 80 (seperti IIS atau Skype). Anda dapat mengubah port Apache melalui menu <em>Config &gt; httpd.conf</em> ganti <code>Listen 80</code> menjadi <code>Listen 8080</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
          >
            Mengerti, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
