import { ReferenceItem, GoogleSheetsConfig } from '../types';
import { api } from './api';
import {
  INITIAL_REFERENCE_ITEMS,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_GID,
  DEFAULT_SPREADSHEET_URL,
  extractSpreadsheetInfo,
  fetchPublicSpreadsheetCSV,
  fetchSpreadsheetMetadata,
  fetchSpreadsheetValues,
  parseSpreadsheetRowsToReferenceItems,
  parseCSV,
} from './googleSheets';

const LOCAL_STORAGE_REF_KEY = 'gudangpro_reference_catalog_v2';
const LOCAL_STORAGE_SHEETS_CONFIG_KEY = 'gudangpro_sheets_config_v2';

// In-memory cache for ultra-fast access and support for large catalogs (15,000+ items)
let inMemoryReferenceItems: ReferenceItem[] | null = null;

export const referenceService = {
  // Get all reference items (from memory, local cache, or initial seed)
  getReferenceItems(): ReferenceItem[] {
    if (inMemoryReferenceItems && inMemoryReferenceItems.length > 0) {
      return inMemoryReferenceItems;
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REF_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryReferenceItems = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading reference items from storage:', e);
    }

    // Initialize default seed
    inMemoryReferenceItems = INITIAL_REFERENCE_ITEMS;
    this.saveReferenceItems(INITIAL_REFERENCE_ITEMS);
    return INITIAL_REFERENCE_ITEMS;
  },

  // Save reference items safely (handles quota limitations gracefully)
  saveReferenceItems(items: ReferenceItem[]): void {
    inMemoryReferenceItems = items;
    try {
      // If dataset is very large, save a compact slice or full if quota allows
      const jsonStr = JSON.stringify(items);
      localStorage.setItem(LOCAL_STORAGE_REF_KEY, jsonStr);
    } catch (e) {
      console.warn('LocalStorage quota limit reached, keeping items in active memory state:', e);
      try {
        // Fallback: save first 3000 items in localStorage
        const compactSlice = items.slice(0, 3000);
        localStorage.setItem(LOCAL_STORAGE_REF_KEY, JSON.stringify(compactSlice));
      } catch (innerErr) {
        console.warn('Fallback storage warning:', innerErr);
      }
    }
  },

  // Get Sheets Configuration
  getSheetsConfig(): GoogleSheetsConfig {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SHEETS_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    const initialConfig: GoogleSheetsConfig = {
      spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      gid: DEFAULT_GID,
      sheetTitle: 'Sheet (Gid 1574728611)',
      lastSyncedAt: new Date().toISOString(),
      totalSyncedCount: INITIAL_REFERENCE_ITEMS.length,
    };
    this.saveSheetsConfig(initialConfig);
    return initialConfig;
  },

  // Save Sheets Configuration
  saveSheetsConfig(config: GoogleSheetsConfig): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_SHEETS_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving sheets config:', e);
    }
  },

  // Search in Reference Items
  search(query: string, category: string = 'ALL'): ReferenceItem[] {
    const items = this.getReferenceItems();
    const cleanQ = query.toLowerCase().trim();

    return items.filter((item) => {
      // Category check
      if (category !== 'ALL' && item.category !== category) {
        return false;
      }

      if (!cleanQ) return true;

      // Multi-field search
      return (
        item.name.toLowerCase().includes(cleanQ) ||
        item.code.toLowerCase().includes(cleanQ) ||
        (item.barcode && item.barcode.includes(cleanQ)) ||
        item.category.toLowerCase().includes(cleanQ) ||
        item.unit.toLowerCase().includes(cleanQ) ||
        (item.supplier && item.supplier.toLowerCase().includes(cleanQ)) ||
        (item.defaultLocation && item.defaultLocation.toLowerCase().includes(cleanQ)) ||
        (item.description && item.description.toLowerCase().includes(cleanQ))
      );
    });
  },

  // Add a new reference item
  addReferenceItem(itemData: Partial<ReferenceItem>): ReferenceItem {
    const items = this.getReferenceItems();
    const newItem: ReferenceItem = {
      id: `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      code:
        itemData.code?.trim().toUpperCase() ||
        `REF-${(items.length + 1).toString().padStart(4, '0')}`,
      name: itemData.name?.trim() || 'Barang Acuan',
      category: itemData.category?.trim() || 'Umum',
      unit: itemData.unit?.trim() || 'pcs',
      standardPrice: Number(itemData.standardPrice) || 0,
      minStockRecommendation: Number(itemData.minStockRecommendation) || 10,
      supplier: itemData.supplier?.trim(),
      defaultLocation: itemData.defaultLocation?.trim() || 'Gudang Utama',
      barcode: itemData.barcode?.trim() || itemData.code?.trim() || `8990${Date.now().toString().slice(-8)}`,
      description: itemData.description?.trim(),
      source: itemData.source || 'Manual Input',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    this.saveReferenceItems(updated);
    return newItem;
  },

  // Update existing reference item
  updateReferenceItem(id: string, updates: Partial<ReferenceItem>): ReferenceItem {
    const items = this.getReferenceItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Item data acuan tidak ditemukan');

    const updatedItem: ReferenceItem = {
      ...items[idx],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    items[idx] = updatedItem;
    this.saveReferenceItems(items);
    return updatedItem;
  },

  // Delete reference item
  deleteReferenceItem(id: string): void {
    const items = this.getReferenceItems();
    const filtered = items.filter((i) => i.id !== id);
    this.saveReferenceItems(filtered);
  },

  // Reset to default seed
  resetToDefault(): ReferenceItem[] {
    inMemoryReferenceItems = INITIAL_REFERENCE_ITEMS;
    this.saveReferenceItems(INITIAL_REFERENCE_ITEMS);
    return INITIAL_REFERENCE_ITEMS;
  },

  // Import from raw CSV text (upload or paste)
  importFromCSVText(csvText: string, sourceName: string = 'File CSV / Tempel Teks'): ReferenceItem[] {
    const rows = parseCSV(csvText);
    if (!rows || rows.length <= 1) {
      throw new Error('Format CSV tidak memiliki baris data.');
    }
    const parsedItems = parseSpreadsheetRowsToReferenceItems(rows, sourceName);
    if (parsedItems.length === 0) {
      throw new Error('Tidak ada data barang yang valid ditemukan dalam teks/file CSV.');
    }
    this.saveReferenceItems(parsedItems);
    return parsedItems;
  },

  // Sync with Google Sheets (Proxy server first, with fallbacks)
  async syncWithGoogleSheets(
    spreadsheetUrlOrId: string,
    accessToken?: string | null,
    sheetName?: string
  ): Promise<{ items: ReferenceItem[]; config: GoogleSheetsConfig; sheetTitle: string }> {
    const { id: spreadsheetId, gid } = extractSpreadsheetInfo(spreadsheetUrlOrId);

    let rows: (string | number | undefined)[][] = [];
    let targetSheetTitle = sheetName || `Sheet (Gid: ${gid})`;

    // 1. Try Backend Proxy First (Bypasses all browser CORS, iframe, and auth blockers for public/shared sheets)
    try {
      const serverResult = await api.fetchSpreadsheetData({
        url: spreadsheetUrlOrId,
        spreadsheetId,
        gid,
        accessToken: accessToken || undefined,
      });

      if (serverResult && serverResult.rows && serverResult.rows.length > 1) {
        rows = serverResult.rows;
        if (serverResult.sheetTitle) {
          targetSheetTitle = serverResult.sheetTitle;
        }
      }
    } catch (serverErr: any) {
      // If server returned requiresAuth or error, fallback to direct client logic
      console.warn('Backend proxy attempt notice:', serverErr);

      if (accessToken) {
        const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
        if (!sheetName) {
          if (gid && gid !== '0') {
            const foundByGid = metadata.sheets.find(
              (s) => s.properties.sheetId.toString() === gid
            );
            if (foundByGid) targetSheetTitle = foundByGid.properties.title;
          }
          if (!targetSheetTitle && metadata.sheets.length > 0) {
            targetSheetTitle = metadata.sheets[0].properties.title;
          }
        }
        const range = `'${targetSheetTitle}'!A1:Z5000`;
        rows = await fetchSpreadsheetValues(spreadsheetId, range, accessToken);
      } else {
        // Fallback to client CSV fetch
        try {
          const publicResult = await fetchPublicSpreadsheetCSV(spreadsheetId, gid);
          rows = publicResult.rows;
          targetSheetTitle = publicResult.sheetTitle;
        } catch (clientErr: any) {
          throw new Error(
            serverErr.message ||
              clientErr.message ||
              'Gagal mengakses Google Sheets. Pastikan link dapat diakses publik atau gunakan fitur Unggah CSV.'
          );
        }
      }
    }

    if (!rows || rows.length <= 1) {
      throw new Error(
        `Data tidak ditemukan pada lembar "${targetSheetTitle}". Pastikan lembar memiliki baris header dan data.`
      );
    }

    // Parse rows into reference items
    const parsedItems = parseSpreadsheetRowsToReferenceItems(
      rows,
      `Google Sheets (${targetSheetTitle})`
    );

    if (parsedItems.length === 0) {
      throw new Error('Tidak ada baris data barang yang berhasil dipetakan dari spreadsheet.');
    }

    // Save and update configuration
    this.saveReferenceItems(parsedItems);

    const newConfig: GoogleSheetsConfig = {
      spreadsheetUrl: spreadsheetUrlOrId.startsWith('http')
        ? spreadsheetUrlOrId
        : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`,
      spreadsheetId,
      gid,
      sheetTitle: targetSheetTitle,
      lastSyncedAt: new Date().toISOString(),
      totalSyncedCount: parsedItems.length,
    };
    this.saveSheetsConfig(newConfig);

    return {
      items: parsedItems,
      config: newConfig,
      sheetTitle: targetSheetTitle,
    };
  },
};

