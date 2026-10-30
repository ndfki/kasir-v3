import JSZip from 'jszip';
import { Sheet } from '../types';

export const generateDatabaseSql = (sheets: Sheet[]): string => {
  return `-- =======================================================
-- Database: data_statistik
-- Aplikasi: Sistem Data Statistik Multi-Sheet (PHP & MySQL)
-- Karakter: utf8mb4 (Mendukung karakter khusus & emoji)
-- =======================================================

CREATE DATABASE IF NOT EXISTS \`data_statistik\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`data_statistik\`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS \`sheet_row_values\`;
DROP TABLE IF EXISTS \`sheet_rows\`;
DROP TABLE IF EXISTS \`sheet_columns\`;
DROP TABLE IF EXISTS \`sheets\`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabel Utama: sheets
CREATE TABLE \`sheets\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`slug\` VARCHAR(120) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`chart_config\` LONGTEXT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Kolom Dinamis: sheet_columns
CREATE TABLE \`sheet_columns\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sheet_id\` INT NOT NULL,
  \`column_key\` VARCHAR(60) NOT NULL,
  \`label\` VARCHAR(100) NOT NULL,
  \`column_type\` ENUM('text', 'number', 'decimal', 'date', 'category') NOT NULL DEFAULT 'text',
  \`options\` TEXT NULL,
  \`is_required\` TINYINT(1) NOT NULL DEFAULT 0,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_sheet_col\` (\`sheet_id\`),
  CONSTRAINT \`fk_cols_sheet\` FOREIGN KEY (\`sheet_id\`) REFERENCES \`sheets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Baris Data: sheet_rows
CREATE TABLE \`sheet_rows\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sheet_id\` INT NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_rows_sheet\` (\`sheet_id\`),
  CONSTRAINT \`fk_rows_sheet\` FOREIGN KEY (\`sheet_id\`) REFERENCES \`sheets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Nilai Kolom: sheet_row_values (EAV Flexible Storage dengan Foreign Key Terisolasi)
CREATE TABLE \`sheet_row_values\` (
  \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
  \`row_id\` INT NOT NULL,
  \`sheet_id\` INT NOT NULL,
  \`column_id\` INT NOT NULL,
  \`value\` LONGTEXT NULL,
  INDEX \`idx_val_row\` (\`row_id\`),
  INDEX \`idx_val_col\` (\`column_id\`),
  INDEX \`idx_val_sheet\` (\`sheet_id\`),
  CONSTRAINT \`fk_val_row\` FOREIGN KEY (\`row_id\`) REFERENCES \`sheet_rows\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_val_col\` FOREIGN KEY (\`column_id\`) REFERENCES \`sheet_columns\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_val_sheet\` FOREIGN KEY (\`sheet_id\`) REFERENCES \`sheets\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =======================================================
-- SEED DATA DEFAULT (Sampel Awal)
-- =======================================================

INSERT INTO \`sheets\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`chart_config\`) VALUES
(1, 'Penjualan Toko Elektronik', 'penjualan-toko-elektronik', 'Pencatatan data penjualan harian toko gadget dan elektronik', '{"type":"bar","xAxisColKey":"kategori","yAxisColKey":"total_omset","aggregation":"sum","title":"Total Omset per Kategori Produk"}'),
(2, 'Statistik Kunjungan Pengunjung', 'statistik-kunjungan', 'Statistik kanal trafik dan metrik pertumbuhan pengunjung', '{"type":"doughnut","xAxisColKey":"kanal_trafik","yAxisColKey":"pengunjung_baru","aggregation":"sum","title":"Distribusi Pengunjung Baru per Kanal"}'),
(3, 'Data Karyawan & Penggajian', 'data-karyawan-gaji', 'Manajemen data staf, departemen, dan alokasi anggaran gaji', '{"type":"bar","xAxisColKey":"departemen","yAxisColKey":"gaji_pokok","aggregation":"sum","title":"Total Beban Gaji per Departemen"}');

-- Kolom untuk Sheet 1
INSERT INTO \`sheet_columns\` (\`id\`, \`sheet_id\`, \`column_key\`, \`label\`, \`column_type\`, \`options\`, \`is_required\`, \`sort_order\`) VALUES
(1, 1, 'kode_transaksi', 'Kode Transaksi', 'text', NULL, 1, 1),
(2, 1, 'nama_produk', 'Nama Produk', 'text', NULL, 1, 2),
(3, 1, 'kategori', 'Kategori Produk', 'category', 'Laptop, Smartphone, Aksesoris, Audio, Monitor', 1, 3),
(4, 1, 'jumlah_terjual', 'Qty Terjual', 'number', NULL, 1, 4),
(5, 1, 'harga_satuan', 'Harga Satuan (Rp)', 'decimal', NULL, 1, 5),
(6, 1, 'total_omset', 'Total Omset (Rp)', 'decimal', NULL, 1, 6),
(7, 1, 'tanggal_transaksi', 'Tanggal', 'date', NULL, 1, 7);

-- Baris untuk Sheet 1
INSERT INTO \`sheet_rows\` (\`id\`, \`sheet_id\`, \`created_at\`) VALUES
(1, 1, '2026-02-01 09:00:00'),
(2, 1, '2026-02-03 11:15:00'),
(3, 1, '2026-02-05 14:20:00'),
(4, 1, '2026-02-08 16:45:00'),
(5, 1, '2026-02-10 10:00:00'),
(6, 1, '2026-02-12 13:10:00'),
(7, 1, '2026-02-14 17:30:00'),
(8, 1, '2026-02-18 11:40:00');

-- Nilai untuk Sheet 1
INSERT INTO \`sheet_row_values\` (\`row_id\`, \`sheet_id\`, \`column_id\`, \`value\`) VALUES
(1, 1, 1, 'TRX-001'), (1, 1, 2, 'MacBook Air M2 256GB'), (1, 1, 3, 'Laptop'), (1, 1, 4, '3'), (1, 1, 5, '16500000'), (1, 1, 6, '49500000'), (1, 1, 7, '2026-02-01'),
(2, 1, 1, 'TRX-002'), (2, 1, 2, 'Samsung Galaxy S24 Ultra'), (2, 1, 3, 'Smartphone'), (2, 1, 4, '5'), (2, 1, 5, '19999000'), (2, 1, 6, '99995000'), (2, 1, 7, '2026-02-03'),
(3, 1, 1, 'TRX-003'), (3, 1, 2, 'Sony WH-1000XM5 Headphone'), (3, 1, 3, 'Audio'), (3, 1, 4, '8'), (3, 1, 5, '4999000'), (3, 1, 6, '39992000'), (3, 1, 7, '2026-02-05'),
(4, 1, 1, 'TRX-004'), (4, 1, 2, 'LG UltraFine 4K 27 Inch'), (4, 1, 3, 'Monitor'), (4, 1, 4, '4'), (4, 1, 5, '7800000'), (4, 1, 6, '31200000'), (4, 1, 7, '2026-02-08'),
(5, 1, 1, 'TRX-005'), (5, 1, 2, 'Keychron K2 Mechanical Keyboard'), (5, 1, 3, 'Aksesoris'), (5, 1, 4, '12'), (5, 1, 5, '1250000'), (5, 1, 6, '15000000'), (5, 1, 7, '2026-02-10'),
(6, 1, 1, 'TRX-006'), (6, 1, 2, 'ASUS ROG Zephyrus G14'), (6, 1, 3, 'Laptop'), (6, 1, 4, '2'), (6, 1, 5, '24500000'), (6, 1, 6, '49000000'), (6, 1, 7, '2026-02-12'),
(7, 1, 1, 'TRX-007'), (7, 1, 2, 'iPhone 15 Pro 128GB'), (7, 1, 3, 'Smartphone'), (7, 1, 4, '6'), (7, 1, 5, '18499000'), (7, 1, 6, '110994000'), (7, 1, 7, '2026-02-14'),
(8, 1, 1, 'TRX-008'), (8, 1, 2, 'Logitech MX Master 3S Mouse'), (8, 1, 3, 'Aksesoris'), (8, 1, 4, '15'), (8, 1, 5, '1450000'), (8, 1, 6, '21750000'), (8, 1, 7, '2026-02-18');

-- Kolom untuk Sheet 2
INSERT INTO \`sheet_columns\` (\`id\`, \`sheet_id\`, \`column_key\`, \`label\`, \`column_type\`, \`options\`, \`is_required\`, \`sort_order\`) VALUES
(8, 2, 'kanal_trafik', 'Kanal Trafik', 'category', 'Google Search, Media Sosial, Iklan Berbayar, Email Newsletter, Trafik Langsung', 1, 1),
(9, 2, 'pengunjung_baru', 'Pengunjung Baru', 'number', NULL, 1, 2),
(10, 2, 'pengunjung_kembali', 'Pengunjung Kembali', 'number', NULL, 1, 3),
(11, 2, 'konversi_persen', 'Tingkat Konversi (%)', 'decimal', NULL, 1, 4),
(12, 2, 'tanggal_catat', 'Tanggal Catat', 'date', NULL, 1, 5);

-- Baris untuk Sheet 2
INSERT INTO \`sheet_rows\` (\`id\`, \`sheet_id\`, \`created_at\`) VALUES
(9, 2, '2026-02-01 08:00:00'),
(10, 2, '2026-02-02 08:00:00'),
(11, 2, '2026-02-03 08:00:00'),
(12, 2, '2026-02-04 08:00:00'),
(13, 2, '2026-02-05 08:00:00');

-- Nilai untuk Sheet 2
INSERT INTO \`sheet_row_values\` (\`row_id\`, \`sheet_id\`, \`column_id\`, \`value\`) VALUES
(9, 2, 8, 'Google Search'), (9, 2, 9, '4520'), (9, 2, 10, '1890'), (9, 2, 11, '3.4'), (9, 2, 12, '2026-02-01'),
(10, 2, 8, 'Media Sosial'), (10, 2, 9, '3200'), (10, 2, 10, '1150'), (10, 2, 11, '2.8'), (10, 2, 12, '2026-02-02'),
(11, 2, 8, 'Iklan Berbayar'), (11, 2, 9, '5120'), (11, 2, 10, '980'), (11, 2, 11, '4.6'), (11, 2, 12, '2026-02-03'),
(12, 2, 8, 'Email Newsletter'), (12, 2, 9, '940'), (12, 2, 10, '2210'), (12, 2, 11, '5.2'), (12, 2, 12, '2026-02-04'),
(13, 2, 8, 'Trafik Langsung'), (13, 2, 9, '2150'), (13, 2, 10, '3100'), (13, 2, 11, '3.9'), (13, 2, 12, '2026-02-05');
`;
};

