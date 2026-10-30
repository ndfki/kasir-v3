import JSZip from 'jszip';
import { GreenMartProduct, GreenMartTransaction } from '../types';

export const generateGreenMartSql = (
  products: GreenMartProduct[],
  transactions: GreenMartTransaction[]
): string => {
  return `-- ======================================================================
-- DATABASE: greenmart_db
-- APLIKASI: SISTEM KASIR GREENMART & REKAP STATISTIK HARIAN OTOMATIS
-- TEKNOLOGI: PHP & MySQL / MariaDB (Siap Deploy XAMPP & VirtualBox Ubuntu)
-- FITUR: Scan Barcode, Multi-Item Cart, Hitung Kembalian,
--        Modus Barang Terlaris, Mean/Rata-rata Omset, Total Pendapatan & Stok
-- ======================================================================

CREATE DATABASE IF NOT EXISTS \`greenmart_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`greenmart_db\`;

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS \`v_rekap_harian_otomatis\`;
DROP VIEW IF EXISTS \`v_modus_produk_terlaris\`;
DROP TABLE IF EXISTS \`rekap_harian\`;
DROP TABLE IF EXISTS \`transaksi_detail\`;
DROP TABLE IF EXISTS \`transaksi\`;
DROP TABLE IF EXISTS \`produk\`;
DROP TABLE IF EXISTS \`kategori\`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------
-- 1. TABEL: kategori
-- ----------------------------------------------------------------------
CREATE TABLE \`kategori\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`nama_kategori\` VARCHAR(100) NOT NULL UNIQUE,
  \`keterangan\` VARCHAR(255) NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`kategori\` (\`id\`, \`nama_kategori\`, \`keterangan\`) VALUES
(1, 'Sembako & Beras', 'Beras, gula, telur, dan kebutuhan pokok utama'),
(2, 'Minyak & Bumbu Dapur', 'Minyak goreng, bumbu masakan, bawang, garam'),
(3, 'Sayur & Buah Segar', 'Sayur hidroponik, buah impor dan lokal segar'),
(4, 'Minuman & Susu', 'Susu UHT, air mineral, teh kemasan, kopi'),
(5, 'Makanan Ringan & Mie', 'Mie instan, biskuit, roti tawar, snack'),
(6, 'Kebutuhan Rumah & Kebersihan', 'Deterjen, sabun pencuci piring, pembersih lantai'),
(7, 'Perawatan Diri & Sabun', 'Sabun mandi, sampo, pasta gigi, sikat gigi');

-- ----------------------------------------------------------------------
-- 2. TABEL: produk (Inventori & Master Data Barang)
-- ----------------------------------------------------------------------
CREATE TABLE \`produk\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`barcode\` VARCHAR(64) NOT NULL UNIQUE,
  \`nama_produk\` VARCHAR(150) NOT NULL,
  \`kategori_id\` INT NOT NULL,
  \`harga_beli\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT 'Harga Modal Pokok / HPP',
  \`harga_jual\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT 'Harga Jual ke Pembeli',
  \`stok\` INT NOT NULL DEFAULT 0 COMMENT 'Sisa Stok Saat Ini',
  \`min_stok\` INT NOT NULL DEFAULT 5 COMMENT 'Batas Peringatan Stok Tipis',
  \`satuan\` VARCHAR(30) NOT NULL DEFAULT 'Pcs' COMMENT 'Pcs, Kg, Pouch, Sak, Botol',
  \`deskripsi\` TEXT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_barcode\` (\`barcode\`),
  INDEX \`idx_kategori\` (\`kategori_id\`),
  CONSTRAINT \`fk_produk_kategori\` FOREIGN KEY (\`kategori_id\`) REFERENCES \`kategori\` (\`id\`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 3. TABEL: transaksi (Header Penjualan Kasir)
-- ----------------------------------------------------------------------
CREATE TABLE \`transaksi\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`no_nota\` VARCHAR(60) NOT NULL UNIQUE,
  \`tanggal\` DATE NOT NULL,
  \`waktu\` TIME NOT NULL,
  \`kasir\` VARCHAR(100) NOT NULL DEFAULT 'Kasir Utama',
  \`pelanggan\` VARCHAR(100) NOT NULL DEFAULT 'Pelanggan Umum',
  \`customer_phone\` VARCHAR(30) NULL,
  \`total_items\` INT NOT NULL DEFAULT 1 COMMENT 'Total Kuantitas Barang',
  \`subtotal\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`diskon\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`total_belanja\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT 'Grand Total yang Harus Dibayar',
  \`metode_bayar\` ENUM('tunai', 'qris', 'transfer', 'piutang') NOT NULL DEFAULT 'tunai',
  \`bayar\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT 'Uang Tunai / Nilai Diterima',
  \`kembalian\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT 'Uang Kembalian (Bayar - Total)',
  \`status_bayar\` ENUM('Lunas', 'Piutang') NOT NULL DEFAULT 'Lunas',
  \`catatan\` TEXT NULL,
  \`settled_at\` DATETIME NULL COMMENT 'Waktu Pelunasan Khusus Piutang',
  \`settled_method\` ENUM('tunai', 'qris', 'transfer') NULL,
  \`settled_amount\` DECIMAL(14, 2) NULL,
  \`settled_notes\` TEXT NULL,
  \`settled_by\` VARCHAR(100) NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_tgl\` (\`tanggal\`),
  INDEX \`idx_nota\` (\`no_nota\`),
  INDEX \`idx_status\` (\`status_bayar\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 4. TABEL: transaksi_detail (Rincian Barang per Nota)
-- ----------------------------------------------------------------------
CREATE TABLE \`transaksi_detail\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transaksi_id\` INT NOT NULL,
  \`produk_id\` INT NULL,
  \`barcode\` VARCHAR(64) NOT NULL,
  \`nama_produk\` VARCHAR(150) NOT NULL,
  \`harga_beli\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`harga_jual\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`qty\` INT NOT NULL DEFAULT 1,
  \`satuan\` VARCHAR(30) NOT NULL DEFAULT 'Pcs',
  \`diskon_persen\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  \`subtotal\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  INDEX \`idx_trx_detail_trx\` (\`transaksi_id\`),
  INDEX \`idx_trx_detail_prod\` (\`produk_id\`),
  INDEX \`idx_trx_detail_barcode\` (\`barcode\`),
  CONSTRAINT \`fk_detail_transaksi\` FOREIGN KEY (\`transaksi_id\`) REFERENCES \`transaksi\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 5. TABEL: rekap_harian (Snapshot Rekap Statistik Harian)
-- ----------------------------------------------------------------------
CREATE TABLE \`rekap_harian\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`tanggal\` DATE NOT NULL UNIQUE,
  \`total_omset\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`total_modal\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`laba_bersih\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  \`total_transaksi\` INT NOT NULL DEFAULT 0,
  \`total_barang_terjual\` INT NOT NULL DEFAULT 0,
  \`rata_rata_omset\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 COMMENT 'Mean Omset per Transaksi',
  \`modus_produk_terlaris\` VARCHAR(150) NULL COMMENT 'Barang Paling Laris / Modus Penjualan',
  \`modus_total_qty\` INT NOT NULL DEFAULT 0,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_rekap_tgl\` (\`tanggal\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------
-- 6. VIEW OTOMATIS: Perhitungan Statistik Modus Barang Terlaris
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW \`v_modus_produk_terlaris\` AS
SELECT 
  td.nama_produk,
  td.barcode,
  COUNT(DISTINCT td.transaksi_id) AS total_transaksi_muncul,
  SUM(td.qty) AS total_qty_terjual,
  SUM(td.subtotal) AS total_omset_produk
FROM \`transaksi_detail\` td
GROUP BY td.barcode, td.nama_produk
ORDER BY total_qty_terjual DESC, total_transaksi_muncul DESC;

-- ----------------------------------------------------------------------
-- 7. VIEW OTOMATIS: Rekap Statistik Harian (Mean, Modus, Total Pendapatan)
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW \`v_rekap_harian_otomatis\` AS
SELECT 
  t.tanggal,
  COUNT(DISTINCT t.id) AS total_transaksi,
  COALESCE(SUM(td.subtotal), 0) AS total_pendapatan,
  COALESCE(AVG(t.total_belanja), 0) AS mean_omset_per_transaksi,
  COALESCE(SUM(td.qty), 0) AS total_barang_terjual,
  COALESCE(SUM(td.harga_beli * td.qty), 0) AS total_modal,
  COALESCE(SUM(td.subtotal), 0) - COALESCE(SUM(td.harga_beli * td.qty), 0) AS laba_bersih
FROM \`transaksi\` t
LEFT JOIN \`transaksi_detail\` td ON t.id = td.transaksi_id
GROUP BY t.tanggal
ORDER BY t.tanggal DESC;

-- ======================================================================
-- SEED DATA DEFAULT GREENMART (Katalog Produk & Transaksi Awal)
-- ======================================================================

INSERT INTO \`produk\` (\`id\`, \`barcode\`, \`nama_produk\`, \`kategori_id\`, \`harga_beli\`, \`harga_jual\`, \`stok\`, \`min_stok\`, \`satuan\`, \`deskripsi\`) VALUES
(1, '8992753211029', 'Minyak Goreng Bimoli Klasik 2 Liter', 2, 30000.00, 36000.00, 42, 10, 'Pouch', 'Minyak kelapa sawit murni kualitas premium 2 Liter'),
(2, '8993888200101', 'Beras Pandan Wangi Premium 5 Kg', 1, 62000.00, 74000.00, 25, 8, 'Sak', 'Beras pulen beraroma pandan wangi alami'),
(3, '8991001100234', 'Gula Pasir Gulaku Tebu Alami 1 Kg', 1, 14500.00, 17500.00, 50, 15, 'Kg', 'Gula tebu kristal putih bersih 1000 gram'),
(4, '8998866200221', 'Indomie Mie Goreng Spesial 85g', 5, 2800.00, 3500.00, 140, 30, 'Bungkus', 'Mie instan goreng terlaris dengan bumbu gurih'),
(5, '8991389220011', 'Susu Ultra Milk UHT Full Cream 1 Liter', 4, 16500.00, 19500.00, 35, 10, 'Kotak', 'Susu sapi segar kaya kalsium dan vitamin'),
(6, '8990001000011', 'Telur Ayam Negeri Fresh 1 Kg', 1, 24000.00, 28500.00, 30, 8, 'Kg', 'Telur segar pilihan dari peternakan terverifikasi'),
(7, '8990002000022', 'Apel Fuji Manis Segar 1 Kg', 3, 29000.00, 37500.00, 18, 5, 'Kg', 'Apel renyah manis dan segar kaya antioksidan'),
(8, '8990003000033', 'Bayam Hijau Organik Petik Segar', 3, 3500.00, 5000.00, 28, 8, 'Ikat', 'Sayur bayam hidroponik bebas pestisida'),
(9, '8999999001122', 'Sunlight Pencuci Piring Jeruk Nipis 700ml', 6, 11500.00, 14000.00, 22, 6, 'Pouch', 'Ampuh bersihkan lemak membandel 5x lebih cepat'),
(10, '8991002100555', 'Kopi Kapal Api Spesial Mix 10 x 24g', 4, 12000.00, 15500.00, 45, 12, 'Renceng', 'Kopi bubuk plus gula mantap khas nusantara'),
(11, '8992752011019', 'Air Mineral Aqua Botol 600ml', 4, 2700.00, 3800.00, 65, 20, 'Botol', 'Air mineral pegunungan alami higienis'),
(12, '8998888001100', 'Roti Tawar Gandum Sari Roti', 5, 14000.00, 17000.00, 14, 5, 'Bungkus', 'Roti gandum berserat tinggi lembut'),
(13, '8992999003322', 'Sabun Mandi Lifebuoy Total 10 450ml', 7, 20000.00, 25000.00, 19, 6, 'Pouch', 'Perlindungan bakteri kuman penyakit keluarga'),
(14, '8991100223344', 'Bawang Merah Brebes Pilihan 500g', 2, 18000.00, 23000.00, 20, 6, 'Pack', 'Bawang merah harum gurih untuk masakan sedap');

-- Transaksi Awal
INSERT INTO \`transaksi\` (\`id\`, \`no_nota\`, \`tanggal\`, \`waktu\`, \`kasir\`, \`pelanggan\`, \`customer_phone\`, \`total_items\`, \`subtotal\`, \`diskon\`, \`total_belanja\`, \`metode_bayar\`, \`bayar\`, \`kembalian\`, \`status_bayar\`, \`catatan\`) VALUES
(1, 'GM-20261024-001', CURDATE(), '08:15:30', 'Dewi Sartika (Kasir 01)', 'Ibu Ratna', '081234567890', 7, 105500.00, 0.00, 105500.00, 'tunai', 110000.00, 4500.00, 'Lunas', 'Belanja dapur'),
(2, 'GM-20261024-002', CURDATE(), '09:20:10', 'Dewi Sartika (Kasir 01)', 'Pak Hendra', '', 4, 96500.00, 0.00, 96500.00, 'qris', 96500.00, 0.00, 'Lunas', 'QRIS Gopay'),
(3, 'GM-20261024-003', CURDATE(), '10:45:15', 'Budi Kurnia (Kasir 02)', 'Siti Aminah', '085712345678', 12, 82000.00, 2000.00, 80000.00, 'tunai', 100000.00, 20000.00, 'Lunas', 'Diskon promo'),
(4, 'GM-20261024-004', CURDATE(), '12:05:40', 'Budi Kurnia (Kasir 02)', 'Warung Bu Joko', '081399887766', 22, 144000.00, 4000.00, 140000.00, 'tunai', 150000.00, 10000.00, 'Lunas', 'Kulakan warung'),
(5, 'GM-20261024-005', CURDATE(), '13:30:22', 'Dewi Sartika (Kasir 01)', 'Mas Danu', '', 3, 48000.00, 0.00, 48000.00, 'tunai', 50000.00, 2000.00, 'Lunas', 'Sarapan')
ON DUPLICATE KEY UPDATE \`no_nota\` = VALUES(\`no_nota\`);

-- Detail Transaksi
INSERT INTO \`transaksi_detail\` (\`transaksi_id\`, \`produk_id\`, \`barcode\`, \`nama_produk\`, \`harga_beli\`, \`harga_jual\`, \`qty\`, \`satuan\`, \`diskon_persen\`, \`subtotal\`) VALUES
(1, 1, '8992753211029', 'Minyak Goreng Bimoli Klasik 2 Liter', 30000.00, 36000.00, 1, 'Pouch', 0.00, 36000.00),
(1, 4, '8998866200221', 'Indomie Mie Goreng Spesial 85g', 2800.00, 3500.00, 5, 'Bungkus', 0.00, 17500.00),
(1, 6, '8990001000011', 'Telur Ayam Negeri Fresh 1 Kg', 24000.00, 28500.00, 1, 'Kg', 0.00, 28500.00),
(1, 14, '8991100223344', 'Bawang Merah Brebes Pilihan 500g', 18000.00, 23000.00, 1, 'Pack', 0.00, 23000.00),
(2, 2, '8993888200101', 'Beras Pandan Wangi Premium 5 Kg', 62000.00, 74000.00, 1, 'Sak', 0.00, 74000.00),
(2, 5, '8991389220011', 'Susu Ultra Milk UHT Full Cream 1 Liter', 16500.00, 19500.00, 1, 'Kotak', 0.00, 19500.00),
(2, 11, '8992752011019', 'Air Mineral Aqua Botol 600ml', 2700.00, 3800.00, 2, 'Botol', 0.00, 7600.00),
(3, 4, '8998866200221', 'Indomie Mie Goreng Spesial 85g', 2800.00, 3500.00, 10, 'Bungkus', 0.00, 35000.00),
(3, 3, '8991001100234', 'Gula Pasir Gulaku Tebu Alami 1 Kg', 14500.00, 17500.00, 1, 'Kg', 0.00, 17500.00),
(3, 8, '8990003000033', 'Bayam Hijau Organik Petik Segar', 3500.00, 5000.00, 3, 'Ikat', 0.00, 15000.00),
(3, 9, '8999999001122', 'Sunlight Pencuci Piring Jeruk Nipis 700ml', 11500.00, 14000.00, 1, 'Pouch', 0.00, 14000.00),
(4, 4, '8998866200221', 'Indomie Mie Goreng Spesial 85g', 2800.00, 3500.00, 20, 'Bungkus', 0.00, 70000.00),
(4, 1, '8992753211029', 'Minyak Goreng Bimoli Klasik 2 Liter', 30000.00, 36000.00, 2, 'Pouch', 0.00, 72000.00),
(5, 10, '8991002100555', 'Kopi Kapal Api Spesial Mix 10 x 24g', 12000.00, 15500.00, 2, 'Renceng', 0.00, 31000.00),
(5, 12, '8998888001100', 'Roti Tawar Gandum Sari Roti', 14000.00, 17000.00, 1, 'Bungkus', 0.00, 17000.00);

-- Rekap Hari Ini
INSERT INTO \`rekap_harian\` (\`tanggal\`, \`total_omset\`, \`total_modal\`, \`laba_bersih\`, \`total_transaksi\`, \`total_barang_terjual\`, \`rata_rata_omset\`, \`modus_produk_terlaris\`, \`modus_total_qty\`)
SELECT 
  CURDATE(),
  COALESCE(SUM(total_belanja), 0),
  COALESCE((SELECT SUM(qty * harga_beli) FROM transaksi_detail td JOIN transaksi tx ON td.transaksi_id = tx.id WHERE tx.tanggal = CURDATE()), 0),
  COALESCE(SUM(total_belanja), 0) - COALESCE((SELECT SUM(qty * harga_beli) FROM transaksi_detail td JOIN transaksi tx ON td.transaksi_id = tx.id WHERE tx.tanggal = CURDATE()), 0),
  COUNT(id),
  COALESCE((SELECT SUM(qty) FROM transaksi_detail td JOIN transaksi tx ON td.transaksi_id = tx.id WHERE tx.tanggal = CURDATE()), 0),
  COALESCE(AVG(total_belanja), 0),
  'Indomie Mie Goreng Spesial 85g',
  35
FROM \`transaksi\`
WHERE \`tanggal\` = CURDATE()
ON DUPLICATE KEY UPDATE
  \`total_omset\` = VALUES(\`total_omset\`),
  \`total_modal\` = VALUES(\`total_modal\`),
  \`laba_bersih\` = VALUES(\`laba_bersih\`),
  \`total_transaksi\` = VALUES(\`total_transaksi\`),
  \`total_barang_terjual\` = VALUES(\`total_barang_terjual\`),
  \`rata_rata_omset\` = VALUES(\`rata_rata_omset\`),
  \`modus_produk_terlaris\` = VALUES(\`modus_produk_terlaris\`),
  \`modus_total_qty\` = VALUES(\`modus_total_qty\`);
`;
};

