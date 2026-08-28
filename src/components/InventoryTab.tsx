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
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  MapPin,
  Package,
  X,
} from 'lucide-react';
import { exportInventoryToExcel, exportInventoryToPDF } from '../utils/exporter';

interface InventoryTabProps {
  items: InventoryItem[];
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onStockIn: (item: InventoryItem) => void;
  onStockOut: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onStockIn,
  onStockOut,
  onPrintBarcode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  >('ALL');

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.supplier && item.supplier.toLowerCase().includes(q));

      // Category
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      // Status
      let matchesStatus = true;
      if (stockStatusFilter === 'OUT_OF_STOCK') {
        matchesStatus = item.quantity === 0;
      } else if (stockStatusFilter === 'LOW_STOCK') {
        matchesStatus = item.quantity > 0 && item.quantity <= item.minStock;
      } else if (stockStatusFilter === 'IN_STOCK') {
        matchesStatus = item.quantity > item.minStock;
      }

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, stockStatusFilter]);

  const lowStockCount = items.filter((i) => i.quantity <= i.minStock).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
            Master Data Inventory & Stok
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Menampilkan {filteredItems.length} dari total {items.length} SKU terdaftar di gudang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Buttons */}
          <button
            onClick={() => exportInventoryToExcel(filteredItems)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => exportInventoryToPDF(filteredItems)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Cetak PDF</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={onAddItem}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, Barcode, Nama Barang, Lokasi Rak..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStockStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                stockStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                stockStatusFilter === 'LOW_STOCK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Menipis ({lowStockCount})
            </button>
            <button
              onClick={() => setStockStatusFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                stockStatusFilter === 'OUT_OF_STOCK'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Habis ({items.filter((i) => i.quantity === 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
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
                    <th className="py-3.5 px-4">Barang & SKU</th>
                    <th className="py-3.5 px-4">Barcode</th>
                    <th className="py-3.5 px-4">Kategori & Lokasi</th>
                    <th className="py-3.5 px-4 text-center">Stok / Min</th>
                    <th className="py-3.5 px-4 text-right">Harga & Valuasi</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredItems.map((item) => {
                    const isOutOfStock = item.quantity === 0;
                    const isLowStock =
                      item.quantity > 0 && item.quantity <= item.minStock;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Name & SKU */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 text-xs block line-clamp-1">
                            {item.name}
                          </span>
                          <span className="font-mono text-[11px] text-indigo-700 font-bold">
                            {item.sku}
                          </span>
                          {item.supplier && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              Sup: {item.supplier}
                            </span>
                          )}
                        </td>

                        {/* Barcode */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {item.barcode}
                            </span>
                            <button
                              onClick={() => onPrintBarcode(item)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <Printer className="w-3 h-3" /> Cetak Label
                            </button>
                          </div>
                        </td>

                        {/* Category & Location */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium inline-block mb-1">
                            {item.category}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location}
                          </span>
                        </td>

                        {/* Stock & Min */}
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-bold text-slate-900 block font-mono">
                            {item.quantity}{' '}
                            <span className="text-xs font-normal text-slate-500 font-sans">
                              {item.unit}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400">
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
                              onClick={() => onDeleteItem(item.id)}
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
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[11px] text-indigo-700 font-mono font-semibold">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.quantity === 0
                          ? 'bg-rose-600 text-white'
                          : item.quantity <= item.minStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.quantity === 0
                        ? 'HABIS'
                        : `${item.quantity} ${item.unit}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Lokasi: {item.location}</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatRupiah(item.unitPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onStockIn(item)}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold"
                    >
                      + Masuk
                    </button>
                    <button
                      onClick={() => onStockOut(item)}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold"
                    >
                      - Keluar
                    </button>
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