export const getPhpConfigContent = (): string => {
  return `<?php
/**
 * Konfigurasi Database & Keamanan
 * Sistem Data Statistik Multi-Sheet
 * Mendukung XAMPP Localhost & Ubuntu Linux Server
 */

// Aktifkan session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Konfigurasi Database MySQL / MariaDB
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'data_statistik');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_CHARSET', 'utf8mb4');

// Koneksi PDO
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Auto bootstrap jika database belum dibuat di localhost
            if (strpos($e->getMessage(), 'Unknown database') !== false || $e->getCode() == 1049) {
                try {
                    $initPdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=" . DB_CHARSET, DB_USER, DB_PASS, $options);
                    $initPdo->exec("CREATE DATABASE IF NOT EXISTS \`" . DB_NAME . "\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                    autoMigrateTables($pdo);
                } catch (Exception $ex) {
                    die(json_response(false, 'Gagal menghubungkan ke MySQL: ' . $ex->getMessage()));
                }
            } else {
                header('Content-Type: application/json; charset=utf-8');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Koneksi Database Gagal. Pastikan MySQL sudah menyala di XAMPP / Ubuntu. Error: ' . $e->getMessage()
                ]);
                exit;
            }
        }
    }
    return $pdo;
}

// Auto create tables jika belum ada
function autoMigrateTables($pdo) {
    $schema = "
    CREATE TABLE IF NOT EXISTS \`sheets\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`name\` VARCHAR(100) NOT NULL,
      \`slug\` VARCHAR(120) NOT NULL UNIQUE,
      \`description\` TEXT NULL,
      \`chart_config\` LONGTEXT NULL,
      \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`sheet_columns\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`sheet_id\` INT NOT NULL,
      \`column_key\` VARCHAR(60) NOT NULL,
      \`label\` VARCHAR(100) NOT NULL,
      \`column_type\` ENUM('text', 'number', 'decimal', 'date', 'category') NOT NULL DEFAULT 'text',
      \`options\` TEXT NULL,
      \`is_required\` TINYINT(1) NOT NULL DEFAULT 0,
      \`sort_order\` INT NOT NULL DEFAULT 0,
      \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`sheet_id\`) REFERENCES \`sheets\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`sheet_rows\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`sheet_id\` INT NOT NULL,
      \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (\`sheet_id\`) REFERENCES \`sheets\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`sheet_row_values\` (
      \`id\` BIGINT AUTO_INCREMENT PRIMARY KEY,
      \`row_id\` INT NOT NULL,
      \`sheet_id\` INT NOT NULL,
      \`column_id\` INT NOT NULL,
      \`value\` LONGTEXT NULL,
      FOREIGN KEY (\`row_id\`) REFERENCES \`sheet_rows\` (\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`column_id\`) REFERENCES \`sheet_columns\` (\`id\`) ON DELETE CASCADE,
      FOREIGN KEY (\`sheet_id\`) REFERENCES \`sheets\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($schema);
}

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// CSRF Protection Token
function getCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken($token) {
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

// Sanitasi & Validasi Input Keamanan
function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    return htmlspecialchars(trim((string)$data), ENT_QUOTES, 'UTF-8');
}

function validate_identifier($identifier) {
    return (bool)preg_match('/^[a-zA-Z0-9_]{1,64}$/', $identifier);
}

// JSON Response Helper
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
`;
};