export const getGreenMartPhpConfig = (): string => {
  return `<?php
/**
 * GreenMart POS & Statistical Suite
 * File Konfigurasi Database MySQL (PDO)
 * Kompatibel dengan XAMPP Windows, Linux Ubuntu VirtualBox, & Server Lokal
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Konfigurasi Database
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'greenmart_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_CHARSET', 'utf8mb4');

// Konfigurasi Informasi Toko Resmi GreenMart Batang
define('STORE_NAME', 'GreenMart Supermarket & POS');
define('STORE_ADDRESS', 'Jl. Ki Mangunsarkoro No.2, 03, Dracik Barat, Proyonanggan Sel., Kec. Batang, Kabupaten Batang, Jawa Tengah 51216');
define('STORE_CITY', 'Batang');
define('STORE_PHONE', '(0285) 391-234');
define('STORE_EMAIL', 'batang@greenmart.id');
define('STORE_TAGLINE', 'Pusat Belanja Segar, Hemat & Lengkap');

/**
 * Mendapatkan koneksi PDO MySQL dengan Auto-Bootstrap
 */
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_MULTI_STATEMENTS => true,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Jika database belum dibuat di MySQL, buat otomatis
            if (strpos($e->getMessage(), 'Unknown database') !== false || $e->getCode() == 1049) {
                try {
                    $initPdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET, DB_USER, DB_PASS, $options);
                    $initPdo->exec("CREATE DATABASE IF NOT EXISTS \`" . DB_NAME . "\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                    
                    // Baca file database_greenmart.sql jika ada di folder sama
                    $sqlFile = __DIR__ . '/database_greenmart.sql';
                    if (file_exists($sqlFile)) {
                        $sqlContent = file_get_contents($sqlFile);
                        $pdo->exec($sqlContent);
                    }
                } catch (Exception $ex) {
                    die(json_response(false, 'Gagal inisialisasi database: ' . $ex->getMessage()));
                }
            } else {
                header('Content-Type: application/json; charset=utf-8');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Koneksi ke MySQL gagal. Pastikan Service MySQL di XAMPP / VirtualBox sudah aktif. Error: ' . $e->getMessage()
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }
    return $pdo;
}

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Helper JSON Response
function json_response($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Format Rupiah
function formatRupiah($val) {
    return 'Rp ' . number_format((float)$val, 0, ',', '.');
}
`;
};

