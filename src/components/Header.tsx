import React, { useState } from 'react';
import { ActiveTab, InventoryItem } from '../types';
import {
  Bell,
  Cloud,
  RefreshCw,
  Barcode,
  Menu,
  X,
  AlertTriangle,
  ChevronRight,
  Package,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onNavigateTab: (tab: ActiveTab) => void;
  lowStockItems: InventoryItem[];
  isSyncing: boolean;
  onQuickScan: () => void;
  onRefreshData: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigateTab,
  lowStockItems,
  isSyncing,
  onQuickScan,
  onRefreshData,
  onToggleMobileMenu,
}) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Performa';
      case 'inventory':
        return 'Master Inventory Barang';
      case 'reference-catalog':
        return 'Pedoman Data (Google Sheets)';
      case 'stock-in':
      case 'stock-out':
        return 'Log Mutasi Masuk & Keluar';
      case 'scanner':
        return 'Pemindai Barcode / Kamera';
      case 'barcode-generator':
        return 'Generator & Cetak Label';
      case 'reports':
        return 'Laporan & Ekspor Data';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 py-3 transition-all">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Mobile Menu Trigger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg md:hidden hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Clean Minimalist Breadcrumb */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span
              onClick={() => onNavigateTab('dashboard')}
              className="font-medium text-slate-400 hover:text-slate-700 cursor-pointer hidden sm:inline transition-colors"
            >
              Gudang
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-900 tracking-tight">
              {getBreadcrumbTitle()}
            </span>
          </div>
        </div>

        {/* Right: Cloud Sync Status, Barcode Trigger, Low Stock Indicator & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status Indicator */}
          <button
            onClick={onRefreshData}
            title="Klik untuk sinkronisasi data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span className="hidden md:inline">Sinkronisasi...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden md:inline">Tersinkron</span>
              </>
            )}
          </button>

          {/* Quick Barcode Scanner button */}
          <button
            onClick={onQuickScan}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Cepat</span>
          </button>

          {/* Low Stock Alert Bell & Badge */}
          <div className="relative">
            <button
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                lowStockItems.length > 0
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
              aria-label="Notifikasi Stok Minimum"
            >
              <Bell className="w-3.5 h-3.5" />
              {lowStockItems.length > 0 ? (
                <span className="flex items-center gap-1">
                  <span>{lowStockItems.length} Kritis</span>
                </span>
              ) : (
                <span className="hidden sm:inline">Aman</span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isAlertOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Peringatan Stok Kritis ({lowStockItems.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsAlertOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-2 max-h-72 overflow-y-auto space-y-2">
                  {lowStockItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      Semua stok barang berada dalam kuantitas aman.
                    </div>
                  ) : (
                    lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setIsAlertOpen(false);
                          onNavigateTab('inventory');
                        }}
                        className="p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 block line-clamp-1">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.sku} • {item.location}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.quantity === 0
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-200/80 text-rose-900'
                            }`}
                          >
                            {item.quantity === 0 ? 'HABIS' : `${item.quantity} ${item.unit}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-rose-700 mt-1 font-medium">
                          Batas minimum: {item.minStock} {item.unit}. Perlu restock segera.
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {lowStockItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsAlertOpen(false);
                        onNavigateTab('inventory');
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      Buka Tabel Inventory <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-bold text-xs text-slate-700">
              G
            </div>
            <span className="text-xs font-medium text-slate-700">Operator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
