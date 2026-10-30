import { Sheet, SheetRow, ColumnDefinition } from '../types';

export type ItemType = 'stock' | 'sold';

/**
 * Determines whether a row represents Available Stock (Inventori) or a Sold Item (Transaksi Penjualan).
 */
export function getItemType(row: SheetRow, columns: ColumnDefinition[]): ItemType {
  if (row.itemType === 'stock' || (row as unknown as Record<string, unknown>).isStock === true) return 'stock';
  if (row.itemType === 'sold' || (row as unknown as Record<string, unknown>).isSold === true || (row.id && row.id.startsWith('row-pos-'))) return 'sold';

  // Check code/SKU column
  const codeCol = columns.find(c => 
    c.name.includes('code') || c.name.includes('kode') || c.name.includes('trx') || c.name.includes('sku') ||
    c.label.toLowerCase().includes('kode') || c.label.toLowerCase().includes('transaksi') || c.label.toLowerCase().includes('sku')
  );
  if (codeCol && row[codeCol.id]) {
    const codeStr = String(row[codeCol.id]).toUpperCase();
    if (codeStr.startsWith('STK-') || codeStr.startsWith('INV-') || codeStr.startsWith('PRD-') || codeStr.startsWith('BRG-')) {
      return 'stock';
    }
    if (codeStr.includes('TRX') || codeStr.startsWith('POS-') || codeStr.startsWith('SLS-')) {
      return 'sold';
    }
  }

  // Check if row has total omset filled (> 0)
  const totalCol = columns.find(c => 
    c.name.includes('total') || c.name.includes('omset') ||
    c.label.toLowerCase().includes('total') || c.label.toLowerCase().includes('omset')
  );
  if (totalCol && Number(row[totalCol.id]) > 0) {
    return 'sold';
  }

  // Check if row has payment status or piutang
  const statusCol = columns.find(c => c.label.toLowerCase().includes('status'));
  if (statusCol && row[statusCol.id]) {
    const s = String(row[statusCol.id]).toLowerCase();
    if (['lunas', 'piutang', 'uang muka'].includes(s)) {
      return 'sold';
    }
  }

  // Default to stock if no transaction markers exist
  return 'stock';
}

/**
 * Calculates unified inventory & sales metrics for a sheet.
 */
export function getSheetMetrics(sheet: Sheet) {
  const qtyCol = sheet.columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') ||
    c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || sheet.columns.find(c => c.type === 'number');

  const totalCol = sheet.columns.find(c => 
    c.name.includes('total') || c.name.includes('omset') ||
    c.label.toLowerCase().includes('total') || c.label.toLowerCase().includes('omset')
  ) || sheet.columns.find(c => c.type === 'decimal');

  const priceCol = sheet.columns.find(c => 
    c.name.includes('harga') || c.name.includes('price') || c.name.includes('satuan') ||
    c.label.toLowerCase().includes('harga')
  );

  let totalAvailableStockUnits = 0;
  let countStockItems = 0;
  let totalSoldUnits = 0;
  let countSoldTransactions = 0;
  let totalRevenueRupiah = 0;
  let totalPiutangRupiah = 0;
  let countPiutangTransactions = 0;

  sheet.rows.forEach(row => {
    const type = getItemType(row, sheet.columns);
    const qtyVal = qtyCol ? Number(row[qtyCol.id]) || 0 : 0;
    const priceVal = priceCol ? Number(row[priceCol.id]) || 0 : 0;
    const totalVal = totalCol ? Number(row[totalCol.id]) || 0 : qtyVal * priceVal;

    // Piutang detection
    let rowPiutang = 0;
    Object.keys(row).forEach(k => {
      const col = sheet.columns.find(c => c.id === k);
      const label = (col?.label || k).toLowerCase();
      if (label.includes('piutang') || label.includes('hutang')) {
        const val = Number(row[k]) || 0;
        if (val > 0) rowPiutang = Math.max(rowPiutang, val);
      }
    });

    if (rowPiutang > 0) {
      totalPiutangRupiah += rowPiutang;
      countPiutangTransactions++;
    }

    if (type === 'stock') {
      totalAvailableStockUnits += qtyVal;
      countStockItems++;
    } else {
      totalSoldUnits += qtyVal;
      countSoldTransactions++;
      totalRevenueRupiah += totalVal;
    }
  });

  return {
    totalAvailableStockUnits,
    countStockItems,
    totalSoldUnits,
    countSoldTransactions,
    totalRevenueRupiah,
    totalPiutangRupiah,
    countPiutangTransactions
  };
}

/**
 * Returns detailed stock status for an inventory item.
 */
export function getItemStockStatus(row: SheetRow, columns: ColumnDefinition[]) {
  const isStock = getItemType(row, columns) === 'stock';
  const qtyCol = columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') ||
    c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || columns.find(c => c.type === 'number');

  const qty = qtyCol ? Number(row[qtyCol.id]) || 0 : 0;
  
  let status: 'ready' | 'low' | 'out' = 'ready';
  let statusLabel = 'Tersedia';
  let badgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

  if (qty <= 0) {
    status = 'out';
    statusLabel = 'Habis (0)';
    badgeClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  } else if (qty <= 3) {
    status = 'low';
    statusLabel = `Menipis (${qty})`;
    badgeClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else {
    statusLabel = `Tersedia (${qty})`;
  }

  return { isStock, qty, status, statusLabel, badgeClass };
}

/**
 * Returns detailed sold information for a sales row.
 */
export function getItemSoldInfo(row: SheetRow, columns: ColumnDefinition[]) {
  const isSold = getItemType(row, columns) === 'sold';
  const qtyCol = columns.find(c => 
    c.name.includes('qty') || c.name.includes('jumlah') || c.name.includes('terjual') ||
    c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('jumlah')
  ) || columns.find(c => c.type === 'number');

  const totalCol = columns.find(c => 
    c.name.includes('total') || c.name.includes('omset') ||
    c.label.toLowerCase().includes('total') || c.label.toLowerCase().includes('omset')
  ) || columns.find(c => c.type === 'decimal');

  const priceCol = columns.find(c => 
    c.name.includes('harga') || c.name.includes('price') || c.name.includes('satuan') ||
    c.label.toLowerCase().includes('harga')
  );

  const soldQty = qtyCol ? Number(row[qtyCol.id]) || 0 : 0;
  const priceVal = priceCol ? Number(row[priceCol.id]) || 0 : 0;
  const totalRevenue = totalCol ? Number(row[totalCol.id]) || 0 : soldQty * priceVal;

  let isPiutang = false;
  let piutangAmount = 0;

  Object.keys(row).forEach(k => {
    const col = columns.find(c => c.id === k);
    const label = (col?.label || k).toLowerCase();
    if (label.includes('piutang') || label.includes('hutang')) {
      const val = Number(row[k]) || 0;
      if (val > 0) {
        piutangAmount = Math.max(piutangAmount, val);
        isPiutang = true;
      }
    } else if (label.includes('status')) {
      const val = String(row[k]).toLowerCase();
      if (val.includes('piutang') || val.includes('tempo') || val.includes('belum')) {
        isPiutang = true;
      }
    }
  });

  return { isSold, soldQty, totalRevenue, isPiutang, piutangAmount };
}
