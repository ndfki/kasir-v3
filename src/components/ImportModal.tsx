import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Layers, 
  RefreshCw, 
  Table, 
  Sparkles, 
  HelpCircle, 
  FileCheck2,
  Download,
  FileDown,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Sheet, SheetRow, ColumnDefinition } from '../types';
import { getItemType } from '../utils/itemClassification';

interface ImportModalProps {
  isOpen: boolean;
  sheet: Sheet;
  onClose: () => void;
  onImport: (newRows: SheetRow[], mode: 'append' | 'replace') => void;
}

interface ParsedFile {
  fileName: string;
  fileSize: number;
  headers: string[];
  rawRows: Record<string, any>[];
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  sheet,
  onClose,
  onImport
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // targetColId -> sourceHeader
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [ignoreEmptyRows, setIgnoreEmptyRows] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate & Download sample Excel or CSV template matching current sheet structure
  const handleDownloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers: string[] = [];
    sheet.columns.forEach(col => {
      headers.push(col.label);
    });
    headers.push('Tipe Item (stock / sold)');

    const sampleStockRow: Record<string, any> = {};
    const sampleSoldRow: Record<string, any> = {};

    sheet.columns.forEach(col => {
      const colLower = (col.label + ' ' + col.name).toLowerCase();
      if (colLower.includes('kode') || colLower.includes('code') || colLower.includes('trx')) {
        sampleStockRow[col.label] = 'STK-001';
        sampleSoldRow[col.label] = 'TRX-260315-1001';
      } else if (colLower.includes('produk') || colLower.includes('item') || colLower.includes('nama')) {
        sampleStockRow[col.label] = 'Laptop Ultra 14 Inch';
        sampleSoldRow[col.label] = 'Wireless Optical Mouse';
      } else if (col.type === 'category') {
        const defaultCat = col.options && col.options.length > 0 ? col.options[0] : 'Umum';
        const secondCat = col.options && col.options.length > 1 ? col.options[1] : defaultCat;
        sampleStockRow[col.label] = defaultCat;
        sampleSoldRow[col.label] = secondCat;
      } else if (colLower.includes('qty') || colLower.includes('jumlah') || colLower.includes('stok') || colLower.includes('terjual')) {
        sampleStockRow[col.label] = 10;
        sampleSoldRow[col.label] = 2;
      } else if (colLower.includes('satuan') || colLower.includes('harga')) {
        sampleStockRow[col.label] = 12000000;
        sampleSoldRow[col.label] = 150000;
      } else if (colLower.includes('total') || colLower.includes('omset')) {
        sampleStockRow[col.label] = 0;
        sampleSoldRow[col.label] = 300000;
      } else if (col.type === 'date') {
        sampleStockRow[col.label] = '2026-03-01';
        sampleSoldRow[col.label] = '2026-03-15';
      } else if (colLower.includes('status')) {
        sampleStockRow[col.label] = 'Tersedia';
        sampleSoldRow[col.label] = 'Lunas';
      } else if (colLower.includes('piutang')) {
        sampleStockRow[col.label] = 0;
        sampleSoldRow[col.label] = 0;
      } else if (colLower.includes('pelanggan') || colLower.includes('customer')) {
        sampleStockRow[col.label] = '-';
        sampleSoldRow[col.label] = 'Bpk. Ahmad';
      } else {
        sampleStockRow[col.label] = col.type === 'number' || col.type === 'decimal' ? 100 : 'Contoh Data';
        sampleSoldRow[col.label] = col.type === 'number' || col.type === 'decimal' ? 200 : 'Contoh Data Terjual';
      }
    });

    sampleStockRow['Tipe Item (stock / sold)'] = 'stock';
    sampleSoldRow['Tipe Item (stock / sold)'] = 'sold';

