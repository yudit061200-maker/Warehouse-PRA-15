import React, { useState } from 'react';
import { InventoryItem, TransactionType } from '../types';
import { CameraScanner } from './CameraScanner';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import {
  Barcode,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  History,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BarcodeScannerTabProps {
  items: InventoryItem[];
  onStockInItem: (item: InventoryItem) => void;
  onStockOutItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem) => void;
  onQuickMutate: (itemId: string, type: TransactionType, qty: number) => Promise<void>;
}

export const BarcodeScannerTab: React.FC<BarcodeScannerTabProps> = ({
  items,
  onEditItem,
  onPrintBarcode,
  onQuickMutate,
}) => {
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scanHistory, setScanHistory] = useState<{ item: InventoryItem; time: string }[]>([]);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleScanSuccess = (code: string) => {
    const trimmed = code.trim();
    const found = items.find(
      (i) =>
        i.barcode === trimmed ||
        i.barcode === code ||
        i.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      setScannedItem(found);
      setNotFoundCode(null);
      setScanHistory((prev) => [
        { item: found, time: new Date().toISOString() },
        ...prev.slice(0, 9),
      ]);
    } else {
      setScannedItem(null);
      setNotFoundCode(trimmed);
    }
  };

  const handleQuickAction = async (type: TransactionType, amount: number) => {
    if (!scannedItem) return;
    try {
      setIsProcessing(true);
      await onQuickMutate(scannedItem.id, type, amount);

      try {
        confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
      } catch (e) {}

      setSuccessToast(
        `Sukses: ${
          type === 'IN' ? 'Pemasukan' : 'Pengeluaran'
        } ${amount} ${scannedItem.unit} berhasil dicatat!`
      );
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentScannedItem = scannedItem
    ? items.find((i) => i.id === scannedItem.id) || scannedItem
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Title Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Barcode className="w-5 h-5 text-indigo-600" />
          <span>Pemindai Barcode & Aksi Cepat</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          Pindai barcode/QR code pada barang atau ketik SKU untuk melihat informasi dan melakukan mutasi instan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Scanner */}
        <div className="lg:col-span-6 space-y-4">
          <CameraScanner
            title="Kamera Pemindai Aktif"
            onScanSuccess={handleScanSuccess}
          />

          {notFoundCode && (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-800 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Barcode / SKU "{notFoundCode}" Belum Terdaftar</span>
              </div>
              <p className="text-rose-700 leading-relaxed">
                Barang dengan kode ini belum ada di master inventory. Anda dapat mendaftarkannya atau menggunakan menu Pedoman Data.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Scan Result & Quick Actions */}
        <div className="lg:col-span-6 space-y-4">
          {successToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {currentScannedItem ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] uppercase">
                    Hasil Pemindaian
                  </span>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1">
                    {currentScannedItem.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                    <span className="text-indigo-700 font-bold">SKU: {currentScannedItem.sku}</span>
                    <span>•</span>
                    <span>Barcode: {currentScannedItem.barcode}</span>
                  </div>
                </div>

                {/* Stock status badge */}
                {currentScannedItem.quantity === 0 ? (
                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
                    HABIS
                  </span>
                ) : currentScannedItem.quantity <= currentScannedItem.minStock ? (
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> MENIPIS
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                    AMAN
                  </span>
                )}
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Sisa Stok Fisik</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {currentScannedItem.quantity} <span className="text-xs font-normal text-slate-500 font-sans">{currentScannedItem.unit}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Lokasi Rak</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {currentScannedItem.location}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Harga Satuan</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">
                    {formatRupiah(currentScannedItem.unitPrice)}
                  </span>
                </div>
              </div>

              {/* Instant One-Click Stock Mutator */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Aksi Mutasi Cepat:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Jumlah:</span>
                    {[1, 5, 10, 25].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setQuickQty(amt)}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          quickQty === amt
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickAction('IN', quickQty)}
                    disabled={isProcessing}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    + Masuk ({quickQty} {currentScannedItem.unit})
                  </button>

                  <button
                    onClick={() => handleQuickAction('OUT', quickQty)}
                    disabled={isProcessing || currentScannedItem.quantity < quickQty}
                    className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    - Keluar ({quickQty} {currentScannedItem.unit})
                  </button>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => onPrintBarcode(currentScannedItem)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  Cetak Label
                </button>
                <button
                  onClick={() => onEditItem(currentScannedItem)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  Ubah Data
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Barcode className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Menunggu Pemindaian Barcode...</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Arahkan barcode barang ke arah kamera atau gunakan input manual pada kotak scanner di sebelah kiri.
              </p>
            </div>
          )}

          {/* Session Scan History */}
          {scanHistory.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Riwayat Scan Sesi Ini</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {scanHistory.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => setScannedItem(h.item)}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block line-clamp-1">{h.item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{h.item.sku}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDateTime(h.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
