import React, { useState } from 'react';
import { InventoryItem, TransactionType } from '../types';
import { CameraScanner } from './CameraScanner';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Boxes,
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
  const [detectedType, setDetectedType] = useState<'IN' | 'OUT' | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [qtyInputString, setQtyInputString] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleScan = (code: string) => {
    let cleanCode = code.trim();
    let detected: 'IN' | 'OUT' | null = null;
    if (cleanCode.startsWith('IN:')) {
      detected = 'IN';
      cleanCode = cleanCode.substring(3).trim();
    } else if (cleanCode.startsWith('OUT:')) {
      detected = 'OUT';
      cleanCode = cleanCode.substring(4).trim();
    }

    setDetectedType(detected);

    const item = items.find(
      (i) =>
        i.barcode === cleanCode ||
        i.barcode === code.trim() ||
        i.sku.toLowerCase() === cleanCode.toLowerCase() ||
        i.sku.toLowerCase() === code.trim().toLowerCase()
    );

    if (item) {
      setFoundItem(item);
      setNotFoundCode(null);
      setMessage(null);
    } else {
      setFoundItem(null);
      setNotFoundCode(code.trim());
    }
  };

  const handleQtyChange = (val: number | string) => {
    if (typeof val === 'string') {
      setQtyInputString(val);
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setQuickQty(parsed);
      }
    } else {
      const sanitized = Math.max(1, Math.floor(val));
      setQuickQty(sanitized);
      setQtyInputString(sanitized.toString());
    }
  };

  const handleQuickMutate = async (type: TransactionType) => {
    if (!foundItem) return;
    const qty = Math.max(1, quickQty || 1);

    if (type === 'OUT' && qty > foundItem.quantity) {
      alert(`Jumlah keluar (${qty} ${foundItem.unit}) melebihi stok yang tersedia (${foundItem.quantity} ${foundItem.unit})!`);
      return;
    }

    try {
      setIsProcessing(true);
      await onQuickMutate(foundItem.id, type, qty);
      try {
        confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
      } catch (e) {}
      setMessage(
        `Berhasil mencatat ${
          type === 'IN' ? 'Pemasukan' : 'Pengeluaran'
        } ${qty} ${foundItem.unit}!`
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

  const validQty = Math.max(1, quickQty || 1);
  const isOverStock = currentItem ? validQty > currentItem.quantity : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <h3 className="text-sm font-bold text-slate-900">
            Pemindai QR & Mutasi Cepat
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
                QR Code / SKU "{notFoundCode}" tidak ditemukan di master inventory.
              </span>
            </div>
          )}

          {currentItem && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              {detectedType && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    detectedType === 'IN'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span>
                    {detectedType === 'IN'
                      ? '🏷️ Label Masuk Terdeteksi (INBOUND)'
                      : '🏷️ Label Keluar Terdeteksi (OUTBOUND)'}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-white rounded border">
                    {detectedType === 'IN' ? '+ Masuk' : '- Keluar'}
                  </span>
                </div>
              )}

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

              {/* Manual Quantity Input */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Jumlah Mutasi (Manual):</span>
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {currentItem.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(Math.max(1, validQty - 1))}
                    disabled={validQty <= 1}
                    className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={qtyInputString}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    onBlur={() => {
                      if (!qtyInputString || parseInt(qtyInputString, 10) < 1) {
                        handleQtyChange(1);
                      }
                    }}
                    className="flex-1 text-center font-bold font-mono py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-sm text-slate-900"
                  />

                  <button
                    type="button"
                    onClick={() => handleQtyChange(validQty + 1)}
                    className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1">
                  {[1, 5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQtyChange(amt)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                        validQty === amt
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                  {currentItem.quantity > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQtyChange(currentItem.quantity)}
                      className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer ml-auto"
                    >
                      Semua ({currentItem.quantity})
                    </button>
                  )}
                </div>

                {isOverStock && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    ⚠️ Melebihi stok yang ada ({currentItem.quantity} {currentItem.unit})
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickMutate('IN')}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>+ Masuk ({validQty})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickMutate('OUT')}
                  disabled={isProcessing || isOverStock}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>- Keluar ({validQty})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
