import { ReferenceItem, GoogleSheetsConfig } from '../types';

export const DEFAULT_SPREADSHEET_ID = '198XO2xrLheSpD87HY3a6eVrdJIsFr9QmU9j76y4NBos';
export const DEFAULT_GID = '1574728611';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit#gid=${DEFAULT_GID}`;

// Default seed data representing data list pedoman from spreadsheet
export const INITIAL_REFERENCE_ITEMS: ReferenceItem[] = [
  {
    id: 'ref-001',
    code: 'REF-ELK-010',
    name: 'MCB Schneider 1-Phase 16A Domae',
    category: 'Elektronik & Kelistrikan',
    unit: 'pcs',
    standardPrice: 48000,
    minStockRecommendation: 15,
    supplier: 'PT Surya Elektrik Mandiri',
    defaultLocation: 'Rak A-03',
    barcode: 'REF-ELK-010',
    description: 'Pemutus arus miniature circuit breaker standar PLN / SNI',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-002',
    code: 'REF-ELK-011',
    name: 'Kontaktor Magnetik Fuji Electric SC-03 220V',
    category: 'Elektronik & Kelistrikan',
    unit: 'pcs',
    standardPrice: 195000,
    minStockRecommendation: 8,
    supplier: 'PT Surya Elektrik Mandiri',
    defaultLocation: 'Rak A-04',
    barcode: 'REF-ELK-011',
    description: 'Magnetic Contactor beban motor industri 3-phase',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-003',
    code: 'REF-ELK-012',
    name: 'Kabel NYM Supreme 3x2.5mm (50 Meter)',
    category: 'Elektronik & Kelistrikan',
    unit: 'roll',
    standardPrice: 620000,
    minStockRecommendation: 10,
    supplier: 'PT Surya Elektrik Mandiri',
    defaultLocation: 'Rak A-01',
    barcode: 'REF-ELK-012',
    description: 'Kabel instalasi indoor kawat tembaga murni isi 3',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-004',
    code: 'REF-KMS-010',
    name: 'Bubble Wrap Putih Premium 125cm x 50m',
    category: 'Bahan Kemasan',
    unit: 'roll',
    standardPrice: 115000,
    minStockRecommendation: 20,
    supplier: 'CV Mitra Pack Prima',
    defaultLocation: 'Zona Pallet B-03',
    barcode: 'REF-KMS-010',
    description: 'Plastik gelembung peredam benturan packing logistik',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-005',
    code: 'REF-KMS-011',
    name: 'Lakban Bening Daimaru 48mm x 90 Yard',
    category: 'Bahan Kemasan',
    unit: 'dus',
    standardPrice: 385000,
    minStockRecommendation: 12,
    supplier: 'CV Mitra Pack Prima',
    defaultLocation: 'Zona Pallet B-04',
    barcode: 'REF-KMS-011',
    description: 'Lakban OPP super lengket (isi 72 roll/dus)',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-006',
    code: 'REF-KMS-012',
    name: 'Karung Plastik Anyaman 50kg (56x90 cm)',
    category: 'Bahan Kemasan',
    unit: 'lembar',
    standardPrice: 2400,
    minStockRecommendation: 500,
    supplier: 'CV Mitra Pack Prima',
    defaultLocation: 'Zona Pallet B-05',
    barcode: 'REF-KMS-012',
    description: 'Karung beras / pupuk / biji plastik tahan tarik',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-007',
    code: 'REF-BB-010',
    name: 'Resin Epoksi Transparan Grade A (Pail 20kg)',
    category: 'Bahan Baku',
    unit: 'pail',
    standardPrice: 1450000,
    minStockRecommendation: 5,
    supplier: 'PT Chandra Polimer Global',
    defaultLocation: 'Gudang Kimia K-01',
    barcode: 'REF-BB-010',
    description: 'Bahan pelapis casting lantai dan moulding komposit',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-008',
    code: 'REF-BB-011',
    name: 'Masterbatch Pewarna Hitam Carbon (25kg)',
    category: 'Bahan Baku',
    unit: 'sak',
    standardPrice: 480000,
    minStockRecommendation: 15,
    supplier: 'PT Chandra Polimer Global',
    defaultLocation: 'Gudang Kimia K-02',
    barcode: 'REF-BB-011',
    description: 'Pigmen pelet warna hitam untuk pencampuran extruder PP/PE',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 9,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-009',
    code: 'REF-SKC-010',
    name: 'Pneumatic Cylinder Festo DNC-40-100-PPV-A',
    category: 'Suku Cadang & Mekanik',
    unit: 'pcs',
    standardPrice: 1250000,
    minStockRecommendation: 4,
    supplier: 'PT Bearing Teknik Sejahtera',
    defaultLocation: 'Rak C-01',
    barcode: 'REF-SKC-010',
    description: 'Silinder angin otomatisasi mesin packing kecepatan tinggi',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-010',
    code: 'REF-SKC-011',
    name: 'Solenoid Valve Airtac 4V210-08 24V DC',
    category: 'Suku Cadang & Mekanik',
    unit: 'pcs',
    standardPrice: 165000,
    minStockRecommendation: 10,
    supplier: 'PT Bearing Teknik Sejahtera',
    defaultLocation: 'Rak C-02',
    barcode: 'REF-SKC-011',
    description: 'Katup selenoid kontrol udara bertekanan 5/2 way port 1/4 inch',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 11,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-011',
    code: 'REF-SFT-010',
    name: 'Helm Keselamatan Kerja Proyek V-Gard MSA Putih',
    category: 'Perlengkapan Kerja & Safety',
    unit: 'pcs',
    standardPrice: 75000,
    minStockRecommendation: 30,
    supplier: 'PT Duta Safety Raya',
    defaultLocation: 'Rak D-01',
    barcode: 'REF-SFT-010',
    description: 'Helm safety standar ANSI Z89.1 tahan benturan',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-012',
    code: 'REF-SFT-011',
    name: 'Sarung Tangan Karet Nitrile Heavy Duty (Isi 100)',
    category: 'Perlengkapan Kerja & Safety',
    unit: 'box',
    standardPrice: 85000,
    minStockRecommendation: 25,
    supplier: 'PT Duta Safety Raya',
    defaultLocation: 'Rak D-02',
    barcode: 'REF-SFT-011',
    description: 'Sarung tangan tahan bahan kimia dan oli mesin',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 13,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-013',
    code: 'REF-FNB-010',
    name: 'Asam Sitrat / Citric Acid Anhydrous USP (25kg)',
    category: 'Makanan & Minuman',
    unit: 'sak',
    standardPrice: 540000,
    minStockRecommendation: 10,
    supplier: 'PT Sumber Pangan Nusantara',
    defaultLocation: 'Gudang Bahan Pangan G-01',
    barcode: 'REF-FNB-010',
    description: 'Pengatur keasaman food grade untuk minuman olahan',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 14,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-014',
    code: 'REF-ATK-010',
    name: 'Kertas Thermal Barcode Label 100x150mm (500 lbr)',
    category: 'Alat Tulis & Kantor',
    unit: 'roll',
    standardPrice: 42000,
    minStockRecommendation: 40,
    supplier: 'CV Jaya Abadi Stationery',
    defaultLocation: 'Rak E-01',
    barcode: 'REF-ATK-010',
    description: 'Stiker label resi / barcode direct thermal anti luntur',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ref-015',
    code: 'REF-MED-010',
    name: 'Alkohol 70% Medis Teknis (Jerigen 5 Liter)',
    category: 'Farmasi & Medis',
    unit: 'jerigen',
    standardPrice: 120000,
    minStockRecommendation: 15,
    supplier: 'PT Medika Farma Bersaudara',
    defaultLocation: 'Gudang Medis M-01',
    barcode: 'REF-MED-010',
    description: 'Cairan antiseptik dan sanitasi sterilisasi alat kerja',
    source: 'Google Spreadsheet (Gid: 1574728611)',
    sheetRow: 16,
    createdAt: new Date().toISOString(),
  }
];

