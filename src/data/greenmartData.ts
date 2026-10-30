import { 
  GreenMartProduct, 
  GreenMartTransaction, 
  DailyStatisticalReport, 
  ModusItemStat 
} from '../types';

export const GREENMART_CATEGORIES = [
  'Sembako & Beras',
  'Minyak & Bumbu Dapur',
  'Sayur & Buah Segar',
  'Minuman & Susu',
  'Makanan Ringan & Mie',
  'Kebutuhan Rumah & Kebersihan',
  'Perawatan Diri & Sabun'
] as const;

export const initialGreenMartProducts: GreenMartProduct[] = [
  {
    id: 'prod-1',
    barcode: '8992753211029',
    name: 'Minyak Goreng Bimoli Klasik 2 Liter',
    category: 'Minyak & Bumbu Dapur',
    costPrice: 30000,
    sellingPrice: 36000,
    stock: 42,
    minStock: 10,
    unit: 'Pouch',
    description: 'Minyak kelapa sawit murni kualitas premium 2 Liter',
    emoji: '🍳'
  },
  {
    id: 'prod-2',
    barcode: '8993888200101',
    name: 'Beras Pandan Wangi Premium 5 Kg',
    category: 'Sembako & Beras',
    costPrice: 62000,
    sellingPrice: 74000,
    stock: 25,
    minStock: 8,
    unit: 'Sak',
    description: 'Beras pulen beraroma pandan wangi alami',
    emoji: '🌾'
  },
  {
    id: 'prod-3',
    barcode: '8991001100234',
    name: 'Gula Pasir Gulaku Tebu Alami 1 Kg',
    category: 'Sembako & Beras',
    costPrice: 14500,
    sellingPrice: 17500,
    stock: 50,
    minStock: 15,
    unit: 'Kg',
    description: 'Gula tebu kristal putih bersih 1000 gram',
    emoji: '🧂'
  },
  {
    id: 'prod-4',
    barcode: '8998866200221',
    name: 'Indomie Mie Goreng Spesial 85g',
    category: 'Makanan Ringan & Mie',
    costPrice: 2800,
    sellingPrice: 3500,
    stock: 140,
    minStock: 30,
    unit: 'Bungkus',
    description: 'Mie instan goreng favorit Indonesia dengan bumbu lezat',
    emoji: '🍜'
  },
  {
    id: 'prod-5',
    barcode: '8991389220011',
    name: 'Susu Ultra Milk UHT Full Cream 1 Liter',
    category: 'Minuman & Susu',
    costPrice: 16500,
    sellingPrice: 19500,
    stock: 35,
    minStock: 10,
    unit: 'Kotak',
    description: 'Susu sapi segar kaya kalsium dan vitamin',
    emoji: '🥛'
  },
  {
    id: 'prod-6',
    barcode: '8990001000011',
    name: 'Telur Ayam Negeri Fresh 1 Kg',
    category: 'Sembako & Beras',
    costPrice: 24000,
    sellingPrice: 28500,
    stock: 30,
    minStock: 8,
    unit: 'Kg',
    description: 'Telur segar pilihan dari peternakan terverifikasi',
    emoji: '🥚'
  },
  {
    id: 'prod-7',
    barcode: '8990002000022',
    name: 'Apel Fuji Manis Segar 1 Kg',
    category: 'Sayur & Buah Segar',
    costPrice: 29000,
    sellingPrice: 37500,
    stock: 18,
    minStock: 5,
    unit: 'Kg',
    description: 'Apel renyah manis dan segar kaya antioksidan',
    emoji: '🍎'
  },
  {
    id: 'prod-8',
    barcode: '8990003000033',
    name: 'Bayam Hijau Organik Petik Segar',
    category: 'Sayur & Buah Segar',
    costPrice: 3500,
    sellingPrice: 5000,
    stock: 28,
    minStock: 8,
    unit: 'Ikat',
    description: 'Sayur bayam hidroponik bebas pestisida',
    emoji: '🥬'
  },
  {
    id: 'prod-9',
    barcode: '8999999001122',
    name: 'Sunlight Pencuci Piring Jeruk Nipis 700ml',
    category: 'Kebutuhan Rumah & Kebersihan',
    costPrice: 11500,
    sellingPrice: 14000,
    stock: 22,
    minStock: 6,
    unit: 'Pouch',
    description: 'Ampuh bersihkan lemak membandel 5x lebih cepat',
    emoji: '🧽'
  },
  {
    id: 'prod-10',
    barcode: '8991002100555',
    name: 'Kopi Kapal Api Spesial Mix 10 x 24g',
    category: 'Minuman & Susu',
    costPrice: 12000,
    sellingPrice: 15500,
    stock: 45,
    minStock: 12,
    unit: 'Renceng',
    description: 'Kopi bubuk plus gula mantap khas nusantara',
    emoji: '☕'
  },
  {
    id: 'prod-11',
    barcode: '8992752011019',
    name: 'Air Mineral Aqua Botol 600ml',
    category: 'Minuman & Susu',
    costPrice: 2700,
    sellingPrice: 3800,
    stock: 65,
    minStock: 20,
    unit: 'Botol',
    description: 'Air mineral pegunungan alami higienis',
    emoji: '💧'
  },
  {
    id: 'prod-12',
    barcode: '8998888001100',
    name: 'Roti Tawar Gandum Sari Roti',
    category: 'Makanan Ringan & Mie',
    costPrice: 14000,
    sellingPrice: 17000,
    stock: 14,
    minStock: 5,
    unit: 'Bungkus',
    description: 'Roti gandum berserat tinggi, lembut dan lezat',
    emoji: '🍞'
  },
  {
    id: 'prod-13',
    barcode: '8992999003322',
    name: 'Sabun Mandi Lifebuoy Total 10 450ml',
    category: 'Perawatan Diri & Sabun',
    costPrice: 20000,
    sellingPrice: 25000,
    stock: 19,
    minStock: 6,
    unit: 'Pouch',
    description: 'Perlindungan bakteri kuman penyakit keluarga',
    emoji: '🧼'
  },
  {
    id: 'prod-14',
    barcode: '8991100223344',
    name: 'Bawang Merah Brebes Pilihan 500g',
    category: 'Minyak & Bumbu Dapur',
    costPrice: 18000,
    sellingPrice: 23000,
    stock: 20,
    minStock: 6,
    unit: 'Pack',
    description: 'Bawang merah harum gurih untuk masakan sedap',
    emoji: '🧅'
  }
];

