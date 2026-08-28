import { InventoryItem, Transaction, WarehouseAnalytics } from '../types';

const API_BASE = '/api';

export const api = {
  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetch(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error('Gagal mengambil data inventory');
    const json = await res.json();
    return json.data;
  },

  async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menambahkan barang');
    }
    return json.data;
  },

  async updateItem(id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memperbarui barang');
    }
    return json.data;
  },

  async deleteItem(id: string): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menghapus barang');
    }
    return json.data;
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) throw new Error('Gagal mengambil riwayat transaksi');
    const json = await res.json();
    return json.data;
  },

  async recordTransaction(data: {
    itemId?: string;
    barcode?: string;
    sku?: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    referenceNumber?: string;
    partner?: string;
    notes?: string;
    operator?: string;
    unitCost?: number;
  }): Promise<{ transaction: Transaction; updatedItem: InventoryItem; isLowStock: boolean }> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal mencatat transaksi stok');
    }
    return json.data;
  },

  // Analytics
  async getAnalytics(): Promise<WarehouseAnalytics> {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Gagal memuat analitik gudang');
    const json = await res.json();
    return json.data;
  },

  // Google Sheets Proxy Fetch
  async fetchSpreadsheetData(payload: {
    url?: string;
    spreadsheetId?: string;
    gid?: string;
    accessToken?: string;
  }): Promise<{ rows: string[][]; totalRows: number; sheetTitle: string; source: string }> {
    const res = await fetch(`${API_BASE}/sheets/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const err = new Error(json.error || 'Gagal menarik data dari spreadsheet');
      (err as any).requiresAuth = !!json.requiresAuth;
      throw err;
    }
    return json;
  },
};
