import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ReferenceItem } from '../types';
import { referenceService } from '../services/referenceService';
import { formatRupiah } from '../utils/formatters';
import {
  Search,
  Sparkles,
  ChevronDown,
  X,
  FileSpreadsheet,
  Building2,
  MapPin,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AutofillReferenceSelectorProps {
  onSelectReference: (item: ReferenceItem) => void;
  selectedCode?: string;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const AutofillReferenceSelector: React.FC<AutofillReferenceSelectorProps> = ({
  onSelectReference,
  placeholder = 'Ketik Nama, SKU, atau Barcode dari Katalog Pedoman Sheets...',
  className = '',
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [referenceItems, setReferenceItems] = useState<ReferenceItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const items = referenceService.getReferenceItems();
    setReferenceItems(items);
  }, []);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return referenceItems.slice(0, 8);
    }
    return referenceItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.barcode && item.barcode.includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          (item.supplier && item.supplier.toLowerCase().includes(q)) ||
          (item.defaultLocation &&
            item.defaultLocation.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [query, referenceItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[activeIdx]) {
        handleSelectItem(filteredItems[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: ReferenceItem) => {
    setSelectedItem(item);
    setQuery(item.name);
    setIsOpen(false);
    onSelectReference(item);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setSelectedItem(null);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Autofill dari Pedoman Data (Google Sheets)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            {referenceItems.length} Data Acuan
          </span>
        </div>
      )}

      {/* Main Search Input Container */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`relative flex items-center rounded-xl border transition-all cursor-text bg-white ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-emerald-300/80 hover:border-emerald-400'
        }`}
      >
        <div className="pl-3.5 pr-1 text-emerald-600">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full py-2.5 pl-2 pr-10 text-xs md:text-sm bg-transparent text-slate-900 placeholder-slate-400 focus:outline-hidden"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Results Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
          {/* Header in dropdown */}
          <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Pilih Barang untuk Autofill Otomatis Form
            </span>
            <span className="text-emerald-700 font-mono text-[10px]">
              {filteredItems.length} hasil
            </span>
          </div>

          {/* List items */}
          <div className="overflow-y-auto p-2 space-y-1.5">
            {filteredItems.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  Tidak ada data pedoman yang cocok
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Coba kata kunci lain atau buka tab "Pedoman Data" untuk sinkronisasi ulang dengan Google Sheets.
                </p>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = selectedItem?.id === item.id;
                const isActive = idx === activeIdx;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors text-left flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-emerald-50/80 text-slate-900 border border-emerald-300'
                        : isSelected
                        ? 'bg-emerald-50/50 border border-emerald-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          {item.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {item.category}
                        </span>
                        <span className="font-semibold text-slate-700 font-mono">
                          {formatRupiah(item.standardPrice)} / {item.unit}
                        </span>
                        {item.supplier && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Building2 className="w-3 h-3" />
                            {item.supplier}
                          </span>
                        )}
                        {item.defaultLocation && (
                          <span className="flex items-center gap-1 text-slate-400 font-mono">
                            <MapPin className="w-3 h-3" />
                            {item.defaultLocation}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Autofill</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Pedoman data acuan (bukan stok fisik gudang)</span>
            <span>Tekan Enter untuk memilih</span>
          </div>
        </div>
      )}
    </div>
  );
};
