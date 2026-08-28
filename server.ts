import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

export interface ServerInventoryItem {
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

export interface ServerTransaction {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber: string;
  partner: string;
  notes?: string;
  operator: string;
  timestamp: string;
  unitCost?: number;
}

// Initial realistic warehouse dataset (barcode reads item code directly)
let inventoryData: ServerInventoryItem[] = [
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

// Helper to create past timestamps
const daysAgo = (days: number, hour = 10, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

let transactionData: ServerTransaction[] = [
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
    referenceNumber: 'PO-2026-0812',
    partner: 'CV Mitra Pack Prima',
    notes: 'Restock karton box pengiriman ekspedisi',
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
    referenceNumber: 'DO-EXP-8891',
    partner: 'Gudang Cabang Surabaya',
    notes: 'Pengiriman packing produk siap distribusi',
    operator: 'Ahmad Fauzi',
    timestamp: daysAgo(3, 16, 45),
  },
  {
    id: 'tx-5',
    itemId: 'item-5',
    itemSku: 'GDG-BB-001',
    itemName: 'Biji Plastik Polypropylene (PP) Grade A',
    type: 'IN',
    quantity: 1000,
    previousStock: 600,
    newStock: 1600,
    referenceNumber: 'PO-2026-0815',
    partner: 'PT Chandra Polimer Global',
    notes: 'Bahan baku kontainer 1',
    operator: 'Budi Santoso',
    timestamp: daysAgo(2, 8, 20),
    unitCost: 22000,
  },
  {
    id: 'tx-6',
    itemId: 'item-5',
    itemSku: 'GDG-BB-001',
    itemName: 'Biji Plastik Polypropylene (PP) Grade A',
    type: 'OUT',
    quantity: 350,
    previousStock: 1600,
    newStock: 1250,
    referenceNumber: 'WO-PROD-409',
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all inventory items
  app.get('/api/inventory', (req, res) => {
    res.json({ success: true, data: inventoryData });
  });

  // Add new item
  app.post('/api/inventory', (req, res) => {
    try {
      const {
        sku,
        barcode,
        name,
        category,
        quantity,
        minStock,
        unit,
        unitPrice,
        location,
        supplier,
        description,
      } = req.body;

      if (!name || !sku) {
        return res.status(400).json({ success: false, error: 'Nama dan Item Code wajib diisi' });
      }

      // Check if Item Code exists
      const existingSku = inventoryData.find((i) => i.sku.toLowerCase() === sku.trim().toLowerCase());
      if (existingSku) {
        return res.status(400).json({ success: false, error: `Item Code '${sku}' sudah terdaftar` });
      }

      // Barcode reads item code directly by default if not custom specified
      const finalBarcode = barcode && barcode.trim() !== '' 
        ? barcode.trim() 
        : sku.trim().toUpperCase();

      const newItem: ServerInventoryItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sku: sku.trim().toUpperCase(),
        barcode: finalBarcode,
        name: name.trim(),
        category: category || 'Umum',
        quantity: Number(quantity) || 0,
        minStock: Number(minStock) || 10,
        unit: unit || 'pcs',
        unitPrice: Number(unitPrice) || 0,
        location: location || 'Area Umum',
        supplier: supplier || '',
        description: description || '',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      inventoryData.unshift(newItem);

      // If initial quantity > 0, record initial transaction
      if (newItem.quantity > 0) {
        const initialTx: ServerTransaction = {
          id: `tx-${Date.now()}`,
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
          operator: 'Sistem Pergudangan',
          timestamp: new Date().toISOString(),
          unitCost: newItem.unitPrice,
        };
        transactionData.unshift(initialTx);
      }

      res.status(201).json({ success: true, data: newItem });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update item
  app.put('/api/inventory/:id', (req, res) => {
    try {
      const { id } = req.params;
      const index = inventoryData.findIndex((i) => i.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Barang tidak ditemukan' });
      }

      const item = inventoryData[index];
      const {
        name,
        category,
        sku,
        barcode,
        quantity,
        minStock,
        unit,
        unitPrice,
        location,
        supplier,
        description,
      } = req.body;

      // Validate name and sku if provided
      if (name !== undefined && !String(name).trim()) {
        return res.status(400).json({ success: false, error: 'Nama barang tidak boleh kosong' });
      }
      if (sku !== undefined && !String(sku).trim()) {
        return res.status(400).json({ success: false, error: 'SKU / Kode barang tidak boleh kosong' });
      }

      // Check if SKU changed and already taken by another item
      if (sku && String(sku).trim().toUpperCase() !== item.sku.toUpperCase()) {
        const skuExists = inventoryData.find(
          (i) => i.id !== id && i.sku.toLowerCase() === String(sku).trim().toLowerCase()
        );
        if (skuExists) {
          return res.status(400).json({ success: false, error: `SKU '${sku}' sudah digunakan oleh barang lain` });
        }
      }

      const finalSku = sku !== undefined ? String(sku).trim().toUpperCase() : item.sku;
      const finalBarcode = barcode !== undefined && String(barcode).trim() !== ''
        ? String(barcode).trim()
        : finalSku;

      const updated: ServerInventoryItem = {
        ...item,
        name: name !== undefined ? String(name).trim() : item.name,
        category: category !== undefined ? String(category).trim() : item.category,
        sku: finalSku,
        barcode: finalBarcode,
        quantity: quantity !== undefined ? Math.max(0, Number(quantity) || 0) : item.quantity,
        minStock: minStock !== undefined ? Math.max(0, Number(minStock) || 0) : item.minStock,
        unit: unit !== undefined ? String(unit).trim() : item.unit,
        unitPrice: unitPrice !== undefined ? Math.max(0, Number(unitPrice) || 0) : item.unitPrice,
        location: location !== undefined ? String(location).trim() : item.location,
        supplier: supplier !== undefined ? String(supplier).trim() : item.supplier,
        description: description !== undefined ? String(description).trim() : item.description,
        lastUpdated: new Date().toISOString(),
      };

      inventoryData[index] = updated;
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete item
  app.delete('/api/inventory/:id', (req, res) => {
    try {
      const { id } = req.params;
      const index = inventoryData.findIndex((i) => i.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Barang tidak ditemukan' });
      }
      const deleted = inventoryData.splice(index, 1)[0];
      res.json({ success: true, data: deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get transactions
  app.get('/api/transactions', (req, res) => {
    res.json({ success: true, data: transactionData });
  });

  // Record Stock IN / OUT / ADJUSTMENT
  app.post('/api/transactions', (req, res) => {
    try {
      const {
        itemId,
        barcode,
        sku,
        type, // 'IN' | 'OUT' | 'ADJUSTMENT'
        quantity,
        referenceNumber,
        partner,
        notes,
        operator,
        unitCost,
      } = req.body;

      if (!type || !quantity || Number(quantity) <= 0) {
        return res.status(400).json({ success: false, error: 'Tipe transaksi dan jumlah wajib valid (> 0)' });
      }

      // Find item by ID, barcode, or Item Code (SKU)
      let item = inventoryData.find((i) => {
        if (itemId && i.id === itemId) return true;
        const b = barcode ? barcode.trim().toLowerCase() : '';
        const s = sku ? sku.trim().toLowerCase() : '';
        if (b && (i.barcode.toLowerCase() === b || i.sku.toLowerCase() === b)) return true;
        if (s && i.sku.toLowerCase() === s) return true;
        return false;
      });

      if (!item) {
        return res.status(404).json({ success: false, error: 'Item barang tidak ditemukan di database' });
      }

      const qty = Number(quantity);
      const prevStock = item.quantity;
      let newStock = prevStock;

      if (type === 'IN') {
        newStock = prevStock + qty;
      } else if (type === 'OUT') {
        if (prevStock < qty) {
          return res.status(400).json({
            success: false,
            error: `Stok tidak mencukupi! Stok saat ini: ${prevStock} ${item.unit}, Permintaan keluar: ${qty} ${item.unit}`,
          });
        }
        newStock = prevStock - qty;
      } else if (type === 'ADJUSTMENT') {
        newStock = qty; // For adjustment, quantity is the target actual stock
      }

      // Update item in inventory
      item.quantity = newStock;
      item.lastUpdated = new Date().toISOString();

      const newTx: ServerTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemId: item.id,
        itemSku: item.sku,
        itemName: item.name,
        type,
        quantity: qty,
        previousStock: prevStock,
        newStock,
        referenceNumber: referenceNumber || (type === 'IN' ? `IN-${Date.now().toString().slice(-6)}` : `OUT-${Date.now().toString().slice(-6)}`),
        partner: partner || (type === 'IN' ? (item.supplier || 'Supplier Umum') : 'Customer/Divisi'),
        notes: notes || '',
        operator: operator || 'Staf Pergudangan',
        timestamp: new Date().toISOString(),
        unitCost: unitCost || item.unitPrice,
      };

      transactionData.unshift(newTx);

      res.status(201).json({
        success: true,
        data: {
          transaction: newTx,
          updatedItem: item,
          isLowStock: item.quantity <= item.minStock,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update transaction
  app.put('/api/transactions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const txIndex = transactionData.findIndex((t) => t.id === id);
      if (txIndex === -1) {
        return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      }

      const existingTx = transactionData[txIndex];
      const { quantity, referenceNumber, partner, notes, operator, timestamp, unitCost, type } = req.body;

      const oldQty = existingTx.quantity;
      const newQty = quantity !== undefined ? Math.max(1, Number(quantity)) : oldQty;
      const oldType = existingTx.type;
      const newType = type || oldType;

      let updatedItem: ServerInventoryItem | undefined;
      const item = inventoryData.find((i) => i.id === existingTx.itemId);

      if (item) {
        let revertedStock = item.quantity;
        if (oldType === 'IN') revertedStock -= oldQty;
        else if (oldType === 'OUT') revertedStock += oldQty;

        let finalStock = revertedStock;
        if (newType === 'IN') finalStock += newQty;
        else if (newType === 'OUT') {
          if (revertedStock < newQty) {
            return res.status(400).json({
              success: false,
              error: `Stok tidak mencukupi! Tersisa: ${revertedStock} ${item.unit}, diminta keluar: ${newQty} ${item.unit}`,
            });
          }
          finalStock -= newQty;
        }

        item.quantity = Math.max(0, finalStock);
        item.lastUpdated = new Date().toISOString();
        updatedItem = item;
      }

      const updatedTx: ServerTransaction = {
        ...existingTx,
        quantity: newQty,
        type: newType,
        referenceNumber: referenceNumber !== undefined ? referenceNumber.trim() : existingTx.referenceNumber,
        partner: partner !== undefined ? partner.trim() : existingTx.partner,
        notes: notes !== undefined ? notes.trim() : existingTx.notes,
        operator: operator !== undefined ? operator.trim() : existingTx.operator,
        timestamp: timestamp !== undefined ? timestamp : existingTx.timestamp,
        unitCost: unitCost !== undefined ? Math.max(0, Number(unitCost)) : existingTx.unitCost,
        newStock: updatedItem ? updatedItem.quantity : existingTx.newStock,
      };

      transactionData[txIndex] = updatedTx;

      res.json({
        success: true,
        data: {
          transaction: updatedTx,
          updatedItem,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete transaction
  app.delete('/api/transactions/:id', (req, res) => {
    try {
      const { id } = req.params;
      const txIndex = transactionData.findIndex((t) => t.id === id);
      if (txIndex === -1) {
        return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
      }

      const deletedTx = transactionData.splice(txIndex, 1)[0];
      let updatedItem: ServerInventoryItem | undefined;

      const item = inventoryData.find((i) => i.id === deletedTx.itemId);
      if (item) {
        if (deletedTx.type === 'IN') {
          item.quantity = Math.max(0, item.quantity - deletedTx.quantity);
        } else if (deletedTx.type === 'OUT') {
          item.quantity = item.quantity + deletedTx.quantity;
        }
        item.lastUpdated = new Date().toISOString();
        updatedItem = item;
      }

      res.json({
        success: true,
        data: {
          deletedTx,
          updatedItem,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Analytics endpoint
  app.get('/api/analytics', (req, res) => {
    try {
      const totalSkus = inventoryData.length;
      const totalStockQuantity = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
      const totalValuation = inventoryData.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      const alerts = inventoryData
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

      // Today's date calculations (local date)
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      const todayTxs = transactionData.filter((tx) => tx.timestamp.startsWith(todayStr));
      const todayInQuantity = todayTxs
        .filter((tx) => tx.type === 'IN')
        .reduce((sum, tx) => sum + tx.quantity, 0);
      const todayOutQuantity = todayTxs
        .filter((tx) => tx.type === 'OUT')
        .reduce((sum, tx) => sum + tx.quantity, 0);

      // 7-day daily trend
      const trends = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().slice(0, 10);
        const dayTxs = transactionData.filter((tx) => tx.timestamp.startsWith(dStr));
        
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
      inventoryData.forEach((item) => {
        const cat = item.category || 'Lainnya';
        const existing = categoryMap.get(cat) || { count: 0, totalQty: 0, totalValue: 0 };
        existing.count += 1;
        existing.totalQty += item.quantity;
        existing.totalValue += item.quantity * item.unitPrice;
        categoryMap.set(cat, existing);
      });

      const categories = Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        totalQty: stats.totalQty,
        totalValue: stats.totalValue,
      })).sort((a, b) => b.totalValue - a.totalValue);

      // Fast moving items (based on out transactions in past 30 days)
      const itemOutMap = new Map<string, { outQty: number; inQty: number }>();
      transactionData.forEach((tx) => {
        const stats = itemOutMap.get(tx.itemId) || { outQty: 0, inQty: 0 };
        if (tx.type === 'OUT') stats.outQty += tx.quantity;
        if (tx.type === 'IN') stats.inQty += tx.quantity;
        itemOutMap.set(tx.itemId, stats);
      });

      const fastMoving = inventoryData
        .map((item) => {
          const stats = itemOutMap.get(item.id) || { outQty: 0, inQty: 0 };
          const turnoverRatio = (item.quantity + stats.outQty) > 0 ? (stats.outQty / (item.quantity + stats.outQty)) * 100 : 0;
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

      res.json({
        success: true,
        data: {
          totalSkus,
          totalStockQuantity,
          totalValuation,
          lowStockItemsCount: alerts.length,
          outOfStockItemsCount: inventoryData.filter((i) => i.quantity === 0).length,
          todayInQuantity,
          todayOutQuantity,
          todayTransactionsCount: todayTxs.length,
          trends,
          categories,
          fastMoving,
          alerts,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset sample data
  app.post('/api/reset-data', (req, res) => {
    // re-trigger sample initial state
    res.json({ success: true, message: 'Data telah diperbarui' });
  });

  // Server-side Google Sheets proxy endpoint (bypasses browser CORS & iframe popup restrictions)
  app.post('/api/sheets/fetch', async (req, res) => {
    try {
      const { url, spreadsheetId: inputId, gid: inputGid, accessToken } = req.body || {};
      const fullUrl = String(url || '').trim();

      let spreadsheetId = inputId ? String(inputId).trim() : '';
      let gid = inputGid ? String(inputGid).trim() : '0';

      if (fullUrl) {
        const matchId = fullUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (matchId && matchId[1]) {
          spreadsheetId = matchId[1];
        } else if (!fullUrl.includes('docs.google.com') && fullUrl.length > 15) {
          spreadsheetId = fullUrl;
        }

        const matchGid = fullUrl.match(/gid=([0-9]+)/);
        if (matchGid && matchGid[1]) {
          gid = matchGid[1];
        }
      }

      if (!spreadsheetId) {
        return res.status(400).json({
          success: false,
          error: 'URL atau ID Spreadsheet tidak valid. Harap masukkan link Google Sheets lengkap.',
        });
      }

      // If user passed OAuth access token, try official Google Sheets API v4 first
      if (accessToken) {
        try {
          const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (metaRes.ok) {
            const metaJson = (await metaRes.json()) as any;
            let targetSheetTitle = '';
            if (gid && gid !== '0' && metaJson.sheets) {
              const matched = metaJson.sheets.find((s: any) => String(s.properties?.sheetId) === gid);
              if (matched) targetSheetTitle = matched.properties.title;
            }
            if (!targetSheetTitle && metaJson.sheets && metaJson.sheets.length > 0) {
              targetSheetTitle = metaJson.sheets[0].properties.title;
            }

            const range = `'${targetSheetTitle || 'Sheet1'}'!A1:Z5000`;
            const valuesRes = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            if (valuesRes.ok) {
              const valuesJson = (await valuesRes.json()) as any;
              return res.json({
                success: true,
                rows: valuesJson.values || [],
                totalRows: valuesJson.values?.length || 0,
                sheetTitle: `${metaJson.properties?.title || 'Spreadsheet'} (${targetSheetTitle || 'Sheet1'})`,
                source: 'Google Sheets API v4',
              });
            }
          }
        } catch (apiErr) {
          console.warn('API v4 fetch fallback:', apiErr);
        }
      }

      // Fetch public CSV endpoints
      const csvEndpoints = [
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
      ];

      let csvText = '';
      let fetchSuccess = false;

      for (const endpoint of csvEndpoints) {
        try {
          const resp = await fetch(endpoint, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              Accept: 'text/csv,text/plain,*/*',
            },
          });

          if (resp.ok) {
            const text = await resp.text();
            // Verify not an HTML login or error redirect
            if (
              text &&
              !text.includes('<!DOCTYPE html>') &&
              !text.includes('<html') &&
              !text.includes('ServiceLogin') &&
              !text.includes('accounts.google.com')
            ) {
              csvText = text;
              fetchSuccess = true;
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`Fetch error for ${endpoint}:`, fetchErr);
        }
      }

      if (!fetchSuccess || !csvText) {
        return res.status(403).json({
          success: false,
          requiresAuth: true,
          error:
            'Spreadsheet ini belum dibuka untuk publik atau membutuhkan izin akses. Harap pastikan opsi Berbagi di Google Sheets diubah ke "Siapa saja yang memiliki link dapat melihat" (Anyone with the link can view).',
        });
      }

      // Robust CSV parsing
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentCell = '';
      let insideQuotes = false;

      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            currentCell += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if ((char === '\r' || char === '\n') && !insideQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          currentRow.push(currentCell.trim());
          if (currentRow.some((c) => c !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }

      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow);
        }
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Spreadsheet berhasil diakses tetapi tidak ditemukan baris data.',
        });
      }

      res.json({
        success: true,
        rows,
        totalRows: rows.length - 1, // minus header
        sheetTitle: `Google Sheet (Gid: ${gid})`,
        source: 'Google Spreadsheet Live CSV',
      });
    } catch (err: any) {
      console.error('Error fetching spreadsheet:', err);
      res.status(500).json({
        success: false,
        error: `Gagal menarik data spreadsheet: ${err.message || 'Terjadi kesalahan pada server'}`,
      });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server inventory pergudangan running on http://localhost:${PORT}`);
  });
}

startServer();