export function extractSpreadsheetInfo(inputUrlOrId: string): { id: string; gid: string } {
  let id = inputUrlOrId.trim();
  let gid = '0';

  if (inputUrlOrId.includes('docs.google.com/spreadsheets/d/')) {
    const matchId = inputUrlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (matchId && matchId[1]) {
      id = matchId[1];
    }
    const matchGid = inputUrlOrId.match(/gid=([0-9]+)/);
    if (matchGid && matchGid[1]) {
      gid = matchGid[1];
    }
  }

  return { id, gid };
}

export interface GoogleSpreadsheetMetadata {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      gridProperties?: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
}

/**
 * Standard robust CSV parser for Google Sheets export format
 */
export function parseCSV(csvText: string): string[][] {
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
        i++; // skip escaped quote
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

  return rows;
}

/**
 * Fetch public Google Sheets directly via CSV export endpoint
 */
export async function fetchPublicSpreadsheetCSV(
  spreadsheetId: string,
  gid: string = '0'
): Promise<{ rows: string[][]; sheetTitle: string }> {
  const endpoints = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ];

  let lastError: any = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        // Ensure it is not an HTML login redirect page
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && !text.includes('accounts.google.com')) {
          const parsed = parseCSV(text);
          if (parsed && parsed.length > 0) {
            return {
              rows: parsed,
              sheetTitle: `Lembar (Gid: ${gid})`,
            };
          }
        }
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(
    'Spreadsheet membutuhkan izin akses. Silakan hubungkan Akun Google untuk mengakses file privat ini.'
  );
}

