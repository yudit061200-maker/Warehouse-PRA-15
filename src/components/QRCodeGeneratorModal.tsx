import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../types';
import { QRCodeRenderer } from './QRCodeRenderer';
import { formatRupiah, generateItemCode } from '../utils/formatters';
import {
  Printer,
  RefreshCw,
  X,
  Copy,
  Check,
  QrCode,
  Layers,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface QRCodeGeneratorModalProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onClose: () => void;
}

type SheetLayoutType = 'grid-24' | 'grid-12' | 'grid-40' | 'thermal';

interface LabelConfig {
  showTitle: boolean;
  showSku: boolean;
  showLocation: boolean;
  showPrice: boolean;
  showBrand: boolean;
}

export const QRCodeGeneratorModal: React.FC<QRCodeGeneratorModalProps> = ({
  items,
  selectedItem: initialItem,
  onClose,
}) => {
  // Mode: 'single' (satu item banyak lembar) or 'batch' (banyak item sekaligus)
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || (items[0]?.id ?? '')
  );
  const [customCode, setCustomCode] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customSku, setCustomSku] = useState<string>('');

  // Batch selection
  const [selectedBatchItemIds, setSelectedBatchItemIds] = useState<string[]>(
    initialItem ? [initialItem.id] : items.slice(0, 6).map((i) => i.id)
  );

  // Print sheet settings
  const [copiesPerItem, setCopiesPerItem] = useState<number>(12);
  const [sheetLayout, setSheetLayout] = useState<SheetLayoutType>('grid-24');
  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    showTitle: true,
    showSku: true,
    showLocation: true,
    showPrice: false,
    showBrand: true,
  });

  const [copied, setCopied] = useState(false);

  const singleItem = items.find((i) => i.id === selectedItemId);
  const qrValue = singleItem
    ? singleItem.barcode || singleItem.sku
    : customCode || 'GDG-QR-001';
  const itemName = singleItem ? singleItem.name : customName || 'Label QR Gudang';
  const itemSku = singleItem ? singleItem.sku : customSku || 'SKU-GDG-001';
  const itemLocation = singleItem ? singleItem.location : 'Rak A-01';
  const itemPrice = singleItem ? singleItem.unitPrice : 0;

  // Build the list of labels to render on the sheet
  const printItemsList = useMemo(() => {
    if (mode === 'single') {
      const target = singleItem || {
        id: 'custom',
        sku: itemSku,
        barcode: qrValue,
        name: itemName,
        category: 'Umum',
        quantity: 0,
        minStock: 0,
        unit: 'pcs',
        unitPrice: itemPrice,
        location: itemLocation,
        createdAt: '',
        lastUpdated: '',
      };
      return Array.from({ length: Math.max(1, copiesPerItem) }).map((_, idx) => ({
        ...target,
        uniqueKey: `${target.id}-copy-${idx}`,
      }));
    } else {
      // Batch mode: each selected item repeated by copiesPerItem
      const selected = items.filter((i) => selectedBatchItemIds.includes(i.id));
      const list: Array<InventoryItem & { uniqueKey: string }> = [];
      selected.forEach((item) => {
        for (let c = 0; c < Math.max(1, copiesPerItem); c++) {
          list.push({ ...item, uniqueKey: `${item.id}-copy-${c}` });
        }
      });
      return list;
    }
  }, [
    mode,
    singleItem,
    copiesPerItem,
    selectedBatchItemIds,
    items,
    itemSku,
    qrValue,
    itemName,
    itemPrice,
    itemLocation,
  ]);

  const handleSelectAllBatch = () => {
    if (selectedBatchItemIds.length === items.length) {
      setSelectedBatchItemIds([]);
    } else {
      setSelectedBatchItemIds(items.map((i) => i.id));
    }
  };

  const handleToggleBatchItem = (id: string) => {
    setSelectedBatchItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerateRandom = () => {
    setSelectedItemId('');
    const newSku = generateItemCode('Umum', 'QR');
    setCustomCode(newSku);
    setCustomSku(newSku);
    setCustomName('Item QR Otomatis');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Grid classes based on sheet layout
  const getGridClasses = () => {
    switch (sheetLayout) {
      case 'grid-12':
        return 'grid grid-cols-2 gap-3 text-xs';
      case 'grid-40':
        return 'grid grid-cols-4 gap-2 text-[9px]';
      case 'thermal':
        return 'flex flex-col gap-3 items-center';
      case 'grid-24':
      default:
        return 'grid grid-cols-3 gap-2.5 text-[10px]';
    }
  };

  const getQRSizeForLayout = () => {
    switch (sheetLayout) {
      case 'grid-12':
        return 95;
      case 'grid-40':
        return 50;
      case 'thermal':
        return 80;
      case 'grid-24':
      default:
        return 68;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      {/* ========================================================= */}
      {/* PRINTABLE SHEET CONTAINER (VISIBLE ONLY IN PRINT DIALOG) */}
      {/* ========================================================= */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-3 z-[99999]">
        <div className={getGridClasses()}>
          {printItemsList.map((it) => (
            <div
              key={it.uniqueKey}
              className={`border border-slate-400/90 rounded-md p-2 flex flex-col items-center justify-between text-center bg-white page-break-inside-avoid ${
                sheetLayout === 'thermal'
                  ? 'w-[55mm] h-[35mm] border-dashed mb-3'
                  : 'min-h-[110px]'
              }`}
            >
              {labelConfig.showBrand && (
                <span className="text-[7px] font-extrabold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-0.5 w-full mb-1">
                  GUDANGPRO LOGISTICS
                </span>
              )}

              {labelConfig.showTitle && (
                <span className="font-bold leading-tight line-clamp-1 w-full text-slate-950">
                  {it.name}
                </span>
              )}

              <div className="my-1 flex items-center justify-center">
                <QRCodeRenderer
                  value={it.barcode || it.sku}
                  size={getQRSizeForLayout()}
                  includeMargin={false}
                />
              </div>

              <div className="w-full space-y-0.5">
                {labelConfig.showSku && (
                  <span className="font-mono font-bold tracking-wider block text-slate-900">
                    {it.sku}
                  </span>
                )}
                <div className="flex items-center justify-center gap-1.5 text-[8px] text-slate-600 font-mono">
                  {labelConfig.showLocation && <span>Rak: {it.location}</span>}
                  {labelConfig.showPrice && it.unitPrice > 0 && (
                    <span>• {formatRupiah(it.unitPrice)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL (HIDDEN IN PRINT) */}
      {/* ========================================================= */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Studio Cetak Label QR Code Lembaran</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  Multi-Copy Sheet
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pilih satu atau banyak barang dan tentukan jumlah lembar cetak sekaligus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Mode Selector Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 p-1.5 rounded-2xl">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Satu Barang (Banyak Salinan)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('batch')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'batch'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Banyak Barang (Batch Inventory)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-slate-500 font-medium">Total Label:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs">
                {printItemsList.length} Label
              </span>
            </div>
          </div>

          {/* Section 1: Target Selection */}
          {mode === 'single' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Barang Inventory:
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value);
                      setCustomCode('');
                    }}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">-- Buat Label QR Bebas / Manual --</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.sku}] {it.name} (Rak: {it.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Copies Setting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jumlah Label yang Ingin Dicetak:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={copiesPerItem}
                      onChange={(e) =>
                        setCopiesPerItem(Math.max(1, Math.min(120, Number(e.target.value) || 1)))
                      }
                      className="w-24 px-3 py-2 text-xs sm:text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-center font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {[1, 6, 12, 24, 48].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setCopiesPerItem(qty)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            copiesPerItem === qty
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {qty}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom manual inputs if no item chosen */}
              {!selectedItemId && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Pengaturan Label QR Manual
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateRandom}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Acak Kode
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Isi / Nilai QR Code
                      </label>
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="Misal: QR-ITEM-001"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        SKU Teks
                      </label>
                      <input
                        type="text"
                        value={customSku}
                        onChange={(e) => setCustomSku(e.target.value)}
                        placeholder="Misal: SKU-001"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900"
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
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Batch Selection Table */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllBatch}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {selectedBatchItemIds.length === items.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>
                      {selectedBatchItemIds.length === items.length
                        ? 'Batalkan Semua'
                        : 'Pilih Semua Barang'}
                    </span>
                  </button>
                  <span className="text-xs text-slate-500">
                    ({selectedBatchItemIds.length} dari {items.length} barang terpilih)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    Salinan per Barang:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={copiesPerItem}
                    onChange={(e) =>
                      setCopiesPerItem(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                    }
                    className="w-16 px-2.5 py-1 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-center font-mono"
                  />
                </div>
              </div>

              {/* Items checkbox list */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 p-1 bg-slate-50/50">
                {items.map((it) => {
                  const isChecked = selectedBatchItemIds.includes(it.id);
                  return (
                    <div
                      key={it.id}
                      onClick={() => handleToggleBatchItem(it.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-slate-900 block truncate">{it.name}</span>
                          <span className="text-[10px] text-indigo-700 font-mono font-bold">
                            SKU: {it.sku} • Rak: {it.location}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-2">
                        Stok: {it.quantity} {it.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Sheet Layout & Label Elements Settings */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-slate-100">
            {/* Layout options */}
            <div className="md:col-span-7 space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilih Format Layout Lembar Kertas:</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'grid-24',
                    title: 'A4 Grid 24 Label',
                    desc: '3 kolom x 8 baris (Standar Rak)',
                  },
                  {
                    id: 'grid-12',
                    title: 'A4 Grid 12 Label',
                    desc: '2 kolom x 6 baris (Ukuran Besar)',
                  },
                  {
                    id: 'grid-40',
                    title: 'A4 Grid 40 Label',
                    desc: '4 kolom x 10 baris (Ukuran Ringkas)',
                  },
                  {
                    id: 'thermal',
                    title: 'Thermal Roll 50x30',
                    desc: 'Printer sticker kasir / roll',
                  },
                ].map((ly) => (
                  <button
                    key={ly.id}
                    type="button"
                    onClick={() => setSheetLayout(ly.id as SheetLayoutType)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      sheetLayout === ly.id
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold ring-1 ring-indigo-500 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{ly.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ly.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Label elements toggle */}
            <div className="md:col-span-5 space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tampilan Informasi Label:</span>
              </label>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={labelConfig.showTitle}
                    onChange={(e) =>
                      setLabelConfig({ ...labelConfig, showTitle: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Nama Barang</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={labelConfig.showSku}
                    onChange={(e) =>
                      setLabelConfig({ ...labelConfig, showSku: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Kode SKU</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={labelConfig.showLocation}
                    onChange={(e) =>
                      setLabelConfig({ ...labelConfig, showLocation: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Lokasi Rak</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={labelConfig.showPrice}
                    onChange={(e) =>
                      setLabelConfig({ ...labelConfig, showPrice: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Harga Satuan</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Live Preview of First Label */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs shrink-0">
                <QRCodeRenderer
                  value={qrValue}
                  size={75}
                  includeMargin={false}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pratinjau Label Satuan
                </span>
                <h4 className="text-sm font-bold text-slate-900">{itemName}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-mono mt-0.5">
                  <span className="font-bold text-indigo-700">SKU: {itemSku}</span>
                  <span>•</span>
                  <span>Rak: {itemLocation}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Tersalin!' : 'Salin Kode QR'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="text-xs text-slate-500 hidden sm:block">
            Tips: Atur skala printer ke 100% dan matikan header/footer browser untuk hasil presisi.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak {printItemsList.length} Label Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
