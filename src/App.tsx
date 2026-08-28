/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, InventoryItem, Transaction, TransactionType, WarehouseAnalytics, ReferenceItem } from './types';
import { api } from './services/api';
import { firestoreService } from './services/firebase';
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
import { Trash2, AlertTriangle, CheckCircle2, Info, X, Package } from 'lucide-react';

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
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('IN');
  const [txModalItem, setTxModalItem] = useState<InventoryItem | null>(null);

  const [isBarcodeGenOpen, setIsBarcodeGenOpen] = useState<boolean>(false);
  const [barcodeGenItem, setBarcodeGenItem] = useState<InventoryItem | null>(null);

  const [isQuickScanOpen, setIsQuickScanOpen] = useState<boolean>(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

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

  // Initial load and real-time Firebase Firestore synchronization
  useEffect(() => {
    loadData();

    // Set up real-time listener for Firestore Inventory
    const unsubscribeInventory = firestoreService.subscribeInventory((liveItems) => {
      if (Array.isArray(liveItems)) {
        setItems(liveItems);
        localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(liveItems));
      }
    });

    // Set up real-time listener for Firestore Transactions
    const unsubscribeTransactions = firestoreService.subscribeTransactions((liveTxs) => {
      if (Array.isArray(liveTxs)) {
        setTransactions(liveTxs);
        localStorage.setItem(LOCAL_STORAGE_TXS_KEY, JSON.stringify(liveTxs));
      }
    });

    // Periodic backup sync every 30s
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      unsubscribeInventory();
      unsubscribeTransactions();
      clearInterval(interval);
    };
  }, [loadData]);

  // Derive categories list
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  // Low stock items list for notifications
  const lowStockItems = items.filter((i) => i.quantity <= i.minStock);

  // Handlers
  const handleSaveNewItem = async (itemData: Partial<InventoryItem>) => {
    try {
      const newItem = await api.createItem(itemData);
      setItems((prev) => {
        const next = [newItem, ...prev];
        localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(next));
        return next;
      });
      setIsAddItemOpen(false);
      setSelectedReferenceForNew(null);
      showToast(`Barang baru "${newItem.name}" (${newItem.sku}) berhasil didaftarkan!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan barang', 'error');
      throw err;
    }
  };

  const handleUpdateItem = async (itemData: Partial<InventoryItem>) => {
    if (!editingItem) return;
    try {
      const updated = await api.updateItem(editingItem.id, itemData);
      setItems((prev) => {
        const next = prev.map((i) => (i.id === updated.id ? updated : i));
        localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(next));
        return next;
      });
      setEditingItem(null);
      showToast(`Perubahan pada "${updated.name}" (${updated.sku}) berhasil disimpan!`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan barang', 'error');
      throw err;
    }
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteItem(itemToDelete.id);
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== itemToDelete.id);
        localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(next));
        return next;
      });
      showToast(`Barang "${itemToDelete.name}" (${itemToDelete.sku}) berhasil dihapus dari Master Inventory.`, 'success');
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus barang dari server', 'error');
    } finally {
      setIsDeleting(false);
    }
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
              onDeleteItem={(item) => {
                setItemToDelete(item);
              }}
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
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
                        className="w-full py-2 bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                const existing = items.find(
                  (i) => i.sku === refItem.code || (refItem.barcode && i.barcode === refItem.barcode)
                );
                if (existing) {
                  setTxModalType('IN');
                  setTxModalItem(existing);
                  setIsTxModalOpen(true);
                } else {
                  setSelectedReferenceForNew(refItem);
                  setIsAddItemOpen(true);
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

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Barang dari Master Inventory?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data barang ini akan dihapus dari daftar master inventaris gudang aktif.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 text-sm">{itemToDelete.name}</div>
              <div className="grid grid-cols-2 gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                <div>
                  SKU: <strong className="text-indigo-600">{itemToDelete.sku}</strong>
                </div>
                <div>
                  Barcode: <strong>{itemToDelete.barcode}</strong>
                </div>
                <div>
                  Stok Saat Ini: <strong className="text-slate-800">{itemToDelete.quantity} {itemToDelete.unit}</strong>
                </div>
                <div>
                  Lokasi: <strong className="text-slate-800">{itemToDelete.location}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-4.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Barang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <ItemFormModal
          categories={categories}
          initialReferenceItem={selectedReferenceForNew}
          onSave={handleSaveNewItem}
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

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-indigo-900 text-white border-indigo-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-300 shrink-0" />}
            <span className="max-w-xs">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/60 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
