import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  limit,
  Timestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { InventoryItem, Transaction, ReferenceItem, WarehouseAnalytics } from '../types';

export const firebaseConfig = firebaseConfigJson;

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection References
export const INVENTORY_COLLECTION = 'inventory';
export const TRANSACTIONS_COLLECTION = 'transactions';
export const REFERENCE_CATALOG_COLLECTION = 'reference_catalog';
export const SETTINGS_COLLECTION = 'settings';

// Initial realistic warehouse dataset to seed into Firestore if empty
export const INITIAL_INVENTORY_SEED: InventoryItem[] = [
  {
    id: 'item-1',
    sku: 'GDG-ELK-001',
    barcode: 'GDG-ELK-001',
    name: 'Kabel Power Industri 3-Phase 10M',
    category: 'Elektronik & Kelistrikan',
    quantity: 45,
    minStock: 20,
    unit: 'roll',
    unitPrice: 285000,
    location: 'Rak A-01',
    supplier: 'PT Surya Elektrik Mandiri',
    description: 'Kabel tembaga tebal standar SNI untuk suplai mesin pabrik',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-2',
    sku: 'GDG-ELK-002',
    barcode: 'GDG-ELK-002',
    name: 'Relay Omron 24V DC Industri',
    category: 'Elektronik & Kelistrikan',
    quantity: 8, // Low stock! (min 25)
    minStock: 25,
    unit: 'pcs',
    unitPrice: 65000,
    location: 'Rak A-02',
    supplier: 'PT Surya Elektrik Mandiri',
    description: 'Relay switching kontrol otomatisasi',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-3',
    sku: 'GDG-KMS-001',
    barcode: 'GDG-KMS-001',
    name: 'Karton Box Corrugated Double Wall (40x30x30)',
    category: 'Bahan Kemasan',
    quantity: 420,
    minStock: 100,
    unit: 'pcs',
    unitPrice: 8500,
    location: 'Zona Pallet B-01',
    supplier: 'CV Mitra Pack Prima',
    description: 'Kardus pengiriman heavy-duty tahan tumpuk',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-4',
    sku: 'GDG-KMS-002',
    barcode: 'GDG-KMS-002',
    name: 'Stretch Film Wrapping 50cm x 300m',
    category: 'Bahan Kemasan',
    quantity: 14, // Warning low stock (min 15)
    minStock: 15,
    unit: 'roll',
    unitPrice: 72000,
    location: 'Zona Pallet B-02',
    supplier: 'CV Mitra Pack Prima',
    description: 'Plastik wrapping pembungkus pallet logistik',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-5',
    sku: 'GDG-BB-001',
    barcode: 'GDG-BB-001',
    name: 'Biji Plastik Polypropylene (PP) Grade A',
    category: 'Bahan Baku',
    quantity: 1250,
    minStock: 500,
    unit: 'kg',
    unitPrice: 22000,
    location: 'Gudang Utama Silo 3',
    supplier: 'PT Chandra Polimer Global',
    description: 'Bahan baku cetak moulding wadah food-grade',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-6',
    sku: 'GDG-SKC-001',
    barcode: 'GDG-SKC-001',
    name: 'Bearing SKF 6205-2RSH Deep Groove',
    category: 'Suku Cadang & Mekanik',
    quantity: 0, // OUT OF STOCK!
    minStock: 12,
    unit: 'pcs',
    unitPrice: 115000,
    location: 'Rak C-04',
    supplier: 'PT Bearing Teknik Sejahtera',
    description: 'Bantalan laher kecepatan tinggi tahan debu',
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-7',
    sku: 'GDG-SKC-002',
    barcode: 'GDG-SKC-002',
    name: 'V-Belt Mitsuboshi B-58 Tahan Panas',
    category: 'Suku Cadang & Mekanik',
    quantity: 32,
    minStock: 10,
    unit: 'pcs',
    unitPrice: 95000,
    location: 'Rak C-05',
    supplier: 'PT Bearing Teknik Sejahtera',
    description: 'Sabuk transmisi tenaga motor penggerak konveyor',
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-8',
    sku: 'GDG-FNB-001',
    barcode: 'GDG-FNB-001',
    name: 'Sirup Konsentrat Gula Tebu Alami 5L',
    category: 'Makanan & Minuman',
    quantity: 65,
    minStock: 30,
    unit: 'pail',
    unitPrice: 180000,
    location: 'Zona Suhu Terkontrol D-01',
    supplier: 'PT Agro Sari Pangan',
    description: 'Bahan perisa alami untuk lini produksi minuman',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-9',
    sku: 'GDG-TKN-001',
    barcode: 'GDG-TKN-001',
    name: 'Sarung Tangan Nitrile Safety Heavy (Box 100)',
    category: 'Perlengkapan Kerja & Safety',
    quantity: 5, // Low stock (min 20)
    minStock: 20,
    unit: 'box',
    unitPrice: 85000,
    location: 'Lemari APD E-01',
    supplier: 'CV Safety Mandiri Nusantara',
    description: 'APD staf pergudangan tahan cairan kimia & minyak',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'item-10',
    sku: 'GDG-TKN-002',
    barcode: 'GDG-TKN-002',
    name: 'Cutter Pisau Heavy Duty + Refill Blade',
    category: 'Perlengkapan Kerja & Safety',
    quantity: 48,
    minStock: 15,
    unit: 'unit',
    unitPrice: 35000,
    location: 'Lemari APD E-02',
    supplier: 'CV Safety Mandiri Nusantara',
    description: 'Pisau unboxing pallet dan pemotong karton',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    lastUpdated: new Date().toISOString(),
  },
];

