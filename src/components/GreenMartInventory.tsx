import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Barcode, 
  X, 
  Save, 
  Layers
} from 'lucide-react';
import { GreenMartProduct } from '../types';
import { GREENMART_CATEGORIES } from '../data/greenmartData';
import { GreenMartConfirmModal } from './GreenMartConfirmModal';

interface GreenMartInventoryProps {
  products: GreenMartProduct[];
  onAddProduct: (newProduct: Omit<GreenMartProduct, 'id'>) => void;
  onUpdateProduct: (product: GreenMartProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkDeleteProducts?: (productIds: string[]) => void;
  onRestock: (productId: string, quantity: number) => void;
}

export const GreenMartInventory: React.FC<GreenMartInventoryProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onRestock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Multi-selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GreenMartProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<GreenMartProduct | null>(null);

  // Form states
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(GREENMART_CATEGORIES[0] as string);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>('');
  const [unit, setUnit] = useState('Pcs');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setBarcode(''); // Tidak otomatis ada kode, user scan atau ketik manual
    setName('');
    setCategory(GREENMART_CATEGORIES[0]);
    setCostPrice('');
    setSellingPrice('');
    setStock(''); // Tidak langsung ada angka
    setMinStock(''); // Tidak langsung ada angka
    setUnit('Pcs');
    setDescription('');
    setEmoji('📦');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: GreenMartProduct) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setUnit(p.unit);
    setDescription(p.description || '');
    setEmoji(p.emoji || '📦');
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleGenerateBarcode = () => {
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(`899${randomSuffix}`.slice(0, 13));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }
    if (!barcode.trim()) {
      setFormError('Barcode produk wajib diisi.');
      return;
    }

    const numCost = costPrice === '' ? 0 : Number(costPrice);
    const numSell = sellingPrice === '' ? 0 : Number(sellingPrice);
    const numStock = stock === '' ? 0 : Number(stock);
    const numMinStock = minStock === '' ? 1 : Number(minStock);

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        barcode: barcode.trim(),
        name: name.trim(),
        category,
        costPrice: numCost,
        sellingPrice: numSell,
        stock: numStock,
        minStock: numMinStock,
        unit,
        description: description.trim(),
        emoji,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddProduct({
        barcode: barcode.trim(),
        name: name.trim(),
        category,
        costPrice: numCost,
        sellingPrice: numSell,
        stock: numStock,
        minStock: numMinStock,
        unit,
        description: description.trim(),
        emoji,
        createdAt: new Date().toISOString()
      });
    }

    setIsFormModalOpen(false);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setSelectedProductIds(prev => prev.filter(id => id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  // Inventory Statistics
  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryAssetValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.barcode.includes(searchQuery);
      
      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'out') matchStock = p.stock <= 0;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredProducts.map(p => p.id));
      setSelectedProductIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedProductIds);
      filteredProducts.forEach(p => newSelected.add(p.id));
      setSelectedProductIds(Array.from(newSelected));
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    if (onBulkDeleteProducts) {
      onBulkDeleteProducts(selectedProductIds);
    } else {
      selectedProductIds.forEach(id => onDeleteProduct(id));
    }
    setSelectedProductIds([]);
    setIsBulkDeleteConfirmOpen(false);
  };

  // Margin calculation helper
  const numSelling = sellingPrice === '' ? 0 : Number(sellingPrice);
  const numCost = costPrice === '' ? 0 : Number(costPrice);
  const marginRp = numSelling - numCost;
  const marginPercent = numCost > 0 ? Math.round((marginRp / numCost) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block">
            Total Produk
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            {totalProductsCount} <span className="text-xs sm:text-sm font-normal text-slate-400">SKU</span>
          </div>
          <span className="text-xs sm:text-sm text-emerald-600 font-semibold block truncate">
            {totalStockUnits.toLocaleString('id-ID')} Total Unit Fisik
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider block">
            Nilai Aset Modal
          </span>
          <div className="text-xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 truncate">
            Rp {totalInventoryAssetValue.toLocaleString('id-ID')}
          </div>
          <span className="text-xs text-slate-400 block truncate">
            Total Nilai Pokok HPP
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">Stok Menipis</span>
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {lowStockCount} <span className="text-xs sm:text-sm font-normal text-slate-400">Item</span>
          </div>
          <span className="text-xs text-slate-400 block truncate">
            &le; Batas minimum stok
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
          <span className="text-xs sm:text-sm font-bold text-rose-700 uppercase tracking-wider block">
            Stok Habis
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600">
            {outOfStockCount} <span className="text-xs sm:text-sm font-normal text-slate-400">Item</span>
          </div>
          <span className="text-xs text-slate-400 block truncate">
            {outOfStockCount > 0 ? 'Perlu Kulakan Segera' : 'Semua Stok Tersedia'}
          </span>
        </div>

      </div>

      {/* Action Bar: Search, Category Filter, and Add Button */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang / barcode..."
            className="w-full text-xs sm:text-sm font-medium pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-emerald-500"
          >
            <option value="Semua">Semua Kategori</option>
            {GREENMART_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                stockFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                stockFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              Tipis ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                stockFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Habis ({outOfStockCount})
            </button>
          </div>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>

        </div>

      </div>

      {/* Multi-Selection Bulk Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg border border-emerald-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              {selectedProductIds.length}
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm">
                {selectedProductIds.length} Produk Terpilih dari Stok
              </p>
              <p className="text-[11px] text-emerald-200">
                Pilih aksi massal untuk menghapus produk sekaligus dari sistem
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus {selectedProductIds.length} Produk Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Product List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold tracking-wider text-xs">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    title={isAllFilteredSelected ? "Batal Pilih Semua" : "Pilih Semua Terfilter"}
                  />
                </th>
                <th className="py-3.5 px-4">Barcode / SKU</th>
                <th className="py-3.5 px-4">Nama Produk &amp; Kategori</th>
                <th className="py-3.5 px-4">Harga Beli</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Margin Laba</th>
                <th className="py-3.5 px-4">Sisa Stok</th>
                <th className="py-3.5 px-4 text-center">Restock Cepat</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-400 italic">
                    Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock <= 0;
                  const itemMargin = p.sellingPrice - p.costPrice;
                  const itemMarginPct = p.costPrice > 0 ? Math.round((itemMargin / p.costPrice) * 100) : 0;
                  const isSelected = selectedProductIds.includes(p.id);

                  return (
                    <tr 
                      key={p.id} 
                      className={`transition ${
                        isSelected 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>

                      {/* Barcode */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                          <Barcode className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl shrink-0">{p.emoji || '📦'}</span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {p.category} &bull; {p.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                        Rp {p.costPrice.toLocaleString('id-ID')}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        Rp {p.sellingPrice.toLocaleString('id-ID')}
                      </td>

                      {/* Margin */}
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-bold font-mono ${
                          itemMargin > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          +Rp {itemMargin.toLocaleString('id-ID')} ({itemMarginPct}%)
                        </span>
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${
                          isOut
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}>
                          <span>{p.stock} {p.unit}</span>
                        </span>
                      </td>

                      {/* Quick Restock (+5, +10, +50) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRestock(p.id, 5)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Tambah 5 unit"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => onRestock(p.id, 10)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Tambah 10 unit"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => onRestock(p.id, 50)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title="Tambah 50 unit"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                      {/* Actions: Edit & Working Delete Button */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(p)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: INPUT / EDIT BARANG */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-800 text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  {editingProduct ? 'Edit Data Barang' : 'Input Barang Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Barcode & Auto Generator */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Kode Barcode (EAN-13) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Buat Barcode Acak
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan barcode atau ketik kode manual"
                  className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  required
                />
              </div>

              {/* Nama Produk & Emoji */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Ikon
                  </label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full text-center text-base p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="col-span-9">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nama Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Kategori & Satuan */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  >
                    {GREENMART_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Satuan
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  >
                    {['Pcs', 'Kg', 'Pouch', 'Sak', 'Botol', 'Bungkus', 'Kotak', 'Renceng', 'Pack', 'Ikat'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Beli & Harga Jual */}
              <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Harga Modal / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                    placeholder=""
                    className="w-full text-xs font-mono font-bold p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                    placeholder=""
                    className="w-full text-xs font-mono font-bold p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                </div>

                <div className="col-span-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Margin Keuntungan:</span>
                  <span className="font-mono">Rp {marginRp.toLocaleString('id-ID')} ({marginPercent}%)</span>
                </div>
              </div>

              {/* Stok & Min Stok */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Stok Fisik
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                    placeholder=""
                    className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Batas Peringatan Tipis
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10)))}
                    placeholder=""
                    className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Keterangan Produk
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder=""
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETING SINGLE PRODUCT */}
      <GreenMartConfirmModal
        isOpen={!!productToDelete}
        title="Hapus Produk dari Inventori?"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}" (${productToDelete?.barcode})? Tindakan ini akan menghapus produk dari inventori kasir.`}
        confirmLabel="Ya, Hapus Produk"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />

      {/* CONFIRMATION MODAL FOR BULK DELETING SELECTED PRODUCTS */}
      <GreenMartConfirmModal
        isOpen={isBulkDeleteConfirmOpen}
        title={`Hapus ${selectedProductIds.length} Produk Terpilih?`}
        message={`Apakah Anda yakin ingin menghapus sekaligus ${selectedProductIds.length} produk yang dipilih dari inventori database? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={`Ya, Hapus ${selectedProductIds.length} Produk`}
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteConfirmOpen(false)}
      />

    </div>
  );
};
