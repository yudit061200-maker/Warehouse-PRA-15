import React, { useState, useEffect } from 'react';
import { Transaction, InventoryItem } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Save,
  AlertCircle,
  Package,
  Calendar,
  User,
  FileText,
  DollarSign,
  Plus,
  Minus,
} from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  items: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    updatedData: {
      quantity: number;
      referenceNumber: string;
      partner: string;
      notes?: string;
      operator: string;
      timestamp: string;
      unitCost?: number;
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
    }
  ) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  items,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !transaction) return null;

  const linkedItem = items.find((i) => i.id === transaction.itemId || i.sku === transaction.itemSku);

  const [quantity, setQuantity] = useState<number>(transaction.quantity);
  const [referenceNumber, setReferenceNumber] = useState<string>(transaction.referenceNumber);
  const [partner, setPartner] = useState<string>(transaction.partner);
  const [operator, setOperator] = useState<string>(transaction.operator);
  const [unitCost, setUnitCost] = useState<number>(transaction.unitCost || linkedItem?.unitPrice || 0);
  const [notes, setNotes] = useState<string>(transaction.notes || '');
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>(transaction.type);
  
  // Format timestamp for datetime-local input
  const getFormattedDateTimeLocal = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return new Date().toISOString().slice(0, 16);
    }
  };

  const [timestampLocal, setTimestampLocal] = useState<string>(
    getFormattedDateTimeLocal(transaction.timestamp)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setQuantity(transaction.quantity);
      setReferenceNumber(transaction.referenceNumber);
      setPartner(transaction.partner);
      setOperator(transaction.operator);
      setUnitCost(transaction.unitCost || linkedItem?.unitPrice || 0);
      setNotes(transaction.notes || '');
      setType(transaction.type);
      setTimestampLocal(getFormattedDateTimeLocal(transaction.timestamp));
      setErrorMessage(null);
    }
  }, [transaction, linkedItem]);

  // Compute calculated new item stock
  const currentStock = linkedItem?.quantity ?? transaction.newStock;
  const oldQty = transaction.quantity;
  const oldType = transaction.type;
  
  let baseStock = currentStock;
  if (oldType === 'IN') baseStock -= oldQty;
  else if (oldType === 'OUT') baseStock += oldQty;

  let simulatedNewStock = baseStock;
  if (type === 'IN') simulatedNewStock += quantity;
  else if (type === 'OUT') simulatedNewStock -= quantity;

  const handleQuickQtyChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      setErrorMessage('Jumlah kuantitas harus lebih dari 0.');
      return;
    }

    if (type === 'OUT' && baseStock < quantity) {
      setErrorMessage(
        `Stok tidak mencukupi! Tersedia setelah rekalkulasi: ${baseStock} ${linkedItem?.unit || 'unit'}, diminta keluar: ${quantity} ${linkedItem?.unit || 'unit'}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Convert local datetime to ISO string
      let finalIso = transaction.timestamp;
      try {
        const localDate = new Date(timestampLocal);
        if (!isNaN(localDate.getTime())) {
          finalIso = localDate.toISOString();
        }
      } catch (err) {
        console.warn('Error parsing date:', err);
      }

      await onSave(transaction.id, {
        quantity: Number(quantity),
        referenceNumber: referenceNumber.trim(),
        partner: partner.trim(),
        operator: operator.trim(),
        unitCost: Number(unitCost),
        notes: notes.trim(),
        timestamp: finalIso,
        type,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan perubahan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className={`p-5 text-white flex items-center justify-between ${
            type === 'IN'
              ? 'bg-emerald-600'
              : type === 'OUT'
              ? 'bg-rose-600'
              : 'bg-indigo-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs">
              {type === 'IN' ? (
                <ArrowDownLeft className="w-6 h-6 text-white" />
              ) : (
                <ArrowUpRight className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Edit Laporan Transaksi {type === 'IN' ? 'Masuk (Inbound)' : 'Keluar (Outbound)'}
              </h3>
              <p className="text-xs text-white/80 font-mono mt-0.5">
                Ref: {transaction.referenceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Gagal Memperbarui</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Linked Item Badge */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{transaction.itemName}</h4>
                <p className="text-[11px] text-slate-500 font-mono">SKU: {transaction.itemSku}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Stok Gudang Terkini</span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {currentStock} {linkedItem?.unit || 'unit'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Reference Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                No. Referensi / PO / DO <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="PO-20260827-1001"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Partner / Supplier / Customer */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {type === 'IN' ? 'Pemasok / Supplier' : 'Tujuan Divisi / Pelanggan'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                placeholder={type === 'IN' ? 'PT Supplier Rekanan' : 'Divisi Produksi / Pelanggan'}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quantity Controls & Dynamic Stock Impact */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-800">
                Jumlah Kuantitas ({linkedItem?.unit || 'unit'}) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[-10, -1, 1, 10].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleQuickQtyChange(step)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    {step > 0 ? `+${step}` : step}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickQtyChange(-1)}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                required
                value={quantity || ''}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-2 text-center text-sm font-bold font-mono border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleQuickQtyChange(1)}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Stock Recalculation Preview */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Estimasi Stok Baru Setelah Edit:</span>
              <div className="font-mono">
                <span className="text-slate-400">{currentStock}</span>
                <span className="text-slate-300 mx-1.5">→</span>
                <span
                  className={`font-bold ${
                    simulatedNewStock < 0
                      ? 'text-rose-600'
                      : type === 'IN'
                      ? 'text-emerald-700'
                      : 'text-slate-900'
                  }`}
                >
                  {simulatedNewStock} {linkedItem?.unit || 'unit'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Unit Price / Cost */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Harga / Valuasi Satuan (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={unitCost || ''}
                onChange={(e) => setUnitCost(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="25000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total: {formatRupiah(quantity * (unitCost || 0))}
              </span>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Petugas / Operator
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama Petugas"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Waktu Transaksi
            </label>
            <input
              type="datetime-local"
              value={timestampLocal}
              onChange={(e) => setTimestampLocal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Catatan / Keterangan Tambahan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika ada penyesuaian..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
