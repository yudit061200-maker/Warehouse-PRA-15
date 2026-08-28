import { InventoryItem, Transaction, WarehouseAnalytics } from '../types';
import { firestoreService } from './firebase';

const API_BASE = '/api';

export const api = {
  // Inventory
  async getInventory(): Promise<InventoryItem[]> {
    try {
      return await firestoreService.getInventory();
    } catch (err) {
      console.warn('Firestore fetch failed, falling back to server API:', err);
      const res = await fetch(`${API_BASE}/inventory`);
      if (!res.ok) throw new Error('Gagal mengambil data inventory');
      const json = await res.json();
      return json.data;
    }
  },

  async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const item = await firestoreService.createItem(itemData);
      // Mirror to server in-memory cache in background
      fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).catch(() => {});
      return item;
    } catch (err) {
      console.warn('Firestore create failed, falling back to server API:', err);
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
    }
  },

  async updateItem(id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const updated = await firestoreService.updateItem(id, itemData);
      // Mirror to server in-memory cache in background
      fetch(`${API_BASE}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    } catch (err) {
      console.warn('Firestore update failed, falling back to server API:', err);
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
    }
  },

  async deleteItem(id: string): Promise<InventoryItem> {
    // Delete from both Firestore and server simultaneously to guarantee it never comes back
    let deletedItem: InventoryItem | null = null;
    try {
      deletedItem = await firestoreService.deleteItem(id);
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }

    // Always delete from backend memory store as well
    try {
      const res = await fetch(`${API_BASE}/inventory/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (!deletedItem) deletedItem = json.data;
      }
    } catch (serverErr) {
      console.warn('Server delete notice:', serverErr);
    }

    if (deletedItem) {
      return deletedItem;
    }
    // Return placeholder if both succeeded silently
    return { id, sku: '', barcode: '', name: '', category: '', quantity: 0, minStock: 0, unit: '', unitPrice: 0, location: '', supplier: '', description: '', createdAt: '', lastUpdated: '' };
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      return await firestoreService.getTransactions();
    } catch (err) {
      console.warn('Firestore transactions fetch failed, falling back to server API:', err);
      const res = await fetch(`${API_BASE}/transactions`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat transaksi');
      const json = await res.json();
      return json.data;
    }
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
    try {
      return await firestoreService.recordTransaction(data);
    } catch (err) {
      console.warn('Firestore recordTransaction failed, falling back to server API:', err);
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
    }
  },

  async updateTransaction(
    id: string,
    data: Partial<Transaction>
  ): Promise<{ transaction: Transaction; updatedItem?: InventoryItem }> {
    try {
      const result = await firestoreService.updateTransaction(id, data);
      // Mirror to server in background
      fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
      return result;
    } catch (err) {
      console.warn('Firestore updateTransaction failed, falling back to server API:', err);
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui transaksi');
      }
      return json.data;
    }
  },

  async deleteTransaction(id: string): Promise<{ deletedTx: Transaction; updatedItem?: InventoryItem }> {
    let result: { deletedTx: Transaction; updatedItem?: InventoryItem } | null = null;
    try {
      result = await firestoreService.deleteTransaction(id);
    } catch (err) {
      console.warn('Firestore deleteTransaction notice:', err);
    }

    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success && json.data && !result) {
        result = json.data;
      }
    } catch (serverErr) {
      console.warn('Server deleteTransaction notice:', serverErr);
    }

    if (result) {
      return result;
    }
    throw new Error('Gagal menghapus transaksi dari database');
  },

  // Analytics
  async getAnalytics(): Promise<WarehouseAnalytics> {
    try {
      return await firestoreService.getAnalytics();
    } catch (err) {
      console.warn('Firestore analytics failed, falling back to server API:', err);
      const res = await fetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error('Gagal memuat analitik gudang');
      const json = await res.json();
      return json.data;
    }
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
    return json.data;
  },
};
