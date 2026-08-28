import React from 'react';
import { WarehouseAnalytics, Transaction, InventoryItem, ActiveTab } from '../types';
import { formatRupiah, formatNumber, formatDateTime } from '../utils/formatters';
import {
  Boxes,
  AlertTriangle,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardTabProps {
  analytics: WarehouseAnalytics | null;
  items: InventoryItem[];
  transactions: Transaction[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
  onOpenAddItem: () => void;
  onOpenScanner: () => void;
  onOpenBarcodeGen: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  analytics,
  items,
  transactions,
  onNavigateTab,
  onOpenStockIn,
  onOpenStockOut,
  onOpenScanner,
}) => {
  const lowStockCount = analytics?.lowStockItemsCount || 0;
  const outOfStockCount = analytics?.outOfStockItemsCount || 0;
  const trends = analytics?.trends || [];
  const fastMoving = analytics?.fastMoving || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner with Quick Actions: Modern Minimalist Dark Slate */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              <span>Pusat Kendali Inventaris & Pergudangan</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Dashboard Performa Gudang
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              Pantau mutasi barang masuk/keluar, notifikasi stok kritis, dan valuasi aset secara real-time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenStockIn}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Barang Masuk</span>
            </button>
            <button
              onClick={onOpenStockOut}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- Barang Keluar</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
              <span>Pindai Barcode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-rose-900">
                Peringatan Stok Minimum: {lowStockCount} Item Perlu Perhatian Segera
              </h4>
              <p className="text-xs text-rose-700/90 mt-0.5">
                {outOfStockCount > 0 && `${outOfStockCount} item telah HABIS total. `}
                Segera buat purchase order (restock) untuk menjaga kelancaran operasional.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 self-start sm:self-center shadow-xs cursor-pointer"
          >
            Lihat Daftar Restock
          </button>
        </div>
      )}

      {/* 4 Minimalist Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Physical Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Stok Fisik
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 font-mono">
              {formatNumber(analytics?.totalStockQuantity || 0)}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Tercatat di <span className="font-semibold text-slate-700">{items.length} SKU</span> terdaftar
          </p>
        </div>

        {/* Total Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Valuasi Aset
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 font-mono">
              {formatRupiah(analytics?.totalValuation || 0)}
            </div>
          </div>
          <p className="text-xs text-emerald-700 mt-2 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Nilai akumulasi total gudang
          </p>
        </div>

        {/* Today's Inbound / Outbound */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mutasi Hari Ini
              </span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 font-mono">
              <div className="text-emerald-600">
                <span className="text-[10px] text-slate-400 block font-sans font-medium leading-none">
                  Masuk
                </span>
                <span className="text-xl font-bold">+{analytics?.todayInQuantity || 0}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-rose-600">
                <span className="text-[10px] text-slate-400 block font-sans font-medium leading-none">
                  Keluar
                </span>
                <span className="text-xl font-bold">-{analytics?.todayOutQuantity || 0}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {analytics?.todayTransactionsCount || 0} mutasi tercatat
          </p>
        </div>

        {/* Stock Alert / Status Card */}
        <div
          className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
            lowStockCount > 0
              ? 'bg-rose-50/50 border-rose-200/80'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Stok Kritis
              </span>
              <div
                className={`p-2 rounded-xl ${
                  lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-bold tracking-tight mt-2 font-mono ${
                lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {lowStockCount} <span className="text-xs font-normal text-slate-500 font-sans">SKU</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {outOfStockCount > 0 ? `${outOfStockCount} barang kosong total` : 'Semua stok dalam batas aman'}
          </p>
        </div>
      </div>

      {/* Google Sheets Reference Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Pedoman Data Acuan & Autofill (Google Sheets)
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                Tersinkron
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Gunakan data acuan dari spreadsheet untuk mengisi form pendaftaran barang baru & transaksi secara otomatis tanpa menghitung stok fisik sebelum terdaftar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('reference-catalog')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Buka Katalog Pedoman</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Analytics Charts & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Volume Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Aktivitas Mingguan (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500">
                Volume perbandingan barang masuk (Inbound) vs barang keluar (Outbound)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Masuk
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Keluar
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${formatNumber(Number(value))} Unit`,
                    name === 'inQty' ? 'Barang Masuk' : 'Barang Keluar',
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="inQty" fill="#10b981" radius={[4, 4, 0, 0]} name="inQty" />
                <Bar dataKey="outQty" fill="#ef4444" radius={[4, 4, 0, 0]} name="outQty" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Barcode Scanner Card */}
        <div className="bg-slate-900 text-white rounded-2xl shadow-xs border border-slate-800 p-6 flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400">
            <Barcode className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Pemindai Barcode Cepat</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              Gunakan kamera ponsel atau pemindai laser USB untuk input mutasi masuk dan keluar secara instan.
            </p>
          </div>

          <div className="w-full bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-2">
              <span>Sensor Status</span>
              <span className="text-emerald-400">● Aktif</span>
            </div>
            <div className="h-6 flex items-center justify-center space-x-1 opacity-70">
              <div className="w-1 h-full bg-slate-300"></div>
              <div className="w-2 h-full bg-slate-300"></div>
              <div className="w-1 h-full bg-slate-300"></div>
              <div className="w-3 h-full bg-slate-300"></div>
              <div className="w-1 h-full bg-slate-300"></div>
              <div className="w-2 h-full bg-slate-300"></div>
              <div className="w-1 h-full bg-slate-300"></div>
            </div>
          </div>

          <button
            onClick={onOpenScanner}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Buka Pemindai Barcode
          </button>
        </div>
      </div>

      {/* 2 Bottom Columns: Fast-Moving Items & Recent Transaction Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Fast-Moving Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Fast-Moving Inventory
              </h3>
              <p className="text-xs text-slate-500">Barang paling aktif keluar dari gudang</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Laporan <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {fastMoving.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada data barang keluar yang cukup.
              </p>
            ) : (
              fastMoving.map((item) => (
                <div
                  key={item.itemId}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.sku} • Sisa Stok: {item.currentStock}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-bold rounded-md">
                      Keluar: {item.outQty} Unit
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, item.turnoverRatio)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Log Mutasi Terkini
              </h3>
              <p className="text-xs text-slate-500">Riwayat pencatatan barang masuk & keluar</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Semua Log <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      tx.type === 'IN'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {tx.type === 'IN' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {tx.itemName}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {formatDateTime(tx.timestamp)} • Ref:{' '}
                      <span className="font-mono text-slate-700">{tx.referenceNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <span
                    className={`text-xs font-bold block ${
                      tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {tx.previousStock} → {tx.newStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