    const worksheet = XLSX.utils.json_to_sheet([sampleStockRow, sampleSoldRow], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Impor');

    const cleanSheetName = sheet.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `template_impor_${cleanSheetName}.${format}`;

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
    } else {
      XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
    }
  };

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('upload');
    setParsedFile(null);
    setColumnMapping({});
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        throw new Error('Format berkas tidak didukung. Harap unggah file .CSV, .XLSX, atau .XLS.');
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Berkas tidak memiliki lembar kerja (worksheet) yang valid.');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        blankrows: false
      });

      if (jsonData.length === 0) {
        throw new Error('Berkas kosong atau tidak ada data yang terdeteksi.');
      }

      // First non-empty row as header
      let headerRowIndex = 0;
      while (headerRowIndex < jsonData.length && (!jsonData[headerRowIndex] || jsonData[headerRowIndex].length === 0)) {
        headerRowIndex++;
      }

      if (headerRowIndex >= jsonData.length) {
        throw new Error('Tidak dapat menemukan baris judul/kolom pada berkas.');
      }

      const rawHeaders = (jsonData[headerRowIndex] || []).map(h => String(h || '').trim()).filter(Boolean);
      if (rawHeaders.length === 0) {
        throw new Error('Judul kolom tidak valid atau kosong pada berkas.');
      }

      // Convert rows to key-value objects
      const dataRows = jsonData.slice(headerRowIndex + 1);
      const rawRows: Record<string, any>[] = [];

      dataRows.forEach(row => {
        // Skip completely empty rows
        const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
        if (!hasData) return;

        const rowObj: Record<string, any> = {};
        rawHeaders.forEach((header, idx) => {
          rowObj[header] = row[idx] !== undefined ? row[idx] : '';
        });
        rawRows.push(rowObj);
      });

      if (rawRows.length === 0) {
        throw new Error('Berkas hanya berisi judul tanpa baris data.');
      }

      // Smart auto-matching
      const initialMapping: Record<string, string> = {};
      sheet.columns.forEach(targetCol => {
        const targetClean = targetCol.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetNameClean = targetCol.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Exact or normalized match
        const matched = rawHeaders.find(h => {
          const hClean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          return hClean === targetClean || hClean === targetNameClean || hClean.includes(targetClean) || targetClean.includes(hClean);
        });

        if (matched) {
          initialMapping[targetCol.id] = matched;
        } else {
          initialMapping[targetCol.id] = '';
        }
      });

      setParsedFile({
        fileName: file.name,
        fileSize: file.size,
        headers: rawHeaders,
        rawRows
      });
      setColumnMapping(initialMapping);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membaca berkas.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoMatch = () => {
    if (!parsedFile) return;
    const newMapping: Record<string, string> = {};
    sheet.columns.forEach(targetCol => {
      const targetClean = targetCol.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetNameClean = targetCol.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      const matched = parsedFile.headers.find(h => {
        const hClean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return hClean === targetClean || hClean === targetNameClean || hClean.includes(targetClean) || targetClean.includes(hClean);
      });

      newMapping[targetCol.id] = matched || '';
    });
    setColumnMapping(newMapping);
  };

  // Coerce value according to column type
  const coerceValue = (rawVal: any, col: ColumnDefinition) => {
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return '';
    }

    if (col.type === 'number') {
      if (typeof rawVal === 'number') return Math.round(rawVal);
      const cleaned = String(rawVal).replace(/[^\d.-]/g, '');
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : num;
    }

    if (col.type === 'decimal') {
      if (typeof rawVal === 'number') return rawVal;
      // Handle comma decimals (e.g. "12,5" or "1.500,75")
      let s = String(rawVal).trim();
      if (s.includes(',') && s.includes('.')) {
        if (s.indexOf('.') < s.indexOf(',')) {
          // Indonesian style: 1.000,50
          s = s.replace(/\./g, '').replace(',', '.');
        } else {
          // US style: 1,000.50
          s = s.replace(/,/g, '');
        }
      } else if (s.includes(',')) {
        s = s.replace(',', '.');
      }
      const num = parseFloat(s.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? 0 : num;
    }

    if (col.type === 'date') {
      if (rawVal instanceof Date) {
        return rawVal.toISOString().split('T')[0];
      }
      const str = String(rawVal).trim();
      // If DD/MM/YYYY
      if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str)) {
        const parts = str.split(/[/-]/);
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      // If YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.substring(0, 10);
      }
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString().split('T')[0];
      }
      return str;
    }

    if (col.type === 'category') {
      const s = String(rawVal).trim();
      if (col.options && col.options.length > 0) {
        const found = col.options.find(opt => opt.toLowerCase() === s.toLowerCase());
        if (found) return found;
      }
      return s;
    }

    return String(rawVal).trim();
  };

  // Build converted rows
  const generateImportedRows = (): SheetRow[] => {
    if (!parsedFile) return [];

    const now = new Date().toISOString();
    return parsedFile.rawRows.map((rawRow, index) => {
      const rowId = `row-import-${Date.now()}-${index + 1}`;
      const newRow: SheetRow = {
        id: rowId,
        createdAt: now,
        updatedAt: now
      };

      sheet.columns.forEach(col => {
        const sourceHeader = columnMapping[col.id];
        if (sourceHeader && rawRow[sourceHeader] !== undefined) {
          newRow[col.id] = coerceValue(rawRow[sourceHeader], col);
        } else {
          newRow[col.id] = col.type === 'number' || col.type === 'decimal' ? 0 : '';
        }
      });

      // Preserve or intelligently determine itemType (stock vs sold)
      const rawType = rawRow['itemType'] || rawRow['item_type'] || rawRow['tipe'] || rawRow['jenis'] || rawRow['status_item'] || rawRow['Tipe Item (stock / sold)'];
      if (rawType) {
        const tStr = String(rawType).toLowerCase().trim();
        if (tStr.includes('sold') || tStr.includes('jual') || tStr.includes('terjual')) {
          newRow.itemType = 'sold';
        } else if (tStr.includes('stock') || tStr.includes('stok') || tStr.includes('inventori')) {
          newRow.itemType = 'stock';
        } else {
          newRow.itemType = getItemType(newRow, sheet.columns);
        }
      } else {
        newRow.itemType = getItemType(newRow, sheet.columns);
      }

      return newRow;
    });
  };

  const handleFinalImport = () => {
    const importedRows = generateImportedRows();
    if (importedRows.length === 0) {
      setError('Tidak ada baris data yang dapat diimpor.');
      return;
    }

    onImport(importedRows, importMode);
    onClose();
    handleReset();
  };

  // Preview generated first few rows
  const previewRows = generateImportedRows().slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Impor Data ke Sheet: {sheet.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah berkas CSV atau Excel (.XLSX) dan sesuaikan pemetaan kolom
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Tabs */}
        <div className="flex items-center px-6 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <div className="flex items-center space-x-2 w-full justify-between sm:justify-start sm:space-x-6">
            <span className={`flex items-center gap-1.5 font-bold ${step === 'upload' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                1
              </span>
              Pilih Berkas
            </span>

            <span className="text-slate-300">/</span>

            <span className={`flex items-center gap-1.5 font-bold ${step === 'mapping' ? 'text-blue-600' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'mapping' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                2
              </span>
              Pemetaan Kolom
            </span>

            <span className="text-slate-300">/</span>

            <span className={`flex items-center gap-1.5 font-bold ${step === 'preview' ? 'text-blue-600' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                3
              </span>
              Pratinjau &amp; Simpan
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Gagal memproses berkas:</strong>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shadow-xs">
                  {isProcessing ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isProcessing ? 'Membaca data berkas...' : 'Klik atau seret berkas ke sini'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung file Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) dan <strong>.csv</strong>
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
                    Pilih File dari Komputer
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Template Download Section */}
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200">
                        Unduh Template Sesuai Struktur Sheet ({sheet.name})
                      </h4>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300">
                        Gunakan berkas template resmi yang sudah terisi contoh baris inventori stok dan barang terjual.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900 shadow-2xs transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unduh Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-200 bg-white dark:bg-blue-950 border border-blue-300 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900 shadow-2xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Unduh CSV (.csv)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Panduan Format Impor Data (CSV / Excel) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowFormatGuide(!showFormatGuide)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Panduan Format Kolom &amp; Aturan Pengisian Data
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Cek tipe data dan aturan kolom sebelum melakukan impor
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {showFormatGuide ? 'Sembunyikan' : 'Buka Panduan'}
                    </span>
                    {showFormatGuide ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {showFormatGuide && (
                  <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                    {/* Columns table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold">
                          <tr>
                            <th className="p-2.5">Nama Kolom Sheet</th>
                            <th className="p-2.5">Tipe Data</th>
                            <th className="p-2.5">Aturan Format</th>
                            <th className="p-2.5">Contoh Isian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                          {sheet.columns.map(col => {
                            let typeBadge = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                            let typeText = 'Teks';
                            let ruleText = 'Ketik teks bebas';
                            let exampleText = 'Contoh Teks';

                            if (col.type === 'number') {
                              typeBadge = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                              typeText = 'Angka Bulat';
                              ruleText = 'Angka murni tanpa huruf atau simbol. Pemisah ribuan otomatis dibersihkan.';
                              exampleText = '15, 24, 100';
                            } else if (col.type === 'decimal') {
                              typeBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                              typeText = 'Mata Uang / Desimal';
                              ruleText = 'Nilai nominal rupiah murni (boleh tanpa simbol Rp). Contoh: 250000 atau 1.500.000.';
                              exampleText = '250000, 15000000';
                            } else if (col.type === 'date') {
                              typeBadge = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                              typeText = 'Tanggal';
                              ruleText = 'Format standar YYYY-MM-DD (2026-03-15) atau DD/MM/YYYY (15/03/2026).';
                              exampleText = '2026-03-15';
                            } else if (col.type === 'category') {
                              typeBadge = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300';
                              typeText = 'Pilihan Kategori';
                              ruleText = col.options?.length ? `Pilihan: ${col.options.join(', ')}` : 'Pilihan kategori sesuai data';
                              exampleText = col.options?.[0] || 'Umum';
                            }

                            return (
                              <tr key={col.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                <td className="p-2.5 font-bold">
                                  <span>{col.label}</span>
                                  {col.isRequired && (
                                    <span className="text-rose-500 ml-1 font-bold">*</span>
                                  )}
                                  <span className="block text-[10px] text-slate-400 font-mono font-normal">
                                    {col.name}
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${typeBadge}`}>
                                    {typeText}
                                  </span>
                                </td>
                                <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                                  {ruleText}
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                  {exampleText}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Extra itemType guide row */}
                          <tr className="bg-indigo-50/50 dark:bg-indigo-950/20">
                            <td className="p-2.5 font-bold text-indigo-950 dark:text-indigo-200">
                              <span>Tipe Item (Opsional)</span>
                              <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-normal">
                                item_type / tipe
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                Status Klasifikasi
                              </span>
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                              Isi <strong>stock</strong> untuk Inventori Stok Tersedia, atau <strong>sold</strong> untuk Transaksi Terjual. Jika dikosongkan, sistem mengenali otomatis dari kode TRX/STK &amp; omset.
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-indigo-700 dark:text-indigo-300">
                              stock atau sold
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Rules Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        <strong className="text-slate-800 dark:text-slate-200 block mb-0.5 font-bold">
                          💡 Baris Pertama = Judul
                        </strong>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Pastikan baris nomor 1 pada file memuat judul kolom agar sistem otomatis mencocokkan ke kolom sheet.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        <strong className="text-slate-800 dark:text-slate-200 block mb-0.5 font-bold">
                          💰 Format Angka Rupiah
                        </strong>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Sistem cerdas: Angka dengan simbol Rp, koma, atau titik ribuan (misal: "Rp 150.000") otomatis dikonversi jadi 150000.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                        <strong className="text-slate-800 dark:text-slate-200 block mb-0.5 font-bold">
                          📊 Grafik Hanya Terjual
                        </strong>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Barang berstatus <code>stock</code> hanya dihitung di inventori, sedangkan transaksi <code>sold</code> masuk ke grafik omset.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 'mapping' && parsedFile && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-900">{parsedFile.fileName}</span>
                  <span className="text-blue-600">
                    ({parsedFile.rawRows.length} baris terdeteksi)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoMatch}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                  title="Cocokkan kembali secara otomatis"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Auto Cocokkan</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Sesuaikan Kolom Sheet dengan Judul Berkas:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {sheet.columns.length} kolom target
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {sheet.columns.map((col) => {
                    const currentMapped = columnMapping[col.id] || '';
                    const sampleValue = currentMapped && parsedFile.rawRows[0] 
                      ? parsedFile.rawRows[0][currentMapped] 
                      : null;

                    return (
                      <div key={col.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition">
                        {/* Target Sheet Column */}
                        <div className="w-full sm:w-1/2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800">
                              {col.label}
                            </span>
                            {col.isRequired && (
                              <span className="text-rose-500 text-[11px] font-bold">*Wajib</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {col.type}
                            </span>
                          </div>
                          {sampleValue !== null && sampleValue !== undefined && sampleValue !== '' && (
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                              Contoh data: <span className="text-slate-600 italic">"{String(sampleValue).substring(0, 30)}"</span>
                            </span>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="hidden sm:flex text-slate-400 px-2">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Source File Column Dropdown */}
                        <div className="w-full sm:w-1/2">
                          <select
                            value={currentMapped}
                            onChange={(e) => {
                              const val = e.target.value;
                              setColumnMapping(prev => ({ ...prev, [col.id]: val }));
                            }}
                            className={`w-full text-xs p-2 rounded-xl border bg-white focus:outline-blue-500 ${
                              currentMapped ? 'border-blue-400 font-semibold text-slate-800' : 'border-slate-200 text-slate-400'
                            }`}
                          >
                            <option value="">-- Abaikan / Jangan Impor --</option>
                            {parsedFile.headers.map((h, i) => (
                              <option key={i} value={h}>
                                Kolom Berkas: {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode Pemilihan: Tambah (Append) vs Ganti (Replace) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Metode Penyimpanan Data:</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600"
                    />
                    <span>
                      <strong>Tambahkan (Append)</strong> — Gabungkan dengan {sheet.rows.length} baris yang ada
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-blue-600"
                    />
                    <span>
                      <strong className="text-rose-600">Gantikan (Replace)</strong> — Timpa seluruh data lama
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && parsedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <span className="font-semibold">
                  Siap mengimpor <strong>{parsedFile.rawRows.length} baris</strong> ke sheet <strong>{sheet.name}</strong> ({importMode === 'append' ? 'Metode Append' : 'Metode Replace'}).
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Pratinjau Hasil Impor (3 baris pertama):
                </span>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        {sheet.columns.map(col => (
                          <th key={col.id} className="py-2.5 px-3 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          {sheet.columns.map(col => (
                            <td key={col.id} className="py-2 px-3 text-slate-700 whitespace-nowrap">
                              {row[col.id] !== undefined && row[col.id] !== '' ? (
                                String(row[col.id])
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                &larr; Ganti Berkas
              </button>
            )}
            {step === 'preview' && (
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                &larr; Kembali ke Pemetaan
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                handleReset();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>

            {step === 'mapping' && (
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                <span>Lanjut ke Pratinjau</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'preview' && (
              <button
                type="button"
                onClick={handleFinalImport}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi &amp; Impor Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