export const getPhpApiContent = (): string => {
  return `<?php
/**
 * REST API Endpoint Data Statistik Multi-Sheet
 * Mendukung CRUD Sheet, CRUD Kolom, CRUD Baris, dan Konfigurasi Chart
 */
require_once __DIR__ . '/config.php';

// Device Compatibility & Cross-Platform Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, User-Agent, Sec-CH-UA-Mobile, Sec-CH-UA-Platform');
header('Vary: User-Agent, Accept-Encoding, Sec-CH-UA-Mobile');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = getDB();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        // --- 0. DEVICE COMPATIBILITY ---
        case 'device_info':
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $isMobile = (bool)preg_match('/mobile|android|iphone|ipad|ipod|blackberry|opera mini/i', $ua);
            $isTablet = (bool)preg_match('/tablet|ipad|playbook|silk/i', $ua);
            json_response(true, 'Device compatibility info', [
                'is_mobile' => $isMobile,
                'is_tablet' => $isTablet,
                'is_desktop' => !$isMobile && !$isTablet,
                'user_agent' => $ua,
                'touch_supported' => $isMobile || $isTablet,
                'recommended_view' => $isMobile ? 'cards' : 'table',
                'recommended_page_size' => $isMobile ? 10 : 25
            ]);
            break;

        // --- 1. SHEET OPERATIONS ---
        case 'get_sheets':
            $stmt = $pdo->query("SELECT id, name, slug, description, chart_config, created_at, updated_at FROM sheets ORDER BY id ASC");
            $sheets = $stmt->fetchAll();
            foreach ($sheets as &$s) {
                $s['chart_config'] = $s['chart_config'] ? json_decode($s['chart_config'], true) : null;
            }
            json_response(true, 'Data sheet berhasil diambil', $sheets);
            break;

        case 'create_sheet':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $name = trim($input['name'] ?? '');
            $desc = trim($input['description'] ?? '');
            if (!$name) {
                json_response(false, 'Nama sheet wajib diisi', null, 400);
            }
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-')) . '-' . time();
            
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO sheets (name, slug, description) VALUES (?, ?, ?)");
            $stmt->execute([$name, $slug, $desc]);
            $sheetId = $pdo->lastInsertId();

            // Kolom default untuk sheet baru
            $colStmt = $pdo->prepare("INSERT INTO sheet_columns (sheet_id, column_key, label, column_type, sort_order) VALUES (?, ?, ?, ?, ?)");
            $colStmt->execute([$sheetId, 'item_name', 'Nama Item', 'text', 1]);
            $colStmt->execute([$sheetId, 'jumlah', 'Jumlah', 'number', 2]);

            $pdo->commit();
            json_response(true, 'Sheet berhasil dibuat', ['id' => $sheetId, 'name' => $name, 'slug' => $slug]);
            break;

        case 'update_sheet':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $sheetId = (int)($input['sheet_id'] ?? 0);
            $name = trim($input['name'] ?? '');
            $desc = trim($input['description'] ?? '');
            if (!$sheetId || !$name) {
                json_response(false, 'Parameter tidak valid', null, 400);
            }
            $stmt = $pdo->prepare("UPDATE sheets SET name = ?, description = ? WHERE id = ?");
            $stmt->execute([$name, $desc, $sheetId]);
            json_response(true, 'Sheet berhasil diperbarui');
            break;

        case 'delete_sheet':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $sheetId = (int)($input['sheet_id'] ?? 0);
            if (!$sheetId) {
                json_response(false, 'Sheet ID tidak valid', null, 400);
            }
            // Pastikan tidak menghapus jika hanya tersisa 1 sheet
            $cnt = $pdo->query("SELECT COUNT(*) FROM sheets")->fetchColumn();
            if ($cnt <= 1) {
                json_response(false, 'Tidak dapat menghapus sheet terakhir', null, 400);
            }
            $stmt = $pdo->prepare("DELETE FROM sheets WHERE id = ?");
            $stmt->execute([$sheetId]);
            json_response(true, 'Sheet berhasil dihapus');
            break;

        case 'save_chart_config':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $sheetId = (int)($input['sheet_id'] ?? 0);
            $config = $input['chart_config'] ?? null;
            if (!$sheetId || !$config) {
                json_response(false, 'Parameter tidak lengkap', null, 400);
            }
            $jsonStr = is_string($config) ? $config : json_encode($config);
            $stmt = $pdo->prepare("UPDATE sheets SET chart_config = ? WHERE id = ?");
            $stmt->execute([$jsonStr, $sheetId]);
            json_response(true, 'Konfigurasi grafik berhasil disimpan');
            break;

        // --- 2. COLUMN OPERATIONS ---
        case 'get_columns':
            $sheetId = (int)($_GET['sheet_id'] ?? 0);
            if (!$sheetId) {
                json_response(false, 'Sheet ID wajib diisi', null, 400);
            }
            $stmt = $pdo->prepare("SELECT id, column_key, label, column_type, options, is_required, sort_order FROM sheet_columns WHERE sheet_id = ? ORDER BY sort_order ASC, id ASC");
            $stmt->execute([$sheetId]);
            json_response(true, 'Kolom berhasil diambil', $stmt->fetchAll());
            break;

        case 'add_column':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $sheetId = (int)($input['sheet_id'] ?? 0);
            $label = trim($input['label'] ?? '');
            $type = in_array($input['column_type'] ?? '', ['text', 'number', 'decimal', 'date', 'category']) ? $input['column_type'] : 'text';
            $options = trim($input['options'] ?? '');
            $isRequired = !empty($input['is_required']) ? 1 : 0;
            if (!$sheetId || !$label) {
                json_response(false, 'Data kolom tidak lengkap', null, 400);
            }
            $key = strtolower(trim(preg_replace('/[^A-Za-z0-9_]+/', '_', $label), '_')) . '_' . substr(md5(uniqid()), 0, 4);
            $maxOrder = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM sheet_columns WHERE sheet_id = ?");
            $maxOrder->execute([$sheetId]);
            $sortOrder = $maxOrder->fetchColumn();

            $stmt = $pdo->prepare("INSERT INTO sheet_columns (sheet_id, column_key, label, column_type, options, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$sheetId, $key, $label, $type, $options ?: null, $isRequired, $sortOrder]);
            json_response(true, 'Kolom berhasil ditambahkan', ['id' => $pdo->lastInsertId(), 'column_key' => $key]);
            break;

        case 'delete_column':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $colId = (int)($input['column_id'] ?? 0);
            $sheetId = (int)($input['sheet_id'] ?? 0);
            if (!$colId || !$sheetId) {
                json_response(false, 'Parameter tidak valid', null, 400);
            }
            $cnt = $pdo->prepare("SELECT COUNT(*) FROM sheet_columns WHERE sheet_id = ?");
            $cnt->execute([$sheetId]);
            if ($cnt->fetchColumn() <= 1) {
                json_response(false, 'Sheet harus memiliki minimal 1 kolom', null, 400);
            }
            $stmt = $pdo->prepare("DELETE FROM sheet_columns WHERE id = ? AND sheet_id = ?");
            $stmt->execute([$colId, $sheetId]);
            json_response(true, 'Kolom berhasil dihapus');
            break;

        // --- 3. DATA ROW CRUD ---
        case 'get_rows':
            $sheetId = (int)($_GET['sheet_id'] ?? 0);
            if (!$sheetId) {
                json_response(false, 'Sheet ID tidak valid', null, 400);
            }

            // Ambil daftar kolom
            $colStmt = $pdo->prepare("SELECT id, column_key, label, column_type FROM sheet_columns WHERE sheet_id = ? ORDER BY sort_order ASC, id ASC");
            $colStmt->execute([$sheetId]);
            $columns = $colStmt->fetchAll();

            // Ambil seluruh baris
            $rowStmt = $pdo->prepare("SELECT id, created_at, updated_at FROM sheet_rows WHERE sheet_id = ? ORDER BY id DESC");
            $rowStmt->execute([$sheetId]);
            $rows = $rowStmt->fetchAll();

            // Ambil seluruh nilai
            $valStmt = $pdo->prepare("SELECT row_id, column_id, value FROM sheet_row_values WHERE sheet_id = ?");
            $valStmt->execute([$sheetId]);
            $allValues = $valStmt->fetchAll();

            $valMap = [];
            foreach ($allValues as $v) {
                $valMap[$v['row_id']][$v['column_id']] = $v['value'];
            }

            $colKeyMap = [];
            foreach ($columns as $c) {
                $colKeyMap[$c['id']] = $c['column_key'];
            }

            $formattedRows = [];
            foreach ($rows as $r) {
                $rowId = $r['id'];
                $item = [
                    'id' => $rowId,
                    'created_at' => $r['created_at'],
                    'updated_at' => $r['updated_at']
                ];
                if (isset($valMap[$rowId])) {
                    foreach ($valMap[$rowId] as $cId => $val) {
                        if (isset($colKeyMap[$cId])) {
                            $item[$colKeyMap[$cId]] = $val;
                        }
                    }
                }
                $formattedRows[] = $item;
            }

            json_response(true, 'Data baris berhasil diambil', [
                'columns' => $columns,
                'rows'    => $formattedRows
            ]);
            break;

        case 'save_row':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $sheetId = (int)($input['sheet_id'] ?? 0);
            $rowId = isset($input['row_id']) ? (int)$input['row_id'] : 0;
            $values = $input['values'] ?? [];

            if (!$sheetId || empty($values)) {
                json_response(false, 'Data yang dikirim tidak lengkap', null, 400);
            }

            // Ambil mapping kolom
            $colStmt = $pdo->prepare("SELECT id, column_key, column_type, is_required FROM sheet_columns WHERE sheet_id = ?");
            $colStmt->execute([$sheetId]);
            $colDefs = $colStmt->fetchAll();

            $pdo->beginTransaction();

            if ($rowId > 0) {
                // Update
                $updStmt = $pdo->prepare("UPDATE sheet_rows SET updated_at = NOW() WHERE id = ? AND sheet_id = ?");
                $updStmt->execute([$rowId, $sheetId]);
            } else {
                // Insert
                $insRow = $pdo->prepare("INSERT INTO sheet_rows (sheet_id, created_at, updated_at) VALUES (?, NOW(), NOW())");
                $insRow->execute([$sheetId]);
                $rowId = $pdo->lastInsertId();
            }

            // Upsert values
            $upsertVal = $pdo->prepare("
                INSERT INTO sheet_row_values (row_id, sheet_id, column_id, value)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE value = VALUES(value)
            ");

            // Karena kita memakai tabel standard, kita delete value row lama lalu insert ulang untuk clean update
            $delVal = $pdo->prepare("DELETE FROM sheet_row_values WHERE row_id = ? AND sheet_id = ?");
            $delVal->execute([$rowId, $sheetId]);

            $insVal = $pdo->prepare("INSERT INTO sheet_row_values (row_id, sheet_id, column_id, value) VALUES (?, ?, ?, ?)");

            foreach ($colDefs as $col) {
                $val = isset($values[$col['column_key']]) ? (string)$values[$col['column_key']] : '';
                $insVal->execute([$rowId, $sheetId, $col['id'], $val]);
            }

            $pdo->commit();
            json_response(true, 'Data baris berhasil disimpan', ['row_id' => $rowId]);
            break;

        case 'delete_row':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $rowId = (int)($input['row_id'] ?? 0);
            $sheetId = (int)($input['sheet_id'] ?? 0);
            if (!$rowId || !$sheetId) {
                json_response(false, 'Parameter tidak valid', null, 400);
            }
            $stmt = $pdo->prepare("DELETE FROM sheet_rows WHERE id = ? AND sheet_id = ?");
            $stmt->execute([$rowId, $sheetId]);
            json_response(true, 'Baris berhasil dihapus');
            break;

        case 'batch_import_rows':
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $sheetId = (int)($input['sheet_id'] ?? 0);
            $mode = ($input['mode'] ?? 'append') === 'replace' ? 'replace' : 'append';
            $rowsData = $input['rows'] ?? [];

            if (!$sheetId || empty($rowsData)) {
                json_response(false, 'Parameter sheet_id atau rows tidak valid', null, 400);
            }

            $colStmt = $pdo->prepare("SELECT id, column_key FROM sheet_columns WHERE sheet_id = ?");
            $colStmt->execute([$sheetId]);
            $colDefs = $colStmt->fetchAll();

            $pdo->beginTransaction();

            if ($mode === 'replace') {
                $delRows = $pdo->prepare("DELETE FROM sheet_rows WHERE sheet_id = ?");
                $delRows->execute([$sheetId]);
            }

            $insRow = $pdo->prepare("INSERT INTO sheet_rows (sheet_id, created_at, updated_at) VALUES (?, NOW(), NOW())");
            $insVal = $pdo->prepare("INSERT INTO sheet_row_values (row_id, sheet_id, column_id, value) VALUES (?, ?, ?, ?)");

            $count = 0;
            foreach ($rowsData as $rowValues) {
                $insRow->execute([$sheetId]);
                $newRowId = $pdo->lastInsertId();
                foreach ($colDefs as $col) {
                    $val = isset($rowValues[$col['column_key']]) ? (string)$rowValues[$col['column_key']] : '';
                    $insVal->execute([$newRowId, $sheetId, $col['id'], $val]);
                }
                $count++;
            }

            $pdo->commit();
            json_response(true, "Berhasil mengimpor $count baris data", ['imported_count' => $count]);
            break;

        default:
            json_response(false, 'Aksi tidak dikenal', null, 404);
            break;
    }
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(false, 'Terjadi kesalahan server: ' . $e->getMessage(), null, 500);
}
`;
};