// Today's date ISO helper
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const getTwoDaysAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().split('T')[0];
};

export const initialGreenMartTransactions: GreenMartTransaction[] = [
  {
    id: 'trx-101',
    invoiceNumber: 'GM-20261024-001',
    date: getTodayStr(),
    time: '08:15:30',
    cashierName: 'Dewi Sartika (Kasir 01)',
    customerName: 'Ibu Ratna',
    customerPhone: '081234567890',
    totalItemsCount: 7,
    subtotal: 105500,
    discountTotal: 0,
    grandTotal: 105500,
    paymentMethod: 'tunai',
    cashGiven: 110000,
    changeAmount: 4500,
    paymentStatus: 'Lunas',
    notes: 'Belanja mingguan dapur',
    createdAt: `${getTodayStr()}T08:15:30Z`,
    items: [
      {
        productId: 'prod-1',
        barcode: '8992753211029',
        name: 'Minyak Goreng Bimoli Klasik 2 Liter',
        category: 'Minyak & Bumbu Dapur',
        qty: 1,
        unit: 'Pouch',
        costPrice: 30000,
        unitPrice: 36000,
        discountPercent: 0,
        subtotal: 36000
      },
      {
        productId: 'prod-4',
        barcode: '8998866200221',
        name: 'Indomie Mie Goreng Spesial 85g',
        category: 'Makanan Ringan & Mie',
        qty: 5,
        unit: 'Bungkus',
        costPrice: 2800,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 17500
      },
      {
        productId: 'prod-6',
        barcode: '8990001000011',
        name: 'Telur Ayam Negeri Fresh 1 Kg',
        category: 'Sembako & Beras',
        qty: 1,
        unit: 'Kg',
        costPrice: 24000,
        unitPrice: 28500,
        discountPercent: 0,
        subtotal: 28500
      },
      {
        productId: 'prod-14',
        barcode: '8991100223344',
        name: 'Bawang Merah Brebes Pilihan 500g',
        category: 'Minyak & Bumbu Dapur',
        qty: 1,
        unit: 'Pack',
        costPrice: 18000,
        unitPrice: 23000,
        discountPercent: 0,
        subtotal: 23000
      }
    ]
  },
  {
    id: 'trx-102',
    invoiceNumber: 'GM-20261024-002',
    date: getTodayStr(),
    time: '09:20:10',
    cashierName: 'Dewi Sartika (Kasir 01)',
    customerName: 'Pak Hendra',
    customerPhone: '',
    totalItemsCount: 4,
    subtotal: 96500,
    discountTotal: 0,
    grandTotal: 96500,
    paymentMethod: 'qris',
    cashGiven: 96500,
    changeAmount: 0,
    paymentStatus: 'Lunas',
    notes: 'QRIS Gopay',
    createdAt: `${getTodayStr()}T09:20:10Z`,
    items: [
      {
        productId: 'prod-2',
        barcode: '8993888200101',
        name: 'Beras Pandan Wangi Premium 5 Kg',
        category: 'Sembako & Beras',
        qty: 1,
        unit: 'Sak',
        costPrice: 62000,
        unitPrice: 74000,
        discountPercent: 0,
        subtotal: 74000
      },
      {
        productId: 'prod-5',
        barcode: '8991389220011',
        name: 'Susu Ultra Milk UHT Full Cream 1 Liter',
        category: 'Minuman & Susu',
        qty: 1,
        unit: 'Kotak',
        costPrice: 16500,
        unitPrice: 19500,
        discountPercent: 0,
        subtotal: 19500
      },
      {
        productId: 'prod-11',
        barcode: '8992752011019',
        name: 'Air Mineral Aqua Botol 600ml',
        category: 'Minuman & Susu',
        qty: 2,
        unit: 'Botol',
        costPrice: 2700,
        unitPrice: 3800,
        discountPercent: 0,
        subtotal: 7600
      }
    ]
  },
  {
    id: 'trx-103',
    invoiceNumber: 'GM-20261024-003',
    date: getTodayStr(),
    time: '10:45:15',
    cashierName: 'Budi Kurnia (Kasir 02)',
    customerName: 'Siti Aminah',
    customerPhone: '085712345678',
    totalItemsCount: 12,
    subtotal: 82000,
    discountTotal: 2000,
    grandTotal: 80000,
    paymentMethod: 'tunai',
    cashGiven: 100000,
    changeAmount: 20000,
    paymentStatus: 'Lunas',
    notes: 'Diskon promo akhir pekan',
    createdAt: `${getTodayStr()}T10:45:15Z`,
    items: [
      {
        productId: 'prod-4',
        barcode: '8998866200221',
        name: 'Indomie Mie Goreng Spesial 85g',
        category: 'Makanan Ringan & Mie',
        qty: 10,
        unit: 'Bungkus',
        costPrice: 2800,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 35000
      },
      {
        productId: 'prod-3',
        barcode: '8991001100234',
        name: 'Gula Pasir Gulaku Tebu Alami 1 Kg',
        category: 'Sembako & Beras',
        qty: 1,
        unit: 'Kg',
        costPrice: 14500,
        unitPrice: 17500,
        discountPercent: 0,
        subtotal: 17500
      },
      {
        productId: 'prod-8',
        barcode: '8990003000033',
        name: 'Bayam Hijau Organik Petik Segar',
        category: 'Sayur & Buah Segar',
        qty: 3,
        unit: 'Ikat',
        costPrice: 3500,
        unitPrice: 5000,
        discountPercent: 0,
        subtotal: 15000
      },
      {
        productId: 'prod-9',
        barcode: '8999999001122',
        name: 'Sunlight Pencuci Piring Jeruk Nipis 700ml',
        category: 'Kebutuhan Rumah & Kebersihan',
        qty: 1,
        unit: 'Pouch',
        costPrice: 11500,
        unitPrice: 14000,
        discountPercent: 0,
        subtotal: 14000
      }
    ]
  },
  {
    id: 'trx-104',
    invoiceNumber: 'GM-20261024-004',
    date: getTodayStr(),
    time: '12:05:40',
    cashierName: 'Budi Kurnia (Kasir 02)',
    customerName: 'Warung Bu Joko',
    customerPhone: '081399887766',
    totalItemsCount: 22,
    subtotal: 144000,
    discountTotal: 4000,
    grandTotal: 140000,
    paymentMethod: 'tunai',
    cashGiven: 150000,
    changeAmount: 10000,
    paymentStatus: 'Lunas',
    notes: 'Kulakan warung langganan',
    createdAt: `${getTodayStr()}T12:05:40Z`,
    items: [
      {
        productId: 'prod-4',
        barcode: '8998866200221',
        name: 'Indomie Mie Goreng Spesial 85g',
        category: 'Makanan Ringan & Mie',
        qty: 20,
        unit: 'Bungkus',
        costPrice: 2800,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 70000
      },
      {
        productId: 'prod-1',
        barcode: '8992753211029',
        name: 'Minyak Goreng Bimoli Klasik 2 Liter',
        category: 'Minyak & Bumbu Dapur',
        qty: 2,
        unit: 'Pouch',
        costPrice: 30000,
        unitPrice: 36000,
        discountPercent: 0,
        subtotal: 72000
      }
    ]
  },
  {
    id: 'trx-105',
    invoiceNumber: 'GM-20261024-005',
    date: getTodayStr(),
    time: '13:30:22',
    cashierName: 'Dewi Sartika (Kasir 01)',
    customerName: 'Mas Danu',
    customerPhone: '',
    totalItemsCount: 3,
    subtotal: 48000,
    discountTotal: 0,
    grandTotal: 48000,
    paymentMethod: 'tunai',
    cashGiven: 50000,
    changeAmount: 2000,
    paymentStatus: 'Lunas',
    notes: '',
    createdAt: `${getTodayStr()}T13:30:22Z`,
    items: [
      {
        productId: 'prod-10',
        barcode: '8991002100555',
        name: 'Kopi Kapal Api Spesial Mix 10 x 24g',
        category: 'Minuman & Susu',
        qty: 2,
        unit: 'Renceng',
        costPrice: 12000,
        unitPrice: 15500,
        discountPercent: 0,
        subtotal: 31000
      },
      {
        productId: 'prod-12',
        barcode: '8998888001100',
        name: 'Roti Tawar Gandum Sari Roti',
        category: 'Makanan Ringan & Mie',
        qty: 1,
        unit: 'Bungkus',
        costPrice: 14000,
        unitPrice: 17000,
        discountPercent: 0,
        subtotal: 17000
      }
    ]
  },
  {
    id: 'trx-106',
    invoiceNumber: 'GM-20261024-006',
    date: getTodayStr(),
    time: '15:45:10',
    cashierName: 'Budi Kurnia (Kasir 02)',
    customerName: 'Kak Vina',
    customerPhone: '',
    totalItemsCount: 4,
    subtotal: 78500,
    discountTotal: 0,
    grandTotal: 78500,
    paymentMethod: 'qris',
    cashGiven: 78500,
    changeAmount: 0,
    paymentStatus: 'Lunas',
    notes: 'Belanja sore hari',
    createdAt: `${getTodayStr()}T15:45:10Z`,
    items: [
      {
        productId: 'prod-5',
        barcode: '8991389220011',
        name: 'Susu Ultra Milk UHT Full Cream 1 Liter',
        category: 'Minuman & Susu',
        qty: 2,
        unit: 'Kotak',
        costPrice: 16500,
        unitPrice: 19500,
        discountPercent: 0,
        subtotal: 39000
      },
      {
        productId: 'prod-11',
        barcode: '8992752011019',
        name: 'Air Mineral Aqua Botol 600ml',
        category: 'Minuman & Susu',
        qty: 5,
        unit: 'Botol',
        costPrice: 2700,
        unitPrice: 3800,
        discountPercent: 0,
        subtotal: 19000
      },
      {
        productId: 'prod-10',
        barcode: '8991002100555',
        name: 'Kopi Kapal Api Spesial Mix 10 x 24g',
        category: 'Minuman & Susu',
        qty: 1,
        unit: 'Renceng',
        costPrice: 12000,
        unitPrice: 15500,
        discountPercent: 0,
        subtotal: 15500
      }
    ]
  },
  {
    id: 'trx-107',
    invoiceNumber: 'GM-20261024-007',
    date: getTodayStr(),
    time: '17:50:30',
    cashierName: 'Dewi Sartika (Kasir 01)',
    customerName: 'Ibu Ningsih',
    customerPhone: '081298765432',
    totalItemsCount: 16,
    subtotal: 215000,
    discountTotal: 5000,
    grandTotal: 210000,
    paymentMethod: 'tunai',
    cashGiven: 250000,
    changeAmount: 40000,
    paymentStatus: 'Lunas',
    notes: 'Puncak belanja jam pulang kerja',
    createdAt: `${getTodayStr()}T17:50:30Z`,
    items: [
      {
        productId: 'prod-2',
        barcode: '8993888200101',
        name: 'Beras Pandan Wangi Premium 5 Kg',
        category: 'Sembako & Beras',
        qty: 1,
        unit: 'Sak',
        costPrice: 62000,
        unitPrice: 74000,
        discountPercent: 0,
        subtotal: 74000
      },
      {
        productId: 'prod-1',
        barcode: '8992753211029',
        name: 'Minyak Goreng Bimoli Klasik 2 Liter',
        category: 'Minyak & Bumbu Dapur',
        qty: 2,
        unit: 'Pouch',
        costPrice: 30000,
        unitPrice: 36000,
        discountPercent: 0,
        subtotal: 72000
      },
      {
        productId: 'prod-6',
        barcode: '8990001000011',
        name: 'Telur Ayam Negeri Fresh 1 Kg',
        category: 'Sembako & Beras',
        qty: 1,
        unit: 'Kg',
        costPrice: 24000,
        unitPrice: 28500,
        discountPercent: 0,
        subtotal: 28500
      },
      {
        productId: 'prod-4',
        barcode: '8998866200221',
        name: 'Indomie Mie Goreng Spesial 85g',
        category: 'Makanan Ringan & Mie',
        qty: 10,
        unit: 'Bungkus',
        costPrice: 2800,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 35000
      }
    ]
  },
  {
    id: 'trx-108',
    invoiceNumber: 'GM-20261024-008',
    date: getTodayStr(),
    time: '19:35:00',
    cashierName: 'Budi Kurnia (Kasir 02)',
    customerName: 'Pak Dedi',
    customerPhone: '',
    totalItemsCount: 8,
    subtotal: 132000,
    discountTotal: 0,
    grandTotal: 132000,
    paymentMethod: 'qris',
    cashGiven: 132000,
    changeAmount: 0,
    paymentStatus: 'Lunas',
    notes: 'Belanja kebutuhan malam',
    createdAt: `${getTodayStr()}T19:35:00Z`,
    items: [
      {
        productId: 'prod-9',
        barcode: '8999999001122',
        name: 'Sunlight Pencuci Piring Jeruk Nipis 700ml',
        category: 'Kebutuhan Rumah & Kebersihan',
        qty: 2,
        unit: 'Pouch',
        costPrice: 11500,
        unitPrice: 14000,
        discountPercent: 0,
        subtotal: 28000
      },
      {
        productId: 'prod-13',
        barcode: '8992999003322',
        name: 'Sabun Mandi Lifebuoy Total 10 450ml',
        category: 'Perawatan Diri & Sabun',
        qty: 2,
        unit: 'Pouch',
        costPrice: 20000,
        unitPrice: 25000,
        discountPercent: 0,
        subtotal: 50000
      },
      {
        productId: 'prod-3',
        barcode: '8991001100234',
        name: 'Gula Pasir Gulaku Tebu Alami 1 Kg',
        category: 'Sembako & Beras',
        qty: 3,
        unit: 'Kg',
        costPrice: 14500,
        unitPrice: 17500,
        discountPercent: 0,
        subtotal: 52500
      }
    ]
  },
  {
    id: 'trx-109',
    invoiceNumber: 'GM-20261024-009',
    date: getTodayStr(),
    time: '20:45:15',
    cashierName: 'Budi Kurnia (Kasir 02)',
    customerName: 'Mbak Cindy',
    customerPhone: '',
    totalItemsCount: 5,
    subtotal: 62500,
    discountTotal: 0,
    grandTotal: 62500,
    paymentMethod: 'tunai',
    cashGiven: 100000,
    changeAmount: 37500,
    paymentStatus: 'Lunas',
    notes: 'Belanja cemilan malam sebelum toko tutup',
    createdAt: `${getTodayStr()}T20:45:15Z`,
    items: [
      {
        productId: 'prod-4',
        barcode: '8998866200221',
        name: 'Indomie Mie Goreng Spesial 85g',
        category: 'Makanan Ringan & Mie',
        qty: 5,
        unit: 'Bungkus',
        costPrice: 2800,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 17500
      },
      {
        productId: 'prod-5',
        barcode: '8991389220011',
        name: 'Susu Ultra Milk UHT Full Cream 1 Liter',
        category: 'Minuman & Susu',
        qty: 1,
        unit: 'Kotak',
        costPrice: 16500,
        unitPrice: 19500,
        discountPercent: 0,
        subtotal: 19500
      },
      {
        productId: 'prod-12',
        barcode: '8998888001100',
        name: 'Roti Tawar Gandum Sari Roti',
        category: 'Makanan Ringan & Mie',
        qty: 1,
        unit: 'Bungkus',
        costPrice: 14000,
        unitPrice: 17000,
        discountPercent: 0,
        subtotal: 17000
      }
    ]
  },
  // Yesterday's sample transactions for comparative statistical charts
  {
    id: 'trx-090',
    invoiceNumber: 'GM-20261023-001',
    date: getYesterdayStr(),
    time: '09:10:00',
    cashierName: 'Dewi Sartika (Kasir 01)',
    customerName: 'Ibu Maya',
    customerPhone: '',
    totalItemsCount: 5,
    subtotal: 125000,
    discountTotal: 0,
    grandTotal: 125000,
    paymentMethod: 'tunai',
    cashGiven: 130000,
    changeAmount: 5000,
    paymentStatus: 'Lunas',
    notes: '',
    createdAt: `${getYesterdayStr()}T09:10:00Z`,
    items: [
      {
        productId: 'prod-2',
        barcode: '8993888200101',
        name: 'Beras Pandan Wangi Premium 5 Kg',
        category: 'Sembako & Beras',
        qty: 1,
        unit: 'Sak',
        costPrice: 62000,
        unitPrice: 74000,
        discountPercent: 0,
        subtotal: 74000
      },
      {
        productId: 'prod-7',
        barcode: '8990002000022',
        name: 'Apel Fuji Manis Segar 1 Kg',
        category: 'Sayur & Buah Segar',
        qty: 1,
        unit: 'Kg',
        costPrice: 29000,
        unitPrice: 37500,
        discountPercent: 0,
        subtotal: 37500
      },
      {
        productId: 'prod-13',
        barcode: '8992999003322',
        name: 'Sabun Mandi Lifebuoy Total 10 450ml',
        category: 'Perawatan Diri & Sabun',
        qty: 1,
        unit: 'Pouch',
        costPrice: 20000,
        unitPrice: 25000,
        discountPercent: 0,
        subtotal: 25000
      }
    ]
  },
  {
    id: 'trx-091',
    invoiceNumber: 'GM-20261023-002',
    date: getYesterdayStr(),
    time: '14:25:00',
    cashierName: 'Budi Kurnia (Kasir 02)',
    customerName: 'Pak Bambang',
    customerPhone: '',
    totalItemsCount: 15,
    subtotal: 110500,
    discountTotal: 0,
    grandTotal: 110500,
    paymentMethod: 'tunai',
    cashGiven: 120000,
    changeAmount: 9500,
    paymentStatus: 'Lunas',
    notes: '',
    createdAt: `${getYesterdayStr()}T14:25:00Z`,
    items: [
      {
        productId: 'prod-4',
        barcode: '8998866200221',
        name: 'Indomie Mie Goreng Spesial 85g',
        category: 'Makanan Ringan & Mie',
        qty: 15,
        unit: 'Bungkus',
        costPrice: 2800,
        unitPrice: 3500,
        discountPercent: 0,
        subtotal: 52500
      },
      {
        productId: 'prod-1',
        barcode: '8992753211029',
        name: 'Minyak Goreng Bimoli Klasik 2 Liter',
        category: 'Minyak & Bumbu Dapur',
        qty: 1,
        unit: 'Pouch',
        costPrice: 30000,
        unitPrice: 36000,
        discountPercent: 0,
        subtotal: 36000
      },
      {
        productId: 'prod-5',
        barcode: '8991389220011',
        name: 'Susu Ultra Milk UHT Full Cream 1 Liter',
        category: 'Minuman & Susu',
        qty: 1,
        unit: 'Kotak',
        costPrice: 16500,
        unitPrice: 19500,
        discountPercent: 0,
        subtotal: 19500
      }
    ]
  }
];

