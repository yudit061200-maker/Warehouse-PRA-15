import React, { useState } from 'react';
import { InventoryItem, Transaction, TransactionType } from '../types';
import { CameraScanner } from './CameraScanner';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Plus,
  Minus,
  Save,
  AlertTriangle,
  History,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StockInOutViewProps {
  initialType?: TransactionType;
  items: InventoryItem[];
  transactions: Transaction[];
  onSubmitTransaction: (data: {
    itemId: string;
    type: TransactionType;
    quantity: number;
    referenceNumber?: string;
    partner?: string;
    notes?: string;
    operator?: string;
    unitCost?: number;
  }) => Promise<void>;
  onPrintLabel?: (item: InventoryItem, category: 'IN' | 'OUT') => void;
}

export const StockInOutView: React.FC<StockInOutViewProps> = ({
  initialType = 'IN',
  items,
  transactions,
  onSubmitTransaction,
  onPrintLabel,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [quantity, setQuantity] = useState<number | string>(10);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [partner, setPartner] = useState<string>('');
  const [operator] = useState<string>('Operator Gudang');
  const [notes, setNotes] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleScanSuccess = (code: string) => {
    let cleanCode = code.trim();
    let detectedType: TransactionType | null = null;
    if (cleanCode.startsWith('IN:')) {
      detectedType = 'IN';
      setType('IN');
      cleanCode = cleanCode.substring(3).trim();
    } else if (cleanCode.startsWith('OUT:')) {
      detectedType = 'OUT';
      setType('OUT');
      cleanCode = cleanCode.substring(4).trim();
    }

    const found = items.find(
      (i) =>
        i.barcode === cleanCode ||
        i.barcode === code.trim() ||
        i.sku.toLowerCase() === cleanCode.toLowerCase() ||
        i.sku.toLowerCase() === code.trim().toLowerCase()
    );

    if (found) {
      setSelectedItemId(found.id);
      const labelText =
        detectedType === 'IN'
          ? 'Label Barang Masuk (INBOUND)'
          : detectedType === 'OUT'
          ? 'Label Barang Keluar (OUTBOUND)'
          : 'Barcode Barang';
      setStatusMessage({
        type: 'success',
        text: `${labelText} "${found.name}" berhasil terdeteksi!`,
      });
      if ((detectedType === 'IN' || type === 'IN') && found.supplier) {
        setPartner(found.supplier);
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: `Kode "${code}" tidak ditemukan di master data inventory.`,
      });
    }
  };

  const handleQuickAddQty = (amount: number) => {
    setQuantity((prev) => Math.max(1, (Number(prev) || 0) + amount));
  };

  const numQuantity =
    typeof quantity === 'number'
      ? quantity
      : parseInt(quantity as string, 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setStatusMessage({ type: 'error', text: 'Pilih barang terlebih dahulu' });
      return;
    }
    if (numQuantity <= 0) {
      setStatusMessage({ type: 'error', text: 'Jumlah wajib berupa angka lebih dari 0' });
      return;
    }
    if (type === 'OUT' && numQuantity > selectedItem.quantity) {
      setStatusMessage({
        type: 'error',
        text: `Stok tidak cukup! Tersedia: ${selectedItem.quantity} ${selectedItem.unit}, diminta: ${numQuantity} ${selectedItem.unit}`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const refNo =
        referenceNumber.trim() ||
        `${type === 'IN' ? 'PO' : 'DO'}-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      await onSubmitTransaction({
        itemId: selectedItem.id,
        type,
        quantity: numQuantity,
        referenceNumber: refNo,
        partner:
          partner.trim() ||
          (type === 'IN' ? selectedItem.supplier || 'Supplier' : 'Customer/Divisi'),
        notes: notes.trim(),
        operator: operator.trim(),
        unitCost: selectedItem.unitPrice,
      });

      try {
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
      } catch (e) {}

      setStatusMessage({
        type: 'success',
        text: `Berhasil mencatat ${
          type === 'IN' ? 'Pemasukan' : 'Pengeluaran'
        } ${numQuantity} ${selectedItem.unit} untuk ${selectedItem.name}!`,
      });

      setQuantity(10);
      setNotes('');
      setReferenceNumber('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal menyimpan transaksi',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStock = selectedItem?.quantity ?? 0;
  const unit = selectedItem?.unit ?? 'pcs';
  const minStock = selectedItem?.minStock ?? 0;
  const newStock =
    type === 'IN' ? currentStock + numQuantity : currentStock - numQuantity;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900">
              Pos Mutasi Barang Gudang
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Catat barang masuk (Inbound) dan barang keluar (Outbound) dengan cepat
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setType('IN')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                type === 'IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" />
              <span>Masuk (IN)</span>
            </button>
            <button
              onClick={() => setType('OUT')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                type === 'OUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              <span>Keluar (OUT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Scanner */}
        <div className="lg:col-span-7 space-y-4">
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 font-medium animate-in fade-in duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Camera Scanner Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Pemindai Barcode Kamera</span>
              </div>
              <button
                onClick={() => setIsScannerOpen(!isScannerOpen)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                {isScannerOpen ? 'Tutup Kamera' : 'Buka Kamera'}
              </button>
            </div>

            {isScannerOpen && (
              <div className="p-3 bg-slate-950">
                <CameraScanner onScanSuccess={handleScanSuccess} />
              </div>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
          >
            {/* Item Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Barang dari Master Inventory
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.sku}] {item.name} (Stok: {item.quantity} {item.unit}) - {item.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Jumlah {type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'} ({unit})
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  Stok saat ini: <strong>{currentStock} {unit}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((prev) => Math.max(1, (Number(prev) || 1) - 1))
                  }
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Kurangi 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={type === 'OUT' ? currentStock : undefined}
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantity('');
                      } else {
                        const parsed = parseInt(val, 10);
                        setQuantity(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    onBlur={() => {
                      if (quantity === '' || Number(quantity) <= 0) {
                        setQuantity(1);
                      }
                    }}
                    placeholder="Ketik manual..."
                    className="w-full px-4 py-2 text-center text-lg font-bold border-2 border-indigo-200 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-sans pointer-events-none">
                    {unit}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((prev) =>
                      type === 'OUT'
                        ? Math.min(currentStock, (Number(prev) || 0) + 1)
                        : (Number(prev) || 0) + 1
                    )
                  }
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Tambah 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Exact Preset and increment chips */}
              <div className="space-y-1.5 mt-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Set Angka:</span>
                  {[1, 2, 5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(preset)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        Number(quantity) === preset
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  {type === 'OUT' && currentStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(currentStock)}
                      className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors cursor-pointer ml-auto"
                      title="Keluarkan seluruh sisa stok"
                    >
                      Semua ({currentStock})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Tambah:</span>
                  {[+5, +10, +25, +50].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleQuickAddQty(inc)}
                      className="px-2 py-0.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Partner */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {type === 'IN' ? 'Supplier / Pemasok' : 'Penerima / Divisi'}
                </label>
                <input
                  type="text"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  placeholder={type === 'IN' ? 'PT Supplier...' : 'Divisi Produksi / Outlet'}
                  className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Reference number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Surat Jalan / PO
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="PO-2026-..."
                  className="w-full px-3 py-2 text-xs md:text-sm font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Catatan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan kondisi fisik, nomor seal, dsb..."
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (type === 'OUT' && quantity > currentStock)}
              className={`w-full py-3 text-xs md:text-sm font-semibold text-white rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-98 ${
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? 'Menyimpan...'
                : type === 'IN'
                ? `Simpan Penerimaan Barang (+${quantity} ${unit})`
                : `Simpan Pengeluaran Barang (-${quantity} ${unit})`}
            </button>
          </form>
        </div>

        {/* Right Column: Live Snapshot */}
        <div className="lg:col-span-5 space-y-4">
          {selectedItem && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                  Pratinjau Barang Terpilih
                </span>
                <h3 className="text-sm md:text-base font-bold text-slate-900 mt-0.5">
                  {selectedItem.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedItem.sku} • Barcode: {selectedItem.barcode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Stok Saat Ini</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {currentStock} <span className="text-xs font-normal text-slate-500 font-sans">{unit}</span>
                  </span>
                </div>
                <div
                  className={`p-3.5 rounded-xl ${
                    newStock <= minStock
                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                      : 'bg-slate-50 text-slate-900'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 block font-medium">Stok Setelah Mutasi</span>
                  <span className="text-lg font-bold font-mono">
                    {newStock} <span className="text-xs font-normal font-sans">{unit}</span>
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <p>📍 Lokasi: <strong className="text-slate-800 font-medium">{selectedItem.location}</strong></p>
                <p>💰 Harga Satuan: <strong className="text-slate-800 font-medium font-mono">{formatRupiah(selectedItem.unitPrice)}</strong></p>
                <p>⚠️ Batas Stok Minimum: <strong className="text-slate-800 font-medium">{selectedItem.minStock} {unit}</strong></p>
              </div>

              {onPrintLabel && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onPrintLabel(selectedItem, type)}
                    className="w-full py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      Cetak Label {type === 'IN' ? 'Barang Masuk (IN)' : 'Barang Keluar (OUT)'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Recent Mutasi Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-3.5 text-xs font-bold text-slate-800">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Mutasi Terkini</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        tx.type === 'IN'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {tx.type === 'IN' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold text-slate-900 block truncate">
                        {tx.itemName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(tx.timestamp)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-bold font-mono shrink-0 ${
                      tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
