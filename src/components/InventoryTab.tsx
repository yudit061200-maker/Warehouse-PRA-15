import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  Printer,
  QrCode,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  MapPin,
  Package,
  X,
  CheckSquare,
  Square,
  Boxes,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Tag,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { exportInventoryToExcel, exportInventoryToPDF } from '../utils/exporter';

export type InventorySortKey =
  | 'name_asc'
  | 'name_desc'
  | 'category_asc'
  | 'category_desc'
  | 'location_asc'
  | 'location_desc'
  | 'stock_desc'
  | 'stock_asc'
  | 'deficit_desc'
  | 'sku_asc'
  | 'value_desc'
  | 'value_asc'
  | 'price_desc'
  | 'price_asc';

interface InventoryTabProps {
  items: InventoryItem[];
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem, category?: 'IN' | 'OUT' | 'GENERAL') => void;
  onPrintBatchQR?: (selectedItems: InventoryItem[], category?: 'IN' | 'OUT' | 'GENERAL') => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onStockIn,
  onStockOut,
  onPrintBarcode,
  onPrintBatchQR,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  >('ALL');
  const [sortBy, setSortBy] = useState<InventorySortKey>('name_asc');

  // Multi-item selection for batch actions (e.g. print QR following stock)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const categories = useMemo(() => {
    const set = new Set<string>(
      items.map((i) => (i.category || '').trim()).filter(Boolean)
    );
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [items]);

  const locations = useMemo(() => {
    const set = new Set<string>(
      items.map((i) => (i.location || '').trim()).filter(Boolean)
    );
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.supplier && item.supplier.toLowerCase().includes(q));

      // Separate Category Filter
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      // Separate Location Filter
      const matchesLocation =
        selectedLocation === 'ALL' || item.location === selectedLocation;

      // Status
      let matchesStatus = true;
      if (stockStatusFilter === 'OUT_OF_STOCK') {
        matchesStatus = item.quantity === 0;
      } else if (stockStatusFilter === 'LOW_STOCK') {
        matchesStatus = item.quantity > 0 && item.quantity <= item.minStock;
      } else if (stockStatusFilter === 'IN_STOCK') {
        matchesStatus = item.quantity > item.minStock;
      }

      return matchesQuery && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedLocation, stockStatusFilter]);

  // Sort filtered items according to selected sortBy option
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '', 'id');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '', 'id');
        case 'category_asc':
          return (a.category || '').localeCompare(b.category || '', 'id');
        case 'category_desc':
          return (b.category || '').localeCompare(a.category || '', 'id');
        case 'location_asc':
          return (a.location || '').localeCompare(b.location || '', 'id');
        case 'location_desc':
          return (b.location || '').localeCompare(a.location || '', 'id');
        case 'stock_desc':
          return b.quantity - a.quantity;
        case 'stock_asc':
          return a.quantity - b.quantity;
        case 'deficit_desc': {
          const ratioA = a.minStock > 0 ? a.quantity / a.minStock : 999;
          const ratioB = b.minStock > 0 ? b.quantity / b.minStock : 999;
          return ratioA - ratioB;
        }
        case 'sku_asc':
          return (a.sku || '').localeCompare(b.sku || '');
        case 'value_desc':
          return (b.quantity * (b.unitPrice || 0)) - (a.quantity * (a.unitPrice || 0));
        case 'value_asc':
          return (a.quantity * (a.unitPrice || 0)) - (b.quantity * (b.unitPrice || 0));
        case 'price_desc':
          return (b.unitPrice || 0) - (a.unitPrice || 0);
        case 'price_asc':
          return (a.unitPrice || 0) - (b.unitPrice || 0);
        default:
          return 0;
      }
    });
  }, [filteredItems, sortBy]);

  const lowStockCount = items.filter((i) => i.quantity <= i.minStock).length;

  // Selected items objects
  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedItemIds.includes(i.id));
  }, [items, selectedItemIds]);

  const totalStockOfSelected = useMemo(() => {
    return selectedItems.reduce((acc, it) => acc + Math.max(1, it.quantity), 0);
  }, [selectedItems]);

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = sortedItems.map((i) => i.id);
    const isAllSelected = allFilteredIds.every((id) => selectedItemIds.includes(id));
    if (isAllSelected) {
      // Unselect filtered items
      setSelectedItemIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      // Add all filtered items to selection
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handlePrintBatch = (category: 'IN' | 'OUT' | 'GENERAL' = 'GENERAL') => {
    if (onPrintBatchQR) {
      const targets = selectedItems.length > 0 ? selectedItems : sortedItems;
      onPrintBatchQR(targets, category);
    } else {
      onPrintBarcode(selectedItems[0] || items[0], category);
    }
  };

  return (
    <div className="space-y-5 w-full pb-10">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span>Master Data Inventory & Stok</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Menampilkan {sortedItems.length} dari total {items.length} SKU terdaftar di gudang
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Quick Print QR Sheet Button */}
          <button
            onClick={handlePrintBatch}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
            title="Cetak Sheet QR Code Masal"
          >
            <QrCode className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {selectedItemIds.length > 0
                ? `Cetak QR (${selectedItemIds.length} Terpilih)`
                : 'Cetak Sheet QR'}
            </span>
          </button>

          {/* Export Buttons */}
          <button
            onClick={() => exportInventoryToExcel(sortedItems)}
            className="px-2.5 sm:px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Excel</span>
          </button>
          <button
            onClick={() => exportInventoryToPDF(sortedItems)}
            className="px-2.5 sm:px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
            title="Download PDF"
          >
            <FileText className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate">PDF</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={onAddItem}
            className="col-span-2 sm:col-span-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Floating/Prominent Batch Action Bar when items are selected */}
      {selectedItemIds.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-4 rounded-2xl shadow-lg border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  {selectedItemIds.length} Barang Terpilih
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Total Stok: {totalStockOfSelected} unit
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Siap dicetak sebagai label QR Code mengikuti persis jumlah unit fisik stok di gudang.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSelectedItemIds([])}
              className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal ({selectedItemIds.length})
            </button>
            <button
              type="button"
              onClick={() => handlePrintBatch('IN')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Cetak Label Masuk untuk batch ini"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Label Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintBatch('OUT')}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Cetak Label Keluar untuk batch ini"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Label Keluar</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrintBatch('GENERAL')}
              className="px-3 py-2 bg-white text-indigo-950 hover:bg-indigo-50 active:scale-95 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Cetak Label Rak Standar"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-700" />
              <span>Label Rak ({totalStockOfSelected})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, Barcode, Nama..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 bg-slate-50 text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
              title="Filter Kategori"
            >
              <option value="ALL">Semua Kategori ({categories.length - 1})</option>
              {categories
                .filter((c) => c !== 'ALL')
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
              title="Filter Lokasi Rak"
            >
              <option value="ALL">Semua Lokasi / Rak ({locations.length - 1})</option>
              {locations
                .filter((l) => l !== 'ALL')
                .map((l) => (
                  <option key={l} value={l}>
                    Rak: {l}
                  </option>
                ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-red-600 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as InventorySortKey)}
              className="w-full pl-8 pr-3 py-2 text-xs md:text-sm font-medium border border-slate-200 bg-slate-50 text-slate-900 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
              title="Urutkan Master Barang"
            >
              <option value="name_asc">Nama (A → Z)</option>
              <option value="name_desc">Nama (Z → A)</option>
              <option value="category_asc">Kategori (A → Z)</option>
              <option value="category_desc">Kategori (Z → A)</option>
              <option value="location_asc">Lokasi Rak (A → Z)</option>
              <option value="location_desc">Lokasi Rak (Z → A)</option>
              <option value="stock_desc">Stok Terbanyak</option>
              <option value="stock_asc">Stok Tersedikit</option>
              <option value="deficit_desc">Stok Kritis / Menipis</option>
              <option value="sku_asc">Kode SKU (A → Z)</option>
              <option value="value_desc">Total Nilai Tertinggi</option>
              <option value="value_asc">Total Nilai Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="price_asc">Harga Terendah</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips & Active Filter Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStockStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[34px] ${
                stockStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('LOW_STOCK')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer min-h-[34px] ${
                stockStatusFilter === 'LOW_STOCK'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Menipis ({lowStockCount})
            </button>
            <button
              onClick={() => setStockStatusFilter('OUT_OF_STOCK')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[34px] ${
                stockStatusFilter === 'OUT_OF_STOCK'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Habis ({items.filter((i) => i.quantity === 0).length})
            </button>
          </div>

          {(selectedCategory !== 'ALL' || selectedLocation !== 'ALL' || searchQuery || stockStatusFilter !== 'ALL') && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Ditemukan: <strong>{filteredItems.length}</strong> barang
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedLocation('ALL');
                  setSearchQuery('');
                  setStockStatusFilter('ALL');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {sortedItems.length === 0 ? (
          <div className="py-14 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Barang tidak ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1">
              Coba sesuaikan kata kunci pencarian atau filter status.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                        title={
                          filteredItems.length > 0 &&
                          filteredItems.every((i) => selectedItemIds.includes(i.id))
                            ? 'Batalkan semua pilihan'
                            : 'Pilih semua barang yang tampil'
                        }
                      >
                        {filteredItems.length > 0 &&
                        filteredItems.every((i) => selectedItemIds.includes(i.id)) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}
                        className="flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer group"
                        title="Urutkan berdasarkan Nama Barang"
                      >
                        <span>Barang & SKU</span>
                        {sortBy === 'name_asc' && <ArrowUp className="w-3 h-3 text-red-600" />}
                        {sortBy === 'name_desc' && <ArrowDown className="w-3 h-3 text-red-600" />}
                        {sortBy !== 'name_asc' && sortBy !== 'name_desc' && (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">QR Code & Label</th>
                    <th className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSortBy(sortBy === 'category_asc' ? 'category_desc' : 'category_asc')}
                        className="flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer group"
                        title="Urutkan berdasarkan Kategori"
                      >
                        <span>Kategori</span>
                        {sortBy === 'category_asc' && <ArrowUp className="w-3 h-3 text-red-600" />}
                        {sortBy === 'category_desc' && <ArrowDown className="w-3 h-3 text-red-600" />}
                        {sortBy !== 'category_asc' && sortBy !== 'category_desc' && (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSortBy(sortBy === 'location_asc' ? 'location_desc' : 'location_asc')}
                        className="flex items-center gap-1 hover:text-red-600 transition-colors cursor-pointer group"
                        title="Urutkan berdasarkan Lokasi Rak"
                      >
                        <span>Lokasi Rak</span>
                        {sortBy === 'location_asc' && <ArrowUp className="w-3 h-3 text-red-600" />}
                        {sortBy === 'location_desc' && <ArrowDown className="w-3 h-3 text-red-600" />}
                        {sortBy !== 'location_asc' && sortBy !== 'location_desc' && (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSortBy(sortBy === 'stock_desc' ? 'stock_asc' : 'stock_desc')}
                        className="inline-flex items-center justify-center gap-1 hover:text-red-600 transition-colors cursor-pointer group w-full"
                        title="Urutkan berdasarkan Kuantitas Stok"
                      >
                        <span>Stok / Min</span>
                        {sortBy === 'stock_desc' && <ArrowDown className="w-3 h-3 text-red-600" />}
                        {sortBy === 'stock_asc' && <ArrowUp className="w-3 h-3 text-red-600" />}
                        {sortBy !== 'stock_desc' && sortBy !== 'stock_asc' && (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSortBy(sortBy === 'price_desc' ? 'price_asc' : 'price_desc')}
                        className="inline-flex items-center justify-end gap-1 hover:text-red-600 transition-colors cursor-pointer group w-full"
                        title="Urutkan berdasarkan Harga Satuan"
                      >
                        <span>Harga Satuan</span>
                        {sortBy === 'price_desc' && <ArrowDown className="w-3 h-3 text-red-600" />}
                        {sortBy === 'price_asc' && <ArrowUp className="w-3 h-3 text-red-600" />}
                        {sortBy !== 'price_desc' && sortBy !== 'price_asc' && (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sortedItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isOutOfStock = item.quantity === 0;
                    const isLowStock =
                      item.quantity > 0 && item.quantity <= item.minStock;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-red-50/50' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectItem(item.id);
                            }}
                            className="p-1 rounded hover:bg-slate-200/60 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-red-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* Name & SKU */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 text-xs block line-clamp-1">
                            {item.name}
                          </span>
                          <span className="font-mono text-[11px] text-red-700 font-bold">
                            {item.sku}
                          </span>
                          {item.supplier && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              Sup: {item.supplier}
                            </span>
                          )}
                        </td>

                        {/* QR Code & Print Action */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-mono text-[11px] font-semibold text-slate-700">
                              {item.barcode || item.sku}
                            </span>
                            <button
                              onClick={() => onPrintBarcode(item)}
                              className="text-[10px] text-red-700 hover:text-red-900 flex items-center gap-1 font-semibold cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded"
                            >
                              <QrCode className="w-3 h-3" /> Cetak Sheet QR
                            </button>
                          </div>
                        </td>

                        {/* Dedicated Category Column */}
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 text-slate-800 text-[11px] font-medium max-w-[130px] truncate"
                            title={item.category}
                          >
                            {item.category || 'Umum'}
                          </span>
                        </td>

                        {/* Dedicated Location Column */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50/70 border border-red-100 text-slate-800 text-[11px] font-mono font-medium whitespace-nowrap">
                            <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>{item.location || '-'}</span>
                          </div>
                        </td>

                        {/* Stock & Min */}
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-bold text-slate-900 block font-mono">
                            {item.quantity}{' '}
                            <span className="text-xs font-normal text-slate-500 font-sans">
                              {item.unit}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Min: {item.minStock} {item.unit}
                          </span>
                        </td>

                        {/* Price & Valuation */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-slate-900 block font-mono">
                            {formatRupiah(item.unitPrice)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Total: {formatRupiah(item.quantity * item.unitPrice)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] uppercase flex items-center justify-center gap-1 mx-auto w-fit">
                              <AlertTriangle className="w-3 h-3" /> Menipis
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase">
                              Aman
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onStockIn(item)}
                              title="Catat Barang Masuk (+)"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onStockOut(item)}
                              title="Catat Barang Keluar (-)"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditItem(item)}
                              title="Edit Barang"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(item)}
                              title="Hapus Barang"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {sortedItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const isOutOfStock = item.quantity === 0;
                const isLowStock =
                  item.quantity > 0 && item.quantity <= item.minStock;

                return (
                  <div
                    key={item.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? 'bg-red-50/50' : ''
                    }`}
                  >
                    {/* Top Row: Checkbox, Name, SKU, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectItem(item.id)}
                          className="mt-0.5 p-1 rounded hover:bg-slate-200/60 cursor-pointer text-slate-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug break-words">
                            {item.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-red-700 font-mono font-bold">
                              {item.sku}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200/60">
                              {item.category}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-800 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md font-mono font-medium">
                              <MapPin className="w-2.5 h-2.5 text-red-600" />
                              {item.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase shrink-0">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] uppercase shrink-0 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Menipis
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase shrink-0">
                          Aman
                        </span>
                      )}
                    </div>

                    {/* Stock & Price */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Stok Fisik</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Harga Satuan</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatRupiah(item.unitPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => onPrintBarcode(item)}
                        className="text-xs text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Cetak QR
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onStockIn(item)}
                          className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onStockOut(item)}
                          className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
