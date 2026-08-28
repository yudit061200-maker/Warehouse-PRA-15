import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ReferenceItem, GoogleSheetsConfig } from '../types';
import { referenceService } from '../services/referenceService';
import {
  DEFAULT_SPREADSHEET_URL,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_GID,
} from '../services/googleSheets';
import { formatRupiah } from '../utils/formatters';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Barcode,
  Copy,
  Trash2,
  Edit2,
  PackagePlus,
  ArrowDownLeft,
  Check,
  RotateCcw,
  Upload,
  ClipboardPaste,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  X,
  HelpCircle,
} from 'lucide-react';

interface ReferenceCatalogTabProps {
  onUseForNewItem: (refItem: ReferenceItem) => void;
  onQuickStockIn?: (refItem: ReferenceItem) => void;
}

const ITEMS_PER_PAGE = 50;

export const ReferenceCatalogTab: React.FC<ReferenceCatalogTabProps> = ({
  onUseForNewItem,
  onQuickStockIn,
}) => {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() =>
    referenceService.getSheetsConfig()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync & Status States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Spreadsheet URL input state
  const [sheetUrlInput, setSheetUrlInput] = useState(
    sheetsConfig.spreadsheetUrl || DEFAULT_SPREADSHEET_URL
  );
  const [isEditingSheetUrl, setIsEditingSheetUrl] = useState(false);

  // Copy notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CSV Import Modal (Upload / Paste)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal for Manual Reference Item Add/Edit
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const [refItemToDelete, setRefItemToDelete] = useState<ReferenceItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formSupplier, setFormSupplier] = useState('');
  const [formLocation, setFormLocation] = useState('Gudang Utama');
  const [formBarcode, setFormBarcode] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Load initial items
  const reloadReferenceItems = () => {
    const loaded = referenceService.getReferenceItems();
    setItems(loaded);
    setSheetsConfig(referenceService.getSheetsConfig());
  };

  useEffect(() => {
    reloadReferenceItems();
  }, []);

  // Google Sheets Live Sync Handler (Server proxy first, no CORS or Firebase popup errors)
  const handleSyncSheets = async () => {
    try {
      setIsSyncing(true);
      setSyncErrorMsg(null);
      setSyncSuccessMsg(null);

      const targetUrl = sheetUrlInput.trim() || DEFAULT_SPREADSHEET_URL;
      const result = await referenceService.syncWithGoogleSheets(targetUrl);

      setItems(result.items);
      setSheetsConfig(result.config);
      setCurrentPage(1);
      setSyncSuccessMsg(
        `Berhasil menyinkronkan ${result.items.length.toLocaleString('id-ID')} item pedoman dari Google Sheets (${result.sheetTitle})!`
      );
      setIsEditingSheetUrl(false);
    } catch (err: any) {
      console.warn('Sync notice:', err);
      setSyncErrorMsg(
        err.message ||
          'Gagal menarik data dari Google Sheets. Pastikan link spreadsheet dapat diakses atau gunakan opsi Unggah File CSV.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset to Default seed
  const handleExecuteReset = () => {
    const reset = referenceService.resetToDefault();
    setItems(reset);
    setCurrentPage(1);
    setIsResetConfirmOpen(false);
    setSyncSuccessMsg('Data katalog acuan berhasil direset ke standar awal.');
    setSyncErrorMsg(null);
  };

  // Handle File Upload (.csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File kosong atau tidak dapat dibaca');
        const imported = referenceService.importFromCSVText(text, `File (${file.name})`);
        setItems(imported);
        setCurrentPage(1);
        setIsImportModalOpen(false);
        setSyncSuccessMsg(`Berhasil mengimpor ${imported.length.toLocaleString('id-ID')} item dari file ${file.name}!`);
        setSyncErrorMsg(null);
      } catch (err: any) {
        setPasteError(err.message || 'Gagal memproses file CSV');
      }
    };
    reader.readAsText(file);
  };

  // Handle Paste CSV Submit
  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setPasteError('Harap tempel teks CSV terlebih dahulu.');
      return;
    }
    try {
      const imported = referenceService.importFromCSVText(pasteText.trim(), 'Tempel CSV Manual');
      setItems(imported);
      setCurrentPage(1);
      setPasteText('');
      setPasteError(null);
      setIsImportModalOpen(false);
      setSyncSuccessMsg(`Berhasil mengimpor ${imported.length.toLocaleString('id-ID')} item dari teks CSV!`);
      setSyncErrorMsg(null);
    } catch (err: any) {
      setPasteError(err.message || 'Format teks CSV tidak valid.');
    }
  };

  // Filter Categories
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  // Filtered Reference Items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      if (!matchesCat) return false;

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        (item.supplier && item.supplier.toLowerCase().includes(q)) ||
        (item.defaultLocation && item.defaultLocation.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, selectedCategory]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const handleCopyDetail = (item: ReferenceItem) => {
    const text = `Kode: ${item.code} | Nama: ${item.name} | Kategori: ${item.category} | Satuan: ${item.unit} | Barcode: ${item.barcode || item.code}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = (item: ReferenceItem) => {
    setRefItemToDelete(item);
  };

  const handleExecuteDeleteRef = () => {
    if (!refItemToDelete) return;
    referenceService.deleteReferenceItem(refItemToDelete.id);
    reloadReferenceItems();
    setSyncSuccessMsg(`Item pedoman "${refItemToDelete.name}" (${refItemToDelete.code}) berhasil dihapus.`);
    setRefItemToDelete(null);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCode(`REF-${(items.length + 1).toString().padStart(4, '0')}`);
    setFormName('');
    setFormCategory('Suku Cadang & Mekanik');
    setFormUnit('pcs');
    setFormPrice(50000);
    setFormSupplier('');
    setFormLocation('Rak A-01');
    setFormBarcode('');
    setFormDescription('');
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: ReferenceItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormUnit(item.unit);
    setFormPrice(item.standardPrice || 0);
    setFormSupplier(item.supplier || '');
    setFormLocation(item.defaultLocation || 'Gudang Utama');
    setFormBarcode(item.barcode || item.code);
    setFormDescription(item.description || '');
    setIsItemModalOpen(true);
  };

  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      alert('Kode dan Nama Barang wajib diisi!');
      return;
    }

    if (editingItem) {
      referenceService.updateReferenceItem(editingItem.id, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory.trim(),
        unit: formUnit.trim(),
        standardPrice: formPrice,
        supplier: formSupplier.trim() || undefined,
        defaultLocation: formLocation.trim() || 'Gudang Utama',
        barcode: formBarcode.trim() || formCode.trim(),
        description: formDescription.trim() || undefined,
      });
    } else {
      referenceService.addReferenceItem({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory.trim(),
        unit: formUnit.trim(),
        standardPrice: formPrice,
        supplier: formSupplier.trim() || undefined,
        defaultLocation: formLocation.trim() || 'Gudang Utama',
        barcode: formBarcode.trim() || formCode.trim(),
        description: formDescription.trim() || undefined,
      });
    }

    reloadReferenceItems();
    setIsItemModalOpen(false);
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Top Banner Card: Clean, Minimalist, Modern */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Katalog Data Pedoman & Master Acuan</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Sinkronisasi Google Spreadsheet
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tarik otomatis daftar nama barang, kode SKU/part number, satuan, dan kelompok kategori dari Google Sheets secara instan tanpa hambatan popup atau perizinan manual.
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleSyncSheets}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet'}</span>
            </button>

            <button
              onClick={() => {
                setPasteError(null);
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Unggah / Tempel CSV</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Acuan Manual</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Link & Config Section */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-medium text-slate-500 shrink-0">Tautan Spreadsheet:</span>
            {isEditingSheetUrl ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                />
                <button
                  onClick={handleSyncSheets}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                >
                  Tarik Sekarang
                </button>
                <button
                  onClick={() => {
                    setSheetUrlInput(sheetsConfig.spreadsheetUrl || DEFAULT_SPREADSHEET_URL);
                    setIsEditingSheetUrl(false);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg shrink-0 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md max-w-md truncate">
                  {sheetsConfig.spreadsheetUrl || DEFAULT_SPREADSHEET_URL}
                </span>
                <button
                  onClick={() => setIsEditingSheetUrl(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
                >
                  Ubah Link
                </button>
                <a
                  href={sheetsConfig.spreadsheetUrl || DEFAULT_SPREADSHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Sheet</span>
                </a>
              </div>
            )}
          </div>

          {/* Sync Stats Pill */}
          <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {items.length.toLocaleString('id-ID')} Total Pedoman
            </span>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              title="Reset ke data awal standar"
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {syncSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSyncSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {syncErrorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{syncErrorMsg}</span>
            </div>
            <button
              onClick={() => setSyncErrorMsg(null)}
              className="text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama barang, kode SKU/part number, kategori, barcode..."
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Item Count Display */}
          <div className="text-xs text-slate-500 font-medium shrink-0 flex items-center gap-2">
            <span>Ditemukan:</span>
            <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md">
              {filteredItems.length.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-400 mr-1 text-[11px] font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Grup:
          </span>
          {categories.slice(0, 15).map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'ALL' ? 'Semua Grup' : cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {label}
              </button>
            );
          })}
          {categories.length > 15 && (
            <span className="text-slate-400 text-xs px-2 whitespace-nowrap">
              +{categories.length - 15} grup lainnya
            </span>
          )}
        </div>
      </div>

      {/* Main Reference Items Table & Mobile Cards */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Desktop / Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[140px]">Kode / SKU</th>
                <th className="py-3.5 px-4 min-w-[280px]">Nama Barang Pedoman</th>
                <th className="py-3.5 px-4 min-w-[160px]">Kategori / Grup</th>
                <th className="py-3.5 px-4 min-w-[90px] text-center">Satuan</th>
                <th className="py-3.5 px-4 min-w-[130px]">Barcode</th>
                <th className="py-3.5 px-4 min-w-[200px] text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Tidak ada data pedoman yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ganti kata kunci pencarian atau klik tombol "Tarik Data dari Spreadsheet".
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                  const isCopied = copiedId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 text-xs md:text-sm leading-snug line-clamp-2">
                          {item.name}
                        </div>
                        {item.description && item.description !== item.name && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md max-w-[180px] truncate">
                          {item.category || 'Umum'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-md">
                          {item.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.barcode || item.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Use for New Inventory Item */}
                          <button
                            onClick={() => onUseForNewItem(item)}
                            title="Gunakan data ini untuk mendaftarkan barang baru ke master inventory"
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Daftarkan</span>
                          </button>

                          {/* Quick Stock In */}
                          {onQuickStockIn && (
                            <button
                              onClick={() => onQuickStockIn(item)}
                              title="Catat mutasi barang masuk langsung dengan pedoman ini"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Copy detail */}
                          <button
                            onClick={() => handleCopyDetail(item)}
                            title="Salin rincian barang"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Edit item */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit data pedoman"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete item */}
                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="Hapus dari daftar acuan"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Smartphone Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 p-4">
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Tidak ada data pedoman yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">
                Coba ganti kata kunci pencarian atau filter kategori.
              </p>
            </div>
          ) : (
            paginatedItems.map((item, index) => {
              const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
              const isCopied = copiedId === item.id;

              return (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] text-slate-400 font-mono">#{globalIndex}</span>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {item.code}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-md">
                          {item.unit || 'pcs'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug break-words">
                        {item.name}
                      </h4>
                      {item.description && item.description !== item.name && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-600 truncate">
                      Kategori: <strong className="text-slate-800">{item.category || 'Umum'}</strong>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-slate-400" />
                      {item.barcode || item.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      onClick={() => onUseForNewItem(item)}
                      className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs min-h-[36px]"
                    >
                      <PackagePlus className="w-3.5 h-3.5 shrink-0" />
                      <span>Daftarkan ke Inventory</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {onQuickStockIn && (
                        <button
                          onClick={() => onQuickStockIn(item)}
                          title="Mutasi Masuk"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyDetail(item)}
                        title="Salin rincian"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit data"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        title="Hapus data"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan{' '}
            <span className="font-semibold text-slate-800">
              {filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
            </span>{' '}
            dari <span className="font-semibold text-slate-800">{filteredItems.length.toLocaleString('id-ID')}</span> item
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {refItemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Item dari Katalog Pedoman?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Data acuan ini akan dihapus dari katalog pedoman master.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-900">{refItemToDelete.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                Kode: <strong className="text-indigo-600">{refItemToDelete.code}</strong> • Kategori: <strong>{refItemToDelete.category}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRefItemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteRef}
                className="px-4.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Acuan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Reset Katalog ke Data Standar Bawaan?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Semua penyesuaian lokal akan digantikan dengan 40+ daftar barang standar bawaan sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-4.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ya, Reset Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal (Upload / Paste) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Impor Data Pedoman (CSV)</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              <button
                onClick={() => setImportMode('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  importMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unggah File .CSV
              </button>
              <button
                onClick={() => setImportMode('paste')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  importMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tempel Teks (Paste)
              </button>
            </div>

            {pasteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{pasteError}</span>
              </div>
            )}

            {importMode === 'upload' ? (
              <div className="space-y-4 py-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer space-y-2"
                >
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Klik untuk memilih file CSV</p>
                  <p className="text-xs text-slate-400">Format file yang didukung: .csv (Export dari Sheets/Excel)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Urutan Kolom Otomatis Terdeteksi:</p>
                  <p className="text-slate-400">Header kolom seperti <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">ID, Item Name, Default Unit of Measure, Item Group</code> akan dipetakan otomatis.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Tempel data baris CSV langsung (termasuk baris header di baris pertama):
                </p>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`ID,Item Name,Default Unit of Measure,Item Group\n10.13.0098,Oil Separator Primary F/ Air Compressor,Ea,10.13 All Kind Of Filters\n10.13.0097,Oil Separator Secondary,Ea,10.13 All Kind Of Filters`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  onClick={handlePasteSubmit}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Proses & Simpan Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Reference Item Add/Edit Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Edit Data Pedoman' : 'Tambah Barang Pedoman Baru'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode / SKU Pedoman *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Oil Separator Primary Sullair"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori / Grup
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Contoh: Filter Mesin"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan (UoM)
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="pcs / Ea / roll"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="Default = Kode SKU"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs"
                >
                  Simpan Data Pedoman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
