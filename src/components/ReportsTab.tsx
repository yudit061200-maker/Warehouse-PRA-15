import React, { useState, useMemo } from 'react';
import { InventoryItem, Transaction } from '../types';
import { formatDateTime, formatRupiah } from '../utils/formatters';
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
  Printer,
  QrCode,
  Calendar,
  Layers,
  AlertTriangle,
  Package,
  Boxes,
  Truck,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';

interface ReportsTabProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onPrintQRCode?: (item: InventoryItem) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
}

type ReportSection = 'INBOUND' | 'OUTBOUND' | 'ALL' | 'RESTOCK';

export const ReportsTab: React.FC<ReportsTabProps> = ({
  items,
  transactions,
  onPrintQRCode,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [activeSection, setActiveSection] = useState<ReportSection>('INBOUND');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');

  // Filter transactions based on date and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Date filter
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

      // Search filter
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
  }, [transactions, dateRange, searchQuery]);

  // Inbound and Outbound lists
  const inboundList = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'IN'),
    [filteredTransactions]
  );

  const outboundList = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'OUT'),
    [filteredTransactions]
  );

  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.quantity <= i.minStock);
  }, [items]);

  // Statistics
  const totalInQty = inboundList.reduce((sum, t) => sum + t.quantity, 0);
  const totalOutQty = outboundList.reduce((sum, t) => sum + t.quantity, 0);
  const totalInValue = inboundList.reduce((sum, t) => sum + t.quantity * (t.unitCost || 0), 0);
  const totalOutValue = outboundList.reduce((sum, t) => sum + t.quantity * (t.unitCost || 0), 0);

  const handlePrintQRForItem = (txItemSku: string, txItemName: string) => {
    if (!onPrintQRCode) return;
    const found = items.find((i) => i.sku === txItemSku || i.name === txItemName);
    if (found) {
      onPrintQRCode(found);
    } else {
      // Fallback item object
      onPrintQRCode({
        id: txItemSku,
        sku: txItemSku,
        barcode: txItemSku,
        name: txItemName,
        category: 'Umum',
        quantity: 0,
        minStock: 0,
        unit: 'pcs',
        unitPrice: 0,
        location: 'Gudang',
        createdAt: '',
        lastUpdated: '',
      });
    }
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Banner with Summary & Global Exports */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Laporan Terstruktur & Mutasi Gudang</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Pantau laporan terpisah barang masuk, barang keluar, dan cetak label QR untuk restock maupun pengiriman
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() =>
                exportTransactionsToExcel(
                  activeSection === 'INBOUND'
                    ? inboundList
                    : activeSection === 'OUTBOUND'
                    ? outboundList
                    : filteredTransactions,
                  `Laporan_${activeSection}_${new Date().toISOString().slice(0, 10)}`
                )
              }
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={() =>
                exportTransactionsToPDF(
                  activeSection === 'INBOUND'
                    ? inboundList
                    : activeSection === 'OUTBOUND'
                    ? outboundList
                    : filteredTransactions,
                  activeSection === 'INBOUND'
                    ? 'Laporan Barang Masuk (Inbound)'
                    : activeSection === 'OUTBOUND'
                    ? 'Laporan Barang Keluar (Outbound)'
                    : 'Laporan Rekapitulasi Mutasi Gudang'
                )
              }
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {/* Section Tabs Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveSection('INBOUND')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeSection === 'INBOUND'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                Laporan Masuk (Inbound)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                +{totalInQty}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {inboundList.length} transaksi penerimaan supplier
            </p>
          </button>

          <button
            onClick={() => setActiveSection('OUTBOUND')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeSection === 'OUTBOUND'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 text-rose-950 shadow-xs'
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                Laporan Keluar (Outbound)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                -{totalOutQty}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {outboundList.length} transaksi pengiriman / divisi
            </p>
          </button>

          <button
            onClick={() => setActiveSection('ALL')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeSection === 'ALL'
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Semua Mutasi
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                {filteredTransactions.length} Log
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Audit jejak keluar-masuk lengkap
            </p>
          </button>

          <button
            onClick={() => setActiveSection('RESTOCK')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              activeSection === 'RESTOCK'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 text-amber-950 shadow-xs'
                : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Perlu Restock
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {lowStockItems.length} Item
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Stok di bawah batas minimum
            </p>
          </button>
        </div>
      </div>

      {/* Filter and Content Area */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Date Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. PO/DO, SKU, Nama Barang, Mitra, Petugas..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
            {[
              { id: 'all', label: 'Semua Waktu' },
              { id: 'today', label: 'Hari Ini' },
              { id: '7days', label: '7 Hari' },
              { id: '30days', label: '30 Hari' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as any)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
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

        {/* ========================================================================= */}
        {/* VIEW 1: LAPORAN BARANG MASUK (INBOUND) */}
        {/* ========================================================================= */}
        {activeSection === 'INBOUND' && (
          <div className="space-y-4">
            {/* Stat Pill */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 text-xs">
              <div>
                <span className="text-emerald-800 text-[11px] block font-medium">Total Barang Diterima</span>
                <span className="text-lg font-bold text-emerald-950 font-mono">
                  +{totalInQty} <span className="text-xs font-normal text-emerald-700 font-sans">Unit</span>
                </span>
              </div>
              <div>
                <span className="text-emerald-800 text-[11px] block font-medium">Jumlah Transaksi Masuk</span>
                <span className="text-lg font-bold text-emerald-950 font-mono">
                  {inboundList.length} <span className="text-xs font-normal text-emerald-700 font-sans">PO / Batch</span>
                </span>
              </div>
              <div>
                <span className="text-emerald-800 text-[11px] block font-medium">Total Estimasi Valuasi Masuk</span>
                <span className="text-lg font-bold text-emerald-950 font-mono">
                  {formatRupiah(totalInValue)}
                </span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Waktu & No. PO/Ref</th>
                    <th className="py-3 px-4">Barang & SKU</th>
                    <th className="py-3 px-4">Pemasok / Supplier</th>
                    <th className="py-3 px-4 text-center">Jumlah Masuk</th>
                    <th className="py-3 px-4 text-center">Stok Akhir</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-right">Aksi & Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inboundList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Tidak ada catatan barang masuk pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    inboundList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Time & Ref */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-emerald-800 block">
                            {tx.referenceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(tx.timestamp)}
                          </span>
                        </td>

                        {/* Item */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 block truncate">
                            {tx.itemName}
                          </span>
                          <span className="text-[11px] text-indigo-700 font-mono font-bold">
                            SKU: {tx.itemSku}
                          </span>
                        </td>

                        {/* Supplier */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] inline-block">
                            {tx.partner || 'Supplier Rekanan'}
                          </span>
                        </td>

                        {/* Qty In */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                            +{tx.quantity}
                          </span>
                        </td>

                        {/* Stock Transition */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span className="text-slate-400">{tx.previousStock}</span>
                          <span className="text-slate-300 mx-1">→</span>
                          <strong className="text-slate-900">{tx.newStock}</strong>
                        </td>

                        {/* Operator */}
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          {tx.operator}
                        </td>

                        {/* Actions (Edit, Delete, QR) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onEditTransaction && (
                              <button
                                onClick={() => onEditTransaction(tx)}
                                title="Edit Laporan Masuk Ini"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            {onDeleteTransaction && (
                              <button
                                onClick={() => onDeleteTransaction(tx)}
                                title="Hapus Laporan Masuk Ini"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintQRForItem(tx.itemSku, tx.itemName)}
                              title="Cetak Label QR Barang Ini"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Inbound Cards */}
            <div className="md:hidden divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {inboundList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 p-4 text-xs">
                  Tidak ada catatan barang masuk.
                </div>
              ) : (
                inboundList.map((tx) => (
                  <div key={tx.id} className="p-3.5 space-y-2.5 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-800 block">
                          {tx.referenceNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">{tx.itemName}</h4>
                        <span className="text-[10px] text-indigo-700 font-mono font-bold">
                          SKU: {tx.itemSku}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs font-mono">
                        +{tx.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Pemasok:</span>
                        <span className="font-semibold text-slate-800">{tx.partner}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Stok Transisi:</span>
                        <span className="font-mono">{tx.previousStock} → <strong>{tx.newStock}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(tx.timestamp)}</span>
                      <div className="flex items-center gap-1.5">
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            onClick={() => onDeleteTransaction(tx)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintQRForItem(tx.itemSku, tx.itemName)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" /> QR
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LAPORAN BARANG KELUAR (OUTBOUND) */}
        {/* ========================================================================= */}
        {activeSection === 'OUTBOUND' && (
          <div className="space-y-4">
            {/* Stat Pill */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-200/70 text-xs">
              <div>
                <span className="text-rose-800 text-[11px] block font-medium">Total Barang Keluar</span>
                <span className="text-lg font-bold text-rose-950 font-mono">
                  -{totalOutQty} <span className="text-xs font-normal text-rose-700 font-sans">Unit</span>
                </span>
              </div>
              <div>
                <span className="text-rose-800 text-[11px] block font-medium">Jumlah Transaksi Keluar</span>
                <span className="text-lg font-bold text-rose-950 font-mono">
                  {outboundList.length} <span className="text-xs font-normal text-rose-700 font-sans">DO / Pengiriman</span>
                </span>
              </div>
              <div>
                <span className="text-rose-800 text-[11px] block font-medium">Total Valuasi Pengeluaran</span>
                <span className="text-lg font-bold text-rose-950 font-mono">
                  {formatRupiah(totalOutValue)}
                </span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Waktu & No. DO/Ref</th>
                    <th className="py-3 px-4">Barang & SKU</th>
                    <th className="py-3 px-4">Tujuan / Penerima</th>
                    <th className="py-3 px-4 text-center">Jumlah Keluar</th>
                    <th className="py-3 px-4 text-center">Sisa Stok</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-right">Aksi & Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {outboundList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Tidak ada catatan barang keluar pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    outboundList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Time & Ref */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-bold text-rose-800 block">
                            {tx.referenceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDateTime(tx.timestamp)}
                          </span>
                        </td>

                        {/* Item */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="font-semibold text-slate-900 block truncate">
                            {tx.itemName}
                          </span>
                          <span className="text-[11px] text-indigo-700 font-mono font-bold">
                            SKU: {tx.itemSku}
                          </span>
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] inline-block">
                            {tx.partner || 'Divisi / Pelanggan'}
                          </span>
                        </td>

                        {/* Qty Out */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">
                            -{tx.quantity}
                          </span>
                        </td>

                        {/* Stock Transition */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs">
                          <span className="text-slate-400">{tx.previousStock}</span>
                          <span className="text-slate-300 mx-1">→</span>
                          <strong className="text-slate-900">{tx.newStock}</strong>
                        </td>

                        {/* Operator */}
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          {tx.operator}
                        </td>

                        {/* Actions (Edit, Delete, QR) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onEditTransaction && (
                              <button
                                onClick={() => onEditTransaction(tx)}
                                title="Edit Laporan Keluar Ini"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            {onDeleteTransaction && (
                              <button
                                onClick={() => onDeleteTransaction(tx)}
                                title="Hapus Laporan Keluar Ini"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                            <button
                              onClick={() => handlePrintQRForItem(tx.itemSku, tx.itemName)}
                              title="Cetak Label QR Pengiriman"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Outbound Cards */}
            <div className="md:hidden divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {outboundList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 p-4 text-xs">
                  Tidak ada catatan barang keluar.
                </div>
              ) : (
                outboundList.map((tx) => (
                  <div key={tx.id} className="p-3.5 space-y-2.5 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-rose-800 block">
                          {tx.referenceNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">{tx.itemName}</h4>
                        <span className="text-[10px] text-indigo-700 font-mono font-bold">
                          SKU: {tx.itemSku}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs font-mono">
                        -{tx.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Tujuan / Penerima:</span>
                        <span className="font-semibold text-slate-800">{tx.partner}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Sisa Stok:</span>
                        <span className="font-mono">{tx.previousStock} → <strong>{tx.newStock}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(tx.timestamp)}</span>
                      <div className="flex items-center gap-1.5">
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            onClick={() => onDeleteTransaction(tx)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintQRForItem(tx.itemSku, tx.itemName)}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" /> QR
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: SEMUA REKAPITULASI MUTASI */}
        {/* ========================================================================= */}
        {activeSection === 'ALL' && (
          <div className="space-y-4">
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Waktu & Ref</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Barang & SKU</th>
                    <th className="py-3 px-4 text-center">Jumlah</th>
                    <th className="py-3 px-4 text-center">Mutasi Stok</th>
                    <th className="py-3 px-4">Mitra / Partner</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data transaksi.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{tx.referenceNumber}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(tx.timestamp)}</span>
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block truncate">{tx.itemName}</span>
                          <span className="text-[10px] text-indigo-700 font-mono font-bold">SKU: {tx.itemSku}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span className={tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs">
                          {tx.previousStock} → <strong>{tx.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-xs">{tx.partner}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{tx.operator}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onEditTransaction && (
                              <button
                                onClick={() => onEditTransaction(tx)}
                                title="Edit Transaksi"
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteTransaction && (
                              <button
                                onClick={() => onDeleteTransaction(tx)}
                                title="Hapus Transaksi"
                                className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile All Cards */}
            <div className="md:hidden divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-3 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800">{tx.referenceNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{tx.itemName}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{tx.partner} ({tx.operator})</span>
                    <span>{formatDateTime(tx.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                    {onEditTransaction && (
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="px-2 py-0.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                    {onDeleteTransaction && (
                      <button
                        onClick={() => onDeleteTransaction(tx)}
                        className="px-2 py-0.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: LAPORAN KEBUTUHAN RESTOCK */}
        {/* ========================================================================= */}
        {activeSection === 'RESTOCK' && (
          <div className="space-y-4">
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Barang & SKU</th>
                    <th className="py-3 px-4">Kategori & Lokasi</th>
                    <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                    <th className="py-3 px-4 text-center">Batas Min</th>
                    <th className="py-3 px-4 text-center">Defisit Restock</th>
                    <th className="py-3 px-4">Supplier Rekanan</th>
                    <th className="py-3 px-4 text-right">Label QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        Semua stok barang dalam kondisi aman di atas batas minimum.
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((it) => {
                      const deficit = Math.max(0, it.minStock - it.quantity);
                      return (
                        <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{it.name}</span>
                            <span className="text-[11px] text-indigo-700 font-mono font-bold">SKU: {it.sku}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium block w-fit mb-0.5">
                              {it.category}
                            </span>
                            <span className="text-[11px] text-slate-500">{it.location}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span className={it.quantity === 0 ? 'text-rose-600' : 'text-amber-600'}>
                              {it.quantity} {it.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                            {it.minStock} {it.unit}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
                              +{deficit > 0 ? deficit : 1} {it.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs">{it.supplier || '-'}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => onPrintQRCode && onPrintQRCode(it)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>Cetak QR</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Restock Cards */}
            <div className="md:hidden divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {lowStockItems.map((it) => (
                <div key={it.id} className="p-3 bg-white space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{it.name}</h4>
                      <span className="text-[10px] text-indigo-700 font-mono font-bold">SKU: {it.sku}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Sisa: {it.quantity} / Min: {it.minStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Supplier: {it.supplier || '-'}</span>
                    <button
                      onClick={() => onPrintQRCode && onPrintQRCode(it)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" /> Cetak QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
