import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sheet, SheetRow } from '../types';

export const exportToCsv = (sheet: Sheet, rowsToExport: SheetRow[]) => {
  const headers = ['ID', ...sheet.columns.map(c => c.label), 'Waktu Dibuat'];
  const csvRows: string[] = [];

  // UTF-8 BOM
  const BOM = '\uFEFF';
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  rowsToExport.forEach((row, idx) => {
    const rowData = [
      String(idx + 1),
      ...sheet.columns.map(c => {
        const val = row[c.id];
        return val !== undefined && val !== null ? String(val) : '';
      }),
      row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID') : '-'
    ];
    csvRows.push(rowData.map(r => `"${r.replace(/"/g, '""')}"`).join(','));
  });

  const blob = new Blob([BOM + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${sanitizeFilename(sheet.name)}_export.csv`);
};

export const exportToXlsx = (sheet: Sheet, rowsToExport: SheetRow[]) => {
  const tableData = rowsToExport.map((row, idx) => {
    const obj: Record<string, any> = {
      'No': idx + 1,
    };
    sheet.columns.forEach(col => {
      let val = row[col.id];
      if (col.type === 'number' || col.type === 'decimal') {
        val = val !== undefined && val !== null ? Number(val) : 0;
      }
      obj[col.label] = val !== undefined ? val : '';
    });
    obj['Tanggal Dibuat'] = row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID') : '-';
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(tableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheet.name));

  // Auto column width
  const maxProps = Object.keys(tableData[0] || {});
  const wscols = maxProps.map(key => ({ wch: Math.max(key.length + 4, 14) }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${sanitizeFilename(sheet.name)}_export.xlsx`);
};

export const exportToPdf = (sheet: Sheet, rowsToExport: SheetRow[]) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(`Laporan Data Statistik: ${sheet.name}`, 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Deskripsi: ${sheet.description || 'Tidak ada deskripsi'}`, 14, 21);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Total Baris: ${rowsToExport.length}`, 14, 26);

  // Table columns
  const tableHeaders = ['#', ...sheet.columns.map(c => c.label)];
  const tableData = rowsToExport.map((row, idx) => [
    String(idx + 1),
    ...sheet.columns.map(c => {
      const val = row[c.id];
      if (val === undefined || val === null) return '-';
      if (c.type === 'number' || c.type === 'decimal') {
        const n = Number(val);
        return isNaN(n) ? String(val) : n.toLocaleString('id-ID');
      }
      return String(val);
    })
  ]);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 32,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Blue 600
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 32, left: 14, right: 14, bottom: 14 }
  });

  doc.save(`${sanitizeFilename(sheet.name)}_laporan.pdf`);
};

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 50);
}

function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]]/g, '').substring(0, 28) || 'DataSheet';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