/**
 * Fetch spreadsheet metadata using Google Sheets API v4
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<GoogleSpreadsheetMetadata> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    let parsedMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      parsedMsg = errJson.error?.message || errText;
    } catch {}
    throw new Error(`Google Sheets API Error (${res.status}): ${parsedMsg}`);
  }

  return await res.json();
}

/**
 * Fetch rows from spreadsheet range
 */
export async function fetchSpreadsheetValues(
  spreadsheetId: string,
  range: string,
  accessToken: string
): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    let parsedMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      parsedMsg = errJson.error?.message || errText;
    } catch {}
    throw new Error(`Google Sheets API Error (${res.status}): ${parsedMsg}`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Parses raw 2D array of rows from Google Sheets into typed ReferenceItem array
 */
export function parseSpreadsheetRowsToReferenceItems(
  rows: (string | number | undefined)[][],
  sourceName: string = 'Google Spreadsheet'
): ReferenceItem[] {
  if (!rows || rows.length === 0) return [];

  // Identify header row
  const headerRow = rows[0].map((cell) => String(cell || '').trim().toLowerCase());
  
  // Find indices for standard columns
  let codeIdx = headerRow.findIndex(
    (h) =>
      h === 'id' ||
      h.startsWith('id ') ||
      h.includes('item code') ||
      h.includes('item_code') ||
      h.includes('sku') ||
      h.includes('kode') ||
      h.includes('code') ||
      h.includes('id barang') ||
      h.includes('part number') ||
      h.includes('p/n')
  );
  let nameIdx = headerRow.findIndex(
    (h) =>
      h === 'name' ||
      h.includes('item name') ||
      h.includes('nama barang') ||
      h.includes('nama') ||
      h.includes('deskripsi') ||
      h.includes('description') ||
      h.includes('barang') ||
      h.includes('produk')
  );
  let catIdx = headerRow.findIndex(
    (h) =>
      h.includes('item group') ||
      h.includes('group') ||
      h.includes('kategori') ||
      h.includes('category') ||
      h.includes('jenis') ||
      h.includes('kelompok')
  );
  let unitIdx = headerRow.findIndex(
    (h) =>
      h.includes('unit of measure') ||
      h.includes('uom') ||
      h.includes('satuan') ||
      h.includes('unit') ||
      h.includes('measure')
  );
  let priceIdx = headerRow.findIndex(
    (h) =>
      h.includes('harga') ||
      h.includes('price') ||
      h.includes('biaya') ||
      h.includes('cost') ||
      h.includes('hpp') ||
      h.includes('rate')
  );
  let supplierIdx = headerRow.findIndex(
    (h) =>
      h.includes('supplier') ||
      h.includes('pemasok') ||
      h.includes('vendor') ||
      h.includes('distributor')
  );
  let locationIdx = headerRow.findIndex(
    (h) =>
      h.includes('lokasi') ||
      h.includes('location') ||
      h.includes('rak') ||
      h.includes('rack') ||
      h.includes('gudang') ||
      h.includes('bin')
  );
  let barcodeIdx = headerRow.findIndex(
    (h) =>
      h.includes('barcode') ||
      h.includes('ean') ||
      h.includes('upc') ||
      h.includes('qr')
  );
  let descIdx = headerRow.findIndex(
    (h) =>
      h.includes('spesifikasi') ||
      h.includes('notes') ||
      h.includes('catatan') ||
      h.includes('keterangan')
  );
  let minStockIdx = headerRow.findIndex(
    (h) =>
      h.includes('min stock') ||
      h.includes('safety stock') ||
      h.includes('minimum') ||
      h.includes('min')
  );

  // Fallbacks if no exact header matched
  if (codeIdx === -1) codeIdx = 0;
  if (nameIdx === -1) nameIdx = 1 < headerRow.length ? 1 : 0;
  if (catIdx === -1 && 3 < headerRow.length) catIdx = 3;
  else if (catIdx === -1 && 2 < headerRow.length) catIdx = 2;
  if (unitIdx === -1 && 2 < headerRow.length) unitIdx = 2;
  else if (unitIdx === -1 && 3 < headerRow.length) unitIdx = 3;

  const results: ReferenceItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawName = String(nameIdx >= 0 ? row[nameIdx] || '' : '').trim();
    const rawCode = String(codeIdx >= 0 ? row[codeIdx] || '' : '').trim();

    // Skip empty row
    if (!rawName && !rawCode) continue;

    const rawCat = catIdx >= 0 ? String(row[catIdx] || '').trim() : 'Umum';
    const rawUnit = unitIdx >= 0 ? String(row[unitIdx] || '').trim() : 'pcs';
    
    // Parse numeric price
    let rawPrice = 0;
    if (priceIdx >= 0 && row[priceIdx]) {
      const cleanPriceStr = String(row[priceIdx]).replace(/[^0-9.-]+/g, '');
      rawPrice = parseFloat(cleanPriceStr) || 0;
    }

    let minStockRec = 10;
    if (minStockIdx >= 0 && row[minStockIdx]) {
      const cleanMin = String(row[minStockIdx]).replace(/[^0-9.-]+/g, '');
      minStockRec = parseFloat(cleanMin) || 10;
    }

    const rawSupplier = supplierIdx >= 0 ? String(row[supplierIdx] || '').trim() : undefined;
    const rawLocation = locationIdx >= 0 ? String(row[locationIdx] || '').trim() : 'Gudang Utama';
    const rawBarcode = barcodeIdx >= 0 ? String(row[barcodeIdx] || '').trim() : undefined;
    const rawDesc = descIdx >= 0 ? String(row[descIdx] || '').trim() : undefined;

    const generatedCode = rawCode || `REF-${(r).toString().padStart(4, '0')}`;
    const generatedBarcode = rawBarcode || generatedCode;

    results.push({
      id: `ref-${Date.now().toString(36)}-${r}`,
      code: generatedCode,
      name: rawName || `Barang Pedoman #${r}`,
      category: rawCat || 'Umum',
      unit: rawUnit || 'pcs',
      standardPrice: rawPrice,
      minStockRecommendation: minStockRec,
      supplier: rawSupplier,
      defaultLocation: rawLocation,
      barcode: generatedBarcode,
      description: rawDesc,
      source: sourceName,
      sheetRow: r + 1,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
