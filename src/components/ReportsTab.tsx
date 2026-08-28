import React, { useState, useMemo } from 'react';
import { InventoryItem, Transaction } from '../types';
import { formatDateTime } from '../utils/formatters';
import {
  exportInventoryToExcel,
  exportInventoryToPDF,
  exportTransactionsToExcel,
  exportTransactionsToPDF,
} from '../utils/exporter';
import {
  FileSpreadsheet,
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

interface ReportsTabProps {
  items: InventoryItem[];
  transactions: Transaction[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ items, transactions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;

      // Date
      if (dateRange !== 'all') {
        const txDate = new Date(tx.timestamp);
        const now = new Date();
        if (dateRange === 'today') {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (txDate < sevenDaysAgo) return false;
        } else if (dateRange === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (txDate < thirtyDaysAgo) return false;
        }
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.itemName.toLowerCase().includes(q) ||
          tx.itemSku.toLowerCase().includes(q) ||
          tx.referenceNumber.toLowerCase().includes(q) ||
          tx.partner.toLowerCase().includes(q) ||
          tx.operator.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [transactions, selectedType, dateRange, searchQuery]);

  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.quantity <= i.minStock);
  }, [items]);

  const totalInQty = filteredTransactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalOutQty = filteredTransactions
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner with Quick Export Hub */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">
            Pusat Laporan & Ekspor Data Gudang
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Ekspor rekapitulasi data inventaris dan riwayat transaksi ke format Excel (.xlsx) atau PDF resmi
          </p>
        </div>

        {/* 3 Quick Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Master Inventory Export */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Laporan Master Stok</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                  {items.length} Item
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Daftar semua stok, lokasi rak, harga satuan, dan valuasi aset gudang.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => exportInventoryToExcel(items, 'Laporan_Master_Stok')}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={() =>
                  exportInventoryToPDF(
                    items,
                    'Laporan Status Stok & Valuasi Inventaris'
                  )
                }
                className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Card 2: Transactions Export */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">Laporan Mutasi Transaksi</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {filteredTransactions.length} Log
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Rekam jejak keluar/masuk barang, nomor surat jalan/PO, dan staf operator.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() =>
                  exportTransactionsToExcel(
                    filteredTransactions,
                    'Laporan_Mutasi_Transaksi'
                  )
                }
                className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={() =>
                  exportTransactionsToPDF(
                    filteredTransactions,
                    'Laporan Rekap Mutasi Barang'
                  )
                }
                className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Card 3: Low Stock Re-order Report */}
          <div className="p-5 rounded-2xl border border-rose-200/80 bg-rose-50/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-900">Laporan Restock Minimum</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                  {lowStockItems.length} Item
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Daftar barang di bawah ambang batas minimum untuk pengajuan restock.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() =>
                  exportInventoryToExcel(
                    lowStockItems,
                    'Laporan_Pengadaan_Restock'
                  )
                }
                disabled={lowStockItems.length === 0}
                className="flex-1 py-2 px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                onClick={() =>
                  exportInventoryToPDF(
                    lowStockItems,
                    'Laporan Kebutuhan Pengadaan & Restock Stok'
                  )
                }
                disabled={lowStockItems.length === 0}
                className="flex-1 py-2 px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Log Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. PO, SKU, Barang, Petugas..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Mutasi (IN & OUT)</option>
              <option value="IN">Barang Masuk Saja (IN)</option>
              <option value="OUT">Barang Keluar Saja (OUT)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: '30days', label: '30 Hari' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as any)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                  dateRange === d.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Movement Summary Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl text-xs gap-2">
          <span className="text-slate-600 font-medium">
            Menampilkan <strong>{filteredTransactions.length}</strong> catatan transaksi
          </span>
          <div className="flex items-center gap-4 font-mono">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Masuk: +{totalInQty}
            </span>
            <span className="text-rose-700 font-bold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Keluar: -{totalOutQty}
            </span>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-3.5">Waktu & Ref</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3.5">Barang & SKU</th>
                <th className="py-3 px-3.5 text-center">Jumlah</th>
                <th className="py-3 px-3.5 text-center">Mutasi Stok</th>
                <th className="py-3 px-3.5">Mitra / Penerima</th>
                <th className="py-3 px-3.5">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Time & Ref */}
                    <td className="py-3 px-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-900 block">
                        {tx.referenceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(tx.timestamp)}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          tx.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.type === 'IN' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {tx.type === 'IN' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>

                    {/* Item */}
                    <td className="py-3 px-3.5 max-w-xs">
                      <span className="font-semibold text-slate-900 block truncate">
                        {tx.itemName}
                      </span>
                      <span className="text-[10px] text-indigo-700 font-mono font-bold">
                        SKU: {tx.itemSku}
                      </span>
                    </td>

                    {/* Qty */}
                    <td className="py-3 px-3.5 text-center font-mono">
                      <span
                        className={`font-bold text-xs ${
                          tx.type === 'IN'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>

                    {/* Prev -> New */}
                    <td className="py-3 px-3.5 text-center font-mono text-[11px] text-slate-500">
                      {tx.previousStock} → <strong className="text-slate-900">{tx.newStock}</strong>
                    </td>

                    {/* Partner */}
                    <td className="py-3 px-3.5 text-slate-700 text-xs truncate max-w-[150px]">
                      {tx.partner}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3.5 text-slate-500 text-xs">
                      {tx.operator}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
