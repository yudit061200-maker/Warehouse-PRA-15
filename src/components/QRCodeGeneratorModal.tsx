import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Search,
  PackageCheck,
  Boxes,
  Plus,
  Minus,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  PackagePlus,
  FileCheck,
  Calendar,
  Hash,
  User,
} from 'lucide-react';

export type LabelCategory = 'IN' | 'OUT' | 'GENERAL';
export type SheetLayoutType =
  | 'auto'
  | 'single-large'
  | 'grid-2'
  | 'grid-4'
  | 'grid-6'
  | 'grid-12'
  | 'grid-24'
  | 'grid-40'
  | 'thermal'
  | 'thermal-80';
export type BatchQtyMode = 'custom' | 'uniform' | 'follow_stock';

interface QRCodeGeneratorModalProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  initialBatchItems?: InventoryItem[];
  initialLabelCategory?: LabelCategory;
  onClose: () => void;
}

interface LabelConfig {
  showTitle: boolean;
  showSku: boolean;
  showLocation: boolean;
  showPrice: boolean;
  showBrand: boolean;
  showDocNumber: boolean;
  showDate: boolean;
  showQuantity: boolean;
  showPartner: boolean;
}

export const QRCodeGeneratorModal: React.FC<QRCodeGeneratorModalProps> = ({
  items,
  selectedItem: initialItem,
  initialBatchItems,
  initialLabelCategory = 'IN',
  onClose,
}) => {
  // Label Category: 'IN' (Barang Masuk / Inbound), 'OUT' (Barang Keluar / Outbound), 'GENERAL' (Identitas Stok Rak)
  const [labelCategory, setLabelCategory] = useState<LabelCategory>(initialLabelCategory);

  // Print Mode: 'single' (Satu barang banyak lembar) or 'batch' (Banyak barang dipilih)
  const [mode, setMode] = useState<'single' | 'batch'>(
    initialBatchItems && initialBatchItems.length > 0 ? 'batch' : 'single'
  );

  // Single Item Selection & Custom Item State
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem?.id || (items[0]?.id ?? '')
  );
  const [customCode, setCustomCode] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customSku, setCustomSku] = useState<string>('');

  // Batch Selection
  const [selectedBatchItemIds, setSelectedBatchItemIds] = useState<string[]>(() => {
    if (initialBatchItems && initialBatchItems.length > 0) {
      return initialBatchItems.map((i) => i.id);
    }
    if (initialItem) {
      return [initialItem.id];
    }
    const inStock = items.filter((i) => i.quantity > 0);
    return (inStock.length > 0 ? inStock.slice(0, 8) : items.slice(0, 6)).map((i) => i.id);
  });

  // Batch Quantity Mode: 'custom' (Input manual per barang), 'uniform' (Input manual sama rata), 'follow_stock' (Ikuti stok fisik)
  const [batchQtyMode, setBatchQtyMode] = useState<BatchQtyMode>('custom');
  const [includeZeroStockAsOne, setIncludeZeroStockAsOne] = useState<boolean>(true);

  // Manual input per item map for copies
  const [customCopiesMap, setCustomCopiesMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      map[item.id] = Math.max(1, item.quantity > 0 ? item.quantity : 1);
    });
    return map;
  });

  // Quick mass apply input value
  const [massManualQty, setMassManualQty] = useState<number>(5);

  // Manual Quantity Content per Label (Isi Kemasan yang tertulis di stiker label)
  const [packQtyMode, setPackQtyMode] = useState<'custom' | 'follow_stock'>('custom');
  const [manualPackQty, setManualPackQty] = useState<number>(1);

  // Document metadata for Barang Masuk & Barang Keluar
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayCompact = useMemo(() => new Date().toISOString().slice(0, 10).replace(/-/g, ''), []);

  const [docNumber, setDocNumber] = useState<string>(() => `PO-${todayCompact}-01`);
  const [docDate, setDocDate] = useState<string>(todayDateStr);
  const [partnerName, setPartnerName] = useState<string>('');

  // Update default document number prefix when category toggles
  useEffect(() => {
    if (labelCategory === 'IN') {
      setDocNumber((prev) => (prev.startsWith('DO-') ? `PO-${todayCompact}-01` : prev || `PO-${todayCompact}-01`));
    } else if (labelCategory === 'OUT') {
      setDocNumber((prev) => (prev.startsWith('PO-') ? `DO-${todayCompact}-01` : prev || `DO-${todayCompact}-01`));
    }
  }, [labelCategory, todayCompact]);

  // QR Code format: whether to prepend action prefix (IN:SKU or OUT:SKU) for quick automated scanning
  const [useActionPrefix, setUseActionPrefix] = useState<boolean>(true);

  // Search & filter inside batch selector
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<'all' | 'selected' | 'in_stock'>('all');

  // Single / Uniform copies per item (default 1 label satuan)
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);

  // Sheet layout: default 'auto' so label size adapts dynamically to the desired quantity
  const [sheetLayout, setSheetLayout] = useState<SheetLayoutType>('auto');

  // Toggleable elements on label
  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    showTitle: true,
    showSku: true,
    showLocation: true,
    showPrice: false,
    showBrand: true,
    showDocNumber: true,
    showDate: true,
    showQuantity: true,
    showPartner: true,
  });

  const [copied, setCopied] = useState(false);

  // Sync customCopiesMap if items update
  useEffect(() => {
    setCustomCopiesMap((prev) => {
      const updated = { ...prev };
      items.forEach((it) => {
        if (updated[it.id] === undefined) {
          updated[it.id] = Math.max(1, it.quantity > 0 ? it.quantity : 1);
        }
      });
      return updated;
    });
  }, [items]);

  const singleItem = items.find((i) => i.id === selectedItemId);

  // Compute QR code value
  const getRawCode = (it?: InventoryItem | null) => {
    if (it) return it.barcode || it.sku;
    return customCode || 'GDG-QR-001';
  };

  const getEncodedQR = (rawCode: string) => {
    if (!useActionPrefix) return rawCode;
    if (labelCategory === 'IN') return `IN:${rawCode}`;
    if (labelCategory === 'OUT') return `OUT:${rawCode}`;
    return rawCode;
  };

  const qrValue = getEncodedQR(getRawCode(singleItem));
  const itemName = singleItem ? singleItem.name : customName || 'Label Barang';
  const itemSku = singleItem ? singleItem.sku : customSku || 'SKU-GDG-001';
  const itemLocation = singleItem ? singleItem.location : 'Rak A-01';
  const itemPrice = singleItem ? singleItem.unitPrice : 0;
  const itemUnit = singleItem ? singleItem.unit : 'pcs';

  // Helper to determine copies for an item in batch mode
  const getBatchItemCopies = (item: InventoryItem): number => {
    if (batchQtyMode === 'follow_stock') {
      if (item.quantity <= 0) {
        return includeZeroStockAsOne ? 1 : 0;
      }
      return item.quantity;
    } else if (batchQtyMode === 'uniform') {
      return Math.max(1, copiesPerItem);
    } else {
      // 'custom' manual
      return Math.max(1, customCopiesMap[item.id] ?? (item.quantity > 0 ? item.quantity : 1));
    }
  };

  // Helper to determine quantity content written on the label
  const getLabelContentQty = (item: { quantity: number; unit: string }): { qty: number; text: string } => {
    if (packQtyMode === 'follow_stock') {
      return {
        qty: item.quantity,
        text: `${item.quantity} ${item.unit || 'pcs'}`,
      };
    }
    return {
      qty: manualPackQty,
      text: `${manualPackQty} ${item.unit || 'pcs'}`,
    };
  };

  // Build the list of labels to render on the sheet
  const printItemsList = useMemo(() => {
    if (mode === 'single') {
      const target = singleItem || {
        id: 'custom',
        sku: itemSku,
        barcode: customCode || 'GDG-QR-001',
        name: itemName,
        category: 'Umum',
        quantity: 0,
        minStock: 0,
        unit: itemUnit,
        unitPrice: itemPrice,
        location: itemLocation,
        supplier: partnerName,
        createdAt: '',
        lastUpdated: '',
      };
      return Array.from({ length: Math.max(1, copiesPerItem) }).map((_, idx) => ({
        ...target,
        uniqueKey: `${target.id}-copy-${idx}`,
        encodedQr: getEncodedQR(target.barcode || target.sku),
      }));
    } else {
      const selected = items.filter((i) => selectedBatchItemIds.includes(i.id));
      const list: Array<InventoryItem & { uniqueKey: string; encodedQr: string }> = [];

      selected.forEach((item) => {
        const count = getBatchItemCopies(item);
        const encoded = getEncodedQR(item.barcode || item.sku);
        for (let c = 0; c < count; c++) {
          list.push({
            ...item,
            uniqueKey: `${item.id}-copy-${c}`,
            encodedQr: encoded,
          });
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
    batchQtyMode,
    includeZeroStockAsOne,
    customCopiesMap,
    itemSku,
    customCode,
    itemName,
    itemPrice,
    itemLocation,
    itemUnit,
    partnerName,
    labelCategory,
    useActionPrefix,
  ]);

  // Total summary calculation
  const totalBatchCopies = useMemo(() => {
    if (mode === 'single') return copiesPerItem;
    const selected = items.filter((i) => selectedBatchItemIds.includes(i.id));
    return selected.reduce((sum, it) => sum + getBatchItemCopies(it), 0);
  }, [mode, items, selectedBatchItemIds, batchQtyMode, includeZeroStockAsOne, customCopiesMap, copiesPerItem]);

  // Filtered batch items list
  const filteredBatchItems = useMemo(() => {
    return items.filter((it) => {
      const q = batchSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.sku.toLowerCase().includes(q) ||
        (it.barcode && it.barcode.toLowerCase().includes(q)) ||
        it.location.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (batchFilter === 'selected') {
        return selectedBatchItemIds.includes(it.id);
      }
      if (batchFilter === 'in_stock') {
        return it.quantity > 0;
      }
      return true;
    });
  }, [items, batchSearch, batchFilter, selectedBatchItemIds]);

  const handleSelectAllBatch = () => {
    if (selectedBatchItemIds.length === items.length) {
      setSelectedBatchItemIds([]);
    } else {
      setSelectedBatchItemIds(items.map((i) => i.id));
    }
  };

  const handleSelectInStockOnly = () => {
    setSelectedBatchItemIds(items.filter((i) => i.quantity > 0).map((i) => i.id));
  };

  const handleToggleBatchItem = (id: string) => {
    setSelectedBatchItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSetCustomCopies = (itemId: string, val: number) => {
    const sanitized = Math.max(1, Math.min(500, val || 1));
    setCustomCopiesMap((prev) => ({
      ...prev,
      [itemId]: sanitized,
    }));
  };

  const handleApplyMassQty = () => {
    const qty = Math.max(1, massManualQty || 1);
    const updated: Record<string, number> = { ...customCopiesMap };
    selectedBatchItemIds.forEach((id) => {
      updated[id] = qty;
    });
    setCustomCopiesMap(updated);
    setBatchQtyMode('custom');
  };

  const handleApplyStockToCustom = () => {
    const updated: Record<string, number> = {};
    items.forEach((it) => {
      updated[it.id] = Math.max(1, it.quantity);
    });
    setCustomCopiesMap(updated);
    setBatchQtyMode('follow_stock');
  };

  const handleResetAllToOne = () => {
    const updated: Record<string, number> = {};
    items.forEach((it) => {
      updated[it.id] = 1;
    });
    setCustomCopiesMap(updated);
    setCopiesPerItem(1);
    setBatchQtyMode('custom');
  };

  const handleGenerateRandom = () => {
    setSelectedItemId('');
    const newSku = generateItemCode('Umum', labelCategory === 'IN' ? 'INB' : labelCategory === 'OUT' ? 'OUT' : 'QR');
    setCustomCode(newSku);
    setCustomSku(newSku);
    setCustomName(
      labelCategory === 'IN'
        ? 'Barang Masuk Baru'
        : labelCategory === 'OUT'
        ? 'Barang Siap Kirim'
        : 'Item QR Otomatis'
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = ' ';
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Effective layout: if 'auto', automatically adapt label size based on total items to print
  const effectiveLayout: Exclude<SheetLayoutType, 'auto'> = useMemo(() => {
    if (sheetLayout !== 'auto') return sheetLayout;
    const count = printItemsList.length;
    if (count === 1) return 'single-large';
    if (count === 2) return 'grid-2';
    if (count <= 4) return 'grid-4';
    if (count <= 6) return 'grid-6';
    if (count <= 12) return 'grid-12';
    if (count <= 24) return 'grid-24';
    return 'grid-40';
  }, [sheetLayout, printItemsList.length]);

  // Items per page based on effective layout format
  const itemsPerPage = useMemo(() => {
    switch (effectiveLayout) {
      case 'single-large':
        return 1;
      case 'grid-2':
        return 2;
      case 'grid-4':
        return 4;
      case 'grid-6':
        return 6;
      case 'grid-12':
        return 12;
      case 'grid-40':
        return 40;
      case 'thermal':
      case 'thermal-80':
        return 1;
      case 'grid-24':
      default:
        return 24;
    }
  }, [effectiveLayout]);

  // Estimated sheets calculation
  const getEstimatedSheets = () => {
    const total = printItemsList.length;
    if (effectiveLayout === 'thermal' || effectiveLayout === 'thermal-80' || effectiveLayout === 'single-large') {
      return total;
    }
    return Math.ceil(total / itemsPerPage);
  };

  // Label description for layout name
  const getLayoutLabel = (layout: Exclude<SheetLayoutType, 'auto'>) => {
    switch (layout) {
      case 'single-large':
        return '1 Label Besar Box/Pallet (~155×105mm)';
      case 'grid-2':
        return '2 Label Besar A4 (~165×115mm)';
      case 'grid-4':
        return '4 Label Sedang A4 (~90×115mm)';
      case 'grid-6':
        return '6 Label Sedang A4 (~90×76mm)';
      case 'grid-12':
        return '12 Label Standar A4 (~92×40mm)';
      case 'grid-24':
        return '24 Label Standar Rak A4 (~63×31.5mm)';
      case 'grid-40':
        return '40 Label Ringkas A4 (~47×24mm)';
      case 'thermal':
        return 'Thermal Roll 50×40mm';
      case 'thermal-80':
        return 'Thermal Roll 80×50mm';
    }
  };

  // Split into physical print pages to prevent spillover and duplicate copies
  const pagedPrintItems = useMemo(() => {
    const pages: Array<typeof printItemsList> = [];
    for (let i = 0; i < printItemsList.length; i += itemsPerPage) {
      pages.push(printItemsList.slice(i, i + itemsPerPage));
    }
    return pages.length > 0 ? pages : [[]];
  }, [printItemsList, itemsPerPage]);

  // Grid classes based on effective sheet layout
  const getGridClasses = () => {
    switch (effectiveLayout) {
      case 'single-large':
        return 'flex flex-col items-center justify-center w-full';
      case 'grid-2':
        return 'grid grid-cols-1 gap-y-[5mm] w-full max-w-[170mm] mx-auto';
      case 'grid-4':
        return 'grid grid-cols-2 gap-x-[4mm] gap-y-[4mm] w-full max-w-[190mm] mx-auto';
      case 'grid-6':
        return 'grid grid-cols-2 gap-x-[4mm] gap-y-[3mm] w-full max-w-[190mm] mx-auto';
      case 'grid-12':
        return 'grid grid-cols-2 gap-x-[3.5mm] gap-y-[2.5mm] w-full max-w-[190mm] mx-auto';
      case 'grid-40':
        return 'grid grid-cols-4 gap-x-[1.5mm] gap-y-[1.2mm] w-full max-w-[192mm] mx-auto';
      case 'thermal':
      case 'thermal-80':
        return 'flex flex-col gap-0 items-center justify-center w-full';
      case 'grid-24':
      default:
        return 'grid grid-cols-3 gap-x-[2.5mm] gap-y-[1.8mm] w-full max-w-[192mm] mx-auto';
    }
  };

  const getQRSizeForLayout = () => {
    switch (effectiveLayout) {
      case 'single-large':
        return 96;
      case 'grid-2':
        return 78;
      case 'grid-4':
        return 64;
      case 'grid-6':
        return 54;
      case 'grid-12':
        return 42;
      case 'grid-40':
        return 24;
      case 'thermal':
        return 38;
      case 'thermal-80':
        return 50;
      case 'grid-24':
      default:
        return 34;
    }
  };

  const getPageStyle = () => {
    if (effectiveLayout === 'thermal') {
      return {
        width: '48mm',
        minHeight: '38mm',
        margin: '0 auto',
        padding: '0.5mm',
        boxSizing: 'border-box' as const,
      };
    }
    if (effectiveLayout === 'thermal-80') {
      return {
        width: '76mm',
        minHeight: '48mm',
        margin: '0 auto',
        padding: '0.5mm',
        boxSizing: 'border-box' as const,
      };
    }
    if (effectiveLayout === 'single-large') {
      return {
        width: '100%',
        margin: '0 auto',
        padding: '6mm 0',
        boxSizing: 'border-box' as const,
      };
    }
    if (effectiveLayout === 'grid-2') {
      return {
        width: '100%',
        margin: '0 auto',
        padding: '4mm 0',
        boxSizing: 'border-box' as const,
      };
    }
    return {
      width: '100%',
      margin: '0 auto',
      padding: '2mm 0',
      boxSizing: 'border-box' as const,
    };
  };

  const getItemClasses = () => {
    switch (effectiveLayout) {
      case 'single-large':
        return 'w-[155mm] h-[105mm] border-2 border-black rounded-lg p-3 mx-auto';
      case 'grid-2':
        return 'w-full h-[115mm] border-2 border-black rounded-md p-3 mx-auto';
      case 'grid-4':
        return 'w-full h-[115mm] border-2 border-black rounded-md p-2.5 mx-auto';
      case 'grid-6':
        return 'w-full h-[76mm] border border-black rounded-md p-2 mx-auto';
      case 'grid-12':
        return 'w-full h-[40mm] border border-black rounded-sm p-[2mm]';
      case 'grid-40':
        return 'w-full h-[23.5mm] border border-black rounded-xs p-[0.8mm]';
      case 'thermal':
        return 'w-[48mm] h-[38mm] border border-black rounded-xs p-[1.5mm] mx-auto';
      case 'thermal-80':
        return 'w-[76mm] h-[48mm] border border-black rounded-xs p-[2mm] mx-auto';
      case 'grid-24':
      default:
        return 'w-full h-[32mm] border border-black rounded-sm p-[1.2mm]';
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* PRINTABLE PORTAL DIRECTLY AT DOCUMENT.BODY LEVEL          */}
      {/* This ensures #root has display:none in print, preventing  */}
      {/* layout flow overflow or duplicate 2nd page copies.        */}
      {/* ========================================================= */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="print-portal-root" className="hidden print:block w-full bg-white text-black p-0 m-0 print:static">
            <style>{`
              @media print {
                @page {
                  size: ${
                    effectiveLayout === 'thermal'
                      ? '50mm 40mm'
                      : effectiveLayout === 'thermal-80'
                      ? '80mm 50mm'
                      : 'A4 portrait'
                  };
                  margin: ${
                    effectiveLayout.startsWith('thermal') ? '1mm' : '6mm 6mm'
                  };
                }
              }
            `}</style>
            {pagedPrintItems.map((pageItems, pageIdx) => {
              const isLastPage = pageIdx === pagedPrintItems.length - 1;
              return (
                <div
                  key={`print-page-${pageIdx}`}
                  className={`w-full bg-white text-black box-border ${
                    !isLastPage
                      ? 'break-after-page page-break-after-always'
                      : 'break-after-auto page-break-after-avoid'
                  }`}
                  style={getPageStyle()}
                >
                  <div className={getGridClasses()}>
                    {pageItems.map((it) => {
                      const packInfo = getLabelContentQty(it);
                      const isLarge = effectiveLayout === 'single-large';
                      const isMedium = effectiveLayout === 'grid-2' || effectiveLayout === 'grid-4';
                      const isMid = effectiveLayout === 'grid-6';
                      const isGrid12 = effectiveLayout === 'grid-12';
                      const isGrid40 = effectiveLayout === 'grid-40';

                      return (
                        <div
                          key={it.uniqueKey}
                          className={`flex flex-col items-center justify-between text-center bg-white break-inside-avoid page-break-inside-avoid relative box-border overflow-hidden ${getItemClasses()}`}
                        >
                          {/* Distinct Label Header for Inbound / Outbound / General */}
                          <div className={`w-full ${isLarge ? 'mb-1.5' : isMedium ? 'mb-1' : 'mb-0.5'} shrink-0`}>
                            {labelCategory === 'IN' ? (
                              <div className={`border-b border-black pb-0.5 flex items-center justify-between px-0.5 ${isLarge ? 'border-b-2 pb-1' : ''}`}>
                                <span className={`${isLarge ? 'text-xs font-black' : isMedium ? 'text-[10px] font-black' : isGrid40 ? 'text-[6px] font-black' : 'text-[7px] font-black'} uppercase tracking-wider text-black flex items-center gap-0.5 leading-none`}>
                                  <span>▼</span>
                                  <span>BARANG MASUK</span>
                                </span>
                                <span className={`${isLarge ? 'text-[10px] font-extrabold border-2' : isMedium ? 'text-[8px] font-bold border' : isGrid40 ? 'text-[5.5px] font-bold' : 'text-[6px] font-bold border'} uppercase tracking-tight text-black px-0.5 rounded-xs leading-none`}>
                                  PENERIMAAN
                                </span>
                              </div>
                            ) : labelCategory === 'OUT' ? (
                              <div className={`border-b border-black pb-0.5 flex items-center justify-between px-0.5 ${isLarge ? 'border-b-2 pb-1' : ''}`}>
                                <span className={`${isLarge ? 'text-xs font-black' : isMedium ? 'text-[10px] font-black' : isGrid40 ? 'text-[6px] font-black' : 'text-[7px] font-black'} uppercase tracking-wider text-black flex items-center gap-0.5 leading-none`}>
                                  <span>▲</span>
                                  <span>BARANG KELUAR</span>
                                </span>
                                <span className={`${isLarge ? 'text-[10px] font-extrabold border-2' : isMedium ? 'text-[8px] font-bold border' : isGrid40 ? 'text-[5.5px] font-bold' : 'text-[6px] font-bold border'} uppercase tracking-tight text-black px-0.5 rounded-xs leading-none`}>
                                  PENGELUARAN
                                </span>
                              </div>
                            ) : (
                              labelConfig.showBrand && (
                                <div className={`border-b border-black pb-0.5 flex items-center justify-between px-0.5 ${isLarge ? 'border-b-2 pb-1' : ''}`}>
                                  <span className={`${isLarge ? 'text-xs font-black' : isMedium ? 'text-[10px] font-black' : isGrid40 ? 'text-[6px] font-extrabold' : 'text-[7px] font-extrabold'} uppercase tracking-wider text-black leading-none`}>
                                    PRA LOGISTICS
                                  </span>
                                  <span className={`${isLarge ? 'text-[10px] font-bold' : isGrid40 ? 'text-[5.5px] font-bold' : 'text-[6px] font-bold'} text-black font-mono leading-none`}>
                                    RAK STOK
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          {/* Item Name */}
                          {labelConfig.showTitle && (
                            <span
                              className={`font-black leading-none truncate w-full text-black block shrink-0 ${
                                isLarge
                                  ? 'text-sm mb-1'
                                  : isMedium
                                  ? 'text-xs mb-0.5'
                                  : isMid
                                  ? 'text-[10px] mb-0.5'
                                  : isGrid12
                                  ? 'text-[9px] mb-0.5'
                                  : isGrid40
                                  ? 'text-[6.5px] my-0.2'
                                  : 'text-[7.5px] my-0.2'
                              }`}
                            >
                              {it.name}
                            </span>
                          )}

                          {/* QR Code Renderer */}
                          <div className="my-auto flex items-center justify-center shrink-0">
                            <QRCodeRenderer
                              value={it.encodedQr}
                              size={getQRSizeForLayout()}
                              includeMargin={false}
                            />
                          </div>

                          {/* Footer Details */}
                          <div className={`w-full text-black shrink-0 ${isLarge ? 'space-y-1' : 'space-y-0.5'}`}>
                            {labelConfig.showSku && (
                              <span
                                className={`font-mono font-bold block leading-none truncate ${
                                  isLarge
                                    ? 'text-sm tracking-widest'
                                    : isMedium
                                    ? 'text-xs tracking-wider'
                                    : isMid
                                    ? 'text-[9px] tracking-wider'
                                    : isGrid12
                                    ? 'text-[8.5px] tracking-wider'
                                    : isGrid40
                                    ? 'text-[6px]'
                                    : 'text-[7.5px] tracking-wider'
                                }`}
                              >
                                {it.sku}
                              </span>
                            )}

                            {/* Manual Quantity Content printed on label */}
                            {labelConfig.showQuantity && (
                              <div
                                className={`font-mono font-bold border border-black/80 rounded-xs bg-slate-50 leading-none ${
                                  isLarge
                                    ? 'text-xs py-1 px-3 border-2 my-1'
                                    : isMedium
                                    ? 'text-[9px] py-0.5 px-2 my-0.5'
                                    : isGrid12
                                    ? 'text-[7.5px] py-0.5 px-1.5'
                                    : isGrid40
                                    ? 'text-[5px] py-[1px] px-0.5'
                                    : 'text-[6px] py-[1px] px-1'
                                }`}
                              >
                                <span>ISI: </span>
                                <span className="font-black underline">{packInfo.text}</span>
                              </div>
                            )}

                            {/* Document and location metadata */}
                            <div
                              className={`flex flex-wrap items-center justify-center gap-x-1 font-mono leading-none truncate ${
                                isLarge
                                  ? 'text-xs font-bold mt-0.5'
                                  : isMedium
                                  ? 'text-[8.5px] font-semibold'
                                  : isGrid12
                                  ? 'text-[7px]'
                                  : isGrid40
                                  ? 'text-[5px]'
                                  : 'text-[5.5px]'
                              }`}
                            >
                              {labelConfig.showDocNumber && docNumber && (
                                <span className="font-semibold">
                                  {labelCategory === 'OUT' ? 'SJ:' : 'REF:'}{docNumber}
                                </span>
                              )}
                              {labelConfig.showLocation && (
                                <span>• RAK:{it.location}</span>
                              )}
                              {labelConfig.showDate && docDate && (
                                <span>• {docDate}</span>
                              )}
                              {labelCategory === 'GENERAL' && labelConfig.showPrice && it.unitPrice > 0 && (
                                <span>• {formatRupiah(it.unitPrice)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>,
          document.body
        )}

      {/* ========================================================= */}
      {/* INTERACTIVE MODAL (COMPLETELY HIDDEN IN PRINT)            */}
      {/* ========================================================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:hidden">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl text-white shadow-xs ${
                labelCategory === 'IN'
                  ? 'bg-emerald-600'
                  : labelCategory === 'OUT'
                  ? 'bg-rose-600'
                  : 'bg-indigo-600'
              }`}
            >
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Studio Cetak Label QR Code Gudang</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    labelCategory === 'IN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : labelCategory === 'OUT'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {labelCategory === 'IN'
                    ? 'Label Barang Masuk'
                    : labelCategory === 'OUT'
                    ? 'Label Barang Keluar'
                    : 'Label Rak Inventory'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pilih kategori label, atur jumlah manual per barang atau sama rata, dan cetak multi-salinan
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
        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* ========================================================================= */}
          {/* 1. PEMISAH LABEL: BARANG MASUK vs BARANG KELUAR vs STANDAR INVENTORY */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Pilih Kategori / Format Label:</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Pisahkan penanda visual, header dokumen, dan format aksi QR Code secara spesifik.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useActionPrefix}
                    onChange={(e) => setUseActionPrefix(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Sertakan Prefix Aksi QR ({labelCategory === 'IN' ? 'IN:' : labelCategory === 'OUT' ? 'OUT:' : '-'})</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Tab 1: Label Barang Masuk */}
              <button
                type="button"
                onClick={() => setLabelCategory('IN')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  labelCategory === 'IN'
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-500 shadow-xs'
                    : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      Label Barang Masuk
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                      INBOUND
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Untuk penerimaan barang, no. PO / batch, tanggal masuk, dan penanda wadah receiving.
                  </p>
                </div>
              </button>

              {/* Tab 2: Label Barang Keluar */}
              <button
                type="button"
                onClick={() => setLabelCategory('OUT')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  labelCategory === 'OUT'
                    ? 'bg-white border-rose-600 ring-2 ring-rose-500 shadow-xs'
                    : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-rose-600" />
                      Label Barang Keluar
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                      OUTBOUND
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Untuk pengeluaran barang, no. Surat Jalan/DO, tujuan expedisi, dan packing pengiriman.
                  </p>
                </div>
              </button>

              {/* Tab 3: Label Standar Inventory */}
              <button
                type="button"
                onClick={() => setLabelCategory('GENERAL')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  labelCategory === 'GENERAL'
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-500 shadow-xs'
                    : 'bg-white/80 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      Label Rak / Master
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-800">
                      GENERAL
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Identitas permanen master inventory, kode lokasi rak gudang, dan harga jual barang.
                  </p>
                </div>
              </button>
            </div>

            {/* Dokumen & Keterangan Masuk / Keluar Input Fields */}
            {(labelCategory === 'IN' || labelCategory === 'OUT') && (
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span>{labelCategory === 'IN' ? 'No. PO / Ref Masuk:' : 'No. Surat Jalan / DO:'}</span>
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder={labelCategory === 'IN' ? 'Contoh: PO-2026-001' : 'Contoh: DO-2026-001'}
                    className="w-full px-3 py-1.5 text-xs font-mono font-semibold border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{labelCategory === 'IN' ? 'Tanggal Penerimaan:' : 'Tanggal Pengeluaran:'}</span>
                  </label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{labelCategory === 'IN' ? 'Pemasok / Supplier:' : 'Tujuan / Penerima:'}</span>
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder={labelCategory === 'IN' ? 'Nama supplier...' : 'Nama customer / cabang...'}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. MODE CETAK: SATU BARANG VS BANYAK BARANG (BATCH) */}
          {/* ========================================================================= */}
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
                <span>Satu Barang (Input Jumlah Salinan)</span>
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
                <span>Banyak Barang (Batch Multi-Item)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-slate-500 font-medium">Total Label Siap Cetak:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs">
                {printItemsList.length} Label
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. INPUT JUMLAH SECARA MANUAL & PILIHAN BARANG */}
          {/* ========================================================================= */}
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
                        [{it.sku}] {it.name} (Stok: {it.quantity} {it.unit}, Rak: {it.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Jumlah Lembar Cetak Manual */}
                <div className="p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      <span>Jumlah Label yang Ingin Dicetak:</span>
                    </label>
                    <span className="text-[11px] font-bold text-indigo-700 font-mono bg-indigo-100/70 px-2.5 py-0.5 rounded-md">
                      {copiesPerItem} Label ({getEstimatedSheets()} Lembar {effectiveLayout.startsWith('thermal') ? 'Roll' : 'A4'})
                    </span>
                  </div>

                  {/* Auto-Fit size indicator */}
                  <div className="mb-2.5 px-2.5 py-1.5 bg-white/90 rounded-xl border border-indigo-200/70 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                      <span>Ukuran Cetak:</span>
                      <strong className="text-slate-900">{getLayoutLabel(effectiveLayout)}</strong>
                    </span>
                    {sheetLayout === 'auto' ? (
                      <span className="px-1.5 py-0.5 bg-indigo-600 text-white font-extrabold rounded-md text-[9px] uppercase tracking-wider">
                        ⚡ Auto-Fit
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSheetLayout('auto')}
                        className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer text-[10px]"
                      >
                        Kembalikan Auto-Fit
                      </button>
                    )}
                  </div>

                  {/* Primary Quick Options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setCopiesPerItem(1)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        copiesPerItem === 1
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
                      }`}
                    >
                      1 Label (Satuan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopiesPerItem(2)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        copiesPerItem === 2
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
                      }`}
                    >
                      2 Label (A4 Pas)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopiesPerItem(4)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        copiesPerItem === 4
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
                      }`}
                    >
                      4 Label (Grid 2x2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCopiesPerItem(singleItem?.quantity && singleItem.quantity > 0 ? singleItem.quantity : 1)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        singleItem?.quantity && copiesPerItem === singleItem.quantity
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      Stok ({singleItem?.quantity || 1}x)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCopiesPerItem((prev) => Math.max(1, prev - 1))}
                      disabled={copiesPerItem <= 1}
                      className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 font-bold shadow-xs cursor-pointer shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={copiesPerItem}
                      onChange={(e) =>
                        setCopiesPerItem(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                      }
                      className="flex-1 px-3 py-1.5 text-center text-sm font-bold font-mono border-2 border-indigo-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setCopiesPerItem((prev) => prev + 1)}
                      className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 font-bold shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Additional Preset Multiples */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className="text-[10px] text-slate-400 font-medium mr-1">Kelipatan:</span>
                    {[1, 2, 4, 6, 12, 24, 40, 100].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setCopiesPerItem(qty)}
                        className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          copiesPerItem === qty
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50'
                        }`}
                      >
                        {qty}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom manual inputs if no item chosen */}
              {!selectedItemId && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Input Data Label Manual Bebas
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateRandom}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Acak Kode SKU
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Isi / Nilai Kode QR
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
            /* ========================================================================= */
            /* BATCH MULTI-ITEM SECTION WITH DIRECT MANUAL QUANTITY EDITING */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Strategy Selector Tabs */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-indigo-600" />
                      <span>Metode Penentuan Jumlah Label Cetak:</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pilih input manual per barang, input manual sama rata, atau ikuti stok fisik.
                    </p>
                  </div>
                  {batchQtyMode === 'custom' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 self-start sm:self-auto">
                      ✓ Input Manual Bebas per Barang
                    </span>
                  )}
                  {batchQtyMode === 'follow_stock' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                      ✓ 1:1 Sesuai Stok Fisik
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Custom Manual Per Item */}
                  <button
                    type="button"
                    onClick={() => setBatchQtyMode('custom')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      batchQtyMode === 'custom'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500 shadow-xs'
                        : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                          Input Manual per Barang
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-700">
                          MANUAL
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Ketik bebas jumlah lembar label masing-masing barang di daftar bawah.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Uniform Copies */}
                  <button
                    type="button"
                    onClick={() => setBatchQtyMode('uniform')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      batchQtyMode === 'uniform'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500 shadow-xs'
                        : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-700" />
                        Jumlah Sama Rata
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Semua barang terpilih dicetak dengan satu angka manual yang sama.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Follow Stock */}
                  <button
                    type="button"
                    onClick={() => setBatchQtyMode('follow_stock')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      batchQtyMode === 'follow_stock'
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500 shadow-xs'
                        : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Ikuti Stok Inventory
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Jumlah label otomatis mengikuti stok unit fisik barang di gudang.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Sub-toolbar based on chosen strategy */}
                {batchQtyMode === 'custom' && (
                  <div className="pt-2.5 border-t border-indigo-100/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 text-[11px] font-medium">Terapkan manual ke semua terpilih:</span>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={massManualQty}
                        onChange={(e) => setMassManualQty(Math.max(1, Number(e.target.value) || 1))}
                        className="w-14 px-2 py-1 text-center font-mono font-bold text-xs border border-indigo-300 rounded-lg bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleApplyMassQty}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyStockToCustom}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Salin dari Stok Fisik
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAllToOne}
                        className="px-2.5 py-1 bg-white text-slate-600 border border-slate-200 rounded-lg font-bold text-[11px] hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Set Semua 1x
                      </button>
                    </div>
                  </div>
                )}

                {batchQtyMode === 'uniform' && (
                  <div className="pt-2.5 border-t border-indigo-100/80 flex flex-wrap items-center gap-3 text-xs">
                    <label className="font-bold text-slate-700">
                      Input Jumlah Label Sama Rata:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCopiesPerItem((prev) => Math.max(1, prev - 1))}
                        className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={copiesPerItem}
                        onChange={(e) =>
                          setCopiesPerItem(Math.max(1, Math.min(500, Number(e.target.value) || 1)))
                        }
                        className="w-16 px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-900 text-center font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setCopiesPerItem((prev) => prev + 1)}
                        className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 24, 50].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setCopiesPerItem(qty)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            copiesPerItem === qty
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {qty}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {batchQtyMode === 'follow_stock' && (
                  <div className="pt-2 border-t border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={includeZeroStockAsOne}
                        onChange={(e) => setIncludeZeroStockAsOne(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Cetak 1 label penanda wadah/rak jika stok barang saat ini 0</span>
                    </label>
                    <span className="text-[11px] text-indigo-700 font-medium">
                      Total: {printItemsList.length} Label dari {selectedBatchItemIds.length} Barang
                    </span>
                  </div>
                )}
              </div>

              {/* Search bar & Selection Filter */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={batchSearch}
                      onChange={(e) => setBatchSearch(e.target.value)}
                      placeholder="Cari nama barang, SKU, atau rak gudang..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    {batchSearch && (
                      <button
                        type="button"
                        onClick={() => setBatchSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setBatchFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        batchFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua ({items.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchFilter('selected')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        batchFilter === 'selected'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Terpilih ({selectedBatchItemIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchFilter('in_stock')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        batchFilter === 'in_stock'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ada Stok ({items.filter((i) => i.quantity > 0).length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllBatch}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      {selectedBatchItemIds.length === items.length
                        ? 'Batalkan Semua Pilihan'
                        : 'Pilih Semua Barang'}
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleSelectInStockOnly}
                      className="font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Pilih Hanya yang Ada Stok
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {selectedBatchItemIds.length} item dipilih •{' '}
                    <strong className="text-indigo-700 font-bold">{printItemsList.length} total label</strong>
                  </span>
                </div>
              </div>

              {/* Items interactive list with direct manual quantity inputs */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 p-1 bg-slate-50/50">
                {filteredBatchItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Tidak ada barang yang cocok dengan pencarian atau filter.
                  </div>
                ) : (
                  filteredBatchItems.map((it) => {
                    const isChecked = selectedBatchItemIds.includes(it.id);
                    const itemCopies = getBatchItemCopies(it);

                    return (
                      <div
                        key={it.id}
                        className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors ${
                          isChecked ? 'bg-indigo-50/70' : 'hover:bg-white'
                        }`}
                      >
                        {/* Checkbox + Name + SKU + Location */}
                        <div
                          onClick={() => handleToggleBatchItem(it.id)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-slate-900 font-bold block truncate">
                              {it.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span className="font-bold text-indigo-700">SKU: {it.sku}</span>
                              <span>•</span>
                              <span>Rak: {it.location}</span>
                              <span>•</span>
                              <span className="text-slate-600 font-semibold">
                                Stok: {it.quantity} {it.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Manual Quantity Steppers & Direct Input */}
                        <div className="flex items-center gap-2 shrink-0">
                          {batchQtyMode === 'custom' && isChecked ? (
                            <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-xl p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCustomCopies(it.id, itemCopies - 1);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                                title="Kurangi 1 lembar"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={itemCopies}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSetCustomCopies(it.id, Number(e.target.value) || 1);
                                }}
                                className="w-12 text-center text-xs font-bold font-mono text-slate-900 border-none bg-transparent focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetCustomCopies(it.id, itemCopies + 1);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
                                title="Tambah 1 lembar"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="text-[10px] text-slate-400 font-medium pr-1.5">
                                lbr
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold ${
                                isChecked
                                  ? batchQtyMode === 'follow_stock'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isChecked ? `${itemCopies} Label` : '0 Label'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. PENGATURAN ISI KUANTITAS PER LABEL (LABEL PACK CONTENT) */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={labelConfig.showQuantity}
                  onChange={(e) =>
                    setLabelConfig({ ...labelConfig, showQuantity: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-900">
                  Cetak Informasi Jumlah / Isi Kemasan pada Fisik Stiker Label
                </span>
              </label>

              {labelConfig.showQuantity && (
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setPackQtyMode('custom')}
                    className={`px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      packQtyMode === 'custom'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Input Manual Sama Rata
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackQtyMode('follow_stock')}
                    className={`px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      packQtyMode === 'follow_stock'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sesuai Stok Barang
                  </button>
                </div>
              )}
            </div>

            {labelConfig.showQuantity && packQtyMode === 'custom' && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-600 font-medium">Isi / Kuantitas per Wadah Label:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setManualPackQty((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={manualPackQty}
                    onChange={(e) =>
                      setManualPackQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-20 px-2.5 py-1 text-center font-mono font-bold border border-slate-200 rounded-lg bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setManualPackQty((prev) => prev + 1)}
                    className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 5, 10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setManualPackQty(qty)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        manualPackQty === qty
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
                <span className="text-slate-400 text-[11px] italic">
                  (Tertulis di stiker label: "JUMLAH / ISI: {manualPackQty} pcs/unit")
                </span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5. SHEET LAYOUT & LABEL ELEMENTS SETTINGS */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-slate-100">
            {/* Layout options */}
            <div className="md:col-span-7 space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pilih Format Layout Kertas / Printer:</span>
              </label>

              <div className="space-y-2">
                {/* Auto-Fit Button */}
                <button
                  type="button"
                  onClick={() => setSheetLayout('auto')}
                  className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    sheetLayout === 'auto'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          ⚡ Otomatis Sesuai Jumlah Label
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-600 text-white">
                          AUTO-FIT
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Menyesuaikan otomatis: <span className="font-bold text-indigo-700">{getLayoutLabel(effectiveLayout)}</span>
                      </p>
                    </div>
                  </div>
                  {sheetLayout === 'auto' && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-600 text-white shrink-0 ml-2">
                      Aktif
                    </span>
                  )}
                </button>

                {/* Specific Layout Grids */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'single-large',
                      title: '1 Label Besar',
                      desc: '~155×105mm (Box / Pallet)',
                    },
                    {
                      id: 'grid-2',
                      title: '2 Label Besar',
                      desc: 'A4 ~165×115mm (Vertikal)',
                    },
                    {
                      id: 'grid-4',
                      title: '4 Label Sedang',
                      desc: 'A4 ~90×115mm (2x2)',
                    },
                    {
                      id: 'grid-6',
                      title: '6 Label Sedang',
                      desc: 'A4 ~90×76mm (2x3)',
                    },
                    {
                      id: 'grid-12',
                      title: '12 Label Standar',
                      desc: 'A4 ~92×40mm (2x6)',
                    },
                    {
                      id: 'grid-24',
                      title: '24 Label Standar',
                      desc: 'A4 ~63×31.5mm (3x8)',
                    },
                    {
                      id: 'grid-40',
                      title: '40 Label Ringkas',
                      desc: 'A4 ~47×24mm (4x10)',
                    },
                    {
                      id: 'thermal',
                      title: 'Thermal 50×40',
                      desc: 'Sticker barcode roll',
                    },
                    {
                      id: 'thermal-80',
                      title: 'Thermal 80×50',
                      desc: 'Sticker roll lebar',
                    },
                  ].map((ly) => (
                    <button
                      key={ly.id}
                      type="button"
                      onClick={() => setSheetLayout(ly.id as SheetLayoutType)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        sheetLayout === ly.id
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-1 ring-indigo-500 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{ly.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ly.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Label elements toggle */}
            <div className="md:col-span-5 space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Elemen Tambahan pada Label:</span>
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
                    checked={labelConfig.showDocNumber}
                    onChange={(e) =>
                      setLabelConfig({ ...labelConfig, showDocNumber: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>No. PO / DO</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={labelConfig.showDate}
                    onChange={(e) =>
                      setLabelConfig({ ...labelConfig, showDate: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tanggal</span>
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

          {/* ========================================================================= */}
          {/* 6. PRATINJAU LANGSUNG LABEL (LIVE PREVIEW) */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs shrink-0">
                <QRCodeRenderer
                  value={qrValue}
                  size={75}
                  includeMargin={false}
                />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      labelCategory === 'IN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : labelCategory === 'OUT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {labelCategory === 'IN'
                      ? '▼ LABEL BARANG MASUK'
                      : labelCategory === 'OUT'
                      ? '▲ LABEL BARANG KELUAR'
                      : 'PRA LOGISTICS'}
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold font-mono">
                    Ukuran: {getLayoutLabel(effectiveLayout)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    QR: {qrValue}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{itemName}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
                  <span className="font-bold text-indigo-700">SKU: {itemSku}</span>
                  <span>•</span>
                  <span>Rak: {itemLocation}</span>
                  {labelConfig.showQuantity && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-slate-800 bg-slate-200/70 px-1.5 rounded">
                        Isi: {manualPackQty} {itemUnit}
                      </span>
                    </>
                  )}
                  {docNumber && (
                    <>
                      <span>•</span>
                      <span>{labelCategory === 'OUT' ? 'SJ:' : 'REF:'} {docNumber}</span>
                    </>
                  )}
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

        {/* Anti-Cutoff Print Guidance Tip */}
        <div className="mx-6 mb-4 px-3.5 py-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-extrabold text-sm">✓</span>
            <span>
              <strong>Format Anti-Terpotong Aktif:</strong> Dimensi QR dan margin telah dioptimalkan presisi. Pada dialog print browser, pilih ukuran kertas <strong>{effectiveLayout.startsWith('thermal') ? 'Thermal Roll' : 'A4'}</strong> dan Margin <strong>Default / Minimum</strong>.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="text-xs text-slate-500 hidden sm:block">
            {mode === 'batch'
              ? `${selectedBatchItemIds.length} item dipilih • ${printItemsList.length} label (${getEstimatedSheets()} lembar) • Format: ${getLayoutLabel(effectiveLayout)}`
              : `${copiesPerItem} label (${getEstimatedSheets()} lembar ${effectiveLayout.startsWith('thermal') ? 'roll' : 'A4'}) • Format: ${getLayoutLabel(effectiveLayout)}`}
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
              className={`px-5 py-2.5 text-xs font-bold active:scale-95 text-white rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer ${
                labelCategory === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : labelCategory === 'OUT'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                Cetak {printItemsList.length} Label Sekarang ({getEstimatedSheets()} Lembar {effectiveLayout.startsWith('thermal') ? 'Roll' : 'A4'})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