const daysAgo = (days: number, hour = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export const INITIAL_TRANSACTIONS_SEED: Transaction[] = [
  {
    id: 'tx-1',
    itemId: 'item-1',
    itemSku: 'GDG-ELK-001',
    itemName: 'Kabel Power Industri 3-Phase 10M',
    type: 'IN',
    quantity: 50,
    previousStock: 0,
    newStock: 50,
    referenceNumber: 'PO-2026-0810',
    partner: 'PT Surya Elektrik Mandiri',
    notes: 'Penerimaan batch bulanan kabel daya',
    operator: 'Budi Santoso',
    timestamp: daysAgo(6, 9, 30),
    unitCost: 285000,
  },
  {
    id: 'tx-2',
    itemId: 'item-1',
    itemSku: 'GDG-ELK-001',
    itemName: 'Kabel Power Industri 3-Phase 10M',
    type: 'OUT',
    quantity: 5,
    previousStock: 50,
    newStock: 45,
    referenceNumber: 'WO-PROD-401',
    partner: 'Divisi Perakitan Mesin 2',
    notes: 'Pengeluaran untuk instalasi lini produksi B',
    operator: 'Rian Pratama',
    timestamp: daysAgo(5, 14, 15),
  },
  {
    id: 'tx-3',
    itemId: 'item-3',
    itemSku: 'GDG-KMS-001',
    itemName: 'Karton Box Corrugated Double Wall (40x30x30)',
    type: 'IN',
    quantity: 500,
    previousStock: 120,
    newStock: 620,
    referenceNumber: 'PO-2026-0814',
    partner: 'CV Mitra Pack Prima',
    notes: 'Restock rutin karton kemasan',
    operator: 'Budi Santoso',
    timestamp: daysAgo(4, 11, 0),
    unitCost: 8500,
  },
  {
    id: 'tx-4',
    itemId: 'item-3',
    itemSku: 'GDG-KMS-001',
    itemName: 'Karton Box Corrugated Double Wall (40x30x30)',
    type: 'OUT',
    quantity: 200,
    previousStock: 620,
    newStock: 420,
    referenceNumber: 'DO-EXP-889',
    partner: 'Divisi Packing & Distribusi',
    notes: 'Pengemasan batch ekspor',
    operator: 'Siti Aminah',
    timestamp: daysAgo(3, 16, 45),
  },
  {
    id: 'tx-5',
    itemId: 'item-5',
    itemSku: 'GDG-BB-001',
    itemName: 'Biji Plastik Polypropylene (PP) Grade A',
    type: 'IN',
    quantity: 1500,
    previousStock: 50,
    newStock: 1550,
    referenceNumber: 'PO-2026-0818',
    partner: 'PT Chandra Polimer Global',
    notes: 'Pasokan biji plastik truk 1',
    operator: 'Budi Santoso',
    timestamp: daysAgo(2, 8, 30),
    unitCost: 22000,
  },
  {
    id: 'tx-6',
    itemId: 'item-5',
    itemSku: 'GDG-BB-001',
    itemName: 'Biji Plastik Polypropylene (PP) Grade A',
    type: 'OUT',
    quantity: 300,
    previousStock: 1550,
    newStock: 1250,
    referenceNumber: 'REQ-INJ-102',
    partner: 'Lini Cetak Injeksi Plastik',
    notes: 'Produksi shift pagi',
    operator: 'Rian Pratama',
    timestamp: daysAgo(1, 13, 10),
  },
  {
    id: 'tx-7',
    itemId: 'item-6',
    itemSku: 'GDG-SKC-001',
    itemName: 'Bearing SKF 6205-2RSH Deep Groove',
    type: 'OUT',
    quantity: 12,
    previousStock: 12,
    newStock: 0,
    referenceNumber: 'MNT-URG-092',
    partner: 'Tim Maintenance Pabrik',
    notes: 'Pergantian darurat bearing motor conveyor 4',
    operator: 'Ahmad Fauzi',
    timestamp: daysAgo(1, 15, 30),
  },
  {
    id: 'tx-8',
    itemId: 'item-9',
    itemSku: 'GDG-TKN-001',
    itemName: 'Sarung Tangan Nitrile Safety Heavy (Box 100)',
    type: 'OUT',
    quantity: 15,
    previousStock: 20,
    newStock: 5,
    referenceNumber: 'REQ-APD-202',
    partner: 'Seluruh Operator Shift 1 & 2',
    notes: 'Distribusi mingguan APD staf gudang',
    operator: 'Rian Pratama',
    timestamp: new Date().toISOString(),
  },
];

// Firebase Firestore Service Interface
export const firestoreService = {
  // Check and seed initial inventory & transactions if Firestore database is fresh
  async ensureInitialData(): Promise<void> {
    try {
      const initDocRef = doc(db, SETTINGS_COLLECTION, 'initial_seed_completed');
      const initSnap = await getDoc(initDocRef);

      // If initial seed has already run in the past, never re-seed deleted items
      if (initSnap.exists() && initSnap.data()?.seeded === true) {
        return;
      }

      // Check if local cache has seed flag
      if (typeof window !== 'undefined' && localStorage.getItem('gudangpro_seed_done_v2') === 'true') {
        await setDoc(initDocRef, { seeded: true, seededAt: new Date().toISOString() }, { merge: true });
        return;
      }

      const invRef = collection(db, INVENTORY_COLLECTION);
      const snapshot = await getDocs(query(invRef, limit(1)));

      if (snapshot.empty) {
        console.log('Firebase Firestore is empty. Seeding initial warehouse inventory and transactions once...');
        const batch = writeBatch(db);

        // Seed inventory items
        for (const item of INITIAL_INVENTORY_SEED) {
          const itemDocRef = doc(db, INVENTORY_COLLECTION, item.id);
          batch.set(itemDocRef, item);
        }

        // Seed transactions
        for (const tx of INITIAL_TRANSACTIONS_SEED) {
          const txDocRef = doc(db, TRANSACTIONS_COLLECTION, tx.id);
          batch.set(txDocRef, tx);
        }

        // Record initialization flag so items deleted by user are never re-seeded
        batch.set(initDocRef, { seeded: true, seededAt: new Date().toISOString(), version: '2.0' });

        await batch.commit();
        if (typeof window !== 'undefined') {
          localStorage.setItem('gudangpro_seed_done_v2', 'true');
        }
        console.log('Initial warehouse seed committed to Firestore successfully.');
      } else {
        // Database already has documents, mark as seeded permanently
        await setDoc(initDocRef, { seeded: true, seededAt: new Date().toISOString(), version: '2.0' }, { merge: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('gudangpro_seed_done_v2', 'true');
        }
      }
    } catch (err) {
      console.warn('Could not auto-seed Firestore:', err);
    }
  },

  // Get all inventory items from Firestore
  async getInventory(): Promise<InventoryItem[]> {
    try {
      await this.ensureInitialData();
      const invRef = collection(db, INVENTORY_COLLECTION);
      const q = query(invRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const items: InventoryItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as InventoryItem), id: docSnap.id });
      });

      return items;
    } catch (err) {
      console.error('Error fetching inventory from Firestore:', err);
      throw err;
    }
  },

  // Add / Create Inventory Item
  async createItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const sku = String(itemData.sku || '').trim().toUpperCase();
      const name = String(itemData.name || '').trim();

      if (!sku || !name) {
        throw new Error('Nama barang dan Kode Barang (SKU) wajib diisi.');
      }

      // Check for SKU duplicates
      const invRef = collection(db, INVENTORY_COLLECTION);
      const allItemsSnap = await getDocs(invRef);
      const duplicate = allItemsSnap.docs.some((d) => {
        const dData = d.data() as InventoryItem;
        return dData.sku?.toLowerCase() === sku.toLowerCase();
      });

      if (duplicate) {
        throw new Error(`Item Code (SKU) '${sku}' sudah terdaftar di database Firebase.`);
      }

      const finalBarcode =
        itemData.barcode && itemData.barcode.trim() !== ''
          ? itemData.barcode.trim()
          : sku;

      const id = itemData.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const newItem: InventoryItem = {
        id,
        sku,
        barcode: finalBarcode,
        name,
        category: itemData.category || 'Umum',
        quantity: Number(itemData.quantity) || 0,
        minStock: Number(itemData.minStock) || 10,
        unit: itemData.unit || 'pcs',
        unitPrice: Number(itemData.unitPrice) || 0,
        location: itemData.location || 'Area Umum',
        supplier: itemData.supplier || '',
        description: itemData.description || '',
        createdAt: itemData.createdAt || now,
        lastUpdated: now,
      };

      const docRef = doc(db, INVENTORY_COLLECTION, id);
      await setDoc(docRef, newItem);

      // If initial quantity > 0, record initial transaction directly into Firestore
      if (newItem.quantity > 0) {
        const txId = `tx-${Date.now()}`;
        const initialTx: Transaction = {
          id: txId,
          itemId: newItem.id,
          itemSku: newItem.sku,
          itemName: newItem.name,
          type: 'IN',
          quantity: newItem.quantity,
          previousStock: 0,
          newStock: newItem.quantity,
          referenceNumber: `INIT-${newItem.sku}`,
          partner: newItem.supplier || 'Pendaftaran Stok Awal',
          notes: 'Pencatatan stok awal saat pendaftaran barang baru',
          operator: 'Sistem GudangPro (Firebase)',
          timestamp: now,
          unitCost: newItem.unitPrice,
        };
        await setDoc(doc(db, TRANSACTIONS_COLLECTION, txId), initialTx);
      }

      return newItem;
    } catch (err) {
      console.error('Error creating item in Firestore:', err);
      throw err;
    }
  },

  // Update Inventory Item
  async updateItem(id: string, itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      const docRef = doc(db, INVENTORY_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Barang tidak ditemukan di Firebase');
      }

      const existing = snap.data() as InventoryItem;

      // If SKU changed, check duplicates
      if (itemData.sku && itemData.sku.trim().toUpperCase() !== existing.sku.toUpperCase()) {
        const invRef = collection(db, INVENTORY_COLLECTION);
        const allItemsSnap = await getDocs(invRef);
        const duplicate = allItemsSnap.docs.some((d) => {
          if (d.id === id) return false;
          const dData = d.data() as InventoryItem;
          return dData.sku?.toLowerCase() === itemData.sku?.trim().toLowerCase();
        });

        if (duplicate) {
          throw new Error(`SKU '${itemData.sku}' sudah digunakan oleh barang lain.`);
        }
      }

      const finalSku = itemData.sku !== undefined ? itemData.sku.trim().toUpperCase() : existing.sku;
      const finalBarcode =
        itemData.barcode !== undefined && itemData.barcode.trim() !== ''
          ? itemData.barcode.trim()
          : itemData.sku !== undefined
          ? finalSku
          : existing.barcode;

      const updated: InventoryItem = {
        ...existing,
        name: itemData.name !== undefined ? itemData.name.trim() : existing.name,
        category: itemData.category !== undefined ? itemData.category.trim() : existing.category,
        sku: finalSku,
        barcode: finalBarcode,
        quantity: itemData.quantity !== undefined ? Math.max(0, Number(itemData.quantity) || 0) : existing.quantity,
        minStock: itemData.minStock !== undefined ? Math.max(0, Number(itemData.minStock) || 0) : existing.minStock,
        unit: itemData.unit !== undefined ? itemData.unit.trim() : existing.unit,
        unitPrice: itemData.unitPrice !== undefined ? Math.max(0, Number(itemData.unitPrice) || 0) : existing.unitPrice,
        location: itemData.location !== undefined ? itemData.location.trim() : existing.location,
        supplier: itemData.supplier !== undefined ? itemData.supplier.trim() : existing.supplier,
        description: itemData.description !== undefined ? itemData.description.trim() : existing.description,
        lastUpdated: new Date().toISOString(),
      };

      await setDoc(docRef, updated);
      return updated;
    } catch (err) {
      console.error('Error updating item in Firestore:', err);
      throw err;
    }
  },

  // Delete Inventory Item
  async deleteItem(id: string): Promise<InventoryItem> {
    try {
      const docRef = doc(db, INVENTORY_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error('Barang tidak ditemukan');
      }
      const data = snap.data() as InventoryItem;
      await deleteDoc(docRef);
      return data;
    } catch (err) {
      console.error('Error deleting item from Firestore:', err);
      throw err;
    }
  },

  // Get all Transactions from Firestore
  async getTransactions(): Promise<Transaction[]> {
    try {
      await this.ensureInitialData();
      const txRef = collection(db, TRANSACTIONS_COLLECTION);
      const q = query(txRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const txs: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        txs.push({ ...(docSnap.data() as Transaction), id: docSnap.id });
      });

      return txs;
    } catch (err) {
      console.error('Error fetching transactions from Firestore:', err);
      throw err;
    }
  },

  // Record Stock IN / OUT / ADJUSTMENT directly in Firestore
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
      const { type, quantity } = data;
      const qty = Number(quantity);

      if (!type || isNaN(qty) || qty <= 0) {
        throw new Error('Tipe mutasi dan jumlah barang wajib valid (> 0)');
      }

      // Find item in Firestore
      const invRef = collection(db, INVENTORY_COLLECTION);
      const allItemsSnap = await getDocs(invRef);

      let targetDocSnap = allItemsSnap.docs.find((d) => {
        const item = d.data() as InventoryItem;
        if (data.itemId && d.id === data.itemId) return true;
        const b = data.barcode ? data.barcode.trim().toLowerCase() : '';
        const s = data.sku ? data.sku.trim().toLowerCase() : '';
        if (b && (item.barcode?.toLowerCase() === b || item.sku?.toLowerCase() === b)) return true;
        if (s && item.sku?.toLowerCase() === s) return true;
        return false;
      });

      if (!targetDocSnap) {
        throw new Error('Item barang tidak ditemukan di database Firebase Firestore');
      }

      const item = targetDocSnap.data() as InventoryItem;
      const prevStock = item.quantity || 0;
      let newStock = prevStock;

      if (type === 'IN') {
        newStock = prevStock + qty;
      } else if (type === 'OUT') {
        if (prevStock < qty) {
          throw new Error(
            `Stok tidak mencukupi! Stok saat ini: ${prevStock} ${item.unit}, Permintaan keluar: ${qty} ${item.unit}`
          );
        }
        newStock = prevStock - qty;
      } else if (type === 'ADJUSTMENT') {
        newStock = qty;
      }

      const now = new Date().toISOString();
      const updatedItem: InventoryItem = {
        ...item,
        quantity: newStock,
        lastUpdated: now,
      };

      const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newTx: Transaction = {
        id: txId,
        itemId: item.id,
        itemSku: item.sku,
        itemName: item.name,
        type,
        quantity: qty,
        previousStock: prevStock,
        newStock,
        referenceNumber:
          data.referenceNumber ||
          (type === 'IN' ? `IN-${Date.now().toString().slice(-6)}` : `OUT-${Date.now().toString().slice(-6)}`),
        partner: data.partner || (type === 'IN' ? (item.supplier || 'Supplier Umum') : 'Customer/Divisi'),
        notes: data.notes || '',
        operator: data.operator || 'Staf Pergudangan',
        timestamp: now,
        unitCost: data.unitCost || item.unitPrice,
      };

      // Atomic write or batch write
      const batch = writeBatch(db);
      batch.set(doc(db, INVENTORY_COLLECTION, item.id), updatedItem);
      batch.set(doc(db, TRANSACTIONS_COLLECTION, txId), newTx);
      await batch.commit();

      return {
        transaction: newTx,
        updatedItem,
        isLowStock: newStock <= item.minStock,
      };
    } catch (err) {
      console.error('Error recording transaction in Firestore:', err);
      throw err;
    }
  },

  // Update existing Transaction (Inbound / Outbound) in Firestore
  async updateTransaction(
    id: string,
    data: Partial<Transaction>
  ): Promise<{ transaction: Transaction; updatedItem?: InventoryItem }> {
    try {
      const txDocRef = doc(db, TRANSACTIONS_COLLECTION, id);
      const txSnap = await getDoc(txDocRef);
      if (!txSnap.exists()) {
        throw new Error('Data transaksi tidak ditemukan di database Firebase');
      }

      const existingTx = txSnap.data() as Transaction;
      const oldQty = existingTx.quantity || 0;
      const newQty = data.quantity !== undefined ? Math.max(1, Number(data.quantity)) : oldQty;
      const oldType = existingTx.type;
      const newType = data.type || oldType;

      let updatedItem: InventoryItem | undefined;
      const batch = writeBatch(db);

      // If item exists, adjust stock with the difference
      if (existingTx.itemId) {
        const itemDocRef = doc(db, INVENTORY_COLLECTION, existingTx.itemId);
        const itemSnap = await getDoc(itemDocRef);
        if (itemSnap.exists()) {
          const item = itemSnap.data() as InventoryItem;

          // Revert old effect
          let revertedStock = item.quantity;
          if (oldType === 'IN') {
            revertedStock -= oldQty;
          } else if (oldType === 'OUT') {
            revertedStock += oldQty;
          }

          // Apply new effect
          let finalStock = revertedStock;
          if (newType === 'IN') {
            finalStock += newQty;
          } else if (newType === 'OUT') {
            if (revertedStock < newQty) {
              throw new Error(
                `Stok barang tidak mencukupi! Tersedia: ${revertedStock} ${item.unit}, diminta keluar: ${newQty} ${item.unit}`
              );
            }
            finalStock -= newQty;
          }

          updatedItem = {
            ...item,
            quantity: Math.max(0, finalStock),
            lastUpdated: new Date().toISOString(),
          };

          batch.set(itemDocRef, updatedItem);
        }
      }

      const updatedTx: Transaction = {
        ...existingTx,
        quantity: newQty,
        type: newType,
        referenceNumber:
          data.referenceNumber !== undefined ? data.referenceNumber.trim() : existingTx.referenceNumber,
        partner: data.partner !== undefined ? data.partner.trim() : existingTx.partner,
        notes: data.notes !== undefined ? data.notes.trim() : existingTx.notes,
        operator: data.operator !== undefined ? data.operator.trim() : existingTx.operator,
        timestamp: data.timestamp !== undefined ? data.timestamp : existingTx.timestamp,
        unitCost: data.unitCost !== undefined ? Math.max(0, Number(data.unitCost)) : existingTx.unitCost,
        newStock: updatedItem ? updatedItem.quantity : existingTx.newStock,
      };

      batch.set(txDocRef, updatedTx);
      await batch.commit();

      return { transaction: updatedTx, updatedItem };
    } catch (err) {
      console.error('Error updating transaction in Firestore:', err);
      throw err;
    }
  },

  // Delete Transaction (Inbound / Outbound) from Firestore
  async deleteTransaction(id: string): Promise<{ deletedTx: Transaction; updatedItem?: InventoryItem }> {
    try {
      const txDocRef = doc(db, TRANSACTIONS_COLLECTION, id);
      const txSnap = await getDoc(txDocRef);
      if (!txSnap.exists()) {
        throw new Error('Data transaksi tidak ditemukan di Firebase');
      }

      const txData = txSnap.data() as Transaction;
      const batch = writeBatch(db);

      let updatedItem: InventoryItem | undefined;
      if (txData.itemId) {
        const itemDocRef = doc(db, INVENTORY_COLLECTION, txData.itemId);
        const itemSnap = await getDoc(itemDocRef);
        if (itemSnap.exists()) {
          const item = itemSnap.data() as InventoryItem;
          let newStock = item.quantity;
          if (txData.type === 'IN') {
            newStock = Math.max(0, item.quantity - txData.quantity);
          } else if (txData.type === 'OUT') {
            newStock = item.quantity + txData.quantity;
          }

          updatedItem = {
            ...item,
            quantity: newStock,
            lastUpdated: new Date().toISOString(),
          };

          batch.set(itemDocRef, updatedItem);
        }
      }

      batch.delete(txDocRef);
      await batch.commit();

      return { deletedTx: txData, updatedItem };
    } catch (err) {
      console.error('Error deleting transaction in Firestore:', err);
      throw err;
    }
  },

  // Calculate Warehouse Analytics from Firestore data
  async getAnalytics(): Promise<WarehouseAnalytics> {
    try {
      const [items, transactions] = await Promise.all([this.getInventory(), this.getTransactions()]);

      const totalSkus = items.length;
      const totalStockQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalValuation = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      const alerts = items
        .filter((item) => item.quantity <= item.minStock)
        .map((item) => {
          const deficit = item.minStock - item.quantity;
          const percentageRemaining = item.minStock > 0 ? (item.quantity / item.minStock) * 100 : 0;
          let status: 'OUT_OF_STOCK' | 'CRITICAL_LOW' | 'WARNING' = 'WARNING';
          if (item.quantity === 0) status = 'OUT_OF_STOCK';
          else if (item.quantity <= item.minStock * 0.5) status = 'CRITICAL_LOW';

          return { item, status, deficit, percentageRemaining };
        })
        .sort((a, b) => a.percentageRemaining - b.percentageRemaining);

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      const todayTxs = transactions.filter((tx) => tx.timestamp.startsWith(todayStr));
      const todayInQuantity = todayTxs.filter((tx) => tx.type === 'IN').reduce((sum, tx) => sum + tx.quantity, 0);
      const todayOutQuantity = todayTxs.filter((tx) => tx.type === 'OUT').reduce((sum, tx) => sum + tx.quantity, 0);

      // 7-day daily trend
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().slice(0, 10);
        const dayTxs = transactions.filter((tx) => tx.timestamp.startsWith(dStr));

        const inQty = dayTxs.filter((t) => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
        const outQty = dayTxs.filter((t) => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);

        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const displayDate = `${dayNames[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;

        trends.push({
          date: dStr,
          displayDate,
          inQty,
          outQty,
          inTransactions: dayTxs.filter((t) => t.type === 'IN').length,
          outTransactions: dayTxs.filter((t) => t.type === 'OUT').length,
        });
      }

      // Category breakdown
      const categoryMap = new Map<string, { count: number; totalQty: number; totalValue: number }>();
      items.forEach((item) => {
        const cat = item.category || 'Lainnya';
        const existing = categoryMap.get(cat) || { count: 0, totalQty: 0, totalValue: 0 };
        existing.count += 1;
        existing.totalQty += item.quantity;
        existing.totalValue += item.quantity * item.unitPrice;
        categoryMap.set(cat, existing);
      });

      const categories = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          totalQty: stats.totalQty,
          totalValue: stats.totalValue,
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      // Fast moving items
      const itemOutMap = new Map<string, { outQty: number; inQty: number }>();
      transactions.forEach((tx) => {
        const stats = itemOutMap.get(tx.itemId) || { outQty: 0, inQty: 0 };
        if (tx.type === 'OUT') stats.outQty += tx.quantity;
        if (tx.type === 'IN') stats.inQty += tx.quantity;
        itemOutMap.set(tx.itemId, stats);
      });

      const fastMoving = items
        .map((item) => {
          const stats = itemOutMap.get(item.id) || { outQty: 0, inQty: 0 };
          const turnoverRatio =
            item.quantity + stats.outQty > 0 ? (stats.outQty / (item.quantity + stats.outQty)) * 100 : 0;
          return {
            itemId: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            outQty: stats.outQty,
            inQty: stats.inQty,
            currentStock: item.quantity,
            turnoverRatio: Math.round(turnoverRatio),
          };
        })
        .sort((a, b) => b.outQty - a.outQty)
        .slice(0, 5);

      return {
        totalSkus,
        totalStockQuantity,
        totalValuation,
        lowStockItemsCount: alerts.length,
        outOfStockItemsCount: items.filter((i) => i.quantity === 0).length,
        todayInQuantity,
        todayOutQuantity,
        todayTransactionsCount: todayTxs.length,
        trends,
        categories,
        fastMoving,
        alerts,
      };
    } catch (err) {
      console.error('Error calculating analytics from Firestore:', err);
      throw err;
    }
  },

  // Real-time Firestore Listeners
  subscribeInventory(onUpdate: (items: InventoryItem[]) => void): Unsubscribe {
    const invRef = collection(db, INVENTORY_COLLECTION);
    const q = query(invRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: InventoryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...(docSnap.data() as InventoryItem), id: docSnap.id });
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('Inventory Firestore onSnapshot error:', error);
      }
    );
  },

  subscribeTransactions(onUpdate: (txs: Transaction[]) => void): Unsubscribe {
    const txRef = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(txRef, orderBy('timestamp', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          txs.push({ ...(docSnap.data() as Transaction), id: docSnap.id });
        });
        onUpdate(txs);
      },
      (error) => {
        console.warn('Transactions Firestore onSnapshot error:', error);
      }
    );
  },

  // Reference Catalog Items Firestore Support
  async getReferenceItems(): Promise<ReferenceItem[]> {
    try {
      const refCol = collection(db, REFERENCE_CATALOG_COLLECTION);
      const snapshot = await getDocs(refCol);
      if (snapshot.empty) return [];
      const items: ReferenceItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as ReferenceItem), id: docSnap.id });
      });
      return items;
    } catch (err) {
      console.warn('Error fetching reference catalog from Firestore:', err);
      return [];
    }
  },

  async saveReferenceItems(items: ReferenceItem[]): Promise<void> {
    try {
      // Save top slice or full batch
      const slice = items.slice(0, 450); // Firestore batch limit is 500 operations
      const batch = writeBatch(db);
      for (const item of slice) {
        const docRef = doc(db, REFERENCE_CATALOG_COLLECTION, item.id);
        batch.set(docRef, item);
      }
      await batch.commit();
    } catch (err) {
      console.warn('Error batch saving reference catalog to Firestore:', err);
    }
  },
};