export const getPhpExportContent = (): string => {
  return `<?php
/**
 * Modul Ekspor Data Statistik
 * Format: CSV (UTF-8 BOM), XLSX (Spreadsheet XML), dan PDF (Print View)
 */
require_once __DIR__ . '/config.php';
$pdo = getDB();

$sheetId = (int)($_GET['sheet_id'] ?? 0);
$format  = strtolower($_GET['format'] ?? 'csv');

if (!$sheetId) {
    die("Sheet ID tidak ditentukan.");
}

// Ambil info Sheet
$sheetStmt = $pdo->prepare("SELECT * FROM sheets WHERE id = ?");
$sheetStmt->execute([$sheetId]);
$sheet = $sheetStmt->fetch();
if (!$sheet) {
    die("Sheet tidak ditemukan.");
}

// Ambil info Kolom
$colStmt = $pdo->prepare("SELECT id, column_key, label, column_type FROM sheet_columns WHERE sheet_id = ? ORDER BY sort_order ASC, id ASC");
$colStmt->execute([$sheetId]);
$columns = $colStmt->fetchAll();

// Ambil Baris & Nilai
$rowStmt = $pdo->prepare("SELECT id, created_at FROM sheet_rows WHERE sheet_id = ? ORDER BY id ASC");
$rowStmt->execute([$sheetId]);
$rows = $rowStmt->fetchAll();

$valStmt = $pdo->prepare("SELECT row_id, column_id, value FROM sheet_row_values WHERE sheet_id = ?");
$valStmt->execute([$sheetId]);
$allValues = $valStmt->fetchAll();

$valMap = [];
foreach ($allValues as $v) {
    $valMap[$v['row_id']][$v['column_id']] = $v['value'];
}

$data = [];
foreach ($rows as $r) {
    $item = ['ID' => $r['id']];
    foreach ($columns as $col) {
        $item[$col['label']] = $valMap[$r['id']][$col['id']] ?? '';
    }
    $item['Waktu Dibuat'] = $r['created_at'];
    $data[] = $item;
}

$safeFilename = preg_replace('/[^A-Za-z0-9_-]/', '_', $sheet['name']) . '_' . date('Ymd_His');

// ==========================================
// 1. FORMAT CSV (UTF-8 Dengan BOM)
// ==========================================
if ($format === 'csv') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $safeFilename . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
    // Tulis UTF-8 BOM agar Excel Windows membuka karakter Indonesia dengan benar
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    if (!empty($data)) {
        fputcsv($output, array_keys($data[0]));
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
    }
    fclose($output);
    exit;
}

// ==========================================
// 2. FORMAT XLSX (Spreadsheet XML Excel Ready)
// ==========================================
if ($format === 'xlsx' || $format === 'excel') {
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $safeFilename . '.xls"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">';
    echo '<style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { background-color: #2563eb; color: #ffffff; padding: 10px; border: 1px solid #1d4ed8; text-align: left; }
        td { padding: 8px 10px; border: 1px solid #e2e8f0; }
        .num { mso-number-format:"\#\,\#\#0"; }
        .date { mso-number-format:"yyyy-mm-dd"; }
    </style></head><body>';
    echo '<h2>' . htmlspecialchars($sheet['name']) . '</h2>';
    echo '<p>Deskripsi: ' . htmlspecialchars($sheet['description'] ?? '-') . ' | Tanggal Unduh: ' . date('d-m-Y H:i') . '</p>';
    echo '<table><thead><tr>';
    if (!empty($data)) {
        foreach (array_keys($data[0]) as $h) {
            echo '<th>' . htmlspecialchars($h) . '</th>';
        }
        echo '</tr></thead><tbody>';
        foreach ($data as $row) {
            echo '<tr>';
            foreach ($row as $cell) {
                echo '<td>' . htmlspecialchars((string)$cell) . '</td>';
            }
            echo '</tr>';
        }
    }
    echo '</tbody></table></body></html>';
    exit;
}

// ==========================================
// 3. FORMAT PDF (Print-Ready Document View)
// ==========================================
if ($format === 'pdf') {
    ?>
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <title>Cetak PDF - <?= htmlspecialchars($sheet['name']) ?></title>
        <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 12px; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 4px 0; }
            .desc { font-size: 13px; color: #64748b; margin: 0; }
            .meta { font-size: 11px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; color: #334155; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; }
            td { padding: 6px 10px; border: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .summary { margin-top: 20px; padding: 12px; background: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe; font-size: 12px; }
            .no-print { margin-bottom: 15px; }
            .btn-print { background: #2563eb; color: #fff; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="no-print">
            <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
            <span style="margin-left: 10px; color: #64748b;">(Gunakan opsi "Save as PDF" di dialog cetak browser)</span>
        </div>
        <div class="header">
            <div>
                <h1 class="title"><?= htmlspecialchars($sheet['name']) ?></h1>
                <p class="desc"><?= htmlspecialchars($sheet['description'] ?: 'Laporan Statistik Data') ?></p>
            </div>
            <div class="meta">
                <div>Dicetak: <?= date('d F Y, H:i:s') ?> WIB</div>
                <div>Total Data: <?= count($data) ?> Baris</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <?php if (!empty($data)): foreach (array_keys($data[0]) as $h): ?>
                        <th><?= htmlspecialchars($h) ?></th>
                    <?php endforeach; endif; ?>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($data as $row): ?>
                    <tr>
                        <?php foreach ($row as $cell): ?>
                            <td><?= htmlspecialchars((string)$cell) ?></td>
                        <?php endforeach; ?>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <div class="summary">
            <strong>Ringkasan Laporan:</strong> Dokumen ini digenerate secara otomatis oleh Sistem Data Statistik Multi-Sheet.
            Semua data tersinkronisasi langsung dari database MySQL/MariaDB.
        </div>
    </body>
    </html>
    <?php
    exit;
}
`;
};

