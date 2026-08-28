import React, { useState, useEffect } from 'react';
import { InventoryItem, ReferenceItem } from '../types';
import { generateItemCode } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { CameraScanner } from './CameraScanner';
import { AutofillReferenceSelector } from './AutofillReferenceSelector';
import {
  X,
  Sparkles,
  Camera,
  Save,
  PackagePlus,
  AlertTriangle,
  Check,
  Barcode,
} from 'lucide-react';

interface ItemFormModalProps {
  item?: InventoryItem | null;
  initialReferenceItem?: ReferenceItem | null;
  categories: string[];
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
  onClose: () => void;
}

const COMMON_CATEGORIES = [
  'Elektronik & Kelistrikan',
  'Bahan Kemasan',
  'Bahan Baku',
  'Suku Cadang & Mekanik',
  'Makanan & Minuman',
  'Perlengkapan Kerja & Safety',
  'Alat Tulis & Kantor',
  'Farmasi & Medis',
];

const COMMON_UNITS = [
  'pcs',
  'box',
  'roll',
  'kg',
  'pail',
  'pallet',
  'meter',
  'liter',
  'unit',
  'dus',
  'karton',
];

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  initialReferenceItem,
  categories,
  onSave,
  onClose,
}) => {
  const isEdit = !!item;

  const defaultItemCode =
    initialReferenceItem?.code ||
    item?.sku ||
    generateItemCode(COMMON_CATEGORIES[0], 'Barang');
  const [name, setName] = useState(
    initialReferenceItem?.name || item?.name || ''
  );
  const [category, setCategory] = useState(
    initialReferenceItem?.category || item?.category || COMMON_CATEGORIES[0]
  );
  const [sku, setSku] = useState(defaultItemCode);
  const [barcode, setBarcode] = useState(
    initialReferenceItem?.barcode || item?.barcode || defaultItemCode
  );
  const [quantity, setQuantity] = useState<number>(item?.quantity ?? 10);
  const [minStock, setMinStock] = useState<number>(
    initialReferenceItem?.minStockRecommendation ?? item?.minStock ?? 10
  );
  const [unit, setUnit] = useState(
    initialReferenceItem?.unit || item?.unit || 'pcs'
  );
  const [unitPrice, setUnitPrice] = useState<number>(
    initialReferenceItem?.standardPrice ?? item?.unitPrice ?? 50000
  );
  const [location, setLocation] = useState(
    initialReferenceItem?.defaultLocation || item?.location || 'Rak A-01'
  );
  const [supplier, setSupplier] = useState(
    initialReferenceItem?.supplier || item?.supplier || ''
  );
  const [description, setDescription] = useState(
    initialReferenceItem?.description || item?.description || ''
  );
  const [autofilledNotice, setAutofilledNotice] = useState<string | null>(
    initialReferenceItem
      ? `Data dimuat dari katalog pedoman: ${initialReferenceItem.name}`
      : null
  );

  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialReferenceItem && !item) {
      applyReferenceAutofill(initialReferenceItem);
    }
  }, [initialReferenceItem]);

  const applyReferenceAutofill = (ref: ReferenceItem) => {
    setName(ref.name);
    setSku(ref.code);
    setBarcode(ref.barcode || ref.code);
    setCategory(ref.category);
    setUnit(ref.unit);
    setUnitPrice(ref.standardPrice);
    if (ref.supplier) setSupplier(ref.supplier);
    if (ref.defaultLocation) setLocation(ref.defaultLocation);
    if (ref.description) setDescription(ref.description);
    if (ref.minStockRecommendation) setMinStock(ref.minStockRecommendation);

    setAutofilledNotice(
      `Autofill berhasil dari Pedoman Data: ${ref.code} - ${ref.name}`
    );
  };

  const handleAutoGenerateItemCode = () => {
    const newCode = generateItemCode(category, name || 'Barang');
    setSku(newCode);
    setBarcode(newCode);
  };

  const handleUseItemCodeAsBarcode = () => {
    if (sku.trim()) {
      setBarcode(sku.trim().toUpperCase());
    }
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    setBarcode(scannedCode);
    setIsScanningBarcode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setErrorMessage('Nama dan SKU / Kode Item wajib diisi');
      return;
    }

    const finalBarcode = barcode.trim() || sku.trim().toUpperCase();

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave({
        name: name.trim(),
        category: category.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: finalBarcode,
        quantity: Number(quantity) || 0,
        minStock: Number(minStock) || 0,
        unit: unit.trim(),
        unitPrice: Number(unitPrice) || 0,
        location: location.trim(),
        supplier: supplier.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data barang');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                {isEdit ? 'Ubah Informasi Barang' : 'Pendaftaran Barang Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? `Mengubah data SKU: ${item?.sku}`
                  : 'Barcode membaca SKU secara otomatis untuk pemindaian instan'}
              </p>
            </div>
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
          className="p-6 space-y-4.5 max-h-[75vh] overflow-y-auto"
        >
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Autofill Selector */}
          {!isEdit && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-2">
              <AutofillReferenceSelector
                onSelectReference={applyReferenceAutofill}
                placeholder="Cari dari database pedoman Google Sheets untuk autofill..."
              />
              {autofilledNotice && (
                <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{autofilledNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutofilledNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Scanner Overlay */}
          {isScanningBarcode && (
            <div className="mb-4">
              <CameraScanner
                title="Pindai Barcode / SKU Label"
                onScanSuccess={handleBarcodeScanned}
                onClose={() => setIsScanningBarcode(false)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Kode Item (SKU) *
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateItemCode}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto Code
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  if (barcode === sku || !barcode) {
                    setBarcode(val);
                  }
                  setSku(val);
                }}
                placeholder="Misal: GDG-ELK-001"
                required
                className="w-full px-3 py-2 text-xs md:text-sm font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
              />
            </div>

            {/* Barcode Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Barcode *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseItemCodeAsBarcode}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 font-semibold cursor-pointer"
                    title="Gunakan SKU sebagai nilai Barcode"
                  >
                    <Barcode className="w-3 h-3" /> = SKU
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScanningBarcode(!isScanningBarcode)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-semibold cursor-pointer"
                  >
                    <Camera className="w-3 h-3" /> Scan
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Sama dengan SKU..."
                required
                className="w-full px-3 py-2 text-xs md:text-sm font-mono border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Barcode Preview */}
          {barcode && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs text-slate-800 font-semibold block">
                  Pratinjau Barcode:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({barcode})
                </span>
              </div>
              <BarcodeRenderer
                value={barcode}
                height={32}
                width={1.4}
                fontSize={10}
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Barang Lengkap *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kabel Power Industri 3-Phase 10M"
              required
              className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Barang
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {Array.from(new Set([...COMMON_CATEGORIES, ...categories])).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Rak / Aisle / Zona *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Rak A-02, Zona Dingin 1"
                required
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEdit ? 'Jumlah Stok' : 'Stok Awal'}
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono font-semibold"
              />
            </div>

            {/* Min Stock */}
            <div>
              <label className="block text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Stok Min *
              </label>
              <input
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs md:text-sm border border-rose-200 bg-rose-50/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono font-semibold text-rose-900"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pemasok / Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="PT / CV Pemasok..."
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Spesifikasi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan..."
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? 'Menyimpan...'
                : isEdit
                ? 'Simpan Perubahan'
                : 'Daftarkan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