// ==========================================
// AUDIO BEEP SYNTHESIZER FOR BARCODE SCANNER
// ==========================================
export const playBarcodeScannerBeep = (type: 'success' | 'warning' | 'error' = 'success') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Crisp high-pitched supermarket POS laser beep (1950 Hz, 80ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1950, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.085);
    } else if (type === 'warning') {
      // Double beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      // Low buzz error
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Audio context may be restricted by autoplay policy until user gesture
  }
};

// ==========================================
// AUTOMATIC STATISTICAL CALCULATOR
// (Modus, Mean, Median, Total Pendapatan, Laba)
// ==========================================
export const calculateGreenMartStatistics = (
  transactions: GreenMartTransaction[],
  targetDate?: string // If provided, calculate for this specific day; if undefined, calculate for all transactions
): DailyStatisticalReport => {
  const filtered = targetDate 
    ? transactions.filter(t => t.date === targetDate)
    : transactions;

  const totalTransactions = filtered.length;
  let totalRevenue = 0;
  let totalCost = 0;
  let totalUnitsSold = 0;
  const transactionTotals: number[] = [];

  // Modus tracking: track frequency & quantity sold per product
  const productStatsMap = new Map<string, {
    productId: string;
    productName: string;
    barcode: string;
    category: string;
    transactionCount: number;
    totalQtySold: number;
    totalRevenue: number;
  }>();

  filtered.forEach(trx => {
    totalRevenue += trx.grandTotal;
    transactionTotals.push(trx.grandTotal);

    trx.items.forEach(item => {
      totalCost += (item.costPrice || 0) * item.qty;
      totalUnitsSold += item.qty;

      const existing = productStatsMap.get(item.productId) || {
        productId: item.productId,
        productName: item.name,
        barcode: item.barcode,
        category: item.category,
        transactionCount: 0,
        totalQtySold: 0,
        totalRevenue: 0
      };

      existing.transactionCount += 1;
      existing.totalQtySold += item.qty;
      existing.totalRevenue += item.subtotal;
      productStatsMap.set(item.productId, existing);
    });
  });

  const totalProfit = Math.max(0, totalRevenue - totalCost);
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Mean (Rata-rata omset per transaksi)
  const meanRevenuePerTransaction = totalTransactions > 0 
    ? Math.round(totalRevenue / totalTransactions) 
    : 0;

  // Median (Nilai tengah transaksi)
  let medianRevenuePerTransaction = 0;
  if (transactionTotals.length > 0) {
    const sorted = [...transactionTotals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianRevenuePerTransaction = sorted.length % 2 !== 0 
      ? sorted[mid] 
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  const maxTransaction = transactionTotals.length > 0 ? Math.max(...transactionTotals) : 0;
  const minTransaction = transactionTotals.length > 0 ? Math.min(...transactionTotals) : 0;

  // Modus calculation (Top most frequently sold items by totalQtySold)
  const allProductStats: ModusItemStat[] = Array.from(productStatsMap.values()).map(p => ({
    ...p,
    percentageOfAllSales: totalUnitsSold > 0 ? Math.round((p.totalQtySold / totalUnitsSold) * 100) : 0
  }));

  // Sort descending by totalQtySold, then by transactionCount
  allProductStats.sort((a, b) => {
    if (b.totalQtySold !== a.totalQtySold) {
      return b.totalQtySold - a.totalQtySold;
    }
    return b.transactionCount - a.transactionCount;
  });

  const topProductModus = allProductStats.length > 0 ? allProductStats[0] : null;

  return {
    selectedDate: targetDate || 'Semua Waktu',
    totalRevenue,
    totalCost,
    totalProfit,
    profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
    totalTransactions,
    totalUnitsSold,
    meanRevenuePerTransaction,
    medianRevenuePerTransaction,
    maxTransaction,
    minTransaction,
    topProductModus,
    topProductsList: allProductStats.slice(0, 5)
  };
};
