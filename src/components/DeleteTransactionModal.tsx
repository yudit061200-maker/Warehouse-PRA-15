import React from 'react';
import { Transaction, InventoryItem } from '../types';
import { formatDateTime, formatRupiah } from '../utils/formatters';
import { AlertTriangle, Trash2, X, ArrowDownLeft, ArrowUpRight, Package, RefreshCw } from 'lucide-react';

interface DeleteTransactionModalProps {
  transaction: Transaction | null;
  items: InventoryItem[];
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: (transaction: Transaction) => Promise<void>;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  transaction,
  items,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !transaction) return null;

  const linkedItem = items.find((i) => i.id === transaction.itemId || i.sku === transaction.itemSku);
  const currentStock = linkedItem?.quantity ?? transaction.newStock;

  // Calculate stock after delete
  let simulatedStockAfterDelete = currentStock;
  if (transaction.type === 'IN') {
    simulatedStockAfterDelete = Math.max(0, currentStock - transaction.quantity);
  } else if (transaction.type === 'OUT') {
    simulatedStockAfterDelete = currentStock + transaction.quantity;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-950">
              Konfirmasi Hapus Laporan Transaksi
            </h3>
            <p className="text-xs text-rose-700 mt-0.5">
              Apakah Anda yakin ingin menghapus catatan mutasi ini?
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-3.5 text-xs">
          {/* Transaction Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-900">
                {transaction.referenceNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                  transaction.type === 'IN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {transaction.type === 'IN' ? (
                  <ArrowDownLeft className="w-3 h-3" />
                ) : (
                  <ArrowUpRight className="w-3 h-3" />
                )}
                {transaction.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'}
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-200/80">
              <h4 className="font-bold text-slate-900 text-xs">{transaction.itemName}</h4>
              <p className="text-[11px] text-slate-500 font-mono">SKU: {transaction.itemSku}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Jumlah Mutasi:</span>
                <strong className="font-mono text-slate-900">
                  {transaction.type === 'IN' ? `+${transaction.quantity}` : `-${transaction.quantity}`} {linkedItem?.unit || 'unit'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Mitra:</span>
                <span className="font-medium text-slate-900 truncate block">{transaction.partner}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Waktu: {formatDateTime(transaction.timestamp)} • Petugas: {transaction.operator}
            </div>
          </div>

          {/* Stock Reversal Warning Box */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Dampak Pengembalian Stok Fisik:</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              {transaction.type === 'IN'
                ? `Menghapus mutasi masuk ini akan mengurangi kembali stok fisik barang sebesar ${transaction.quantity} ${linkedItem?.unit || 'unit'}.`
                : `Menghapus mutasi keluar ini akan mengembalikan stok fisik barang sebesar ${transaction.quantity} ${linkedItem?.unit || 'unit'}.`}
            </p>
            <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between font-mono font-bold text-xs">
              <span className="text-amber-700">Stok Akhir:</span>
              <span className="text-slate-900">
                {currentStock} → <strong className="text-amber-900">{simulatedStockAfterDelete} {linkedItem?.unit || 'unit'}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onConfirm(transaction)}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Transaksi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
