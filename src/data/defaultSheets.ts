import { Sheet } from '../types';

export const initialSheets: Sheet[] = [
  {
    id: 'sheet-1',
    name: 'Penjualan Toko Elektronik',
    description: 'Pencatatan data penjualan harian toko gadget dan elektronik',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-15T10:30:00Z',
    columns: [
      { id: 'col_code', name: 'kode_transaksi', label: 'Kode Transaksi', type: 'text', isRequired: true },
      { id: 'col_product', name: 'nama_produk', label: 'Nama Produk', type: 'text', isRequired: true },
      { 
        id: 'col_category', 
        name: 'kategori', 
        label: 'Kategori Produk', 
        type: 'category', 
        options: ['Laptop', 'Smartphone', 'Aksesoris', 'Audio', 'Monitor'],
        isRequired: true 
      },
      { id: 'col_qty', name: 'jumlah_terjual', label: 'Qty Terjual', type: 'number', isRequired: true },
      { id: 'col_price', name: 'harga_satuan', label: 'Harga Satuan (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_total', name: 'total_omset', label: 'Total Omset (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_date', name: 'tanggal_transaksi', label: 'Tanggal', type: 'date', isRequired: true }
    ],
    chartConfig: {
      type: 'bar',
      xAxisColId: 'col_category',
      yAxisColId: 'col_total',
      aggregation: 'sum',
      title: 'Total Omset per Kategori Produk'
    },
    rows: [
      {
        id: 'stock-1',
        itemType: 'stock',
        col_code: 'STK-001',
        col_product: 'MacBook Air M2 256GB',
        col_category: 'Laptop',
        col_qty: 12,
        col_price: 16500000,
        col_total: 0,
        col_date: '2026-02-01',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z'
      },
      {
        id: 'stock-2',
        itemType: 'stock',
        col_code: 'STK-002',
        col_product: 'Samsung Galaxy S24 Ultra',
        col_category: 'Smartphone',
        col_qty: 18,
        col_price: 19999000,
        col_total: 0,
        col_date: '2026-02-01',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z'
      },
      {
        id: 'stock-3',
        itemType: 'stock',
        col_code: 'STK-003',
        col_product: 'Sony WH-1000XM5 Headphone',
        col_category: 'Audio',
        col_qty: 24,
        col_price: 4999000,
        col_total: 0,
        col_date: '2026-02-01',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z'
      },
      {
        id: 'stock-4',
        itemType: 'stock',
        col_code: 'STK-004',
        col_product: 'Keychron K2 Mechanical Keyboard',
        col_category: 'Aksesoris',
        col_qty: 30,
        col_price: 1250000,
        col_total: 0,
        col_date: '2026-02-01',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z'
      },
      {
        id: 'row-1',
        itemType: 'sold',
        col_code: 'TRX-001',
        col_product: 'MacBook Air M2 256GB',
        col_category: 'Laptop',
        col_qty: 3,
        col_price: 16500000,
        col_total: 49500000,
        col_date: '2026-02-01',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z'
      },
      {
        id: 'row-2',
        itemType: 'sold',
        col_code: 'TRX-002',
        col_product: 'Samsung Galaxy S24 Ultra',
        col_category: 'Smartphone',
        col_qty: 5,
        col_price: 19999000,
        col_total: 99995000,
        col_date: '2026-02-03',
        createdAt: '2026-02-03T11:15:00Z',
        updatedAt: '2026-02-03T11:15:00Z'
      },
      {
        id: 'row-3',
        itemType: 'sold',
        col_code: 'TRX-003',
        col_product: 'Sony WH-1000XM5 Headphone',
        col_category: 'Audio',
        col_qty: 8,
        col_price: 4999000,
        col_total: 39992000,
        col_date: '2026-02-05',
        createdAt: '2026-02-05T14:20:00Z',
        updatedAt: '2026-02-05T14:20:00Z'
      },
      {
        id: 'row-4',
        itemType: 'sold',
        col_code: 'TRX-004',
        col_product: 'LG UltraFine 4K 27 Inch',
        col_category: 'Monitor',
        col_qty: 4,
        col_price: 7800000,
        col_total: 31200000,
        col_date: '2026-02-08',
        createdAt: '2026-02-08T16:45:00Z',
        updatedAt: '2026-02-08T16:45:00Z'
      },
      {
        id: 'row-5',
        itemType: 'sold',
        col_code: 'TRX-005',
        col_product: 'Keychron K2 Mechanical Keyboard',
        col_category: 'Aksesoris',
        col_qty: 12,
        col_price: 1250000,
        col_total: 15000000,
        col_date: '2026-02-10',
        createdAt: '2026-02-10T10:00:00Z',
        updatedAt: '2026-02-10T10:00:00Z'
      },
      {
        id: 'row-6',
        itemType: 'sold',
        col_code: 'TRX-006',
        col_product: 'ASUS ROG Zephyrus G14',
        col_category: 'Laptop',
        col_qty: 2,
        col_price: 24500000,
        col_total: 49000000,
        col_date: '2026-02-12',
        createdAt: '2026-02-12T13:10:00Z',
        updatedAt: '2026-02-12T13:10:00Z'
      },
      {
        id: 'row-7',
        itemType: 'sold',
        col_code: 'TRX-007',
        col_product: 'iPhone 15 Pro 128GB',
        col_category: 'Smartphone',
        col_qty: 6,
        col_price: 18499000,
        col_total: 110994000,
        col_date: '2026-02-14',
        createdAt: '2026-02-14T17:30:00Z',
        updatedAt: '2026-02-14T17:30:00Z'
      },
      {
        id: 'row-8',
        itemType: 'sold',
        col_code: 'TRX-008',
        col_product: 'Logitech MX Master 3S Mouse',
        col_category: 'Aksesoris',
        col_qty: 15,
        col_price: 1450000,
        col_total: 21750000,
        col_date: '2026-02-18',
        createdAt: '2026-02-18T11:40:00Z',
        updatedAt: '2026-02-18T11:40:00Z'
      }
    ]
  },
  {
    id: 'sheet-2',
    name: 'Statistik Kunjungan Pengunjung',
    description: 'Statistik kanal trafik dan metrik pertumbuhan pengunjung',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-03-10T11:20:00Z',
    columns: [
      { id: 'col_channel', name: 'kanal_trafik', label: 'Kanal Trafik', type: 'category', options: ['Google Search', 'Media Sosial', 'Iklan Berbayar', 'Email Newsletter', 'Trafik Langsung'], isRequired: true },
      { id: 'col_new_visitors', name: 'pengunjung_baru', label: 'Pengunjung Baru', type: 'number', isRequired: true },
      { id: 'col_return_visitors', name: 'pengunjung_kembali', label: 'Pengunjung Kembali', type: 'number', isRequired: true },
      { id: 'col_conversion_rate', name: 'konversi_persen', label: 'Tingkat Konversi (%)', type: 'decimal', isRequired: true },
      { id: 'col_log_date', name: 'tanggal_pencatatan', label: 'Tanggal Catat', type: 'date', isRequired: true }
    ],
    chartConfig: {
      type: 'doughnut',
      xAxisColId: 'col_channel',
      yAxisColId: 'col_new_visitors',
      aggregation: 'sum',
      title: 'Distribusi Pengunjung Baru per Kanal'
    },
    rows: [
      {
        id: 'row-201',
        col_channel: 'Google Search',
        col_new_visitors: 4520,
        col_return_visitors: 1890,
        col_conversion_rate: 3.4,
        col_log_date: '2026-02-01',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z'
      },
      {
        id: 'row-202',
        col_channel: 'Media Sosial',
        col_new_visitors: 3200,
        col_return_visitors: 1150,
        col_conversion_rate: 2.8,
        col_log_date: '2026-02-02',
        createdAt: '2026-02-02T08:00:00Z',
        updatedAt: '2026-02-02T08:00:00Z'
      },
      {
        id: 'row-203',
        col_channel: 'Iklan Berbayar',
        col_new_visitors: 5120,
        col_return_visitors: 980,
        col_conversion_rate: 4.6,
        col_log_date: '2026-02-03',
        createdAt: '2026-02-03T08:00:00Z',
        updatedAt: '2026-02-03T08:00:00Z'
      },
      {
        id: 'row-204',
        col_channel: 'Email Newsletter',
        col_new_visitors: 940,
        col_return_visitors: 2210,
        col_conversion_rate: 5.2,
        col_log_date: '2026-02-04',
        createdAt: '2026-02-04T08:00:00Z',
        updatedAt: '2026-02-04T08:00:00Z'
      },
      {
        id: 'row-205',
        col_channel: 'Trafik Langsung',
        col_new_visitors: 2150,
        col_return_visitors: 3100,
        col_conversion_rate: 3.9,
        col_log_date: '2026-02-05',
        createdAt: '2026-02-05T08:00:00Z',
        updatedAt: '2026-02-05T08:00:00Z'
      }
    ]
  },
  {
    id: 'sheet-3',
    name: 'Data Karyawan & Penggajian',
    description: 'Manajemen data staf, departemen, dan alokasi anggaran gaji',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-03-01T14:10:00Z',
    columns: [
      { id: 'col_nip', name: 'nip_karyawan', label: 'NIP Pegawai', type: 'text', isRequired: true },
      { id: 'col_name', name: 'nama_pegawai', label: 'Nama Lengkap', type: 'text', isRequired: true },
      { id: 'col_dept', name: 'departemen', label: 'Departemen', type: 'category', options: ['Teknologi & IT', 'Pemasaran', 'Keuangan', 'Operasional', 'SDM / HR'], isRequired: true },
      { id: 'col_salary', name: 'gaji_pokok', label: 'Gaji Pokok (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_allowance', name: 'tunjangan', label: 'Tunjangan (Rp)', type: 'decimal', isRequired: true },
      { id: 'col_join_date', name: 'tanggal_masuk', label: 'Tanggal Bergabung', type: 'date', isRequired: true }
    ],
    chartConfig: {
      type: 'bar',
      xAxisColId: 'col_dept',
      yAxisColId: 'col_salary',
      aggregation: 'sum',
      title: 'Total Beban Gaji per Departemen'
    },
    rows: [
      {
        id: 'row-301',
        col_nip: 'EMP-0101',
        col_name: 'Budi Santoso',
        col_dept: 'Teknologi & IT',
        col_salary: 15000000,
        col_allowance: 2500000,
        col_join_date: '2024-03-01',
        createdAt: '2024-03-01T08:00:00Z',
        updatedAt: '2024-03-01T08:00:00Z'
      },
      {
        id: 'row-302',
        col_nip: 'EMP-0102',
        col_name: 'Siti Rahmawati',
        col_dept: 'Pemasaran',
        col_salary: 11000000,
        col_allowance: 1800000,
        col_join_date: '2024-05-15',
        createdAt: '2024-05-15T08:00:00Z',
        updatedAt: '2024-05-15T08:00:00Z'
      },
      {
        id: 'row-303',
        col_nip: 'EMP-0103',
        col_name: 'Ahmad Fauzi',
        col_dept: 'Keuangan',
        col_salary: 12500000,
        col_allowance: 2000000,
        col_join_date: '2023-11-10',
        createdAt: '2023-11-10T08:00:00Z',
        updatedAt: '2023-11-10T08:00:00Z'
      },
      {
        id: 'row-304',
        col_nip: 'EMP-0104',
        col_name: 'Dewi Lestari',
        col_dept: 'SDM / HR',
        col_salary: 10500000,
        col_allowance: 1500000,
        col_join_date: '2025-01-10',
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-10T08:00:00Z'
      },
      {
        id: 'row-305',
        col_nip: 'EMP-0105',
        col_name: 'Rian Pratama',
        col_dept: 'Operasional',
        col_salary: 9500000,
        col_allowance: 1200000,
        col_join_date: '2024-08-20',
        createdAt: '2024-08-20T08:00:00Z',
        updatedAt: '2024-08-20T08:00:00Z'
      },
      {
        id: 'row-306',
        col_nip: 'EMP-0106',
        col_name: 'Andi Firmansyah',
        col_dept: 'Teknologi & IT',
        col_salary: 16500000,
        col_allowance: 2800000,
        col_join_date: '2023-08-01',
        createdAt: '2023-08-01T08:00:00Z',
        updatedAt: '2023-08-01T08:00:00Z'
      }
    ]
  }
];