export const getPhpIndexContent = (): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="format-detection" content="telephone=no">
    <title>Sistem Data Statistik Multi-Sheet (PHP & MySQL)</title>
    <!-- Tailwind CSS CDN untuk UI Modern & Responsif -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col font-sans">

    <!-- Top Navigation Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    📊
                </div>
                <div>
                    <h1 class="text-lg font-bold text-slate-900 leading-tight">DataStatistik</h1>
                    <p class="text-xs text-slate-500">PHP & MariaDB Multi-Sheet Analytics Suite</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-2 sm:space-x-3">
                <button onclick="toggleDarkMode()" id="btnDarkModeToggle" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Ganti Mode Gelap / Terang">
                    <span id="themeIcon">🌙</span> <span id="themeLabel">Mode Gelap</span>
                </button>
                <span class="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    MySQL Connected
                </span>
                <a href="export.php?sheet_id=1&format=csv" id="btnQuickExport" class="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                    ⬇️ Unduh CSV
                </a>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">

        <!-- Sheet Selector Tabs Bar -->
        <div class="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center space-x-2 overflow-x-auto py-1 max-w-full" id="sheetTabsList">
                <!-- Dynamically populated sheet buttons -->
                <button class="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white shadow-xs">
                    Memuat Sheet...
                </button>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="openModal('modalNewSheet')" class="inline-flex items-center px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition">
                    ➕ Buat Sheet Baru
                </button>
                <button onclick="openModal('modalEditSheet')" class="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100" title="Edit Info Sheet">
                    ⚙️
                </button>
            </div>
        </div>

        <!-- Sheet Header & Overview Cards -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 id="currentSheetTitle" class="text-2xl font-black text-slate-900 tracking-tight">Nama Sheet</h2>
                <p id="currentSheetDesc" class="text-sm text-slate-500 mt-0.5">Deskripsi Sheet aktif saat ini</p>
            </div>
            <div class="flex items-center gap-2">
                <!-- Export Dropdown -->
                <div class="relative inline-block text-left">
                    <button onclick="toggleExportMenu()" class="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs">
                        📥 Ekspor Data ▼
                    </button>
                    <div id="exportMenu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20">
                        <a href="#" id="linkExportXlsx" class="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">📗 Microsoft Excel (.XLSX)</a>
                        <a href="#" id="linkExportCsv" class="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">📄 File CSV (UTF-8)</a>
                        <a href="#" id="linkExportPdf" target="_blank" class="flex items-center px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">📑 Cetak Laporan / PDF</a>
                    </div>
                </div>

                <button onclick="openModal('modalAddColumn')" class="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs">
                    📐 Kelola Kolom
                </button>
                <button onclick="openModal('modalAddRow')" class="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition">
                    ➕ Tambah Baris Data
                </button>
            </div>
        </div>

        <!-- 3 Quick Stats Widgets -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Baris Data</span>
                <p id="statTotalRows" class="text-2xl font-black text-slate-900 mt-1">0</p>
                <span class="text-[11px] text-emerald-600 font-medium">Tersimpan di MySQL</span>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah Kolom</span>
                <p id="statTotalCols" class="text-2xl font-black text-slate-900 mt-1">0</p>
                <span class="text-[11px] text-blue-600 font-medium">Kolom dinamis terkonfigurasi</span>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Agregasi</span>
                <p id="statAggregationVal" class="text-2xl font-black text-indigo-600 mt-1">0</p>
                <span id="statAggregationLabel" class="text-[11px] text-slate-500 font-medium">Nilai Akumulasi</span>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Keamanan</span>
                <p class="text-2xl font-black text-emerald-600 mt-1">Aman</p>
                <span class="text-[11px] text-slate-500 font-medium">PDO Prepared Statements</span>
            </div>
        </div>

        <!-- Chart Section with Chart.js -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                    <h3 id="chartDisplayTitle" class="text-lg font-bold text-slate-900">Grafik Analitik Otomatis</h3>
                    <p class="text-xs text-slate-500">Visualisasi data interaktif real-time menggunakan Chart.js</p>
                </div>
                <!-- Chart Controls -->
                <div class="flex flex-wrap items-center gap-2">
                    <select id="selectChartType" onchange="updateChartConfig()" class="text-xs font-semibold rounded-lg border-slate-200 bg-slate-50 p-2">
                        <option value="bar">📊 Batang (Bar)</option>
                        <option value="line">📈 Garis (Line)</option>
                        <option value="pie">🥧 Lingkaran (Pie)</option>
                        <option value="doughnut">🍩 Donat (Doughnut)</option>
                    </select>
                    <select id="selectChartX" onchange="updateChartConfig()" class="text-xs font-semibold rounded-lg border-slate-200 bg-slate-50 p-2">
                        <!-- populated dynamically -->
                    </select>
                    <select id="selectChartY" onchange="updateChartConfig()" class="text-xs font-semibold rounded-lg border-slate-200 bg-slate-50 p-2">
                        <!-- populated dynamically -->
                    </select>
                    <select id="selectChartAgg" onchange="updateChartConfig()" class="text-xs font-semibold rounded-lg border-slate-200 bg-slate-50 p-2">
                        <option value="sum">Sum (Jumlah)</option>
                        <option value="avg">Average (Rata-rata)</option>
                        <option value="count">Count (Frekuensi)</option>
                        <option value="max">Max (Tertinggi)</option>
                        <option value="min">Min (Terendah)</option>
                    </select>
                </div>
            </div>

            <!-- Canvas Container -->
            <div class="mt-6 relative h-72 sm:h-80 w-full">
                <canvas id="mainChartCanvas"></canvas>
            </div>
        </div>

        <!-- Data Table Section -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <!-- Search & Filter Controls -->
            <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <div class="relative w-full sm:w-80">
                    <input type="text" id="searchInput" oninput="handleSearch()" placeholder="Cari data dalam sheet ini..." class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-blue-500">
                    <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                </div>
                <div class="text-xs text-slate-500 font-medium" id="tableRecordInfo">
                    Menampilkan 0 baris
                </div>
            </div>

            <!-- Table Responsive -->
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200" id="tableHeader">
                        <!-- Populated dynamically -->
                    </thead>
                    <tbody class="divide-y divide-slate-100" id="tableBody">
                        <!-- Populated dynamically -->
                    </tbody>
                </table>
            </div>

            <!-- Pagination Bar -->
            <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div id="paginationSummary">Halaman 1 dari 1</div>
                <div class="flex items-center space-x-1" id="paginationButtons">
                    <!-- Buttons -->
                </div>
            </div>
        </div>
    </main>

    <!-- MODAL: Tambah/Edit Baris Data -->
    <div id="modalRow" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
                <h3 id="modalRowTitle" class="text-base font-bold text-slate-900">Tambah Baris Data</h3>
                <button onclick="closeModal('modalRow')" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form id="formRow" onsubmit="submitRowForm(event)" class="space-y-3">
                <input type="hidden" id="formRowId" value="">
                <div id="dynamicFormFields" class="space-y-3 max-h-96 overflow-y-auto pr-1">
                    <!-- Form fields generated dynamically based on column types -->
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t">
                    <button type="button" onclick="closeModal('modalRow')" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Batal</button>
                    <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs">Simpan Data</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL: Tambah Kolom Baru -->
    <div id="modalAddColumn" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
                <h3 class="text-base font-bold text-slate-900">Kelola & Tambah Kolom</h3>
                <button onclick="closeModal('modalAddColumn')" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onsubmit="submitAddColumn(event)" class="space-y-3">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Nama / Label Kolom</label>
                    <input type="text" id="colLabelInput" required placeholder="Contoh: Jumlah Diskon" class="w-full text-xs p-2.5 border rounded-xl focus:outline-blue-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Tipe Data Kolom</label>
                    <select id="colTypeInput" onchange="toggleCategoryOptionsInput()" class="w-full text-xs p-2.5 border rounded-xl">
                        <option value="text">Teks (String)</option>
                        <option value="number">Angka Bulat (Integer)</option>
                        <option value="decimal">Desimal / Nilai Mata Uang</option>
                        <option value="date">Tanggal (YYYY-MM-DD)</option>
                        <option value="category">Kategori Pilihan (Dropdown)</option>
                    </select>
                </div>
                <div id="colCategoryOptionsGroup" class="hidden">
                    <label class="block text-xs font-bold text-slate-700 mb-1">Pilihan Kategori (Pisahkan dengan koma)</label>
                    <input type="text" id="colOptionsInput" placeholder="Contoh: Lunas, Pending, Dibatalkan" class="w-full text-xs p-2.5 border rounded-xl">
                </div>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="colRequiredInput" class="rounded text-blue-600">
                    <label for="colRequiredInput" class="text-xs text-slate-600">Kolom wajib diisi (Required)</label>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t">
                    <button type="button" onclick="closeModal('modalAddColumn')" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Batal</button>
                    <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs">Tambah Kolom</button>
                </div>
            </form>

            <!-- List Existing Columns with Delete Option -->
            <div class="pt-2 border-t">
                <span class="text-xs font-bold text-slate-600">Kolom Saat Ini:</span>
                <div id="existingColumnsList" class="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL: Buat Sheet Baru -->
    <div id="modalNewSheet" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
                <h3 class="text-base font-bold text-slate-900">Buat Sheet Baru</h3>
                <button onclick="closeModal('modalNewSheet')" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onsubmit="submitNewSheet(event)" class="space-y-3">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Nama Sheet</label>
                    <input type="text" id="newSheetName" required placeholder="Contoh: Data Penjualan Q2" class="w-full text-xs p-2.5 border rounded-xl">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Deskripsi (Opsional)</label>
                    <textarea id="newSheetDesc" rows="2" placeholder="Catatan atau tujuan sheet ini..." class="w-full text-xs p-2.5 border rounded-xl"></textarea>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t">
                    <button type="button" onclick="closeModal('modalNewSheet')" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Batal</button>
                    <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs">Simpan Sheet</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL: Edit Sheet -->
    <div id="modalEditSheet" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b pb-3">
                <h3 class="text-base font-bold text-slate-900">Pengaturan Sheet</h3>
                <button onclick="closeModal('modalEditSheet')" class="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onsubmit="submitEditSheet(event)" class="space-y-3">
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Nama Sheet</label>
                    <input type="text" id="editSheetName" required class="w-full text-xs p-2.5 border rounded-xl">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                    <textarea id="editSheetDesc" rows="2" class="w-full text-xs p-2.5 border rounded-xl"></textarea>
                </div>
                <div class="flex justify-between items-center pt-3 border-t">
                    <button type="button" onclick="confirmDeleteCurrentSheet()" class="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl">
                        🗑️ Hapus Sheet Ini
                    </button>
                    <div class="space-x-2">
                        <button type="button" onclick="closeModal('modalEditSheet')" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Batal</button>
                        <button type="submit" class="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl">Simpan Perubahan</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Aplikasi Data Statistik Multi-Sheet &bull; Berbasis PHP 8, MySQL/MariaDB, PDO & Chart.js</p>
    </footer>

    <!-- App JavaScript -->
    <script src="assets/js/app.js"></script>