export const getGreenMartPhpApi = (): string => {
  return `<?php
/**
 * REST API Backend GreenMart POS & Sistem Statistik
 * Mendukung AJAX Barcode Scanner, Checkout Kasir, Update Stok, dan Rekap Statistik
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = getDB();
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        // -------------------------------------------------------------
        // 1. CARI PRODUK VIA BARCODE (Scan Otomatis Kasir)
        // -------------------------------------------------------------
        case 'cari_barcode':
            $barcode = trim($_GET['barcode'] ?? $_POST['barcode'] ?? '');
            if (!$barcode) {
                json_response(false, 'Barcode tidak boleh kosong', null, 400);
            }
            $stmt = $pdo->prepare("SELECT p.*, k.nama_kategori FROM produk p JOIN kategori k ON p.kategori_id = k.id WHERE p.barcode = ? LIMIT 1");
            $stmt->execute([$barcode]);
            $product = $stmt->fetch();
            if ($product) {
                json_response(true, 'Produk ditemukan', $product);
            } else {
                json_response(false, 'Produk dengan barcode "' . htmlspecialchars($barcode) . '" tidak terdaftar di sistem GreenMart', null, 404);
            }
            break;

        // -------------------------------------------------------------
        // 2. CHECKOUT TRANSAKSI KASIR (Multi-Item + Kurangi Stok Otomatis)
        // -------------------------------------------------------------
        case 'simpan_transaksi':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $items = $input['items'] ?? [];
            if (empty($items)) {
                json_response(false, 'Keranjang belanja kosong', null, 400);
            }

            $kasir = trim($input['kasir'] ?? 'Kasir GreenMart');
            $pelanggan = trim($input['pelanggan'] ?? 'Pelanggan Umum');
            $customerPhone = trim($input['customer_phone'] ?? '');
            $metodeBayar = in_array($input['metode_bayar'] ?? '', ['tunai', 'qris', 'transfer', 'piutang']) ? $input['metode_bayar'] : 'tunai';
            $cashGiven = floatval($input['bayar'] ?? 0);
            $diskonTotal = floatval($input['diskon'] ?? 0);
            $catatan = trim($input['catatan'] ?? '');

            // Hitung subtotal & verifikasi stok
            $subtotal = 0;
            $totalUnits = 0;
            $itemRows = [];

            $pdo->beginTransaction();

            foreach ($items as $item) {
                $barcode = trim($item['barcode'] ?? '');
                $qty = max(1, intval($item['qty'] ?? 1));
                
                // Ambil data produk terbaru dari database
                $stmt = $pdo->prepare("SELECT * FROM produk WHERE barcode = ? FOR UPDATE");
                $stmt->execute([$barcode]);
                $prod = $stmt->fetch();

                if (!$prod) {
                    $pdo->rollBack();
                    json_response(false, "Barang dengan barcode $barcode tidak ditemukan", null, 400);
                }

                if ($prod['stok'] < $qty) {
                    $pdo->rollBack();
                    json_response(false, "Stok tidak mencukupi untuk {$prod['nama_produk']}. Sisa stok: {$prod['stok']}, diminta: $qty", null, 400);
                }

                $sellingPrice = floatval($prod['harga_jual']);
                $costPrice = floatval($prod['harga_beli']);
                $itemDiskon = floatval($item['diskon_persen'] ?? 0);
                $lineSubtotal = round($qty * $sellingPrice * (1 - ($itemDiskon / 100)));

                $subtotal += $lineSubtotal;
                $totalUnits += $qty;

                // Kurangi stok produk secara atomik
                $updStok = $pdo->prepare("UPDATE produk SET stok = stok - ? WHERE id = ?");
                $updStok->execute([$qty, $prod['id']]);

                $itemRows[] = [
                    'produk_id'    => $prod['id'],
                    'barcode'      => $prod['barcode'],
                    'nama_produk'  => $prod['nama_produk'],
                    'harga_beli'   => $costPrice,
                    'harga_jual'   => $sellingPrice,
                    'qty'          => $qty,
                    'satuan'       => $prod['satuan'],
                    'diskon_persen'=> $itemDiskon,
                    'subtotal'     => $lineSubtotal
                ];
            }

            $grandTotal = max(0, $subtotal - $diskonTotal);
            $isPaidLess = $metodeBayar === 'piutang' || ($cashGiven < $grandTotal && $metodeBayar === 'tunai');
            $statusBayar = $isPaidLess ? 'Piutang' : 'Lunas';
            $changeAmount = ($cashGiven >= $grandTotal && $metodeBayar === 'tunai') ? ($cashGiven - $grandTotal) : 0;

            // Generate No Nota
            $datePrefix = date('Ymd');
            $randSuffix = str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $noNota = "GM-{$datePrefix}-{$randSuffix}";

            // Insert Header Transaksi
            $insTrx = $pdo->prepare("
                INSERT INTO transaksi 
                (no_nota, tanggal, waktu, kasir, pelanggan, customer_phone, total_items, subtotal, diskon, total_belanja, metode_bayar, bayar, kembalian, status_bayar, catatan)
                VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $insTrx->execute([
                $noNota,
                $kasir,
                $pelanggan,
                $customerPhone,
                $totalUnits,
                $subtotal,
                $diskonTotal,
                $grandTotal,
                $metodeBayar,
                $cashGiven,
                $changeAmount,
                $statusBayar,
                $catatan
            ]);
            $trxId = $pdo->lastInsertId();

            // Insert Rincian Detail Transaksi
            $insDetail = $pdo->prepare("
                INSERT INTO transaksi_detail 
                (transaksi_id, produk_id, barcode, nama_produk, harga_beli, harga_jual, qty, satuan, diskon_persen, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($itemRows as $row) {
                $insDetail->execute([
                    $trxId,
                    $row['produk_id'],
                    $row['barcode'],
                    $row['nama_produk'],
                    $row['harga_beli'],
                    $row['harga_jual'],
                    $row['qty'],
                    $row['satuan'],
                    $row['diskon_persen'],
                    $row['subtotal']
                ]);
            }

            $pdo->commit();

            json_response(true, 'Transaksi berhasil disimpan & stok diperbarui', [
                'transaksi_id'  => $trxId,
                'no_nota'       => $noNota,
                'tanggal'       => date('Y-m-d'),
                'waktu'         => date('H:i:s'),
                'total_belanja' => $grandTotal,
                'bayar'         => $cashGiven,
                'kembalian'     => $changeAmount,
                'status_bayar'  => $statusBayar
            ]);
            break;

        // -------------------------------------------------------------
        // 3. DAFTAR PRODUK & STOK
        // -------------------------------------------------------------
        case 'get_produk':
            $stmt = $pdo->query("SELECT p.*, k.nama_kategori FROM produk p JOIN kategori k ON p.kategori_id = k.id ORDER BY p.nama_produk ASC");
            $products = $stmt->fetchAll();
            json_response(true, 'Data produk berhasil diambil', $products);
            break;

        // -------------------------------------------------------------
        // 4. RESTOCK PRODUK CEPAT
        // -------------------------------------------------------------
        case 'tambah_stok':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $productId = intval($input['produk_id'] ?? 0);
            $tambahanStok = intval($input['jumlah_tambah'] ?? 0);
            if (!$productId || $tambahanStok <= 0) {
                json_response(false, 'Parameter tidak valid', null, 400);
            }
            $stmt = $pdo->prepare("UPDATE produk SET stok = stok + ? WHERE id = ?");
            $stmt->execute([$tambahanStok, $productId]);
            json_response(true, "Stok berhasil ditambahkan +$tambahanStok unit");
            break;

        // -------------------------------------------------------------
        // 5. REKAP DATA STATISTIK HARIAN OTOMATIS (MODUS, MEAN, TOTAL)
        // -------------------------------------------------------------
        case 'get_statistik_harian':
            $targetDate = $_GET['tanggal'] ?? date('Y-m-d');
            
            // 1. Total Pendapatan & Mean Omset
            $stmtSum = $pdo->prepare("
                SELECT 
                    COUNT(t.id) AS total_transaksi,
                    COALESCE(SUM(t.total_belanja), 0) AS total_pendapatan,
                    COALESCE(AVG(t.total_belanja), 0) AS mean_omset,
                    COALESCE(MAX(t.total_belanja), 0) AS max_transaksi,
                    COALESCE(MIN(t.total_belanja), 0) AS min_transaksi
                FROM transaksi t
                WHERE t.tanggal = ?
            ");
            $stmtSum->execute([$targetDate]);
            $sumData = $stmtSum->fetch();

            // 2. Total Modal & Laba Bersih
            $stmtCost = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(td.qty * td.harga_beli), 0) AS total_modal,
                    COALESCE(SUM(td.qty), 0) AS total_barang_terjual
                FROM transaksi_detail td
                JOIN transaksi t ON td.transaksi_id = t.id
                WHERE t.tanggal = ?
            ");
            $stmtCost->execute([$targetDate]);
            $costData = $stmtCost->fetch();

            $totalRevenue = floatval($sumData['total_pendapatan']);
            $totalCost = floatval($costData['total_modal']);
            $totalProfit = max(0, $totalRevenue - $totalCost);
            $totalTransactions = intval($sumData['total_transaksi']);
            $meanOmset = floatval($sumData['mean_omset']);

            // 3. Modus Barang Terlaris (Item Paling Banyak Terjual Hari Ini)
            $stmtModus = $pdo->prepare("
                SELECT 
                    td.nama_produk,
                    td.barcode,
                    COUNT(DISTINCT td.transaksi_id) AS total_transaksi,
                    SUM(td.qty) AS total_qty_terjual,
                    SUM(td.subtotal) AS total_omset_produk
                FROM transaksi_detail td
                JOIN transaksi t ON td.transaksi_id = t.id
                WHERE t.tanggal = ?
                GROUP BY td.barcode, td.nama_produk
                ORDER BY total_qty_terjual DESC, total_transaksi DESC
                LIMIT 5
            ");
            $stmtModus->execute([$targetDate]);
            $topProducts = $stmtModus->fetchAll();

            $topModus = !empty($topProducts) ? $topProducts[0] : null;

            json_response(true, 'Data statistik harian berhasil dihitung', [
                'tanggal'              => $targetDate,
                'total_pendapatan'     => $totalRevenue,
                'total_modal'          => $totalCost,
                'laba_bersih'          => $totalProfit,
                'total_transaksi'      => $totalTransactions,
                'total_barang_terjual' => intval($costData['total_barang_terjual']),
                'mean_omset'           => round($meanOmset),
                'top_modus_terlaris'   => $topModus,
                'top_products_list'    => $topProducts
            ]);
            break;

        // -------------------------------------------------------------
        // 6. DETAIL NOTA TRANSAKSI & CETAK STRUK
        // -------------------------------------------------------------
        case 'get_transaksi_detail':
            $noNota = trim($_GET['no_nota'] ?? $_POST['no_nota'] ?? '');
            $trxId = intval($_GET['id'] ?? $_POST['id'] ?? 0);
            if (!$noNota && !$trxId) {
                json_response(false, 'Parameter no_nota atau id transaksi diperlukan', null, 400);
            }
            if ($noNota) {
                $stmtTrx = $pdo->prepare("SELECT * FROM transaksi WHERE no_nota = ? LIMIT 1");
                $stmtTrx->execute([$noNota]);
            } else {
                $stmtTrx = $pdo->prepare("SELECT * FROM transaksi WHERE id = ? LIMIT 1");
                $stmtTrx->execute([$trxId]);
            }
            $trx = $stmtTrx->fetch();
            if (!$trx) {
                json_response(false, 'Transaksi tidak ditemukan', null, 404);
            }
            $stmtDet = $pdo->prepare("SELECT * FROM transaksi_detail WHERE transaksi_id = ? ORDER BY id ASC");
            $stmtDet->execute([$trx['id']]);
            $details = $stmtDet->fetchAll();

            json_response(true, 'Data transaksi berhasil diambil', [
                'transaksi' => $trx,
                'items'     => $details
            ]);
            break;

        default:
            json_response(false, 'Aksi tidak dikenal', null, 404);
            break;
    }
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(false, 'Kesalahan server: ' . $e->getMessage(), null, 500);
}
`;
};

