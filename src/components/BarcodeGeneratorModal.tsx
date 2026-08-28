import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatRupiah, generateItemCode } from '../utils/formatters';
import { Printer, RefreshCw, X, Copy, Check, Tag } from 'lucide-react';

interface BarcodeGeneratorModalProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onClose: () => void;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  items,
  selectedItem: initialItem,
  onClose,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || (items[0]?.id ?? '')
  );
  const [customText, setCustomText] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customSku, setCustomSku] = useState<string>('');
  const [format, setFormat] = useState<'CODE128' | 'QR'>('CODE128');
  const [printLayout, setPrintLayout] = useState<'single' | 'thermal' | 'a4-sheet'>('single');
  const [quantityToPrint, setQuantityToPrint] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const currentItem = items.find((i) => i.id === selectedItemId);
  const barcodeValue = currentItem
    ? currentItem.barcode
    : customText || 'GDG-ELK-001';
  const itemName = currentItem ? currentItem.name : customName || 'Item Baru';
  const itemSku = currentItem ? currentItem.sku : customSku || 'GDG-NEW-001';
  const itemLocation = currentItem ? currentItem.location : 'Rak A-01';
  const itemPrice = currentItem ? currentItem.unitPrice : 0;

  const handleGenerateRandom = () => {
    setSelectedItemId('');
    const newSku = generateItemCode('Umum', 'Barang');
    setCustomText(newSku);
    setCustomSku(newSku);
    setCustomName('Barang Baru Otomatis');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(barcodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Printable Area */}
      <div className="hidden print:block fixed inset-0 bg-white p-4 text-black z-[9999]">
        {printLayout === 'single' && (
          <div className="border border-black p-4 max-w-sm rounded flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-800 uppercase">
              GUDANGPRO LOGISTICS
            </span>
            <span className="font-bold text-sm text-slate-900 mt-1">
              {itemName}
            </span>
            <span className="text-xs font-mono text-slate-600">
              SKU: {itemSku} | Rak: {itemLocation}
            </span>
            <div className="my-2">
              <BarcodeRenderer
                value={barcodeValue}
                format={format}
                height={50}
                width={2}
              />
            </div>
            {itemPrice > 0 && (
              <span className="text-xs font-semibold text-slate-900">
                {formatRupiah(itemPrice)}
              </span>
            )}
          </div>
        )}

        {printLayout === 'thermal' && (
          <div className="w-[50mm] h-[30mm] p-1 border border-dashed border-gray-400 flex flex-col items-center justify-between text-center overflow-hidden">
            <span className="text-[8px] font-bold truncate max-w-full">
              {itemName}
            </span>
            <div className="scale-90 my-auto">
              <BarcodeRenderer
                value={barcodeValue}
                format={format}
                height={35}
                width={1.5}
                fontSize={10}
              />
            </div>
            <span className="text-[7px] font-mono">
              SKU: {itemSku} | {itemLocation}
            </span>
          </div>
        )}

        {printLayout === 'a4-sheet' && (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: Math.min(quantityToPrint, 24) }).map(
              (_, idx) => (
                <div
                  key={idx}
                  className="border border-slate-300 p-2 rounded flex flex-col items-center text-center"
                >
                  <span className="text-[9px] font-bold truncate w-full">
                    {itemName}
                  </span>
                  <BarcodeRenderer
                    value={barcodeValue}
                    format={format}
                    height={40}
                    width={1.5}
                    fontSize={10}
                  />
                  <span className="text-[8px] font-mono text-slate-600">
                    SKU: {itemSku} ({itemLocation})
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Screen Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden print:hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                Generator & Cetak Barcode
              </h2>
              <p className="text-xs text-slate-500">
                Cetak label barcode membaca SKU otomatis untuk rak dan penempelan produk
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Item Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Barang dari Inventory
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setCustomText('');
                }}
                className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Buat Barcode Baru / Manual --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tipe Kode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('CODE128')}
                  className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                    format === 'CODE128'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Barcode 1D (Code128)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('QR')}
                  className={`py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer ${
                    format === 'QR'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  QR Code 2D
                </button>
              </div>
            </div>
          </div>

          {/* Manual Input if not selecting item */}
          {!selectedItemId && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Detail Barcode Manual
                </span>
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate Acak
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Nilai Barcode
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Contoh: GDG-ELK-099"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={customSku}
                    onChange={(e) => setCustomSku(e.target.value)}
                    placeholder="Contoh: GDG-ELK-099"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nama barang..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center text-center">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">
              Pratinjau Label Fisik
            </span>
            <h4 className="text-base font-bold text-slate-900">{itemName}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
              <span>SKU: {itemSku}</span>
              <span>•</span>
              <span>Lokasi: {itemLocation}</span>
            </div>

            <div className="my-4 p-3.5 bg-white rounded-xl shadow-xs border border-slate-200/80">
              <BarcodeRenderer
                value={barcodeValue}
                format={format}
                height={55}
                width={2}
                fontSize={13}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Tersalin!' : 'Salin Nilai'}
              </button>
            </div>
          </div>

          {/* Print Layout Options */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Format Cetak Sticker / Kertas
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'single',
                  label: '1 Label Standar',
                  desc: 'Label kotak per barang',
                },
                {
                  id: 'thermal',
                  label: 'Thermal Roll',
                  desc: 'Sticker 50x30mm',
                },
                {
                  id: 'a4-sheet',
                  label: 'Kertas Lembar A4',
                  desc: 'Grid lembar barcode',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrintLayout(opt.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    printLayout === opt.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            {printLayout === 'a4-sheet' && (
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs text-slate-600">
                  Jumlah sticker per lembar:
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={quantityToPrint}
                  onChange={(e) =>
                    setQuantityToPrint(Number(e.target.value) || 1)
                  }
                  className="w-20 px-2.5 py-1 text-xs border border-slate-200 rounded-xl bg-white text-slate-900"
                />
                <span className="text-xs text-slate-400">
                  (Maksimal 24 label / lembar)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Label Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
