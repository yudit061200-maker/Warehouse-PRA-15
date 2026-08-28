import React, { useState } from 'react';
import { InventoryItem, TransactionType } from '../types';
import { CameraScanner } from './CameraScanner';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickScanModalProps {
  items: InventoryItem[];
  onClose: () => void;
  onStockInItem: (item: InventoryItem) => void;
  onStockOutItem: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem) => void;
  onQuickMutate: (itemId: string, type: TransactionType, qty: number) => Promise<void>;
}

export const QuickScanModal: React.FC<QuickScanModalProps> = ({
  items,
  onClose,
  onQuickMutate,
}) => {
  const [foundItem, setFoundItem] = useState<InventoryItem | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleScan = (code: string) => {
    const trimmed = code.trim();
    const item = items.find(
      (i) =>
        i.barcode === trimmed ||
        i.barcode === code ||
        i.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (item) {
      setFoundItem(item);
      setNotFoundCode(null);
      setMessage(null);
    } else {
      setFoundItem(null);
      setNotFoundCode(trimmed);
    }
  };

  const handleQuickMutate = async (type: TransactionType) => {
    if (!foundItem) return;
    try {
      setIsProcessing(true);
      await onQuickMutate(foundItem.id, type, quickQty);
      try {
        confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
      } catch (e) {}
      setMessage(
        `Berhasil mencatat ${
          type === 'IN' ? 'Pemasukan' : 'Pengeluaran'
        } ${quickQty} ${foundItem.unit}!`
      );
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentItem = foundItem
    ? items.find((i) => i.id === foundItem.id) || foundItem
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <h3 className="text-sm font-bold text-slate-900">
            Pemindai Barcode Cepat
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <CameraScanner onScanSuccess={handleScan} />

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {notFoundCode && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Barcode / SKU "{notFoundCode}" tidak ditemukan di master inventory.
              </span>
            </div>
          )}

          {currentItem && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {currentItem.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    SKU: {currentItem.sku} • {currentItem.location}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                    currentItem.quantity === 0
                      ? 'bg-rose-100 text-rose-800'
                      : currentItem.quantity <= currentItem.minStock
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Stok: {currentItem.quantity} {currentItem.unit}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                <div className="flex items-center gap-1">
                  {[1, 5, 10].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setQuickQty(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        quickQty === amt
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => handleQuickMutate('IN')}
                    disabled={isProcessing}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> + Masuk
                  </button>
                  <button
                    onClick={() => handleQuickMutate('OUT')}
                    disabled={isProcessing || currentItem.quantity < quickQty}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> - Keluar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
