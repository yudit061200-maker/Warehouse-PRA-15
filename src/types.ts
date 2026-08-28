export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  location: string;
  supplier?: string;
  description?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber: string; // PO, DO, Surat Jalan, dsb.
  partner: string; // Supplier / Customer / Tujuan Divisi
  notes?: string;
  operator: string;
  timestamp: string;
  unitCost?: number;
}

export interface StockAlert {
  item: InventoryItem;
  status: 'OUT_OF_STOCK' | 'CRITICAL_LOW' | 'WARNING';
  deficit: number;
  percentageRemaining: number;
}

export interface DailyTrend {
  date: string;
  displayDate: string;
  inQty: number;
  outQty: number;
  inTransactions: number;
  outTransactions: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  totalQty: number;
  totalValue: number;
}

export interface FastMovingItem {
  itemId: string;
  sku: string;
  name: string;
  category: string;
  outQty: number;
  inQty: number;
  currentStock: number;
  turnoverRatio: number;
}

export interface WarehouseAnalytics {
  totalSkus: number;
  totalStockQuantity: number;
  totalValuation: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  todayInQuantity: number;
  todayOutQuantity: number;
  todayTransactionsCount: number;
  trends: DailyTrend[];
  categories: CategoryBreakdown[];
  fastMoving: FastMovingItem[];
  alerts: StockAlert[];
}

export type ActiveTab = 'dashboard' | 'inventory' | 'stock-in' | 'stock-out' | 'scanner' | 'barcode-generator' | 'reference-catalog' | 'reports';

// Reference / Master Catalog Item (Data Pedoman / Acuan Input)
// Tidak masuk ke dalam hitungan stok fisik gudang sebelum didaftarkan/diinput ke inventory
export interface ReferenceItem {
  id: string;
  code: string; // Kode / SKU Acuan
  name: string; // Nama Barang Acuan
  category: string; // Kategori Acuan
  unit: string; // Satuan Standar (pcs, box, roll, kg, dll)
  standardPrice: number; // Harga Pedoman / Acuan Standar
  minStockRecommendation?: number; // Rekomendasi Batas Minimum
  supplier?: string; // Supplier / Rekomendasi Sumber
  defaultLocation?: string; // Rekomendasi Rak / Lokasi
  barcode?: string; // Barcode Acuan
  description?: string; // Spesifikasi / Deskripsi
  source?: string; // Sumber (misal: "Google Spreadsheet", "Manual", dll)
  sheetRow?: number; // Baris spreadsheet (jika ada)
  createdAt?: string;
  lastUpdated?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetUrl: string;
  spreadsheetId: string;
  gid: string;
  sheetTitle: string;
  lastSyncedAt?: string;
  totalSyncedCount: number;
}