export const getGreenMartPhpIndex = (): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title>GreenMart - Sistem Kasir POS & Rekap Statistik Harian</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      body { font-family: 'Plus Jakarta Sans', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

    <!-- Navbar GreenMart -->
    <header class="bg-emerald-800 text-white sticky top-0 z-30 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-extrabold text-xl shadow-inner">
                    🛒
                </div>
                <div>
                    <h1 class="text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
                        <span>GreenMart</span>
                        <span class="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded">POS & STATISTIK</span>
                    </h1>
                    <p class="text-[11px] text-emerald-200">Sistem Kasir Ritel & Rekap Harian MySQL</p>
                </div>
            </div>

            <nav class="hidden md:flex items-center gap-1">
                <a href="index.php" class="px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-bold">📊 Dashboard & Statistik</a>
                <a href="kasir.php" class="px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-emerald-100 text-xs font-semibold">🛒 Kasir POS & Barcode</a>
                <a href="produk.php" class="px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-emerald-100 text-xs font-semibold">📦 Stok Barang</a>
                <a href="transaksi.php" class="px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-emerald-100 text-xs font-semibold">🧾 Riwayat Transaksi</a>
            </nav>

            <div class="flex items-center space-x-2">
                <a href="kasir.php" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition">
                    ⚡ Buka Kasir POS
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">

        <!-- Top Greeting & Date Filter -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight">Dashboard Statistik Penjualan GreenMart</h2>
                <p class="text-xs text-slate-500">Rekap otomatis perhitungan Modus, Mean Omset, dan Total Pendapatan dari database MySQL</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-500">Tanggal Rekap:</span>
                <input type="date" id="inputDateFilter" value="<?= date('Y-m-d') ?>" onchange="muatStatistik()" class="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-emerald-500">
            </div>
        </div>

        <!-- 4 KARTU METRIK STATISTIK UTAMA (MODUS, MEAN, TOTAL PENDAPATAN, LABA) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- 1. MODUS BARANG TERLARIS -->
            <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-black uppercase tracking-wider text-amber-800">⭐ Modus (Terlaris)</span>
                    <span class="p-1.5 rounded-lg bg-amber-200/80 text-amber-900 text-xs">🏆</span>
                </div>
                <div>
                    <h3 id="statModusName" class="text-base font-extrabold text-slate-900 truncate">Memuat...</h3>
                    <p id="statModusQty" class="text-xs font-mono font-bold text-amber-900 mt-0.5">0 unit terjual</p>
                </div>
                <div class="text-[10px] text-amber-700 pt-1 border-t border-amber-200/60">
                    Produk frekuensi penjualan tertinggi hari ini
                </div>
            </div>

            <!-- 2. MEAN / RATA-RATA OMSET -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200/80 shadow-xs space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-black uppercase tracking-wider text-blue-800">📈 Mean (Rata-Rata)</span>
                    <span class="p-1.5 rounded-lg bg-blue-200/80 text-blue-900 text-xs">⚖️</span>
                </div>
                <div>
                    <h3 id="statMeanRevenue" class="text-xl font-black font-mono text-slate-900">Rp 0</h3>
                    <p class="text-xs text-blue-800 mt-0.5">Rata-rata per transaksi</p>
                </div>
                <div class="text-[10px] text-blue-700 pt-1 border-t border-blue-200/60">
                    Rata-rata belanja pembeli (Average Order Value)
                </div>
            </div>

            <!-- 3. TOTAL PENDAPATAN (OMSET) -->
            <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-black uppercase tracking-wider text-emerald-800">💰 Total Pendapatan</span>
                    <span class="p-1.5 rounded-lg bg-emerald-200/80 text-emerald-900 text-xs">💵</span>
                </div>
                <div>
                    <h3 id="statTotalRevenue" class="text-xl font-black font-mono text-slate-900">Rp 0</h3>
                    <p id="statTotalTransactions" class="text-xs text-emerald-800 mt-0.5">0 transaksi nota</p>
                </div>
                <div class="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                    Total omset kotor terverifikasi di MySQL
                </div>
            </div>

            <!-- 4. TOTAL LABA BERSIH -->
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-black uppercase tracking-wider text-purple-800">✨ Laba Bersih</span>
                    <span class="p-1.5 rounded-lg bg-purple-200/80 text-purple-900 text-xs">📊</span>
                </div>
                <div>
                    <h3 id="statTotalProfit" class="text-xl font-black font-mono text-slate-900">Rp 0</h3>
                    <p id="statTotalItems" class="text-xs text-purple-800 mt-0.5">0 barang keluar</p>
                </div>
                <div class="text-[10px] text-purple-700 pt-1 border-t border-purple-200/60">
                    Total omset dikurangi modal pokok HPP
                </div>
            </div>
        </div>

        <!-- GRAFIK STATISTIK INTERAKTIF & TOP MODUS BREAKDOWN -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Grafik Omset & Laba -->
            <div class="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>📈 Perbandingan Omset, Modal, &amp; Laba (Kurva Garis Fluktuasi)</span>
                    </h3>
                    <span class="text-[11px] text-slate-400">Chart.js Live</span>
                </div>
                <div class="h-64 relative">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>

            <!-- Top 5 Modus Terlaris Hari Ini -->
            <div class="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🏆 Top 5 Modus Terlaris</span>
                    </h3>
                    <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Frekuensi Terbanyak
                    </span>
                </div>
                <div id="topModusList" class="space-y-2 max-h-64 overflow-y-auto pr-1">
                    <p class="text-xs text-slate-400 italic">Memuat data modus produk terlaris...</p>
                </div>
            </div>
        </div>

        <!-- Tombol Aksi Cepat Bawah -->
        <div class="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="space-y-1">
                <h3 class="text-base font-extrabold tracking-tight">Siap Melayani Pembeli di Meja Kasir?</h3>
                <p class="text-xs text-emerald-200">Gunakan fitur scan barcode otomatis atau cari nama barang untuk mulai transaksi.</p>
            </div>
            <div class="flex items-center gap-2.5">
                <a href="kasir.php" class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition">
                    🛒 Masuk Layar Kasir POS
                </a>
                <a href="transaksi.php" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition">
                    🧾 Riwayat Transaksi
                </a>
            </div>
        </div>

    </main>

    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        GreenMart &bull; Sistem Kasir & Rekap Statistik Harian PHP &amp; MySQL
    </footer>

    <script>
        let chartInstance = null;

        async function muatStatistik() {
            const tgl = document.getElementById('inputDateFilter').value;
            try {
                const res = await fetch('api.php?action=get_statistik_harian&tanggal=' + tgl);
                const json = await res.json();
                if (json.success && json.data) {
                    const d = json.data;
                    document.getElementById('statTotalRevenue').innerText = 'Rp ' + Number(d.total_pendapatan).toLocaleString('id-ID');
                    document.getElementById('statMeanRevenue').innerText = 'Rp ' + Number(d.mean_omset).toLocaleString('id-ID');
                    document.getElementById('statTotalProfit').innerText = 'Rp ' + Number(d.laba_bersih).toLocaleString('id-ID');
                    document.getElementById('statTotalTransactions').innerText = d.total_transaksi + ' Transaksi';
                    document.getElementById('statTotalItems').innerText = d.total_barang_terjual + ' Unit Terjual';

                    if (d.top_modus_terlaris) {
                        document.getElementById('statModusName').innerText = d.top_modus_terlaris.nama_produk;
                        document.getElementById('statModusQty').innerText = d.top_modus_terlaris.total_qty_terjual + ' unit terjual (' + d.top_modus_terlaris.total_transaksi + 'x nota)';
                    } else {
                        document.getElementById('statModusName').innerText = 'Belum Ada Penjualan';
                        document.getElementById('statModusQty').innerText = '0 unit';
                    }

                    // Render List Modus
                    const listEl = document.getElementById('topModusList');
                    if (d.top_products_list && d.top_products_list.length > 0) {
                        listEl.innerHTML = d.top_products_list.map((p, idx) => \`
                            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                <div class="flex items-center gap-2">
                                    <span class="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">\${idx + 1}</span>
                                    <div>
                                        <div class="font-bold text-slate-900 truncate max-w-[200px]">\${p.nama_produk}</div>
                                        <div class="text-[10px] text-slate-400 font-mono">\${p.barcode}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="font-bold text-emerald-700 font-mono">\${p.total_qty_terjual} unit</span>
                                    <div class="text-[10px] text-slate-400">Rp \${Number(p.total_omset_produk).toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        \`).join('');
                    } else {
                        listEl.innerHTML = '<div class="text-xs text-slate-400 italic p-3 text-center">Belum ada transaksi pada tanggal ini.</div>';
                    }

                    // Render Chart
                    renderChart(d);
                }
            } catch (e) {
                console.error(e);
            }
        }

        function renderChart(data) {
            const ctx = document.getElementById('salesChart').getContext('2d');
            if (chartInstance) chartInstance.destroy();

            const createGrad = (colorRgb) => {
                const grad = ctx.createLinearGradient(0, 0, 0, 260);
                grad.addColorStop(0, 'rgba(' + colorRgb + ', 0.28)');
                grad.addColorStop(0.6, 'rgba(' + colorRgb + ', 0.08)');
                grad.addColorStop(1, 'rgba(' + colorRgb + ', 0.0)');
                return grad;
            };

            const omset = Number(data.total_pendapatan) || 0;
            const modal = Number(data.total_modal) || 0;
            const laba = Number(data.laba_bersih) || 0;

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Buka (08:00)', 'Pagi (10:00)', 'Siang (12:00)', 'Sore (16:00)', 'Malam (19:00)', 'Tutup (21:00)'],
                    datasets: [
                        {
                            label: 'Kurva Omset',
                            data: [0, Math.round(omset * 0.28), Math.round(omset * 0.52), Math.round(omset * 0.74), Math.round(omset * 0.92), omset],
                            borderColor: '#10b981',
                            backgroundColor: createGrad('16, 185, 129'),
                            borderWidth: 3,
                            tension: 0.38,
                            fill: true,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#ffffff',
                            pointRadius: 4.5
                        },
                        {
                            label: 'Kurva Modal HPP',
                            data: [0, Math.round(modal * 0.28), Math.round(modal * 0.52), Math.round(modal * 0.74), Math.round(modal * 0.92), modal],
                            borderColor: '#f59e0b',
                            backgroundColor: createGrad('245, 158, 11'),
                            borderWidth: 2.5,
                            tension: 0.38,
                            fill: true,
                            pointBackgroundColor: '#f59e0b',
                            pointBorderColor: '#ffffff',
                            pointRadius: 4
                        },
                        {
                            label: 'Kurva Laba Bersih',
                            data: [0, Math.round(laba * 0.28), Math.round(laba * 0.52), Math.round(laba * 0.74), Math.round(laba * 0.92), laba],
                            borderColor: '#8b5cf6',
                            backgroundColor: createGrad('139, 92, 246'),
                            borderWidth: 3,
                            tension: 0.38,
                            fill: true,
                            pointBackgroundColor: '#8b5cf6',
                            pointBorderColor: '#ffffff',
                            pointRadius: 5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => ' ' + ctx.dataset.label + ': Rp ' + Number(ctx.raw).toLocaleString('id-ID')
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: val => 'Rp ' + Number(val).toLocaleString('id-ID')
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        document.addEventListener('DOMContentLoaded', muatStatistik);
    </script>
</body>
</html>
`;
};

export const getGreenMartPhpKasir = (): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title>Kasir POS GreenMart - Scan Barcode &amp; Kembalian</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- jsPDF CDN for Client-Side Receipt PDF Export -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      body { font-family: 'Plus Jakarta Sans', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      
      @media print {
        body * { visibility: hidden; }
        #printableReceiptArea, #printableReceiptArea * { visibility: visible; }
        #printableReceiptArea { 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 100% !important; 
          max-width: 80mm !important; 
          margin: 0 !important; 
          padding: 8px !important;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
        }
      }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 antialiased min-h-screen flex flex-col overflow-x-hidden">

    <!-- Header Kasir -->
    <header class="bg-emerald-800 text-white shadow-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <a href="index.php" class="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 transition" title="Kembali ke Dashboard">
                    ⬅️
                </a>
                <div>
                    <h1 class="text-base font-extrabold tracking-tight flex items-center gap-2">
                        <span>Layar Kasir POS GreenMart</span>
                        <span class="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">LIVE SCANNER</span>
                    </h1>
                    <p class="text-[11px] text-emerald-200">Tekan enter setelah scan barcode &bull; Dukung Scanner Laser USB / Bluetooth</p>
                </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
                <span class="text-xs text-emerald-100 hidden sm:inline">Kasir: <strong>Dewi Sartika</strong></span>
                <a href="transaksi.php" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold">
                    🧾 Riwayat
                </a>
                <a href="index.php" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white font-semibold">
                    📊 Statistik
                </a>
            </div>
        </div>
    </header>

    <!-- Main Container Kasir -->
    <main class="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">

        <!-- SISI KIRI: INPUT BARCODE & KERANJANG BELANJA (7 Kolom) -->
        <div class="lg:col-span-7 space-y-4 min-w-0">
            
            <!-- SCAN BARCODE INPUT BOX -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                <label class="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span class="flex items-center gap-1.5">
                        <span class="text-emerald-600">📷</span>
                        <span>Scan Barcode / Kode Barang:</span>
                    </span>
                    <span class="text-[10px] text-slate-400 font-normal">Arahkan scanner laser atau ketik barcode</span>
                </label>
                <div class="flex items-center gap-2">
                    <div class="relative flex-1">
                        <input 
                            type="text" 
                            id="inputBarcode" 
                            placeholder="Contoh: 8992753211029 atau ketik nama barang..." 
                            class="w-full text-base font-mono font-bold p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 text-slate-900 focus:outline-emerald-600 shadow-inner"
                            autofocus
                        >
                    </div>
                    <button 
                        type="button" 
                        onclick="scanBarcodeInput()" 
                        class="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                        <span>Cari / Scan</span> ↵
                    </button>
                </div>

                <!-- FEEDBACK MESSAGE -->
                <div id="scanFeedback" class="hidden text-xs font-semibold p-2.5 rounded-xl"></div>

                <!-- PRESET QUICK SCAN BARCODES -->
                <div class="pt-2 border-t border-slate-100 space-y-1">
                    <span class="text-[10px] text-slate-400 font-bold uppercase">Simulasi Barcode Cepat:</span>
                    <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto" id="quickBarcodesList">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <!-- NOTIFIKASI TRANSAKSI TERAKHIR (EXPORT PDF / DIRECT WEB / CETAK) -->
            <div id="lastTrxBar" class="hidden p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-2xl shrink-0">✅</span>
                    <div class="min-w-0">
                        <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>Nota: <strong class="font-mono text-emerald-800" id="lastTrxNota">-</strong></span>
                            <span class="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-200 text-emerald-900" id="lastTrxTotal">-</span>
                        </div>
                        <div class="text-[11px] text-slate-500 truncate" id="lastTrxDesc">
                            Transaksi berhasil disimpan &amp; stok dipotong
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button type="button" onclick="exportLastTrxPdf()" class="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer">
                        <span>📄 Export PDF</span>
                    </button>
                    <button type="button" onclick="openLastTrxWeb()" class="px-2.5 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer">
                        <span>🌐 Direct ke Web</span>
                    </button>
                    <button type="button" onclick="bukaModalStrukTerakhir()" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer">
                        <span>🖨️ Cetak Struk</span>
                    </button>
                    <button type="button" onclick="document.getElementById('lastTrxBar').classList.add('hidden')" class="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                </div>
            </div>

            <!-- TABEL KERANJANG BELANJA (CART) -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-xs text-slate-800 uppercase">Keranjang Belanja</span>
                        <span id="cartCountBadge" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">0 Item</span>
                    </div>
                    <button type="button" onclick="clearCart()" class="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer">
                        🗑️ Kosongkan Keranjang
                    </button>
                </div>

                <div class="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100" id="cartItemsList">
                    <div class="text-center py-12 text-slate-400 text-xs italic">
                        Keranjang masih kosong. Scan barcode barang untuk memulai!
                    </div>
                </div>
            </div>

        </div>

        <!-- SISI KANAN: KALKULATOR TOTAL & KEMBALIAN (5 Kolom) -->
        <div class="lg:col-span-5 space-y-4 min-w-0">

            <!-- TOTAL BILL BOX -->
            <div class="bg-emerald-900 text-white p-5 rounded-2xl shadow-md space-y-2">
                <div class="flex items-center justify-between text-xs text-emerald-200 uppercase font-bold tracking-wider">
                    <span>Total Tagihan Belanja</span>
                    <span>GreenMart POS</span>
                </div>
                <div class="text-3xl sm:text-4xl font-black font-mono tracking-tight" id="displayGrandTotal">
                    Rp 0
                </div>
                <div class="text-[11px] text-emerald-300 flex items-center justify-between pt-2 border-t border-emerald-800">
                    <span id="displayTotalItems">0 Jenis Barang</span>
                    <span>Sudah Termasuk PPN</span>
                </div>
            </div>

            <!-- PAYMENT & CHANGE CALCULATOR -->
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                
                <!-- METODE PEMBAYARAN -->
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                    <select id="selectMetodeBayar" onchange="hitungKembalian()" class="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-emerald-500">
                        <option value="tunai">💵 Uang Tunai / Cash</option>
                        <option value="qris">📱 QRIS / E-Wallet</option>
                        <option value="transfer">🏦 Transfer Bank</option>
                        <option value="piutang">📝 Piutang / Kasbon</option>
                    </select>
                </div>

                <!-- NOMINAL UANG TUNAI DITERIMA -->
                <div>
                    <label class="block text-xs font-black text-slate-800 uppercase mb-1">
                        Uang Yang Diterima Dari Pembeli (Rp) <span class="text-rose-500">*</span>
                    </label>
                    <div class="flex items-stretch rounded-xl border-2 border-emerald-500 bg-white overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/20">
                        <span class="px-3 bg-emerald-600 text-white font-mono font-bold text-sm flex items-center">Rp</span>
                        <input 
                            type="number" 
                            id="inputBayar" 
                            oninput="hitungKembalian()" 
                            placeholder="0" 
                            class="w-full text-2xl font-black font-mono p-2.5 text-slate-900 focus:outline-none"
                        >
                    </div>
                </div>

                <!-- TOMBOL CEPAT PECAHAN RUPIAH -->
                <div class="space-y-1.5">
                    <span class="text-[10px] font-bold text-slate-400 uppercase">Pecahan Cepat:</span>
                    <div class="flex flex-wrap gap-1">
                        <button type="button" onclick="setCashPas()" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 cursor-pointer">
                            Uang Pas
                        </button>
                        <button type="button" onclick="setCashNominal(10000)" class="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
                            10k
                        </button>
                        <button type="button" onclick="setCashNominal(20000)" class="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
                            20k
                        </button>
                        <button type="button" onclick="setCashNominal(50000)" class="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
                            50k
                        </button>
                        <button type="button" onclick="setCashNominal(100000)" class="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
                            100k
                        </button>
                    </div>
                </div>

                <!-- KOTAK HASIL KEMBALIAN OTOMATIS -->
                <div id="changeBanner" class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-600 block">Kembalian Pembeli:</span>
                        <span id="changeStatus" class="text-[10px] text-slate-400">Masukkan nominal uang</span>
                    </div>
                    <div id="changeAmountDisplay" class="text-xl font-black font-mono text-slate-900">
                        Rp 0
                    </div>
                </div>

                <!-- NAMA PELANGGAN (OPSIONAL) -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Nama Pelanggan (Opsional)</label>
                    <input type="text" id="inputPelanggan" placeholder="Pelanggan Umum" class="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-emerald-500">
                </div>

                <!-- TOMBOL SELESAIKAN & CETAK STRUK -->
                <button 
                    type="button" 
                    onclick="selesaikanTransaksi()" 
                    id="btnCheckout" 
                    class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>✅ Selesaikan &amp; Cetak Struk</span>
                </button>

            </div>

        </div>

    </main>

    <!-- MODAL STRUK CETAK THERMAL & EXPORT PDF / DIRECT WEB -->
    <div id="modalStruk" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs hidden items-center justify-center p-3 sm:p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            <div class="flex items-center justify-between border-b pb-3 shrink-0">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shadow-inner">GM</div>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900 leading-tight">Struk Pembayaran GreenMart</h3>
                        <p class="text-[11px] text-slate-400" id="modalStrukNotaSubtitle">Format Struk Kasir Thermal &bull; Siap Cetak</p>
                    </div>
                </div>
                <button onclick="tutupModalStruk()" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold cursor-pointer">✕</button>
            </div>
            
            <!-- Area Cetak Struk Monospace -->
            <div class="flex-1 overflow-y-auto pr-1">
                <div id="printableReceiptArea" class="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner max-w-md mx-auto text-slate-900">
                    <div id="strukReceiptContent"></div>
                </div>
            </div>

            <!-- Baris Tombol Aksi: Cetak, PDF, Web, Salin -->
            <div class="space-y-2 pt-2 border-t shrink-0">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button type="button" onclick="cetakStrukPrinter()" class="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition cursor-pointer">
                        <span>🖨️ Cetak</span>
                    </button>
                    <button type="button" onclick="exportStrukPdf()" class="py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition cursor-pointer">
                        <span>📄 PDF</span>
                    </button>
                    <button type="button" onclick="directStrukWeb()" class="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition cursor-pointer">
                        <span>🌐 Web</span>
                    </button>
                    <button type="button" onclick="salinTeksStruk()" class="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-300 transition cursor-pointer">
                        <span>📋 Salin</span>
                    </button>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span id="copyToastMsg">Dukung thermal 58mm &amp; 80mm</span>
                    <button type="button" onclick="tutupModalStruk()" class="font-bold text-slate-600 hover:text-slate-900 cursor-pointer">Tutup (Esc)</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Data Produk dari Database GreenMart
        let allProducts = [];
        let cart = [];
        let currentReceiptData = null;
        let lastCompletedTrx = null;

        // Audio Beep Laser POS Kasir
        function playLaserBeep() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1950, ctx.currentTime);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.085);
            } catch(e) {}
        }

        async function muatProduk() {
            try {
                const res = await fetch('api.php?action=get_produk');
                const json = await res.json();
                if (json.success) {
                    allProducts = json.data;
                    renderQuickBarcodes();
                }
            } catch(e) {
                console.error(e);
            }
        }

        function renderQuickBarcodes() {
            const list = document.getElementById('quickBarcodesList');
            if (!list) return;
            list.innerHTML = allProducts.slice(0, 10).map(p => \`
                <button type="button" onclick="tambahKeKeranjangByBarcode('\${p.barcode}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-emerald-100 border border-slate-200 text-slate-700 transition cursor-pointer">
                    \${p.nama_produk.split(' ')[0]} (\${p.barcode.slice(-4)})
                </button>
            \`).join('');
        }

        function scanBarcodeInput() {
            const barcodeVal = document.getElementById('inputBarcode').value.trim();
            if (!barcodeVal) return;
            tambahKeKeranjangByBarcode(barcodeVal);
            document.getElementById('inputBarcode').value = '';
            document.getElementById('inputBarcode').focus();
        }

        document.getElementById('inputBarcode').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                scanBarcodeInput();
            }
        });

        function tambahKeKeranjangByBarcode(barcode) {
            const prod = allProducts.find(p => p.barcode === barcode || p.nama_produk.toLowerCase().includes(barcode.toLowerCase()));
            const feedback = document.getElementById('scanFeedback');

            if (!prod) {
                feedback.className = 'text-xs font-semibold p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 block';
                feedback.innerText = '❌ Barcode "' + barcode + '" tidak ditemukan dalam database GreenMart!';
                setTimeout(() => feedback.classList.add('hidden'), 3500);
                return;
            }

            playLaserBeep();

            // Cek apakah sudah ada di cart
            const exist = cart.find(c => c.barcode === prod.barcode);
            if (exist) {
                if (exist.qty + 1 > prod.stok) {
                    alert('Stok tidak mencukupi! Sisa stok ' + prod.stok + ' unit.');
                    return;
                }
                exist.qty += 1;
                exist.subtotal = exist.qty * prod.harga_jual;
            } else {
                if (prod.stok < 1) {
                    alert('Barang ini sudah habis stoknya!');
                    return;
                }
                cart.push({
                    id: prod.id,
                    barcode: prod.barcode,
                    nama_produk: prod.nama_produk,
                    harga_jual: Number(prod.harga_jual),
                    harga_beli: Number(prod.harga_beli),
                    satuan: prod.satuan,
                    qty: 1,
                    diskon_persen: 0,
                    subtotal: Number(prod.harga_jual)
                });
            }

            feedback.className = 'text-xs font-semibold p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 block';
            feedback.innerText = '✅ Berhasil scan: ' + prod.nama_produk + ' (Rp ' + Number(prod.harga_jual).toLocaleString('id-ID') + ')';
            setTimeout(() => feedback.classList.add('hidden'), 2500);

            renderCart();
        }

        function updateQty(barcode, change) {
            const item = cart.find(c => c.barcode === barcode);
            if (!item) return;
            const prod = allProducts.find(p => p.barcode === barcode);
            const nextQty = item.qty + change;
            if (nextQty <= 0) {
                cart = cart.filter(c => c.barcode !== barcode);
            } else {
                if (prod && nextQty > prod.stok) {
                    alert('Stok maksimal tercapai: ' + prod.stok);
                    return;
                }
                item.qty = nextQty;
                item.subtotal = item.qty * item.harga_jual;
            }
            renderCart();
        }

        function clearCart() {
            cart = [];
            renderCart();
        }

        function renderCart() {
            const listEl = document.getElementById('cartItemsList');
            const countEl = document.getElementById('cartCountBadge');
            countEl.innerText = cart.length + ' Item';

            if (cart.length === 0) {
                listEl.innerHTML = '<div class="text-center py-12 text-slate-400 text-xs italic">Keranjang masih kosong. Scan barcode barang untuk memulai!</div>';
                updateTotals();
                return;
            }

            listEl.innerHTML = cart.map(item => \`
                <div class="py-2.5 flex items-center justify-between text-xs">
                    <div class="space-y-0.5">
                        <div class="font-bold text-slate-900">\${item.nama_produk}</div>
                        <div class="text-[11px] text-slate-400 font-mono">Rp \${item.harga_jual.toLocaleString('id-ID')} / \${item.satuan}</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button type="button" onclick="updateQty('\${item.barcode}', -1)" class="px-2 py-1 font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">-</button>
                            <span class="px-2 font-mono font-bold text-slate-800">\${item.qty}</span>
                            <button type="button" onclick="updateQty('\${item.barcode}', 1)" class="px-2 py-1 font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">+</button>
                        </div>
                        <div class="font-bold font-mono text-emerald-700 w-24 text-right">
                            Rp \${item.subtotal.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
            \`).join('');

            updateTotals();
        }

        function getGrandTotal() {
            return cart.reduce((sum, item) => sum + item.subtotal, 0);
        }

        function updateTotals() {
            const total = getGrandTotal();
            document.getElementById('displayGrandTotal').innerText = 'Rp ' + total.toLocaleString('id-ID');
            document.getElementById('displayTotalItems').innerText = cart.length + ' Macam Barang';
            hitungKembalian();
        }

        function hitungKembalian() {
            const grandTotal = getGrandTotal();
            const metode = document.getElementById('selectMetodeBayar').value;
            const cash = parseFloat(document.getElementById('inputBayar').value) || 0;
            const changeDisplay = document.getElementById('changeAmountDisplay');
            const changeStatus = document.getElementById('changeStatus');
            const changeBanner = document.getElementById('changeBanner');

            if (metode === 'piutang') {
                changeDisplay.innerText = 'Rp 0';
                changeStatus.innerText = 'Status: Dicatat Piutang';
                changeBanner.className = 'p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center justify-between';
                return;
            }

            if (grandTotal === 0) {
                changeDisplay.innerText = 'Rp 0';
                changeStatus.innerText = 'Keranjang kosong';
                return;
            }

            if (cash >= grandTotal) {
                const change = cash - grandTotal;
                changeDisplay.innerText = 'Rp ' + change.toLocaleString('id-ID');
                changeStatus.innerText = change === 0 ? 'Uang Pas! Transaksi Lunas' : 'Kembalian ke Pembeli';
                changeBanner.className = 'p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center justify-between';
            } else {
                const sisa = grandTotal - cash;
                changeDisplay.innerText = 'Kurang: Rp ' + sisa.toLocaleString('id-ID');
                changeStatus.innerText = 'Uang bayar kurang (Piutang)';
                changeBanner.className = 'p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex items-center justify-between';
            }
        }

        function setCashPas() {
            document.getElementById('inputBayar').value = getGrandTotal();
            hitungKembalian();
        }

        function setCashNominal(nom) {
            document.getElementById('inputBayar').value = nom;
            hitungKembalian();
        }

        async function selesaikanTransaksi() {
            if (cart.length === 0) {
                alert('Keranjang belanja masih kosong!');
                return;
            }
            const grandTotal = getGrandTotal();
            const metode = document.getElementById('selectMetodeBayar').value;
            const bayar = parseFloat(document.getElementById('inputBayar').value) || 0;
            const pelanggan = document.getElementById('inputPelanggan').value.trim() || 'Pelanggan Umum';

            if (metode === 'tunai' && bayar < grandTotal) {
                if (!confirm('Uang yang dibayar kurang dari total belanja! Transaksi akan dicatat sebagai PIUTANG. Lanjutkan?')) {
                    return;
                }
            }

            try {
                const itemsToSave = [...cart];
                const res = await fetch('api.php?action=simpan_transaksi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: itemsToSave,
                        kasir: 'Dewi Sartika',
                        pelanggan: pelanggan,
                        metode_bayar: metode,
                        bayar: bayar,
                        diskon: 0
                    })
                });
                const json = await res.json();
                if (json.success) {
                    const trx = json.data;
                    currentReceiptData = { trx, items: itemsToSave, pelanggan, metode };
                    lastCompletedTrx = currentReceiptData;

                    // Update last transaction bar
                    document.getElementById('lastTrxNota').innerText = trx.no_nota;
                    document.getElementById('lastTrxTotal').innerText = 'Rp ' + Number(trx.total_belanja).toLocaleString('id-ID');
                    document.getElementById('lastTrxDesc').innerText = 'Pelanggan: ' + pelanggan + ' • Status: ' + trx.status_bayar;
                    document.getElementById('lastTrxBar').classList.remove('hidden');

                    renderStruk(trx, itemsToSave, pelanggan);
                    cart = [];
                    renderCart();
                    document.getElementById('inputBayar').value = '';
                    muatProduk(); // refresh stok
                } else {
                    alert('Gagal: ' + json.message);
                }
            } catch(e) {
                alert('Error komunikasi server');
            }
        }

        function generateReceiptText(trx, items, pelanggan) {
            const line = '------------------------------------------';
            let txt = '              GREENMART POS               \\n';
            txt += '         STRUK PEMBAYARAN RESMI           \\n';
            txt += '       Fresh & Daily Supermarket          \\n';
            txt += '  Jl. Ki Mangunsarkoro No.2, 03, Dracik   \\n';
            txt += '  Barat, Proyonanggan Sel., Batang 51216  \\n';
            txt += line + '\\n';
            txt += 'No. Nota : ' + trx.no_nota + '\\n';
            txt += 'Tanggal  : ' + trx.tanggal + ' ' + trx.waktu + '\\n';
            txt += 'Kasir    : Dewi Sartika\\n';
            txt += 'Customer : ' + pelanggan + '\\n';
            txt += line + '\\n';
            items.forEach(i => {
                txt += i.nama_produk + '\\n';
                const subStr = 'Rp ' + Number(i.subtotal).toLocaleString('id-ID');
                const qtyStr = '  ' + i.qty + ' ' + i.satuan + ' x Rp ' + Number(i.harga_jual).toLocaleString('id-ID');
                const spaces = Math.max(1, 42 - qtyStr.length - subStr.length);
                txt += qtyStr + ' '.repeat(spaces) + subStr + '\\n';
            });
            txt += line + '\\n';
            txt += 'Subtotal      : Rp ' + Number(trx.total_belanja).toLocaleString('id-ID') + '\\n';
            txt += 'TOTAL BELANJA : Rp ' + Number(trx.total_belanja).toLocaleString('id-ID') + '\\n';
            txt += 'BAYAR         : Rp ' + Number(trx.bayar).toLocaleString('id-ID') + '\\n';
            txt += 'KEMBALIAN     : Rp ' + Number(trx.kembalian).toLocaleString('id-ID') + '\\n';
            txt += 'STATUS        : ' + trx.status_bayar + '\\n';
            txt += line + '\\n';
            txt += '    Terima kasih atas kunjungan Anda!     \\n';
            txt += '     Simpan struk ini sebagai bukti       \\n';
            return txt;
        }

        function renderStruk(trx, items, pelanggan) {
            const txt = generateReceiptText(trx, items, pelanggan);
            document.getElementById('strukReceiptContent').innerText = txt;
            document.getElementById('modalStrukNotaSubtitle').innerText = 'Nota: ' + trx.no_nota + ' • ' + pelanggan;
            document.getElementById('modalStruk').classList.remove('hidden');
            document.getElementById('modalStruk').classList.add('flex');
        }

        function tutupModalStruk() {
            document.getElementById('modalStruk').classList.add('hidden');
            document.getElementById('modalStruk').classList.remove('flex');
        }

        function bukaModalStrukTerakhir() {
            if (!lastCompletedTrx) return;
            renderStruk(lastCompletedTrx.trx, lastCompletedTrx.items, lastCompletedTrx.pelanggan);
        }

        function cetakStrukPrinter() {
            window.print();
        }

        function exportStrukPdf() {
            if (!currentReceiptData) return;
            const { trx, items, pelanggan } = currentReceiptData;
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Library PDF sedang memuat, silakan coba sesaat lagi.');
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                unit: 'mm',
                format: [80, 210]
            });

            doc.setFont('courier', 'normal');
            doc.setFontSize(9);

            let y = 10;
            doc.setFont('courier', 'bold');
            doc.text('GREENMART POS', 40, y, { align: 'center' }); y += 4.5;
            doc.setFont('courier', 'normal');
            doc.setFontSize(7.5);
            doc.text('STRUK PEMBAYARAN RESMI', 40, y, { align: 'center' }); y += 3.5;
            doc.text('Fresh & Daily Supermarket', 40, y, { align: 'center' }); y += 4;
            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4;

            doc.text('No Nota : ' + trx.no_nota, 5, y); y += 3.5;
            doc.text('Tanggal : ' + trx.tanggal + ' ' + trx.waktu, 5, y); y += 3.5;
            doc.text('Kasir   : Dewi Sartika', 5, y); y += 3.5;
            doc.text('Customer: ' + pelanggan, 5, y); y += 3.5;
            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4;

            items.forEach(it => {
                doc.setFont('courier', 'bold');
                doc.text(it.nama_produk.slice(0, 32), 5, y); y += 3.5;
                doc.setFont('courier', 'normal');
                doc.text('  ' + it.qty + ' ' + it.satuan + ' x Rp ' + Number(it.harga_jual).toLocaleString('id-ID'), 5, y);
                doc.text('Rp ' + Number(it.subtotal).toLocaleString('id-ID'), 75, y, { align: 'right' }); y += 3.8;
            });

            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4;
            doc.text('Subtotal     : Rp ' + Number(trx.total_belanja).toLocaleString('id-ID'), 5, y); y += 3.5;
            doc.setFont('courier', 'bold');
            doc.text('TOTAL        : Rp ' + Number(trx.total_belanja).toLocaleString('id-ID'), 5, y); y += 3.5;
            doc.setFont('courier', 'normal');
            doc.text('Bayar        : Rp ' + Number(trx.bayar).toLocaleString('id-ID'), 5, y); y += 3.5;
            doc.text('Kembalian    : Rp ' + Number(trx.kembalian).toLocaleString('id-ID'), 5, y); y += 3.5;
            doc.text('Status       : ' + trx.status_bayar, 5, y); y += 3.5;
            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4.5;
            doc.text('Terima kasih atas kunjungan Anda!', 40, y, { align: 'center' });

            doc.save('Struk_GreenMart_' + trx.no_nota + '.pdf');
        }

        function exportLastTrxPdf() {
            if (!lastCompletedTrx) return;
            currentReceiptData = lastCompletedTrx;
            exportStrukPdf();
        }

        function directStrukWeb() {
            if (!currentReceiptData) return;
            const nota = currentReceiptData.trx.no_nota;
            window.open('struk.php?nota=' + encodeURIComponent(nota), '_blank');
        }

        function openLastTrxWeb() {
            if (!lastCompletedTrx) return;
            window.open('struk.php?nota=' + encodeURIComponent(lastCompletedTrx.trx.no_nota), '_blank');
        }

        function salinTeksStruk() {
            const txt = document.getElementById('strukReceiptContent').innerText;
            if (!txt) return;
            navigator.clipboard.writeText(txt).then(() => {
                const toast = document.getElementById('copyToastMsg');
                toast.innerText = '✅ Teks struk berhasil disalin!';
                toast.className = 'font-bold text-emerald-600';
                setTimeout(() => {
                    toast.innerText = 'Dukung thermal 58mm & 80mm';
                    toast.className = 'text-[11px] text-slate-500';
                }, 2500);
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                tutupModalStruk();
            }
        });

        document.addEventListener('DOMContentLoaded', muatProduk);
    </script>
</body>
</html>
`;
};

export const getGreenMartPhpProduk = (): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title>Manajemen Stok &amp; Barang - GreenMart</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      body { font-family: 'Plus Jakarta Sans', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col">

    <header class="bg-emerald-800 text-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <a href="index.php" class="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 transition">⬅️</a>
                <div>
                    <h1 class="text-base font-extrabold tracking-tight">Manajemen Inventori &amp; Stok Barang</h1>
                    <p class="text-[11px] text-emerald-200">Database MySQL \`produk\` &bull; GreenMart</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <a href="kasir.php" class="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs">🛒 Buka Kasir</a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-4">
        
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div class="relative w-full sm:w-80">
                <input type="text" id="searchInput" oninput="filterTable()" placeholder="Cari barcode / nama barang..." class="w-full text-xs p-2.5 rounded-xl border border-slate-300">
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-500">Filter Kategori:</span>
                <select id="kategoriFilter" onchange="filterTable()" class="text-xs p-2 rounded-xl border border-slate-300">
                    <option value="">Semua Kategori</option>
                    <option value="Sembako & Beras">Sembako &amp; Beras</option>
                    <option value="Minyak & Bumbu Dapur">Minyak &amp; Bumbu</option>
                    <option value="Sayur & Buah Segar">Sayur &amp; Buah</option>
                    <option value="Minuman & Susu">Minuman &amp; Susu</option>
                    <option value="Makanan Ringan & Mie">Makanan &amp; Mie</option>
                </select>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider">
                        <tr>
                            <th class="p-3">Barcode</th>
                            <th class="p-3">Nama Produk</th>
                            <th class="p-3">Kategori</th>
                            <th class="p-3">Harga Beli</th>
                            <th class="p-3">Harga Jual</th>
                            <th class="p-3">Sisa Stok</th>
                            <th class="p-3 text-right">Quick Restock</th>
                        </tr>
                    </thead>
                    <tbody id="productTableBody" class="divide-y divide-slate-100">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>

    </main>

    <script>
        let products = [];

        async function muat() {
            const res = await fetch('api.php?action=get_produk');
            const json = await res.json();
            if (json.success) {
                products = json.data;
                filterTable();
            }
        }

        function filterTable() {
            const q = document.getElementById('searchInput').value.toLowerCase();
            const cat = document.getElementById('kategoriFilter').value;

            const filtered = products.filter(p => {
                const matchQ = p.nama_produk.toLowerCase().includes(q) || p.barcode.includes(q);
                const matchCat = !cat || p.nama_kategori === cat;
                return matchQ && matchCat;
            });

            const tbody = document.getElementById('productTableBody');
            tbody.innerHTML = filtered.map(p => {
                const stok = Number(p.stok);
                const isLow = stok <= Number(p.min_stok);
                const isOut = stok <= 0;
                let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                if (isOut) badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                else if (isLow) badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

                return \`
                    <tr class="hover:bg-slate-50">
                        <td class="p-3 font-mono font-bold text-slate-900">\${p.barcode}</td>
                        <td class="p-3 font-semibold text-slate-900">\${p.nama_produk}</td>
                        <td class="p-3 text-slate-500">\${p.nama_kategori}</td>
                        <td class="p-3 font-mono text-slate-500">Rp \${Number(p.harga_beli).toLocaleString('id-ID')}</td>
                        <td class="p-3 font-mono font-bold text-emerald-700">Rp \${Number(p.harga_jual).toLocaleString('id-ID')}</td>
                        <td class="p-3">
                            <span class="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] border \${badgeClass}">
                                \${stok} \${p.satuan}
                            </span>
                        </td>
                        <td class="p-3 text-right">
                            <button onclick="restock(\${p.id}, 10)" class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                +10
                            </button>
                            <button onclick="restock(\${p.id}, 50)" class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 ml-1">
                                +50
                            </button>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        async function restock(id, qty) {
            await fetch('api.php?action=tambah_stok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ produk_id: id, jumlah_tambah: qty })
            });
            muat();
        }

        document.addEventListener('DOMContentLoaded', muat);
    </script>
</body>
</html>
`;
};

export const getGreenMartPhpStruk = (): string => {
  return `<?php
require_once __DIR__ . '/config.php';
$pdo = getDB();

$noNota = trim($_GET['nota'] ?? $_GET['no_nota'] ?? '');
$id = intval($_GET['id'] ?? 0);

if ($noNota) {
    $stmt = $pdo->prepare("SELECT * FROM transaksi WHERE no_nota = ? LIMIT 1");
    $stmt->execute([$noNota]);
    $trx = $stmt->fetch();
} elseif ($id > 0) {
    $stmt = $pdo->prepare("SELECT * FROM transaksi WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $trx = $stmt->fetch();
} else {
    // Ambil transaksi terbaru jika tanpa parameter
    $stmt = $pdo->query("SELECT * FROM transaksi ORDER BY id DESC LIMIT 1");
    $trx = $stmt->fetch();
}

if (!$trx) {
    die("Transaksi tidak ditemukan.");
}

$stmtItems = $pdo->prepare("SELECT * FROM transaksi_detail WHERE transaksi_id = ? ORDER BY id ASC");
$stmtItems->execute([$trx['id']]);
$items = $stmtItems->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title>Struk Pembayaran GreenMart - <?= htmlspecialchars($trx['no_nota']) ?></title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- jsPDF CDN for Client-Side Receipt PDF Export -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      body { font-family: 'Plus Jakarta Sans', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; margin: 0 !important; padding: 0 !important; }
        .receipt-card { 
          border: none !important; 
          box-shadow: none !important; 
          width: 100% !important; 
          max-width: 80mm !important; 
          margin: 0 !important; 
          padding: 6px !important; 
        }
      }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 antialiased min-h-screen py-6 px-3 flex flex-col items-center overflow-x-hidden">

    <!-- Top Action Bar (Hidden when printed) -->
    <div class="no-print max-w-sm w-full mb-4 flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center gap-1.5">
            <a href="kasir.php" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                🛒 Kasir
            </a>
            <a href="transaksi.php" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition">
                🧾 Riwayat
            </a>
        </div>
        <div class="flex items-center gap-1.5">
            <button type="button" onclick="exportPdf()" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                <span>📄 PDF</span>
            </button>
            <button type="button" onclick="window.print()" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer">
                <span>🖨️ Cetak</span>
            </button>
        </div>
    </div>

    <!-- Thermal Paper Card (320px - 80mm equivalent) -->
    <div class="receipt-card bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-md max-w-sm w-full font-mono text-xs leading-relaxed text-slate-900">
        
        <!-- Header Toko -->
        <div class="text-center pb-3 border-b-2 border-dashed border-slate-300 space-y-1">
            <div class="w-10 h-10 rounded-xl bg-emerald-700 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-inner">
                🛒
            </div>
            <h1 class="text-base font-black tracking-wider text-slate-950 uppercase mt-1">GREENMART</h1>
            <p class="text-[10px] text-slate-500 font-sans font-semibold">Fresh &amp; Daily Supermarket</p>
            <p class="text-[9px] text-slate-400 font-sans">Jl. Raya Hijau Makmur No. 12 &bull; Telp: (021) 8899-7711</p>
        </div>

        <!-- Meta Nota -->
        <div class="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div class="flex justify-between">
                <span class="text-slate-500">No. Nota:</span>
                <span class="font-bold text-slate-950"><?= htmlspecialchars($trx['no_nota']) ?></span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-500">Tanggal/Waktu:</span>
                <span><?= $trx['tanggal'] ?> <?= substr($trx['waktu'], 0, 5) ?></span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-500">Kasir:</span>
                <span><?= htmlspecialchars($trx['kasir']) ?></span>
            </div>
            <div class="flex justify-between">
                <span class="text-slate-500">Pelanggan:</span>
                <span class="font-bold"><?= htmlspecialchars($trx['pelanggan']) ?></span>
            </div>
        </div>

        <!-- Rincian Produk -->
        <div class="py-2.5 border-b-2 border-dashed border-slate-300 space-y-2">
            <?php foreach ($items as $item): ?>
                <div class="space-y-0.5">
                    <div class="font-bold text-slate-950"><?= htmlspecialchars($item['nama_produk']) ?></div>
                    <div class="flex justify-between text-[11px] text-slate-600">
                        <span><?= $item['qty'] ?> <?= htmlspecialchars($item['satuan']) ?> x <?= number_format($item['harga_jual'], 0, ',', '.') ?></span>
                        <span class="font-bold text-slate-950">Rp <?= number_format($item['subtotal'], 0, ',', '.') ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Kalkulasi Total -->
        <div class="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1.5 text-xs">
            <div class="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>Rp <?= number_format($trx['subtotal'], 0, ',', '.') ?></span>
            </div>
            <?php if (floatval($trx['diskon']) > 0): ?>
            <div class="flex justify-between text-amber-700">
                <span>Diskon:</span>
                <span>-Rp <?= number_format($trx['diskon'], 0, ',', '.') ?></span>
            </div>
            <?php endif; ?>
            <div class="flex justify-between text-sm font-black pt-1 border-t border-slate-200 text-slate-950">
                <span>TOTAL BELANJA:</span>
                <span>Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?></span>
            </div>
            <div class="flex justify-between text-slate-600 pt-1">
                <span>Metode Pembayaran:</span>
                <span class="uppercase font-bold"><?= htmlspecialchars($trx['metode_bayar']) ?></span>
            </div>
            <div class="flex justify-between text-slate-600">
                <span>Uang Diterima:</span>
                <span>Rp <?= number_format($trx['bayar'], 0, ',', '.') ?></span>
            </div>
            <div class="flex justify-between font-bold text-emerald-800">
                <span>Kembalian:</span>
                <span>Rp <?= number_format($trx['kembalian'], 0, ',', '.') ?></span>
            </div>
            <div class="flex justify-between items-center pt-1">
                <span>Status Bayar:</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold <?= $trx['status_bayar'] === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                    <?= htmlspecialchars($trx['status_bayar']) ?>
                </span>
            </div>
        </div>

        <!-- Footer Struk -->
        <div class="pt-3 text-center space-y-1 text-[10px] text-slate-500">
            <p class="font-bold text-slate-700">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
            <p>Barang yang sudah dibeli dapat ditukar maksimal 1x24 jam dengan membawa struk resmi ini.</p>
            <p class="font-mono text-[9px] text-slate-400">GreenMart POS &bull; www.greenmart.id</p>
        </div>

    </div>

    <script>
        function exportPdf() {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert('Library jsPDF sedang dimuat...');
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                unit: 'mm',
                format: [80, 210]
            });

            doc.setFont('courier', 'normal');
            doc.setFontSize(9);
            
            let y = 10;
            doc.setFont('courier', 'bold');
            doc.text('GREENMART POS', 40, y, { align: 'center' }); y += 4.5;
            doc.setFont('courier', 'normal');
            doc.setFontSize(7.5);
            doc.text('STRUK PEMBAYARAN RESMI', 40, y, { align: 'center' }); y += 3.5;
            doc.text('Fresh & Daily Supermarket', 40, y, { align: 'center' }); y += 4;
            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4;

            doc.text('No Nota : <?= addslashes($trx['no_nota']) ?>', 5, y); y += 3.5;
            doc.text('Waktu   : <?= $trx['tanggal'] ?> <?= substr($trx['waktu'], 0, 5) ?>', 5, y); y += 3.5;
            doc.text('Kasir   : <?= addslashes($trx['kasir']) ?>', 5, y); y += 3.5;
            doc.text('Customer: <?= addslashes($trx['pelanggan']) ?>', 5, y); y += 3.5;
            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4;

            <?php foreach ($items as $it): ?>
                doc.setFont('courier', 'bold');
                doc.text('<?= addslashes(substr($it['nama_produk'], 0, 32)) ?>', 5, y); y += 3.5;
                doc.setFont('courier', 'normal');
                doc.text('  <?= $it['qty'] ?> <?= addslashes($it['satuan']) ?> x Rp <?= number_format($it['harga_jual'], 0, ',', '.') ?>', 5, y);
                doc.text('Rp <?= number_format($it['subtotal'], 0, ',', '.') ?>', 75, y, { align: 'right' }); y += 3.8;
            <?php endforeach; ?>

            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4;
            doc.text('Subtotal     : Rp <?= number_format($trx['subtotal'], 0, ',', '.') ?>', 5, y); y += 3.5;
            <?php if (floatval($trx['diskon']) > 0): ?>
            doc.text('Diskon       : -Rp <?= number_format($trx['diskon'], 0, ',', '.') ?>', 5, y); y += 3.5;
            <?php endif; ?>
            doc.setFont('courier', 'bold');
            doc.text('TOTAL        : Rp <?= number_format($trx['total_belanja'], 0, ',', '.') ?>', 5, y); y += 3.5;
            doc.setFont('courier', 'normal');
            doc.text('Bayar (<?= strtoupper($trx['metode_bayar']) ?>): Rp <?= number_format($trx['bayar'], 0, ',', '.') ?>', 5, y); y += 3.5;
            doc.text('Kembalian    : Rp <?= number_format($trx['kembalian'], 0, ',', '.') ?>', 5, y); y += 3.5;
            doc.text('Status       : <?= $trx['status_bayar'] ?>', 5, y); y += 3.5;
            doc.text('------------------------------------------', 40, y, { align: 'center' }); y += 4.5;
            doc.text('Terima kasih atas kunjungan Anda!', 40, y, { align: 'center' });

            doc.save('Struk_GreenMart_<?= addslashes($trx['no_nota']) ?>.pdf');
        }

        // Auto print trigger if ?print=1
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('print') === '1') {
            setTimeout(() => window.print(), 350);
        }
        if (urlParams.get('pdf') === '1') {
            setTimeout(() => exportPdf(), 500);
        }
    </script>
</body>
</html>
`;
};

export const getGreenMartPhpTransaksi = (): string => {
  return `<?php
require_once __DIR__ . '/config.php';
$pdo = getDB();

$stmt = $pdo->query("SELECT * FROM transaksi ORDER BY id DESC LIMIT 50");
$transactions = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title>Riwayat Transaksi - GreenMart</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
      body { font-family: 'Plus Jakarta Sans', sans-serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col overflow-x-hidden">

    <header class="bg-emerald-800 text-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <a href="index.php" class="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 transition">⬅️</a>
                <div>
                    <h1 class="text-base font-extrabold tracking-tight">Riwayat Transaksi &amp; Nota Pembayaran</h1>
                    <p class="text-[11px] text-emerald-200">Tersimpan dalam database MySQL \`transaksi\`</p>
                </div>
            </div>
            <a href="kasir.php" class="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs">🛒 Transaksi Baru</a>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-4 min-w-0">
        
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 class="text-xs font-bold text-slate-800 uppercase">Daftar Transaksi Kasir Terakhir</h3>
                <span class="text-xs text-slate-500"><?= count($transactions) ?> Transaksi</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black">
                        <tr>
                            <th class="p-3">No. Nota</th>
                            <th class="p-3">Waktu</th>
                            <th class="p-3">Pelanggan</th>
                            <th class="p-3">Kasir</th>
                            <th class="p-3">Item</th>
                            <th class="p-3">Metode</th>
                            <th class="p-3">Total Belanja</th>
                            <th class="p-3">Status</th>
                            <th class="p-3 text-right">Aksi Struk</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($transactions)): ?>
                            <tr><td colspan="9" class="p-6 text-center text-slate-400 italic">Belum ada riwayat transaksi.</td></tr>
                        <?php else: foreach ($transactions as $t): ?>
                            <tr class="hover:bg-slate-50">
                                <td class="p-3 font-mono font-bold text-slate-900"><?= htmlspecialchars($t['no_nota']) ?></td>
                                <td class="p-3 text-slate-500 font-mono"><?= $t['tanggal'] ?> <?= substr($t['waktu'], 0, 5) ?></td>
                                <td class="p-3 font-semibold text-slate-800"><?= htmlspecialchars($t['pelanggan']) ?></td>
                                <td class="p-3 text-slate-500"><?= htmlspecialchars($t['kasir']) ?></td>
                                <td class="p-3 font-mono"><?= $t['total_items'] ?> unit</td>
                                <td class="p-3 uppercase font-semibold text-slate-600"><?= $t['metode_bayar'] ?></td>
                                <td class="p-3 font-mono font-bold text-emerald-700"><?= formatRupiah($t['total_belanja']) ?></td>
                                <td class="p-3">
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold <?= $t['status_bayar'] === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                                        <?= $t['status_bayar'] ?>
                                    </span>
                                </td>
                                <td class="p-3 text-right whitespace-nowrap">
                                    <a href="struk.php?nota=<?= urlencode($t['no_nota']) ?>" target="_blank" class="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 inline-flex items-center gap-1 text-[11px] transition">
                                        🌐 Web
                                    </a>
                                    <a href="struk.php?nota=<?= urlencode($t['no_nota']) ?>&pdf=1" target="_blank" class="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 inline-flex items-center gap-1 text-[11px] ml-1 transition">
                                        📄 PDF
                                    </a>
                                    <a href="struk.php?nota=<?= urlencode($t['no_nota']) ?>&print=1" target="_blank" class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 inline-flex items-center gap-1 text-[11px] ml-1 transition">
                                        🖨️ Cetak
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </main>
</body>
</html>
`;
};

export const getGreenMartPanduanInstalasi = (): string => {
  return `# Panduan Lengkap Instalasi & Deployment GreenMart POS di XAMPP & VirtualBox (Linux Ubuntu)

Selamat datang di aplikasi **GreenMart - Sistem Kasir Ritel POS & Rekap Data Statistik Harian Otomatis**!
Aplikasi ini dibangun menggunakan arsitektur **PHP Native murni + MySQL / MariaDB (PDO)** yang ringan, aman, dan siap dijalankan langsung di server lokal tanpa perlu Node.js atau kompilasi rumit di server target.

---

## DAFTAR ISI
1. [Fitur Unggulan GreenMart](#1-fitur-unggulan-greenmart)
2. [Instalasi di XAMPP (Windows / macOS)](#2-instalasi-di-xampp-windows--macos)
3. [Instalasi di VirtualBox (Linux Ubuntu Server / Desktop)](#3-instalasi-di-virtualbox-linux-ubuntu-server--desktop)
4. [Struktur Skema Database MySQL](#4-struktur-skema-database-mysql)
5. [Penggunaan Barcode Scanner Fisik & Thermal Printer](#5-penggunaan-barcode-scanner-fisik--thermal-printer)
6. [Rumus Perhitungan Statistik Otomatis](#6-rumus-perhitungan-statistik-otomatis)
7. [Penyelesaian Masalah (Troubleshooting)](#7-penyelesaian-masalah-troubleshooting)

---

## 1. Fitur Unggulan GreenMart
* **Scan Barcode Otomatis**: Mendukung barcode scanner laser USB, Bluetooth, barcode reader wireless, dan kamera. Disertai efek suara (audio beep POS laser) pada setiap scan.
* **Keranjang Belanja Cepat (Multi-Item Cart)**: Menghitung total belanja, penyesuaian quantity (+ / -), diskon per item atau diskon total.
* **Kalkulator Kembalian Real-Time**: Otomatis menghitung uang kembalian saat kasir mengetik nominal uang yang diterima pembeli. Dilengkapi tombol cepat pecahan uang Rupiah (Rp 10k, 20k, 50k, 100k, Uang Pas).
* **Deteksi Piutang Otomatis**: Jika uang bayar kurang, sistem langsung menandai status transaksi sebagai Piutang/Kasbon.
* **Rekap Data Statistik Harian Otomatis**:
  - **Modus (Mode)**: Menghitung barang dengan frekuensi penjualan tertinggi dan kuantitas terbanyak keluar.
  - **Mean (Rata-rata)**: Rata-rata nominal per transaksi belanja (Average Order Value / AOV).
  - **Total Pendapatan & Laba Bersih**: Total omset bruto dan laba bersih (Omset dikurangi modal HPP).
* **Manajemen Stok Real-Time**: Setiap kali transaksi kasir berhasil diselesaikan, stok produk otomatis berkurang secara atomik di database MySQL.

---

## 2. Instalasi di XAMPP (Windows / macOS)

### Langkah 1: Ekstrak Source Code ke Folder \`htdocs\`
1. Buka folder instalasi XAMPP Anda (umumnya \`C:\\xampp\\htdocs\` di Windows atau \`/Applications/XAMPP/htdocs\` di Mac).
2. Buat folder baru bernama \`greenmart\`.
3. Ekstrak seluruh isi file ZIP yang Anda unduh ke dalam folder tersebut:
   \`\`\`
   C:\\xampp\\htdocs\\greenmart\\
       ├── config.php
       ├── api.php
       ├── index.php
       ├── kasir.php
       ├── struk.php
       ├── produk.php
       ├── transaksi.php
       └── database_greenmart.sql
   \`\`\`

### Langkah 2: Nyalakan Apache dan MySQL di XAMPP Control Panel
1. Buka **XAMPP Control Panel**.
2. Klik tombol **Start** pada modul **Apache**.
3. Klik tombol **Start** pada modul **MySQL**.
4. Pastikan kedua indikator berubah menjadi warna hijau (Running).

### Langkah 3: Impor Skrip Database MySQL
1. Buka web browser Anda, lalu ketik alamat:
   \`http://localhost/phpmyadmin\`
2. Klik tab **Import** (atau buat database baru bernama \`greenmart_db\` terlebih dahulu).
3. Klik tombol **Choose File** / Telusuri, lalu pilih file:
   \`database_greenmart.sql\` yang ada di folder \`greenmart\`.
4. Klik tombol **Import / Kirim** di bagian bawah.
5. Selesai! Seluruh tabel, kategori, master produk, dan contoh transaksi awal langsung terisi.

*Catatan Cerdas*: File \`config.php\` GreenMart dilengkapi dengan fitur *Auto-Bootstrap*. Jika Anda belum mengimpor database, skrip akan otomatis mencoba membuat database \`greenmart_db\` pada koneksi pertama!

### Langkah 4: Buka Aplikasi GreenMart
Buka browser Anda dan kunjungi:
- **Dashboard & Statistik**: \`http://localhost/greenmart/index.php\`
- **Layar Kasir POS**: \`http://localhost/greenmart/kasir.php\`
- **Cetak Struk Web & PDF**: \`http://localhost/greenmart/struk.php\`
- **Stok Inventori**: \`http://localhost/greenmart/produk.php\`
- **Riwayat Transaksi**: \`http://localhost/greenmart/transaksi.php\`

---

## 3. Instalasi di VirtualBox (Linux Ubuntu Server / Desktop)

Jika Anda ingin menjalankan GreenMart di VirtualBox agar dapat diakses oleh perangkat kasir lain melalui Local Area Network (LAN / Wi-Fi):

### Langkah 1: Konfigurasi Network Adapter di VirtualBox
1. Matikan VM Ubuntu Anda di VirtualBox.
2. Buka **Settings** VM > **Network**.
3. Ubah **Attached to** dari *NAT* menjadi **Bridged Adapter** (agar VM mendapatkan IP lokal dari router Wi-Fi yang sama dengan PC Anda) ATAU pilih **Host-only Adapter**.
4. Nyalakan kembali VM Ubuntu.
5. Cek IP address VM dengan menjalankan:
   \`\`\`bash
   ip a
   \`\`\`
   Misal IP yang didapat adalah: \`192.168.1.150\`.

### Langkah 2: Install Apache, PHP, dan MySQL di Ubuntu
Jalankan perintah berikut di terminal Ubuntu:
\`\`\`bash
sudo apt update
sudo apt install -y apache2 mysql-server php libapache2-mod-php php-mysql git unzip
\`\`\`

### Langkah 3: Ekstrak Source Code ke Web Root Ubuntu
\`\`\`bash
# Pindah ke folder web root
cd /var/www/html

# Buat folder greenmart
sudo mkdir -p greenmart
cd greenmart

# Salin file proyek Anda ke sini (bisa lewat SCP, SFTP, atau Git)
# Berikan hak akses ke web server Apache:
sudo chown -R www-data:www-data /var/www/html/greenmart
sudo chmod -R 755 /var/www/html/greenmart
\`\`\`

### Langkah 4: Buat Database & Impor Skrip SQL di MySQL Ubuntu
\`\`\`bash
# Masuk ke MySQL console
sudo mysql

# Jalankan query berikut:
CREATE DATABASE IF NOT EXISTS greenmart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
EXIT;

# Impor skrip database_greenmart.sql:
sudo mysql -u root greenmart_db < /var/www/html/greenmart/database_greenmart.sql
\`\`\`

### Langkah 5: Akses dari Komputer Host / HP Kasir
Buka browser di laptop atau smartphone kasir yang terhubung ke jaringan Wi-Fi yang sama:
\`\`\`
http://192.168.1.150/greenmart/kasir.php
\`\`\`

---

## 4. Struktur Skema Database MySQL

1. **\`kategori\`**: Menyimpan kategori produk ritel GreenMart (Sembako, Minuman, Sayur Segar, dll.).
2. **\`produk\`**: Menyimpan barcode, nama barang, harga modal HPP (\`harga_beli\`), harga jual (\`harga_jual\`), stok saat ini (\`stok\`), batas minimum stok (\`min_stok\`), dan satuan.
3. **\`transaksi\`**: Menyimpan header penjualan (no nota, tanggal, waktu, kasir, pelanggan, total belanja, metode bayar, uang yang dibayar, kembalian, dan status pembayaran Lunas/Piutang).
4. **\`transaksi_detail\`**: Menyimpan rincian tiap barang yang dibeli per nota (barcode, nama produk, qty, harga, subtotal).
5. **\`v_modus_produk_terlaris\` (VIEW)**: Menghitung produk yang paling banyak terjual dan paling sering muncul di nota belanja.
6. **\`v_rekap_harian_otomatis\` (VIEW)**: Menghitung total omset, rata-rata omset per transaksi (Mean), total modal, dan laba bersih harian.

---

## 5. Penggunaan Barcode Scanner Fisik & Thermal Printer

### Barcode Scanner Fisik (USB / Wireless 2.4G)
- Seluruh barcode scanner standar menggunakan protokol **HID Keyboard Wedge**. Artinya, ketika scanner menembakkan laser ke barcode produk, scanner akan otomatis mengetikkan deretan angka barcode ke komputer dan diakhiri dengan tombol **Enter**.
- Di layar kasir GreenMart (\`kasir.php\`), kursor otomatis diarahkan (*autofocus*) ke kotak input barcode. Cukup arahkan laser scanner ke kemasan produk, dan produk akan langsung masuk ke keranjang belanja dengan suara *beep* kasir!

### Printer Struk Kasir Thermal (58mm / 80mm)
- Saat menekan tombol **Selesaikan Transaksi & Cetak Struk**, struk belanja berformat thermal monospaced rapi akan muncul.
- Anda dapat langsung mencetaknya menggunakan printer kasir Bluetooth / USB Thermal dengan memilih ukuran kertas \`58mm\` atau \`80mm\` pada dialog cetak browser.

---

## 6. Rumus Perhitungan Statistik Otomatis

1. **Modus (Mode) Barang Terlaris**:
   $$\\text{Modus} = \\arg\\max_{i} \\left( \\sum \\text{qty terjual produk}_i \\right)$$
   Dihitung dengan query SQL:
   \`\`\`sql
   SELECT nama_produk, SUM(qty) AS total_qty 
   FROM transaksi_detail 
   GROUP BY barcode 
   ORDER BY total_qty DESC 
   LIMIT 1;
   \`\`\`

2. **Mean (Rata-rata) Omset per Transaksi**:
   $$\\bar{x} = \\frac{\\sum \\text{Total Belanja}}{\\text{Total Jumlah Transaksi}}$$
   Dihitung dengan query SQL:
   \`\`\`sql
   SELECT AVG(total_belanja) AS mean_omset 
   FROM transaksi 
   WHERE tanggal = CURDATE();
   \`\`\`

3. **Laba Bersih**:
   $$\\text{Laba Bersih} = \\text{Total Pendapatan (Omset)} - \\sum (\\text{qty} \\times \\text{Harga Beli / HPP})$$

---

## 7. Penyelesaian Masalah (Troubleshooting)

- **Error: "Koneksi ke MySQL gagal"**:
  Pastikan modul MySQL di XAMPP sudah berwarna hijau (Start). Jika menggunakan password pada user root MySQL Anda, buka file \`config.php\` dan sesuaikan nilai konstanta \`DB_PASS\`.
- **Halaman Kasir tidak ada suara *beep***:
  Beberapa browser memblokir audio otomatis hingga pengguna berinteraksi (mengklik) salah satu tombol di halaman. Cukup klik satu kali di layar kasir, maka suara laser scan akan aktif normal.

Semoga aplikasi **GreenMart** ini bermanfaat untuk bisnis ritel dan sistem pencatatan statistik kasir Anda!
`;
};

/**
 * Creates and downloads the complete standalone GreenMart ZIP archive
 */
export async function downloadGreenMartSuiteZip(
  products: GreenMartProduct[],
  transactions: GreenMartTransaction[]
): Promise<void> {
  const zip = new JSZip();

  // Root files
  zip.file('database_greenmart.sql', generateGreenMartSql(products, transactions));
  zip.file('config.php', getGreenMartPhpConfig());
  zip.file('api.php', getGreenMartPhpApi());
  zip.file('index.php', getGreenMartPhpIndex());
  zip.file('kasir.php', getGreenMartPhpKasir());
  zip.file('struk.php', getGreenMartPhpStruk());
  zip.file('produk.php', getGreenMartPhpProduk());
  zip.file('transaksi.php', getGreenMartPhpTransaksi());
  zip.file('PANDUAN_INSTALASI_XAMPP_DAN_VIRTUALBOX.md', getGreenMartPanduanInstalasi());

  // Generate ZIP blob and trigger browser download
  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GreenMart_Sistem_Kasir_PHP_MySQL_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
