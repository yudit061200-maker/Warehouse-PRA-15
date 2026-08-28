import React, { useState, useEffect } from 'react';
import { InventoryItem, TransactionType } from '../types';
import { formatRupiah } from '../utils/formatters';
import { CameraScanner } from './CameraScanner';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  initialType?: TransactionType;
  selectedItem?: InventoryItem | null;
  items: InventoryItem[];
  onSubmit: (data: {
    itemId: string;
    type: TransactionType;
    quantity: number;
    referenceNumber?: string;
    partner?: string;
    notes?: string;
    operator?: string;
    unitCost?: number;
  }) => Promise<void>;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  initialType = 'IN',
  selectedItem: preselectedItem,
  items,
  onSubmit,
  onClose,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    preselectedItem?.id || (items[0]?.id ?? '')
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [partner, setPartner] = useState<string>('');
  const [operator, setOperator] = useState<string>('Petugas Gudang');
  const [notes, setNotes] = useState<string>('');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentItem = items.find((i) => i.id === selectedItemId);

  useEffect(() => {
    const prefix = type === 'IN' ? 'PO-IN' : 'DO-OUT';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setReferenceNumber(
      `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomCode}`
    );

    if (currentItem) {
      if (type === 'IN') {
        setPartner(currentItem.supplier || 'PT Supplier Rekanan');
      } else {
        setPartner('Divisi Produksi / Pelanggan');
      }
      setUnitCost(currentItem.unitPrice);
    }
  }, [type, currentItem]);

  const handleBarcodeScanned = (code: string) => {
    const found = items.find(
      (i) =>
        i.barcode === code.trim() ||
        i.barcode === code ||
        i.sku.toLowerCase() === code.trim().toLowerCase()
    );

    if (found) {
      setSelectedItemId(found.id);
      setIsScanning(false);
      setErrorMessage(null);
    } else {
      setErrorMessage(
        `Barang dengan barcode/SKU "${code}" tidak ditemukan di database inventory.`
      );
    }
  };

  const currentStock = currentItem?.quantity ?? 0;
  const unit = currentItem?.unit ?? 'pcs';
  const minStock = currentItem?.minStock ?? 0;

  const predictedNewStock =
    type === 'IN'
      ? currentStock + (Number(quantity) || 0)
      : currentStock - (Number(quantity) || 0);

  const willBeLowStock = type === 'OUT' && predictedNewStock <= minStock;
  const isInvalidOut = type === 'OUT' && quantity > currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMessage('Pilih barang terlebih dahulu');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('Jumlah harus lebih dari 0');
      return;
    }
    if (type === 'OUT' && quantity > currentStock) {
      setErrorMessage(
        `Stok tidak mencukupi! Stok saat ini: ${currentStock} ${unit}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSubmit({
        itemId: currentItem.id,
        type,
        quantity: Number(quantity),
        referenceNumber: referenceNumber.trim(),
        partner: partner.trim(),
        notes: notes.trim(),
        operator: operator.trim(),
        unitCost: Number(unitCost) || currentItem.unitPrice,
      });

      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.85 },
        });
      } catch (e) {}

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses mutasi stok');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Type Selector */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                type === 'IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Masuk (IN)
            </button>
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                type === 'OUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Keluar (OUT)
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto"
        >
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Scanner view if active */}
          {isScanning && (
            <div className="mb-3">
              <CameraScanner
                title="Pindai Barcode Barang untuk Memilih Cepat"
                onScanSuccess={handleBarcodeScanned}
                onClose={() => setIsScanning(false)}
              />
            </div>
          )}

          {/* Item Selector & Scan button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Barang *
              </label>
              <button
                type="button"
                onClick={() => setIsScanning(!isScanning)}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                {isScanning ? 'Tutup Scanner' : 'Pindai Barcode'}
              </button>
            </div>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.sku}] {item.name} (Stok: {item.quantity} {item.unit} - {item.location})
                </option>
              ))}
            </select>
          </div>

          {/* Transformation Preview */}
          {currentItem && (
            <div
              className={`p-4 rounded-2xl border transition-colors ${
                type === 'IN'
                  ? 'bg-emerald-50/50 border-emerald-200/80'
                  : 'bg-rose-50/50 border-rose-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {currentItem.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    SKU: {currentItem.sku} • {currentItem.location}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Harga Satuan
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {formatRupiah(currentItem.unitPrice)}
                  </span>
                </div>
              </div>

              {/* Transformation Box */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono">
                <div className="text-slate-600 font-sans">
                  Stok Saat Ini: <strong className="text-slate-900 font-mono">{currentStock} {unit}</strong>
                </div>
                <div className="font-bold flex items-center gap-1">
                  <span className="font-sans font-normal text-slate-600">Estimasi Baru:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono ${
                      isInvalidOut
                        ? 'bg-rose-200 text-rose-900 font-bold'
                        : willBeLowStock
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-200 text-slate-900'
                    }`}
                  >
                    {predictedNewStock} {unit}
                  </span>
                </div>
              </div>

              {willBeLowStock && !isInvalidOut && (
                <div className="mt-2 text-[11px] text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Perhatian: Transaksi ini akan menyebabkan stok berada di bawah batas minimum ({minStock} {unit}).
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah {type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={type === 'OUT' ? currentStock : undefined}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value) || 0))
                  }
                  required
                  className="w-full px-3 py-2 text-sm md:text-base font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-sans">
                  {unit}
                </span>
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Referensi / PO / DO
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Misal: PO-2026-0811"
                className="w-full px-3 py-2 text-xs md:text-sm font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Partner */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'IN' ? 'Pemasok / Supplier' : 'Tujuan / Divisi / Penerima'}
              </label>
              <input
                type="text"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder={type === 'IN' ? 'PT Supplier...' : 'Divisi Perakitan...'}
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Gudang
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama staf gudang..."
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Transaksi
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan kondisi barang, no batch..."
              className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInvalidOut}
              className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting
                ? 'Memproses...'
                : type === 'IN'
                ? `Simpan Penerimaan (+${quantity} ${unit})`
                : `Simpan Pengeluaran (-${quantity} ${unit})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
