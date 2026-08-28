/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, InventoryItem, Transaction, TransactionType, WarehouseAnalytics, ReferenceItem } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardTab } from './components/DashboardTab';
import { InventoryTab } from './components/InventoryTab';
import { StockInOutView } from './components/StockInOutView';
import { BarcodeScannerTab } from './components/BarcodeScannerTab';
import { ReportsTab } from './components/ReportsTab';
import { ReferenceCatalogTab } from './components/ReferenceCatalogTab';
import { BarcodeGeneratorModal } from './components/BarcodeGeneratorModal';
import { ItemFormModal } from './components/ItemFormModal';
import { TransactionModal } from './components/TransactionModal';
import { QuickScanModal } from './components/QuickScanModal';

const LOCAL_STORAGE_ITEMS_KEY = 'gudangpro_inventory_items_cache';
const LOCAL_STORAGE_TXS_KEY = 'gudangpro_transactions_cache';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_TXS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [analytics, setAnalytics] = useState<WarehouseAnalytics | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [selectedReferenceForNew, setSelectedReferenceForNew] = useState<ReferenceItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('IN');
  const [txModalItem, setTxModalItem] = useState<InventoryItem | null>(null);

  const [isBarcodeGenOpen, setIsBarcodeGenOpen] = useState<boolean>(false);
  const [barcodeGenItem, setBarcodeGenItem] = useState<InventoryItem | null>(null);

  const [isQuickScanOpen, setIsQuickScanOpen] = useState<boolean>(false);

  // Fetch all cloud data
  const loadData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const [fetchedItems, fetchedTransactions, fetchedAnalytics] = await Promise.all([
        api.getInventory(),
        api.getTransactions(),
        api.getAnalytics(),
      ]);

      setItems(fetchedItems);
      setTransactions(fetchedTransactions);
      setAnalytics(fetchedAnalytics);

      // Cache locally for offline resilience
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(fetchedItems));
      localStorage.setItem(LOCAL_STORAGE_TXS_KEY, JSON.stringify(fetchedTransactions));
    } catch (err) {
      console.warn('Real-time sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load and periodic background sync (every 15s)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derive categories list
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  // Low stock items list for notifications
  const lowStockItems = items.filter((i) => i.quantity <= i.minStock);

  // Handlers
  const handleSaveNewItem = async (itemData: Partial<InventoryItem>) => {
    const newItem = await api.createItem(itemData);
    setItems((prev) => [newItem, ...prev]);
    loadData();
  };

  const handleUpdateItem = async (itemData: Partial<InventoryItem>) => {
    if (!editingItem) return;
    const updated = await api.updateItem(editingItem.id, itemData);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    loadData();
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data barang ini dari inventory?')) return;
    await api.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    loadData();
  };

  const handleRecordTransaction = async (data: {
    itemId: string;
    type: TransactionType;
    quantity: number;
    referenceNumber?: string;
    partner?: string;
    notes?: string;
    operator?: string;
    unitCost?: number;
  }) => {
    const result = await api.recordTransaction(data);
    setItems((prev) =>
      prev.map((item) => (item.id === result.updatedItem.id ? result.updatedItem : item))
    );
    setTransactions((prev) => [result.transaction, ...prev]);
    loadData();
  };

  const handleQuickMutate = async (itemId: string, type: TransactionType, qty: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    await handleRecordTransaction({
      itemId,
      type,
      quantity: qty,
      referenceNumber: `${type === 'IN' ? 'PO' : 'DO'}-SCAN-${Date.now().toString().slice(-6)}`,
      partner: type === 'IN' ? item.supplier || 'Pemasok' : 'Divisi Produksi / Toko',
      notes: 'Pencatatan cepat via Barcode Scanner',
      operator: 'Staf Barcode Scan',
      unitCost: item.unitPrice,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onNavigateTab={setActiveTab}
        lowStockItems={lowStockItems}
        isSyncing={isSyncing}
        onQuickScan={() => setIsQuickScanOpen(true)}
        onRefreshData={loadData}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-6">
        {/* Responsive Sidebar Navigation */}
        <Navigation
          activeTab={activeTab}
          onNavigateTab={setActiveTab}
          lowStockCount={lowStockItems.length}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Tab Views */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-full">
          {activeTab === 'dashboard' && (
            <DashboardTab
              analytics={analytics}
              items={items}
              transactions={transactions}
              onNavigateTab={setActiveTab}
              onOpenStockIn={() => {
                setTxModalType('IN');
                setTxModalItem(null);
                setIsTxModalOpen(true);
              }}
              onOpenStockOut={() => {
                setTxModalType('OUT');
                setTxModalItem(null);
                setIsTxModalOpen(true);
              }}
              onOpenAddItem={() => setIsAddItemOpen(true)}
              onOpenScanner={() => setActiveTab('scanner')}
              onOpenBarcodeGen={() => {
                setBarcodeGenItem(null);
                setIsBarcodeGenOpen(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              items={items}
              onAddItem={() => setIsAddItemOpen(true)}
              onEditItem={(item) => {
                setEditingItem(item);
              }}
              onDeleteItem={handleDeleteItem}
              onStockIn={(item) => {
                setTxModalType('IN');
                setTxModalItem(item);
                setIsTxModalOpen(true);
              }}
              onStockOut={(item) => {
                setTxModalType('OUT');
                setTxModalItem(item);
                setIsTxModalOpen(true);
              }}
              onPrintBarcode={(item) => {
                setBarcodeGenItem(item);
                setIsBarcodeGenOpen(true);
              }}
            />
          )}

          {(activeTab === 'stock-in' || activeTab === 'stock-out') && (
            <StockInOutView
              initialType={activeTab === 'stock-in' ? 'IN' : 'OUT'}
              items={items}
              transactions={transactions}
              onSubmitTransaction={handleRecordTransaction}
            />
          )}

          {activeTab === 'scanner' && (
            <BarcodeScannerTab
              items={items}
              onStockInItem={(item) => {
                setTxModalType('IN');
                setTxModalItem(item);
                setIsTxModalOpen(true);
              }}
              onStockOutItem={(item) => {
                setTxModalType('OUT');
                setTxModalItem(item);
                setIsTxModalOpen(true);
              }}
              onEditItem={(item) => setEditingItem(item)}
              onPrintBarcode={(item) => {
                setBarcodeGenItem(item);
                setIsBarcodeGenOpen(true);
              }}
              onQuickMutate={handleQuickMutate}
            />
          )}

          {activeTab === 'barcode-generator' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">
                    Generator & Cetak Label Barcode Gudang
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    Buat barcode otomatis format Code128 atau QR Code untuk ditempel pada barang, kardus, atau rak logistik.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBarcodeGenItem(null);
                    setIsBarcodeGenOpen(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0"
                >
                  Buka Studio Desain Barcode
                </button>
              </div>

              {/* Grid of existing items to print directly */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Label Barcode Barang Terdaftar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col justify-between space-y-3 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono font-semibold">
                            {item.location}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          SKU: {item.sku} • Barcode: {item.barcode}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setBarcodeGenItem(item);
                          setIsBarcodeGenOpen(true);
                        }}
                        className="w-full py-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        Pratinjau & Cetak Label
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reference-catalog' && (
            <ReferenceCatalogTab
              onUseForNewItem={(refItem) => {
                setSelectedReferenceForNew(refItem);
                setIsAddItemOpen(true);
              }}
              onQuickStockIn={(refItem) => {
                // Check if item already registered in inventory by SKU / barcode
                const existing = items.find(
                  (i) => i.sku === refItem.code || (refItem.barcode && i.barcode === refItem.barcode)
                );
                if (existing) {
                  setTxModalType('IN');
                  setTxModalItem(existing);
                  setIsTxModalOpen(true);
                } else {
                  // Prompt to register first with autofill
                  if (
                    window.confirm(
                      `Barang "${refItem.name}" (${refItem.code}) belum terdaftar di inventaris fisik aktif. Buka form pendaftaran dengan autofill sekarang?`
                    )
                  ) {
                    setSelectedReferenceForNew(refItem);
                    setIsAddItemOpen(true);
                  }
                }
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab items={items} transactions={transactions} />
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <ItemFormModal
          categories={categories}
          initialReferenceItem={selectedReferenceForNew}
          onSave={async (data) => {
            await handleSaveNewItem(data);
            setSelectedReferenceForNew(null);
          }}
          onClose={() => {
            setIsAddItemOpen(false);
            setSelectedReferenceForNew(null);
          }}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemFormModal
          item={editingItem}
          categories={categories}
          onSave={handleUpdateItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Stock In / Out Transaction Modal */}
      {isTxModalOpen && (
        <TransactionModal
          initialType={txModalType}
          selectedItem={txModalItem}
          items={items}
          onSubmit={handleRecordTransaction}
          onClose={() => {
            setIsTxModalOpen(false);
            setTxModalItem(null);
          }}
        />
      )}

      {/* Barcode Generator & Printing Modal */}
      {isBarcodeGenOpen && (
        <BarcodeGeneratorModal
          items={items}
          selectedItem={barcodeGenItem}
          onClose={() => {
            setIsBarcodeGenOpen(false);
            setBarcodeGenItem(null);
          }}
        />
      )}

      {/* Quick Scanner Popup Modal */}
      {isQuickScanOpen && (
        <QuickScanModal
          items={items}
          onClose={() => setIsQuickScanOpen(false)}
          onStockInItem={(item) => {
            setIsQuickScanOpen(false);
            setTxModalType('IN');
            setTxModalItem(item);
            setIsTxModalOpen(true);
          }}
          onStockOutItem={(item) => {
            setIsQuickScanOpen(false);
            setTxModalType('OUT');
            setTxModalItem(item);
            setIsTxModalOpen(true);
          }}
          onPrintBarcode={(item) => {
            setIsQuickScanOpen(false);
            setBarcodeGenItem(item);
            setIsBarcodeGenOpen(true);
          }}
          onQuickMutate={handleQuickMutate}
        />
      )}
    </div>
  );
}
