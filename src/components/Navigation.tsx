import React from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownLeft,
  QrCode,
  Tag,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  onNavigateTab: (tab: ActiveTab) => void;
  lowStockCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onNavigateTab,
  lowStockCount,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'inventory',
      label: 'Master Barang',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : null,
    },
    {
      id: 'reference-catalog',
      label: 'Pedoman Data (Sheets)',
      icon: Sparkles,
      isHighlight: true,
    },
    { id: 'stock-in', label: 'Log Mutasi', icon: ArrowDownLeft },
    { id: 'scanner', label: 'Pemindai QR Code', icon: QrCode },
    { id: 'barcode-generator', label: 'Cetak Sheet QR Code', icon: Tag },
    { id: 'reports', label: 'Laporan & Ekspor', icon: FileSpreadsheet },
  ];

  const handleItemClick = (id: ActiveTab) => {
    onNavigateTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 bg-slate-950 text-slate-200 border-r border-slate-800/80 p-3.5 lg:p-4 space-y-5 lg:space-y-6 min-h-[calc(100vh-57px)]">
        {/* Brand Header */}
        <div className="px-2 py-2 border-b border-slate-800/80 flex items-center gap-2.5 lg:gap-3">
          <div className="w-7 h-7 lg:w-8 lg:h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 text-xs lg:text-sm">
            G
          </div>
          <div className="min-w-0">
            <h1 className="text-xs lg:text-sm font-bold tracking-tight text-white leading-tight truncate">
              GudangPro
            </h1>
            <p className="text-[9px] lg:text-[10px] text-slate-400 font-medium truncate">Inventory & QR System</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 space-y-1">
          <span className="px-2.5 text-[9px] lg:text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Menu Utama
          </span>
          <nav className="space-y-1 text-xs lg:text-sm text-slate-400">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'stock-in' && activeTab === 'stock-out');

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id as ActiveTab)}
                  className={`w-full flex items-center justify-between px-2.5 lg:px-3 py-2 lg:py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 lg:gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-indigo-400'
                          : item.isHighlight
                          ? 'text-indigo-400/80'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold shrink-0 ml-1">
                      {item.badge}
                    </span>
                  )}
                  {item.isHighlight && !item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status */}
        <div className="p-2.5 lg:p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[10px] lg:text-[11px] text-slate-400 font-mono truncate">Online Ready</span>
          </div>
          <span className="text-[9px] lg:text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
            v2.5
          </span>
        </div>
      </aside>

      {/* Mobile Slide-in Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
          />
          <div className="relative w-4/5 max-w-[280px] bg-slate-950 text-white h-full shadow-2xl p-4 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
                    G
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block leading-none">GudangPro</span>
                    <span className="text-[10px] text-slate-400">QR Inventory System</span>
                  </div>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 cursor-pointer"
                  aria-label="Tutup menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                Navigasi Menu
              </span>

              <nav className="space-y-1 text-xs text-slate-400">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id as ActiveTab)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-mono text-slate-300 text-[11px]">Sistem QR Aktif</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Fixed Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around text-slate-400 shadow-2xl">
        <button
          onClick={() => onNavigateTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-medium transition-colors min-h-[44px] cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => onNavigateTab('inventory')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-medium relative transition-colors min-h-[44px] cursor-pointer ${
            activeTab === 'inventory' ? 'text-indigo-400 font-bold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4 mb-0.5" />
          <span>Barang</span>
          {lowStockCount > 0 && (
            <span className="absolute top-1.5 right-1/4 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-950" />
          )}
        </button>

        <button
          onClick={() => onNavigateTab('scanner')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-medium transition-colors min-h-[44px] cursor-pointer ${
            activeTab === 'scanner' ? 'text-indigo-400 font-bold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4 mb-0.5" />
          <span>Scan QR</span>
        </button>

        <button
          onClick={() => onNavigateTab('stock-in')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-medium transition-colors min-h-[44px] cursor-pointer ${
            activeTab === 'stock-in' || activeTab === 'stock-out'
              ? 'text-indigo-400 font-bold bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 mb-0.5" />
          <span>Mutasi</span>
        </button>

        <button
          onClick={() => onNavigateTab('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-medium transition-colors min-h-[44px] cursor-pointer ${
            activeTab === 'reports' ? 'text-indigo-400 font-bold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span>Laporan</span>
        </button>
      </nav>
    </>
  );
};
