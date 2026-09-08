import React, { useState } from 'react';
import { InventoryItem, TransactionType } from '../types';
import { CameraScanner } from './CameraScanner';
import { QRCodeRenderer } from './QRCodeRenderer';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import {
  QrCode,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  History,
  MapPin,
  Sparkles,
  Plus,
  Minus,
  FileText,
  Boxes,
  RotateCcw,
  Tag,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRCodeScannerTabProps {
  items: InventoryItem[];
  onStockInItem: (item: InventoryItem) => void;
  onStockOutItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onPrintQRCode?: (item: InventoryItem, category?: 'IN' | 'OUT' | 'GENERAL') => void;
  onPrintBarcode?: (item: InventoryItem, category?: 'IN' | 'OUT' | 'GENERAL') => void;
  onQuickMutate: (itemId: string, type: TransactionType, qty: number) => Promise<void>;
}

export const QRCodeScannerTab: React.FC<QRCodeScannerTabProps> = ({
  items,
  onStockInItem,
  onStockOutItem,
  onEditItem,
  onPrintQRCode,
  onPrintBarcode,
  onQuickMutate,
}) => {
  const triggerPrint = (item: InventoryItem, category: 'IN' | 'OUT' | 'GENERAL') => {
    if (onPrintQRCode) {
      onPrintQRCode(item, category);
    } else if (onPrintBarcode) {
      onPrintBarcode(item, category);
    }
  };
  // Scanner Filter Mode: 'ALL' (Auto-detect), 'IN' (Khusus Barang Masuk), 'OUT' (Khusus Barang Keluar)
  const [scannerMode, setScannerMode] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [detectedAction, setDetectedAction] = useState<'IN' | 'OUT' | null>(null);
  const [scanHistory, setScanHistory] = useState<{ item: InventoryItem; action?: 'IN' | 'OUT'; time: string }[]>([]);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);

  // Manual Quantity Input State
  const [quickQty, setQuickQty] = useState<number>(1);
  const [qtyInputString, setQtyInputString] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleScanSuccess = (code: string) => {
    let cleanCode = code.trim();
    let detected: 'IN' | 'OUT' | null = null;

    if (cleanCode.startsWith('IN:')) {
      detected = 'IN';
      cleanCode = cleanCode.substring(3).trim();
    } else if (cleanCode.startsWith('OUT:')) {
      detected = 'OUT';
      cleanCode = cleanCode.substring(4).trim();
    }

    setDetectedAction(detected);

    const found = items.find(
      (i) =>
        i.barcode === cleanCode ||
        i.barcode === code.trim() ||
        i.sku.toLowerCase() === cleanCode.toLowerCase() ||
        i.sku.toLowerCase() === code.trim().toLowerCase() ||
        i.name.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setScannedItem(found);
      setNotFoundCode(null);
      setScanHistory((prev) => [
        { item: found, action: detected || undefined, time: new Date().toISOString() },
        ...prev.filter((p) => p.item.id !== found.id).slice(0, 8),
      ]);
    } else {
      setScannedItem(null);
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

  const handleQuickAction = async (type: TransactionType) => {
    if (!scannedItem) return;
    const qty = Math.max(1, quickQty || 1);

    if (type === 'OUT' && qty > scannedItem.quantity) {
      alert(`Jumlah keluar (${qty} ${scannedItem.unit}) melebihi stok yang tersedia (${scannedItem.quantity} ${scannedItem.unit})!`);
      return;
    }

    try {
      setIsProcessing(true);
      await onQuickMutate(scannedItem.id, type, qty);

      try {
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
      } catch (e) {}

      setSuccessToast(
        `Sukses: ${
          type === 'IN' ? 'Pemasukan' : 'Pengeluaran'
        } ${qty} ${scannedItem.unit} untuk "${scannedItem.name}" berhasil disimpan!`
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentScannedItem = scannedItem
    ? items.find((i) => i.id === scannedItem.id) || scannedItem
    : null;

  const validQty = Math.max(1, quickQty || 1);
  const isOverStock = currentScannedItem ? validQty > currentScannedItem.quantity : false;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Title Card & Mode Filter */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <QrCode className="w-5 h-5" />
            </div>
            <span>Pemindai QR Code & Pos Mutasi Barang</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Pindai label barang masuk atau keluar untuk pengisian mutasi cepat dengan input kuantitas manual.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setScannerMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              scannerMode === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua / Otomatis
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('IN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              scannerMode === 'IN'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Barang Masuk (IN)</span>
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('OUT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              scannerMode === 'OUT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Barang Keluar (OUT)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Scanner */}
        <div className="lg:col-span-6 space-y-4">
          <CameraScanner
            title={
              scannerMode === 'IN'
                ? 'Kamera Pemindai: Khusus Penerimaan Barang Masuk'
                : scannerMode === 'OUT'
                ? 'Kamera Pemindai: Khusus Pengeluaran Barang Keluar'
                : 'Kamera Pemindai QR Code'
            }
            onScanSuccess={handleScanSuccess}
          />

          {notFoundCode && (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-800 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Barang Tidak Ditemukan</span>
              </div>
              <p>
                Kode <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold">{notFoundCode}</code> belum terdaftar dalam master data gudang.
              </p>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Riwayat Pindai Terakhir
                </span>
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Bersihkan
                </button>
              </div>

              <div className="space-y-1.5">
                {scanHistory.map((hist, idx) => (
                  <div
                    key={`${hist.item.id}-${idx}`}
                    onClick={() => {
                      setScannedItem(hist.item);
                      setDetectedAction(hist.action || null);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-900 block truncate">
                        {hist.item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {hist.item.sku} • Rak: {hist.item.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hist.action === 'IN' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                          IN
                        </span>
                      )}
                      {hist.action === 'OUT' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                          OUT
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-700 text-[11px]">
                        {hist.item.quantity} {hist.item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scanned Item & Manual Quantity Mutate Controls */}
        <div className="lg:col-span-6 space-y-4">
          {successToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {currentScannedItem ? (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              {/* Detected Action Banner (Label Barang Masuk vs Keluar) */}
              {detectedAction && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold animate-in fade-in ${
                    detectedAction === 'IN'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>
                      {detectedAction === 'IN'
                        ? '🏷️ Label Barang Masuk (INBOUND) Terdeteksi'
                        : '🏷️ Label Barang Keluar (OUTBOUND) Terdeteksi'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border">
                    {detectedAction === 'IN' ? 'Aksi Penerimaan' : 'Aksi Pengeluaran'}
                  </span>
                </div>
              )}

              {/* Item Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-xs">
                      {currentScannedItem.sku}
                    </span>
                    <span className="text-xs text-slate-400">
                      Kategori: {currentScannedItem.category}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    {currentScannedItem.name}
                  </h3>
                </div>

                {/* Stock status badge */}
                {currentScannedItem.quantity === 0 ? (
                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold text-xs shrink-0">
                    HABIS
                  </span>
                ) : currentScannedItem.quantity <= currentScannedItem.minStock ? (
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" /> MENIPIS
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0">
                    AMAN
                  </span>
                )}
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Stok Fisik Gudang</span>
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

              {/* ========================================================================= */}
              {/* MANUAL QUANTITY INPUT BOX */}
              {/* ========================================================================= */}
              <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>Input Jumlah Barang (Manual):</span>
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    Satuan: {currentScannedItem.unit}
                  </span>
                </div>

                {/* Direct Number Input and Stepper Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQtyChange(Math.max(1, validQty - 1))}
                    disabled={validQty <= 1}
                    className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    title="Kurangi 1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="relative flex-1">
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
                      placeholder="Ketik jumlah manual..."
                      className="w-full text-center text-lg font-bold font-mono py-2 px-3 bg-white border-2 border-indigo-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 shadow-inner"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQtyChange(validQty + 1)}
                    className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    title="Tambah 1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Preset:</span>
                  {[1, 2, 5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQtyChange(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        validQty === preset
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {currentScannedItem.quantity > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQtyChange(currentScannedItem.quantity)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer ml-auto"
                      title="Set jumlah sama dengan seluruh sisa stok untuk pengeluaran habis"
                    >
                      Semua Stok ({currentScannedItem.quantity})
                    </button>
                  )}
                </div>

                {/* Stock Projection Info */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block font-medium">Jika Barang Masuk (+):</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {currentScannedItem.quantity} ➔ {currentScannedItem.quantity + validQty} {currentScannedItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Jika Barang Keluar (-):</span>
                    <span
                      className={`font-bold font-mono ${
                        isOverStock ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {currentScannedItem.quantity} ➔ {Math.max(0, currentScannedItem.quantity - validQty)} {currentScannedItem.unit}
                    </span>
                  </div>
                </div>

                {isOverStock && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Peringatan: Jumlah keluar ({validQty}) melebihi stok fisik ({currentScannedItem.quantity} {currentScannedItem.unit})!
                    </span>
                  </div>
                )}

                {/* Action Buttons based on Scanner Mode & Detected Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {(scannerMode === 'ALL' || scannerMode === 'IN') && (
                    <button
                      type="button"
                      onClick={() => handleQuickAction('IN')}
                      disabled={isProcessing}
                      className={`py-3 px-4 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                        detectedAction === 'IN' || scannerMode === 'IN'
                          ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>+ Catat Masuk ({validQty} {currentScannedItem.unit})</span>
                    </button>
                  )}

                  {(scannerMode === 'ALL' || scannerMode === 'OUT') && (
                    <button
                      type="button"
                      onClick={() => handleQuickAction('OUT')}
                      disabled={isProcessing || isOverStock}
                      className={`py-3 px-4 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                        detectedAction === 'OUT' || scannerMode === 'OUT'
                          ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>- Catat Keluar ({validQty} {currentScannedItem.unit})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Label Printing Shortcuts: Separate Inbound & Outbound Label Printing */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cetak Label Spesifik untuk Barang Ini:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => triggerPrint(currentScannedItem, 'IN')}
                    className="p-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 flex items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Label Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerPrint(currentScannedItem, 'OUT')}
                    className="p-2 rounded-lg bg-white hover:bg-rose-50 text-rose-800 border border-slate-200 flex items-center justify-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>Label Keluar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerPrint(currentScannedItem, 'GENERAL')}
                    className="p-2 rounded-lg bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 flex items-center justify-center gap-1 font-semibold transition-colors cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Label Rak</span>
                  </button>
                </div>
              </div>

              {/* Secondary Detail Forms */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => onStockInItem(currentScannedItem)}
                  className="flex-1 min-w-[120px] py-2 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Form Masuk Detail
                </button>
                <button
                  type="button"
                  onClick={() => onStockOutItem(currentScannedItem)}
                  className="flex-1 min-w-[120px] py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  Form Keluar Detail
                </button>
                <button
                  type="button"
                  onClick={() => onEditItem(currentScannedItem)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Edit Master Data"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs text-slate-300">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">
                  Arahkan kamera ke Label QR Code Barang
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Pindai label Masuk (IN) atau Keluar (OUT) untuk memuat data item secara otomatis, lalu masukkan jumlah secara manual.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
