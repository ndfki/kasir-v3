export type ColumnType = 'text' | 'number' | 'decimal' | 'date' | 'category';

export interface ColumnDefinition {
  id: string;
  name: string;
  label: string;
  type: ColumnType;
  options?: string[]; // For category type
  isRequired?: boolean;
}

export interface SheetRow {
  id: string;
  itemType?: 'stock' | 'sold';
  [columnId: string]: any;
  createdAt: string;
  updatedAt: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';
export type AggregationMethod = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface ChartConfig {
  type: ChartType;
  xAxisColId: string;
  yAxisColId: string;
  aggregation: AggregationMethod;
  title?: string;
}

export interface Sheet {
  id: string;
  name: string;
  description: string;
  columns: ColumnDefinition[];
  rows: SheetRow[];
  chartConfig: ChartConfig;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  searchQuery: string;
  columnFilters: Record<string, string>;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// ==========================================
// GREENMART SPECIFIC TYPES
// ==========================================

export interface GreenMartProduct {
  id: string;
  barcode: string;
  name: string;
  category: string;
  costPrice: number; // Harga Modal Pokok (HPP)
  sellingPrice: number; // Harga Jual
  stock: number; // Stok Saat Ini
  minStock: number; // Batas Peringatan Stok Tipis
  unit: string; // Pcs, Kg, Pack, Botol, Bungkus, Liter, Sak
  description?: string;
  emoji?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GreenMartCartItem {
  product: GreenMartProduct;
  qty: number;
  discountPercent: number; // diskon item 0 - 100%
  subtotal: number;
  notes?: string;
}

export interface GreenMartTransactionItem {
  productId: string;
  barcode: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  costPrice: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
}

export interface GreenMartTransaction {
  id: string;
  invoiceNumber: string; // Misal: GM-20261024-001
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  items: GreenMartTransactionItem[];
  totalItemsCount: number; // Total kuantitas barang
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: 'tunai' | 'qris' | 'transfer' | 'piutang';
  cashGiven: number;
  changeAmount: number;
  paymentStatus: 'Lunas' | 'Piutang';
  notes?: string;
  createdAt: string;
  // Settlement fields (Khusus Pelunasan Piutang)
  settledAt?: string;
  settledMethod?: 'tunai' | 'qris' | 'transfer';
  settledAmount?: number;
  settledNotes?: string;
  settledByCashier?: string;
}

export interface ModusItemStat {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  transactionCount: number; // Muncul di berapa transaksi
  totalQtySold: number; // Total kuantitas terjual
  totalRevenue: number; // Total omset dari produk ini
  percentageOfAllSales: number;
}

export interface DailyStatisticalReport {
  selectedDate: string; // YYYY-MM-DD
  totalRevenue: number; // Total Pendapatan / Omset
  totalCost: number; // Total Modal HPP
  totalProfit: number; // Total Keuntungan Bersih (Revenue - Cost)
  profitMarginPercent: number;
  totalTransactions: number; // Total Transaksi / Nota
  totalUnitsSold: number; // Total kuantitas barang keluar
  meanRevenuePerTransaction: number; // Mean (Rata-rata Omset per Transaksi / AOV)
  medianRevenuePerTransaction: number; // Median Omset
  maxTransaction: number; // Belanja Tertinggi
  minTransaction: number; // Belanja Terendah
  topProductModus: ModusItemStat | null; // Modus Barang Terlaris utama
  topProductsList: ModusItemStat[]; // Top 5 Modus Terlaris
}

// ==========================================
// USER AUTH & CASHIER MANAGEMENT TYPES
// ==========================================

export interface GreenMartUser {
  name: string;
  nis: string;
  studentClass: string; // Kelas Petugas Kasir (e.g. XII BDP 1, XI AKL 2)
  role?: 'kasir' | 'admin' | 'petugas';
  loginTime: string;
}

export type CashierShiftType = 'Pagi' | 'Siang' | 'Sore' | 'Full Day' | 'Fleksibel';

export interface CashierProfile {
  id: string;
  name: string;
  nis: string;
  studentClass?: string; // Kelas Petugas Kasir
  shift: CashierShiftType;
  phone?: string;
  isActiveDuty?: boolean;
  assignedDate?: string; // YYYY-MM-DD
  addedAt: string;
}

export interface CashierDutyLog {
  id: string;
  date: string; // YYYY-MM-DD
  cashierName: string;
  cashierNis: string;
  studentClass?: string;
  shift: CashierShiftType;
  startedAt: string; // HH:mm
  endedAt?: string;
}

