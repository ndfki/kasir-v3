import { Sheet, SheetRow, ColumnDefinition } from '../types';
import { getItemType } from './itemClassification';

export interface StatMetricResult {
  mean: number;
  median: number;
  modes: number[];
  modeFrequency: number;
  min: number;
  max: number;
  range: number;
  count: number;
  sum: number;
  sortedValues: number[];
}

export interface ProductSoldFrequency {
  name: string;
  category?: string;
  transactionCount: number;
  totalQty: number;
  totalRevenue: number;
}

export interface SoldItemsStatistics {
  soldRowCount: number;
  totalSoldUnits: number;
  totalRevenueRupiah: number;
  revenueStats: StatMetricResult;
  qtyStats: StatMetricResult;
  priceStats: StatMetricResult;
  productFrequencies: ProductSoldFrequency[];
  mostSoldProductByFrequency: ProductSoldFrequency | null;
  mostSoldProductByQuantity: ProductSoldFrequency | null;
}

/**
 * Calculates Mean, Median, Mode, Min, Max, Range, and Sum for a numeric array.
 */
export function calculateStatMetric(values: number[]): StatMetricResult {
  if (!values || values.length === 0) {
    return {
      mean: 0,
      median: 0,
      modes: [],
      modeFrequency: 0,
      min: 0,
      max: 0,
      range: 0,
      count: 0,
      sum: 0,
      sortedValues: []
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  // Calculate Median
  let median: number;
  if (count % 2 !== 0) {
    median = sorted[Math.floor(count / 2)];
  } else {
    const mid1 = sorted[count / 2 - 1];
    const mid2 = sorted[count / 2];
    median = (mid1 + mid2) / 2;
  }

  // Calculate Mode(s)
  const freqMap = new Map<number, number>();
  let maxFreq = 0;

  sorted.forEach(val => {
    const nextFreq = (freqMap.get(val) || 0) + 1;
    freqMap.set(val, nextFreq);
    if (nextFreq > maxFreq) {
      maxFreq = nextFreq;
    }
  });

  const modes: number[] = [];
  freqMap.forEach((freq, val) => {
    if (freq === maxFreq && maxFreq > 1) {
      modes.push(val);
    }
  });

  modes.sort((a, b) => a - b);

  const min = sorted[0];
  const max = sorted[count - 1];
  const range = max - min;

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    modes,
    modeFrequency: maxFreq > 1 ? maxFreq : 1,
    min,
    max,
    range,
    count,
    sum,
    sortedValues: sorted
  };
}

/**
 * Calculates statistical analysis (Mean, Median, Modus) strictly based on items sold through the cashier.
 */
export function getSoldItemsStatistics(sheet: Sheet): SoldItemsStatistics {
  const { rows, columns } = sheet;

  // STRICT FILTER: Only rows representing sold items through the cashier (itemType === 'sold')
  const soldRows = rows.filter(r => getItemType(r, columns) === 'sold');

  // Identify relevant columns
  const itemCol = columns.find(c => 
    c.name.includes('produk') || c.name.includes('item') || c.name.includes('nama') || 
    c.label.toLowerCase().includes('produk') || c.label.toLowerCase().includes('item')
  ) || columns[1] || columns[0];

  const qtyCol = columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') || 
    c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || columns.find(c => c.type === 'number');

  const priceCol = columns.find(c => 
    c.name.includes('harga') || c.name.includes('price') || c.name.includes('satuan') || 
    c.label.toLowerCase().includes('harga')
  ) || columns.find(c => c.type === 'decimal');

  const totalCol = columns.find(c => 
    c.name.includes('total') || c.name.includes('omset') || 
    c.label.toLowerCase().includes('total') || c.label.toLowerCase().includes('omset')
  );

  const catCol = columns.find(c => c.type === 'category');

  const revenueValues: number[] = [];
  const qtyValues: number[] = [];
  const priceValues: number[] = [];

  const productMap = new Map<string, ProductSoldFrequency>();

  soldRows.forEach(row => {
    const rawQty = qtyCol ? Number(row[qtyCol.id]) || 0 : 1;
    const qty = rawQty > 0 ? rawQty : 1;

    const rawPrice = priceCol ? Number(row[priceCol.id]) || 0 : 0;
    
    // Revenue from total column or qty * price
    let rev = totalCol ? Number(row[totalCol.id]) || 0 : 0;
    if (rev <= 0 && rawPrice > 0) {
      rev = qty * rawPrice;
    }

    const unitPrice = rawPrice > 0 ? rawPrice : (qty > 0 && rev > 0 ? Math.round(rev / qty) : 0);

    revenueValues.push(rev);
    qtyValues.push(qty);
    if (unitPrice > 0) {
      priceValues.push(unitPrice);
    }

    // Product frequency aggregation
    const productName = itemCol ? String(row[itemCol.id] || 'Barang Terjual').trim() : 'Barang Terjual';
    const cat = catCol && row[catCol.id] ? String(row[catCol.id]) : undefined;

    if (productName) {
      const existing = productMap.get(productName);
      if (existing) {
        existing.transactionCount += 1;
        existing.totalQty += qty;
        existing.totalRevenue += rev;
      } else {
        productMap.set(productName, {
          name: productName,
          category: cat,
          transactionCount: 1,
          totalQty: qty,
          totalRevenue: rev
        });
      }
    }
  });

  const revenueStats = calculateStatMetric(revenueValues);
  const qtyStats = calculateStatMetric(qtyValues);
  const priceStats = calculateStatMetric(priceValues);

  const productFrequencies = Array.from(productMap.values());
  productFrequencies.sort((a, b) => b.transactionCount - a.transactionCount || b.totalQty - a.totalQty);

  const mostSoldProductByFrequency = productFrequencies.length > 0 ? productFrequencies[0] : null;

  const productSortedByQty = [...productFrequencies].sort((a, b) => b.totalQty - a.totalQty);
  const mostSoldProductByQuantity = productSortedByQty.length > 0 ? productSortedByQty[0] : null;

  return {
    soldRowCount: soldRows.length,
    totalSoldUnits: qtyStats.sum,
    totalRevenueRupiah: revenueStats.sum,
    revenueStats,
    qtyStats,
    priceStats,
    productFrequencies,
    mostSoldProductByFrequency,
    mostSoldProductByQuantity
  };
}