</body>
</html>
`;
};

export const getPhpCssContent = (): string => {
  return `/* Custom styling for PHP Data Statistik Suite */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Scrollbar halus */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Animasi toast dan modal */
.fade-in {
  animation: fadeIn 0.15s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
`;
};

export const getPhpJsContent = (): string => {
  return `/**
 * Frontend JavaScript untuk Aplikasi Data Statistik (PHP & MySQL)
 */

let sheets = [];
let currentSheetId = null;
let currentColumns = [];
let currentRows = [];
let filteredRows = [];
let currentChart = null;

// Pagination State
let currentPage = 1;
const pageSize = 10;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    loadSheets();
});

// 1. LOAD SHEETS DARI API PHP
async function loadSheets(selectedId = null) {
    try {
        const res = await fetch('api.php?action=get_sheets');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
            sheets = json.data;
            currentSheetId = selectedId ? selectedId : (currentSheetId ? currentSheetId : sheets[0].id);
            renderSheetTabs();
            loadSheetData(currentSheetId);
        }
    } catch (err) {
        console.error('Gagal mengambil sheet:', err);
    }
}

// 2. RENDER SHEET TABS
function renderSheetTabs() {
    const list = document.getElementById('sheetTabsList');
    list.innerHTML = '';
    sheets.forEach(s => {
        const isActive = s.id == currentSheetId;
        const btn = document.createElement('button');
        btn.className = \`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all \${
            isActive 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }\`;
        btn.textContent = s.name;
        btn.onclick = () => {
            currentSheetId = s.id;
            renderSheetTabs();
            loadSheetData(s.id);
        };
        list.appendChild(btn);
    });
}

// 3. LOAD DATA & KOLOM SHEET AKTIF
async function loadSheetData(sheetId) {
    const sheet = sheets.find(s => s.id == sheetId);
    if (!sheet) return;

    document.getElementById('currentSheetTitle').textContent = sheet.name;
    document.getElementById('currentSheetDesc').textContent = sheet.description || 'Tidak ada deskripsi';

    // Update link ekspor
    document.getElementById('linkExportXlsx').href = \`export.php?sheet_id=\${sheetId}&format=xlsx\`;
    document.getElementById('linkExportCsv').href = \`export.php?sheet_id=\${sheetId}&format=csv\`;
    document.getElementById('linkExportPdf').href = \`export.php?sheet_id=\${sheetId}&format=pdf\`;
    const quickExport = document.getElementById('btnQuickExport');
    if (quickExport) quickExport.href = \`export.php?sheet_id=\${sheetId}&format=csv\`;

    try {
        const res = await fetch(\`api.php?action=get_rows&sheet_id=\${sheetId}\`);
        const json = await res.json();
        if (json.success) {
            currentColumns = json.data.columns;
            currentRows = json.data.rows;
            filteredRows = [...currentRows];

            // Render stats
            document.getElementById('statTotalRows').textContent = currentRows.length;
            document.getElementById('statTotalCols').textContent = currentColumns.length;

            renderTableHeaders();
            renderTableBody();
            populateChartSelectors(sheet.chart_config);
            renderChart();
            renderExistingColumnsList();
        }
    } catch (err) {
        console.error('Gagal memuat data sheet:', err);
    }
}

// 4. RENDER TABEL & HEADERS
function renderTableHeaders() {
    const thead = document.getElementById('tableHeader');
    let html = '<tr><th class="py-3 px-4 w-12 text-center">#</th>';
    currentColumns.forEach(c => {
        html += \`<th class="py-3 px-4 font-bold text-slate-700">\${escapeHtml(c.label)}</th>\`;
    });
    html += '<th class="py-3 px-4 text-center w-28">Aksi</th></tr>';
    thead.innerHTML = html;
}

function renderTableBody() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * pageSize;
    const pageRows = filteredRows.slice(start, start + pageSize);

    if (pageRows.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="\${currentColumns.length + 2}" class="text-center py-8 text-slate-400">Belum ada data untuk ditampilkan</td></tr>\`;
        return;
    }

    let html = '';
    pageRows.forEach((row, idx) => {
        html += '<tr class="hover:bg-slate-50 transition">';
        html += \`<td class="py-3 px-4 text-center text-slate-400 font-mono">\${start + idx + 1}</td>\`;
        currentColumns.forEach(c => {
            const val = row[c.column_key] !== undefined ? row[c.column_key] : '';
            html += \`<td class="py-3 px-4 text-slate-800">\${formatCellValue(val, c.column_type)}</td>\`;
        });
        html += \`<td class="py-3 px-4 text-center space-x-1">
            <button onclick="editRow(\${row.id})" class="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded">Edit</button>
            <button onclick="deleteRow(\${row.id})" class="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded">Hapus</button>
        </td></tr>\`;
    });
    tbody.innerHTML = html;

    renderPagination();
}

function formatCellValue(val, type) {
    if (val === null || val === undefined || val === '') return '<span class="text-slate-300">-</span>';
    if (type === 'number' || type === 'decimal') {
        const num = parseFloat(val);
        if (!isNaN(num)) {
            return num.toLocaleString('id-ID');
        }
    }
    if (type === 'category') {
        return \`<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">\${escapeHtml(val)}</span>\`;
    }
    return escapeHtml(String(val));
}

// 5. SEARCH & PAGINATION
function handleSearch() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!searchQuery) {
        filteredRows = [...currentRows];
    } else {
        filteredRows = currentRows.filter(row => {
            return currentColumns.some(col => {
                const val = String(row[col.column_key] || '').toLowerCase();
                return val.includes(searchQuery);
            });
        });
    }
    currentPage = 1;
    renderTableBody();
    renderChart();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
    document.getElementById('tableRecordInfo').textContent = \`Menampilkan \${filteredRows.length} dari total \${currentRows.length} baris\`;
    document.getElementById('paginationSummary').textContent = \`Halaman \${currentPage} dari \${totalPages}\`;

    const btnContainer = document.getElementById('paginationButtons');
    btnContainer.innerHTML = '';

    for (let p = 1; p <= totalPages; p++) {
        const b = document.createElement('button');
        b.className = \`px-2.5 py-1 rounded-md text-xs font-semibold \${p === currentPage ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}\`;
        b.textContent = p;
        b.onclick = () => {
            currentPage = p;
            renderTableBody();
        };
        btnContainer.appendChild(b);
    }
}

// 6. CHART.JS VISUALIZATION
function populateChartSelectors(savedConfig) {
    const selX = document.getElementById('selectChartX');
    const selY = document.getElementById('selectChartY');
    const selType = document.getElementById('selectChartType');
    const selAgg = document.getElementById('selectChartAgg');

    selX.innerHTML = '';
    selY.innerHTML = '';

    currentColumns.forEach(c => {
        const optX = document.createElement('option');
        optX.value = c.column_key;
        optX.textContent = 'Label (X): ' + c.label;
        selX.appendChild(optX);

        if (c.column_type === 'number' || c.column_type === 'decimal') {
            const optY = document.createElement('option');
            optY.value = c.column_key;
            optY.textContent = 'Nilai (Y): ' + c.label;
            selY.appendChild(optY);
        }
    });

    if (savedConfig) {
        if (savedConfig.type) selType.value = savedConfig.type;
        if (savedConfig.xAxisColKey) selX.value = savedConfig.xAxisColKey;
        if (savedConfig.yAxisColKey) selY.value = savedConfig.yAxisColKey;
        if (savedConfig.aggregation) selAgg.value = savedConfig.aggregation;
    }
}

function renderChart() {
    const ctx = document.getElementById('mainChartCanvas').getContext('2d');
    const chartType = document.getElementById('selectChartType').value;
    const xKey = document.getElementById('selectChartX').value;
    const yKey = document.getElementById('selectChartY').value;
    const agg = document.getElementById('selectChartAgg').value;

    const xCol = currentColumns.find(c => c.column_key === xKey);
    const yCol = currentColumns.find(c => c.column_key === yKey);

    // Grouping & Aggregation
    const grouped = {};
    const counts = {};

    filteredRows.forEach(row => {
        const xVal = row[xKey] || 'Lainnya';
        const numVal = parseFloat(row[yKey]) || 0;

        if (!grouped[xVal]) {
            grouped[xVal] = [];
        }
        grouped[xVal].push(numVal);
    });

    const labels = Object.keys(grouped);
    let values = [];
    let totalAggValue = 0;

    labels.forEach(l => {
        const arr = grouped[l];
        let res = 0;
        if (agg === 'sum') res = arr.reduce((a, b) => a + b, 0);
        else if (agg === 'avg') res = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
        else if (agg === 'count') res = arr.length;
        else if (agg === 'max') res = Math.max(...arr);
        else if (agg === 'min') res = Math.min(...arr);

        values.push(res);
        totalAggValue += res;
    });

    // Update stat card
    document.getElementById('statAggregationVal').textContent = totalAggValue.toLocaleString('id-ID');
    document.getElementById('statAggregationLabel').textContent = \`Total (\${agg.toUpperCase()}) pada \${yCol ? yCol.label : 'Data'}\`;

    if (currentChart) {
        currentChart.destroy();
    }

    const colors = [
        '#2563eb', '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];

    currentChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: (yCol ? yCol.label : 'Nilai') + \` (\${agg.toUpperCase()})\`,
                data: values,
                backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? colors : 'rgba(37, 99, 235, 0.8)',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: chartType === 'bar' ? 6 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: chartType === 'pie' || chartType === 'doughnut' ? 'bottom' : 'top'
                }
            }
        }
    });
}

async function updateChartConfig() {
    renderChart();
    const config = {
        type: document.getElementById('selectChartType').value,
        xAxisColKey: document.getElementById('selectChartX').value,
        yAxisColKey: document.getElementById('selectChartY').value,
        aggregation: document.getElementById('selectChartAgg').value
    };

    try {
        await fetch('api.php?action=save_chart_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheet_id: currentSheetId, chart_config: config })
        });
    } catch (e) {
        console.error('Gagal menyimpan config chart:', e);
    }
}

// 7. FORM ROW (ADD / EDIT)
function openModal(id) {
    if (id === 'modalAddRow') {
        document.getElementById('modalRowTitle').textContent = 'Tambah Baris Data';
        document.getElementById('formRowId').value = '';
        renderDynamicFormFields();
        document.getElementById('modalRow').classList.remove('hidden');
        return;
    }
    if (id === 'modalEditSheet') {
        const s = sheets.find(x => x.id == currentSheetId);
        if (s) {
            document.getElementById('editSheetName').value = s.name;
            document.getElementById('editSheetDesc').value = s.description || '';
        }
    }
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function renderDynamicFormFields(rowValues = {}) {
    const container = document.getElementById('dynamicFormFields');
    container.innerHTML = '';

    currentColumns.forEach(c => {
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.className = 'block text-xs font-bold text-slate-700 mb-1';
        label.textContent = c.label + (c.is_required ? ' *' : '');
        wrap.appendChild(label);

        const curVal = rowValues[c.column_key] !== undefined ? rowValues[c.column_key] : '';

        if (c.column_type === 'category' && c.options) {
            const sel = document.createElement('select');
            sel.name = c.column_key;
            sel.className = 'w-full text-xs p-2.5 border rounded-xl';
            if (c.is_required) sel.required = true;

            const opts = c.options.split(',').map(o => o.trim());
            opts.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                if (opt === curVal) o.selected = true;
                sel.appendChild(o);
            });
            wrap.appendChild(sel);
        } else {
            const inp = document.createElement('input');
            inp.name = c.column_key;
            inp.value = curVal;
            inp.className = 'w-full text-xs p-2.5 border rounded-xl focus:outline-blue-500';
            if (c.is_required) inp.required = true;

            if (c.column_type === 'number') {
                inp.type = 'number';
                inp.step = '1';
            } else if (c.column_type === 'decimal') {
                inp.type = 'number';
                inp.step = 'any';
            } else if (c.column_type === 'date') {
                inp.type = 'date';
            } else {
                inp.type = 'text';
            }
            wrap.appendChild(inp);
        }
        container.appendChild(wrap);
    });
}

function editRow(id) {
    const r = currentRows.find(x => x.id == id);
    if (!r) return;
    document.getElementById('modalRowTitle').textContent = 'Edit Baris Data #' + id;
    document.getElementById('formRowId').value = id;
    renderDynamicFormFields(r);
    document.getElementById('modalRow').classList.remove('hidden');
}

async function submitRowForm(e) {
    e.preventDefault();
    const form = document.getElementById('formRow');
    const formData = new FormData(form);
    const rowId = document.getElementById('formRowId').value;

    const values = {};
    currentColumns.forEach(c => {
        values[c.column_key] = formData.get(c.column_key);
    });

    try {
        const res = await fetch('api.php?action=save_row', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sheet_id: currentSheetId,
                row_id: rowId || null,
                values: values
            })
        });
        const json = await res.json();
        if (json.success) {
            closeModal('modalRow');
            loadSheetData(currentSheetId);
        } else {
            alert('Gagal: ' + json.message);
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan');
    }
}

async function deleteRow(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus baris data ini?')) return;
    try {
        const res = await fetch('api.php?action=delete_row', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheet_id: currentSheetId, row_id: id })
        });
        const json = await res.json();
        if (json.success) {
            loadSheetData(currentSheetId);
        }
    } catch (e) {
        alert('Gagal menghapus baris');
    }
}

// 8. ADD & DELETE COLUMN
function toggleCategoryOptionsInput() {
    const val = document.getElementById('colTypeInput').value;
    const group = document.getElementById('colCategoryOptionsGroup');
    if (val === 'category') {
        group.classList.remove('hidden');
    } else {
        group.classList.add('hidden');
    }
}

async function submitAddColumn(e) {
    e.preventDefault();
    const label = document.getElementById('colLabelInput').value.trim();
    const type = document.getElementById('colTypeInput').value;
    const options = document.getElementById('colOptionsInput').value.trim();
    const isRequired = document.getElementById('colRequiredInput').checked;

    try {
        const res = await fetch('api.php?action=add_column', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sheet_id: currentSheetId,
                label,
                column_type: type,
                options,
                is_required: isRequired ? 1 : 0
            })
        });
        const json = await res.json();
        if (json.success) {
            document.getElementById('colLabelInput').value = '';
            document.getElementById('colOptionsInput').value = '';
            loadSheetData(currentSheetId);
        } else {
            alert('Gagal: ' + json.message);
        }
    } catch (e) {
        alert('Gagal menambah kolom');
    }
}

function renderExistingColumnsList() {
    const list = document.getElementById('existingColumnsList');
    if (!list) return;
    list.innerHTML = '';
    currentColumns.forEach(c => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg';
        div.innerHTML = \`<div><span class="font-bold">\${escapeHtml(c.label)}</span> <span class="text-slate-400 text-[10px]">(\${c.column_type})</span></div>\`;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'text-rose-500 hover:text-rose-700 font-bold';
        delBtn.textContent = 'Hapus';
        delBtn.onclick = async () => {
            if (!confirm(\`Hapus kolom "\${c.label}" beserta seluruh datanya?\`)) return;
            const res = await fetch('api.php?action=delete_column', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet_id: currentSheetId, column_id: c.id })
            });
            const j = await res.json();
            if (j.success) loadSheetData(currentSheetId);
            else alert(j.message);
        };
        div.appendChild(delBtn);
        list.appendChild(div);
    });
}

// 9. SHEET CRUD
async function submitNewSheet(e) {
    e.preventDefault();
    const name = document.getElementById('newSheetName').value.trim();
    const desc = document.getElementById('newSheetDesc').value.trim();

    try {
        const res = await fetch('api.php?action=create_sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: desc })
        });
        const json = await res.json();
        if (json.success) {
            closeModal('modalNewSheet');
            document.getElementById('newSheetName').value = '';
            document.getElementById('newSheetDesc').value = '';
            loadSheets(json.data.id);
        } else {
            alert('Gagal: ' + json.message);
        }
    } catch (e) {
        alert('Gagal membuat sheet');
    }
}

async function submitEditSheet(e) {
    e.preventDefault();
    const name = document.getElementById('editSheetName').value.trim();
    const desc = document.getElementById('editSheetDesc').value.trim();

    try {
        const res = await fetch('api.php?action=update_sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheet_id: currentSheetId, name, description: desc })
        });
        const json = await res.json();
        if (json.success) {
            closeModal('modalEditSheet');
            loadSheets(currentSheetId);
        }
    } catch (e) {
        alert('Gagal update sheet');
    }
}

async function confirmDeleteCurrentSheet() {
    if (!confirm('Apakah Anda yakin ingin menghapus Sheet ini secara permanen beserta semua data di dalamnya?')) return;
    try {
        const res = await fetch('api.php?action=delete_sheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sheet_id: currentSheetId })
        });
        const json = await res.json();
        if (json.success) {
            closeModal('modalEditSheet');
            currentSheetId = null;
            loadSheets();
        } else {
            alert(json.message);
        }
    } catch (e) {
        alert('Gagal menghapus sheet');
    }
}

// Helpers
function toggleExportMenu() {
    const el = document.getElementById('exportMenu');
    el.classList.toggle('hidden');
}

window.onclick = function(e) {
    if (!e.target.closest('#exportMenu') && !e.target.closest('button[onclick="toggleExportMenu()"]')) {
        const el = document.getElementById('exportMenu');
        if (el) el.classList.add('hidden');
    }
};

// Dark Mode Theme Toggle
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const label = document.getElementById('themeLabel');
    const icon = document.getElementById('themeIcon');
    if (label && icon) {
        label.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
        icon.textContent = isDark ? '☀️' : '🌙';
    }
}

(function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        const label = document.getElementById('themeLabel');
        const icon = document.getElementById('themeIcon');
        if (label && icon) {
            label.textContent = 'Mode Terang';
            icon.textContent = '☀️';
        }
    }
})();

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
`;
};

export const getPhpReadmeContent = (): string => {
  return `# Sistem Data Statistik Multi-Sheet (PHP & MySQL/MariaDB)

Aplikasi web Data Statistik Multi-Sheet dinamis berbasis **PHP 8, MySQL / MariaDB, Chart.js, HTML5, Tailwind CSS, dan JavaScript**. 
Aplikasi ini siap digunakan langsung di **XAMPP localhost** maupun dideploy ke **server Linux Ubuntu (Apache2 / MySQL)**.

---

## 🌟 Fitur Utama

1. **Dashboard Modern & Responsif**:
   - Ringkasan statistik otomatis (Total Baris, Kolom, Akumulasi Nilai, Status Sistem).
   - Filter, pencarian real-time, pengurutan, dan navigasi data berhalaman (pagination).
2. **Sistem Multi-Sheet Fleksibel**:
   - Buat, edit nama, buka, dan hapus sheet dengan mudah.
   - Kolom dinamis independen per-Sheet (tipe: Teks, Angka Bulat, Desimal Mata Uang, Tanggal, dan Kategori Dropdown).
   - Isolasi data 100% antar-Sheet menggunakan skema relasional EAV berindeks dan Foreign Key \`ON DELETE CASCADE\`.
3. **CRUD Data Lengkap**:
   - Formulir input dinamis yang otomatis menyesuaikan tipe kolom sheet.
   - Validasi data numerik, format tanggal, dan pilihan kategori.
   - Operasi penambahan, pengubahan, dan penghapusan data dengan konfirmasi aman.
4. **Grafik Statistik Otomatis (Chart.js)**:
   - Jenis grafik: Batang (Bar), Garis (Line), Lingkaran (Pie), dan Donat (Doughnut).
   - Pilihan sumbu X (kategori/tanggal), sumbu Y (numerik), dan agregasi (Sum, Average, Count, Max, Min).
   - Konfigurasi grafik tersimpan per-Sheet dan diperbarui otomatis secara real-time.
5. **Ekspor Data**:
   - **XLSX**: Format spreadsheet kompatibel Microsoft Excel.
   - **CSV**: Encoding UTF-8 dengan BOM (Bite Order Mark) agar karakter dan angka terbuka rapi di Excel.
   - **PDF**: Format cetak laporan dokumen rapi siap print atau simpan ke PDF.
6. **Keamanan**:
   - PDO dengan prepared statements untuk mencegah SQL Injection.
   - CSRF protection dan sanitasi input.
   - Mode lokal tanpa login untuk kemudahan akses localhost.

---

## 🚀 Panduan Instalasi di XAMPP (Windows / Mac)

### Langkah 1: Ekstrak Proyek
1. Pastikan **XAMPP** sudah terinstal di komputer Anda.
2. Ekstrak file ZIP ini ke direktori:
   \`\`\`
   C:\\xampp\\htdocs\\data-statistik\\
   \`\`\`
   *(Pada macOS: \`/Applications/XAMPP/htdocs/data-statistik/\`)*

### Langkah 2: Nyalakan Apache & MySQL
1. Buka **XAMPP Control Panel**.
2. Klik tombol **Start** pada modul **Apache** dan **MySQL**.

### Langkah 3: Impor Database MySQL
1. Buka browser dan kunjungi: \`http://localhost/phpmyadmin\`
2. Klik menu **Databases**, buat database baru dengan nama \`data_statistik\` (Collation: \`utf8mb4_unicode_ci\`).
3. Pilih database \`data_statistik\` tersebut, klik tab **Import**.
4. Klik **Choose File**, pilih file \`database.sql\` dari folder proyek, lalu klik **Import**.
*(Catatan: Aplikasi ini juga memiliki fitur auto-migrate otomatis jika database belum dibuat!)*

### Langkah 4: Buka Aplikasi
Buka browser dan ketik alamat:
\`\`\`
http://localhost/data-statistik/
\`\`\`
Aplikasi siap digunakan langsung tanpa perlu login!

---

## 🐧 Panduan Deployment di Server Ubuntu / Linux

### 1. Update Paket & Install Dependensi
\`\`\`bash
sudo apt update && sudo apt upgrade -y
sudo apt install apache2 mysql-server php php-mysql php-cli php-curl php-json php-mbstring libapache2-mod-php -y
\`\`\`

### 2. Konfigurasi MySQL Server
\`\`\`bash
sudo mysql_secure_installation
\`\`\`
Masuk ke prompt MySQL:
\`\`\`bash
sudo mysql -u root -p
\`\`\`
Jalankan perintah SQL berikut:
\`\`\`sql
CREATE DATABASE data_statistik CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'user_statistik'@'localhost' IDENTIFIED BY 'PasswordKuat123!';
GRANT ALL PRIVILEGES ON data_statistik.* TO 'user_statistik'@'localhost';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

### 3. Impor Database SQL
\`\`\`bash
mysql -u user_statistik -p data_statistik < /path/to/database.sql
\`\`\`

### 4. Salin File Web ke Direktori Apache
\`\`\`bash
sudo cp -r /path/to/extracted-folder/* /var/www/html/data-statistik/
sudo chown -R www-data:www-data /var/www/html/data-statistik/
sudo chmod -R 755 /var/www/html/data-statistik/
\`\`\`

### 5. Sesuaikan \`config.php\`
Edit file \`/var/www/html/data-statistik/config.php\`:
\`\`\`php
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'data_statistik');
define('DB_USER', 'user_statistik');
define('DB_PASS', 'PasswordKuat123!');
\`\`\`

### 6. Aktifkan Firewall & Pasang SSL HTTPS (Let's Encrypt)
\`\`\`bash
# Firewall UFW
sudo ufw allow 'Apache Full'
sudo ufw allow OpenSSH
sudo ufw enable

# HTTPS Gratis dengan Certbot
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d domainanda.com
\`\`\`

---

## 🛡️ Tips Keamanan untuk Akses Publik
- **Jangan buka port 3306 (MySQL) ke publik**. Pastikan \`bind-address = 127.0.0.1\` di \`/etc/mysql/mysql.conf.d/mysqld.cnf\`.
- Jika memerlukan autentikasi di server publik, Anda dapat mengaktifkan **Apache HTTP Basic Auth** atau menambahkan form login session di PHP.
- Jangan letakkan phpMyAdmin di URL standar tanpa pengamanan ganda.

---
Dikembangkan untuk pengolahan data statistik yang cepat, aman, dan mudah dipindahkan.
`;
};

export const downloadProjectZip = async (sheets: Sheet[]) => {
  const zip = new JSZip();

  // Root files
  zip.file('config.php', getPhpConfigContent());
  zip.file('api.php', getPhpApiContent());
  zip.file('export.php', getPhpExportContent());
  zip.file('index.php', getPhpIndexContent());
  zip.file('database.sql', generateDatabaseSql(sheets));
  zip.file('README.md', getPhpReadmeContent());

  // Assets folder
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    const cssFolder = assetsFolder.folder('css');
    if (cssFolder) {
      cssFolder.file('style.css', getPhpCssContent());
    }
    const jsFolder = assetsFolder.folder('js');
    if (jsFolder) {
      jsFolder.file('app.js', getPhpJsContent());
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data-statistik-php-mysql.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
